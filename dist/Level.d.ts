interface IChainObject<DefaultType> {
    del(key: string): IChainObject<DefaultType>;
    get(key: string): IChainObject<DefaultType>;
    put<EntryType = DefaultType>(key: string, value: EntryType): IChainObject<EntryType>;
    finish(): Promise<DefaultType[]>;
}
export default class Level<DefaultType = any> {
    static rootFolder: string;
    static setRoot(path: string): void;
    private DB;
    constructor(database: object);
    constructor(path: string);
    find<EntryType = DefaultType>(func: (value: DefaultType, ind: number, all: DefaultType[]) => boolean | null | undefined): Promise<DefaultType | undefined>;
    filter<EntryType = DefaultType>(func: (value: EntryType, ind: number, all: EntryType[]) => boolean | null | undefined): Promise<EntryType[]>;
    exists(key: string): Promise<boolean>;
    readonly chain: IChainObject<DefaultType>;
    get<EntryType = DefaultType>(key: string): Promise<EntryType>;
    put<EntryType = DefaultType>(key: string, value: EntryType): Promise<EntryType>;
    del(key: string): Promise<void>;
    merge<EntryType = DefaultType>(key: string, config: Partial<EntryType>): Promise<EntryType>;
    all<EntryType = DefaultType>(): Promise<EntryType[]>;
    stream<EntryType = DefaultType>(opts: Partial<IStreamOptions> & {
        keys?: true;
        values: false;
    }): Promise<string[]>;
    stream<EntryType = DefaultType>(opts: Partial<IStreamOptions> & {
        keys: false;
        values?: true;
    }): Promise<EntryType[]>;
    stream<EntryType = DefaultType>(opts: Partial<IStreamOptions> & {
        keys?: true;
        values?: true;
    }): Promise<Array<{
        key: string;
        value: EntryType;
    }>>;
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
    /**(default: -1) limit the number of entries collected by this stream. This number represents a maximum number of entries and may not be reached if you get to the end of the range first. A value of -1 means there is no limit. When reverse=true the entries with the highest keys will be returned instead of the lowest keys. */
    limit: number;
    /**(default: true) whether the results should contain keys. If set to true and values set to false then results will simply be keys, rather than objects with a key property. Used internally by the createKeyStream() method. */
    keys: boolean;
    /**(default: true) whether the results should contain values. If set to true and keys set to false then results will simply be values, rather than objects with a value property. Used internally by the createValueStream() method. */
    values: boolean;
}
export {};
//# sourceMappingURL=Level.d.ts.map