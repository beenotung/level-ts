"use strict";
// tslint:disable: no-var-requires
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const benchmark_1 = __importDefault(require("benchmark"));
const Level_1 = __importDefault(require("../Level"));
const keys = [];
for (let i = 0; i < 10000; i++)
    keys.push(Math.random().toString(36).substring(7));
class Context {
    constructor() {
        this.keys = [...keys];
        this.defObj = { foo: 'bar' };
        this.i = 0;
    }
    get key() {
        this.i++;
        if (this.i >= this.keys.length)
            this.i = 0;
        return this.keys[this.i];
    }
}
const newdb = new Level_1.default('temp_test.local/new-level-db');
const olddb = require('level')('temp_test.local/old-level-db');
(async function mainthread() {
    const bm = new benchmark_1.default.Suite('New vs Old');
    /**
     *  .put( ... )
     */
    bm.add('level-old.put( ... )', (function f1() { return olddb.put('foo', JSON.stringify({ foo: this.key })); }).bind(new Context()));
    bm.add('level-new.put( ... )', (function f1() { return newdb.put('foo', { foo: this.key }); }).bind(new Context()));
    await Promise.all(keys.map((key) => olddb.put(key, JSON.stringify({ foo: 'bar' }))));
    await Promise.all(keys.map((key) => newdb.put(key, { foo: 'bar' })));
    /**
     *  .get( ... )
     */
    bm.add('level-old.get( ... )', (async function f1() { return JSON.parse(await olddb.get(this.key)); }).bind(new Context()));
    bm.add('level-new.get( ... )', (function f1() { return newdb.get(this.key); }).bind(new Context()));
    bm.on('cycle', (event) => { console.log(String(event.target)); });
    bm.run({ async: true, delay: 10 });
})();
//# sourceMappingURL=Level.js.map