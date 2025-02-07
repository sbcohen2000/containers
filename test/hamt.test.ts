import { HAMT } from "../src/hamt";
import fc from 'fast-check';
import { test, expect } from '@jest/globals';

test("can create a HAMT", () => {
  const ht = new HAMT();
  expect(ht.size).toBe(0);
});

test("can add keys", () => {
  let ht = new HAMT();
  ht = ht.set("a", 0);
  ht = ht.set("b", 1);

  expect(ht.size).toBe(2);

  expect(ht.get("a")).toBe(0);
  expect(ht.get("b")).toBe(1);
});

test("can replace values", () => {
  let ht = new HAMT();
  ht = ht.set("a", 0);
  ht = ht.set("a", 1);

  expect(ht.size).toBe(1);

  expect(ht.get("a")).toBe(1);
});

test("getting a nonexistent key returns undefined", () => {
  const ht = new HAMT();
  expect(ht.get("foo")).toBeUndefined();
});

test("adding keys preserves old states", () => {
  const v0 = new HAMT();
  const v1 = v0.set("a", 0);
  const v2 = v1.set("b", 1);

  expect(v0.size).toBe(0);
  expect(v0.get("a")).toBeUndefined();
  expect(v0.get("b")).toBeUndefined();

  expect(v1.size).toBe(1);
  expect(v1.get("a")).toBe(0);
  expect(v1.get("b")).toBeUndefined();

  expect(v2.size).toBe(2);
  expect(v2.get("a")).toBe(0);
  expect(v2.get("b")).toBe(1);
});

test("can add many keys", () => {
  let ht = new HAMT();
  const map = new Map();

  fc.assert(fc.property(fc.array(fc.tuple(fc.string(), fc.string())), (data) => {
    for(let [key, value] of data) {
      ht = ht.set(key, value);
      map.set(key, value);
    }

    for(let [key, value] of map.entries()) {
      expect(ht.get(key)).toBe(value);
    }

    expect(ht.size).toBe(map.size);
  }));
});

test("datastructure does not modify previous versions", () => {
  fc.assert(fc.property(fc.uniqueArray(fc.string()), (keys) => {
    let versions: HAMT<string>[] = [new HAMT()];

    for(let key of keys) {
      versions.push(versions[versions.length - 1].set(key, key));
    }

    for(let i = 0; i < versions.length; ++i) {
      const currentVersion = versions[i];
      const keysThatShouldBePresent = keys.slice(0, i);
      const keysThatShouldNotBePresent = keys.slice(i);

      for(const shouldBePresent of keysThatShouldBePresent) {
        expect(currentVersion.get(shouldBePresent)).toBe(shouldBePresent);
      }

      for(const shouldNotBePresent of keysThatShouldNotBePresent) {
        expect(currentVersion.get(shouldNotBePresent)).toBeUndefined();
      }
    }
  }));
});
