import { isAbsolute, resolve } from 'path';

interface ITriple {
  subject: string;
  predicate: string;
  object: string;
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

  public get chain() {
    // tslint:disable-next-line: no-this-assignment
    const instance = this;
    const promises: Array<Promise<any>> = [];
    return {
      put(triple: ITriple) { promises.push(instance.put(triple)); return this; },
      del(triple: ITriple) { promises.push(instance.del(triple)); return this; },
      get(triple: IGetTriple) { promises.push(instance.get(triple)); return this; },
      finish() { return Promise.all(promises); },
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
