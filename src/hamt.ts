
type Node<V> = {
  /**
   * The bits of this mask (interpreted as a 32-bit number) represent
   * the 32 possible children of this node. If a bit is 1, the slot is
   * inhabited. Else, it is uninhabited.
   */
  mask: number;

  /*
   * The below are parallel arrays keeping track of the keys in each
   * node, the values, and possibly a pointer to the next table.
   */
  keys: string[];
  values: V[];
  nexts: (Node<V> | null)[];
}

/**
 * A Hash array mapped trie (HAMT) is a persistent map data
 * structure. In this implementation, it is specialized to have key
 * type string.
 */
export class HAMT<V> {
  private root: Node<V>;

  /**
   * The number of elements in the map.
   */
  private _size: number;

  constructor() {
    this._size = 0;

    this.root = {
      mask: 0,
      keys: [],
      values: [],
      nexts: []
    };
  }

  /**
   * Get the number of elements in the map.
   */
  get size(): number {
    return this._size;
  }

  /**
   * Retrieve a value from the map (or undefined if no such key
   * exists).
   *
   * @param key The key to lookup.
   */
  get(key: string): V | undefined {
    const hash = hashString(key);
    let stage = 0;
    let current: Node<V> | null = this.root;

    while(current !== null) {
      const bitIndex = getNthPrefix(hash, stage)!;
      if(checkBit(current.mask, bitIndex)) {
        // child is inhabited
        const childIndex = bitIndex === 31 ? 0 : popCount(current.mask >>> (bitIndex + 1));
        const currentKey = current.keys[childIndex];

        if(currentKey === key) {
          return current.values[childIndex];
        }

        current = current.nexts[childIndex];
        ++stage;
      } else {
        // child is uninhabited
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Associate a key-value pair in the map, returning a new map,
   * containing the given key. If the key already exists in the map,
   * its value is replaced in the resulting map.
   *
   * @param key The key to set.
   * @param value The value to associate with the key.
   */
  set(key: string, value: V): HAMT<V> {
    const hash = hashString(key);

    // This will be set to false if we're replacing an existing value
    // in the HAMT.
    let isNewKey = true;

    const f = (stage: number, current: Node<V>): Node<V> => {
      // make a copy of every node we traverse on the path down.
      current = { ...current };

      const bitIndex = getNthPrefix(hash, stage)!;

      // we define the childIndex to be the number of children to the
      // left of this child's set bit in the bit mask. We need to use
      // this conditional since the RHS of >>> is taken modulo 32.
      const childIndex = bitIndex === 31 ? 0 : popCount(current.mask >>> (bitIndex + 1));

      if(checkBit(current.mask, bitIndex)) {
        // child is inhabited
        if(current.keys[childIndex] === key) {
          // make a copy of the values array, insert the new value,
          // and we're done
          current.values = [...current.values];
          current.values[childIndex] = value;
          isNewKey = false;
          return current;
        }

        if(current.nexts[childIndex] === undefined) {
          throw new Error(`Bad childIndex: ${childIndex} (length is ${current.nexts.length})`);
        }

        // make a copy of the nexts array.
        current.nexts = [...current.nexts];
        if(current.nexts[childIndex] === null) {
          current.nexts[childIndex] = {
            mask: 0,
            keys: [],
            values: [],
            nexts: []
          };
        }

        current.nexts[childIndex] = f(stage + 1, current.nexts[childIndex]!);
      } else {
        // child is uninhabited, add it to the current node and we're done
        current.keys = copyInsert(key, childIndex, current.keys);
        current.values = copyInsert(value, childIndex, current.values);
        current.nexts = copyInsert(null, childIndex, current.nexts);
        current.mask = setBit(current.mask, bitIndex);
      }

      return current;
    }

    const res = new HAMT<V>();
    res.root = f(0, this.root);
    res._size = this._size;
    if(isNewKey) {
      res._size = 1 + this._size;
    }
    return res;
  }

  /**
   * Return a debug representation of the map
   */
  toDebugString(): string {
    let s = "";
    const f = (root: Node<V>, indentation: string) => {
      s += indentation + `mask: ${binStr(root.mask)}\n` + indentation;
      let needsIndent = false;
      for(let i = 0; i < popCount(root.mask); ++i) {
        if(i + 1 < popCount(root.mask) && root.nexts[i] === null && root.nexts[i + 1] === null) {
          // save space
          s += root.keys[i] + ", ";
          needsIndent = false;
        } else {
          if(needsIndent) {
            s += indentation;
          }
          s += root.keys[i] + "\n";
          needsIndent = true;
        }

        if(root.nexts[i] !== null) {
          f(root.nexts[i]!, indentation + "    ");
        }
      }
    }

    f(this.root, "");
    return s;
  }
}

/**
 * Insert an element into an array, copying the array in the process.
 *
 * @param elem The element to insert.
 *
 * @param index The index at which to insert the element.
 *
 * @param arr The original array.
 *
 * @returns A new array.
 */
function copyInsert<T>(elem: T, index: number, arr: T[]): T[] {
  let res: T[] = [];
  let i = 0;
  for(; i < arr.length; ++i) {
    if(i === index) {
      res.push(elem);
    }
    res.push(arr[i]);
  }

  // handle the case where `elem` is inserted last
  if(index === i) {
    res.push(elem);
  }

  return res;
}

function binStr(n: number, nDigits: number = 32) {
  return (n >>> 0).toString(2).padStart(nDigits, '0')
}

/**
 * Check if a bit in `n` is set.
 *
 * @param n The 32-bit integer to check.
 *
 * @param bit The index of the bit to check.
 *
 * @returns True if the bit was 1, false if the bit was 0.
 */
function checkBit(n: number, bit: number): boolean {
  return ((n >> bit) & 0b1) === 0b1;
}

/**
 * Set a bit to 1.
 *
 * @param n The 32-bit integer to modify.
 *
 * @param bit The index of the bit to set.
 *
 * @returns The modified integer.
 */
function setBit(n: number, bit: number): number {
  return n | (0b1 << bit);
}

/**
 * Get the nth five bits of n.
 *
 * @param n The number from which to extract 5 bits.
 *
 * @param stage The index to start extracting 5 bits.  If this number
 *     is 0, the first 5 bits are returned.  If it's 1, the second 5
 *     bits are returned etc.
 *
 * @param The 5 bits as an integer, or undefined if the stage number
 *    would have resulted in overflowing n (assumed to be 32 bits).
 */
function getNthPrefix(n: number, stage: number): number | undefined {
  // we can only ask for stages [0, 5] on a 32 bit number.
  if(stage > 5) return undefined;

  return (n >> (5 * stage)) & 0b11111;
}

/**
 * Hash a string, returning a 32-bit integer.
 *
 * @param s The string to hash.
 *
 * @returns The hash.
 */
function hashString(s: string): number {
  let h = 0;
  for(let i = 0; i < s.length; ++i) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return h;
}

/**
 * Count the number of 1s in the 32-bit integer representation of a
 * number.
 * https://stackoverflow.com/a/43122214
 *
 * @param n The number whose bits to count.
 *
 * @return An integer representing the number of ones.
 */
function popCount(n: number) {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
}
