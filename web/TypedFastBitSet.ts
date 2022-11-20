/**
 * This file forked from https://github.com/lemire/TypedFastBitSet.js.
 * See that repo for license info.
 */

/**
 * TypedFastBitSet.js : a fast bit set implementation in JavaScript.
 * (c) the authors
 * Licensed under the Apache License, Version 2.0.
 *
 * Speed-optimized BitSet implementation for modern browsers and JavaScript engines.
 *
 * A BitSet is an ideal data structure to implement a Set when values being stored are
 * reasonably small integers. It can be orders of magnitude faster than a generic set implementation.
 * The FastBitSet implementation optimizes for speed, leveraging commonly available features
 * like typed arrays.
 *
 * Simple usage :
 *  const b = new TypedFastBitSet();// initially empty
 *         // will throw exception if typed arrays are not supported
 *  b.add(1);// add the value "1"
 *  b.has(1); // check that the value is present! (will return true)
 *  b.add(2);
 *  console.log(""+b);// should display {1,2}
 *  b.add(10);
 *  b.array(); // would return [1,2,10]
 *
 *  let c = new FastBitSet([1,2,3,10]); // create bitset initialized with values 1,2,3,10
 *  c.difference(b); // from c, remove elements that are in b (modifies c)
 *  c.difference2(b); // from c, remove elements that are in b (modifies b)
 *  c.change(b); // c will contain elements that are in b or in c, but not both
 *  const su = c.union_size(b);// compute the size of the union (bitsets are unchanged)
 *  c.union(b); // c will contain all elements that are in c and b
 *  const s1 = c.intersection_size(b);// compute the size of the intersection (bitsets are unchanged)
 *  c.intersection(b); // c will only contain elements that are in both c and b
 *  c = b.clone(); // create a (deep) copy of b and assign it to c.
 *  c.equals(b); // check whether c and b are equal

 *   See README.md file for a more complete description.
 *
 * You can install the library under node with the command line
 *   npm install typedfastbitset
 */
"use strict";

function isIterable(obj: any): obj is Iterable<any> {
  if (obj == null) {
    return false;
  }
  return obj[Symbol.iterator] !== undefined;
}

export class TypedFastBitSet {
  words: Uint32Array;

  // you can provide an iterable
  // an exception is thrown if typed arrays are not supported
  constructor(iterable?: Iterable<number>) {
    this.words = new Uint32Array(8);
    if (isIterable(iterable)) {
      for (const key of iterable) {
        this.add(key);
      }
    }
  }

  // Returns a new TypedFastBitset given a Uint32Array
  // of words
  static fromWords(words: Uint32Array) {
    const bs = new TypedFastBitSet();
    bs.words = words;
    return bs;
  }

  // Add the value (Set the bit at index to true)
  add(index: number) {
    this.resize(index);
    this.words[index >>> 5] |= 1 << index;
  }

  // If the value was not in the set, add it, otherwise remove it (flip bit at index)
  flip(index: number) {
    this.resize(index);
    this.words[index >>> 5] ^= 1 << index;
  }

  // Remove all values, reset memory usage
  clear() {
    this.words = new Uint32Array(8);
  }

  // Set the bit at index to false
  remove(index: number) {
    this.resize(index);
    this.words[index >>> 5] &= ~(1 << index);
  }

  // Set bits from start (inclusive) to end (exclusive)
  addRange(start: number, end: number) {
    if (start >= end) {
      return;
    }

    if (this.words.length << 5 <= end) {
      this.resize(end);
    }

    const firstword = start >> 5;
    const endword = (end - 1) >> 5;

    if (firstword === endword) {
      this.words[firstword] |= (~0 << start) & (~0 >>> -end);
      return;
    }
    this.words[firstword] |= ~0 << start;
    this.words.fill(~0, firstword + 1, endword);
    this.words[endword] |= ~0 >>> -end;
  }

  // Remove bits from start (inclusive) to end (exclusive)
  removeRange(start: number, end: number) {
    start = Math.min(start, (this.words.length << 5) - 1);
    end = Math.min(end, (this.words.length << 5) - 1);

    if (start >= end) {
      return;
    }
    const firstword = start >> 5;
    const endword = (end - 1) >> 5;

    if (firstword === endword) {
      this.words[firstword] &= ~((~0 << start) & (~0 >>> -end));
      return;
    }
    this.words[firstword] &= ~(~0 << start);
    this.words.fill(0, firstword + 1, endword);
    this.words[endword] &= ~(~0 >>> -end);
  }

