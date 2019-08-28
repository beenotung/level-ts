"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
// tslint:disable: jsdoc-format
// tslint:disable-next-line: no-var-requires
const level = require('level');
const instances = {};
class Level {
    constructor(argument) {
        if (typeof argument === 'string') {
            const fullpath = path_1.isAbsolute(argument) ? argument : path_1.resolve(Level.rootFolder, argument);
            this.DB = instances[fullpath]
                ? instances[fullpath]
                : instances[fullpath] = level(fullpath);
        }
        else if (!!argument.get && !!argument.put && !!argument.createReadStream && !!argument.del) {
            this.DB = argument;
        }
        else {
            throw new Error('No valid database instance or path provided');
        }
    }
    static setRoot(path) {
        this.rootFolder = path;
    }
    async find(func) {
        const all = await this.all();
        return all.find(func);
    }
    async filter(func) {
        const all = await this.all();
        return all.filter(func);
    }
    exists(key) {
        return new Promise((res, rej) => {
            this.DB.get(key)
                .catch((e) => e.notFound ? res(false) : rej(e))
                .then(() => res(true));
        });
    }
    get chain() {
        // tslint:disable-next-line: no-this-assignment
        const instance = this;
        const promises = [];
        return {
            get(key) { promises.push(instance.get(key)); return this; },
            del(key) { promises.push(instance.del(key)); return this; },
            put(key, value) { promises.push(instance.put(key, value)); return this; },
            async finish() { return (await Promise.all(promises)).filter((v) => !!v); },
        };
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
    async all() {
        return this.stream({ keys: false });
    }
    stream(opts) {
        return new Promise((resolver, reject) => {
            const returnArray = [];
            if (opts.all)
                Object.assign(opts, { gte: opts.all, lte: opts.all + '\xff' });
            this.DB
                .createReadStream(opts)
                .on('data', (data) => {
                if (opts.values !== false && opts.keys !== false)
                    data.value = JSON.parse(data.value);
                if (opts.keys === false)
                    data = JSON.parse(data);
                returnArray.push(data);
            })
                .on('error', reject)
                .on('end', () => resolver(returnArray));
        });
    }
}
Level.rootFolder = process.env.DATABASES || process.env.DATABASES_ROOT || process.cwd();
exports.default = Level;
//# sourceMappingURL=Level.js.map