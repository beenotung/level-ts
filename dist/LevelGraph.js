"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable: jsdoc-format
const path_1 = require("path");
// tslint:disable: jsdoc-format
// tslint:disable-next-line: no-var-requires one-variable-per-declaration
const level = require('level'), levelgraph = require('levelgraph');
const instances = {};
class LevelGraph {
    constructor(path) {
        const fullpath = path_1.isAbsolute(path) ? path : path_1.resolve(LevelGraph.rootFolder, path);
        this.DB = instances[fullpath]
            ? instances[fullpath]
            : instances[fullpath] = levelgraph(level(fullpath));
    }
    static setRoot(path) {
        this.rootFolder = path;
    }
    get chain() {
        // tslint:disable-next-line: no-this-assignment
        const instance = this;
        const promises = [];
        return {
            put(triple) { promises.push(instance.put(triple)); return this; },
            del(triple) { promises.push(instance.del(triple)); return this; },
            get(triple) { promises.push(instance.get(triple)); return this; },
            async finish() { return (await Promise.all(promises)).filter((v) => !!v); },
        };
    }
    put(triple) {
        return new Promise((res, rej) => {
            if (Array.isArray(triple))
                Promise.all(triple.map((t) => this.put(t))).catch((e) => rej(e)).then(() => res());
            else
                this.DB.put(triple, (err) => err ? rej(err) : res());
        });
    }
    del(triple) {
        return new Promise((res, rej) => {
            if (Array.isArray(triple))
                Promise.all(triple.map((t) => this.del(t))).catch((e) => rej(e)).then(() => res());
            else
                this.DB.del(triple, (err) => err ? rej(err) : res());
        });
    }
    get(triple) {
        return new Promise((res, rej) => {
            this.DB.get(triple, (err, list) => err ? rej(err) : res(list));
        });
    }
    async find(subject, predicate, object) {
        let returnkey;
        if (Array(arguments).filter((v) => v === null).length > 1)
            throw new Error('Find( ) cannot have more than 1 null argument');
        else if (!subject)
            returnkey = 'subject';
        else if (!predicate)
            returnkey = 'predicate';
        else if (!object)
            returnkey = 'object';
        else
            throw new Error('No nulled argument given. No return specified');
        const [obj] = await this.get({
            subject: subject || undefined,
            predicate: predicate || undefined,
            object: object || undefined,
        });
        if (!obj)
            return null;
        return obj[returnkey];
    }
    v(name) { return this.DB.v(name); }
    walk(options, ...path) {
        return new Promise((res, rej) => {
            if (!options.materialized && !options.filter && !options.limit && !options.offset) {
                path.unshift(options);
                options = {};
            }
            this.DB.search(path, options, (error, solutions) => error ? rej(error) : res(solutions));
        });
    }
}
LevelGraph.rootFolder = process.env.DATABASES || process.env.DATABASES_ROOT || process.cwd();
exports.LevelGraph = LevelGraph;
//# sourceMappingURL=LevelGraph.js.map