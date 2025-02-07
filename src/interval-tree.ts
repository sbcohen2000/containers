import { Node, CompareFn, AbstractRBTree } from "./red-black-common"

/*
 * Implementation based on:
 * https://www.eecs.umich.edu/courses/eecs380/ALG/niemann/s_rbt.htm
 * and
 * https://github.com/alexbol99/flatten-interval-tree
 */

/**
 * An interval which is closed (inclusive) on both ends.
 */
export type Interval = [number, number];

type ITreeNode<V> = Node<Interval, V> & {
  parent: ITreeNode<V> | null,
  left:   ITreeNode<V>,
  right:  ITreeNode<V>,
  max:    number
};

const sentinel: ITreeNode<any> = {
  parent: null,
  left:   null,
  right:  null,
  color:  "black",
  key:    null,
  value:  null,
  nil:    true,
  max:    0
};

/**
 * Find the maximum of two numbers.
 */
function max(a: number, b: number): number {
  return a > b ? a : b;
}

/**
 * Find the maximum of three numbers.
 */
function max3(a: number, b: number, c: number): number {
  return max(a, max(b, c));
}

/**
 * Update the max value of the ITreeNode to be the maximum of the
 * right endpoint of the interval, and the maximum of the left and
 * right children.
 *
 * @param node The node to modify.
 */
function updateNodeMax<V>(node: ITreeNode<V>) {
  if(node.left.nil && node.right.nil) {
    node.max = node.key[1];
  } else if(node.left.nil) {
    node.max = max(node.key[1], node.right.max);
  } else if(node.right.nil) {
    node.max = max(node.key[1], node.left.max);
  } else {
    node.max = max3(node.key[1], node.left.max, node.right.max);
  }
}

/**
 * Update the max value of the parent of this ITreeNode, and all of
 * its parents.
 *
 * @param node The node whose parents to update.
 */
function updateParentsMax<V>(node: ITreeNode<V>) {
  while(node.parent !== null && !node.parent.nil) {
    updateNodeMax(node.parent);
    node = node.parent;
  }
}

const compareFn: CompareFn<Interval> = (a, b) => {
  if(a[0] < b[0]) {
    return "LT";
  } else if(a[0] === b[0]) {
    if(a[1] < b[1]) {
      return "LT";
    } else if(a[1] > b[1]) {
      return "GT";
    } else {
      return "EQ";
    }
  } else {
    return "GT";
  }
}

export function intervalsIntersect(a: Interval, b: Interval): boolean {
  return a[0] <= b[1] && a[1] >= b[0];
}

export class IntervalTree<V> extends AbstractRBTree<Interval, V> {
  /**
   * The root of the red-black tree
   */
  private _root: ITreeNode<V> = sentinel;

  /**
   * The number of nodes in the tree.
   */
  private _size: number = 0;

  protected compareFn(): CompareFn<Interval> {
    return compareFn;
  }

  protected root(): ITreeNode<V> {
    return this._root;
  }

  /**
   * Check if the interval tree contains a value with the given
   * interval.
   *
   * @param interval The value's interval.
   *
   * @returns True if the tree contains the interval, false otherwise.
   */
  has(interval: Interval): boolean {
    return this.get(interval) !== undefined;
  }

  /**
   * Retrieve a value by its interval, or return `undefined` if the
   * interval isn't in the tree.
   *
   * @param interval The value's interval.
   *
   * @returns The value at the interval.
   */
  get(interval: Interval): V | undefined {
    return this.find(interval)?.value;
  }

  /**
   * Associate an interval with a value. If the interval already
   * exists within the map, then the value at the interval is
   * replaced.
   *
   * @param key The key to set.
   *
   * @param value The value to store at the key.
   *
   * @returns The map.
   */
  set(interval: Interval, value: V): IntervalTree<V> {
    this.insertNode(interval, value);
    return this;
  }

  /**
   * Delete an interval and its associated value from the tree. If the
   * interval does not exist in the map, this is a no-op.
   *
   * @param key The key to delete.
   *
   * @returns True if the element existed in the tree and has been
   *     removed, false if the element does not exist.
   */
  delete(interval: Interval): boolean {
    const node = this.find(interval);
    if(node !== undefined) {
      this.deleteNode(node);
      --this._size;
      return true;
    } else {
      return false;
    }
  }

