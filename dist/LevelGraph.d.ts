declare type TripleInp = string | number;
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
export declare class LevelGraph<StaticPredicates extends TripleInp = string | number> {
    static rootFolder: string;
    static setRoot(path: string): void;
    private DB;
    constructor(path: string);
    readonly chain: IChainObject<StaticPredicates>;
    put(triple: ITriple<StaticPredicates> | Array<ITriple<StaticPredicates>>): Promise<void>;
    del(triple: ITriple<StaticPredicates> | Array<ITriple<StaticPredicates>>): Promise<void>;
    get(triple: IGetTriple<StaticPredicates>): Promise<Array<ITriple<StaticPredicates>>>;
    find(subject: string | null, predicate: StaticPredicates | null, object?: string | null): Promise<string | number | StaticPredicates | null>;
    v(name: string): GraphVar;
    walk(options: IWalkOptions, ...path: Array<IWalkPath<StaticPredicates>>): Promise<Array<{
        [key: string]: any;
    }>>;
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
interface IWalkPath<Predicates extends TripleInp> {
    subject: string | GraphVar;
    predicate: string | GraphVar;
    object: string | GraphVar;
    filter?: (this: any, triple: ITriple<Predicates>) => boolean;
}
export {};
//# sourceMappingURL=LevelGraph.d.ts.map