  // Return true if no bit is set
  isEmpty() {
    const c = this.words.length;
    for (let i = 0; i < c; i++) {
      if (this.words[i] !== 0) return false;
    }
    return true;
  }

  // Is the value contained in the set? Is the bit at index true or false? Returns a boolean
  has(index: number) {
    return (this.words[index >>> 5] & (1 << index)) !== 0;
  }

  // Tries to add the value (Set the bit at index to true), return 1 if the
  // value was added, return 0 if the value was already present
  checkedAdd(index: number) {
    this.resize(index);
    const word = this.words[index >>> 5];
    const newword = word | (1 << index);
    this.words[index >>> 5] = newword;
    return (newword ^ word) >>> index;
  }

  // Reduce the memory usage to a minimum
  trim() {
    var nl = this.words.length;
    while (nl > 0 && this.words[nl - 1] === 0) {
      nl--;
    }
    this.words = this.words.slice(0, nl);
  }

  // Resize the bitset so that we can write a value at index
  resize(index: number) {
    if (this.words.length << 5 > index) return;
    const count = (index + 32) >>> 5; // just what is needed
    const newwords = new Uint32Array(count << 1);
    newwords.set(this.words); // hopefully, this copy is fast
    this.words = newwords;
  }

  // fast function to compute the Hamming weight of a 32-bit unsigned integer
  hammingWeight(v: number) {
    v -= (v >>> 1) & 0x55555555; // works with signed or unsigned shifts
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
    return (((v + (v >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24;
  }

  // fast function to compute the Hamming weight of four 32-bit unsigned integers
  hammingWeight4(v1: number, v2: number, v3: number, v4: number) {
    v1 -= (v1 >>> 1) & 0x55555555; // works with signed or unsigned shifts
    v2 -= (v2 >>> 1) & 0x55555555; // works with signed or unsigned shifts
    v3 -= (v3 >>> 1) & 0x55555555; // works with signed or unsigned shifts
    v4 -= (v4 >>> 1) & 0x55555555; // works with signed or unsigned shifts

    v1 = (v1 & 0x33333333) + ((v1 >>> 2) & 0x33333333);
    v2 = (v2 & 0x33333333) + ((v2 >>> 2) & 0x33333333);
    v3 = (v3 & 0x33333333) + ((v3 >>> 2) & 0x33333333);
    v4 = (v4 & 0x33333333) + ((v4 >>> 2) & 0x33333333);

    v1 = (v1 + (v1 >>> 4)) & 0xf0f0f0f;
    v2 = (v2 + (v2 >>> 4)) & 0xf0f0f0f;
    v3 = (v3 + (v3 >>> 4)) & 0xf0f0f0f;
    v4 = (v4 + (v4 >>> 4)) & 0xf0f0f0f;
    return ((v1 + v2 + v3 + v4) * 0x1010101) >>> 24;
  }

  // How many values stored in the set? How many set bits?
  size(): number {
    let answer = 0;
    const c = this.words.length;
    let k = 0 | 0;
    for (; k + 4 < c; k += 4) {
      answer += this.hammingWeight4(
        this.words[k] | 0,
        this.words[k + 1] | 0,
        this.words[k + 2] | 0,
        this.words[k + 3] | 0
      );
    }

    for (; k < c; ++k) {
      answer += this.hammingWeight(this.words[k] | 0);
    }
    return answer;
  }

  // Return an array with the set bit locations (values)
  array() {
    const answer = new Array(this.size());
    let pos = 0 | 0;
    const c = this.words.length;
    for (let k = 0; k < c; ++k) {
      let w = this.words[k];
      while (w != 0) {
        const t = w & -w;
        answer[pos++] = (k << 5) + this.hammingWeight((t - 1) | 0);
        w ^= t;
      }
    }
    return answer;
  }

  // Return an array with the set bit locations (values)
  forEach(fnc: (index: number) => void) {
    const c = this.words.length;
    for (let k = 0; k < c; ++k) {
      let w = this.words[k];
      while (w != 0) {
        const t = w & -w;
        fnc(((k << 5) + this.hammingWeight(t - 1)) | 0);
        w ^= t;
      }
    }
  }

  // Returns an iterator of set bit locations (values)
  *[Symbol.iterator]() {
    const c = this.words.length;
    for (let k = 0; k < c; ++k) {
      let w = this.words[k];
      while (w != 0) {
        const t = w & -w;
        yield (k << 5) + this.hammingWeight((t - 1) | 0);
        w ^= t;
      }
    }
  }

  // Creates a copy of this bitmap
  clone() {
    const clone = new TypedFastBitSet();
    clone.words = new Uint32Array(this.words);
    return clone;
  }

  // Check if this bitset intersects with another one,
  // no bitmap is modified
  intersects(otherbitmap: TypedFastBitSet) {
    const newcount = Math.min(this.words.length, otherbitmap.words.length);
    for (let k = 0 | 0; k < newcount; ++k) {
      if ((this.words[k] & otherbitmap.words[k]) !== 0) return true;
    }
    return false;
  }

  // Computes the intersection between this bitset and another one,
  // the current bitmap is modified  (and returned by the function)
  intersection(otherbitmap: TypedFastBitSet) {
    const newcount = Math.min(this.words.length, otherbitmap.words.length);
    let k = 0 | 0;
    for (; k + 7 < newcount; k += 8) {
      this.words[k] &= otherbitmap.words[k];
      this.words[k + 1] &= otherbitmap.words[k + 1];
      this.words[k + 2] &= otherbitmap.words[k + 2];
      this.words[k + 3] &= otherbitmap.words[k + 3];
      this.words[k + 4] &= otherbitmap.words[k + 4];
      this.words[k + 5] &= otherbitmap.words[k + 5];
      this.words[k + 6] &= otherbitmap.words[k + 6];
      this.words[k + 7] &= otherbitmap.words[k + 7];
    }
    for (; k < newcount; ++k) {
      this.words[k] &= otherbitmap.words[k];
    }
    const c = this.words.length;
    for (let k = newcount; k < c; ++k) {
      this.words[k] = 0;
    }
    return this;
  }

  // Computes the size of the intersection between this bitset and another one
  intersection_size(otherbitmap: TypedFastBitSet) {
    const newcount = Math.min(this.words.length, otherbitmap.words.length);
    let answer = 0 | 0;
    for (let k = 0 | 0; k < newcount; ++k) {
      answer += this.hammingWeight(this.words[k] & otherbitmap.words[k]);
    }
    return answer;
  }

  // Computes the intersection between this bitset and another one,
  // a new bitmap is generated
  new_intersection(otherbitmap: TypedFastBitSet) {
    const answer = new TypedFastBitSet();
    const count = Math.min(this.words.length, otherbitmap.words.length);
    answer.words = new Uint32Array(count);
    let k = 0 | 0;
    for (; k + 7 < count; k += 8) {
      answer.words[k] = this.words[k] & otherbitmap.words[k];
      answer.words[k + 1] = this.words[k + 1] & otherbitmap.words[k + 1];
      answer.words[k + 2] = this.words[k + 2] & otherbitmap.words[k + 2];
      answer.words[k + 3] = this.words[k + 3] & otherbitmap.words[k + 3];
      answer.words[k + 4] = this.words[k + 4] & otherbitmap.words[k + 4];
      answer.words[k + 5] = this.words[k + 5] & otherbitmap.words[k + 5];
      answer.words[k + 6] = this.words[k + 6] & otherbitmap.words[k + 6];
      answer.words[k + 7] = this.words[k + 7] & otherbitmap.words[k + 7];
    }
    for (; k < count; ++k) {
      answer.words[k] = this.words[k] & otherbitmap.words[k];
    }
    return answer;
  }

  // Computes the intersection between this bitset and another one,
  // the current bitmap is modified
  equals(otherbitmap: TypedFastBitSet) {
    const mcount = Math.min(this.words.length, otherbitmap.words.length);
    for (let k = 0 | 0; k < mcount; ++k) {
      if (this.words[k] != otherbitmap.words[k]) return false;
    }
    if (this.words.length < otherbitmap.words.length) {
      const c = otherbitmap.words.length;
      for (let k = this.words.length; k < c; ++k) {
        if (otherbitmap.words[k] != 0) return false;
      }
    } else if (otherbitmap.words.length < this.words.length) {
      const c = this.words.length;
      for (let k = otherbitmap.words.length; k < c; ++k) {
        if (this.words[k] != 0) return false;
      }
    }
    return true;
  }

  // Computes the difference between this bitset and another one,
  // the current bitset is modified (and returned by the function)
  difference(otherbitmap: TypedFastBitSet) {
    const newcount = Math.min(this.words.length, otherbitmap.words.length);
    let k = 0 | 0;
    for (; k + 7 < newcount; k += 8) {
      this.words[k] &= ~otherbitmap.words[k];
      this.words[k + 1] &= ~otherbitmap.words[k + 1];
      this.words[k + 2] &= ~otherbitmap.words[k + 2];
      this.words[k + 3] &= ~otherbitmap.words[k + 3];
      this.words[k + 4] &= ~otherbitmap.words[k + 4];
      this.words[k + 5] &= ~otherbitmap.words[k + 5];
      this.words[k + 6] &= ~otherbitmap.words[k + 6];
      this.words[k + 7] &= ~otherbitmap.words[k + 7];
    }
    for (; k < newcount; ++k) {
      this.words[k] &= ~otherbitmap.words[k];
    }
    return this;
  }

  // Computes the difference between this bitset and another one,
  // the other bitset is modified (and returned by the function)
  // (for this set A and other set B,
  //   this computes B = A - B  and returns B)
  difference2(otherbitmap: TypedFastBitSet) {
    const mincount = Math.min(this.words.length, otherbitmap.words.length);
    otherbitmap.resize((this.words.length << 5) - 1);
    let k = 0 | 0;
    for (; k + 7 < mincount; k += 8) {
      otherbitmap.words[k] = this.words[k] & ~otherbitmap.words[k];
      otherbitmap.words[k + 1] = this.words[k + 1] & ~otherbitmap.words[k + 1];
      otherbitmap.words[k + 2] = this.words[k + 2] & ~otherbitmap.words[k + 2];
      otherbitmap.words[k + 3] = this.words[k + 3] & ~otherbitmap.words[k + 3];
      otherbitmap.words[k + 4] = this.words[k + 4] & ~otherbitmap.words[k + 4];
      otherbitmap.words[k + 5] = this.words[k + 5] & ~otherbitmap.words[k + 5];
      otherbitmap.words[k + 6] = this.words[k + 6] & ~otherbitmap.words[k + 6];
      otherbitmap.words[k + 7] = this.words[k + 7] & ~otherbitmap.words[k + 7];
    }
    for (; k < mincount; ++k) {
      otherbitmap.words[k] = this.words[k] & ~otherbitmap.words[k];
    }
    // remaining words are all part of difference
    for (; k < this.words.length; ++k) {
      otherbitmap.words[k] = this.words[k];
    }
    otherbitmap.words.fill(0, k);
    return otherbitmap;
  }

  // Computes the difference between this bitset and another one,
  // a new bitmap is generated
  new_difference(otherbitmap: TypedFastBitSet) {
    return this.clone().difference(otherbitmap); // should be fast enough
  }

  // Computes the size of the difference between this bitset and another one
  difference_size(otherbitmap: TypedFastBitSet) {
    const newcount = Math.min(this.words.length, otherbitmap.words.length);
    let answer = 0 | 0;
    let k = 0 | 0;
    for (; k < newcount; ++k) {
      answer += this.hammingWeight(this.words[k] & ~otherbitmap.words[k]);
    }
    const c = this.words.length;
    for (; k < c; ++k) {
      answer += this.hammingWeight(this.words[k]);
    }
    return answer;
  }

  // Computes the changed elements (XOR) between this bitset and another one,
  // the current bitset is modified (and returned by the function)
  change(otherbitmap: TypedFastBitSet) {
    const mincount = Math.min(this.words.length, otherbitmap.words.length);
    this.resize((otherbitmap.words.length << 5) - 1);
    let k = 0 | 0;
    for (; k + 7 < mincount; k += 8) {
      this.words[k] ^= otherbitmap.words[k];
      this.words[k + 1] ^= otherbitmap.words[k + 1];
      this.words[k + 2] ^= otherbitmap.words[k + 2];
      this.words[k + 3] ^= otherbitmap.words[k + 3];
      this.words[k + 4] ^= otherbitmap.words[k + 4];
      this.words[k + 5] ^= otherbitmap.words[k + 5];
      this.words[k + 6] ^= otherbitmap.words[k + 6];
      this.words[k + 7] ^= otherbitmap.words[k + 7];
    }
    for (; k < mincount; ++k) {
      this.words[k] ^= otherbitmap.words[k];
    }
    // remaining words are all part of change
    for (; k < otherbitmap.words.length; ++k) {
      this.words[k] = otherbitmap.words[k];
    }
    return this;
  }

  // Computes the change between this bitset and another one,
  // a new bitmap is generated
  new_change(otherbitmap: TypedFastBitSet) {
    const answer = new TypedFastBitSet();
    const count = Math.max(this.words.length, otherbitmap.words.length);
    answer.words = new Uint32Array(count);
    const mcount = Math.min(this.words.length, otherbitmap.words.length);
    let k = 0;
    for (; k + 7 < mcount; k += 8) {
      answer.words[k] = this.words[k] ^ otherbitmap.words[k];
      answer.words[k + 1] = this.words[k + 1] ^ otherbitmap.words[k + 1];
      answer.words[k + 2] = this.words[k + 2] ^ otherbitmap.words[k + 2];
      answer.words[k + 3] = this.words[k + 3] ^ otherbitmap.words[k + 3];
      answer.words[k + 4] = this.words[k + 4] ^ otherbitmap.words[k + 4];
      answer.words[k + 5] = this.words[k + 5] ^ otherbitmap.words[k + 5];
      answer.words[k + 6] = this.words[k + 6] ^ otherbitmap.words[k + 6];
      answer.words[k + 7] = this.words[k + 7] ^ otherbitmap.words[k + 7];
    }
    for (; k < mcount; ++k) {
      answer.words[k] = this.words[k] ^ otherbitmap.words[k];
    }

    const c = this.words.length;
    for (k = mcount; k < c; ++k) {
      answer.words[k] = this.words[k];
    }
    const c2 = otherbitmap.words.length;
    for (k = mcount; k < c2; ++k) {
      answer.words[k] = otherbitmap.words[k];
    }
    return answer;
  }

  // Computes the number of changed elements between this bitset and another one
  change_size(otherbitmap: TypedFastBitSet) {
    const mincount = Math.min(this.words.length, otherbitmap.words.length);
    let answer = 0 | 0;
    let k = 0 | 0;
    for (; k < mincount; ++k) {
      answer += this.hammingWeight(this.words[k] ^ otherbitmap.words[k]);
    }
    const longer =
      this.words.length > otherbitmap.words.length ? this : otherbitmap;
    const c = longer.words.length;
    for (; k < c; ++k) {
      answer += this.hammingWeight(longer.words[k]);
    }
    return answer;
  }

  // Returns a string representation
  toString() {
    return "{" + this.array().join(",") + "}";
  }

  // Computes the union between this bitset and another one,
  // the current bitset is modified  (and returned by the function)
  union(otherbitmap: TypedFastBitSet) {
    const mcount = Math.min(this.words.length, otherbitmap.words.length);
    let k = 0 | 0;
    for (; k + 7 < mcount; k += 8) {
      this.words[k] |= otherbitmap.words[k];
      this.words[k + 1] |= otherbitmap.words[k + 1];
      this.words[k + 2] |= otherbitmap.words[k + 2];
      this.words[k + 3] |= otherbitmap.words[k + 3];
      this.words[k + 4] |= otherbitmap.words[k + 4];
      this.words[k + 5] |= otherbitmap.words[k + 5];
      this.words[k + 6] |= otherbitmap.words[k + 6];
      this.words[k + 7] |= otherbitmap.words[k + 7];
    }
    for (; k < mcount; ++k) {
      this.words[k] |= otherbitmap.words[k];
    }
    if (this.words.length < otherbitmap.words.length) {
      this.resize((otherbitmap.words.length << 5) - 1);
      const c = otherbitmap.words.length;
      for (let k = mcount; k < c; ++k) {
        this.words[k] = otherbitmap.words[k];
      }
    }
    return this;
  }

  // Computes the union between this bitset and another one,
  // a new bitmap is generated
  new_union(otherbitmap: TypedFastBitSet) {
    const answer = new TypedFastBitSet();
    const count = Math.max(this.words.length, otherbitmap.words.length);
    answer.words = new Uint32Array(count);
    const mcount = Math.min(this.words.length, otherbitmap.words.length);
    for (let k = 0; k < mcount; ++k) {
      answer.words[k] = this.words[k] | otherbitmap.words[k];
    }
    const c = this.words.length;
    for (let k = mcount; k < c; ++k) {
      answer.words[k] = this.words[k];
    }
    const c2 = otherbitmap.words.length;
    for (let k = mcount; k < c2; ++k) {
      answer.words[k] = otherbitmap.words[k];
    }
    return answer;
  }

  // Computes the size union between this bitset and another one
  union_size(otherbitmap: TypedFastBitSet) {
    const mcount = Math.min(this.words.length, otherbitmap.words.length);
    let answer = 0 | 0;
    for (let k = 0 | 0; k < mcount; ++k) {
      answer += this.hammingWeight(this.words[k] | otherbitmap.words[k]);
    }
    if (this.words.length < otherbitmap.words.length) {
      const c = otherbitmap.words.length;
      for (let k = this.words.length; k < c; ++k) {
        answer += this.hammingWeight(otherbitmap.words[k] | 0);
      }
    } else {
      const c = this.words.length;
      for (let k = otherbitmap.words.length; k < c; ++k) {
        answer += this.hammingWeight(this.words[k] | 0);
      }
    }
    return answer;
  }
}
