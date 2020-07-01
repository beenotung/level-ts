# Level-ts typescript wrapper
A leveldb force promises, class, JSON and typescript implementing wrapper.
This can replace your current level database instance exactly, but with typescript returning and functions typing support:


```typescript
import level from '@beenotung/level-ts';

const database = new level('./database');

(async function () {
  // Same as normal level but with JSON parsing and only promises
  await database.put('first', { foo: 'bar' });
  await database.get('first'); // { foo: 'bar' }
  await database.del('first');
})();
```
### Promise forcing
Callbacks are **not** supported in this database instance. Instead, promises are used to await the data or actions.
In the normal level package / the old way:
```typescript
db.get('b', (error, data) => {
  if(error) throw error;
  console.log(data);
});
```
In this package and forcefully applied:
```typescript
const data = await db.get('b');
console.log(data);
```
If the `error` argument in the callback is defined, the promise will be rejected with that as it's rejection error.

### Class and JSON support
For easy reading the function instance of *level* is replaced with an class that automatically parses JSONs.
You can initialize a database from anywhere in your file with the class caller as long as it has the same path/name. This allows for sharing the database class over the same process with ease. E.g:
```typescript
// File App.ts
const db = await level('./database');
await db.put('first', { value: 1 });

// File Route.ts
const samedb = await level('./database');
await samedb.get('first'); // { value: 1 }
```
It is also possible to use an already initialized database instance inside the level constructor. As long as it has the appropriate functions. E.g:
```typescript
import Level from 'level';
import LevelTypescript from '@beenotung/level-ts';

const instance = Level('./database'); // You can use other packages too.

const db = new LevelTypescript(instance);

await db.put('first', { foo: bar });
```
This allows you to use other modules like: [Multilevel](https://www.npmjs.com/package/multilevel) or [Sublevel](https://www.npmjs.com/package/sublevel).
This allows for some more customization and useability.


#### Typescript support

```typescript
import level from '@beenotung/level-ts';

interface IEntry { //
  foo: string;
}

const db = new level<IEntry>('./db');
// db functions will now only accept and return IEntry objects
// E.g:

await db.put('first', { foo: 'bar', wrong: 1 });
// Typescript error: 'wrong' does not exist in type 'IEntry'
```

#### Chaining
You can chain database actions with *level-ts* by using the `.chain` property. When using `.get` actions, an array will be returned with the values in the order that it was chained. At the end of the chain, the `.finish()` function returns the promise. If the `.finish()` function is not called, the javascript thread will continue without waiting.

```typescript
const data = await db.chain
  .put('first', { value: 1 })
  .put('second', { value: 2 })
  .put('third', { value: 3 })
  .del('third')
  .get('second')
  .get('first')
  .finish();
console.log(data); // [{ value: 2 }, { value: 1 }]
```

### Streaming
You can also "stream" data with promises. This works different than the *stream* of Node.js. It does use the same mechanic, but wraps it neatly inside a promise with typescript value return support.

#### Writing in Stream
```typescript
await db.chain
  .put('session-ryan-1', { ... })
  .put('session-ryan-2', { ... })
  .put('session-ryan-3', { ... })
  .put('session-foo-1', { ... })
  .put('session-foo-2', { ... })
  .put('session-foo-3', { ... })
  .finish();

const sessions = await db.stream({ all: 'session-ryan-' }) 
// The all option is the same as: { gte: 'session-ryan-', lte: 'session-ryan-\xff' }
// Returns everything starting with 'session-ryan-'
for(const { key, value } of sessions) {
  console.log(key,'=', value.toString()); // Returns all sessions from ryan
  // (Entries with prefixed key "session-ryan-")
}
```

#### Reading in Stream
The data can be processed as soon as it's available using `db.iterate()`. This consumes less memory and allows streamlining the data to downstream consumer, e.g. pipe to file system, network socket, or another leveldb instance.

Unlike `db.stream()` which stores the data in memory and returns when the entire dataset is collected.
```typescript
const sessions = await db.iterate({ all: 'session-ryan-' })
sessions.onData(data => {
  console.log(data) // process the data one by one
})
await sessions.wait() // resolve when all data is iterated
```

### Extra functions

##### Exists
Returns if the given key exists in the database
```typescript 
await db.exists('first'); // false
await db.put('first', { ... });
await db.exists('first'); // true
```

##### Merge
Merges the database entry with the given object. Returns the newly created object:
```typescript
await db.put('first', { foo: 'bar', faa: 'abc' }); // returns: { foo: 'bar', faa: 'abc' }
await db.merge('first', { faa: 'boe' });           // returns: { foo: 'bar', faa: 'boe' }
await db.get('first');                             // returns: { foo: 'bar', faa: 'boe' }
```

##### All (values)
Returns all the values in the database using stream.
```typescript
const all = await db.all(); // [{ ... }, ...]
```
Due to streaming and promise awaiting is this *not the fastest* way to search for values or keys but the easiest. The functions that follow are all using this method to iterate the database and are also not meant for performance.

##### Filter
Works exactly as `Array.filter( ... )` but with the database values as array.
```typescript
const data = await db.filter((v, i, a) => { return !!v.isCool }); // Returns all the objects that are cool
```

##### Find
Works exactly as `Array.find( ... )` but with the database values as array.
```typescript
const data = await db.find((value, key) => { return value.user === 'Ryan'}); // Finds the first object that has user value 'Ryan'
```
# Levelgraph
Level graph database is also implemented inside this package like this:
```typescript
import { LevelGraph } from '@beenotung/level-ts';
const graphdb = new LevelGraph('./graph-database');

await graphdb.put({ subject: 'Ryan', predicate: 'owns-a', object: 'foo' });
await graphdb.get({ subject: 'Ryan', predicate: 'owns-a' }); // [{ subject: 'Ryan', predicate: 'owns-a', object: 'foo' }]
const owns = await graphdb.find('Ryan', 'owns-a', null);
console.log(owns) // "foo"
```

Should extend...
