"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // TypedFastBitSet.ts
  function isIterable(obj) {
    if (obj == null) {
      return false;
    }
    return obj[Symbol.iterator] !== void 0;
  }
  var TypedFastBitSet = class {
    constructor(iterable) {
      __publicField(this, "words");
      this.words = new Uint32Array(8);
      if (isIterable(iterable)) {
        for (const key of iterable) {
          this.add(key);
        }
      }
    }
    static fromWords(words) {
      const bs = new TypedFastBitSet();
      bs.words = words;
      return bs;
    }
    add(index) {
      this.resize(index);
      this.words[index >>> 5] |= 1 << index;
    }
    flip(index) {
      this.resize(index);
      this.words[index >>> 5] ^= 1 << index;
    }
    clear() {
      this.words = new Uint32Array(8);
    }
    remove(index) {
      this.resize(index);
      this.words[index >>> 5] &= ~(1 << index);
    }
    addRange(start2, end) {
      if (start2 >= end) {
        return;
      }
      if (this.words.length << 5 <= end) {
        this.resize(end);
      }
      const firstword = start2 >> 5;
      const endword = end - 1 >> 5;
      if (firstword === endword) {
        this.words[firstword] |= ~0 << start2 & ~0 >>> -end;
        return;
      }
      this.words[firstword] |= ~0 << start2;
      this.words.fill(~0, firstword + 1, endword);
      this.words[endword] |= ~0 >>> -end;
    }
    removeRange(start2, end) {
      start2 = Math.min(start2, (this.words.length << 5) - 1);
      end = Math.min(end, (this.words.length << 5) - 1);
      if (start2 >= end) {
        return;
      }
      const firstword = start2 >> 5;
      const endword = end - 1 >> 5;
      if (firstword === endword) {
        this.words[firstword] &= ~(~0 << start2 & ~0 >>> -end);
        return;
      }
      this.words[firstword] &= ~(~0 << start2);
      this.words.fill(0, firstword + 1, endword);
      this.words[endword] &= ~(~0 >>> -end);
    }
    isEmpty() {
      const c3 = this.words.length;
      for (let i3 = 0; i3 < c3; i3++) {
        if (this.words[i3] !== 0)
          return false;
      }
      return true;
    }
    has(index) {
      return (this.words[index >>> 5] & 1 << index) !== 0;
    }
    checkedAdd(index) {
      this.resize(index);
      const word = this.words[index >>> 5];
      const newword = word | 1 << index;
      this.words[index >>> 5] = newword;
      return (newword ^ word) >>> index;
    }
    trim() {
      var nl = this.words.length;
      while (nl > 0 && this.words[nl - 1] === 0) {
        nl--;
      }
      this.words = this.words.slice(0, nl);
    }
    resize(index) {
      if (this.words.length << 5 > index)
        return;
      const count = index + 32 >>> 5;
      const newwords = new Uint32Array(count << 1);
      newwords.set(this.words);
      this.words = newwords;
    }
    hammingWeight(v3) {
      v3 -= v3 >>> 1 & 1431655765;
      v3 = (v3 & 858993459) + (v3 >>> 2 & 858993459);
      return (v3 + (v3 >>> 4) & 252645135) * 16843009 >>> 24;
    }
    hammingWeight4(v1, v22, v3, v4) {
      v1 -= v1 >>> 1 & 1431655765;
      v22 -= v22 >>> 1 & 1431655765;
      v3 -= v3 >>> 1 & 1431655765;
      v4 -= v4 >>> 1 & 1431655765;
      v1 = (v1 & 858993459) + (v1 >>> 2 & 858993459);
      v22 = (v22 & 858993459) + (v22 >>> 2 & 858993459);
      v3 = (v3 & 858993459) + (v3 >>> 2 & 858993459);
      v4 = (v4 & 858993459) + (v4 >>> 2 & 858993459);
      v1 = v1 + (v1 >>> 4) & 252645135;
      v22 = v22 + (v22 >>> 4) & 252645135;
      v3 = v3 + (v3 >>> 4) & 252645135;
      v4 = v4 + (v4 >>> 4) & 252645135;
      return (v1 + v22 + v3 + v4) * 16843009 >>> 24;
    }
    size() {
      let answer = 0;
      const c3 = this.words.length;
      let k3 = 0 | 0;
      for (; k3 + 4 < c3; k3 += 4) {
        answer += this.hammingWeight4(
          this.words[k3] | 0,
          this.words[k3 + 1] | 0,
          this.words[k3 + 2] | 0,
          this.words[k3 + 3] | 0
        );
      }
      for (; k3 < c3; ++k3) {
        answer += this.hammingWeight(this.words[k3] | 0);
      }
      return answer;
    }
    array() {
      const answer = new Array(this.size());
      let pos = 0 | 0;
      const c3 = this.words.length;
      for (let k3 = 0; k3 < c3; ++k3) {
        let w3 = this.words[k3];
        while (w3 != 0) {
          const t3 = w3 & -w3;
          answer[pos++] = (k3 << 5) + this.hammingWeight(t3 - 1 | 0);
          w3 ^= t3;
        }
      }
      return answer;
    }
    forEach(fnc) {
      const c3 = this.words.length;
      for (let k3 = 0; k3 < c3; ++k3) {
        let w3 = this.words[k3];
        while (w3 != 0) {
          const t3 = w3 & -w3;
          fnc((k3 << 5) + this.hammingWeight(t3 - 1) | 0);
          w3 ^= t3;
        }
      }
    }
    *[Symbol.iterator]() {
      const c3 = this.words.length;
      for (let k3 = 0; k3 < c3; ++k3) {
        let w3 = this.words[k3];
        while (w3 != 0) {
          const t3 = w3 & -w3;
          yield (k3 << 5) + this.hammingWeight(t3 - 1 | 0);
          w3 ^= t3;
        }
      }
    }
    clone() {
      const clone = new TypedFastBitSet();
      clone.words = new Uint32Array(this.words);
      return clone;
    }
    intersects(otherbitmap) {
      const newcount = Math.min(this.words.length, otherbitmap.words.length);
      for (let k3 = 0 | 0; k3 < newcount; ++k3) {
        if ((this.words[k3] & otherbitmap.words[k3]) !== 0)
          return true;
      }
      return false;
    }
    intersection(otherbitmap) {
      const newcount = Math.min(this.words.length, otherbitmap.words.length);
      let k3 = 0 | 0;
      for (; k3 + 7 < newcount; k3 += 8) {
        this.words[k3] &= otherbitmap.words[k3];
        this.words[k3 + 1] &= otherbitmap.words[k3 + 1];
        this.words[k3 + 2] &= otherbitmap.words[k3 + 2];
        this.words[k3 + 3] &= otherbitmap.words[k3 + 3];
        this.words[k3 + 4] &= otherbitmap.words[k3 + 4];
        this.words[k3 + 5] &= otherbitmap.words[k3 + 5];
        this.words[k3 + 6] &= otherbitmap.words[k3 + 6];
        this.words[k3 + 7] &= otherbitmap.words[k3 + 7];
      }
      for (; k3 < newcount; ++k3) {
        this.words[k3] &= otherbitmap.words[k3];
      }
      const c3 = this.words.length;
      for (let k4 = newcount; k4 < c3; ++k4) {
        this.words[k4] = 0;
      }
      return this;
    }
    intersection_size(otherbitmap) {
      const newcount = Math.min(this.words.length, otherbitmap.words.length);
      let answer = 0 | 0;
      for (let k3 = 0 | 0; k3 < newcount; ++k3) {
        answer += this.hammingWeight(this.words[k3] & otherbitmap.words[k3]);
      }
      return answer;
    }
    new_intersection(otherbitmap) {
      const answer = new TypedFastBitSet();
      const count = Math.min(this.words.length, otherbitmap.words.length);
      answer.words = new Uint32Array(count);
      let k3 = 0 | 0;
      for (; k3 + 7 < count; k3 += 8) {
        answer.words[k3] = this.words[k3] & otherbitmap.words[k3];
        answer.words[k3 + 1] = this.words[k3 + 1] & otherbitmap.words[k3 + 1];
        answer.words[k3 + 2] = this.words[k3 + 2] & otherbitmap.words[k3 + 2];
        answer.words[k3 + 3] = this.words[k3 + 3] & otherbitmap.words[k3 + 3];
        answer.words[k3 + 4] = this.words[k3 + 4] & otherbitmap.words[k3 + 4];
        answer.words[k3 + 5] = this.words[k3 + 5] & otherbitmap.words[k3 + 5];
        answer.words[k3 + 6] = this.words[k3 + 6] & otherbitmap.words[k3 + 6];
        answer.words[k3 + 7] = this.words[k3 + 7] & otherbitmap.words[k3 + 7];
      }
      for (; k3 < count; ++k3) {
        answer.words[k3] = this.words[k3] & otherbitmap.words[k3];
      }
      return answer;
    }
    equals(otherbitmap) {
      const mcount = Math.min(this.words.length, otherbitmap.words.length);
      for (let k3 = 0 | 0; k3 < mcount; ++k3) {
        if (this.words[k3] != otherbitmap.words[k3])
          return false;
      }
      if (this.words.length < otherbitmap.words.length) {
        const c3 = otherbitmap.words.length;
        for (let k3 = this.words.length; k3 < c3; ++k3) {
          if (otherbitmap.words[k3] != 0)
            return false;
        }
      } else if (otherbitmap.words.length < this.words.length) {
        const c3 = this.words.length;
        for (let k3 = otherbitmap.words.length; k3 < c3; ++k3) {
          if (this.words[k3] != 0)
            return false;
        }
      }
      return true;
    }
    difference(otherbitmap) {
      const newcount = Math.min(this.words.length, otherbitmap.words.length);
      let k3 = 0 | 0;
      for (; k3 + 7 < newcount; k3 += 8) {
        this.words[k3] &= ~otherbitmap.words[k3];
        this.words[k3 + 1] &= ~otherbitmap.words[k3 + 1];
        this.words[k3 + 2] &= ~otherbitmap.words[k3 + 2];
        this.words[k3 + 3] &= ~otherbitmap.words[k3 + 3];
        this.words[k3 + 4] &= ~otherbitmap.words[k3 + 4];
        this.words[k3 + 5] &= ~otherbitmap.words[k3 + 5];
        this.words[k3 + 6] &= ~otherbitmap.words[k3 + 6];
        this.words[k3 + 7] &= ~otherbitmap.words[k3 + 7];
      }
      for (; k3 < newcount; ++k3) {
        this.words[k3] &= ~otherbitmap.words[k3];
      }
      return this;
    }
    difference2(otherbitmap) {
      const mincount = Math.min(this.words.length, otherbitmap.words.length);
      otherbitmap.resize((this.words.length << 5) - 1);
      let k3 = 0 | 0;
      for (; k3 + 7 < mincount; k3 += 8) {
        otherbitmap.words[k3] = this.words[k3] & ~otherbitmap.words[k3];
        otherbitmap.words[k3 + 1] = this.words[k3 + 1] & ~otherbitmap.words[k3 + 1];
        otherbitmap.words[k3 + 2] = this.words[k3 + 2] & ~otherbitmap.words[k3 + 2];
        otherbitmap.words[k3 + 3] = this.words[k3 + 3] & ~otherbitmap.words[k3 + 3];
        otherbitmap.words[k3 + 4] = this.words[k3 + 4] & ~otherbitmap.words[k3 + 4];
        otherbitmap.words[k3 + 5] = this.words[k3 + 5] & ~otherbitmap.words[k3 + 5];
        otherbitmap.words[k3 + 6] = this.words[k3 + 6] & ~otherbitmap.words[k3 + 6];
        otherbitmap.words[k3 + 7] = this.words[k3 + 7] & ~otherbitmap.words[k3 + 7];
      }
      for (; k3 < mincount; ++k3) {
        otherbitmap.words[k3] = this.words[k3] & ~otherbitmap.words[k3];
      }
      for (; k3 < this.words.length; ++k3) {
        otherbitmap.words[k3] = this.words[k3];
      }
      otherbitmap.words.fill(0, k3);
      return otherbitmap;
    }
    new_difference(otherbitmap) {
      return this.clone().difference(otherbitmap);
    }
    difference_size(otherbitmap) {
      const newcount = Math.min(this.words.length, otherbitmap.words.length);
      let answer = 0 | 0;
      let k3 = 0 | 0;
      for (; k3 < newcount; ++k3) {
        answer += this.hammingWeight(this.words[k3] & ~otherbitmap.words[k3]);
      }
      const c3 = this.words.length;
      for (; k3 < c3; ++k3) {
        answer += this.hammingWeight(this.words[k3]);
      }
      return answer;
    }
    change(otherbitmap) {
      const mincount = Math.min(this.words.length, otherbitmap.words.length);
      this.resize((otherbitmap.words.length << 5) - 1);
      let k3 = 0 | 0;
      for (; k3 + 7 < mincount; k3 += 8) {
        this.words[k3] ^= otherbitmap.words[k3];
        this.words[k3 + 1] ^= otherbitmap.words[k3 + 1];
        this.words[k3 + 2] ^= otherbitmap.words[k3 + 2];
        this.words[k3 + 3] ^= otherbitmap.words[k3 + 3];
        this.words[k3 + 4] ^= otherbitmap.words[k3 + 4];
        this.words[k3 + 5] ^= otherbitmap.words[k3 + 5];
        this.words[k3 + 6] ^= otherbitmap.words[k3 + 6];
        this.words[k3 + 7] ^= otherbitmap.words[k3 + 7];
      }
      for (; k3 < mincount; ++k3) {
        this.words[k3] ^= otherbitmap.words[k3];
      }
      for (; k3 < otherbitmap.words.length; ++k3) {
        this.words[k3] = otherbitmap.words[k3];
      }
      return this;
    }
    new_change(otherbitmap) {
      const answer = new TypedFastBitSet();
      const count = Math.max(this.words.length, otherbitmap.words.length);
      answer.words = new Uint32Array(count);
      const mcount = Math.min(this.words.length, otherbitmap.words.length);
      let k3 = 0;
      for (; k3 + 7 < mcount; k3 += 8) {
        answer.words[k3] = this.words[k3] ^ otherbitmap.words[k3];
        answer.words[k3 + 1] = this.words[k3 + 1] ^ otherbitmap.words[k3 + 1];
        answer.words[k3 + 2] = this.words[k3 + 2] ^ otherbitmap.words[k3 + 2];
        answer.words[k3 + 3] = this.words[k3 + 3] ^ otherbitmap.words[k3 + 3];
        answer.words[k3 + 4] = this.words[k3 + 4] ^ otherbitmap.words[k3 + 4];
        answer.words[k3 + 5] = this.words[k3 + 5] ^ otherbitmap.words[k3 + 5];
        answer.words[k3 + 6] = this.words[k3 + 6] ^ otherbitmap.words[k3 + 6];
        answer.words[k3 + 7] = this.words[k3 + 7] ^ otherbitmap.words[k3 + 7];
      }
      for (; k3 < mcount; ++k3) {
        answer.words[k3] = this.words[k3] ^ otherbitmap.words[k3];
      }
      const c3 = this.words.length;
      for (k3 = mcount; k3 < c3; ++k3) {
        answer.words[k3] = this.words[k3];
      }
      const c22 = otherbitmap.words.length;
      for (k3 = mcount; k3 < c22; ++k3) {
        answer.words[k3] = otherbitmap.words[k3];
      }
      return answer;
    }
    change_size(otherbitmap) {
      const mincount = Math.min(this.words.length, otherbitmap.words.length);
      let answer = 0 | 0;
      let k3 = 0 | 0;
      for (; k3 < mincount; ++k3) {
        answer += this.hammingWeight(this.words[k3] ^ otherbitmap.words[k3]);
      }
      const longer = this.words.length > otherbitmap.words.length ? this : otherbitmap;
      const c3 = longer.words.length;
      for (; k3 < c3; ++k3) {
        answer += this.hammingWeight(longer.words[k3]);
      }
      return answer;
    }
    toString() {
      return "{" + this.array().join(",") + "}";
    }
    union(otherbitmap) {
      const mcount = Math.min(this.words.length, otherbitmap.words.length);
      let k3 = 0 | 0;
      for (; k3 + 7 < mcount; k3 += 8) {
        this.words[k3] |= otherbitmap.words[k3];
        this.words[k3 + 1] |= otherbitmap.words[k3 + 1];
        this.words[k3 + 2] |= otherbitmap.words[k3 + 2];
        this.words[k3 + 3] |= otherbitmap.words[k3 + 3];
        this.words[k3 + 4] |= otherbitmap.words[k3 + 4];
        this.words[k3 + 5] |= otherbitmap.words[k3 + 5];
        this.words[k3 + 6] |= otherbitmap.words[k3 + 6];
        this.words[k3 + 7] |= otherbitmap.words[k3 + 7];
      }
      for (; k3 < mcount; ++k3) {
        this.words[k3] |= otherbitmap.words[k3];
      }
      if (this.words.length < otherbitmap.words.length) {
        this.resize((otherbitmap.words.length << 5) - 1);
        const c3 = otherbitmap.words.length;
        for (let k4 = mcount; k4 < c3; ++k4) {
          this.words[k4] = otherbitmap.words[k4];
        }
      }
      return this;
    }
    new_union(otherbitmap) {
      const answer = new TypedFastBitSet();
      const count = Math.max(this.words.length, otherbitmap.words.length);
      answer.words = new Uint32Array(count);
      const mcount = Math.min(this.words.length, otherbitmap.words.length);
      for (let k3 = 0; k3 < mcount; ++k3) {
        answer.words[k3] = this.words[k3] | otherbitmap.words[k3];
      }
      const c3 = this.words.length;
      for (let k3 = mcount; k3 < c3; ++k3) {
        answer.words[k3] = this.words[k3];
      }
      const c22 = otherbitmap.words.length;
      for (let k3 = mcount; k3 < c22; ++k3) {
        answer.words[k3] = otherbitmap.words[k3];
      }
      return answer;
    }
    union_size(otherbitmap) {
      const mcount = Math.min(this.words.length, otherbitmap.words.length);
      let answer = 0 | 0;
      for (let k3 = 0 | 0; k3 < mcount; ++k3) {
        answer += this.hammingWeight(this.words[k3] | otherbitmap.words[k3]);
      }
      if (this.words.length < otherbitmap.words.length) {
        const c3 = otherbitmap.words.length;
        for (let k3 = this.words.length; k3 < c3; ++k3) {
          answer += this.hammingWeight(otherbitmap.words[k3] | 0);
        }
      } else {
        const c3 = this.words.length;
        for (let k3 = otherbitmap.words.length; k3 < c3; ++k3) {
          answer += this.hammingWeight(this.words[k3] | 0);
        }
      }
      return answer;
    }
  };

  // table.ts
  async function loadCheckMeta(schema, root2) {
    const path = `${root2}/meta`;
    const req = await fetch(path);
    if (!req.ok) {
      throw new Error(`load ${path} failed`);
    }
    const meta = await req.json();
    const cols = {};
    const loads = [];
    for (let [name, type2] of Object.entries(schema)) {
      const tmeta = meta.cols[name];
      if (!tmeta) {
        throw new Error(`missing column ${name} in meta`);
      }
      if (type2 === "date")
        type2 = "num";
      if (tmeta.type !== type2) {
        throw new Error(`column ${name}: expected ${type2}, got ${tmeta.type}`);
      }
    }
    return meta;
  }
  var Table = class {
    constructor(rows, columns) {
      this.rows = rows;
      this.columns = columns;
    }
    static async load(schema, root2) {
      const meta = await loadCheckMeta(schema, root2);
      const cols = {};
      const loads = [];
      for (const [name, type2] of Object.entries(schema)) {
        const path = `${root2}/${name}.js`;
        loads.push((async () => {
          const req = await fetch(path);
          if (!req.ok) {
            throw new Error(`load ${path} failed`);
          }
          const raw = await req.arrayBuffer();
          const asc = !!meta.cols[name]["asc"];
          switch (type2) {
            case "num":
              cols[name] = NumCol.decode(raw, meta.rows, asc);
              break;
            case "str":
              cols[name] = StrCol.decode(raw, meta.rows, asc);
              break;
            case "date":
              cols[name] = DateCol.decode(raw, meta.rows, asc);
              break;
            default:
              throw new Error(`unhandled type ${type2}`);
          }
        })());
      }
      await Promise.all(loads);
      return new Table(meta.rows, cols);
    }
    query() {
      return new Query(this);
    }
  };
  function top(counts, n2) {
    const top3 = [];
    for (const [value, count] of counts.entries()) {
      top3.push({ value, count });
    }
    top3.sort(({ count: a3 }, { count: b3 }) => b3 - a3);
    return top3.slice(0, n2);
  }
  function readVarInts(raw, count) {
    const values = new Uint32Array(count);
    const view = new DataView(raw);
    let ofs = 0;
    for (let i3 = 0; i3 < count; i3++) {
      let n2 = 0;
      for (let shift = 0; ; shift += 7) {
        let b3 = view.getUint8(ofs++);
        n2 |= (b3 & 127) << shift;
        if (!(b3 & 128))
          break;
      }
      values[i3] = n2;
    }
    return [values, ofs];
  }
  var Col = class {
    constructor(arr, rows) {
      this.arr = arr;
      this.rows = rows;
    }
    static decodeRaw(raw, rows, asc) {
      const [arr, ofs] = readVarInts(raw, rows);
      if (asc) {
        for (let i3 = 1; i3 < arr.length; i3++) {
          arr[i3] += arr[i3 - 1];
        }
      }
      return [arr, ofs];
    }
    raw(row) {
      return this.arr[row];
    }
    str(row) {
      return (this.decode(this.raw(row)) ?? "[null]").toString();
    }
  };
  var NumCol = class extends Col {
    static decode(raw, rows, asc) {
      const [arr] = Col.decodeRaw(raw, rows, asc);
      return new NumCol(arr, rows);
    }
    query(query) {
      return new NumQuery(this, query);
    }
    decode(value) {
      return value;
    }
  };
  var BaseQuery = class {
    constructor(col, query) {
      this.col = col;
      this.query = query;
    }
    rawValues() {
      const values = [];
      const set3 = this.query.bitset;
      for (let i3 = 0; i3 < this.col.arr.length; i3++) {
        if (set3?.has(i3))
          continue;
        const val = this.col.arr[i3];
        values.push(val);
      }
      return values;
    }
    values() {
      return this.rawValues().map((val) => this.col.decode(val));
    }
    filterRaw(query) {
      var _a;
      const set3 = (_a = this.query).bitset ?? (_a.bitset = new TypedFastBitSet());
      for (let i3 = 0; i3 < this.col.arr.length; i3++) {
        const val = this.col.arr[i3];
        if (val !== query)
          set3.add(i3);
      }
      return this;
    }
    rawRange(min2, max3) {
      var _a;
      const set3 = (_a = this.query).bitset ?? (_a.bitset = new TypedFastBitSet());
      for (let i3 = 0; i3 < this.col.arr.length; i3++) {
        const val = this.col.arr[i3];
        if (val < min2 || val > max3)
          set3.add(i3);
      }
      return this;
    }
    count() {
      const set3 = this.query.bitset;
      const counts = /* @__PURE__ */ new Map();
      for (let i3 = 0; i3 < this.col.arr.length; i3++) {
        if (set3?.has(i3))
          continue;
        const val = this.col.arr[i3];
        counts.set(val, (counts.get(val) ?? 0) + 1);
      }
      return counts;
    }
  };
  var NumQuery = class extends BaseQuery {
  };
  var StrCol = class extends Col {
    constructor(arr, rows, strTab) {
      super(arr, rows);
      this.strTab = strTab;
    }
    static decode(raw, rows, asc) {
      const [arr, ofs] = Col.decodeRaw(raw, rows, asc);
      const json = new TextDecoder().decode(new DataView(raw, ofs));
      const strTab = JSON.parse(json);
      strTab[0] = null;
      return new StrCol(arr, rows, strTab);
    }
    decode(value) {
      return this.strTab[value];
    }
    encode(value) {
      const idx = this.strTab.findIndex((str) => str === value);
      if (idx < 0)
        return null;
      return idx;
    }
    query(query) {
      return new StrQuery(this, query);
    }
  };
  var StrQuery = class extends BaseQuery {
    constructor(col, query) {
      super(col, query);
      this.col = col;
    }
    filter(query) {
      const enc = this.col.encode(query);
      if (!enc)
        throw new Error("todo");
      return super.filterRaw(enc);
    }
    filterFn(f3) {
      var _a;
      const str = this.col.strTab.map((str2) => f3(str2));
      const set3 = (_a = this.query).bitset ?? (_a.bitset = new TypedFastBitSet());
      for (let i3 = 0; i3 < this.col.arr.length; i3++) {
        const val = this.col.arr[i3];
        if (!str[val])
          set3.add(i3);
      }
      return this;
    }
  };
  var DateCol = class extends Col {
    static decode(raw, rows, asc) {
      if (!asc) {
        throw new Error("date column must be ascending");
      }
      const [arr] = Col.decodeRaw(raw, rows, asc);
      return new DateCol(arr, rows);
    }
    query(query) {
      return new DateQuery(this, query);
    }
    encode(value) {
      return value.valueOf() / 1e3;
    }
    decode(value) {
      return new Date(value * 1e3);
    }
  };
  var DateQuery = class extends BaseQuery {
    constructor(col, query) {
      super(col, query);
      this.col = col;
    }
    rawRange(min2, max3) {
      var _a;
      const set3 = (_a = this.query).bitset ?? (_a.bitset = new TypedFastBitSet());
      let minIndex = 0;
      let maxIndex;
      for (let i3 = 0; i3 < this.col.arr.length; i3++) {
        const val = this.col.arr[i3];
        if (val < min2)
          minIndex = i3;
        if (maxIndex === void 0 && val > max3)
          maxIndex = i3;
      }
      set3.addRange(0, minIndex);
      if (maxIndex)
        set3.addRange(maxIndex, this.col.arr.length);
      return this;
    }
    range(min2, max3) {
      return this.rawRange(this.col.encode(min2), this.col.encode(max3));
    }
  };
  var Query = class {
    constructor(tab, bitset) {
      this.tab = tab;
      this.bitset = bitset;
    }
    col(colName) {
      return this.tab.columns[colName].query(this);
    }
    clone() {
      return new Query(this.tab, this.bitset?.clone());
    }
  };

  // node_modules/d3-array/src/ascending.js
  function ascending(a3, b3) {
    return a3 == null || b3 == null ? NaN : a3 < b3 ? -1 : a3 > b3 ? 1 : a3 >= b3 ? 0 : NaN;
  }

  // node_modules/d3-array/src/descending.js
  function descending(a3, b3) {
    return a3 == null || b3 == null ? NaN : b3 < a3 ? -1 : b3 > a3 ? 1 : b3 >= a3 ? 0 : NaN;
  }

  // node_modules/d3-array/src/bisector.js
  function bisector(f3) {
    let compare1, compare2, delta;
    if (f3.length !== 2) {
      compare1 = ascending;
      compare2 = (d3, x) => ascending(f3(d3), x);
      delta = (d3, x) => f3(d3) - x;
    } else {
      compare1 = f3 === ascending || f3 === descending ? f3 : zero;
      compare2 = f3;
      delta = f3;
    }
    function left2(a3, x, lo = 0, hi = a3.length) {
      if (lo < hi) {
        if (compare1(x, x) !== 0)
          return hi;
        do {
          const mid = lo + hi >>> 1;
          if (compare2(a3[mid], x) < 0)
            lo = mid + 1;
          else
            hi = mid;
        } while (lo < hi);
      }
      return lo;
    }
    function right2(a3, x, lo = 0, hi = a3.length) {
      if (lo < hi) {
        if (compare1(x, x) !== 0)
          return hi;
        do {
          const mid = lo + hi >>> 1;
          if (compare2(a3[mid], x) <= 0)
            lo = mid + 1;
          else
            hi = mid;
        } while (lo < hi);
      }
      return lo;
    }
    function center2(a3, x, lo = 0, hi = a3.length) {
      const i3 = left2(a3, x, lo, hi - 1);
      return i3 > lo && delta(a3[i3 - 1], x) > -delta(a3[i3], x) ? i3 - 1 : i3;
    }
    return { left: left2, center: center2, right: right2 };
  }
  function zero() {
    return 0;
  }

  // node_modules/d3-array/src/number.js
  function number(x) {
    return x === null ? NaN : +x;
  }

  // node_modules/d3-array/src/bisect.js
  var ascendingBisect = bisector(ascending);
  var bisectRight = ascendingBisect.right;
  var bisectLeft = ascendingBisect.left;
  var bisectCenter = bisector(number).center;
  var bisect_default = bisectRight;

  // node_modules/d3-array/src/extent.js
  function extent(values, valueof) {
    let min2;
    let max3;
    if (valueof === void 0) {
      for (const value of values) {
        if (value != null) {
          if (min2 === void 0) {
            if (value >= value)
              min2 = max3 = value;
          } else {
            if (min2 > value)
              min2 = value;
            if (max3 < value)
              max3 = value;
          }
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null) {
          if (min2 === void 0) {
            if (value >= value)
              min2 = max3 = value;
          } else {
            if (min2 > value)
              min2 = value;
            if (max3 < value)
              max3 = value;
          }
        }
      }
    }
    return [min2, max3];
  }

  // node_modules/d3-array/src/ticks.js
  var e10 = Math.sqrt(50);
  var e5 = Math.sqrt(10);
  var e2 = Math.sqrt(2);
  function ticks(start2, stop, count) {
    var reverse, i3 = -1, n2, ticks2, step;
    stop = +stop, start2 = +start2, count = +count;
    if (start2 === stop && count > 0)
      return [start2];
    if (reverse = stop < start2)
      n2 = start2, start2 = stop, stop = n2;
    if ((step = tickIncrement(start2, stop, count)) === 0 || !isFinite(step))
      return [];
    if (step > 0) {
      let r0 = Math.round(start2 / step), r1 = Math.round(stop / step);
      if (r0 * step < start2)
        ++r0;
      if (r1 * step > stop)
        --r1;
      ticks2 = new Array(n2 = r1 - r0 + 1);
      while (++i3 < n2)
        ticks2[i3] = (r0 + i3) * step;
    } else {
      step = -step;
      let r0 = Math.round(start2 * step), r1 = Math.round(stop * step);
      if (r0 / step < start2)
        ++r0;
      if (r1 / step > stop)
        --r1;
      ticks2 = new Array(n2 = r1 - r0 + 1);
      while (++i3 < n2)
        ticks2[i3] = (r0 + i3) / step;
    }
    if (reverse)
      ticks2.reverse();
    return ticks2;
  }
  function tickIncrement(start2, stop, count) {
    var step = (stop - start2) / Math.max(0, count), power = Math.floor(Math.log(step) / Math.LN10), error = step / Math.pow(10, power);
    return power >= 0 ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power) : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
  }
  function tickStep(start2, stop, count) {
    var step0 = Math.abs(stop - start2) / Math.max(0, count), step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)), error = step0 / step1;
    if (error >= e10)
      step1 *= 10;
    else if (error >= e5)
      step1 *= 5;
    else if (error >= e2)
      step1 *= 2;
    return stop < start2 ? -step1 : step1;
  }

  // node_modules/d3-array/src/max.js
  function max(values, valueof) {
    let max3;
    if (valueof === void 0) {
      for (const value of values) {
        if (value != null && (max3 < value || max3 === void 0 && value >= value)) {
          max3 = value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (max3 < value || max3 === void 0 && value >= value)) {
          max3 = value;
        }
      }
    }
    return max3;
  }

  // node_modules/d3-axis/src/identity.js
  function identity_default(x) {
    return x;
  }

  // node_modules/d3-axis/src/axis.js
  var top2 = 1;
  var right = 2;
  var bottom = 3;
  var left = 4;
  var epsilon = 1e-6;
  function translateX(x) {
    return "translate(" + x + ",0)";
  }
  function translateY(y3) {
    return "translate(0," + y3 + ")";
  }
  function number2(scale) {
    return (d3) => +scale(d3);
  }
  function center(scale, offset) {
    offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
    if (scale.round())
      offset = Math.round(offset);
    return (d3) => +scale(d3) + offset;
  }
  function entering() {
    return !this.__axis;
  }
  function axis(orient, scale) {
    var tickArguments = [], tickValues = null, tickFormat2 = null, tickSizeInner = 6, tickSizeOuter = 6, tickPadding = 3, offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5, k3 = orient === top2 || orient === left ? -1 : 1, x = orient === left || orient === right ? "x" : "y", transform2 = orient === top2 || orient === bottom ? translateX : translateY;
    function axis2(context) {
      var values = tickValues == null ? scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain() : tickValues, format2 = tickFormat2 == null ? scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity_default : tickFormat2, spacing = Math.max(tickSizeInner, 0) + tickPadding, range = scale.range(), range0 = +range[0] + offset, range1 = +range[range.length - 1] + offset, position = (scale.bandwidth ? center : number2)(scale.copy(), offset), selection2 = context.selection ? context.selection() : context, path = selection2.selectAll(".domain").data([null]), tick = selection2.selectAll(".tick").data(values, scale).order(), tickExit = tick.exit(), tickEnter = tick.enter().append("g").attr("class", "tick"), line = tick.select("line"), text = tick.select("text");
      path = path.merge(path.enter().insert("path", ".tick").attr("class", "domain").attr("stroke", "currentColor"));
      tick = tick.merge(tickEnter);
      line = line.merge(tickEnter.append("line").attr("stroke", "currentColor").attr(x + "2", k3 * tickSizeInner));
      text = text.merge(tickEnter.append("text").attr("fill", "currentColor").attr(x, k3 * spacing).attr("dy", orient === top2 ? "0em" : orient === bottom ? "0.71em" : "0.32em"));
      if (context !== selection2) {
        path = path.transition(context);
        tick = tick.transition(context);
        line = line.transition(context);
        text = text.transition(context);
        tickExit = tickExit.transition(context).attr("opacity", epsilon).attr("transform", function(d3) {
          return isFinite(d3 = position(d3)) ? transform2(d3 + offset) : this.getAttribute("transform");
        });
        tickEnter.attr("opacity", epsilon).attr("transform", function(d3) {
          var p3 = this.parentNode.__axis;
          return transform2((p3 && isFinite(p3 = p3(d3)) ? p3 : position(d3)) + offset);
        });
      }
      tickExit.remove();
      path.attr("d", orient === left || orient === right ? tickSizeOuter ? "M" + k3 * tickSizeOuter + "," + range0 + "H" + offset + "V" + range1 + "H" + k3 * tickSizeOuter : "M" + offset + "," + range0 + "V" + range1 : tickSizeOuter ? "M" + range0 + "," + k3 * tickSizeOuter + "V" + offset + "H" + range1 + "V" + k3 * tickSizeOuter : "M" + range0 + "," + offset + "H" + range1);
      tick.attr("opacity", 1).attr("transform", function(d3) {
        return transform2(position(d3) + offset);
      });
      line.attr(x + "2", k3 * tickSizeInner);
      text.attr(x, k3 * spacing).text(format2);
      selection2.filter(entering).attr("fill", "none").attr("font-size", 10).attr("font-family", "sans-serif").attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");
      selection2.each(function() {
        this.__axis = position;
      });
    }
    axis2.scale = function(_3) {
      return arguments.length ? (scale = _3, axis2) : scale;
    };
    axis2.ticks = function() {
      return tickArguments = Array.from(arguments), axis2;
    };
    axis2.tickArguments = function(_3) {
      return arguments.length ? (tickArguments = _3 == null ? [] : Array.from(_3), axis2) : tickArguments.slice();
    };
    axis2.tickValues = function(_3) {
      return arguments.length ? (tickValues = _3 == null ? null : Array.from(_3), axis2) : tickValues && tickValues.slice();
    };
    axis2.tickFormat = function(_3) {
      return arguments.length ? (tickFormat2 = _3, axis2) : tickFormat2;
    };
    axis2.tickSize = function(_3) {
      return arguments.length ? (tickSizeInner = tickSizeOuter = +_3, axis2) : tickSizeInner;
    };
    axis2.tickSizeInner = function(_3) {
      return arguments.length ? (tickSizeInner = +_3, axis2) : tickSizeInner;
    };
    axis2.tickSizeOuter = function(_3) {
      return arguments.length ? (tickSizeOuter = +_3, axis2) : tickSizeOuter;
    };
    axis2.tickPadding = function(_3) {
      return arguments.length ? (tickPadding = +_3, axis2) : tickPadding;
    };
    axis2.offset = function(_3) {
      return arguments.length ? (offset = +_3, axis2) : offset;
    };
    return axis2;
  }
  function axisBottom(scale) {
    return axis(bottom, scale);
  }
  function axisLeft(scale) {
    return axis(left, scale);
  }

  // node_modules/d3-dispatch/src/dispatch.js
  var noop = { value: () => {
  } };
  function dispatch() {
    for (var i3 = 0, n2 = arguments.length, _3 = {}, t3; i3 < n2; ++i3) {
      if (!(t3 = arguments[i3] + "") || t3 in _3 || /[\s.]/.test(t3))
        throw new Error("illegal type: " + t3);
      _3[t3] = [];
    }
    return new Dispatch(_3);
  }
  function Dispatch(_3) {
    this._ = _3;
  }
  function parseTypenames(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t3) {
      var name = "", i3 = t3.indexOf(".");
      if (i3 >= 0)
        name = t3.slice(i3 + 1), t3 = t3.slice(0, i3);
      if (t3 && !types.hasOwnProperty(t3))
        throw new Error("unknown type: " + t3);
      return { type: t3, name };
    });
  }
  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _3 = this._, T2 = parseTypenames(typename + "", _3), t3, i3 = -1, n2 = T2.length;
      if (arguments.length < 2) {
        while (++i3 < n2)
          if ((t3 = (typename = T2[i3]).type) && (t3 = get(_3[t3], typename.name)))
            return t3;
        return;
      }
      if (callback != null && typeof callback !== "function")
        throw new Error("invalid callback: " + callback);
      while (++i3 < n2) {
        if (t3 = (typename = T2[i3]).type)
          _3[t3] = set(_3[t3], typename.name, callback);
        else if (callback == null)
          for (t3 in _3)
            _3[t3] = set(_3[t3], typename.name, null);
      }
      return this;
    },
    copy: function() {
      var copy2 = {}, _3 = this._;
      for (var t3 in _3)
        copy2[t3] = _3[t3].slice();
      return new Dispatch(copy2);
    },
    call: function(type2, that) {
      if ((n2 = arguments.length - 2) > 0)
        for (var args = new Array(n2), i3 = 0, n2, t3; i3 < n2; ++i3)
          args[i3] = arguments[i3 + 2];
      if (!this._.hasOwnProperty(type2))
        throw new Error("unknown type: " + type2);
      for (t3 = this._[type2], i3 = 0, n2 = t3.length; i3 < n2; ++i3)
        t3[i3].value.apply(that, args);
    },
    apply: function(type2, that, args) {
      if (!this._.hasOwnProperty(type2))
        throw new Error("unknown type: " + type2);
      for (var t3 = this._[type2], i3 = 0, n2 = t3.length; i3 < n2; ++i3)
        t3[i3].value.apply(that, args);
    }
  };
  function get(type2, name) {
    for (var i3 = 0, n2 = type2.length, c3; i3 < n2; ++i3) {
      if ((c3 = type2[i3]).name === name) {
        return c3.value;
      }
    }
  }
  function set(type2, name, callback) {
    for (var i3 = 0, n2 = type2.length; i3 < n2; ++i3) {
      if (type2[i3].name === name) {
        type2[i3] = noop, type2 = type2.slice(0, i3).concat(type2.slice(i3 + 1));
        break;
      }
    }
    if (callback != null)
      type2.push({ name, value: callback });
    return type2;
  }
  var dispatch_default = dispatch;

  // node_modules/d3-selection/src/namespaces.js
  var xhtml = "http://www.w3.org/1999/xhtml";
  var namespaces_default = {
    svg: "http://www.w3.org/2000/svg",
    xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  // node_modules/d3-selection/src/namespace.js
  function namespace_default(name) {
    var prefix = name += "", i3 = prefix.indexOf(":");
    if (i3 >= 0 && (prefix = name.slice(0, i3)) !== "xmlns")
      name = name.slice(i3 + 1);
    return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
  }

  // node_modules/d3-selection/src/creator.js
  function creatorInherit(name) {
    return function() {
      var document2 = this.ownerDocument, uri = this.namespaceURI;
      return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name) : document2.createElementNS(uri, name);
    };
  }
  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }
  function creator_default(name) {
    var fullname = namespace_default(name);
    return (fullname.local ? creatorFixed : creatorInherit)(fullname);
  }

  // node_modules/d3-selection/src/selector.js
  function none() {
  }
  function selector_default(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  // node_modules/d3-selection/src/selection/select.js
  function select_default(select) {
    if (typeof select !== "function")
      select = selector_default(select);
    for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j3 = 0; j3 < m3; ++j3) {
      for (var group = groups[j3], n2 = group.length, subgroup = subgroups[j3] = new Array(n2), node, subnode, i3 = 0; i3 < n2; ++i3) {
        if ((node = group[i3]) && (subnode = select.call(node, node.__data__, i3, group))) {
          if ("__data__" in node)
            subnode.__data__ = node.__data__;
          subgroup[i3] = subnode;
        }
      }
    }
    return new Selection(subgroups, this._parents);
  }

  // node_modules/d3-selection/src/array.js
  function array(x) {
    return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
  }

  // node_modules/d3-selection/src/selectorAll.js
  function empty() {
    return [];
  }
  function selectorAll_default(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  // node_modules/d3-selection/src/selection/selectAll.js
  function arrayAll(select) {
    return function() {
      return array(select.apply(this, arguments));
    };
  }
  function selectAll_default(select) {
    if (typeof select === "function")
      select = arrayAll(select);
    else
      select = selectorAll_default(select);
    for (var groups = this._groups, m3 = groups.length, subgroups = [], parents = [], j3 = 0; j3 < m3; ++j3) {
      for (var group = groups[j3], n2 = group.length, node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          subgroups.push(select.call(node, node.__data__, i3, group));
          parents.push(node);
        }
      }
    }
    return new Selection(subgroups, parents);
  }

  // node_modules/d3-selection/src/matcher.js
  function matcher_default(selector) {
    return function() {
      return this.matches(selector);
    };
  }
  function childMatcher(selector) {
    return function(node) {
      return node.matches(selector);
    };
  }

  // node_modules/d3-selection/src/selection/selectChild.js
  var find = Array.prototype.find;
  function childFind(match) {
    return function() {
      return find.call(this.children, match);
    };
  }
  function childFirst() {
    return this.firstElementChild;
  }
  function selectChild_default(match) {
    return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
  }

  // node_modules/d3-selection/src/selection/selectChildren.js
  var filter = Array.prototype.filter;
  function children() {
    return Array.from(this.children);
  }
  function childrenFilter(match) {
    return function() {
      return filter.call(this.children, match);
    };
  }
  function selectChildren_default(match) {
    return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
  }

  // node_modules/d3-selection/src/selection/filter.js
  function filter_default(match) {
    if (typeof match !== "function")
      match = matcher_default(match);
    for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j3 = 0; j3 < m3; ++j3) {
      for (var group = groups[j3], n2 = group.length, subgroup = subgroups[j3] = [], node, i3 = 0; i3 < n2; ++i3) {
        if ((node = group[i3]) && match.call(node, node.__data__, i3, group)) {
          subgroup.push(node);
        }
      }
    }
    return new Selection(subgroups, this._parents);
  }

  // node_modules/d3-selection/src/selection/sparse.js
  function sparse_default(update) {
    return new Array(update.length);
  }

  // node_modules/d3-selection/src/selection/enter.js
  function enter_default() {
    return new Selection(this._enter || this._groups.map(sparse_default), this._parents);
  }
  function EnterNode(parent, datum2) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum2;
  }
  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) {
      return this._parent.insertBefore(child, this._next);
    },
    insertBefore: function(child, next) {
      return this._parent.insertBefore(child, next);
    },
    querySelector: function(selector) {
      return this._parent.querySelector(selector);
    },
    querySelectorAll: function(selector) {
      return this._parent.querySelectorAll(selector);
    }
  };

  // node_modules/d3-selection/src/constant.js
  function constant_default(x) {
    return function() {
      return x;
    };
  }

  // node_modules/d3-selection/src/selection/data.js
  function bindIndex(parent, group, enter, update, exit, data) {
    var i3 = 0, node, groupLength = group.length, dataLength = data.length;
    for (; i3 < dataLength; ++i3) {
      if (node = group[i3]) {
        node.__data__ = data[i3];
        update[i3] = node;
      } else {
        enter[i3] = new EnterNode(parent, data[i3]);
      }
    }
    for (; i3 < groupLength; ++i3) {
      if (node = group[i3]) {
        exit[i3] = node;
      }
    }
  }
  function bindKey(parent, group, enter, update, exit, data, key) {
    var i3, node, nodeByKeyValue = /* @__PURE__ */ new Map(), groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
    for (i3 = 0; i3 < groupLength; ++i3) {
      if (node = group[i3]) {
        keyValues[i3] = keyValue = key.call(node, node.__data__, i3, group) + "";
        if (nodeByKeyValue.has(keyValue)) {
          exit[i3] = node;
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
      }
    }
    for (i3 = 0; i3 < dataLength; ++i3) {
      keyValue = key.call(parent, data[i3], i3, data) + "";
      if (node = nodeByKeyValue.get(keyValue)) {
        update[i3] = node;
        node.__data__ = data[i3];
        nodeByKeyValue.delete(keyValue);
      } else {
        enter[i3] = new EnterNode(parent, data[i3]);
      }
    }
    for (i3 = 0; i3 < groupLength; ++i3) {
      if ((node = group[i3]) && nodeByKeyValue.get(keyValues[i3]) === node) {
        exit[i3] = node;
      }
    }
  }
  function datum(node) {
    return node.__data__;
  }
  function data_default(value, key) {
    if (!arguments.length)
      return Array.from(this, datum);
    var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
    if (typeof value !== "function")
      value = constant_default(value);
    for (var m3 = groups.length, update = new Array(m3), enter = new Array(m3), exit = new Array(m3), j3 = 0; j3 < m3; ++j3) {
      var parent = parents[j3], group = groups[j3], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j3, parents)), dataLength = data.length, enterGroup = enter[j3] = new Array(dataLength), updateGroup = update[j3] = new Array(dataLength), exitGroup = exit[j3] = new Array(groupLength);
      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1)
            i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength)
            ;
          previous._next = next || null;
        }
      }
    }
    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }
  function arraylike(data) {
    return typeof data === "object" && "length" in data ? data : Array.from(data);
  }

  // node_modules/d3-selection/src/selection/exit.js
  function exit_default() {
    return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
  }

  // node_modules/d3-selection/src/selection/join.js
  function join_default(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    if (typeof onenter === "function") {
      enter = onenter(enter);
      if (enter)
        enter = enter.selection();
    } else {
      enter = enter.append(onenter + "");
    }
    if (onupdate != null) {
      update = onupdate(update);
      if (update)
        update = update.selection();
    }
    if (onexit == null)
      exit.remove();
    else
      onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  // node_modules/d3-selection/src/selection/merge.js
  function merge_default(context) {
    var selection2 = context.selection ? context.selection() : context;
    for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m3 = Math.min(m0, m1), merges = new Array(m0), j3 = 0; j3 < m3; ++j3) {
      for (var group0 = groups0[j3], group1 = groups1[j3], n2 = group0.length, merge = merges[j3] = new Array(n2), node, i3 = 0; i3 < n2; ++i3) {
        if (node = group0[i3] || group1[i3]) {
          merge[i3] = node;
        }
      }
    }
    for (; j3 < m0; ++j3) {
      merges[j3] = groups0[j3];
    }
    return new Selection(merges, this._parents);
  }

  // node_modules/d3-selection/src/selection/order.js
  function order_default() {
    for (var groups = this._groups, j3 = -1, m3 = groups.length; ++j3 < m3; ) {
      for (var group = groups[j3], i3 = group.length - 1, next = group[i3], node; --i3 >= 0; ) {
        if (node = group[i3]) {
          if (next && node.compareDocumentPosition(next) ^ 4)
            next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  }

  // node_modules/d3-selection/src/selection/sort.js
  function sort_default(compare) {
    if (!compare)
      compare = ascending2;
    function compareNode(a3, b3) {
      return a3 && b3 ? compare(a3.__data__, b3.__data__) : !a3 - !b3;
    }
    for (var groups = this._groups, m3 = groups.length, sortgroups = new Array(m3), j3 = 0; j3 < m3; ++j3) {
      for (var group = groups[j3], n2 = group.length, sortgroup = sortgroups[j3] = new Array(n2), node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          sortgroup[i3] = node;
        }
      }
      sortgroup.sort(compareNode);
    }
    return new Selection(sortgroups, this._parents).order();
  }
  function ascending2(a3, b3) {
    return a3 < b3 ? -1 : a3 > b3 ? 1 : a3 >= b3 ? 0 : NaN;
  }

  // node_modules/d3-selection/src/selection/call.js
  function call_default() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  // node_modules/d3-selection/src/selection/nodes.js
  function nodes_default() {
    return Array.from(this);
  }

  // node_modules/d3-selection/src/selection/node.js
  function node_default() {
    for (var groups = this._groups, j3 = 0, m3 = groups.length; j3 < m3; ++j3) {
      for (var group = groups[j3], i3 = 0, n2 = group.length; i3 < n2; ++i3) {
        var node = group[i3];
        if (node)
          return node;
      }
    }
    return null;
  }

  // node_modules/d3-selection/src/selection/size.js
  function size_default() {
    let size = 0;
    for (const node of this)
      ++size;
    return size;
  }

  // node_modules/d3-selection/src/selection/empty.js
  function empty_default() {
    return !this.node();
  }

  // node_modules/d3-selection/src/selection/each.js
  function each_default(callback) {
    for (var groups = this._groups, j3 = 0, m3 = groups.length; j3 < m3; ++j3) {
      for (var group = groups[j3], i3 = 0, n2 = group.length, node; i3 < n2; ++i3) {
        if (node = group[i3])
          callback.call(node, node.__data__, i3, group);
      }
    }
    return this;
  }

  // node_modules/d3-selection/src/selection/attr.js
  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }
  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }
  function attrConstant(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }
  function attrConstantNS(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }
  function attrFunction(name, value) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (v3 == null)
        this.removeAttribute(name);
      else
        this.setAttribute(name, v3);
    };
  }
  function attrFunctionNS(fullname, value) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (v3 == null)
        this.removeAttributeNS(fullname.space, fullname.local);
      else
        this.setAttributeNS(fullname.space, fullname.local, v3);
    };
  }
  function attr_default(name, value) {
    var fullname = namespace_default(name);
    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
    }
    return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
  }

  // node_modules/d3-selection/src/window.js
  function window_default(node) {
    return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
  }

  // node_modules/d3-selection/src/selection/style.js
  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }
  function styleConstant(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }
  function styleFunction(name, value, priority) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (v3 == null)
        this.style.removeProperty(name);
      else
        this.style.setProperty(name, v3, priority);
    };
  }
  function style_default(name, value, priority) {
    return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
  }
  function styleValue(node, name) {
    return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  // node_modules/d3-selection/src/selection/property.js
  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }
  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }
  function propertyFunction(name, value) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (v3 == null)
        delete this[name];
      else
        this[name] = v3;
    };
  }
  function property_default(name, value) {
    return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
  }

  // node_modules/d3-selection/src/selection/classed.js
  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }
  function classList(node) {
    return node.classList || new ClassList(node);
  }
  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }
  ClassList.prototype = {
    add: function(name) {
      var i3 = this._names.indexOf(name);
      if (i3 < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i3 = this._names.indexOf(name);
      if (i3 >= 0) {
        this._names.splice(i3, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };
  function classedAdd(node, names) {
    var list = classList(node), i3 = -1, n2 = names.length;
    while (++i3 < n2)
      list.add(names[i3]);
  }
  function classedRemove(node, names) {
    var list = classList(node), i3 = -1, n2 = names.length;
    while (++i3 < n2)
      list.remove(names[i3]);
  }
  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }
  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }
  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }
  function classed_default(name, value) {
    var names = classArray(name + "");
    if (arguments.length < 2) {
      var list = classList(this.node()), i3 = -1, n2 = names.length;
      while (++i3 < n2)
        if (!list.contains(names[i3]))
          return false;
      return true;
    }
    return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
  }

  // node_modules/d3-selection/src/selection/text.js
  function textRemove() {
    this.textContent = "";
  }
  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }
  function textFunction(value) {
    return function() {
      var v3 = value.apply(this, arguments);
      this.textContent = v3 == null ? "" : v3;
    };
  }
  function text_default(value) {
    return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
  }

  // node_modules/d3-selection/src/selection/html.js
  function htmlRemove() {
    this.innerHTML = "";
  }
  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }
  function htmlFunction(value) {
    return function() {
      var v3 = value.apply(this, arguments);
      this.innerHTML = v3 == null ? "" : v3;
    };
  }
  function html_default(value) {
    return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
  }

  // node_modules/d3-selection/src/selection/raise.js
  function raise() {
    if (this.nextSibling)
      this.parentNode.appendChild(this);
  }
  function raise_default() {
    return this.each(raise);
  }

  // node_modules/d3-selection/src/selection/lower.js
  function lower() {
    if (this.previousSibling)
      this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }
  function lower_default() {
    return this.each(lower);
  }

  // node_modules/d3-selection/src/selection/append.js
  function append_default(name) {
    var create2 = typeof name === "function" ? name : creator_default(name);
    return this.select(function() {
      return this.appendChild(create2.apply(this, arguments));
    });
  }

  // node_modules/d3-selection/src/selection/insert.js
  function constantNull() {
    return null;
  }
  function insert_default(name, before) {
    var create2 = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
    return this.select(function() {
      return this.insertBefore(create2.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  // node_modules/d3-selection/src/selection/remove.js
  function remove() {
    var parent = this.parentNode;
    if (parent)
      parent.removeChild(this);
  }
  function remove_default() {
    return this.each(remove);
  }

  // node_modules/d3-selection/src/selection/clone.js
  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }
  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }
  function clone_default(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  // node_modules/d3-selection/src/selection/datum.js
  function datum_default(value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
  }

  // node_modules/d3-selection/src/selection/on.js
  function contextListener(listener) {
    return function(event) {
      listener.call(this, event, this.__data__);
    };
  }
  function parseTypenames2(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t3) {
      var name = "", i3 = t3.indexOf(".");
      if (i3 >= 0)
        name = t3.slice(i3 + 1), t3 = t3.slice(0, i3);
      return { type: t3, name };
    });
  }
  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on)
        return;
      for (var j3 = 0, i3 = -1, m3 = on.length, o4; j3 < m3; ++j3) {
        if (o4 = on[j3], (!typename.type || o4.type === typename.type) && o4.name === typename.name) {
          this.removeEventListener(o4.type, o4.listener, o4.options);
        } else {
          on[++i3] = o4;
        }
      }
      if (++i3)
        on.length = i3;
      else
        delete this.__on;
    };
  }
  function onAdd(typename, value, options) {
    return function() {
      var on = this.__on, o4, listener = contextListener(value);
      if (on)
        for (var j3 = 0, m3 = on.length; j3 < m3; ++j3) {
          if ((o4 = on[j3]).type === typename.type && o4.name === typename.name) {
            this.removeEventListener(o4.type, o4.listener, o4.options);
            this.addEventListener(o4.type, o4.listener = listener, o4.options = options);
            o4.value = value;
            return;
          }
        }
      this.addEventListener(typename.type, listener, options);
      o4 = { type: typename.type, name: typename.name, value, listener, options };
      if (!on)
        this.__on = [o4];
      else
        on.push(o4);
    };
  }
  function on_default(typename, value, options) {
    var typenames = parseTypenames2(typename + ""), i3, n2 = typenames.length, t3;
    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on)
        for (var j3 = 0, m3 = on.length, o4; j3 < m3; ++j3) {
          for (i3 = 0, o4 = on[j3]; i3 < n2; ++i3) {
            if ((t3 = typenames[i3]).type === o4.type && t3.name === o4.name) {
              return o4.value;
            }
          }
        }
      return;
    }
    on = value ? onAdd : onRemove;
    for (i3 = 0; i3 < n2; ++i3)
      this.each(on(typenames[i3], value, options));
    return this;
  }

  // node_modules/d3-selection/src/selection/dispatch.js
  function dispatchEvent(node, type2, params) {
    var window2 = window_default(node), event = window2.CustomEvent;
    if (typeof event === "function") {
      event = new event(type2, params);
    } else {
      event = window2.document.createEvent("Event");
      if (params)
        event.initEvent(type2, params.bubbles, params.cancelable), event.detail = params.detail;
      else
        event.initEvent(type2, false, false);
    }
    node.dispatchEvent(event);
  }
  function dispatchConstant(type2, params) {
    return function() {
      return dispatchEvent(this, type2, params);
    };
  }
  function dispatchFunction(type2, params) {
    return function() {
      return dispatchEvent(this, type2, params.apply(this, arguments));
    };
  }
  function dispatch_default2(type2, params) {
    return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type2, params));
  }

  // node_modules/d3-selection/src/selection/iterator.js
  function* iterator_default() {
    for (var groups = this._groups, j3 = 0, m3 = groups.length; j3 < m3; ++j3) {
      for (var group = groups[j3], i3 = 0, n2 = group.length, node; i3 < n2; ++i3) {
        if (node = group[i3])
          yield node;
      }
    }
  }

  // node_modules/d3-selection/src/selection/index.js
  var root = [null];
  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }
  function selection() {
    return new Selection([[document.documentElement]], root);
  }
  function selection_selection() {
    return this;
  }
  Selection.prototype = selection.prototype = {
    constructor: Selection,
    select: select_default,
    selectAll: selectAll_default,
    selectChild: selectChild_default,
    selectChildren: selectChildren_default,
    filter: filter_default,
    data: data_default,
    enter: enter_default,
    exit: exit_default,
    join: join_default,
    merge: merge_default,
    selection: selection_selection,
    order: order_default,
    sort: sort_default,
    call: call_default,
    nodes: nodes_default,
    node: node_default,
    size: size_default,
    empty: empty_default,
    each: each_default,
    attr: attr_default,
    style: style_default,
    property: property_default,
    classed: classed_default,
    text: text_default,
    html: html_default,
    raise: raise_default,
    lower: lower_default,
    append: append_default,
    insert: insert_default,
    remove: remove_default,
    clone: clone_default,
    datum: datum_default,
    on: on_default,
    dispatch: dispatch_default2,
    [Symbol.iterator]: iterator_default
  };
  var selection_default = selection;

  // node_modules/d3-selection/src/select.js
  function select_default2(selector) {
    return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
  }

  // node_modules/d3-selection/src/sourceEvent.js
  function sourceEvent_default(event) {
    let sourceEvent;
    while (sourceEvent = event.sourceEvent)
      event = sourceEvent;
    return event;
  }

  // node_modules/d3-selection/src/pointer.js
  function pointer_default(event, node) {
    event = sourceEvent_default(event);
    if (node === void 0)
      node = event.currentTarget;
    if (node) {
      var svg = node.ownerSVGElement || node;
      if (svg.createSVGPoint) {
        var point = svg.createSVGPoint();
        point.x = event.clientX, point.y = event.clientY;
        point = point.matrixTransform(node.getScreenCTM().inverse());
        return [point.x, point.y];
      }
      if (node.getBoundingClientRect) {
        var rect = node.getBoundingClientRect();
        return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
      }
    }
    return [event.pageX, event.pageY];
  }

  // node_modules/d3-drag/src/noevent.js
  var nonpassivecapture = { capture: true, passive: false };
  function noevent_default(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  // node_modules/d3-drag/src/nodrag.js
  function nodrag_default(view) {
    var root2 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", noevent_default, nonpassivecapture);
    if ("onselectstart" in root2) {
      selection2.on("selectstart.drag", noevent_default, nonpassivecapture);
    } else {
      root2.__noselect = root2.style.MozUserSelect;
      root2.style.MozUserSelect = "none";
    }
  }
  function yesdrag(view, noclick) {
    var root2 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", null);
    if (noclick) {
      selection2.on("click.drag", noevent_default, nonpassivecapture);
      setTimeout(function() {
        selection2.on("click.drag", null);
      }, 0);
    }
    if ("onselectstart" in root2) {
      selection2.on("selectstart.drag", null);
    } else {
      root2.style.MozUserSelect = root2.__noselect;
      delete root2.__noselect;
    }
  }

  // node_modules/d3-color/src/define.js
  function define_default(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }
  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition)
      prototype[key] = definition[key];
    return prototype;
  }

  // node_modules/d3-color/src/color.js
  function Color() {
  }
  var darker = 0.7;
  var brighter = 1 / darker;
  var reI = "\\s*([+-]?\\d+)\\s*";
  var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
  var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
  var reHex = /^#([0-9a-f]{3,8})$/;
  var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
  var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
  var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
  var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
  var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
  var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
  var named = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  };
  define_default(Color, color, {
    copy(channels) {
      return Object.assign(new this.constructor(), this, channels);
    },
    displayable() {
      return this.rgb().displayable();
    },
    hex: color_formatHex,
    formatHex: color_formatHex,
    formatHex8: color_formatHex8,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });
  function color_formatHex() {
    return this.rgb().formatHex();
  }
  function color_formatHex8() {
    return this.rgb().formatHex8();
  }
  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }
  function color_formatRgb() {
    return this.rgb().formatRgb();
  }
  function color(format2) {
    var m3, l3;
    format2 = (format2 + "").trim().toLowerCase();
    return (m3 = reHex.exec(format2)) ? (l3 = m3[1].length, m3 = parseInt(m3[1], 16), l3 === 6 ? rgbn(m3) : l3 === 3 ? new Rgb(m3 >> 8 & 15 | m3 >> 4 & 240, m3 >> 4 & 15 | m3 & 240, (m3 & 15) << 4 | m3 & 15, 1) : l3 === 8 ? rgba(m3 >> 24 & 255, m3 >> 16 & 255, m3 >> 8 & 255, (m3 & 255) / 255) : l3 === 4 ? rgba(m3 >> 12 & 15 | m3 >> 8 & 240, m3 >> 8 & 15 | m3 >> 4 & 240, m3 >> 4 & 15 | m3 & 240, ((m3 & 15) << 4 | m3 & 15) / 255) : null) : (m3 = reRgbInteger.exec(format2)) ? new Rgb(m3[1], m3[2], m3[3], 1) : (m3 = reRgbPercent.exec(format2)) ? new Rgb(m3[1] * 255 / 100, m3[2] * 255 / 100, m3[3] * 255 / 100, 1) : (m3 = reRgbaInteger.exec(format2)) ? rgba(m3[1], m3[2], m3[3], m3[4]) : (m3 = reRgbaPercent.exec(format2)) ? rgba(m3[1] * 255 / 100, m3[2] * 255 / 100, m3[3] * 255 / 100, m3[4]) : (m3 = reHslPercent.exec(format2)) ? hsla(m3[1], m3[2] / 100, m3[3] / 100, 1) : (m3 = reHslaPercent.exec(format2)) ? hsla(m3[1], m3[2] / 100, m3[3] / 100, m3[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
  }
  function rgbn(n2) {
    return new Rgb(n2 >> 16 & 255, n2 >> 8 & 255, n2 & 255, 1);
  }
  function rgba(r3, g3, b3, a3) {
    if (a3 <= 0)
      r3 = g3 = b3 = NaN;
    return new Rgb(r3, g3, b3, a3);
  }
  function rgbConvert(o4) {
    if (!(o4 instanceof Color))
      o4 = color(o4);
    if (!o4)
      return new Rgb();
    o4 = o4.rgb();
    return new Rgb(o4.r, o4.g, o4.b, o4.opacity);
  }
  function rgb(r3, g3, b3, opacity) {
    return arguments.length === 1 ? rgbConvert(r3) : new Rgb(r3, g3, b3, opacity == null ? 1 : opacity);
  }
  function Rgb(r3, g3, b3, opacity) {
    this.r = +r3;
    this.g = +g3;
    this.b = +b3;
    this.opacity = +opacity;
  }
  define_default(Rgb, rgb, extend(Color, {
    brighter(k3) {
      k3 = k3 == null ? brighter : Math.pow(brighter, k3);
      return new Rgb(this.r * k3, this.g * k3, this.b * k3, this.opacity);
    },
    darker(k3) {
      k3 = k3 == null ? darker : Math.pow(darker, k3);
      return new Rgb(this.r * k3, this.g * k3, this.b * k3, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex,
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));
  function rgb_formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }
  function rgb_formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
  }
  function rgb_formatRgb() {
    const a3 = clampa(this.opacity);
    return `${a3 === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a3 === 1 ? ")" : `, ${a3})`}`;
  }
  function clampa(opacity) {
    return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
  }
  function clampi(value) {
    return Math.max(0, Math.min(255, Math.round(value) || 0));
  }
  function hex(value) {
    value = clampi(value);
    return (value < 16 ? "0" : "") + value.toString(16);
  }
  function hsla(h3, s2, l3, a3) {
    if (a3 <= 0)
      h3 = s2 = l3 = NaN;
    else if (l3 <= 0 || l3 >= 1)
      h3 = s2 = NaN;
    else if (s2 <= 0)
      h3 = NaN;
    return new Hsl(h3, s2, l3, a3);
  }
  function hslConvert(o4) {
    if (o4 instanceof Hsl)
      return new Hsl(o4.h, o4.s, o4.l, o4.opacity);
    if (!(o4 instanceof Color))
      o4 = color(o4);
    if (!o4)
      return new Hsl();
    if (o4 instanceof Hsl)
      return o4;
    o4 = o4.rgb();
    var r3 = o4.r / 255, g3 = o4.g / 255, b3 = o4.b / 255, min2 = Math.min(r3, g3, b3), max3 = Math.max(r3, g3, b3), h3 = NaN, s2 = max3 - min2, l3 = (max3 + min2) / 2;
    if (s2) {
      if (r3 === max3)
        h3 = (g3 - b3) / s2 + (g3 < b3) * 6;
      else if (g3 === max3)
        h3 = (b3 - r3) / s2 + 2;
      else
        h3 = (r3 - g3) / s2 + 4;
      s2 /= l3 < 0.5 ? max3 + min2 : 2 - max3 - min2;
      h3 *= 60;
    } else {
      s2 = l3 > 0 && l3 < 1 ? 0 : h3;
    }
    return new Hsl(h3, s2, l3, o4.opacity);
  }
  function hsl(h3, s2, l3, opacity) {
    return arguments.length === 1 ? hslConvert(h3) : new Hsl(h3, s2, l3, opacity == null ? 1 : opacity);
  }
  function Hsl(h3, s2, l3, opacity) {
    this.h = +h3;
    this.s = +s2;
    this.l = +l3;
    this.opacity = +opacity;
  }
  define_default(Hsl, hsl, extend(Color, {
    brighter(k3) {
      k3 = k3 == null ? brighter : Math.pow(brighter, k3);
      return new Hsl(this.h, this.s, this.l * k3, this.opacity);
    },
    darker(k3) {
      k3 = k3 == null ? darker : Math.pow(darker, k3);
      return new Hsl(this.h, this.s, this.l * k3, this.opacity);
    },
    rgb() {
      var h3 = this.h % 360 + (this.h < 0) * 360, s2 = isNaN(h3) || isNaN(this.s) ? 0 : this.s, l3 = this.l, m22 = l3 + (l3 < 0.5 ? l3 : 1 - l3) * s2, m1 = 2 * l3 - m22;
      return new Rgb(
        hsl2rgb(h3 >= 240 ? h3 - 240 : h3 + 120, m1, m22),
        hsl2rgb(h3, m1, m22),
        hsl2rgb(h3 < 120 ? h3 + 240 : h3 - 120, m1, m22),
        this.opacity
      );
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl() {
      const a3 = clampa(this.opacity);
      return `${a3 === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a3 === 1 ? ")" : `, ${a3})`}`;
    }
  }));
  function clamph(value) {
    value = (value || 0) % 360;
    return value < 0 ? value + 360 : value;
  }
  function clampt(value) {
    return Math.max(0, Math.min(1, value || 0));
  }
  function hsl2rgb(h3, m1, m22) {
    return (h3 < 60 ? m1 + (m22 - m1) * h3 / 60 : h3 < 180 ? m22 : h3 < 240 ? m1 + (m22 - m1) * (240 - h3) / 60 : m1) * 255;
  }

  // node_modules/d3-interpolate/src/basis.js
  function basis(t12, v0, v1, v22, v3) {
    var t22 = t12 * t12, t3 = t22 * t12;
    return ((1 - 3 * t12 + 3 * t22 - t3) * v0 + (4 - 6 * t22 + 3 * t3) * v1 + (1 + 3 * t12 + 3 * t22 - 3 * t3) * v22 + t3 * v3) / 6;
  }
  function basis_default(values) {
    var n2 = values.length - 1;
    return function(t3) {
      var i3 = t3 <= 0 ? t3 = 0 : t3 >= 1 ? (t3 = 1, n2 - 1) : Math.floor(t3 * n2), v1 = values[i3], v22 = values[i3 + 1], v0 = i3 > 0 ? values[i3 - 1] : 2 * v1 - v22, v3 = i3 < n2 - 1 ? values[i3 + 2] : 2 * v22 - v1;
      return basis((t3 - i3 / n2) * n2, v0, v1, v22, v3);
    };
  }

  // node_modules/d3-interpolate/src/basisClosed.js
  function basisClosed_default(values) {
    var n2 = values.length;
    return function(t3) {
      var i3 = Math.floor(((t3 %= 1) < 0 ? ++t3 : t3) * n2), v0 = values[(i3 + n2 - 1) % n2], v1 = values[i3 % n2], v22 = values[(i3 + 1) % n2], v3 = values[(i3 + 2) % n2];
      return basis((t3 - i3 / n2) * n2, v0, v1, v22, v3);
    };
  }

  // node_modules/d3-interpolate/src/constant.js
  var constant_default2 = (x) => () => x;

  // node_modules/d3-interpolate/src/color.js
  function linear(a3, d3) {
    return function(t3) {
      return a3 + t3 * d3;
    };
  }
  function exponential(a3, b3, y3) {
    return a3 = Math.pow(a3, y3), b3 = Math.pow(b3, y3) - a3, y3 = 1 / y3, function(t3) {
      return Math.pow(a3 + t3 * b3, y3);
    };
  }
  function gamma(y3) {
    return (y3 = +y3) === 1 ? nogamma : function(a3, b3) {
      return b3 - a3 ? exponential(a3, b3, y3) : constant_default2(isNaN(a3) ? b3 : a3);
    };
  }
  function nogamma(a3, b3) {
    var d3 = b3 - a3;
    return d3 ? linear(a3, d3) : constant_default2(isNaN(a3) ? b3 : a3);
  }

  // node_modules/d3-interpolate/src/rgb.js
  var rgb_default = function rgbGamma(y3) {
    var color2 = gamma(y3);
    function rgb2(start2, end) {
      var r3 = color2((start2 = rgb(start2)).r, (end = rgb(end)).r), g3 = color2(start2.g, end.g), b3 = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
      return function(t3) {
        start2.r = r3(t3);
        start2.g = g3(t3);
        start2.b = b3(t3);
        start2.opacity = opacity(t3);
        return start2 + "";
      };
    }
    rgb2.gamma = rgbGamma;
    return rgb2;
  }(1);
  function rgbSpline(spline) {
    return function(colors) {
      var n2 = colors.length, r3 = new Array(n2), g3 = new Array(n2), b3 = new Array(n2), i3, color2;
      for (i3 = 0; i3 < n2; ++i3) {
        color2 = rgb(colors[i3]);
        r3[i3] = color2.r || 0;
        g3[i3] = color2.g || 0;
        b3[i3] = color2.b || 0;
      }
      r3 = spline(r3);
      g3 = spline(g3);
      b3 = spline(b3);
      color2.opacity = 1;
      return function(t3) {
        color2.r = r3(t3);
        color2.g = g3(t3);
        color2.b = b3(t3);
        return color2 + "";
      };
    };
  }
  var rgbBasis = rgbSpline(basis_default);
  var rgbBasisClosed = rgbSpline(basisClosed_default);

  // node_modules/d3-interpolate/src/numberArray.js
  function numberArray_default(a3, b3) {
    if (!b3)
      b3 = [];
    var n2 = a3 ? Math.min(b3.length, a3.length) : 0, c3 = b3.slice(), i3;
    return function(t3) {
      for (i3 = 0; i3 < n2; ++i3)
        c3[i3] = a3[i3] * (1 - t3) + b3[i3] * t3;
      return c3;
    };
  }
  function isNumberArray(x) {
    return ArrayBuffer.isView(x) && !(x instanceof DataView);
  }

  // node_modules/d3-interpolate/src/array.js
  function genericArray(a3, b3) {
    var nb = b3 ? b3.length : 0, na = a3 ? Math.min(nb, a3.length) : 0, x = new Array(na), c3 = new Array(nb), i3;
    for (i3 = 0; i3 < na; ++i3)
      x[i3] = value_default(a3[i3], b3[i3]);
    for (; i3 < nb; ++i3)
      c3[i3] = b3[i3];
    return function(t3) {
      for (i3 = 0; i3 < na; ++i3)
        c3[i3] = x[i3](t3);
      return c3;
    };
  }

  // node_modules/d3-interpolate/src/date.js
  function date_default(a3, b3) {
    var d3 = new Date();
    return a3 = +a3, b3 = +b3, function(t3) {
      return d3.setTime(a3 * (1 - t3) + b3 * t3), d3;
    };
  }

  // node_modules/d3-interpolate/src/number.js
  function number_default(a3, b3) {
    return a3 = +a3, b3 = +b3, function(t3) {
      return a3 * (1 - t3) + b3 * t3;
    };
  }

  // node_modules/d3-interpolate/src/object.js
  function object_default(a3, b3) {
    var i3 = {}, c3 = {}, k3;
    if (a3 === null || typeof a3 !== "object")
      a3 = {};
    if (b3 === null || typeof b3 !== "object")
      b3 = {};
    for (k3 in b3) {
      if (k3 in a3) {
        i3[k3] = value_default(a3[k3], b3[k3]);
      } else {
        c3[k3] = b3[k3];
      }
    }
    return function(t3) {
      for (k3 in i3)
        c3[k3] = i3[k3](t3);
      return c3;
    };
  }

  // node_modules/d3-interpolate/src/string.js
  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
  var reB = new RegExp(reA.source, "g");
  function zero2(b3) {
    return function() {
      return b3;
    };
  }
  function one(b3) {
    return function(t3) {
      return b3(t3) + "";
    };
  }
  function string_default(a3, b3) {
    var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i3 = -1, s2 = [], q = [];
    a3 = a3 + "", b3 = b3 + "";
    while ((am = reA.exec(a3)) && (bm = reB.exec(b3))) {
      if ((bs = bm.index) > bi) {
        bs = b3.slice(bi, bs);
        if (s2[i3])
          s2[i3] += bs;
        else
          s2[++i3] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s2[i3])
          s2[i3] += bm;
        else
          s2[++i3] = bm;
      } else {
        s2[++i3] = null;
        q.push({ i: i3, x: number_default(am, bm) });
      }
      bi = reB.lastIndex;
    }
    if (bi < b3.length) {
      bs = b3.slice(bi);
      if (s2[i3])
        s2[i3] += bs;
      else
        s2[++i3] = bs;
    }
    return s2.length < 2 ? q[0] ? one(q[0].x) : zero2(b3) : (b3 = q.length, function(t3) {
      for (var i4 = 0, o4; i4 < b3; ++i4)
        s2[(o4 = q[i4]).i] = o4.x(t3);
      return s2.join("");
    });
  }

  // node_modules/d3-interpolate/src/value.js
  function value_default(a3, b3) {
    var t3 = typeof b3, c3;
    return b3 == null || t3 === "boolean" ? constant_default2(b3) : (t3 === "number" ? number_default : t3 === "string" ? (c3 = color(b3)) ? (b3 = c3, rgb_default) : string_default : b3 instanceof color ? rgb_default : b3 instanceof Date ? date_default : isNumberArray(b3) ? numberArray_default : Array.isArray(b3) ? genericArray : typeof b3.valueOf !== "function" && typeof b3.toString !== "function" || isNaN(b3) ? object_default : number_default)(a3, b3);
  }

  // node_modules/d3-interpolate/src/round.js
  function round_default(a3, b3) {
    return a3 = +a3, b3 = +b3, function(t3) {
      return Math.round(a3 * (1 - t3) + b3 * t3);
    };
  }

  // node_modules/d3-interpolate/src/transform/decompose.js
  var degrees = 180 / Math.PI;
  var identity = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };
  function decompose_default(a3, b3, c3, d3, e4, f3) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a3 * a3 + b3 * b3))
      a3 /= scaleX, b3 /= scaleX;
    if (skewX = a3 * c3 + b3 * d3)
      c3 -= a3 * skewX, d3 -= b3 * skewX;
    if (scaleY = Math.sqrt(c3 * c3 + d3 * d3))
      c3 /= scaleY, d3 /= scaleY, skewX /= scaleY;
    if (a3 * d3 < b3 * c3)
      a3 = -a3, b3 = -b3, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e4,
      translateY: f3,
      rotate: Math.atan2(b3, a3) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX,
      scaleY
    };
  }

  // node_modules/d3-interpolate/src/transform/parse.js
  var svgNode;
  function parseCss(value) {
    const m3 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
    return m3.isIdentity ? identity : decompose_default(m3.a, m3.b, m3.c, m3.d, m3.e, m3.f);
  }
  function parseSvg(value) {
    if (value == null)
      return identity;
    if (!svgNode)
      svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate()))
      return identity;
    value = value.matrix;
    return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  // node_modules/d3-interpolate/src/transform/index.js
  function interpolateTransform(parse, pxComma, pxParen, degParen) {
    function pop(s2) {
      return s2.length ? s2.pop() + " " : "";
    }
    function translate(xa, ya, xb, yb, s2, q) {
      if (xa !== xb || ya !== yb) {
        var i3 = s2.push("translate(", null, pxComma, null, pxParen);
        q.push({ i: i3 - 4, x: number_default(xa, xb) }, { i: i3 - 2, x: number_default(ya, yb) });
      } else if (xb || yb) {
        s2.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }
    function rotate(a3, b3, s2, q) {
      if (a3 !== b3) {
        if (a3 - b3 > 180)
          b3 += 360;
        else if (b3 - a3 > 180)
          a3 += 360;
        q.push({ i: s2.push(pop(s2) + "rotate(", null, degParen) - 2, x: number_default(a3, b3) });
      } else if (b3) {
        s2.push(pop(s2) + "rotate(" + b3 + degParen);
      }
    }
    function skewX(a3, b3, s2, q) {
      if (a3 !== b3) {
        q.push({ i: s2.push(pop(s2) + "skewX(", null, degParen) - 2, x: number_default(a3, b3) });
      } else if (b3) {
        s2.push(pop(s2) + "skewX(" + b3 + degParen);
      }
    }
    function scale(xa, ya, xb, yb, s2, q) {
      if (xa !== xb || ya !== yb) {
        var i3 = s2.push(pop(s2) + "scale(", null, ",", null, ")");
        q.push({ i: i3 - 4, x: number_default(xa, xb) }, { i: i3 - 2, x: number_default(ya, yb) });
      } else if (xb !== 1 || yb !== 1) {
        s2.push(pop(s2) + "scale(" + xb + "," + yb + ")");
      }
    }
    return function(a3, b3) {
      var s2 = [], q = [];
      a3 = parse(a3), b3 = parse(b3);
      translate(a3.translateX, a3.translateY, b3.translateX, b3.translateY, s2, q);
      rotate(a3.rotate, b3.rotate, s2, q);
      skewX(a3.skewX, b3.skewX, s2, q);
      scale(a3.scaleX, a3.scaleY, b3.scaleX, b3.scaleY, s2, q);
      a3 = b3 = null;
      return function(t3) {
        var i3 = -1, n2 = q.length, o4;
        while (++i3 < n2)
          s2[(o4 = q[i3]).i] = o4.x(t3);
        return s2.join("");
      };
    };
  }
  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  // node_modules/d3-timer/src/timer.js
  var frame = 0;
  var timeout = 0;
  var interval = 0;
  var pokeDelay = 1e3;
  var taskHead;
  var taskTail;
  var clockLast = 0;
  var clockNow = 0;
  var clockSkew = 0;
  var clock = typeof performance === "object" && performance.now ? performance : Date;
  var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f3) {
    setTimeout(f3, 17);
  };
  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }
  function clearNow() {
    clockNow = 0;
  }
  function Timer() {
    this._call = this._time = this._next = null;
  }
  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function")
        throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail)
          taskTail._next = this;
        else
          taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };
  function timer(callback, delay, time) {
    var t3 = new Timer();
    t3.restart(callback, delay, time);
    return t3;
  }
  function timerFlush() {
    now();
    ++frame;
    var t3 = taskHead, e4;
    while (t3) {
      if ((e4 = clockNow - t3._time) >= 0)
        t3._call.call(void 0, e4);
      t3 = t3._next;
    }
    --frame;
  }
  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }
  function poke() {
    var now2 = clock.now(), delay = now2 - clockLast;
    if (delay > pokeDelay)
      clockSkew -= delay, clockLast = now2;
  }
  function nap() {
    var t02, t12 = taskHead, t22, time = Infinity;
    while (t12) {
      if (t12._call) {
        if (time > t12._time)
          time = t12._time;
        t02 = t12, t12 = t12._next;
      } else {
        t22 = t12._next, t12._next = null;
        t12 = t02 ? t02._next = t22 : taskHead = t22;
      }
    }
    taskTail = t02;
    sleep(time);
  }
  function sleep(time) {
    if (frame)
      return;
    if (timeout)
      timeout = clearTimeout(timeout);
    var delay = time - clockNow;
    if (delay > 24) {
      if (time < Infinity)
        timeout = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval)
        interval = clearInterval(interval);
    } else {
      if (!interval)
        clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  // node_modules/d3-timer/src/timeout.js
  function timeout_default(callback, delay, time) {
    var t3 = new Timer();
    delay = delay == null ? 0 : +delay;
    t3.restart((elapsed) => {
      t3.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t3;
  }

  // node_modules/d3-transition/src/transition/schedule.js
  var emptyOn = dispatch_default("start", "end", "cancel", "interrupt");
  var emptyTween = [];
  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var RUNNING = 4;
  var ENDING = 5;
  var ENDED = 6;
  function schedule_default(node, name, id2, index, group, timing) {
    var schedules = node.__transition;
    if (!schedules)
      node.__transition = {};
    else if (id2 in schedules)
      return;
    create(node, id2, {
      name,
      index,
      group,
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }
  function init(node, id2) {
    var schedule = get2(node, id2);
    if (schedule.state > CREATED)
      throw new Error("too late; already scheduled");
    return schedule;
  }
  function set2(node, id2) {
    var schedule = get2(node, id2);
    if (schedule.state > STARTED)
      throw new Error("too late; already running");
    return schedule;
  }
  function get2(node, id2) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id2]))
      throw new Error("transition not found");
    return schedule;
  }
  function create(node, id2, self) {
    var schedules = node.__transition, tween;
    schedules[id2] = self;
    self.timer = timer(schedule, 0, self.time);
    function schedule(elapsed) {
      self.state = SCHEDULED;
      self.timer.restart(start2, self.delay, self.time);
      if (self.delay <= elapsed)
        start2(elapsed - self.delay);
    }
    function start2(elapsed) {
      var i3, j3, n2, o4;
      if (self.state !== SCHEDULED)
        return stop();
      for (i3 in schedules) {
        o4 = schedules[i3];
        if (o4.name !== self.name)
          continue;
        if (o4.state === STARTED)
          return timeout_default(start2);
        if (o4.state === RUNNING) {
          o4.state = ENDED;
          o4.timer.stop();
          o4.on.call("interrupt", node, node.__data__, o4.index, o4.group);
          delete schedules[i3];
        } else if (+i3 < id2) {
          o4.state = ENDED;
          o4.timer.stop();
          o4.on.call("cancel", node, node.__data__, o4.index, o4.group);
          delete schedules[i3];
        }
      }
      timeout_default(function() {
        if (self.state === STARTED) {
          self.state = RUNNING;
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING)
        return;
      self.state = STARTED;
      tween = new Array(n2 = self.tween.length);
      for (i3 = 0, j3 = -1; i3 < n2; ++i3) {
        if (o4 = self.tween[i3].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j3] = o4;
        }
      }
      tween.length = j3 + 1;
    }
    function tick(elapsed) {
      var t3 = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1), i3 = -1, n2 = tween.length;
      while (++i3 < n2) {
        tween[i3].call(node, t3);
      }
      if (self.state === ENDING) {
        self.on.call("end", node, node.__data__, self.index, self.group);
        stop();
      }
    }
    function stop() {
      self.state = ENDED;
      self.timer.stop();
      delete schedules[id2];
      for (var i3 in schedules)
        return;
      delete node.__transition;
    }
  }

  // node_modules/d3-transition/src/interrupt.js
  function interrupt_default(node, name) {
    var schedules = node.__transition, schedule, active, empty3 = true, i3;
    if (!schedules)
      return;
    name = name == null ? null : name + "";
    for (i3 in schedules) {
      if ((schedule = schedules[i3]).name !== name) {
        empty3 = false;
        continue;
      }
      active = schedule.state > STARTING && schedule.state < ENDING;
      schedule.state = ENDED;
      schedule.timer.stop();
      schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
      delete schedules[i3];
    }
    if (empty3)
      delete node.__transition;
  }

  // node_modules/d3-transition/src/selection/interrupt.js
  function interrupt_default2(name) {
    return this.each(function() {
      interrupt_default(this, name);
    });
  }

  // node_modules/d3-transition/src/transition/tween.js
  function tweenRemove(id2, name) {
    var tween0, tween1;
    return function() {
      var schedule = set2(this, id2), tween = schedule.tween;
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i3 = 0, n2 = tween1.length; i3 < n2; ++i3) {
          if (tween1[i3].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i3, 1);
            break;
          }
        }
      }
      schedule.tween = tween1;
    };
  }
  function tweenFunction(id2, name, value) {
    var tween0, tween1;
    if (typeof value !== "function")
      throw new Error();
    return function() {
      var schedule = set2(this, id2), tween = schedule.tween;
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t3 = { name, value }, i3 = 0, n2 = tween1.length; i3 < n2; ++i3) {
          if (tween1[i3].name === name) {
            tween1[i3] = t3;
            break;
          }
        }
        if (i3 === n2)
          tween1.push(t3);
      }
      schedule.tween = tween1;
    };
  }
  function tween_default(name, value) {
    var id2 = this._id;
    name += "";
    if (arguments.length < 2) {
      var tween = get2(this.node(), id2).tween;
      for (var i3 = 0, n2 = tween.length, t3; i3 < n2; ++i3) {
        if ((t3 = tween[i3]).name === name) {
          return t3.value;
        }
      }
      return null;
    }
    return this.each((value == null ? tweenRemove : tweenFunction)(id2, name, value));
  }
  function tweenValue(transition2, name, value) {
    var id2 = transition2._id;
    transition2.each(function() {
      var schedule = set2(this, id2);
      (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
    });
    return function(node) {
      return get2(node, id2).value[name];
    };
  }

  // node_modules/d3-transition/src/transition/interpolate.js
  function interpolate_default(a3, b3) {
    var c3;
    return (typeof b3 === "number" ? number_default : b3 instanceof color ? rgb_default : (c3 = color(b3)) ? (b3 = c3, rgb_default) : string_default)(a3, b3);
  }

  // node_modules/d3-transition/src/transition/attr.js
  function attrRemove2(name) {
    return function() {
      this.removeAttribute(name);
    };
  }
  function attrRemoveNS2(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }
  function attrConstant2(name, interpolate, value1) {
    var string00, string1 = value1 + "", interpolate0;
    return function() {
      var string0 = this.getAttribute(name);
      return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
    };
  }
  function attrConstantNS2(fullname, interpolate, value1) {
    var string00, string1 = value1 + "", interpolate0;
    return function() {
      var string0 = this.getAttributeNS(fullname.space, fullname.local);
      return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
    };
  }
  function attrFunction2(name, interpolate, value) {
    var string00, string10, interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null)
        return void this.removeAttribute(name);
      string0 = this.getAttribute(name);
      string1 = value1 + "";
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }
  function attrFunctionNS2(fullname, interpolate, value) {
    var string00, string10, interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null)
        return void this.removeAttributeNS(fullname.space, fullname.local);
      string0 = this.getAttributeNS(fullname.space, fullname.local);
      string1 = value1 + "";
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }
  function attr_default2(name, value) {
    var fullname = namespace_default(name), i3 = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
    return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS2 : attrFunction2)(fullname, i3, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS2 : attrRemove2)(fullname) : (fullname.local ? attrConstantNS2 : attrConstant2)(fullname, i3, value));
  }

  // node_modules/d3-transition/src/transition/attrTween.js
  function attrInterpolate(name, i3) {
    return function(t3) {
      this.setAttribute(name, i3.call(this, t3));
    };
  }
  function attrInterpolateNS(fullname, i3) {
    return function(t3) {
      this.setAttributeNS(fullname.space, fullname.local, i3.call(this, t3));
    };
  }
  function attrTweenNS(fullname, value) {
    var t02, i0;
    function tween() {
      var i3 = value.apply(this, arguments);
      if (i3 !== i0)
        t02 = (i0 = i3) && attrInterpolateNS(fullname, i3);
      return t02;
    }
    tween._value = value;
    return tween;
  }
  function attrTween(name, value) {
    var t02, i0;
    function tween() {
      var i3 = value.apply(this, arguments);
      if (i3 !== i0)
        t02 = (i0 = i3) && attrInterpolate(name, i3);
      return t02;
    }
    tween._value = value;
    return tween;
  }
  function attrTween_default(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2)
      return (key = this.tween(key)) && key._value;
    if (value == null)
      return this.tween(key, null);
    if (typeof value !== "function")
      throw new Error();
    var fullname = namespace_default(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  // node_modules/d3-transition/src/transition/delay.js
  function delayFunction(id2, value) {
    return function() {
      init(this, id2).delay = +value.apply(this, arguments);
    };
  }
  function delayConstant(id2, value) {
    return value = +value, function() {
      init(this, id2).delay = value;
    };
  }
  function delay_default(value) {
    var id2 = this._id;
    return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id2, value)) : get2(this.node(), id2).delay;
  }

  // node_modules/d3-transition/src/transition/duration.js
  function durationFunction(id2, value) {
    return function() {
      set2(this, id2).duration = +value.apply(this, arguments);
    };
  }
  function durationConstant(id2, value) {
    return value = +value, function() {
      set2(this, id2).duration = value;
    };
  }
  function duration_default(value) {
    var id2 = this._id;
    return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id2, value)) : get2(this.node(), id2).duration;
  }

  // node_modules/d3-transition/src/transition/ease.js
  function easeConstant(id2, value) {
    if (typeof value !== "function")
      throw new Error();
    return function() {
      set2(this, id2).ease = value;
    };
  }
  function ease_default(value) {
    var id2 = this._id;
    return arguments.length ? this.each(easeConstant(id2, value)) : get2(this.node(), id2).ease;
  }

  // node_modules/d3-transition/src/transition/easeVarying.js
  function easeVarying(id2, value) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (typeof v3 !== "function")
        throw new Error();
      set2(this, id2).ease = v3;
    };
  }
  function easeVarying_default(value) {
    if (typeof value !== "function")
      throw new Error();
    return this.each(easeVarying(this._id, value));
  }

  // node_modules/d3-transition/src/transition/filter.js
  function filter_default2(match) {
    if (typeof match !== "function")
      match = matcher_default(match);
    for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j3 = 0; j3 < m3; ++j3) {
      for (var group = groups[j3], n2 = group.length, subgroup = subgroups[j3] = [], node, i3 = 0; i3 < n2; ++i3) {
        if ((node = group[i3]) && match.call(node, node.__data__, i3, group)) {
          subgroup.push(node);
        }
      }
    }
    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  // node_modules/d3-transition/src/transition/merge.js
  function merge_default2(transition2) {
    if (transition2._id !== this._id)
      throw new Error();
    for (var groups0 = this._groups, groups1 = transition2._groups, m0 = groups0.length, m1 = groups1.length, m3 = Math.min(m0, m1), merges = new Array(m0), j3 = 0; j3 < m3; ++j3) {
      for (var group0 = groups0[j3], group1 = groups1[j3], n2 = group0.length, merge = merges[j3] = new Array(n2), node, i3 = 0; i3 < n2; ++i3) {
        if (node = group0[i3] || group1[i3]) {
          merge[i3] = node;
        }
      }
    }
    for (; j3 < m0; ++j3) {
      merges[j3] = groups0[j3];
    }
    return new Transition(merges, this._parents, this._name, this._id);
  }

  // node_modules/d3-transition/src/transition/on.js
  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t3) {
      var i3 = t3.indexOf(".");
      if (i3 >= 0)
        t3 = t3.slice(0, i3);
      return !t3 || t3 === "start";
    });
  }
  function onFunction(id2, name, listener) {
    var on0, on1, sit = start(name) ? init : set2;
    return function() {
      var schedule = sit(this, id2), on = schedule.on;
      if (on !== on0)
        (on1 = (on0 = on).copy()).on(name, listener);
      schedule.on = on1;
    };
  }
  function on_default2(name, listener) {
    var id2 = this._id;
    return arguments.length < 2 ? get2(this.node(), id2).on.on(name) : this.each(onFunction(id2, name, listener));
  }

  // node_modules/d3-transition/src/transition/remove.js
  function removeFunction(id2) {
    return function() {
      var parent = this.parentNode;
      for (var i3 in this.__transition)
        if (+i3 !== id2)
          return;
      if (parent)
        parent.removeChild(this);
    };
  }
  function remove_default2() {
    return this.on("end.remove", removeFunction(this._id));
  }

  // node_modules/d3-transition/src/transition/select.js
  function select_default3(select) {
    var name = this._name, id2 = this._id;
    if (typeof select !== "function")
      select = selector_default(select);
    for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j3 = 0; j3 < m3; ++j3) {
      for (var group = groups[j3], n2 = group.length, subgroup = subgroups[j3] = new Array(n2), node, subnode, i3 = 0; i3 < n2; ++i3) {
        if ((node = group[i3]) && (subnode = select.call(node, node.__data__, i3, group))) {
          if ("__data__" in node)
            subnode.__data__ = node.__data__;
          subgroup[i3] = subnode;
          schedule_default(subgroup[i3], name, id2, i3, subgroup, get2(node, id2));
        }
      }
    }
    return new Transition(subgroups, this._parents, name, id2);
  }

  // node_modules/d3-transition/src/transition/selectAll.js
  function selectAll_default2(select) {
    var name = this._name, id2 = this._id;
    if (typeof select !== "function")
      select = selectorAll_default(select);
    for (var groups = this._groups, m3 = groups.length, subgroups = [], parents = [], j3 = 0; j3 < m3; ++j3) {
      for (var group = groups[j3], n2 = group.length, node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          for (var children2 = select.call(node, node.__data__, i3, group), child, inherit2 = get2(node, id2), k3 = 0, l3 = children2.length; k3 < l3; ++k3) {
            if (child = children2[k3]) {
              schedule_default(child, name, id2, k3, children2, inherit2);
            }
          }
          subgroups.push(children2);
          parents.push(node);
        }
      }
    }
    return new Transition(subgroups, parents, name, id2);
  }

  // node_modules/d3-transition/src/transition/selection.js
  var Selection2 = selection_default.prototype.constructor;
  function selection_default2() {
    return new Selection2(this._groups, this._parents);
  }

  // node_modules/d3-transition/src/transition/style.js
  function styleNull(name, interpolate) {
    var string00, string10, interpolate0;
    return function() {
      var string0 = styleValue(this, name), string1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate(string00 = string0, string10 = string1);
    };
  }
  function styleRemove2(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }
  function styleConstant2(name, interpolate, value1) {
    var string00, string1 = value1 + "", interpolate0;
    return function() {
      var string0 = styleValue(this, name);
      return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
    };
  }
  function styleFunction2(name, interpolate, value) {
    var string00, string10, interpolate0;
    return function() {
      var string0 = styleValue(this, name), value1 = value(this), string1 = value1 + "";
      if (value1 == null)
        string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }
  function styleMaybeRemove(id2, name) {
    var on0, on1, listener0, key = "style." + name, event = "end." + key, remove2;
    return function() {
      var schedule = set2(this, id2), on = schedule.on, listener = schedule.value[key] == null ? remove2 || (remove2 = styleRemove2(name)) : void 0;
      if (on !== on0 || listener0 !== listener)
        (on1 = (on0 = on).copy()).on(event, listener0 = listener);
      schedule.on = on1;
    };
  }
  function style_default2(name, value, priority) {
    var i3 = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
    return value == null ? this.styleTween(name, styleNull(name, i3)).on("end.style." + name, styleRemove2(name)) : typeof value === "function" ? this.styleTween(name, styleFunction2(name, i3, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant2(name, i3, value), priority).on("end.style." + name, null);
  }

  // node_modules/d3-transition/src/transition/styleTween.js
  function styleInterpolate(name, i3, priority) {
    return function(t3) {
      this.style.setProperty(name, i3.call(this, t3), priority);
    };
  }
  function styleTween(name, value, priority) {
    var t3, i0;
    function tween() {
      var i3 = value.apply(this, arguments);
      if (i3 !== i0)
        t3 = (i0 = i3) && styleInterpolate(name, i3, priority);
      return t3;
    }
    tween._value = value;
    return tween;
  }
  function styleTween_default(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2)
      return (key = this.tween(key)) && key._value;
    if (value == null)
      return this.tween(key, null);
    if (typeof value !== "function")
      throw new Error();
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  // node_modules/d3-transition/src/transition/text.js
  function textConstant2(value) {
    return function() {
      this.textContent = value;
    };
  }
  function textFunction2(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }
  function text_default2(value) {
    return this.tween("text", typeof value === "function" ? textFunction2(tweenValue(this, "text", value)) : textConstant2(value == null ? "" : value + ""));
  }

  // node_modules/d3-transition/src/transition/textTween.js
  function textInterpolate(i3) {
    return function(t3) {
      this.textContent = i3.call(this, t3);
    };
  }
  function textTween(value) {
    var t02, i0;
    function tween() {
      var i3 = value.apply(this, arguments);
      if (i3 !== i0)
        t02 = (i0 = i3) && textInterpolate(i3);
      return t02;
    }
    tween._value = value;
    return tween;
  }
  function textTween_default(value) {
    var key = "text";
    if (arguments.length < 1)
      return (key = this.tween(key)) && key._value;
    if (value == null)
      return this.tween(key, null);
    if (typeof value !== "function")
      throw new Error();
    return this.tween(key, textTween(value));
  }

  // node_modules/d3-transition/src/transition/transition.js
  function transition_default() {
    var name = this._name, id0 = this._id, id1 = newId();
    for (var groups = this._groups, m3 = groups.length, j3 = 0; j3 < m3; ++j3) {
      for (var group = groups[j3], n2 = group.length, node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          var inherit2 = get2(node, id0);
          schedule_default(node, name, id1, i3, group, {
            time: inherit2.time + inherit2.delay + inherit2.duration,
            delay: 0,
            duration: inherit2.duration,
            ease: inherit2.ease
          });
        }
      }
    }
    return new Transition(groups, this._parents, name, id1);
  }

  // node_modules/d3-transition/src/transition/end.js
  function end_default() {
    var on0, on1, that = this, id2 = that._id, size = that.size();
    return new Promise(function(resolve, reject) {
      var cancel = { value: reject }, end = { value: function() {
        if (--size === 0)
          resolve();
      } };
      that.each(function() {
        var schedule = set2(this, id2), on = schedule.on;
        if (on !== on0) {
          on1 = (on0 = on).copy();
          on1._.cancel.push(cancel);
          on1._.interrupt.push(cancel);
          on1._.end.push(end);
        }
        schedule.on = on1;
      });
      if (size === 0)
        resolve();
    });
  }

  // node_modules/d3-transition/src/transition/index.js
  var id = 0;
  function Transition(groups, parents, name, id2) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id2;
  }
  function transition(name) {
    return selection_default().transition(name);
  }
  function newId() {
    return ++id;
  }
  var selection_prototype = selection_default.prototype;
  Transition.prototype = transition.prototype = {
    constructor: Transition,
    select: select_default3,
    selectAll: selectAll_default2,
    selectChild: selection_prototype.selectChild,
    selectChildren: selection_prototype.selectChildren,
    filter: filter_default2,
    merge: merge_default2,
    selection: selection_default2,
    transition: transition_default,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: on_default2,
    attr: attr_default2,
    attrTween: attrTween_default,
    style: style_default2,
    styleTween: styleTween_default,
    text: text_default2,
    textTween: textTween_default,
    remove: remove_default2,
    tween: tween_default,
    delay: delay_default,
    duration: duration_default,
    ease: ease_default,
    easeVarying: easeVarying_default,
    end: end_default,
    [Symbol.iterator]: selection_prototype[Symbol.iterator]
  };

  // node_modules/d3-ease/src/cubic.js
  function cubicInOut(t3) {
    return ((t3 *= 2) <= 1 ? t3 * t3 * t3 : (t3 -= 2) * t3 * t3 + 2) / 2;
  }

  // node_modules/d3-transition/src/selection/transition.js
  var defaultTiming = {
    time: null,
    delay: 0,
    duration: 250,
    ease: cubicInOut
  };
  function inherit(node, id2) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id2])) {
      if (!(node = node.parentNode)) {
        throw new Error(`transition ${id2} not found`);
      }
    }
    return timing;
  }
  function transition_default2(name) {
    var id2, timing;
    if (name instanceof Transition) {
      id2 = name._id, name = name._name;
    } else {
      id2 = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
    }
    for (var groups = this._groups, m3 = groups.length, j3 = 0; j3 < m3; ++j3) {
      for (var group = groups[j3], n2 = group.length, node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          schedule_default(node, name, id2, i3, group, timing || inherit(node, id2));
        }
      }
    }
    return new Transition(groups, this._parents, name, id2);
  }

  // node_modules/d3-transition/src/selection/index.js
  selection_default.prototype.interrupt = interrupt_default2;
  selection_default.prototype.transition = transition_default2;

  // node_modules/d3-brush/src/constant.js
  var constant_default3 = (x) => () => x;

  // node_modules/d3-brush/src/event.js
  function BrushEvent(type2, {
    sourceEvent,
    target,
    selection: selection2,
    mode,
    dispatch: dispatch2
  }) {
    Object.defineProperties(this, {
      type: { value: type2, enumerable: true, configurable: true },
      sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
      target: { value: target, enumerable: true, configurable: true },
      selection: { value: selection2, enumerable: true, configurable: true },
      mode: { value: mode, enumerable: true, configurable: true },
      _: { value: dispatch2 }
    });
  }

  // node_modules/d3-brush/src/noevent.js
  function nopropagation(event) {
    event.stopImmediatePropagation();
  }
  function noevent_default2(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  // node_modules/d3-brush/src/brush.js
  var MODE_DRAG = { name: "drag" };
  var MODE_SPACE = { name: "space" };
  var MODE_HANDLE = { name: "handle" };
  var MODE_CENTER = { name: "center" };
  var { abs, max: max2, min } = Math;
  function number1(e4) {
    return [+e4[0], +e4[1]];
  }
  function number22(e4) {
    return [number1(e4[0]), number1(e4[1])];
  }
  var X = {
    name: "x",
    handles: ["w", "e"].map(type),
    input: function(x, e4) {
      return x == null ? null : [[+x[0], e4[0][1]], [+x[1], e4[1][1]]];
    },
    output: function(xy) {
      return xy && [xy[0][0], xy[1][0]];
    }
  };
  var Y = {
    name: "y",
    handles: ["n", "s"].map(type),
    input: function(y3, e4) {
      return y3 == null ? null : [[e4[0][0], +y3[0]], [e4[1][0], +y3[1]]];
    },
    output: function(xy) {
      return xy && [xy[0][1], xy[1][1]];
    }
  };
  var XY = {
    name: "xy",
    handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type),
    input: function(xy) {
      return xy == null ? null : number22(xy);
    },
    output: function(xy) {
      return xy;
    }
  };
  var cursors = {
    overlay: "crosshair",
    selection: "move",
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };
  var flipX = {
    e: "w",
    w: "e",
    nw: "ne",
    ne: "nw",
    se: "sw",
    sw: "se"
  };
  var flipY = {
    n: "s",
    s: "n",
    nw: "sw",
    ne: "se",
    se: "ne",
    sw: "nw"
  };
  var signsX = {
    overlay: 1,
    selection: 1,
    n: null,
    e: 1,
    s: null,
    w: -1,
    nw: -1,
    ne: 1,
    se: 1,
    sw: -1
  };
  var signsY = {
    overlay: 1,
    selection: 1,
    n: -1,
    e: null,
    s: 1,
    w: null,
    nw: -1,
    ne: -1,
    se: 1,
    sw: 1
  };
  function type(t3) {
    return { type: t3 };
  }
  function defaultFilter(event) {
    return !event.ctrlKey && !event.button;
  }
  function defaultExtent() {
    var svg = this.ownerSVGElement || this;
    if (svg.hasAttribute("viewBox")) {
      svg = svg.viewBox.baseVal;
      return [[svg.x, svg.y], [svg.x + svg.width, svg.y + svg.height]];
    }
    return [[0, 0], [svg.width.baseVal.value, svg.height.baseVal.value]];
  }
  function defaultTouchable() {
    return navigator.maxTouchPoints || "ontouchstart" in this;
  }
  function local(node) {
    while (!node.__brush)
      if (!(node = node.parentNode))
        return;
    return node.__brush;
  }
  function empty2(extent2) {
    return extent2[0][0] === extent2[1][0] || extent2[0][1] === extent2[1][1];
  }
  function brushX() {
    return brush(X);
  }
  function brush(dim) {
    var extent2 = defaultExtent, filter2 = defaultFilter, touchable = defaultTouchable, keys = true, listeners = dispatch_default("start", "brush", "end"), handleSize = 6, touchending;
    function brush2(group) {
      var overlay = group.property("__brush", initialize).selectAll(".overlay").data([type("overlay")]);
      overlay.enter().append("rect").attr("class", "overlay").attr("pointer-events", "all").attr("cursor", cursors.overlay).merge(overlay).each(function() {
        var extent3 = local(this).extent;
        select_default2(this).attr("x", extent3[0][0]).attr("y", extent3[0][1]).attr("width", extent3[1][0] - extent3[0][0]).attr("height", extent3[1][1] - extent3[0][1]);
      });
      group.selectAll(".selection").data([type("selection")]).enter().append("rect").attr("class", "selection").attr("cursor", cursors.selection).attr("fill", "#777").attr("fill-opacity", 0.3).attr("stroke", "#fff").attr("shape-rendering", "crispEdges");
      var handle = group.selectAll(".handle").data(dim.handles, function(d3) {
        return d3.type;
      });
      handle.exit().remove();
      handle.enter().append("rect").attr("class", function(d3) {
        return "handle handle--" + d3.type;
      }).attr("cursor", function(d3) {
        return cursors[d3.type];
      });
      group.each(redraw).attr("fill", "none").attr("pointer-events", "all").on("mousedown.brush", started).filter(touchable).on("touchstart.brush", started).on("touchmove.brush", touchmoved).on("touchend.brush touchcancel.brush", touchended).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
    }
    brush2.move = function(group, selection2, event) {
      if (group.tween) {
        group.on("start.brush", function(event2) {
          emitter(this, arguments).beforestart().start(event2);
        }).on("interrupt.brush end.brush", function(event2) {
          emitter(this, arguments).end(event2);
        }).tween("brush", function() {
          var that = this, state = that.__brush, emit = emitter(that, arguments), selection0 = state.selection, selection1 = dim.input(typeof selection2 === "function" ? selection2.apply(this, arguments) : selection2, state.extent), i3 = value_default(selection0, selection1);
          function tween(t3) {
            state.selection = t3 === 1 && selection1 === null ? null : i3(t3);
            redraw.call(that);
            emit.brush();
          }
          return selection0 !== null && selection1 !== null ? tween : tween(1);
        });
      } else {
        group.each(function() {
          var that = this, args = arguments, state = that.__brush, selection1 = dim.input(typeof selection2 === "function" ? selection2.apply(that, args) : selection2, state.extent), emit = emitter(that, args).beforestart();
          interrupt_default(that);
          state.selection = selection1 === null ? null : selection1;
          redraw.call(that);
          emit.start(event).brush(event).end(event);
        });
      }
    };
    brush2.clear = function(group, event) {
      brush2.move(group, null, event);
    };
    function redraw() {
      var group = select_default2(this), selection2 = local(this).selection;
      if (selection2) {
        group.selectAll(".selection").style("display", null).attr("x", selection2[0][0]).attr("y", selection2[0][1]).attr("width", selection2[1][0] - selection2[0][0]).attr("height", selection2[1][1] - selection2[0][1]);
        group.selectAll(".handle").style("display", null).attr("x", function(d3) {
          return d3.type[d3.type.length - 1] === "e" ? selection2[1][0] - handleSize / 2 : selection2[0][0] - handleSize / 2;
        }).attr("y", function(d3) {
          return d3.type[0] === "s" ? selection2[1][1] - handleSize / 2 : selection2[0][1] - handleSize / 2;
        }).attr("width", function(d3) {
          return d3.type === "n" || d3.type === "s" ? selection2[1][0] - selection2[0][0] + handleSize : handleSize;
        }).attr("height", function(d3) {
          return d3.type === "e" || d3.type === "w" ? selection2[1][1] - selection2[0][1] + handleSize : handleSize;
        });
      } else {
        group.selectAll(".selection,.handle").style("display", "none").attr("x", null).attr("y", null).attr("width", null).attr("height", null);
      }
    }
    function emitter(that, args, clean) {
      var emit = that.__brush.emitter;
      return emit && (!clean || !emit.clean) ? emit : new Emitter(that, args, clean);
    }
    function Emitter(that, args, clean) {
      this.that = that;
      this.args = args;
      this.state = that.__brush;
      this.active = 0;
      this.clean = clean;
    }
    Emitter.prototype = {
      beforestart: function() {
        if (++this.active === 1)
          this.state.emitter = this, this.starting = true;
        return this;
      },
      start: function(event, mode) {
        if (this.starting)
          this.starting = false, this.emit("start", event, mode);
        else
          this.emit("brush", event);
        return this;
      },
      brush: function(event, mode) {
        this.emit("brush", event, mode);
        return this;
      },
      end: function(event, mode) {
        if (--this.active === 0)
          delete this.state.emitter, this.emit("end", event, mode);
        return this;
      },
      emit: function(type2, event, mode) {
        var d3 = select_default2(this.that).datum();
        listeners.call(
          type2,
          this.that,
          new BrushEvent(type2, {
            sourceEvent: event,
            target: brush2,
            selection: dim.output(this.state.selection),
            mode,
            dispatch: listeners
          }),
          d3
        );
      }
    };
    function started(event) {
      if (touchending && !event.touches)
        return;
      if (!filter2.apply(this, arguments))
        return;
      var that = this, type2 = event.target.__data__.type, mode = (keys && event.metaKey ? type2 = "overlay" : type2) === "selection" ? MODE_DRAG : keys && event.altKey ? MODE_CENTER : MODE_HANDLE, signX = dim === Y ? null : signsX[type2], signY = dim === X ? null : signsY[type2], state = local(that), extent3 = state.extent, selection2 = state.selection, W = extent3[0][0], w0, w1, N2 = extent3[0][1], n0, n1, E = extent3[1][0], e0, e1, S = extent3[1][1], s0, s1, dx = 0, dy = 0, moving, shifting = signX && signY && keys && event.shiftKey, lockX, lockY, points = Array.from(event.touches || [event], (t3) => {
        const i3 = t3.identifier;
        t3 = pointer_default(t3, that);
        t3.point0 = t3.slice();
        t3.identifier = i3;
        return t3;
      });
      interrupt_default(that);
      var emit = emitter(that, arguments, true).beforestart();
      if (type2 === "overlay") {
        if (selection2)
          moving = true;
        const pts = [points[0], points[1] || points[0]];
        state.selection = selection2 = [[
          w0 = dim === Y ? W : min(pts[0][0], pts[1][0]),
          n0 = dim === X ? N2 : min(pts[0][1], pts[1][1])
        ], [
          e0 = dim === Y ? E : max2(pts[0][0], pts[1][0]),
          s0 = dim === X ? S : max2(pts[0][1], pts[1][1])
        ]];
        if (points.length > 1)
          move(event);
      } else {
        w0 = selection2[0][0];
        n0 = selection2[0][1];
        e0 = selection2[1][0];
        s0 = selection2[1][1];
      }
      w1 = w0;
      n1 = n0;
      e1 = e0;
      s1 = s0;
      var group = select_default2(that).attr("pointer-events", "none");
      var overlay = group.selectAll(".overlay").attr("cursor", cursors[type2]);
      if (event.touches) {
        emit.moved = moved;
        emit.ended = ended;
      } else {
        var view = select_default2(event.view).on("mousemove.brush", moved, true).on("mouseup.brush", ended, true);
        if (keys)
          view.on("keydown.brush", keydowned, true).on("keyup.brush", keyupped, true);
        nodrag_default(event.view);
      }
      redraw.call(that);
      emit.start(event, mode.name);
      function moved(event2) {
        for (const p3 of event2.changedTouches || [event2]) {
          for (const d3 of points)
            if (d3.identifier === p3.identifier)
              d3.cur = pointer_default(p3, that);
        }
        if (shifting && !lockX && !lockY && points.length === 1) {
          const point = points[0];
          if (abs(point.cur[0] - point[0]) > abs(point.cur[1] - point[1]))
            lockY = true;
          else
            lockX = true;
        }
        for (const point of points)
          if (point.cur)
            point[0] = point.cur[0], point[1] = point.cur[1];
        moving = true;
        noevent_default2(event2);
        move(event2);
      }
      function move(event2) {
        const point = points[0], point0 = point.point0;
        var t3;
        dx = point[0] - point0[0];
        dy = point[1] - point0[1];
        switch (mode) {
          case MODE_SPACE:
          case MODE_DRAG: {
            if (signX)
              dx = max2(W - w0, min(E - e0, dx)), w1 = w0 + dx, e1 = e0 + dx;
            if (signY)
              dy = max2(N2 - n0, min(S - s0, dy)), n1 = n0 + dy, s1 = s0 + dy;
            break;
          }
          case MODE_HANDLE: {
            if (points[1]) {
              if (signX)
                w1 = max2(W, min(E, points[0][0])), e1 = max2(W, min(E, points[1][0])), signX = 1;
              if (signY)
                n1 = max2(N2, min(S, points[0][1])), s1 = max2(N2, min(S, points[1][1])), signY = 1;
            } else {
              if (signX < 0)
                dx = max2(W - w0, min(E - w0, dx)), w1 = w0 + dx, e1 = e0;
              else if (signX > 0)
                dx = max2(W - e0, min(E - e0, dx)), w1 = w0, e1 = e0 + dx;
              if (signY < 0)
                dy = max2(N2 - n0, min(S - n0, dy)), n1 = n0 + dy, s1 = s0;
              else if (signY > 0)
                dy = max2(N2 - s0, min(S - s0, dy)), n1 = n0, s1 = s0 + dy;
            }
            break;
          }
          case MODE_CENTER: {
            if (signX)
              w1 = max2(W, min(E, w0 - dx * signX)), e1 = max2(W, min(E, e0 + dx * signX));
            if (signY)
              n1 = max2(N2, min(S, n0 - dy * signY)), s1 = max2(N2, min(S, s0 + dy * signY));
            break;
          }
        }
        if (e1 < w1) {
          signX *= -1;
          t3 = w0, w0 = e0, e0 = t3;
          t3 = w1, w1 = e1, e1 = t3;
          if (type2 in flipX)
            overlay.attr("cursor", cursors[type2 = flipX[type2]]);
        }
        if (s1 < n1) {
          signY *= -1;
          t3 = n0, n0 = s0, s0 = t3;
          t3 = n1, n1 = s1, s1 = t3;
          if (type2 in flipY)
            overlay.attr("cursor", cursors[type2 = flipY[type2]]);
        }
        if (state.selection)
          selection2 = state.selection;
        if (lockX)
          w1 = selection2[0][0], e1 = selection2[1][0];
        if (lockY)
          n1 = selection2[0][1], s1 = selection2[1][1];
        if (selection2[0][0] !== w1 || selection2[0][1] !== n1 || selection2[1][0] !== e1 || selection2[1][1] !== s1) {
          state.selection = [[w1, n1], [e1, s1]];
          redraw.call(that);
          emit.brush(event2, mode.name);
        }
      }
      function ended(event2) {
        nopropagation(event2);
        if (event2.touches) {
          if (event2.touches.length)
            return;
          if (touchending)
            clearTimeout(touchending);
          touchending = setTimeout(function() {
            touchending = null;
          }, 500);
        } else {
          yesdrag(event2.view, moving);
          view.on("keydown.brush keyup.brush mousemove.brush mouseup.brush", null);
        }
        group.attr("pointer-events", "all");
        overlay.attr("cursor", cursors.overlay);
        if (state.selection)
          selection2 = state.selection;
        if (empty2(selection2))
          state.selection = null, redraw.call(that);
        emit.end(event2, mode.name);
      }
      function keydowned(event2) {
        switch (event2.keyCode) {
          case 16: {
            shifting = signX && signY;
            break;
          }
          case 18: {
            if (mode === MODE_HANDLE) {
              if (signX)
                e0 = e1 - dx * signX, w0 = w1 + dx * signX;
              if (signY)
                s0 = s1 - dy * signY, n0 = n1 + dy * signY;
              mode = MODE_CENTER;
              move(event2);
            }
            break;
          }
          case 32: {
            if (mode === MODE_HANDLE || mode === MODE_CENTER) {
              if (signX < 0)
                e0 = e1 - dx;
              else if (signX > 0)
                w0 = w1 - dx;
              if (signY < 0)
                s0 = s1 - dy;
              else if (signY > 0)
                n0 = n1 - dy;
              mode = MODE_SPACE;
              overlay.attr("cursor", cursors.selection);
              move(event2);
            }
            break;
          }
          default:
            return;
        }
        noevent_default2(event2);
      }
      function keyupped(event2) {
        switch (event2.keyCode) {
          case 16: {
            if (shifting) {
              lockX = lockY = shifting = false;
              move(event2);
            }
            break;
          }
          case 18: {
            if (mode === MODE_CENTER) {
              if (signX < 0)
                e0 = e1;
              else if (signX > 0)
                w0 = w1;
              if (signY < 0)
                s0 = s1;
              else if (signY > 0)
                n0 = n1;
              mode = MODE_HANDLE;
              move(event2);
            }
            break;
          }
          case 32: {
            if (mode === MODE_SPACE) {
              if (event2.altKey) {
                if (signX)
                  e0 = e1 - dx * signX, w0 = w1 + dx * signX;
                if (signY)
                  s0 = s1 - dy * signY, n0 = n1 + dy * signY;
                mode = MODE_CENTER;
              } else {
                if (signX < 0)
                  e0 = e1;
                else if (signX > 0)
                  w0 = w1;
                if (signY < 0)
                  s0 = s1;
                else if (signY > 0)
                  n0 = n1;
                mode = MODE_HANDLE;
              }
              overlay.attr("cursor", cursors[type2]);
              move(event2);
            }
            break;
          }
          default:
            return;
        }
        noevent_default2(event2);
      }
    }
    function touchmoved(event) {
      emitter(this, arguments).moved(event);
    }
    function touchended(event) {
      emitter(this, arguments).ended(event);
    }
    function initialize() {
      var state = this.__brush || { selection: null };
      state.extent = number22(extent2.apply(this, arguments));
      state.dim = dim;
      return state;
    }
    brush2.extent = function(_3) {
      return arguments.length ? (extent2 = typeof _3 === "function" ? _3 : constant_default3(number22(_3)), brush2) : extent2;
    };
    brush2.filter = function(_3) {
      return arguments.length ? (filter2 = typeof _3 === "function" ? _3 : constant_default3(!!_3), brush2) : filter2;
    };
    brush2.touchable = function(_3) {
      return arguments.length ? (touchable = typeof _3 === "function" ? _3 : constant_default3(!!_3), brush2) : touchable;
    };
    brush2.handleSize = function(_3) {
      return arguments.length ? (handleSize = +_3, brush2) : handleSize;
    };
    brush2.keyModifiers = function(_3) {
      return arguments.length ? (keys = !!_3, brush2) : keys;
    };
    brush2.on = function() {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? brush2 : value;
    };
    return brush2;
  }

  // node_modules/d3-format/src/formatDecimal.js
  function formatDecimal_default(x) {
    return Math.abs(x = Math.round(x)) >= 1e21 ? x.toLocaleString("en").replace(/,/g, "") : x.toString(10);
  }
  function formatDecimalParts(x, p3) {
    if ((i3 = (x = p3 ? x.toExponential(p3 - 1) : x.toExponential()).indexOf("e")) < 0)
      return null;
    var i3, coefficient = x.slice(0, i3);
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x.slice(i3 + 1)
    ];
  }

  // node_modules/d3-format/src/exponent.js
  function exponent_default(x) {
    return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
  }

  // node_modules/d3-format/src/formatGroup.js
  function formatGroup_default(grouping, thousands) {
    return function(value, width) {
      var i3 = value.length, t3 = [], j3 = 0, g3 = grouping[0], length = 0;
      while (i3 > 0 && g3 > 0) {
        if (length + g3 + 1 > width)
          g3 = Math.max(1, width - length);
        t3.push(value.substring(i3 -= g3, i3 + g3));
        if ((length += g3 + 1) > width)
          break;
        g3 = grouping[j3 = (j3 + 1) % grouping.length];
      }
      return t3.reverse().join(thousands);
    };
  }

  // node_modules/d3-format/src/formatNumerals.js
  function formatNumerals_default(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i3) {
        return numerals[+i3];
      });
    };
  }

  // node_modules/d3-format/src/formatSpecifier.js
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier)))
      throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }
  formatSpecifier.prototype = FormatSpecifier.prototype;
  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
    this.align = specifier.align === void 0 ? ">" : specifier.align + "";
    this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === void 0 ? void 0 : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === void 0 ? "" : specifier.type + "";
  }
  FormatSpecifier.prototype.toString = function() {
    return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
  };

  // node_modules/d3-format/src/formatTrim.js
  function formatTrim_default(s2) {
    out:
      for (var n2 = s2.length, i3 = 1, i0 = -1, i1; i3 < n2; ++i3) {
        switch (s2[i3]) {
          case ".":
            i0 = i1 = i3;
            break;
          case "0":
            if (i0 === 0)
              i0 = i3;
            i1 = i3;
            break;
          default:
            if (!+s2[i3])
              break out;
            if (i0 > 0)
              i0 = 0;
            break;
        }
      }
    return i0 > 0 ? s2.slice(0, i0) + s2.slice(i1 + 1) : s2;
  }

  // node_modules/d3-format/src/formatPrefixAuto.js
  var prefixExponent;
  function formatPrefixAuto_default(x, p3) {
    var d3 = formatDecimalParts(x, p3);
    if (!d3)
      return x + "";
    var coefficient = d3[0], exponent = d3[1], i3 = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n2 = coefficient.length;
    return i3 === n2 ? coefficient : i3 > n2 ? coefficient + new Array(i3 - n2 + 1).join("0") : i3 > 0 ? coefficient.slice(0, i3) + "." + coefficient.slice(i3) : "0." + new Array(1 - i3).join("0") + formatDecimalParts(x, Math.max(0, p3 + i3 - 1))[0];
  }

  // node_modules/d3-format/src/formatRounded.js
  function formatRounded_default(x, p3) {
    var d3 = formatDecimalParts(x, p3);
    if (!d3)
      return x + "";
    var coefficient = d3[0], exponent = d3[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  // node_modules/d3-format/src/formatTypes.js
  var formatTypes_default = {
    "%": (x, p3) => (x * 100).toFixed(p3),
    "b": (x) => Math.round(x).toString(2),
    "c": (x) => x + "",
    "d": formatDecimal_default,
    "e": (x, p3) => x.toExponential(p3),
    "f": (x, p3) => x.toFixed(p3),
    "g": (x, p3) => x.toPrecision(p3),
    "o": (x) => Math.round(x).toString(8),
    "p": (x, p3) => formatRounded_default(x * 100, p3),
    "r": formatRounded_default,
    "s": formatPrefixAuto_default,
    "X": (x) => Math.round(x).toString(16).toUpperCase(),
    "x": (x) => Math.round(x).toString(16)
  };

  // node_modules/d3-format/src/identity.js
  function identity_default2(x) {
    return x;
  }

  // node_modules/d3-format/src/locale.js
  var map = Array.prototype.map;
  var prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
  function locale_default(locale3) {
    var group = locale3.grouping === void 0 || locale3.thousands === void 0 ? identity_default2 : formatGroup_default(map.call(locale3.grouping, Number), locale3.thousands + ""), currencyPrefix = locale3.currency === void 0 ? "" : locale3.currency[0] + "", currencySuffix = locale3.currency === void 0 ? "" : locale3.currency[1] + "", decimal = locale3.decimal === void 0 ? "." : locale3.decimal + "", numerals = locale3.numerals === void 0 ? identity_default2 : formatNumerals_default(map.call(locale3.numerals, String)), percent = locale3.percent === void 0 ? "%" : locale3.percent + "", minus = locale3.minus === void 0 ? "\u2212" : locale3.minus + "", nan = locale3.nan === void 0 ? "NaN" : locale3.nan + "";
    function newFormat(specifier) {
      specifier = formatSpecifier(specifier);
      var fill = specifier.fill, align = specifier.align, sign = specifier.sign, symbol = specifier.symbol, zero3 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type2 = specifier.type;
      if (type2 === "n")
        comma = true, type2 = "g";
      else if (!formatTypes_default[type2])
        precision === void 0 && (precision = 12), trim = true, type2 = "g";
      if (zero3 || fill === "0" && align === "=")
        zero3 = true, fill = "0", align = "=";
      var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type2) ? "0" + type2.toLowerCase() : "", suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type2) ? percent : "";
      var formatType = formatTypes_default[type2], maybeSuffix = /[defgprs%]/.test(type2);
      precision = precision === void 0 ? 6 : /[gprs]/.test(type2) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
      function format2(value) {
        var valuePrefix = prefix, valueSuffix = suffix, i3, n2, c3;
        if (type2 === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;
          var valueNegative = value < 0 || 1 / value < 0;
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
          if (trim)
            value = formatTrim_default(value);
          if (valueNegative && +value === 0 && sign !== "+")
            valueNegative = false;
          valuePrefix = (valueNegative ? sign === "(" ? sign : minus : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = (type2 === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");
          if (maybeSuffix) {
            i3 = -1, n2 = value.length;
            while (++i3 < n2) {
              if (c3 = value.charCodeAt(i3), 48 > c3 || c3 > 57) {
                valueSuffix = (c3 === 46 ? decimal + value.slice(i3 + 1) : value.slice(i3)) + valueSuffix;
                value = value.slice(0, i3);
                break;
              }
            }
          }
        }
        if (comma && !zero3)
          value = group(value, Infinity);
        var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
        if (comma && zero3)
          value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
        switch (align) {
          case "<":
            value = valuePrefix + value + valueSuffix + padding;
            break;
          case "=":
            value = valuePrefix + padding + value + valueSuffix;
            break;
          case "^":
            value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
            break;
          default:
            value = padding + valuePrefix + value + valueSuffix;
            break;
        }
        return numerals(value);
      }
      format2.toString = function() {
        return specifier + "";
      };
      return format2;
    }
    function formatPrefix2(specifier, value) {
      var f3 = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)), e4 = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k3 = Math.pow(10, -e4), prefix = prefixes[8 + e4 / 3];
      return function(value2) {
        return f3(k3 * value2) + prefix;
      };
    }
    return {
      format: newFormat,
      formatPrefix: formatPrefix2
    };
  }

  // node_modules/d3-format/src/defaultLocale.js
  var locale;
  var format;
  var formatPrefix;
  defaultLocale({
    thousands: ",",
    grouping: [3],
    currency: ["$", ""]
  });
  function defaultLocale(definition) {
    locale = locale_default(definition);
    format = locale.format;
    formatPrefix = locale.formatPrefix;
    return locale;
  }

  // node_modules/d3-format/src/precisionFixed.js
  function precisionFixed_default(step) {
    return Math.max(0, -exponent_default(Math.abs(step)));
  }

  // node_modules/d3-format/src/precisionPrefix.js
  function precisionPrefix_default(step, value) {
    return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3 - exponent_default(Math.abs(step)));
  }

  // node_modules/d3-format/src/precisionRound.js
  function precisionRound_default(step, max3) {
    step = Math.abs(step), max3 = Math.abs(max3) - step;
    return Math.max(0, exponent_default(max3) - exponent_default(step)) + 1;
  }

  // node_modules/d3-scale/src/init.js
  function initRange(domain, range) {
    switch (arguments.length) {
      case 0:
        break;
      case 1:
        this.range(domain);
        break;
      default:
        this.range(range).domain(domain);
        break;
    }
    return this;
  }

  // node_modules/d3-scale/src/constant.js
  function constants(x) {
    return function() {
      return x;
    };
  }

  // node_modules/d3-scale/src/number.js
  function number3(x) {
    return +x;
  }

  // node_modules/d3-scale/src/continuous.js
  var unit = [0, 1];
  function identity2(x) {
    return x;
  }
  function normalize(a3, b3) {
    return (b3 -= a3 = +a3) ? function(x) {
      return (x - a3) / b3;
    } : constants(isNaN(b3) ? NaN : 0.5);
  }
  function clamper(a3, b3) {
    var t3;
    if (a3 > b3)
      t3 = a3, a3 = b3, b3 = t3;
    return function(x) {
      return Math.max(a3, Math.min(b3, x));
    };
  }
  function bimap(domain, range, interpolate) {
    var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
    if (d1 < d0)
      d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
    else
      d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
    return function(x) {
      return r0(d0(x));
    };
  }
  function polymap(domain, range, interpolate) {
    var j3 = Math.min(domain.length, range.length) - 1, d3 = new Array(j3), r3 = new Array(j3), i3 = -1;
    if (domain[j3] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++i3 < j3) {
      d3[i3] = normalize(domain[i3], domain[i3 + 1]);
      r3[i3] = interpolate(range[i3], range[i3 + 1]);
    }
    return function(x) {
      var i4 = bisect_default(domain, x, 1, j3) - 1;
      return r3[i4](d3[i4](x));
    };
  }
  function copy(source, target) {
    return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp()).unknown(source.unknown());
  }
  function transformer() {
    var domain = unit, range = unit, interpolate = value_default, transform2, untransform, unknown, clamp = identity2, piecewise, output, input;
    function rescale() {
      var n2 = Math.min(domain.length, range.length);
      if (clamp !== identity2)
        clamp = clamper(domain[0], domain[n2 - 1]);
      piecewise = n2 > 2 ? polymap : bimap;
      output = input = null;
      return scale;
    }
    function scale(x) {
      return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform2), range, interpolate)))(transform2(clamp(x)));
    }
    scale.invert = function(y3) {
      return clamp(untransform((input || (input = piecewise(range, domain.map(transform2), number_default)))(y3)));
    };
    scale.domain = function(_3) {
      return arguments.length ? (domain = Array.from(_3, number3), rescale()) : domain.slice();
    };
    scale.range = function(_3) {
      return arguments.length ? (range = Array.from(_3), rescale()) : range.slice();
    };
    scale.rangeRound = function(_3) {
      return range = Array.from(_3), interpolate = round_default, rescale();
    };
    scale.clamp = function(_3) {
      return arguments.length ? (clamp = _3 ? true : identity2, rescale()) : clamp !== identity2;
    };
    scale.interpolate = function(_3) {
      return arguments.length ? (interpolate = _3, rescale()) : interpolate;
    };
    scale.unknown = function(_3) {
      return arguments.length ? (unknown = _3, scale) : unknown;
    };
    return function(t3, u3) {
      transform2 = t3, untransform = u3;
      return rescale();
    };
  }
  function continuous() {
    return transformer()(identity2, identity2);
  }

  // node_modules/d3-scale/src/tickFormat.js
  function tickFormat(start2, stop, count, specifier) {
    var step = tickStep(start2, stop, count), precision;
    specifier = formatSpecifier(specifier == null ? ",f" : specifier);
    switch (specifier.type) {
      case "s": {
        var value = Math.max(Math.abs(start2), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix_default(step, value)))
          specifier.precision = precision;
        return formatPrefix(specifier, value);
      }
      case "":
      case "e":
      case "g":
      case "p":
      case "r": {
        if (specifier.precision == null && !isNaN(precision = precisionRound_default(step, Math.max(Math.abs(start2), Math.abs(stop)))))
          specifier.precision = precision - (specifier.type === "e");
        break;
      }
      case "f":
      case "%": {
        if (specifier.precision == null && !isNaN(precision = precisionFixed_default(step)))
          specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
    }
    return format(specifier);
  }

  // node_modules/d3-scale/src/linear.js
  function linearish(scale) {
    var domain = scale.domain;
    scale.ticks = function(count) {
      var d3 = domain();
      return ticks(d3[0], d3[d3.length - 1], count == null ? 10 : count);
    };
    scale.tickFormat = function(count, specifier) {
      var d3 = domain();
      return tickFormat(d3[0], d3[d3.length - 1], count == null ? 10 : count, specifier);
    };
    scale.nice = function(count) {
      if (count == null)
        count = 10;
      var d3 = domain();
      var i0 = 0;
      var i1 = d3.length - 1;
      var start2 = d3[i0];
      var stop = d3[i1];
      var prestep;
      var step;
      var maxIter = 10;
      if (stop < start2) {
        step = start2, start2 = stop, stop = step;
        step = i0, i0 = i1, i1 = step;
      }
      while (maxIter-- > 0) {
        step = tickIncrement(start2, stop, count);
        if (step === prestep) {
          d3[i0] = start2;
          d3[i1] = stop;
          return domain(d3);
        } else if (step > 0) {
          start2 = Math.floor(start2 / step) * step;
          stop = Math.ceil(stop / step) * step;
        } else if (step < 0) {
          start2 = Math.ceil(start2 * step) / step;
          stop = Math.floor(stop * step) / step;
        } else {
          break;
        }
        prestep = step;
      }
      return scale;
    };
    return scale;
  }
  function linear2() {
    var scale = continuous();
    scale.copy = function() {
      return copy(scale, linear2());
    };
    initRange.apply(scale, arguments);
    return linearish(scale);
  }

  // node_modules/d3-scale/src/nice.js
  function nice(domain, interval2) {
    domain = domain.slice();
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], t3;
    if (x1 < x0) {
      t3 = i0, i0 = i1, i1 = t3;
      t3 = x0, x0 = x1, x1 = t3;
    }
    domain[i0] = interval2.floor(x0);
    domain[i1] = interval2.ceil(x1);
    return domain;
  }

  // node_modules/d3-time/src/interval.js
  var t0 = new Date();
  var t1 = new Date();
  function newInterval(floori, offseti, count, field) {
    function interval2(date2) {
      return floori(date2 = arguments.length === 0 ? new Date() : new Date(+date2)), date2;
    }
    interval2.floor = function(date2) {
      return floori(date2 = new Date(+date2)), date2;
    };
    interval2.ceil = function(date2) {
      return floori(date2 = new Date(date2 - 1)), offseti(date2, 1), floori(date2), date2;
    };
    interval2.round = function(date2) {
      var d0 = interval2(date2), d1 = interval2.ceil(date2);
      return date2 - d0 < d1 - date2 ? d0 : d1;
    };
    interval2.offset = function(date2, step) {
      return offseti(date2 = new Date(+date2), step == null ? 1 : Math.floor(step)), date2;
    };
    interval2.range = function(start2, stop, step) {
      var range = [], previous;
      start2 = interval2.ceil(start2);
      step = step == null ? 1 : Math.floor(step);
      if (!(start2 < stop) || !(step > 0))
        return range;
      do
        range.push(previous = new Date(+start2)), offseti(start2, step), floori(start2);
      while (previous < start2 && start2 < stop);
      return range;
    };
    interval2.filter = function(test) {
      return newInterval(function(date2) {
        if (date2 >= date2)
          while (floori(date2), !test(date2))
            date2.setTime(date2 - 1);
      }, function(date2, step) {
        if (date2 >= date2) {
          if (step < 0)
            while (++step <= 0) {
              while (offseti(date2, -1), !test(date2)) {
              }
            }
          else
            while (--step >= 0) {
              while (offseti(date2, 1), !test(date2)) {
              }
            }
        }
      });
    };
    if (count) {
      interval2.count = function(start2, end) {
        t0.setTime(+start2), t1.setTime(+end);
        floori(t0), floori(t1);
        return Math.floor(count(t0, t1));
      };
      interval2.every = function(step) {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval2 : interval2.filter(field ? function(d3) {
          return field(d3) % step === 0;
        } : function(d3) {
          return interval2.count(0, d3) % step === 0;
        });
      };
    }
    return interval2;
  }

  // node_modules/d3-time/src/millisecond.js
  var millisecond = newInterval(function() {
  }, function(date2, step) {
    date2.setTime(+date2 + step);
  }, function(start2, end) {
    return end - start2;
  });
  millisecond.every = function(k3) {
    k3 = Math.floor(k3);
    if (!isFinite(k3) || !(k3 > 0))
      return null;
    if (!(k3 > 1))
      return millisecond;
    return newInterval(function(date2) {
      date2.setTime(Math.floor(date2 / k3) * k3);
    }, function(date2, step) {
      date2.setTime(+date2 + step * k3);
    }, function(start2, end) {
      return (end - start2) / k3;
    });
  };
  var millisecond_default = millisecond;
  var milliseconds = millisecond.range;

  // node_modules/d3-time/src/duration.js
  var durationSecond = 1e3;
  var durationMinute = durationSecond * 60;
  var durationHour = durationMinute * 60;
  var durationDay = durationHour * 24;
  var durationWeek = durationDay * 7;
  var durationMonth = durationDay * 30;
  var durationYear = durationDay * 365;

  // node_modules/d3-time/src/second.js
  var second = newInterval(function(date2) {
    date2.setTime(date2 - date2.getMilliseconds());
  }, function(date2, step) {
    date2.setTime(+date2 + step * durationSecond);
  }, function(start2, end) {
    return (end - start2) / durationSecond;
  }, function(date2) {
    return date2.getUTCSeconds();
  });
  var second_default = second;
  var seconds = second.range;

  // node_modules/d3-time/src/minute.js
  var minute = newInterval(function(date2) {
    date2.setTime(date2 - date2.getMilliseconds() - date2.getSeconds() * durationSecond);
  }, function(date2, step) {
    date2.setTime(+date2 + step * durationMinute);
  }, function(start2, end) {
    return (end - start2) / durationMinute;
  }, function(date2) {
    return date2.getMinutes();
  });
  var minute_default = minute;
  var minutes = minute.range;

  // node_modules/d3-time/src/hour.js
  var hour = newInterval(function(date2) {
    date2.setTime(date2 - date2.getMilliseconds() - date2.getSeconds() * durationSecond - date2.getMinutes() * durationMinute);
  }, function(date2, step) {
    date2.setTime(+date2 + step * durationHour);
  }, function(start2, end) {
    return (end - start2) / durationHour;
  }, function(date2) {
    return date2.getHours();
  });
  var hour_default = hour;
  var hours = hour.range;

  // node_modules/d3-time/src/day.js
  var day = newInterval(
    (date2) => date2.setHours(0, 0, 0, 0),
    (date2, step) => date2.setDate(date2.getDate() + step),
    (start2, end) => (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute) / durationDay,
    (date2) => date2.getDate() - 1
  );
  var day_default = day;
  var days = day.range;

  // node_modules/d3-time/src/week.js
  function weekday(i3) {
    return newInterval(function(date2) {
      date2.setDate(date2.getDate() - (date2.getDay() + 7 - i3) % 7);
      date2.setHours(0, 0, 0, 0);
    }, function(date2, step) {
      date2.setDate(date2.getDate() + step * 7);
    }, function(start2, end) {
      return (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute) / durationWeek;
    });
  }
  var sunday = weekday(0);
  var monday = weekday(1);
  var tuesday = weekday(2);
  var wednesday = weekday(3);
  var thursday = weekday(4);
  var friday = weekday(5);
  var saturday = weekday(6);
  var sundays = sunday.range;
  var mondays = monday.range;
  var tuesdays = tuesday.range;
  var wednesdays = wednesday.range;
  var thursdays = thursday.range;
  var fridays = friday.range;
  var saturdays = saturday.range;

  // node_modules/d3-time/src/month.js
  var month = newInterval(function(date2) {
    date2.setDate(1);
    date2.setHours(0, 0, 0, 0);
  }, function(date2, step) {
    date2.setMonth(date2.getMonth() + step);
  }, function(start2, end) {
    return end.getMonth() - start2.getMonth() + (end.getFullYear() - start2.getFullYear()) * 12;
  }, function(date2) {
    return date2.getMonth();
  });
  var month_default = month;
  var months = month.range;

  // node_modules/d3-time/src/year.js
  var year = newInterval(function(date2) {
    date2.setMonth(0, 1);
    date2.setHours(0, 0, 0, 0);
  }, function(date2, step) {
    date2.setFullYear(date2.getFullYear() + step);
  }, function(start2, end) {
    return end.getFullYear() - start2.getFullYear();
  }, function(date2) {
    return date2.getFullYear();
  });
  year.every = function(k3) {
    return !isFinite(k3 = Math.floor(k3)) || !(k3 > 0) ? null : newInterval(function(date2) {
      date2.setFullYear(Math.floor(date2.getFullYear() / k3) * k3);
      date2.setMonth(0, 1);
      date2.setHours(0, 0, 0, 0);
    }, function(date2, step) {
      date2.setFullYear(date2.getFullYear() + step * k3);
    });
  };
  var year_default = year;
  var years = year.range;

  // node_modules/d3-time/src/utcMinute.js
  var utcMinute = newInterval(function(date2) {
    date2.setUTCSeconds(0, 0);
  }, function(date2, step) {
    date2.setTime(+date2 + step * durationMinute);
  }, function(start2, end) {
    return (end - start2) / durationMinute;
  }, function(date2) {
    return date2.getUTCMinutes();
  });
  var utcMinute_default = utcMinute;
  var utcMinutes = utcMinute.range;

  // node_modules/d3-time/src/utcHour.js
  var utcHour = newInterval(function(date2) {
    date2.setUTCMinutes(0, 0, 0);
  }, function(date2, step) {
    date2.setTime(+date2 + step * durationHour);
  }, function(start2, end) {
    return (end - start2) / durationHour;
  }, function(date2) {
    return date2.getUTCHours();
  });
  var utcHour_default = utcHour;
  var utcHours = utcHour.range;

  // node_modules/d3-time/src/utcDay.js
  var utcDay = newInterval(function(date2) {
    date2.setUTCHours(0, 0, 0, 0);
  }, function(date2, step) {
    date2.setUTCDate(date2.getUTCDate() + step);
  }, function(start2, end) {
    return (end - start2) / durationDay;
  }, function(date2) {
    return date2.getUTCDate() - 1;
  });
  var utcDay_default = utcDay;
  var utcDays = utcDay.range;

  // node_modules/d3-time/src/utcWeek.js
  function utcWeekday(i3) {
    return newInterval(function(date2) {
      date2.setUTCDate(date2.getUTCDate() - (date2.getUTCDay() + 7 - i3) % 7);
      date2.setUTCHours(0, 0, 0, 0);
    }, function(date2, step) {
      date2.setUTCDate(date2.getUTCDate() + step * 7);
    }, function(start2, end) {
      return (end - start2) / durationWeek;
    });
  }
  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);
  var utcSundays = utcSunday.range;
  var utcMondays = utcMonday.range;
  var utcTuesdays = utcTuesday.range;
  var utcWednesdays = utcWednesday.range;
  var utcThursdays = utcThursday.range;
  var utcFridays = utcFriday.range;
  var utcSaturdays = utcSaturday.range;

  // node_modules/d3-time/src/utcMonth.js
  var utcMonth = newInterval(function(date2) {
    date2.setUTCDate(1);
    date2.setUTCHours(0, 0, 0, 0);
  }, function(date2, step) {
    date2.setUTCMonth(date2.getUTCMonth() + step);
  }, function(start2, end) {
    return end.getUTCMonth() - start2.getUTCMonth() + (end.getUTCFullYear() - start2.getUTCFullYear()) * 12;
  }, function(date2) {
    return date2.getUTCMonth();
  });
  var utcMonth_default = utcMonth;
  var utcMonths = utcMonth.range;

  // node_modules/d3-time/src/utcYear.js
  var utcYear = newInterval(function(date2) {
    date2.setUTCMonth(0, 1);
    date2.setUTCHours(0, 0, 0, 0);
  }, function(date2, step) {
    date2.setUTCFullYear(date2.getUTCFullYear() + step);
  }, function(start2, end) {
    return end.getUTCFullYear() - start2.getUTCFullYear();
  }, function(date2) {
    return date2.getUTCFullYear();
  });
  utcYear.every = function(k3) {
    return !isFinite(k3 = Math.floor(k3)) || !(k3 > 0) ? null : newInterval(function(date2) {
      date2.setUTCFullYear(Math.floor(date2.getUTCFullYear() / k3) * k3);
      date2.setUTCMonth(0, 1);
      date2.setUTCHours(0, 0, 0, 0);
    }, function(date2, step) {
      date2.setUTCFullYear(date2.getUTCFullYear() + step * k3);
    });
  };
  var utcYear_default = utcYear;
  var utcYears = utcYear.range;

  // node_modules/d3-time/src/ticks.js
  function ticker(year2, month2, week, day2, hour2, minute2) {
    const tickIntervals = [
      [second_default, 1, durationSecond],
      [second_default, 5, 5 * durationSecond],
      [second_default, 15, 15 * durationSecond],
      [second_default, 30, 30 * durationSecond],
      [minute2, 1, durationMinute],
      [minute2, 5, 5 * durationMinute],
      [minute2, 15, 15 * durationMinute],
      [minute2, 30, 30 * durationMinute],
      [hour2, 1, durationHour],
      [hour2, 3, 3 * durationHour],
      [hour2, 6, 6 * durationHour],
      [hour2, 12, 12 * durationHour],
      [day2, 1, durationDay],
      [day2, 2, 2 * durationDay],
      [week, 1, durationWeek],
      [month2, 1, durationMonth],
      [month2, 3, 3 * durationMonth],
      [year2, 1, durationYear]
    ];
    function ticks2(start2, stop, count) {
      const reverse = stop < start2;
      if (reverse)
        [start2, stop] = [stop, start2];
      const interval2 = count && typeof count.range === "function" ? count : tickInterval(start2, stop, count);
      const ticks3 = interval2 ? interval2.range(start2, +stop + 1) : [];
      return reverse ? ticks3.reverse() : ticks3;
    }
    function tickInterval(start2, stop, count) {
      const target = Math.abs(stop - start2) / count;
      const i3 = bisector(([, , step2]) => step2).right(tickIntervals, target);
      if (i3 === tickIntervals.length)
        return year2.every(tickStep(start2 / durationYear, stop / durationYear, count));
      if (i3 === 0)
        return millisecond_default.every(Math.max(tickStep(start2, stop, count), 1));
      const [t3, step] = tickIntervals[target / tickIntervals[i3 - 1][2] < tickIntervals[i3][2] / target ? i3 - 1 : i3];
      return t3.every(step);
    }
    return [ticks2, tickInterval];
  }
  var [utcTicks, utcTickInterval] = ticker(utcYear_default, utcMonth_default, utcSunday, utcDay_default, utcHour_default, utcMinute_default);
  var [timeTicks, timeTickInterval] = ticker(year_default, month_default, sunday, day_default, hour_default, minute_default);

  // node_modules/d3-time-format/src/locale.js
  function localDate(d3) {
    if (0 <= d3.y && d3.y < 100) {
      var date2 = new Date(-1, d3.m, d3.d, d3.H, d3.M, d3.S, d3.L);
      date2.setFullYear(d3.y);
      return date2;
    }
    return new Date(d3.y, d3.m, d3.d, d3.H, d3.M, d3.S, d3.L);
  }
  function utcDate(d3) {
    if (0 <= d3.y && d3.y < 100) {
      var date2 = new Date(Date.UTC(-1, d3.m, d3.d, d3.H, d3.M, d3.S, d3.L));
      date2.setUTCFullYear(d3.y);
      return date2;
    }
    return new Date(Date.UTC(d3.y, d3.m, d3.d, d3.H, d3.M, d3.S, d3.L));
  }
  function newDate(y3, m3, d3) {
    return { y: y3, m: m3, d: d3, H: 0, M: 0, S: 0, L: 0 };
  }
  function formatLocale(locale3) {
    var locale_dateTime = locale3.dateTime, locale_date = locale3.date, locale_time = locale3.time, locale_periods = locale3.periods, locale_weekdays = locale3.days, locale_shortWeekdays = locale3.shortDays, locale_months = locale3.months, locale_shortMonths = locale3.shortMonths;
    var periodRe = formatRe(locale_periods), periodLookup = formatLookup(locale_periods), weekdayRe = formatRe(locale_weekdays), weekdayLookup = formatLookup(locale_weekdays), shortWeekdayRe = formatRe(locale_shortWeekdays), shortWeekdayLookup = formatLookup(locale_shortWeekdays), monthRe = formatRe(locale_months), monthLookup = formatLookup(locale_months), shortMonthRe = formatRe(locale_shortMonths), shortMonthLookup = formatLookup(locale_shortMonths);
    var formats = {
      "a": formatShortWeekday,
      "A": formatWeekday,
      "b": formatShortMonth,
      "B": formatMonth,
      "c": null,
      "d": formatDayOfMonth,
      "e": formatDayOfMonth,
      "f": formatMicroseconds,
      "g": formatYearISO,
      "G": formatFullYearISO,
      "H": formatHour24,
      "I": formatHour12,
      "j": formatDayOfYear,
      "L": formatMilliseconds,
      "m": formatMonthNumber,
      "M": formatMinutes,
      "p": formatPeriod,
      "q": formatQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatSeconds,
      "u": formatWeekdayNumberMonday,
      "U": formatWeekNumberSunday,
      "V": formatWeekNumberISO,
      "w": formatWeekdayNumberSunday,
      "W": formatWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatYear,
      "Y": formatFullYear,
      "Z": formatZone,
      "%": formatLiteralPercent
    };
    var utcFormats = {
      "a": formatUTCShortWeekday,
      "A": formatUTCWeekday,
      "b": formatUTCShortMonth,
      "B": formatUTCMonth,
      "c": null,
      "d": formatUTCDayOfMonth,
      "e": formatUTCDayOfMonth,
      "f": formatUTCMicroseconds,
      "g": formatUTCYearISO,
      "G": formatUTCFullYearISO,
      "H": formatUTCHour24,
      "I": formatUTCHour12,
      "j": formatUTCDayOfYear,
      "L": formatUTCMilliseconds,
      "m": formatUTCMonthNumber,
      "M": formatUTCMinutes,
      "p": formatUTCPeriod,
      "q": formatUTCQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatUTCSeconds,
      "u": formatUTCWeekdayNumberMonday,
      "U": formatUTCWeekNumberSunday,
      "V": formatUTCWeekNumberISO,
      "w": formatUTCWeekdayNumberSunday,
      "W": formatUTCWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatUTCYear,
      "Y": formatUTCFullYear,
      "Z": formatUTCZone,
      "%": formatLiteralPercent
    };
    var parses = {
      "a": parseShortWeekday,
      "A": parseWeekday,
      "b": parseShortMonth,
      "B": parseMonth,
      "c": parseLocaleDateTime,
      "d": parseDayOfMonth,
      "e": parseDayOfMonth,
      "f": parseMicroseconds,
      "g": parseYear,
      "G": parseFullYear,
      "H": parseHour24,
      "I": parseHour24,
      "j": parseDayOfYear,
      "L": parseMilliseconds,
      "m": parseMonthNumber,
      "M": parseMinutes,
      "p": parsePeriod,
      "q": parseQuarter,
      "Q": parseUnixTimestamp,
      "s": parseUnixTimestampSeconds,
      "S": parseSeconds,
      "u": parseWeekdayNumberMonday,
      "U": parseWeekNumberSunday,
      "V": parseWeekNumberISO,
      "w": parseWeekdayNumberSunday,
      "W": parseWeekNumberMonday,
      "x": parseLocaleDate,
      "X": parseLocaleTime,
      "y": parseYear,
      "Y": parseFullYear,
      "Z": parseZone,
      "%": parseLiteralPercent
    };
    formats.x = newFormat(locale_date, formats);
    formats.X = newFormat(locale_time, formats);
    formats.c = newFormat(locale_dateTime, formats);
    utcFormats.x = newFormat(locale_date, utcFormats);
    utcFormats.X = newFormat(locale_time, utcFormats);
    utcFormats.c = newFormat(locale_dateTime, utcFormats);
    function newFormat(specifier, formats2) {
      return function(date2) {
        var string = [], i3 = -1, j3 = 0, n2 = specifier.length, c3, pad2, format2;
        if (!(date2 instanceof Date))
          date2 = new Date(+date2);
        while (++i3 < n2) {
          if (specifier.charCodeAt(i3) === 37) {
            string.push(specifier.slice(j3, i3));
            if ((pad2 = pads[c3 = specifier.charAt(++i3)]) != null)
              c3 = specifier.charAt(++i3);
            else
              pad2 = c3 === "e" ? " " : "0";
            if (format2 = formats2[c3])
              c3 = format2(date2, pad2);
            string.push(c3);
            j3 = i3 + 1;
          }
        }
        string.push(specifier.slice(j3, i3));
        return string.join("");
      };
    }
    function newParse(specifier, Z) {
      return function(string) {
        var d3 = newDate(1900, void 0, 1), i3 = parseSpecifier(d3, specifier, string += "", 0), week, day2;
        if (i3 != string.length)
          return null;
        if ("Q" in d3)
          return new Date(d3.Q);
        if ("s" in d3)
          return new Date(d3.s * 1e3 + ("L" in d3 ? d3.L : 0));
        if (Z && !("Z" in d3))
          d3.Z = 0;
        if ("p" in d3)
          d3.H = d3.H % 12 + d3.p * 12;
        if (d3.m === void 0)
          d3.m = "q" in d3 ? d3.q : 0;
        if ("V" in d3) {
          if (d3.V < 1 || d3.V > 53)
            return null;
          if (!("w" in d3))
            d3.w = 1;
          if ("Z" in d3) {
            week = utcDate(newDate(d3.y, 0, 1)), day2 = week.getUTCDay();
            week = day2 > 4 || day2 === 0 ? utcMonday.ceil(week) : utcMonday(week);
            week = utcDay_default.offset(week, (d3.V - 1) * 7);
            d3.y = week.getUTCFullYear();
            d3.m = week.getUTCMonth();
            d3.d = week.getUTCDate() + (d3.w + 6) % 7;
          } else {
            week = localDate(newDate(d3.y, 0, 1)), day2 = week.getDay();
            week = day2 > 4 || day2 === 0 ? monday.ceil(week) : monday(week);
            week = day_default.offset(week, (d3.V - 1) * 7);
            d3.y = week.getFullYear();
            d3.m = week.getMonth();
            d3.d = week.getDate() + (d3.w + 6) % 7;
          }
        } else if ("W" in d3 || "U" in d3) {
          if (!("w" in d3))
            d3.w = "u" in d3 ? d3.u % 7 : "W" in d3 ? 1 : 0;
          day2 = "Z" in d3 ? utcDate(newDate(d3.y, 0, 1)).getUTCDay() : localDate(newDate(d3.y, 0, 1)).getDay();
          d3.m = 0;
          d3.d = "W" in d3 ? (d3.w + 6) % 7 + d3.W * 7 - (day2 + 5) % 7 : d3.w + d3.U * 7 - (day2 + 6) % 7;
        }
        if ("Z" in d3) {
          d3.H += d3.Z / 100 | 0;
          d3.M += d3.Z % 100;
          return utcDate(d3);
        }
        return localDate(d3);
      };
    }
    function parseSpecifier(d3, specifier, string, j3) {
      var i3 = 0, n2 = specifier.length, m3 = string.length, c3, parse;
      while (i3 < n2) {
        if (j3 >= m3)
          return -1;
        c3 = specifier.charCodeAt(i3++);
        if (c3 === 37) {
          c3 = specifier.charAt(i3++);
          parse = parses[c3 in pads ? specifier.charAt(i3++) : c3];
          if (!parse || (j3 = parse(d3, string, j3)) < 0)
            return -1;
        } else if (c3 != string.charCodeAt(j3++)) {
          return -1;
        }
      }
      return j3;
    }
    function parsePeriod(d3, string, i3) {
      var n2 = periodRe.exec(string.slice(i3));
      return n2 ? (d3.p = periodLookup.get(n2[0].toLowerCase()), i3 + n2[0].length) : -1;
    }
    function parseShortWeekday(d3, string, i3) {
      var n2 = shortWeekdayRe.exec(string.slice(i3));
      return n2 ? (d3.w = shortWeekdayLookup.get(n2[0].toLowerCase()), i3 + n2[0].length) : -1;
    }
    function parseWeekday(d3, string, i3) {
      var n2 = weekdayRe.exec(string.slice(i3));
      return n2 ? (d3.w = weekdayLookup.get(n2[0].toLowerCase()), i3 + n2[0].length) : -1;
    }
    function parseShortMonth(d3, string, i3) {
      var n2 = shortMonthRe.exec(string.slice(i3));
      return n2 ? (d3.m = shortMonthLookup.get(n2[0].toLowerCase()), i3 + n2[0].length) : -1;
    }
    function parseMonth(d3, string, i3) {
      var n2 = monthRe.exec(string.slice(i3));
      return n2 ? (d3.m = monthLookup.get(n2[0].toLowerCase()), i3 + n2[0].length) : -1;
    }
    function parseLocaleDateTime(d3, string, i3) {
      return parseSpecifier(d3, locale_dateTime, string, i3);
    }
    function parseLocaleDate(d3, string, i3) {
      return parseSpecifier(d3, locale_date, string, i3);
    }
    function parseLocaleTime(d3, string, i3) {
      return parseSpecifier(d3, locale_time, string, i3);
    }
    function formatShortWeekday(d3) {
      return locale_shortWeekdays[d3.getDay()];
    }
    function formatWeekday(d3) {
      return locale_weekdays[d3.getDay()];
    }
    function formatShortMonth(d3) {
      return locale_shortMonths[d3.getMonth()];
    }
    function formatMonth(d3) {
      return locale_months[d3.getMonth()];
    }
    function formatPeriod(d3) {
      return locale_periods[+(d3.getHours() >= 12)];
    }
    function formatQuarter(d3) {
      return 1 + ~~(d3.getMonth() / 3);
    }
    function formatUTCShortWeekday(d3) {
      return locale_shortWeekdays[d3.getUTCDay()];
    }
    function formatUTCWeekday(d3) {
      return locale_weekdays[d3.getUTCDay()];
    }
    function formatUTCShortMonth(d3) {
      return locale_shortMonths[d3.getUTCMonth()];
    }
    function formatUTCMonth(d3) {
      return locale_months[d3.getUTCMonth()];
    }
    function formatUTCPeriod(d3) {
      return locale_periods[+(d3.getUTCHours() >= 12)];
    }
    function formatUTCQuarter(d3) {
      return 1 + ~~(d3.getUTCMonth() / 3);
    }
    return {
      format: function(specifier) {
        var f3 = newFormat(specifier += "", formats);
        f3.toString = function() {
          return specifier;
        };
        return f3;
      },
      parse: function(specifier) {
        var p3 = newParse(specifier += "", false);
        p3.toString = function() {
          return specifier;
        };
        return p3;
      },
      utcFormat: function(specifier) {
        var f3 = newFormat(specifier += "", utcFormats);
        f3.toString = function() {
          return specifier;
        };
        return f3;
      },
      utcParse: function(specifier) {
        var p3 = newParse(specifier += "", true);
        p3.toString = function() {
          return specifier;
        };
        return p3;
      }
    };
  }
  var pads = { "-": "", "_": " ", "0": "0" };
  var numberRe = /^\s*\d+/;
  var percentRe = /^%/;
  var requoteRe = /[\\^$*+?|[\]().{}]/g;
  function pad(value, fill, width) {
    var sign = value < 0 ? "-" : "", string = (sign ? -value : value) + "", length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function requote(s2) {
    return s2.replace(requoteRe, "\\$&");
  }
  function formatRe(names) {
    return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
  }
  function formatLookup(names) {
    return new Map(names.map((name, i3) => [name.toLowerCase(), i3]));
  }
  function parseWeekdayNumberSunday(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 1));
    return n2 ? (d3.w = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseWeekdayNumberMonday(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 1));
    return n2 ? (d3.u = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseWeekNumberSunday(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 2));
    return n2 ? (d3.U = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseWeekNumberISO(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 2));
    return n2 ? (d3.V = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseWeekNumberMonday(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 2));
    return n2 ? (d3.W = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseFullYear(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 4));
    return n2 ? (d3.y = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseYear(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 2));
    return n2 ? (d3.y = +n2[0] + (+n2[0] > 68 ? 1900 : 2e3), i3 + n2[0].length) : -1;
  }
  function parseZone(d3, string, i3) {
    var n2 = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i3, i3 + 6));
    return n2 ? (d3.Z = n2[1] ? 0 : -(n2[2] + (n2[3] || "00")), i3 + n2[0].length) : -1;
  }
  function parseQuarter(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 1));
    return n2 ? (d3.q = n2[0] * 3 - 3, i3 + n2[0].length) : -1;
  }
  function parseMonthNumber(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 2));
    return n2 ? (d3.m = n2[0] - 1, i3 + n2[0].length) : -1;
  }
  function parseDayOfMonth(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 2));
    return n2 ? (d3.d = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseDayOfYear(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 3));
    return n2 ? (d3.m = 0, d3.d = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseHour24(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 2));
    return n2 ? (d3.H = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseMinutes(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 2));
    return n2 ? (d3.M = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseSeconds(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 2));
    return n2 ? (d3.S = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseMilliseconds(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 3));
    return n2 ? (d3.L = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseMicroseconds(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3, i3 + 6));
    return n2 ? (d3.L = Math.floor(n2[0] / 1e3), i3 + n2[0].length) : -1;
  }
  function parseLiteralPercent(d3, string, i3) {
    var n2 = percentRe.exec(string.slice(i3, i3 + 1));
    return n2 ? i3 + n2[0].length : -1;
  }
  function parseUnixTimestamp(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3));
    return n2 ? (d3.Q = +n2[0], i3 + n2[0].length) : -1;
  }
  function parseUnixTimestampSeconds(d3, string, i3) {
    var n2 = numberRe.exec(string.slice(i3));
    return n2 ? (d3.s = +n2[0], i3 + n2[0].length) : -1;
  }
  function formatDayOfMonth(d3, p3) {
    return pad(d3.getDate(), p3, 2);
  }
  function formatHour24(d3, p3) {
    return pad(d3.getHours(), p3, 2);
  }
  function formatHour12(d3, p3) {
    return pad(d3.getHours() % 12 || 12, p3, 2);
  }
  function formatDayOfYear(d3, p3) {
    return pad(1 + day_default.count(year_default(d3), d3), p3, 3);
  }
  function formatMilliseconds(d3, p3) {
    return pad(d3.getMilliseconds(), p3, 3);
  }
  function formatMicroseconds(d3, p3) {
    return formatMilliseconds(d3, p3) + "000";
  }
  function formatMonthNumber(d3, p3) {
    return pad(d3.getMonth() + 1, p3, 2);
  }
  function formatMinutes(d3, p3) {
    return pad(d3.getMinutes(), p3, 2);
  }
  function formatSeconds(d3, p3) {
    return pad(d3.getSeconds(), p3, 2);
  }
  function formatWeekdayNumberMonday(d3) {
    var day2 = d3.getDay();
    return day2 === 0 ? 7 : day2;
  }
  function formatWeekNumberSunday(d3, p3) {
    return pad(sunday.count(year_default(d3) - 1, d3), p3, 2);
  }
  function dISO(d3) {
    var day2 = d3.getDay();
    return day2 >= 4 || day2 === 0 ? thursday(d3) : thursday.ceil(d3);
  }
  function formatWeekNumberISO(d3, p3) {
    d3 = dISO(d3);
    return pad(thursday.count(year_default(d3), d3) + (year_default(d3).getDay() === 4), p3, 2);
  }
  function formatWeekdayNumberSunday(d3) {
    return d3.getDay();
  }
  function formatWeekNumberMonday(d3, p3) {
    return pad(monday.count(year_default(d3) - 1, d3), p3, 2);
  }
  function formatYear(d3, p3) {
    return pad(d3.getFullYear() % 100, p3, 2);
  }
  function formatYearISO(d3, p3) {
    d3 = dISO(d3);
    return pad(d3.getFullYear() % 100, p3, 2);
  }
  function formatFullYear(d3, p3) {
    return pad(d3.getFullYear() % 1e4, p3, 4);
  }
  function formatFullYearISO(d3, p3) {
    var day2 = d3.getDay();
    d3 = day2 >= 4 || day2 === 0 ? thursday(d3) : thursday.ceil(d3);
    return pad(d3.getFullYear() % 1e4, p3, 4);
  }
  function formatZone(d3) {
    var z3 = d3.getTimezoneOffset();
    return (z3 > 0 ? "-" : (z3 *= -1, "+")) + pad(z3 / 60 | 0, "0", 2) + pad(z3 % 60, "0", 2);
  }
  function formatUTCDayOfMonth(d3, p3) {
    return pad(d3.getUTCDate(), p3, 2);
  }
  function formatUTCHour24(d3, p3) {
    return pad(d3.getUTCHours(), p3, 2);
  }
  function formatUTCHour12(d3, p3) {
    return pad(d3.getUTCHours() % 12 || 12, p3, 2);
  }
  function formatUTCDayOfYear(d3, p3) {
    return pad(1 + utcDay_default.count(utcYear_default(d3), d3), p3, 3);
  }
  function formatUTCMilliseconds(d3, p3) {
    return pad(d3.getUTCMilliseconds(), p3, 3);
  }
  function formatUTCMicroseconds(d3, p3) {
    return formatUTCMilliseconds(d3, p3) + "000";
  }
  function formatUTCMonthNumber(d3, p3) {
    return pad(d3.getUTCMonth() + 1, p3, 2);
  }
  function formatUTCMinutes(d3, p3) {
    return pad(d3.getUTCMinutes(), p3, 2);
  }
  function formatUTCSeconds(d3, p3) {
    return pad(d3.getUTCSeconds(), p3, 2);
  }
  function formatUTCWeekdayNumberMonday(d3) {
    var dow = d3.getUTCDay();
    return dow === 0 ? 7 : dow;
  }
  function formatUTCWeekNumberSunday(d3, p3) {
    return pad(utcSunday.count(utcYear_default(d3) - 1, d3), p3, 2);
  }
  function UTCdISO(d3) {
    var day2 = d3.getUTCDay();
    return day2 >= 4 || day2 === 0 ? utcThursday(d3) : utcThursday.ceil(d3);
  }
  function formatUTCWeekNumberISO(d3, p3) {
    d3 = UTCdISO(d3);
    return pad(utcThursday.count(utcYear_default(d3), d3) + (utcYear_default(d3).getUTCDay() === 4), p3, 2);
  }
  function formatUTCWeekdayNumberSunday(d3) {
    return d3.getUTCDay();
  }
  function formatUTCWeekNumberMonday(d3, p3) {
    return pad(utcMonday.count(utcYear_default(d3) - 1, d3), p3, 2);
  }
  function formatUTCYear(d3, p3) {
    return pad(d3.getUTCFullYear() % 100, p3, 2);
  }
  function formatUTCYearISO(d3, p3) {
    d3 = UTCdISO(d3);
    return pad(d3.getUTCFullYear() % 100, p3, 2);
  }
  function formatUTCFullYear(d3, p3) {
    return pad(d3.getUTCFullYear() % 1e4, p3, 4);
  }
  function formatUTCFullYearISO(d3, p3) {
    var day2 = d3.getUTCDay();
    d3 = day2 >= 4 || day2 === 0 ? utcThursday(d3) : utcThursday.ceil(d3);
    return pad(d3.getUTCFullYear() % 1e4, p3, 4);
  }
  function formatUTCZone() {
    return "+0000";
  }
  function formatLiteralPercent() {
    return "%";
  }
  function formatUnixTimestamp(d3) {
    return +d3;
  }
  function formatUnixTimestampSeconds(d3) {
    return Math.floor(+d3 / 1e3);
  }

  // node_modules/d3-time-format/src/defaultLocale.js
  var locale2;
  var timeFormat;
  var timeParse;
  var utcFormat;
  var utcParse;
  defaultLocale2({
    dateTime: "%x, %X",
    date: "%-m/%-d/%Y",
    time: "%-I:%M:%S %p",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });
  function defaultLocale2(definition) {
    locale2 = formatLocale(definition);
    timeFormat = locale2.format;
    timeParse = locale2.parse;
    utcFormat = locale2.utcFormat;
    utcParse = locale2.utcParse;
    return locale2;
  }

  // node_modules/d3-scale/src/time.js
  function date(t3) {
    return new Date(t3);
  }
  function number4(t3) {
    return t3 instanceof Date ? +t3 : +new Date(+t3);
  }
  function calendar(ticks2, tickInterval, year2, month2, week, day2, hour2, minute2, second2, format2) {
    var scale = continuous(), invert = scale.invert, domain = scale.domain;
    var formatMillisecond = format2(".%L"), formatSecond = format2(":%S"), formatMinute = format2("%I:%M"), formatHour = format2("%I %p"), formatDay = format2("%a %d"), formatWeek = format2("%b %d"), formatMonth = format2("%B"), formatYear2 = format2("%Y");
    function tickFormat2(date2) {
      return (second2(date2) < date2 ? formatMillisecond : minute2(date2) < date2 ? formatSecond : hour2(date2) < date2 ? formatMinute : day2(date2) < date2 ? formatHour : month2(date2) < date2 ? week(date2) < date2 ? formatDay : formatWeek : year2(date2) < date2 ? formatMonth : formatYear2)(date2);
    }
    scale.invert = function(y3) {
      return new Date(invert(y3));
    };
    scale.domain = function(_3) {
      return arguments.length ? domain(Array.from(_3, number4)) : domain().map(date);
    };
    scale.ticks = function(interval2) {
      var d3 = domain();
      return ticks2(d3[0], d3[d3.length - 1], interval2 == null ? 10 : interval2);
    };
    scale.tickFormat = function(count, specifier) {
      return specifier == null ? tickFormat2 : format2(specifier);
    };
    scale.nice = function(interval2) {
      var d3 = domain();
      if (!interval2 || typeof interval2.range !== "function")
        interval2 = tickInterval(d3[0], d3[d3.length - 1], interval2 == null ? 10 : interval2);
      return interval2 ? domain(nice(d3, interval2)) : scale;
    };
    scale.copy = function() {
      return copy(scale, calendar(ticks2, tickInterval, year2, month2, week, day2, hour2, minute2, second2, format2));
    };
    return scale;
  }

  // node_modules/d3-scale/src/utcTime.js
  function utcTime() {
    return initRange.apply(calendar(utcTicks, utcTickInterval, utcYear_default, utcMonth_default, utcSunday, utcDay_default, utcHour_default, utcMinute_default, second_default, utcFormat).domain([Date.UTC(2e3, 0, 1), Date.UTC(2e3, 0, 2)]), arguments);
  }

  // node_modules/d3-zoom/src/transform.js
  function Transform(k3, x, y3) {
    this.k = k3;
    this.x = x;
    this.y = y3;
  }
  Transform.prototype = {
    constructor: Transform,
    scale: function(k3) {
      return k3 === 1 ? this : new Transform(this.k * k3, this.x, this.y);
    },
    translate: function(x, y3) {
      return x === 0 & y3 === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y3);
    },
    apply: function(point) {
      return [point[0] * this.k + this.x, point[1] * this.k + this.y];
    },
    applyX: function(x) {
      return x * this.k + this.x;
    },
    applyY: function(y3) {
      return y3 * this.k + this.y;
    },
    invert: function(location) {
      return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
    },
    invertX: function(x) {
      return (x - this.x) / this.k;
    },
    invertY: function(y3) {
      return (y3 - this.y) / this.k;
    },
    rescaleX: function(x) {
      return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
    },
    rescaleY: function(y3) {
      return y3.copy().domain(y3.range().map(this.invertY, this).map(y3.invert, y3));
    },
    toString: function() {
      return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
    }
  };
  var identity3 = new Transform(1, 0, 0);
  transform.prototype = Transform.prototype;
  function transform(node) {
    while (!node.__zoom)
      if (!(node = node.parentNode))
        return identity3;
    return node.__zoom;
  }

  // node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var i;
  var t;
  var o;
  var r;
  var f = {};
  var e = [];
  var c = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  function s(n2, l3) {
    for (var u3 in l3)
      n2[u3] = l3[u3];
    return n2;
  }
  function a(n2) {
    var l3 = n2.parentNode;
    l3 && l3.removeChild(n2);
  }
  function h(l3, u3, i3) {
    var t3, o4, r3, f3 = {};
    for (r3 in u3)
      "key" == r3 ? t3 = u3[r3] : "ref" == r3 ? o4 = u3[r3] : f3[r3] = u3[r3];
    if (arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : i3), "function" == typeof l3 && null != l3.defaultProps)
      for (r3 in l3.defaultProps)
        void 0 === f3[r3] && (f3[r3] = l3.defaultProps[r3]);
    return v(l3, f3, t3, o4, null);
  }
  function v(n2, i3, t3, o4, r3) {
    var f3 = { type: n2, props: i3, key: t3, ref: o4, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: null == r3 ? ++u : r3 };
    return null == r3 && null != l.vnode && l.vnode(f3), f3;
  }
  function y() {
    return { current: null };
  }
  function p(n2) {
    return n2.children;
  }
  function d(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function _(n2, l3) {
    if (null == l3)
      return n2.__ ? _(n2.__, n2.__.__k.indexOf(n2) + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++)
      if (null != (u3 = n2.__k[l3]) && null != u3.__e)
        return u3.__e;
    return "function" == typeof n2.type ? _(n2) : null;
  }
  function k(n2) {
    var l3, u3;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
        if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
          n2.__e = n2.__c.base = u3.__e;
          break;
        }
      return k(n2);
    }
  }
  function b(n2) {
    (!n2.__d && (n2.__d = true) && t.push(n2) && !g.__r++ || o !== l.debounceRendering) && ((o = l.debounceRendering) || setTimeout)(g);
  }
  function g() {
    for (var n2; g.__r = t.length; )
      n2 = t.sort(function(n3, l3) {
        return n3.__v.__b - l3.__v.__b;
      }), t = [], n2.some(function(n3) {
        var l3, u3, i3, t3, o4, r3;
        n3.__d && (o4 = (t3 = (l3 = n3).__v).__e, (r3 = l3.__P) && (u3 = [], (i3 = s({}, t3)).__v = t3.__v + 1, j(r3, t3, i3, l3.__n, void 0 !== r3.ownerSVGElement, null != t3.__h ? [o4] : null, u3, null == o4 ? _(t3) : o4, t3.__h), z(u3, t3), t3.__e != o4 && k(t3)));
      });
  }
  function w(n2, l3, u3, i3, t3, o4, r3, c3, s2, a3) {
    var h3, y3, d3, k3, b3, g3, w3, x = i3 && i3.__k || e, C2 = x.length;
    for (u3.__k = [], h3 = 0; h3 < l3.length; h3++)
      if (null != (k3 = u3.__k[h3] = null == (k3 = l3[h3]) || "boolean" == typeof k3 ? null : "string" == typeof k3 || "number" == typeof k3 || "bigint" == typeof k3 ? v(null, k3, null, null, k3) : Array.isArray(k3) ? v(p, { children: k3 }, null, null, null) : k3.__b > 0 ? v(k3.type, k3.props, k3.key, k3.ref ? k3.ref : null, k3.__v) : k3)) {
        if (k3.__ = u3, k3.__b = u3.__b + 1, null === (d3 = x[h3]) || d3 && k3.key == d3.key && k3.type === d3.type)
          x[h3] = void 0;
        else
          for (y3 = 0; y3 < C2; y3++) {
            if ((d3 = x[y3]) && k3.key == d3.key && k3.type === d3.type) {
              x[y3] = void 0;
              break;
            }
            d3 = null;
          }
        j(n2, k3, d3 = d3 || f, t3, o4, r3, c3, s2, a3), b3 = k3.__e, (y3 = k3.ref) && d3.ref != y3 && (w3 || (w3 = []), d3.ref && w3.push(d3.ref, null, k3), w3.push(y3, k3.__c || b3, k3)), null != b3 ? (null == g3 && (g3 = b3), "function" == typeof k3.type && k3.__k === d3.__k ? k3.__d = s2 = m(k3, s2, n2) : s2 = A(n2, k3, d3, x, b3, s2), "function" == typeof u3.type && (u3.__d = s2)) : s2 && d3.__e == s2 && s2.parentNode != n2 && (s2 = _(d3));
      }
    for (u3.__e = g3, h3 = C2; h3--; )
      null != x[h3] && N(x[h3], x[h3]);
    if (w3)
      for (h3 = 0; h3 < w3.length; h3++)
        M(w3[h3], w3[++h3], w3[++h3]);
  }
  function m(n2, l3, u3) {
    for (var i3, t3 = n2.__k, o4 = 0; t3 && o4 < t3.length; o4++)
      (i3 = t3[o4]) && (i3.__ = n2, l3 = "function" == typeof i3.type ? m(i3, l3, u3) : A(u3, i3, i3, t3, i3.__e, l3));
    return l3;
  }
  function A(n2, l3, u3, i3, t3, o4) {
    var r3, f3, e4;
    if (void 0 !== l3.__d)
      r3 = l3.__d, l3.__d = void 0;
    else if (null == u3 || t3 != o4 || null == t3.parentNode)
      n:
        if (null == o4 || o4.parentNode !== n2)
          n2.appendChild(t3), r3 = null;
        else {
          for (f3 = o4, e4 = 0; (f3 = f3.nextSibling) && e4 < i3.length; e4 += 1)
            if (f3 == t3)
              break n;
          n2.insertBefore(t3, o4), r3 = o4;
        }
    return void 0 !== r3 ? r3 : t3.nextSibling;
  }
  function C(n2, l3, u3, i3, t3) {
    var o4;
    for (o4 in u3)
      "children" === o4 || "key" === o4 || o4 in l3 || H(n2, o4, null, u3[o4], i3);
    for (o4 in l3)
      t3 && "function" != typeof l3[o4] || "children" === o4 || "key" === o4 || "value" === o4 || "checked" === o4 || u3[o4] === l3[o4] || H(n2, o4, l3[o4], u3[o4], i3);
  }
  function $(n2, l3, u3) {
    "-" === l3[0] ? n2.setProperty(l3, u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || c.test(l3) ? u3 : u3 + "px";
  }
  function H(n2, l3, u3, i3, t3) {
    var o4;
    n:
      if ("style" === l3)
        if ("string" == typeof u3)
          n2.style.cssText = u3;
        else {
          if ("string" == typeof i3 && (n2.style.cssText = i3 = ""), i3)
            for (l3 in i3)
              u3 && l3 in u3 || $(n2.style, l3, "");
          if (u3)
            for (l3 in u3)
              i3 && u3[l3] === i3[l3] || $(n2.style, l3, u3[l3]);
        }
      else if ("o" === l3[0] && "n" === l3[1])
        o4 = l3 !== (l3 = l3.replace(/Capture$/, "")), l3 = l3.toLowerCase() in n2 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o4] = u3, u3 ? i3 || n2.addEventListener(l3, o4 ? T : I, o4) : n2.removeEventListener(l3, o4 ? T : I, o4);
      else if ("dangerouslySetInnerHTML" !== l3) {
        if (t3)
          l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
        else if ("href" !== l3 && "list" !== l3 && "form" !== l3 && "tabIndex" !== l3 && "download" !== l3 && l3 in n2)
          try {
            n2[l3] = null == u3 ? "" : u3;
            break n;
          } catch (n3) {
          }
        "function" == typeof u3 || (null == u3 || false === u3 && -1 == l3.indexOf("-") ? n2.removeAttribute(l3) : n2.setAttribute(l3, u3));
      }
  }
  function I(n2) {
    this.l[n2.type + false](l.event ? l.event(n2) : n2);
  }
  function T(n2) {
    this.l[n2.type + true](l.event ? l.event(n2) : n2);
  }
  function j(n2, u3, i3, t3, o4, r3, f3, e4, c3) {
    var a3, h3, v3, y3, _3, k3, b3, g3, m3, x, A2, C2, $2, H2, I2, T2 = u3.type;
    if (void 0 !== u3.constructor)
      return null;
    null != i3.__h && (c3 = i3.__h, e4 = u3.__e = i3.__e, u3.__h = null, r3 = [e4]), (a3 = l.__b) && a3(u3);
    try {
      n:
        if ("function" == typeof T2) {
          if (g3 = u3.props, m3 = (a3 = T2.contextType) && t3[a3.__c], x = a3 ? m3 ? m3.props.value : a3.__ : t3, i3.__c ? b3 = (h3 = u3.__c = i3.__c).__ = h3.__E : ("prototype" in T2 && T2.prototype.render ? u3.__c = h3 = new T2(g3, x) : (u3.__c = h3 = new d(g3, x), h3.constructor = T2, h3.render = O), m3 && m3.sub(h3), h3.props = g3, h3.state || (h3.state = {}), h3.context = x, h3.__n = t3, v3 = h3.__d = true, h3.__h = [], h3._sb = []), null == h3.__s && (h3.__s = h3.state), null != T2.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = s({}, h3.__s)), s(h3.__s, T2.getDerivedStateFromProps(g3, h3.__s))), y3 = h3.props, _3 = h3.state, v3)
            null == T2.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
          else {
            if (null == T2.getDerivedStateFromProps && g3 !== y3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(g3, x), !h3.__e && null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(g3, h3.__s, x) || u3.__v === i3.__v) {
              for (h3.props = g3, h3.state = h3.__s, u3.__v !== i3.__v && (h3.__d = false), h3.__v = u3, u3.__e = i3.__e, u3.__k = i3.__k, u3.__k.forEach(function(n3) {
                n3 && (n3.__ = u3);
              }), A2 = 0; A2 < h3._sb.length; A2++)
                h3.__h.push(h3._sb[A2]);
              h3._sb = [], h3.__h.length && f3.push(h3);
              break n;
            }
            null != h3.componentWillUpdate && h3.componentWillUpdate(g3, h3.__s, x), null != h3.componentDidUpdate && h3.__h.push(function() {
              h3.componentDidUpdate(y3, _3, k3);
            });
          }
          if (h3.context = x, h3.props = g3, h3.__v = u3, h3.__P = n2, C2 = l.__r, $2 = 0, "prototype" in T2 && T2.prototype.render) {
            for (h3.state = h3.__s, h3.__d = false, C2 && C2(u3), a3 = h3.render(h3.props, h3.state, h3.context), H2 = 0; H2 < h3._sb.length; H2++)
              h3.__h.push(h3._sb[H2]);
            h3._sb = [];
          } else
            do {
              h3.__d = false, C2 && C2(u3), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
            } while (h3.__d && ++$2 < 25);
          h3.state = h3.__s, null != h3.getChildContext && (t3 = s(s({}, t3), h3.getChildContext())), v3 || null == h3.getSnapshotBeforeUpdate || (k3 = h3.getSnapshotBeforeUpdate(y3, _3)), I2 = null != a3 && a3.type === p && null == a3.key ? a3.props.children : a3, w(n2, Array.isArray(I2) ? I2 : [I2], u3, i3, t3, o4, r3, f3, e4, c3), h3.base = u3.__e, u3.__h = null, h3.__h.length && f3.push(h3), b3 && (h3.__E = h3.__ = null), h3.__e = false;
        } else
          null == r3 && u3.__v === i3.__v ? (u3.__k = i3.__k, u3.__e = i3.__e) : u3.__e = L(i3.__e, u3, i3, t3, o4, r3, f3, c3);
      (a3 = l.diffed) && a3(u3);
    } catch (n3) {
      u3.__v = null, (c3 || null != r3) && (u3.__e = e4, u3.__h = !!c3, r3[r3.indexOf(e4)] = null), l.__e(n3, u3, i3);
    }
  }
  function z(n2, u3) {
    l.__c && l.__c(u3, n2), n2.some(function(u4) {
      try {
        n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
          n3.call(u4);
        });
      } catch (n3) {
        l.__e(n3, u4.__v);
      }
    });
  }
  function L(l3, u3, i3, t3, o4, r3, e4, c3) {
    var s2, h3, v3, y3 = i3.props, p3 = u3.props, d3 = u3.type, k3 = 0;
    if ("svg" === d3 && (o4 = true), null != r3) {
      for (; k3 < r3.length; k3++)
        if ((s2 = r3[k3]) && "setAttribute" in s2 == !!d3 && (d3 ? s2.localName === d3 : 3 === s2.nodeType)) {
          l3 = s2, r3[k3] = null;
          break;
        }
    }
    if (null == l3) {
      if (null === d3)
        return document.createTextNode(p3);
      l3 = o4 ? document.createElementNS("http://www.w3.org/2000/svg", d3) : document.createElement(d3, p3.is && p3), r3 = null, c3 = false;
    }
    if (null === d3)
      y3 === p3 || c3 && l3.data === p3 || (l3.data = p3);
    else {
      if (r3 = r3 && n.call(l3.childNodes), h3 = (y3 = i3.props || f).dangerouslySetInnerHTML, v3 = p3.dangerouslySetInnerHTML, !c3) {
        if (null != r3)
          for (y3 = {}, k3 = 0; k3 < l3.attributes.length; k3++)
            y3[l3.attributes[k3].name] = l3.attributes[k3].value;
        (v3 || h3) && (v3 && (h3 && v3.__html == h3.__html || v3.__html === l3.innerHTML) || (l3.innerHTML = v3 && v3.__html || ""));
      }
      if (C(l3, p3, y3, o4, c3), v3)
        u3.__k = [];
      else if (k3 = u3.props.children, w(l3, Array.isArray(k3) ? k3 : [k3], u3, i3, t3, o4 && "foreignObject" !== d3, r3, e4, r3 ? r3[0] : i3.__k && _(i3, 0), c3), null != r3)
        for (k3 = r3.length; k3--; )
          null != r3[k3] && a(r3[k3]);
      c3 || ("value" in p3 && void 0 !== (k3 = p3.value) && (k3 !== l3.value || "progress" === d3 && !k3 || "option" === d3 && k3 !== y3.value) && H(l3, "value", k3, y3.value, false), "checked" in p3 && void 0 !== (k3 = p3.checked) && k3 !== l3.checked && H(l3, "checked", k3, y3.checked, false));
    }
    return l3;
  }
  function M(n2, u3, i3) {
    try {
      "function" == typeof n2 ? n2(u3) : n2.current = u3;
    } catch (n3) {
      l.__e(n3, i3);
    }
  }
  function N(n2, u3, i3) {
    var t3, o4;
    if (l.unmount && l.unmount(n2), (t3 = n2.ref) && (t3.current && t3.current !== n2.__e || M(t3, null, u3)), null != (t3 = n2.__c)) {
      if (t3.componentWillUnmount)
        try {
          t3.componentWillUnmount();
        } catch (n3) {
          l.__e(n3, u3);
        }
      t3.base = t3.__P = null, n2.__c = void 0;
    }
    if (t3 = n2.__k)
      for (o4 = 0; o4 < t3.length; o4++)
        t3[o4] && N(t3[o4], u3, i3 || "function" != typeof n2.type);
    i3 || null == n2.__e || a(n2.__e), n2.__ = n2.__e = n2.__d = void 0;
  }
  function O(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function P(u3, i3, t3) {
    var o4, r3, e4;
    l.__ && l.__(u3, i3), r3 = (o4 = "function" == typeof t3) ? null : t3 && t3.__k || i3.__k, e4 = [], j(i3, u3 = (!o4 && t3 || i3).__k = h(p, null, [u3]), r3 || f, f, void 0 !== i3.ownerSVGElement, !o4 && t3 ? [t3] : r3 ? null : i3.firstChild ? n.call(i3.childNodes) : null, e4, !o4 && t3 ? t3 : r3 ? r3.__e : i3.firstChild, o4), z(e4, u3);
  }
  n = e.slice, l = { __e: function(n2, l3, u3, i3) {
    for (var t3, o4, r3; l3 = l3.__; )
      if ((t3 = l3.__c) && !t3.__)
        try {
          if ((o4 = t3.constructor) && null != o4.getDerivedStateFromError && (t3.setState(o4.getDerivedStateFromError(n2)), r3 = t3.__d), null != t3.componentDidCatch && (t3.componentDidCatch(n2, i3 || {}), r3 = t3.__d), r3)
            return t3.__E = t3;
        } catch (l4) {
          n2 = l4;
        }
    throw n2;
  } }, u = 0, i = function(n2) {
    return null != n2 && void 0 === n2.constructor;
  }, d.prototype.setState = function(n2, l3) {
    var u3;
    u3 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = s({}, this.state), "function" == typeof n2 && (n2 = n2(s({}, u3), this.props)), n2 && s(u3, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), b(this));
  }, d.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), b(this));
  }, d.prototype.render = p, t = [], g.__r = 0, r = 0;

  // node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i2;
  var o2 = 0;
  var f2 = [];
  var c2 = [];
  var e3 = l.__b;
  var a2 = l.__r;
  var v2 = l.diffed;
  var l2 = l.__c;
  var m2 = l.unmount;
  function d2(t3, u3) {
    l.__h && l.__h(r2, t3, o2 || u3), o2 = 0;
    var i3 = r2.__H || (r2.__H = { __: [], __h: [] });
    return t3 >= i3.__.length && i3.__.push({ __V: c2 }), i3.__[t3];
  }
  function p2(n2) {
    return o2 = 1, y2(B, n2);
  }
  function y2(n2, u3, i3) {
    var o4 = d2(t2++, 2);
    if (o4.t = n2, !o4.__c && (o4.__ = [i3 ? i3(u3) : B(void 0, u3), function(n3) {
      var t3 = o4.__N ? o4.__N[0] : o4.__[0], r3 = o4.t(t3, n3);
      t3 !== r3 && (o4.__N = [r3, o4.__[1]], o4.__c.setState({}));
    }], o4.__c = r2, !r2.u)) {
      r2.u = true;
      var f3 = r2.shouldComponentUpdate;
      r2.shouldComponentUpdate = function(n3, t3, r3) {
        if (!o4.__c.__H)
          return true;
        var u4 = o4.__c.__H.__.filter(function(n4) {
          return n4.__c;
        });
        if (u4.every(function(n4) {
          return !n4.__N;
        }))
          return !f3 || f3.call(this, n3, t3, r3);
        var i4 = false;
        return u4.forEach(function(n4) {
          if (n4.__N) {
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
          }
        }), !(!i4 && o4.__c.props === n3) && (!f3 || f3.call(this, n3, t3, r3));
      };
    }
    return o4.__N || o4.__;
  }
  function h2(u3, i3) {
    var o4 = d2(t2++, 3);
    !l.__s && z2(o4.__H, i3) && (o4.__ = u3, o4.i = i3, r2.__H.__h.push(o4));
  }
  function F(n2, r3) {
    var u3 = d2(t2++, 7);
    return z2(u3.__H, r3) ? (u3.__V = n2(), u3.i = r3, u3.__h = n2, u3.__V) : u3.__;
  }
  function b2() {
    for (var t3; t3 = f2.shift(); )
      if (t3.__P && t3.__H)
        try {
          t3.__H.__h.forEach(k2), t3.__H.__h.forEach(w2), t3.__H.__h = [];
        } catch (r3) {
          t3.__H.__h = [], l.__e(r3, t3.__v);
        }
  }
  l.__b = function(n2) {
    r2 = null, e3 && e3(n2);
  }, l.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i3 = (r2 = n2.__c).__H;
    i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.forEach(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.__V = c2, n3.__N = n3.i = void 0;
    })) : (i3.__h.forEach(k2), i3.__h.forEach(w2), i3.__h = [])), u2 = r2;
  }, l.diffed = function(t3) {
    v2 && v2(t3);
    var o4 = t3.__c;
    o4 && o4.__H && (o4.__H.__h.length && (1 !== f2.push(o4) && i2 === l.requestAnimationFrame || ((i2 = l.requestAnimationFrame) || j2)(b2)), o4.__H.__.forEach(function(n2) {
      n2.i && (n2.__H = n2.i), n2.__V !== c2 && (n2.__ = n2.__V), n2.i = void 0, n2.__V = c2;
    })), u2 = r2 = null;
  }, l.__c = function(t3, r3) {
    r3.some(function(t4) {
      try {
        t4.__h.forEach(k2), t4.__h = t4.__h.filter(function(n2) {
          return !n2.__ || w2(n2);
        });
      } catch (u3) {
        r3.some(function(n2) {
          n2.__h && (n2.__h = []);
        }), r3 = [], l.__e(u3, t4.__v);
      }
    }), l2 && l2(t3, r3);
  }, l.unmount = function(t3) {
    m2 && m2(t3);
    var r3, u3 = t3.__c;
    u3 && u3.__H && (u3.__H.__.forEach(function(n2) {
      try {
        k2(n2);
      } catch (n3) {
        r3 = n3;
      }
    }), u3.__H = void 0, r3 && l.__e(r3, u3.__v));
  };
  var g2 = "function" == typeof requestAnimationFrame;
  function j2(n2) {
    var t3, r3 = function() {
      clearTimeout(u3), g2 && cancelAnimationFrame(t3), setTimeout(n2);
    }, u3 = setTimeout(r3, 100);
    g2 && (t3 = requestAnimationFrame(r3));
  }
  function k2(n2) {
    var t3 = r2, u3 = n2.__c;
    "function" == typeof u3 && (n2.__c = void 0, u3()), r2 = t3;
  }
  function w2(n2) {
    var t3 = r2;
    n2.__c = n2.__(), r2 = t3;
  }
  function z2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
      return t4 !== n2[r3];
    });
  }
  function B(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
  var _2 = 0;
  function o3(o4, e4, n2, t3, f3) {
    var l3, s2, u3 = {};
    for (s2 in e4)
      "ref" == s2 ? l3 = e4[s2] : u3[s2] = e4[s2];
    var a3 = { type: o4, props: u3, key: n2, ref: l3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: --_2, __source: f3, __self: t3 };
    if ("function" == typeof o4 && (l3 = o4.defaultProps))
      for (s2 in l3)
        void 0 === u3[s2] && (u3[s2] = l3[s2]);
    return l.vnode && l.vnode(a3), a3;
  }

  // main.tsx
  var SCHEMA = {
    "time": "date",
    "path": "str",
    "ref": "str",
    "ua": "str"
  };
  var palette = ["#22A39F", "#222222", "#434242", "#F3EFE0"];
  function TopTable({ name, col }) {
    const top3 = F(() => top(col.count(), 20), [col]);
    const rows = top3.map(({ value, count }) => {
      const text = col.col.decode(value)?.substring(0, 80) || "none";
      return /* @__PURE__ */ o3("tr", {
        children: [
          /* @__PURE__ */ o3("td", {
            children: text
          }),
          /* @__PURE__ */ o3("td", {
            class: "num",
            children: count
          })
        ]
      });
    });
    return /* @__PURE__ */ o3("section", {
      children: [
        /* @__PURE__ */ o3("h2", {
          children: name
        }),
        /* @__PURE__ */ o3("table", {
          children: rows
        })
      ]
    });
  }
  function Chart({ query, setSpan }) {
    const svgRef = y();
    h2(() => d3Chart(svgRef.current), []);
    return /* @__PURE__ */ o3("svg", {
      ref: svgRef
    });
    function d3Chart(node) {
      const margin = { top: 10, right: 30, bottom: 20, left: 60 };
      const width = 600;
      const height = 150;
      const svg = select_default2(node).attr("id", "viz").attr("width", margin.left + width + margin.right).attr("height", margin.top + height + margin.bottom).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      const datesRaw = measure("values", () => query.col("time").values());
      const dates = measure("byDate", () => {
        const bucket = (date2) => `${date2.getUTCFullYear()}-${date2.getUTCMonth() + 1}`;
        const byDate = /* @__PURE__ */ new Map();
        for (const date2 of datesRaw) {
          const stamp = bucket(date2);
          byDate.set(stamp, (byDate.get(stamp) ?? 0) + 1);
        }
        return Array.from(byDate.entries()).map(([stamp, count]) => ({ date: new Date(stamp), count }));
      });
      console.log(`${datesRaw.length} => ${dates.length} values`);
      const x = utcTime().domain(extent(dates, (d3) => d3.date)).range([0, width]).nice();
      svg.append("g").attr("transform", `translate(0, ${height})`).call(axisBottom(x));
      const y3 = linear2().domain([0, max(dates, (d3) => d3.count)]).range([height, 0]);
      svg.append("g").call(axisLeft(y3).ticks(4)).call((g3) => g3.select(".domain").remove());
      const barWidth = x(dates[1].date) - x(dates[0].date) + 0.5;
      svg.selectAll("#line").data(dates).join("rect").attr("fill", palette[0]).attr("x", (d3) => x(d3.date)).attr("width", (d3) => barWidth).attr("y", (d3) => y3(d3.count)).attr("height", (d3) => y3(0) - y3(d3.count));
      const brush2 = brushX().extent([[0, 0], [width, height]]).on("brush", (event) => {
        const [min2, max3] = event.selection;
        setSpan([x.invert(min2), x.invert(max3)]);
      }).on("end", (event) => {
        if (!event.selection) {
          setSpan(void 0);
        }
      });
      svg.append("g").call(brush2);
    }
  }
  function measure(name, f3) {
    const start2 = performance.mark(name + "-start").name;
    const ret = f3();
    const end = performance.mark(name + "-end").name;
    performance.measure(name, start2, end);
    return ret;
  }
  function uaLooksLikeUser(ua) {
    if (!ua || !ua.startsWith("Mozilla/"))
      return false;
    if (ua.match(/bot|crawl|spider/i))
      return false;
    return true;
  }
  function pathLooksLikeContent(path) {
    if (!path)
      return false;
    switch (path) {
      case "/favicon.ico":
      case "/robots.txt":
        return false;
    }
    if (path.endsWith("/atom.xml") || path.endsWith("/atom"))
      return false;
    if (path.endsWith(".css"))
      return false;
    if (path.endsWith(".woff"))
      return false;
    return true;
  }
  async function main() {
    const tab = await Table.load(SCHEMA, "tab");
    for (let i3 = 0; i3 < 3; i3++) {
      console.log("row", i3, tab.columns.time.str(i3), tab.columns.path.str(i3), tab.columns.ref.str(i3), tab.columns.ua.str(i3));
    }
    const query = tab.query();
    measure("ua", () => {
      query.col("ua").filterFn(uaLooksLikeUser);
      const t3 = top(query.col("ua").count(), 50).map(({ value, count }) => ({ value: tab.columns.ua.decode(value), count }));
      console.log("top", t3);
    });
    measure("main", () => {
      measure("path", () => query.col("path").filterFn(pathLooksLikeContent));
    });
    {
      const t3 = top(query.col("ref").count(), 50).map(({ value, count }) => ({ value: tab.columns.ref.decode(value), count }));
      console.log("top", t3);
    }
    measure("render", () => {
    });
    P(/* @__PURE__ */ o3(App, {
      query
    }), document.body);
  }
  main().catch((err) => console.log(err));
  function App({ query }) {
    const [span, setSpan] = p2(void 0);
    const q = F(() => {
      if (span) {
        const q2 = query.clone();
        q2.col("time").range(span[0], span[1]);
        return q2;
      } else {
        return query;
      }
    }, [query, span]);
    return /* @__PURE__ */ o3(p, {
      children: [
        /* @__PURE__ */ o3("h1", {
          children: "lytics"
        }),
        /* @__PURE__ */ o3(Chart, {
          query,
          setSpan
        }),
        /* @__PURE__ */ o3(TopTable, {
          name: "path",
          col: q.col("path")
        }),
        /* @__PURE__ */ o3(TopTable, {
          name: "ref",
          col: q.col("ref")
        }),
        /* @__PURE__ */ o3(TopTable, {
          name: "ua",
          col: q.col("ua")
        })
      ]
    });
  }
})();
//# sourceMappingURL=bundle.js.map
