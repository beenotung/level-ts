import { resolve, isAbsolute } from 'path';

// tslint:disable: jsdoc-format
// tslint:disable-next-line: no-var-requires
const level = require('level');

const instances: {
  [fullpath: string]: any;
} = {};

interface IChainObject<DefaultType> {
  del(key: string): IChainObject<DefaultType>;
  get(key: string): IChainObject<DefaultType>;
  put<EntryType = DefaultType>(key: string, value: EntryType): IChainObject<EntryType>;
  finish(): Promise<DefaultType[]>;
}

export default class Level<DefaultType = any> {
  public static rootFolder = process.env.DATABASES || process.env.DATABASES_ROOT || process.cwd();
  public static setRoot(path: string) {
    this.rootFolder = path;
  }

  private DB: any;

  constructor(database: object)
  // tslint:disable-next-line: unified-signatures
  constructor(path: string)
  constructor(argument: string | any) {
    if (typeof argument === 'string') {
      const fullpath = isAbsolute(argument) ? argument : resolve(Level.rootFolder, argument);
      this.DB = instances[fullpath]
        ? instances[fullpath]
        : instances[fullpath] = level(fullpath);
    } else if (!!argument.get && !!argument.put && !!argument.createReadStream && !!argument.del) {
      this.DB = argument;
    } else {
      throw new Error('No valid database instance or path provided');
    }
  }

  public async find<EntryType = DefaultType>(func: (value: DefaultType, ind: number, all: DefaultType[]) => boolean | null | undefined): Promise<DefaultType | undefined> {
    const all = await this.all();
    return all.find(func as any);
  }

  public async filter<EntryType = DefaultType>(func: (value: EntryType, ind: number, all: EntryType[]) => boolean | null | undefined) {
    const all = await this.all<EntryType>();
    return all.filter(func);
  }

  public exists(key: string): Promise<boolean> {
    return new Promise((res, rej) => {
      this.DB.get(key)
        .catch((e: any) => e.notFound ? res(false) : rej(e))
        .then(() => res(true));
    });
  }

  public get chain(): IChainObject<DefaultType> {
    // tslint:disable-next-line: no-this-assignment
    const instance = this;
    const promises: Array<Promise<any>> = [];
    return {
      get(key: string) { promises.push(instance.get(key)); return this; },
      del(key: string) { promises.push(instance.del(key)); return this; },
      put(key: string, value: any) { promises.push(instance.put(key, value)); return this as any; },
      async finish() { return (await Promise.all(promises)).filter((v) => !!v); },
    };
  }

  public async get<EntryType = DefaultType>(key: string): Promise<EntryType> {
    return JSON.parse(await this.DB.get(key));
  }

  public async put<EntryType = DefaultType>(key: string, value: Required<EntryType>): Promise<EntryType> {
    await this.DB.put(key, JSON.stringify(value));
    return value;
  }

  public async del(key: string): Promise<void> {
    await this.DB.del(key);
  }

  public async merge<EntryType = DefaultType>(key: string, config: Partial<EntryType>): Promise<EntryType> {
    const oldConfig = await this.get<EntryType>(key);
    const newConfig = { ...oldConfig, ...config } as any;
    await this.put<EntryType>(key, newConfig);
    return newConfig;
  }

  public async all<EntryType = DefaultType>(): Promise<EntryType[]> {
    return this.stream<EntryType>({ keys: false });
  }

  public stream<EntryType = DefaultType>(opts: Partial<IStreamOptions> & { keys?: true; values: false }): Promise<string[]>;
  public stream<EntryType = DefaultType>(opts: Partial<IStreamOptions> & { keys: false; values?: true }): Promise<EntryType[]>;
  public stream<EntryType = DefaultType>(opts?: Partial<IStreamOptions> & { keys?: true; values?: true }): Promise<Array<{ key: string; value: EntryType }>>;
  public stream<EntryType = DefaultType>(optionalOpts?: Partial<IStreamOptions>): Promise<any[]> {
    return new Promise((resolver, reject) => {
        const opts = optionalOpts || {};
        const returnArray: any[] = [];
        if (opts.all) Object.assign(opts, { gte: opts.all, lte: opts.all + '\xff' });
        this.DB
        .createReadStream(opts)
        .on('data', (data: any) => {
          if (opts.values !== false && opts.keys !== false) data.value = JSON.parse(data.value);
          if (opts.keys === false) data = JSON.parse(data);
          returnArray.push(data);
        })
        .on('error', reject)
        .on('end', () => resolver(returnArray));
    });
  }
  public iterate<EntryType = DefaultType>(opts: Partial<IStreamOptions> & { keys?: true, values: false }): IStream<string>;
  public iterate<EntryType = DefaultType>(opts: Partial<IStreamOptions> & { keys: false, values?: true }): IStream<EntryType>;
  public iterate<EntryType = DefaultType>(opts?: Partial<IStreamOptions> & { keys?: true, values?: true }): IStream<{ key: string, value: EntryType }>;
  public iterate<EntryType = DefaultType>(optionalOpts?: Partial<IStreamOptions> & { keys?: boolean, values?: boolean }): IStream<any> {
        const opts = optionalOpts || {};
        if (opts.all) Object.assign(opts, { gte: opts.all, lte: opts.all + '\xff' });
        let resolveEnd!: () => void;
        let rejectEnd!: (error?: any) => void;
        const endPromise = new Promise<void>((resolver, reject) => {
            resolveEnd = resolver;
            rejectEnd = reject;
          });
        const dataCbs: Array<(data: any) => void> = [];
        const stream: IStream<any> = {
                  onData(cb: (data: any) => void) {
                  dataCbs.push(cb);
                },
                  wait(): Promise<void> {
                return endPromise;
              },
            };
        this.DB
            .createReadStream(opts)
            .on('data', (data: any) => {
                if (opts.values !== false && opts.keys !== false) {
                    data.value = JSON.parse(data.value);
                  }
                if (opts.keys === false) {
                    data = JSON.parse(data);
                  }
                dataCbs.forEach((cb) => cb(data));
              })
            .on('error', rejectEnd)
            .on('end', resolveEnd);
        return stream;
      }
}

interface IStreamOptions {
  /**define the lower bound of the range to be streamed. Only entries where the key is greater than (or equal to) this option will be included in the range. When reverse=true the order will be reversed, but the entries streamed will be the same. */
  gt: string;
  gte: string;
  /**define the higher bound of the range to be streamed. Only entries where the key is less than (or equal to) this option will be included in the range. When reverse=true the order will be reversed, but the entries streamed will be the same. */
  lt: string;
  lte: string;
  /**Using gte and lte with this value */
  all: string;

  /**(default: false) stream entries in reverse order. Beware that due to the way that stores like LevelDB work, a reverse seek can be slower than a forward seek. */
  reverse: boolean;

  // tslint:disable-next-line: max-line-length
  /**(default: -1) limit the number of entries collected by this stream. This number represents a maximum number of entries and may not be reached if you get to the end of the range first. A value of -1 means there is no limit. When reverse=true the entries with the highest keys will be returned instead of the lowest keys. */
  limit: number;
  /**(default: true) whether the results should contain keys. If set to true and values set to false then results will simply be keys, rather than objects with a key property. Used internally by the createKeyStream() method. */
  keys: boolean;
  /**(default: true) whether the results should contain values. If set to true and keys set to false then results will simply be values, rather than objects with a value property. Used internally by the createValueStream() method. */
  values: boolean;
}

interface IStream<T> {
  onData(cb: (data: T) => void): void;

  wait(): Promise<void>; // resolve when ended
}
