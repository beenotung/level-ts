import { isAbsolute, resolve } from 'path';

type InputTypeable = string | number;

interface ITripleBase {
  subject: InputTypeable;
  predicate: InputTypeable;
  object: InputTypeable;
}

interface ITriple extends ITripleBase {
  [key: string]: any;
}

interface IGetTriple extends Partial<ITriple> {
  limit?: number;
  offset?: number;
  reverse?: boolean;
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
interface IWalkPath {
  subject: string | GraphVar;
  predicate: string | GraphVar;
  object: string | GraphVar;
  filter?: (this: any, triple: ITriple) => boolean;
}

interface IChainObject {
  put(triple: ITriple): IChainObject;
  del(triple: ITriple): IChainObject;
  get(triple: IGetTriple): IChainObject;
  finish(): Promise<IGetTriple[]>;
}

// tslint:disable: jsdoc-format
// tslint:disable-next-line: no-var-requires one-variable-per-declaration
const level = require('level'), levelgraph = require('levelgraph');

const instances: {
  [fullpath: string]: any;
} = {};

export class LevelGraph {
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

  public get chain(): IChainObject {
    // tslint:disable-next-line: no-this-assignment
    const instance = this;
    const promises: Array<Promise<any>> = [];
    return {
      put(triple: ITriple) { promises.push(instance.put(triple)); return this; },
      del(triple: ITriple) { promises.push(instance.del(triple)); return this; },
      get(triple: IGetTriple) { promises.push(instance.get(triple)); return this; },
      async finish() { return (await Promise.all(promises)).filter((v) => !!v); },
    };
  }

  public put(triple: ITriple | ITriple[]): Promise<void> {
    return new Promise((res, rej) => {
      if (Array.isArray(triple)) Promise.all(triple.map((t) => this.put(t))).catch((e) => rej(e)).then(() => res());
      else this.DB.put(triple, (err: any) => err ? rej(err) : res());
    });
  }

  public del(triple: ITriple | ITriple[]): Promise<void> {
    return new Promise((res, rej) => {
      if (Array.isArray(triple)) Promise.all(triple.map((t) => this.del(t))).catch((e) => rej(e)).then(() => res());
      else this.DB.del(triple, (err: any) => err ? rej(err) : res());
    });
  }

  public get(triple: IGetTriple): Promise<ITriple[]> {
    return new Promise((res, rej) => {
      this.DB.get(triple, (err: any, list: any[]) => err ? rej(err) : res(list));
    });
  }

  public async find(subject: string | null, predicate: string | null, object?: string | null) {
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

  public walk(options: IWalkOptions, ...path: IWalkPath[]): Promise<Array<{ [key: string]: any }>> {
    return new Promise((res, rej) => {
      if (!options.materialized && !options.filter && !options.limit && !options.offset) {
        path.unshift(options as IWalkPath);
        options = {};
      }
      this.DB.search(path, options, (error: any, solutions: any) => error ? rej(error) : res(solutions));
    });
  }
}
