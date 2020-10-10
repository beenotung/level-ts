import Level from '../Level';
import { resolve } from 'path';

interface IObj {
  test: string;
}

Level.setRoot('temp_test.local');
// mkdirSync('temp_test.local');
let db: Level<IObj>;

beforeAll(() => {
  db = new Level('level-db');
})

test('Level database creation', () => {
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
      .put('Data1', { test: 'jest-1' })
      .put('Data2', { test: 'jest-2' })
      .put('Data3', { test: 'jest-3' })
      .put('Data4', { test: 'jest-4' })
      .put('Data5', { test: 'jest-5' })
      .finish(),
  ).resolves.toBeDefined();
});

test('Streaming all dataset', async () => {
  return expect(db.stream()).resolves.toHaveLength(5);
});

test('Streaming range of dataset', async () => {
  const keys = ['Data2', 'Data3', 'Data4'];
  const dataset = await db.stream({
    gte: 'Data2',
    lte: 'Data4',
  });
  expect(dataset).toHaveLength(keys.length);
  for (const data of dataset) {
    expect(keys.includes(data.key)).toBeTruthy();
    expect(data.value).toMatchObject({ test: 'jest-' + data.key.replace('Data', '') });
  }
});

test('Iterate all dataset', async () => {
  const dataset: any[] = [];
  const stream = db.iterate();
  stream.onData((data) => dataset.push(data));
  return expect(stream.wait().then(() => dataset)).resolves.toHaveLength(5);
});

test('Iterate range of dataset', async () => {
  const keys = ['Data2', 'Data3', 'Data4'];
  const dataset: any[] = [];
  const stream = db.iterate({
    gte: 'Data2',
    lte: 'Data4',
  });
  stream.onData((data) => {
    expect(keys.includes(data.key)).toBeTruthy();
    dataset.push(data);
  });
  return expect(stream.wait().then(() => dataset)).resolves.toHaveLength(keys.length);
});

test('Reading all dataset', async () => {
  return expect(db.all()).resolves.toHaveLength(5);
});

test('Find data', async () => {
  return expect(db.find((value) => value.test.split('-')[1] >= '2')).resolves.toStrictEqual({ test: 'jest-2' });
});

test('Filter dataset', async () => {
  const keys = ['Data2', 'Data3', 'Data4', 'Data5'];
  const results = await db.filter((value) => value.test.split('-')[1] >= '2');
  expect(results).toHaveLength(keys.length);
  for (const key of keys) {
    expect(results.some((data) => data.test === 'jest-' + key.replace('Data', '')));
  }
});

test('Using an already created db inside constructor', async () => {
  const database = require('level')(resolve('temp_test.local', 'level-db-2'));
  const instance = new Level(database);
  return expect(instance.put('fuck', 'you')).resolves.toBe('you');
});

test('Count number of data in dataset', async () => {
  const keys = await db.stream({ values: false })
  return expect(db.count()).resolves.toBe(keys.length)
});

test('Run reduce on dataset', async () => {
  const dataset = await db.stream()
  const keys = dataset.map(data => data.key)
  const values = dataset.map(data => data.value)
  const collect = (array: string[], value: string) => {
    array.push(value)
    return array
  }
  await expect(db.reduce(collect, [], { values: false })).resolves.toEqual(keys)
  await expect(db.reduce(collect, [], { keys: false })).resolves.toEqual(values)
})
