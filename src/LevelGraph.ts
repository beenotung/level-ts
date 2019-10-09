// tslint:disable: jsdoc-format
import { isAbsolute, resolve } from 'path';

type TripleInp = string | number;

interface ITripleBase {
  subject: TripleInp;
  predicate: TripleInp;
  object: TripleInp;
}

interface ITriple<Predicates extends TripleInp> extends ITripleBase {
  predicate: Predicates;
  [key: string]: any;
}

interface IGetTriple<Predicates extends TripleInp> extends Partial<ITriple<Predicates>> {
  limit?: number;
  offset?: number;
  reverse?: boolean;
}

interface IChainObject<Predicates extends TripleInp> {
  put(triple: ITriple<Predicates>): IChainObject<Predicates>;
  del(triple: ITriple<Predicates>): IChainObject<Predicates>;
  get(triple: IGetTriple<Predicates>): IChainObject<Predicates>;
  finish(): Promise<Array<IGetTriple<Predicates>>>;
}

// tslint:disable: jsdoc-format
// tslint:disable-next-line: no-var-requires one-variable-per-declaration
const level = require('level'), levelgraph = require('levelgraph');

const instances: {
  [fullpath: string]: any;
} = {};

export class LevelGraph<StaticPredicates extends TripleInp = string | number> {
  public static rootFolder = process.env.DATABASES || process.env.DATABASES_ROOT || process.cwd();
  public static setRoot(path: string) {
    this.rootFolder = path;
  }

  private DB: any;
  constructor(path: string) {
    const fullpath = isAbsolute(path) ? path : resolve(LevelGraph.rootFolder, path);
    this.DB = instances[fullpath]
      ? instances[fullpath]
      : instances[fullpath] = levelgraph(level(fullpath));
  }

  public get chain(): IChainObject<StaticPredicates> {
    // tslint:disable-next-line: no-this-assignment
    const instance = this;
    const promises: Array<Promise<any>> = [];
    return {
      put(triple: ITriple<StaticPredicates>) { promises.push(instance.put(triple)); return this; },
      del(triple: ITriple<StaticPredicates>) { promises.push(instance.del(triple)); return this; },
      get(triple: IGetTriple<StaticPredicates>) { promises.push(instance.get(triple)); return this; },
      async finish() { return (await Promise.all(promises)).filter((v) => !!v); },
    };
  }

  public put(subject: string | number, predicate: StaticPredicates, object: string): Promise<void>;
  public put(triple: ITriple<StaticPredicates> | Array<ITriple<StaticPredicates>>): Promise<void>;
  public put(triple: string | number | ITriple<StaticPredicates> | Array<ITriple<StaticPredicates>>, predicate?: StaticPredicates, object?: string): Promise<void> {
    return new Promise((res, rej) => {
      if (!!predicate && !!object && (typeof triple === 'string' || typeof triple === 'number')) triple = { subject: triple, predicate, object };
      if (Array.isArray(triple)) Promise.all(triple.map((t) => this.put(t))).catch((e) => rej(e)).then(() => res());
      else this.DB.put(triple, (err: any) => err ? rej(err) : res());
    });
  }

  public del(triple: ITriple<StaticPredicates> | Array<ITriple<StaticPredicates>>): Promise<void> {
    return new Promise((res, rej) => {
      if (Array.isArray(triple)) Promise.all(triple.map((t) => this.del(t))).catch((e) => rej(e)).then(() => res());
      else this.DB.del(triple, (err: any) => err ? rej(err) : res());
    });
  }

  public get(triple: IGetTriple<StaticPredicates>): Promise<Array<ITriple<StaticPredicates>>> {
    return new Promise((res, rej) => {
      this.DB.get(triple, (err: any, list: any[]) => err ? rej(err) : res(list));
    });
  }

  public async find(subject: string | null, predicate: StaticPredicates | null, object?: string | null) {
    let returnkey: keyof ITripleBase;
    if (Array(arguments).filter((v) => v === null).length > 1) throw new Error('Find( ) cannot have more than 1 null argument');
    else if (!subject) returnkey = 'subject';
    else if (!predicate) returnkey = 'predicate';
    else if (!object) returnkey = 'object';
    else throw new Error('No nulled argument given. No return specified');
    const [obj] = await this.get({
      subject: subject || undefined,
      predicate: predicate || undefined,
      object: object || undefined,
    });
    if (!obj) return null;
    return obj[returnkey];
  }

  public v(name: string): GraphVar { return this.DB.v(name); }

  public walk(options: IWalkOptions, ...path: Array<IWalkPath<StaticPredicates>>): Promise<Array<{ [key: string]: any }>> {
    return new Promise((res, rej) => {
      if (!options.materialized && !options.filter && !options.limit && !options.offset) {
        path.unshift(options as IWalkPath<StaticPredicates>);
        options = {};
      }
      this.DB.search(path, options, (error: any, solutions: any) => error ? rej(error) : res(solutions));
    });
  }
}

type GraphVar = any;
interface IWalkOptions {
  /**Maximum of results */
  limit?: number;
  /**First to skip (Pagination)*/
  offset?: number;
  materialized?: {
    [key: string]: string | GraphVar;
  };
  filter?: (solution: any, callback: (error: string | null, solution?: any) => void) => void;
}
interface IWalkPath<Predicates extends TripleInp> {
  subject: string | GraphVar;
  predicate: string | GraphVar;
  object: string | GraphVar;
  filter?: (this: any, triple: ITriple<Predicates>) => boolean;
}