  /**
   * Find all of the values which intersect the given interval.
   *
   * @param query The interval to test.
   */
  *search(query: Interval): IterableIterator<V> {
    if(this.root === null || this._root.nil) return;

    let stack: ITreeNode<V>[] = [this._root];

    while(stack.length !== 0) {
      const top = stack.pop();

      if(!top.left.nil && top.left.max >= query[0]) {
        // search left
        stack.push(top.left);
      }

      if(intervalsIntersect(top.key, query)) {
        yield top.value;
      }

      if(!top.right.nil && top.key[0] <= query[1]) {
        // search right
        stack.push(top.right);
      }
    }
  }

  /**
   * Get the number of intervals.
   */
  get size(): number {
    return this._size;
  }

  protected rotateLeft(x: ITreeNode<V>) {
    const y = x.right;

    x.right = y.left;
    if(!y.left.nil) {
      y.left.parent = x;
    }

    if(!y.nil) {
      y.parent = x.parent;
    }

    if(x.parent !== null) {
      if(x === x.parent.left) {
        x.parent.left = y;
      } else {
        x.parent.right = y;
      }
    } else {
      this._root = y;
    }

    y.left = x;
    if(!x.nil) {
      x.parent = y;
      updateNodeMax(x);
    }

    if(!y.nil) {
      updateNodeMax(y);
    }
  }

  protected rotateRight(x: ITreeNode<V>) {
    const y = x.left;

    x.left = y.right;
    if(!y.right.nil) {
      y.right.parent = x;
    }

    if(!y.nil) {
      y.parent = x.parent;
    }

    if(x.parent !== null) {
      if(x === x.parent.right) {
        x.parent.right = y;
      } else {
        x.parent.left = y;
      }
    } else {
      this._root = y;
    }

    y.right = x;
    if(!x.nil) {
      x.parent = y;
      updateNodeMax(x);
    }

    if(!y.nil) {
      updateNodeMax(y);
    }
  }

  /**
   * Insert a new node into the tree.
   *
   * @param interval The interval.
   *
   * @param value The value.
   *
   * @returns The inserted node.
   */
  private insertNode(interval: Interval, value: V): ITreeNode<V> {
    let c: ITreeNode<V> = this._root;
    let parent: ITreeNode<V> | null = null;

    while(!c.nil) {
      parent = c;
      const ord = compareFn(interval, c.key);
      switch(ord) {
      case "EQ":
        // Note that we return before incrementing this._size here.
        c.value = value;
        return c;
      case "LT":
        c = c.left;
        break;
      case "GT":
        c = c.right;
        break;
      }
    }

    ++this._size;

    const node: ITreeNode<V> = {
      parent,
      left:  sentinel,
      right: sentinel,
      color: "red",
      key:   interval,
      value: value,
      nil:   false,
      max:   interval[1]
    };

    if(parent === null) {
      this._root = node;
    } else {
      const ord = compareFn(interval, parent.key);
      if(ord === "LT") {
        parent.left = node;
      } else {
        parent.right = node;
      }
    }

    this.insertFixup(node);
    updateParentsMax(node);
    return node;
  }

  /**
   * Delete a node from the tree.
   *
   * @param z The node to delete.
   */
  private deleteNode(z: ITreeNode<V>) {
    if(z === null || z.nil) return;

    // Find y, the deepest, leftmost node in the tree starting from
    // z. Thus, y has the key with the next highest value.
    let y: ITreeNode<V>;
    if(z.left.nil || z.right.nil) {
      y = z;
    } else {
      y = z.right;
      while (!y.left.nil) {
        y = y.left;
      }
    }

    // x is y's only child
    let x: ITreeNode<V>;
    if(!y.left.nil) {
      x = y.left;
    } else {
      x = y.right;
    }

    // delete y, putting x in its place
    x.parent = y.parent;
    if(y.parent !== null) {
      if(y === y.parent.left) {
        y.parent.left = x;
      } else {
        y.parent.right = x;
      }
      updateNodeMax(y.parent);
    } else {
      this._root = x;
    }

    updateParentsMax(x);

    // put y's contents where z was
    if(y !== z) {
      z.key = y.key;
      z.value = y.value;
      updateNodeMax(z);
      updateParentsMax(z);
    }

    if(y.color === "black") {
      this.deleteFixup(x);
    }
  }

  /**
   * Return the node with the given key, or undefined if it doesn't exist.
   */
  private find(interval: Interval): ITreeNode<V> | undefined {
    return this._find(interval, this._root);
  }

  /**
   * @see find
   */
  private _find(interval: Interval, root: ITreeNode<V> | null): ITreeNode<V> | undefined {
    if(root === null || root.nil) return undefined;

    const c = compareFn(interval, root.key);
    switch(c) {
    case "LT":
      return this._find(interval, root.left);
    case "GT":
      return this._find(interval, root.right);
    case "EQ":
      return root;
    }
  }
}
