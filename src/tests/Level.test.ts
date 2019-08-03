import Level from '../Level';
import { rmdirSync, mkdirSync } from 'fs';
import { resolve } from 'path';

interface IObj {
  test: 'jest';
}

Level.setRoot('temp_test.local');
// mkdirSync('temp_test.local');
let db: Level<IObj>;

test('Level database creation', () => {
  db = new Level('level-db');
  return expect(db).toBeInstanceOf(Level);
});

test('Writing data - .put( test, { test: \'jest\' } )', () => {
  return expect(db.put('test', { test: 'jest' })).resolves.toHaveProperty('test', 'jest');
});

test('Reading data - .get( test )', () => {
  return expect(db.get('test')).resolves.toHaveProperty('test', 'jest');
});

test('Deleting data - .del( test )', () => {
  return expect(db.del('test')).resolves.toBeUndefined();
});

test('Chaining a dataset with chaining', () => {
  return expect(
    db.chain
      .put('Data1', { test: 'jest' })
      .put('Data2', { test: 'jest' })
      .put('Data3', { test: 'jest' })
      .put('Data4', { test: 'jest' })
      .put('Data5', { test: 'jest' })
      .finish()
  ).resolves.toBeDefined();
});

test('Streaming dataset', async () => {
  const keys = ['Data2', 'Data3', 'Data4'];
  for (const data of await db.stream({
    gte: 'Data2',
    lte: 'Data4',
  })) {
    expect(keys.includes(data.key)).toBeTruthy();
    expect(data.value).toMatchObject({ test: 'jest' });
  }
});

test('Reading all dataset', async () => {
  return expect(db.all()).resolves.toHaveLength(5);
});

test('Using an already created db inside constructor', async () => {
  const database = require('level')(resolve('temp_test.local', 'level-db-2'));
  const instance = new Level(database);
  return expect(instance.put('fuck', 'you')).resolves.toBe('you');
});
