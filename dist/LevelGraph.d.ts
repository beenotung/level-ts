declare type InputTypeable = string | number;
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
declare type GraphVar = any;
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
export declare class LevelGraph {
    static rootFolder: string;
    static setRoot(path: string): void;
    private DB;
    constructor(path: string);
    readonly chain: IChainObject;
    put(triple: ITriple | ITriple[]): Promise<void>;
    del(triple: ITriple | ITriple[]): Promise<void>;
    get(triple: IGetTriple): Promise<ITriple[]>;
    find(subject: string | null, predicate: string | null, object?: string | null): Promise<string | number | null>;
    v(name: string): GraphVar;
    walk(options: IWalkOptions, ...path: IWalkPath[]): Promise<Array<{
        [key: string]: any;
    }>>;
}
export {};
//# sourceMappingURL=LevelGraph.d.ts.map