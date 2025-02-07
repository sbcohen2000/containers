import { IntervalTree, Interval, intervalsIntersect } from "../src/interval-tree";
import fc from 'fast-check';
import { test, expect } from '@jest/globals';

test("can create an IntervalTree", () => {
  const i = new IntervalTree();
  expect(i.size).toBe(0);
});

test("can add intervals", () => {
  const i = new IntervalTree<string>();

  i.set([0, 10], "foo");
  i.set([5, 10], "bar");

  expect(i.size).toBe(2);

  expect(i.get([0, 10])).toEqual("foo");
  expect(i.get([5, 10])).toEqual("bar");
});

test("adding a value to an existing interval overwrites the old value", () => {
  const i = new IntervalTree<string>();

  i.set([0, 10], "one");
  i.set([-1, 1], "two");
  i.set([0, 10], "three");

  expect(i.get([-1, 1])).toBe("two");
  expect(i.get([0, 10])).toBe("three");
});

test("can search for intervals", () => {
  const i = new IntervalTree();

  i.set([0, 10], "foo");
  i.set([5, 20], "bar");

  expect([...i.search([0,   0])]).toEqual(["foo"]);
  expect([...i.search([5,   5])]).toEqual(["foo", "bar"]);
  expect([...i.search([19, 20])]).toEqual(["bar"]);
});

test("can delete intervals", () => {
  const i = new IntervalTree<string>();

  i.set([0, 10], "foo");
  i.set([5, 10], "bar");

  expect(i.size).toBe(2);

  i.delete([5, 10]);

  expect(i.size).toBe(1);
  expect(i.get([5, 10])).toBeUndefined();
});

test("calls to delete return the correct value", () => {
  const i = new IntervalTree<string>();

  i.set([0, 0], "just a point");
  expect(i.size).toBe(1);

  expect(i.delete([1, 1])).toBeFalsy();
  expect(i.delete([0, 1])).toBeFalsy();
  expect(i.delete([0, 0])).toBeTruthy();
});

const genInterval = () => {
  const begin = fc.integer({ min: -100, max: 100 });
  const len   = fc.nat({ max: 100 });
  return fc.tuple(begin, len).map(([b, l]) => [b, b + l] as Interval);
}

test("can add and search for many keys", () => {
  fc.assert(fc.property(
    fc.array(genInterval()),
    genInterval(),
    (intervals, query) => {
      const i = new IntervalTree();
      const l: Interval[] = [];
      for(const interval of intervals) {
        i.set(interval, interval);
        l.push(interval);
      }

      const itree_res = [...i.search(query)];
      const ref_res = l.filter(x => intervalsIntersect(x, query));
      itree_res.sort();
      ref_res.sort();

      expect(itree_res).toEqual(ref_res);
      expect(i.checkBalanceInvariant()).toBeTruthy();
      expect(i.checkOrderInvariant()).toBeTruthy();
    }));
});
