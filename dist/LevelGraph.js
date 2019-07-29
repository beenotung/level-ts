"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    put(obj) {
        return new Promise((res, rej) => {
            this.DB.put(obj, (err) => err ? rej(err) : res());
        });
    }
    get(obj) {
        return new Promise((res, rej) => {
            this.DB.get(obj, (err, list) => err ? rej(err) : res(list));
        });
    }
    del(obj) {
        return new Promise((res, rej) => {
            this.DB.del(obj, (err) => err ? rej(err) : res());
        });
    }
    v(name) { return this.DB.v(); }
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
exports.default = LevelGraph;
//# sourceMappingURL=LevelGraph.js.map