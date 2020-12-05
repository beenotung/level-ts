"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LevelGraph_1 = require("../LevelGraph");
const fs_1 = require("fs");
LevelGraph_1.LevelGraph.setRoot('temp_test.local');
// tslint:disable-next-line no-empty
try {
    fs_1.mkdirSync('temp_test.local');
}
catch (e) { }
const db = new LevelGraph_1.LevelGraph('levelgraph-db');
it('Writing data', () => {
    return expect(db.put({
        subject: 'Ryan',
        predicate: 'is',
        object: 'cool',
    })).resolves.toBeUndefined();
});
it('Reading data', () => {
    return expect(db.get({
        subject: 'Ryan',
        predicate: 'is',
    })).resolves.toMatchObject([{
            subject: 'Ryan',
            predicate: 'is',
            object: 'cool',
        }]);
});
it('Deleting data', async () => {
    await expect(db.del({
        subject: 'Ryan',
        predicate: 'is',
        object: 'cool',
    })).resolves.toBeUndefined();
    return expect(db.get({
        subject: 'Ryan',
        predicate: 'is',
    })).resolves.toHaveLength(0);
});
it('Chaining actions', () => {
    return expect(db.chain
        .put({ subject: 'Ryan', predicate: 'has', object: 'juice' })
        .put({ subject: 'Ryan', predicate: 'has', object: 'book' })
        .put({ subject: 'juice', predicate: 'contains', object: 'fruit' })
        .put({ subject: 'juice', predicate: 'contains', object: 'paper' })
        .put({ subject: 'book', predicate: 'contains', object: 'paper' })
        .put({ subject: 'book', predicate: 'contains', object: 'leather' })
        .put({ subject: 'Ryan', predicate: 'lastname', object: 'Awesome' })
        .finish()).resolves.toBeDefined();
});
it('Walking data', () => {
    return expect(db.walk({
        materialized: { from: db.v('from'), with: db.v('contains') },
    }, {
        subject: 'Ryan',
        predicate: 'has',
        object: db.v('from'),
    }, {
        subject: db.v('from'),
        predicate: 'contains',
        object: db.v('contains'),
    })).resolves.toEqual([
        { from: 'book', with: 'leather' },
        { from: 'book', with: 'paper' },
        { from: 'juice', with: 'fruit' },
        { from: 'juice', with: 'paper' }
    ]);
});
it('Simple find( )', () => {
    return expect(db.find(null, 'lastname', 'Awesome')).resolves.toBe('Ryan');
});
//# sourceMappingURL=LevelGraph.test.js.map