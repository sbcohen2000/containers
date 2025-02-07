import { Node, CompareFn, AbstractRBTree } from "./red-black-common";
/*
 * Implementation based on:
 * https://www.eecs.umich.edu/courses/eecs380/ALG/niemann/s_rbt.htm
 */

type RBNode<K, V> = Node<K, V> & {
  parent: RBNode<K, V> | null,
  left:   RBNode<K, V>,
  right:  RBNode<K, V>,
};

const sentinel: RBNode<any, any> = {
  parent: null,
  left:   null,
  right:  null,
  color:  "black",
  key:    null,
  value:  null,
  nil:    true
};

export const defaultCompareFunction: CompareFn<any> = (a, b) => {
  if(a === b) {
    return "EQ";
  } else if(a < b) {
    return "LT";
  } else {
    return "GT";
  }
}

export class RBTree<K, V> extends AbstractRBTree<K, V> {
  /**
   * The root of the red-black tree
   */
  private _root: RBNode<K, V> = sentinel;

  /**
   * The number of nodes in the tree.
   */
  private _size: number = 0;

  private _compareFn: CompareFn<K>;

  constructor(compareFn?: CompareFn<K>) {
    super();
    if(compareFn === undefined) {
      this._compareFn = defaultCompareFunction;
    } else {
      this._compareFn = compareFn;
    }
  }

  protected compareFn(): CompareFn<K> {
    return this._compareFn;
  }

  protected root(): RBNode<K, V> {
    return this._root;
  }

  /**
   * Check if the map contains a value with the given key.
   *
   * @param key The value's key.
   *
   * @returns True if the map contains the key, false otherwise.
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Retrieve a value by its key, returning undefined if the value
   * isn't in the map.
   *
   * @param key The value's key.
   *
   * @returns The value or undefined.
   */
  get(key: K): V | undefined {
    return this.find(key)?.value;
  }

  /**
   * Associate a key with a value. If the key is already associated
   * with a value, the value is updated.
   *
   * @param key The key to set.
   *
   * @param value The value to store at the key.
   *
   * @returns The map.
   */
  set(key: K, value: V): RBTree<K, V> {
    this.insertNode(key, value);
    return this;
  }

  /**
   * Delete a key and its associated value from the map. If the key
   * does not exist in the map, this is a no-op.
   *
   * @param key The key to delete.
   *
   * @returns True if the element existed in the tree and has been
   *     removed, false if the element does not exist.
   */
  delete(key: K): boolean {
    const node = this.find(key);
    if(node !== undefined) {
      this.deleteNode(node);
      --this._size;
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get the number of entries in the map.
   */
  get size(): number {
    return this._size;
  }

  protected rotateLeft(x: RBNode<K, V>) {
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
    }
  }

  protected rotateRight(x: RBNode<K, V>) {
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
    }
  }

  /**
   * Insert a new node into the tree.
   *
   * @param key The key.
   *
   * @param value The value.
   *
   * @returns The inserted node.
   */
  private insertNode(key: K, value: V): RBNode<K, V> {
    let c: RBNode<K, V> = this._root;
    let parent: RBNode<K, V> | null = null;

    while(!c.nil) {
      parent = c;
      const ord = this.compareFn()(key, c.key);
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

    const node: RBNode<K, V> = {
      parent,
      left: sentinel,
      right: sentinel,
      color: "red",
      key,
      value,
      nil: false
    };

    if(parent === null) {
      this._root = node;
    } else {
      const ord = this.compareFn()(key, parent.key);
      if(ord === "LT") {
        parent.left = node;
      } else {
        parent.right = node;
      }
    }

    this.insertFixup(node);
    return node;
  }

  /**
   * Delete a node from the tree.
   *
   * @param z The node to delete.
   */
  private deleteNode(z: RBNode<K, V>) {
    if(z === null || z.nil) return;

    // Find y, the deepest, leftmost node in the tree starting from
    // z. Thus, y has the key with the next highest value.
    let y: RBNode<K, V>;
    if(z.left.nil || z.right.nil) {
      y = z;
    } else {
      y = z.right;
      while (!y.left.nil) {
        y = y.left;
      }
    }

    // x is y's only child
    let x: RBNode<K, V>;
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
    } else {
      this._root = x;
    }

    // put y's contents where z was
    if(y !== z) {
      z.key = y.key;
      z.value = y.value;
    }

    if(y.color === "black") {
      this.deleteFixup(x);
    }
  }

  /**
   * Return the node with the given key, or undefined if it doesn't exist.
   */
  private find(key: K): RBNode<K, V> | undefined {
    return this._find(key, this._root);
  }

  /**
   * @see find
   */
  private _find(key: K, root: RBNode<K, V> | null): RBNode<K, V> | undefined {
    if(root === null || root.nil) return undefined;

    const c = this.compareFn()(key, root.key);
    switch(c) {
    case "LT":
      return this._find(key, root.left);
    case "GT":
      return this._find(key, root.right);
    case "EQ":
      return root;
    }
  }
}
