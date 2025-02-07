# containers

Here are some useful container datastructures written in Typescript.

## HAMT (Hash Array Mapped Trie)
A persistent map datastructure with string keys. The main reason to
use this over JavaScript's default `Map` type is if you need a
datastructure which is _immutable_. That is, updating the map produces
a _new map_. However, this datastructure implements some structural
sharing so that only a portion of the map needs to be copied on each
update.

| Method                                | Description                                                                                                                                                             |
|---------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `new HAMT()`                          | Construct a new `HAMT`.                                                                                                                                                 |
| `size: number`                        | Get the number of elements in the map.                                                                                                                                  |
| `get(key: string): V | undefined`     | Retrieve a value from the map (or undefined if no such key exists).                                                                                                     |
| `set(key: string, value: V): HAMT<V>` | Associate a key-value pair in the map, returning a new map, containing the given key. If the key already exists in the map, its value is replaced in the resulting map. |

## Red-Black Tree
A mutable key-value map datastructure. The main reason to use this
over JavaScript's default `Map` type is that you can define your own
key ordering, enabling _structural_ comparisons of the key.

| Method                                 | Description                                                                                                |
|----------------------------------------|------------------------------------------------------------------------------------------------------------|
| `new RBTree(compareFn?: CompareFn<K>)` | Construct a new `RBTree`, optionally providing a comparison function on keys.                              |
| `has(key: K): boolean`                 | Check if the map contains a value with the given key.                                                      |
| `get(key: K): V | undefined`           | Retrieve a value by its key, returning undefined if the value isn't in the map.                            |
| `set(key: K, value: V): RBTree<K, V>`  | Associate a key with a value. If the key is already associated with a value, the value is updated.         |
| `delete(key: K): boolean`              | Delete a key and its associated value from the map. If the key does not exist in the map, this is a no-op. |
| `size: number`                         | Get the number of elements in the map.                                                                     |
| `*entries(): IterableIterator<[K, V]>` | Iterate over the keys and values of the map from least to greatest key.                                    |

## Interval Tree
A mutable interval tree which can associate a value for each
interval. We can consider this another key-value map datastructure,
where the keys are specialized to intervals. This affords us a
`search` method which returns all of the values which intersect a
given query interval.

| Method                                               | Description                                                                                                                    |
|------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `new IntervalTree()`                                 | Construct a new `IntervalTree`                                                                                                 |
| `has(interval: Interval)`                            | Check if the interval tree contains a value with the given interval.                                                           |
| `get(interval: Interval): V`                         | Retrieve a value by its interval, returning undefined if the value isn't in the map.                                           |
| `set(interval: Interval, value: V): IntervalTree<V>` | Associate an interval with a value. If the interval already exists within the map, then the value at the interval is replaced. |
| `delete(interval: Interval): boolean`                | Delete an interval and its associated value from the tree. If the interval does not exist in the map, this is a no-op.         |
| `*search(query: Interval): IterableIterator<V>`      | Find all of the values which intersect the given interval.                                                                     |
| `size: number`                                       | Get the number of elements in the map.                                                                                         |
| `*entries(): IterableIterator<[K, V]>`               | Iterate over the keys and values of the map from least to greatest key.                                                        |

# Contributing

Feedback and pull requests are welcome!
