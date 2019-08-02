interface ITripleBase {
    subject: string;
    predicate: string;
    object: string;
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
export declare class LevelGraph {
    static rootFolder: string;
    static setRoot(path: string): void;
    private DB;
    constructor(path: string);
    readonly chain: {
        put(triple: ITriple): any;
        del(triple: ITriple): any;
        get(triple: IGetTriple): any;
        finish(): Promise<any[]>;
    };
    put(triple: ITriple | ITriple[]): Promise<void>;
    del(triple: ITriple | ITriple[]): Promise<void>;
    get(triple: IGetTriple): Promise<ITriple[]>;
    find(subject: string | null, predicate: string | null, object?: string | null): Promise<string | null>;
    v(name: string): GraphVar;
    walk(options: IWalkOptions, ...path: IWalkPath[]): Promise<Array<{
        [key: string]: any;
    }>>;
}
export {};
//# sourceMappingURL=LevelGraph.d.ts.map