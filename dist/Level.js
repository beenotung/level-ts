"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
// tslint:disable: jsdoc-format
// tslint:disable-next-line: no-var-requires
const level = require('level');
const instances = {};
class Level {
    constructor(path) {
        const fullpath = path_1.isAbsolute(path) ? path : path_1.resolve(Level.rootFolder, path);
        this.DB = instances[fullpath]
            ? instances[fullpath]
            : instances[fullpath] = level(fullpath);
    }
    static setRoot(path) {
        this.rootFolder = path;
    }
    async find(func) {
        const all = await this.all();
        return all.find(func);
    }
    exists(key) {
        return new Promise((res, rej) => {
            this.DB.get(key)
                .catch((e) => e.notFound ? res(false) : rej(e))
                .then(() => res(true));
        });
    }
    async get(key) {
        return JSON.parse(await this.DB.get(key));
    }
    async put(key, value) {
        await this.DB.put(key, JSON.stringify(value));
        return value;
    }
    async del(key) {
        await this.DB.del(key);
    }
    async merge(key, config) {
        const newConfig = Object.assign(await this.get(key), config);
        await this.put(key, newConfig);
        return newConfig;
    }
    async all(key = false) {
        const array = await this.stream({ gte: ``, lte: `\xff` });
        return key ? array : array.map((v) => v.value);
    }
    stream(opts, returntype) {
        return new Promise((resolve, reject) => {
            const returnArray = [];
            this.DB
                .createReadStream(opts)
                .on('data', ({ key, value }) => returnArray.push({ key, value: JSON.parse(value) }))
                .on('error', reject)
                .on('end', () => {
                switch (returntype) {
                    case 'key':
                        resolve(returnArray.map((v) => v.key));
                        break;
                    case 'value':
                        resolve(returnArray.map((v) => v.value));
                        break;
                    default:
                        resolve(returnArray);
                        break;
                }
            });
        });
    }
}
Level.rootFolder = process.env.DATABASES || process.env.DATABASES_ROOT || process.cwd();
exports.default = Level;
//# sourceMappingURL=Level.js.map