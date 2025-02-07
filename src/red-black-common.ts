export type Node<K, V> = {
  parent: Node<K, V> | null;
  left:   Node<K, V>;
  right:  Node<K, V>;
  color:  "red" | "black";
  value:  V;
  key:    K;
  nil:    false;
} | {
  // leaf
  parent: null;
  left:   null;
  right:  null;
  color:  "black";
  value:  null;
  key:    null;
  nil:    true;
};

export type Ordering = "LT" | "GT" | "EQ";
export type CompareFn<K> = (a: K, b: K) => Ordering;

export abstract class AbstractRBTree<K, V> {

  protected abstract root(): Node<K, V>;
  protected abstract rotateLeft(n: Node<K, V>): void;
  protected abstract rotateRight(n: Node<K, V>): void;
  protected abstract compareFn(): CompareFn<K>;

  /**
   * Maintain tree balance after deleting `node`.
   *
   * @param x The deleted node.
   */
  protected deleteFixup(x: Node<K, V>) {
    while(x !== this.root() && x.color === "black") {
      if(x === x.parent.left) {
        let w = x.parent.right;
        if(w.color === "red") {
          w.color = "black";
          x.parent.color = "red";
          this.rotateLeft(x.parent);
          w = x.parent.right;
        }
        if(w.left.color === "black" && w.right.color === "black") {
          w.color = "red";
          x = x.parent;
        } else {
          if(w.right.color === "black") {
            w.left.color = "black";
            w.color = "red";
            this.rotateRight(w);
            w = x.parent.right;
          }
          w.color = x.parent.color;
          x.parent.color = "black";
          w.right.color = "black";
          this.rotateLeft(x.parent);
          x = this.root(); // done
        }
      } else {
        // Mirror image of the above
        let w = x.parent.left;
        if(w.color === "red") {
          w.color = "black";
          x.parent.color = "red";
          this.rotateRight(x.parent);
          w = x.parent.left;
        }
        if(w.right.color === "black" && w.left.color === "black") {
          w.color = "red";
          x = x.parent;
        } else {
          if(w.left.color === "black") {
            w.right.color = "black";
            w.color = "red";
            this.rotateLeft(w);
            w = x.parent.left;
          }
          w.color = x.parent.color;
          x.parent.color = "black";
          w.left.color = "black";
          this.rotateRight(x.parent);
          x = this.root();
        }
      }
    }
    x.color = "black";
  }

  /**
   * Maintain tree balance after inserting `node`.
   *
   * @param x The inserted node.
   */
  protected insertFixup(x: Node<K, V>) {
    while(x !== this.root() && x.parent.color === "red") {
      if(x.parent === x.parent.parent.left) {
        const y = x.parent.parent.right;
        if(y.color === "red") {
          x.parent.color = "black";
          y.color = "black";
          x.parent.parent.color = "red";
          x = x.parent.parent;
        } else {
          // uncle is black
          if(x === x.parent.right) {
            x = x.parent;
            this.rotateLeft(x);
          }

          x.parent.color = "black";
          x.parent.parent.color = "red";
          this.rotateRight(x.parent.parent);
        }
      } else {
        // Mirror image of the above
        const y = x.parent.parent.left;
        if(y.color === "red") {
          x.parent.color = "black";
          y.color = "black";
          x.parent.parent.color = "red";
          x = x.parent.parent;
        } else {
          if(x === x.parent.left) {
            x = x.parent;
            this.rotateRight(x);
          }
          x.parent.color = "black";
          x.parent.parent.color = "red";
          this.rotateLeft(x.parent.parent);
        }
      }
    }
    this.root().color = "black";
  }

  /**
   * Iterate over the keys and values of the map from least to
   * greatest key.
   */
  *entries(): IterableIterator<[K, V]> {
    if(this.root === null || this.root().nil) return;

    // in-order traversal
    let stack: Node<K, V>[] = [];
    let c: Node<K, V> = this.root();

    while(!c.nil || stack.length !== 0) {
      while(!c.nil) {
        stack.push(c);
        c = c.left;
      }

      c = stack.pop();

      yield [c.key, c.value];

      c = c.right;
    }
  }

  /**
   * Check if the red-black tree is balanced. This function
   * should always return true.
   */
  checkBalanceInvariant(): boolean {
    const traverse = (root: Node<K, V>) => {
      if(root === null || root.nil) return [0, 0];

      const [l1, s1] = traverse(root.left);
      const [l2, s2] = traverse(root.right);
      return [Math.max(l1, l2) + 1, Math.min(s1, s2) + 1];
    }

    const [longestLength, shortestLength] = traverse(this.root());
    return longestLength <= shortestLength * 2;
  }

  /**
   * Check if the red-black tree maintains the invariant that the keys
   * of left children are less than the parent, while the keys of
   * right children are greater. This function should always return
   * true.
   */
  checkOrderInvariant(): boolean {
    const traverse = (root: Node<K, V>, min: K | undefined, max: K | undefined): boolean => {
      if(root.nil) return true;

      // Check that:
      //  1. Root key is less than min
      //  2. Root key is greater than max
      //  3. Left subtree is well ordered
      //  4. Right subtree is well ordered
      return (!min || this.compareFn()(root.key, min) === "GT")
        && (!max || this.compareFn()(root.key, max) === "LT")
        && (root.left.nil || traverse(root.left, min, root.key))
        && (root.right.nil || traverse(root.right, root.key, max));
    }

    return traverse(this.root(), undefined, undefined);
  }

  /**
   * Return a representation of the red-black tree using graphviz dot syntax.
   */
  toGraphviz(): string {
    let g = "digraph G {\n";

    let currentRBNodeId = 0;
    const nextNodeId = () => {
      return `e${currentRBNodeId++}`;
    }

    const traverse = (root: Node<K, V> | null): string | null => {
      if(root === null || root.nil) return null;

      const nodeId = nextNodeId();
      g += `${nodeId} [label="${root.key}" shape=circle color=${root.color}];\n`

      const leftId = traverse(root.left);
      const rightId = traverse(root.right);

      if(leftId !== null) {
        g += `${nodeId} -> ${leftId};\n`;
      }

      if(rightId !== null) {
        g += `${nodeId} -> ${rightId};\n`;
      }

      return nodeId;
    }

    traverse(this.root());

    g += "}\n";
    return g;
  }

}
