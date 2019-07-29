interface ITriple {
    subject: string;
    predicate: string;
    object: string;
    [key: string]: any;
}
interface IGetTriple extends ITriple {
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
    filter?: (this: any, solution: {
        [key: string]: any;
    }, callback: (error: string | null, solution: {
        [key: string]: any;
    }) => void) => void;
}
interface IWalkPath {
    subject: string | GraphVar;
    predicate: string | GraphVar;
    object: string | GraphVar;
    filter?: (this: any, triple: ITriple) => boolean;
}
export default class LevelGraph {
    static rootFolder: string;
    static setRoot(path: string): void;
    private DB;
    constructor(path: string);
    put(obj: ITriple): Promise<void>;
    get(obj: IGetTriple): Promise<ITriple[]>;
    del(obj: ITriple): Promise<void>;
    v(name: string): GraphVar;
    walk(options: IWalkOptions, ...path: IWalkPath[]): Promise<Array<{
        [key: string]: any;
    }>>;
}
export {};
//# sourceMappingURL=LevelGraph.d.ts.map