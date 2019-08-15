interface IChainObject<InputType> {
    del(key: string): IChainObject<InputType>;
    get(key: string): IChainObject<InputType>;
    put(key: string, value: InputType): IChainObject<InputType>;
    finish(): Promise<InputType[]>;
}
export default class Level<DefaultType = any> {
    static rootFolder: string;
    static setRoot(path: string): void;
    private DB;
    constructor(database: object);
    constructor(path: string);
    find(func: (value: DefaultType, ind: number, all: DefaultType[]) => boolean | null | undefined): Promise<DefaultType | undefined>;
    filter(func: (value: DefaultType, ind: number, all: DefaultType[]) => boolean | null | undefined): Promise<DefaultType[]>;
    exists(key: string): Promise<boolean>;
    readonly chain: IChainObject<DefaultType>;
    get(key: string): Promise<DefaultType>;
    put(key: string, value: DefaultType): Promise<DefaultType>;
    del(key: string): Promise<void>;
    merge(key: string, config: Partial<DefaultType>): Promise<DefaultType>;
    all(returntype?: 'values'): Promise<DefaultType[]>;
    all(returntype: 'keys'): Promise<string[]>;
    all(returntype: 'both'): Promise<Array<{
        key: string;
        value: DefaultType;
    }>>;
    stream(opts: Partial<IStreamOptions>, returntype: 'key'): Promise<string[]>;
    stream(opts: Partial<IStreamOptions>, returntype: 'value'): Promise<DefaultType[]>;
    stream(opts: Partial<IStreamOptions>, returntype?: 'both'): Promise<Array<{
        key: string;
        value: DefaultType;
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