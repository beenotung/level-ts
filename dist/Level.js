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
        return new Promise((resolver, reject) => {
            const stream = this.iterate();
            stream.onData((data) => {
                if (func(data.value, data.key)) {
                    resolver(data.value);
                    stream.close();
                }
            });
            stream.wait()
                .then(() => resolver(undefined))
                .catch(reject);
        });
    }
    async filter(func) {
        return new Promise((resolver, reject) => {
            const matches = [];
            const stream = this.iterate();
            stream.onData((data) => {
                if (func(data.value, data.key)) {
                    matches.push(data.value);
                }
            });
            stream.wait()
                .then(() => resolver(matches))
                .catch(reject);
        });
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
        const oldConfig = await this.get(key);
        const newConfig = { ...oldConfig, ...config };
        await this.put(key, newConfig);
        return newConfig;
    }
    async all() {
        return this.stream({ keys: false });
    }
    stream(opts) {
        const returnArray = [];
        const stream = this.iterate(opts);
        stream.onData((data) => returnArray.push(data));
        return stream.wait().then(() => returnArray);
    }
    iterate(optionalOpts) {
        const opts = optionalOpts || {};
        if (opts.all)
            Object.assign(opts, { gte: opts.all, lte: opts.all + '\xff' });
        let resolveEnd;
        let rejectEnd;
        const endPromise = new Promise((resolver, reject) => {
            resolveEnd = resolver;
            rejectEnd = reject;
        });
        const dataCbs = [];
        const readStream = this.DB
            .createReadStream(opts)
            .on('data', (data) => {
            if (opts.values !== false && opts.keys !== false) {
                data.value = JSON.parse(data.value);
            }
            if (opts.keys === false) {
                data = JSON.parse(data);
            }
            dataCbs.forEach((cb) => cb(data));
        })
            .on('error', rejectEnd)
            .on('end', () => resolveEnd('end'));
        const stream = {
            onData(cb) {
                dataCbs.push(cb);
            },
            close() {
                readStream.destroy();
                resolveEnd('cancel');
            },
            wait() {
                return endPromise;
            },
        };
        return stream;
    }
    reduce(fn, initial, optionalOpts) {
        const stream = this.iterate(optionalOpts);
        stream.onData((data) => {
            initial = fn(initial, data);
        });
        return stream.wait().then(() => initial);
    }
    count() {
        const stream = this.iterate({ keys: true, values: false });
        let count = 0;
        stream.onData(() => count++);
        return stream.wait().then(() => count);
    }
}
exports.default = Level;
Level.rootFolder = process.env.DATABASES || process.env.DATABASES_ROOT || process.cwd();
//# sourceMappingURL=Level.js.map