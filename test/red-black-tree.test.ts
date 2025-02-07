import { RBTree } from '../src/red-black-tree';
import fc from 'fast-check';
import { jest, test, expect } from '@jest/globals';

test("can create an RB tree", () => {
  const rb = new RBTree<number, number>();
  expect(rb.size).toBe(0);
});

test("can get a key", () => {
  const rb = new RBTree<number, number>();
  rb.set(1, 2);
  expect(rb.get(1)).toBe(2);
});

test("getting a nonexistent key returns undefined", () => {
  const rb = new RBTree<number, number>();
  expect(rb.get(-1)).toBeUndefined();
});

test("can has a key", () => {
  const rb = new RBTree<number, number>();
  rb.set(1, 2);
  expect(rb.has(1)).toBeTruthy();
  expect(rb.has(2)).toBeFalsy();
});

test("can delete a key", () => {
  const rb = new RBTree<number, number>();
  rb.set(1, 2);
  rb.set(2, 3);
  rb.set(3, 4);

  expect(rb.size).toBe(3);

  rb.delete(2);

  expect(rb.size).toBe(2);
  expect(rb.has(2)).toBeFalsy();
  expect(rb.has(1)).toBeTruthy();
  expect(rb.has(3)).toBeTruthy();
});

test("delete returns true if successful and false otherwise", () => {
  const rb = new RBTree<number, number>();
  rb.set(1, 2);

  expect(rb.delete(0)).toBeFalsy();
  expect(rb.delete(1)).toBeTruthy();
});

test("set overwrites values", () => {
  const rb = new RBTree<number, number>();
  rb.set(1, 0);
  rb.set(1, 2);

  expect(rb.size).toBe(1);
  expect(rb.get(1)).toBe(2);
});

test("can iterate over entries in order", () => {
  const f = jest.fn((x:[number, number]) => x);

  const rb = new RBTree<number, number>();
  rb.set(4, 5);
  rb.set(2, 3);
  rb.set(3, 4);
  rb.set(1, 2);
  rb.set(5, 6);

  for (const entry of rb.entries()) {
    f(entry);
  }

  expect(f).toHaveBeenCalledTimes(5);

  // should have been called in order
  for (let i = 0; i < 5; i++) {
    expect(f.mock.calls[i][0][0]).toBe(i + 1);
    expect(f.mock.calls[i][0][1]).toBe(i + 2);
  }
});

test("with many key/value pairs", () => {
  const rb = new RBTree<number, number>();

  fc.assert(fc.property(fc.array(fc.tuple(fc.integer(), fc.integer())), (data) => {
    for(let [key, value] of data) {
      rb.set(key, value);
    }

    expect(rb.checkBalanceInvariant()).toBeTruthy();
    expect(rb.checkOrderInvariant()).toBeTruthy();
  }));
});
