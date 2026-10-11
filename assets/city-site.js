(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/polygon-clipping/dist/polygon-clipping.umd.js
  var require_polygon_clipping_umd = __commonJS({
    "node_modules/polygon-clipping/dist/polygon-clipping.umd.js"(exports, module) {
      (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.polygonClipping = factory());
      })(exports, (function() {
        "use strict";
        function __generator(thisArg, body) {
          var _ = {
            label: 0,
            sent: function() {
              if (t[0] & 1) throw t[1];
              return t[1];
            },
            trys: [],
            ops: []
          }, f, y, t, g;
          return g = {
            next: verb(0),
            "throw": verb(1),
            "return": verb(2)
          }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
            return this;
          }), g;
          function verb(n) {
            return function(v) {
              return step([n, v]);
            };
          }
          function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
              if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
              if (y = 0, t) op = [op[0] & 2, t.value];
              switch (op[0]) {
                case 0:
                case 1:
                  t = op;
                  break;
                case 4:
                  _.label++;
                  return {
                    value: op[1],
                    done: false
                  };
                case 5:
                  _.label++;
                  y = op[1];
                  op = [0];
                  continue;
                case 7:
                  op = _.ops.pop();
                  _.trys.pop();
                  continue;
                default:
                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                    _ = 0;
                    continue;
                  }
                  if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                    _.label = op[1];
                    break;
                  }
                  if (op[0] === 6 && _.label < t[1]) {
                    _.label = t[1];
                    t = op;
                    break;
                  }
                  if (t && _.label < t[2]) {
                    _.label = t[2];
                    _.ops.push(op);
                    break;
                  }
                  if (t[2]) _.ops.pop();
                  _.trys.pop();
                  continue;
              }
              op = body.call(thisArg, _);
            } catch (e) {
              op = [6, e];
              y = 0;
            } finally {
              f = t = 0;
            }
            if (op[0] & 5) throw op[1];
            return {
              value: op[0] ? op[1] : void 0,
              done: true
            };
          }
        }
        var Node = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Node2(key, data) {
              this.next = null;
              this.key = key;
              this.data = data;
              this.left = null;
              this.right = null;
            }
            return Node2;
          })()
        );
        function DEFAULT_COMPARE(a, b) {
          return a > b ? 1 : a < b ? -1 : 0;
        }
        function splay(i, t, comparator) {
          var N = new Node(null, null);
          var l = N;
          var r = N;
          while (true) {
            var cmp2 = comparator(i, t.key);
            if (cmp2 < 0) {
              if (t.left === null) break;
              if (comparator(i, t.left.key) < 0) {
                var y = t.left;
                t.left = y.right;
                y.right = t;
                t = y;
                if (t.left === null) break;
              }
              r.left = t;
              r = t;
              t = t.left;
            } else if (cmp2 > 0) {
              if (t.right === null) break;
              if (comparator(i, t.right.key) > 0) {
                var y = t.right;
                t.right = y.left;
                y.left = t;
                t = y;
                if (t.right === null) break;
              }
              l.right = t;
              l = t;
              t = t.right;
            } else break;
          }
          l.right = t.left;
          r.left = t.right;
          t.left = N.right;
          t.right = N.left;
          return t;
        }
        function insert(i, data, t, comparator) {
          var node = new Node(i, data);
          if (t === null) {
            node.left = node.right = null;
            return node;
          }
          t = splay(i, t, comparator);
          var cmp2 = comparator(i, t.key);
          if (cmp2 < 0) {
            node.left = t.left;
            node.right = t;
            t.left = null;
          } else if (cmp2 >= 0) {
            node.right = t.right;
            node.left = t;
            t.right = null;
          }
          return node;
        }
        function split(key, v, comparator) {
          var left = null;
          var right = null;
          if (v) {
            v = splay(key, v, comparator);
            var cmp2 = comparator(v.key, key);
            if (cmp2 === 0) {
              left = v.left;
              right = v.right;
            } else if (cmp2 < 0) {
              right = v.right;
              v.right = null;
              left = v;
            } else {
              left = v.left;
              v.left = null;
              right = v;
            }
          }
          return {
            left,
            right
          };
        }
        function merge(left, right, comparator) {
          if (right === null) return left;
          if (left === null) return right;
          right = splay(left.key, right, comparator);
          right.left = left;
          return right;
        }
        function printRow(root, prefix, isTail, out, printNode) {
          if (root) {
            out("" + prefix + (isTail ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ") + printNode(root) + "\n");
            var indent = prefix + (isTail ? "    " : "\u2502   ");
            if (root.left) printRow(root.left, indent, false, out, printNode);
            if (root.right) printRow(root.right, indent, true, out, printNode);
          }
        }
        var Tree = (
          /** @class */
          (function() {
            function Tree2(comparator) {
              if (comparator === void 0) {
                comparator = DEFAULT_COMPARE;
              }
              this._root = null;
              this._size = 0;
              this._comparator = comparator;
            }
            Tree2.prototype.insert = function(key, data) {
              this._size++;
              return this._root = insert(key, data, this._root, this._comparator);
            };
            Tree2.prototype.add = function(key, data) {
              var node = new Node(key, data);
              if (this._root === null) {
                node.left = node.right = null;
                this._size++;
                this._root = node;
              }
              var comparator = this._comparator;
              var t = splay(key, this._root, comparator);
              var cmp2 = comparator(key, t.key);
              if (cmp2 === 0) this._root = t;
              else {
                if (cmp2 < 0) {
                  node.left = t.left;
                  node.right = t;
                  t.left = null;
                } else if (cmp2 > 0) {
                  node.right = t.right;
                  node.left = t;
                  t.right = null;
                }
                this._size++;
                this._root = node;
              }
              return this._root;
            };
            Tree2.prototype.remove = function(key) {
              this._root = this._remove(key, this._root, this._comparator);
            };
            Tree2.prototype._remove = function(i, t, comparator) {
              var x;
              if (t === null) return null;
              t = splay(i, t, comparator);
              var cmp2 = comparator(i, t.key);
              if (cmp2 === 0) {
                if (t.left === null) {
                  x = t.right;
                } else {
                  x = splay(i, t.left, comparator);
                  x.right = t.right;
                }
                this._size--;
                return x;
              }
              return t;
            };
            Tree2.prototype.pop = function() {
              var node = this._root;
              if (node) {
                while (node.left) node = node.left;
                this._root = splay(node.key, this._root, this._comparator);
                this._root = this._remove(node.key, this._root, this._comparator);
                return {
                  key: node.key,
                  data: node.data
                };
              }
              return null;
            };
            Tree2.prototype.findStatic = function(key) {
              var current = this._root;
              var compare = this._comparator;
              while (current) {
                var cmp2 = compare(key, current.key);
                if (cmp2 === 0) return current;
                else if (cmp2 < 0) current = current.left;
                else current = current.right;
              }
              return null;
            };
            Tree2.prototype.find = function(key) {
              if (this._root) {
                this._root = splay(key, this._root, this._comparator);
                if (this._comparator(key, this._root.key) !== 0) return null;
              }
              return this._root;
            };
            Tree2.prototype.contains = function(key) {
              var current = this._root;
              var compare = this._comparator;
              while (current) {
                var cmp2 = compare(key, current.key);
                if (cmp2 === 0) return true;
                else if (cmp2 < 0) current = current.left;
                else current = current.right;
              }
              return false;
            };
            Tree2.prototype.forEach = function(visitor, ctx) {
              var current = this._root;
              var Q = [];
              var done = false;
              while (!done) {
                if (current !== null) {
                  Q.push(current);
                  current = current.left;
                } else {
                  if (Q.length !== 0) {
                    current = Q.pop();
                    visitor.call(ctx, current);
                    current = current.right;
                  } else done = true;
                }
              }
              return this;
            };
            Tree2.prototype.range = function(low, high, fn, ctx) {
              var Q = [];
              var compare = this._comparator;
              var node = this._root;
              var cmp2;
              while (Q.length !== 0 || node) {
                if (node) {
                  Q.push(node);
                  node = node.left;
                } else {
                  node = Q.pop();
                  cmp2 = compare(node.key, high);
                  if (cmp2 > 0) {
                    break;
                  } else if (compare(node.key, low) >= 0) {
                    if (fn.call(ctx, node)) return this;
                  }
                  node = node.right;
                }
              }
              return this;
            };
            Tree2.prototype.keys = function() {
              var keys = [];
              this.forEach(function(_a) {
                var key = _a.key;
                return keys.push(key);
              });
              return keys;
            };
            Tree2.prototype.values = function() {
              var values = [];
              this.forEach(function(_a) {
                var data = _a.data;
                return values.push(data);
              });
              return values;
            };
            Tree2.prototype.min = function() {
              if (this._root) return this.minNode(this._root).key;
              return null;
            };
            Tree2.prototype.max = function() {
              if (this._root) return this.maxNode(this._root).key;
              return null;
            };
            Tree2.prototype.minNode = function(t) {
              if (t === void 0) {
                t = this._root;
              }
              if (t) while (t.left) t = t.left;
              return t;
            };
            Tree2.prototype.maxNode = function(t) {
              if (t === void 0) {
                t = this._root;
              }
              if (t) while (t.right) t = t.right;
              return t;
            };
            Tree2.prototype.at = function(index2) {
              var current = this._root;
              var done = false;
              var i = 0;
              var Q = [];
              while (!done) {
                if (current) {
                  Q.push(current);
                  current = current.left;
                } else {
                  if (Q.length > 0) {
                    current = Q.pop();
                    if (i === index2) return current;
                    i++;
                    current = current.right;
                  } else done = true;
                }
              }
              return null;
            };
            Tree2.prototype.next = function(d) {
              var root = this._root;
              var successor = null;
              if (d.right) {
                successor = d.right;
                while (successor.left) successor = successor.left;
                return successor;
              }
              var comparator = this._comparator;
              while (root) {
                var cmp2 = comparator(d.key, root.key);
                if (cmp2 === 0) break;
                else if (cmp2 < 0) {
                  successor = root;
                  root = root.left;
                } else root = root.right;
              }
              return successor;
            };
            Tree2.prototype.prev = function(d) {
              var root = this._root;
              var predecessor = null;
              if (d.left !== null) {
                predecessor = d.left;
                while (predecessor.right) predecessor = predecessor.right;
                return predecessor;
              }
              var comparator = this._comparator;
              while (root) {
                var cmp2 = comparator(d.key, root.key);
                if (cmp2 === 0) break;
                else if (cmp2 < 0) root = root.left;
                else {
                  predecessor = root;
                  root = root.right;
                }
              }
              return predecessor;
            };
            Tree2.prototype.clear = function() {
              this._root = null;
              this._size = 0;
              return this;
            };
            Tree2.prototype.toList = function() {
              return toList(this._root);
            };
            Tree2.prototype.load = function(keys, values, presort) {
              if (values === void 0) {
                values = [];
              }
              if (presort === void 0) {
                presort = false;
              }
              var size = keys.length;
              var comparator = this._comparator;
              if (presort) sort2(keys, values, 0, size - 1, comparator);
              if (this._root === null) {
                this._root = loadRecursive(keys, values, 0, size);
                this._size = size;
              } else {
                var mergedList = mergeLists(this.toList(), createList(keys, values), comparator);
                size = this._size + size;
                this._root = sortedListToBST({
                  head: mergedList
                }, 0, size);
              }
              return this;
            };
            Tree2.prototype.isEmpty = function() {
              return this._root === null;
            };
            Object.defineProperty(Tree2.prototype, "size", {
              get: function() {
                return this._size;
              },
              enumerable: true,
              configurable: true
            });
            Object.defineProperty(Tree2.prototype, "root", {
              get: function() {
                return this._root;
              },
              enumerable: true,
              configurable: true
            });
            Tree2.prototype.toString = function(printNode) {
              if (printNode === void 0) {
                printNode = function(n) {
                  return String(n.key);
                };
              }
              var out = [];
              printRow(this._root, "", true, function(v) {
                return out.push(v);
              }, printNode);
              return out.join("");
            };
            Tree2.prototype.update = function(key, newKey, newData) {
              var comparator = this._comparator;
              var _a = split(key, this._root, comparator), left = _a.left, right = _a.right;
              if (comparator(key, newKey) < 0) {
                right = insert(newKey, newData, right, comparator);
              } else {
                left = insert(newKey, newData, left, comparator);
              }
              this._root = merge(left, right, comparator);
            };
            Tree2.prototype.split = function(key) {
              return split(key, this._root, this._comparator);
            };
            Tree2.prototype[Symbol.iterator] = function() {
              var current, Q, done;
              return __generator(this, function(_a) {
                switch (_a.label) {
                  case 0:
                    current = this._root;
                    Q = [];
                    done = false;
                    _a.label = 1;
                  case 1:
                    if (!!done) return [3, 6];
                    if (!(current !== null)) return [3, 2];
                    Q.push(current);
                    current = current.left;
                    return [3, 5];
                  case 2:
                    if (!(Q.length !== 0)) return [3, 4];
                    current = Q.pop();
                    return [4, current];
                  case 3:
                    _a.sent();
                    current = current.right;
                    return [3, 5];
                  case 4:
                    done = true;
                    _a.label = 5;
                  case 5:
                    return [3, 1];
                  case 6:
                    return [
                      2
                      /*return*/
                    ];
                }
              });
            };
            return Tree2;
          })()
        );
        function loadRecursive(keys, values, start, end) {
          var size = end - start;
          if (size > 0) {
            var middle = start + Math.floor(size / 2);
            var key = keys[middle];
            var data = values[middle];
            var node = new Node(key, data);
            node.left = loadRecursive(keys, values, start, middle);
            node.right = loadRecursive(keys, values, middle + 1, end);
            return node;
          }
          return null;
        }
        function createList(keys, values) {
          var head = new Node(null, null);
          var p = head;
          for (var i = 0; i < keys.length; i++) {
            p = p.next = new Node(keys[i], values[i]);
          }
          p.next = null;
          return head.next;
        }
        function toList(root) {
          var current = root;
          var Q = [];
          var done = false;
          var head = new Node(null, null);
          var p = head;
          while (!done) {
            if (current) {
              Q.push(current);
              current = current.left;
            } else {
              if (Q.length > 0) {
                current = p = p.next = Q.pop();
                current = current.right;
              } else done = true;
            }
          }
          p.next = null;
          return head.next;
        }
        function sortedListToBST(list, start, end) {
          var size = end - start;
          if (size > 0) {
            var middle = start + Math.floor(size / 2);
            var left = sortedListToBST(list, start, middle);
            var root = list.head;
            root.left = left;
            list.head = list.head.next;
            root.right = sortedListToBST(list, middle + 1, end);
            return root;
          }
          return null;
        }
        function mergeLists(l1, l2, compare) {
          var head = new Node(null, null);
          var p = head;
          var p1 = l1;
          var p2 = l2;
          while (p1 !== null && p2 !== null) {
            if (compare(p1.key, p2.key) < 0) {
              p.next = p1;
              p1 = p1.next;
            } else {
              p.next = p2;
              p2 = p2.next;
            }
            p = p.next;
          }
          if (p1 !== null) {
            p.next = p1;
          } else if (p2 !== null) {
            p.next = p2;
          }
          return head.next;
        }
        function sort2(keys, values, left, right, compare) {
          if (left >= right) return;
          var pivot = keys[left + right >> 1];
          var i = left - 1;
          var j = right + 1;
          while (true) {
            do
              i++;
            while (compare(keys[i], pivot) < 0);
            do
              j--;
            while (compare(keys[j], pivot) > 0);
            if (i >= j) break;
            var tmp = keys[i];
            keys[i] = keys[j];
            keys[j] = tmp;
            tmp = values[i];
            values[i] = values[j];
            values[j] = tmp;
          }
          sort2(keys, values, left, j, compare);
          sort2(keys, values, j + 1, right, compare);
        }
        const isInBbox = (bbox, point) => {
          return bbox.ll.x <= point.x && point.x <= bbox.ur.x && bbox.ll.y <= point.y && point.y <= bbox.ur.y;
        };
        const getBboxOverlap = (b1, b2) => {
          if (b2.ur.x < b1.ll.x || b1.ur.x < b2.ll.x || b2.ur.y < b1.ll.y || b1.ur.y < b2.ll.y) return null;
          const lowerX = b1.ll.x < b2.ll.x ? b2.ll.x : b1.ll.x;
          const upperX = b1.ur.x < b2.ur.x ? b1.ur.x : b2.ur.x;
          const lowerY = b1.ll.y < b2.ll.y ? b2.ll.y : b1.ll.y;
          const upperY = b1.ur.y < b2.ur.y ? b1.ur.y : b2.ur.y;
          return {
            ll: {
              x: lowerX,
              y: lowerY
            },
            ur: {
              x: upperX,
              y: upperY
            }
          };
        };
        let epsilon$1 = Number.EPSILON;
        if (epsilon$1 === void 0) epsilon$1 = Math.pow(2, -52);
        const EPSILON_SQ = epsilon$1 * epsilon$1;
        const cmp = (a, b) => {
          if (-epsilon$1 < a && a < epsilon$1) {
            if (-epsilon$1 < b && b < epsilon$1) {
              return 0;
            }
          }
          const ab = a - b;
          if (ab * ab < EPSILON_SQ * a * b) {
            return 0;
          }
          return a < b ? -1 : 1;
        };
        class PtRounder {
          constructor() {
            this.reset();
          }
          reset() {
            this.xRounder = new CoordRounder();
            this.yRounder = new CoordRounder();
          }
          round(x, y) {
            return {
              x: this.xRounder.round(x),
              y: this.yRounder.round(y)
            };
          }
        }
        class CoordRounder {
          constructor() {
            this.tree = new Tree();
            this.round(0);
          }
          // Note: this can rounds input values backwards or forwards.
          //       You might ask, why not restrict this to just rounding
          //       forwards? Wouldn't that allow left endpoints to always
          //       remain left endpoints during splitting (never change to
          //       right). No - it wouldn't, because we snap intersections
          //       to endpoints (to establish independence from the segment
          //       angle for t-intersections).
          round(coord) {
            const node = this.tree.add(coord);
            const prevNode = this.tree.prev(node);
            if (prevNode !== null && cmp(node.key, prevNode.key) === 0) {
              this.tree.remove(coord);
              return prevNode.key;
            }
            const nextNode = this.tree.next(node);
            if (nextNode !== null && cmp(node.key, nextNode.key) === 0) {
              this.tree.remove(coord);
              return nextNode.key;
            }
            return coord;
          }
        }
        const rounder = new PtRounder();
        const epsilon = 11102230246251565e-32;
        const splitter = 134217729;
        const resulterrbound = (3 + 8 * epsilon) * epsilon;
        function sum(elen, e, flen, f, h) {
          let Q, Qnew, hh, bvirt;
          let enow = e[0];
          let fnow = f[0];
          let eindex = 0;
          let findex = 0;
          if (fnow > enow === fnow > -enow) {
            Q = enow;
            enow = e[++eindex];
          } else {
            Q = fnow;
            fnow = f[++findex];
          }
          let hindex = 0;
          if (eindex < elen && findex < flen) {
            if (fnow > enow === fnow > -enow) {
              Qnew = enow + Q;
              hh = Q - (Qnew - enow);
              enow = e[++eindex];
            } else {
              Qnew = fnow + Q;
              hh = Q - (Qnew - fnow);
              fnow = f[++findex];
            }
            Q = Qnew;
            if (hh !== 0) {
              h[hindex++] = hh;
            }
            while (eindex < elen && findex < flen) {
              if (fnow > enow === fnow > -enow) {
                Qnew = Q + enow;
                bvirt = Qnew - Q;
                hh = Q - (Qnew - bvirt) + (enow - bvirt);
                enow = e[++eindex];
              } else {
                Qnew = Q + fnow;
                bvirt = Qnew - Q;
                hh = Q - (Qnew - bvirt) + (fnow - bvirt);
                fnow = f[++findex];
              }
              Q = Qnew;
              if (hh !== 0) {
                h[hindex++] = hh;
              }
            }
          }
          while (eindex < elen) {
            Qnew = Q + enow;
            bvirt = Qnew - Q;
            hh = Q - (Qnew - bvirt) + (enow - bvirt);
            enow = e[++eindex];
            Q = Qnew;
            if (hh !== 0) {
              h[hindex++] = hh;
            }
          }
          while (findex < flen) {
            Qnew = Q + fnow;
            bvirt = Qnew - Q;
            hh = Q - (Qnew - bvirt) + (fnow - bvirt);
            fnow = f[++findex];
            Q = Qnew;
            if (hh !== 0) {
              h[hindex++] = hh;
            }
          }
          if (Q !== 0 || hindex === 0) {
            h[hindex++] = Q;
          }
          return hindex;
        }
        function estimate(elen, e) {
          let Q = e[0];
          for (let i = 1; i < elen; i++) Q += e[i];
          return Q;
        }
        function vec(n) {
          return new Float64Array(n);
        }
        const ccwerrboundA = (3 + 16 * epsilon) * epsilon;
        const ccwerrboundB = (2 + 12 * epsilon) * epsilon;
        const ccwerrboundC = (9 + 64 * epsilon) * epsilon * epsilon;
        const B = vec(4);
        const C1 = vec(8);
        const C2 = vec(12);
        const D = vec(16);
        const u = vec(4);
        function orient2dadapt(ax, ay, bx, by, cx, cy, detsum) {
          let acxtail, acytail, bcxtail, bcytail;
          let bvirt, c, ahi, alo, bhi, blo, _i, _j, _0, s1, s0, t1, t0, u3;
          const acx = ax - cx;
          const bcx = bx - cx;
          const acy = ay - cy;
          const bcy = by - cy;
          s1 = acx * bcy;
          c = splitter * acx;
          ahi = c - (c - acx);
          alo = acx - ahi;
          c = splitter * bcy;
          bhi = c - (c - bcy);
          blo = bcy - bhi;
          s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
          t1 = acy * bcx;
          c = splitter * acy;
          ahi = c - (c - acy);
          alo = acy - ahi;
          c = splitter * bcx;
          bhi = c - (c - bcx);
          blo = bcx - bhi;
          t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
          _i = s0 - t0;
          bvirt = s0 - _i;
          B[0] = s0 - (_i + bvirt) + (bvirt - t0);
          _j = s1 + _i;
          bvirt = _j - s1;
          _0 = s1 - (_j - bvirt) + (_i - bvirt);
          _i = _0 - t1;
          bvirt = _0 - _i;
          B[1] = _0 - (_i + bvirt) + (bvirt - t1);
          u3 = _j + _i;
          bvirt = u3 - _j;
          B[2] = _j - (u3 - bvirt) + (_i - bvirt);
          B[3] = u3;
          let det = estimate(4, B);
          let errbound = ccwerrboundB * detsum;
          if (det >= errbound || -det >= errbound) {
            return det;
          }
          bvirt = ax - acx;
          acxtail = ax - (acx + bvirt) + (bvirt - cx);
          bvirt = bx - bcx;
          bcxtail = bx - (bcx + bvirt) + (bvirt - cx);
          bvirt = ay - acy;
          acytail = ay - (acy + bvirt) + (bvirt - cy);
          bvirt = by - bcy;
          bcytail = by - (bcy + bvirt) + (bvirt - cy);
          if (acxtail === 0 && acytail === 0 && bcxtail === 0 && bcytail === 0) {
            return det;
          }
          errbound = ccwerrboundC * detsum + resulterrbound * Math.abs(det);
          det += acx * bcytail + bcy * acxtail - (acy * bcxtail + bcx * acytail);
          if (det >= errbound || -det >= errbound) return det;
          s1 = acxtail * bcy;
          c = splitter * acxtail;
          ahi = c - (c - acxtail);
          alo = acxtail - ahi;
          c = splitter * bcy;
          bhi = c - (c - bcy);
          blo = bcy - bhi;
          s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
          t1 = acytail * bcx;
          c = splitter * acytail;
          ahi = c - (c - acytail);
          alo = acytail - ahi;
          c = splitter * bcx;
          bhi = c - (c - bcx);
          blo = bcx - bhi;
          t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
          _i = s0 - t0;
          bvirt = s0 - _i;
          u[0] = s0 - (_i + bvirt) + (bvirt - t0);
          _j = s1 + _i;
          bvirt = _j - s1;
          _0 = s1 - (_j - bvirt) + (_i - bvirt);
          _i = _0 - t1;
          bvirt = _0 - _i;
          u[1] = _0 - (_i + bvirt) + (bvirt - t1);
          u3 = _j + _i;
          bvirt = u3 - _j;
          u[2] = _j - (u3 - bvirt) + (_i - bvirt);
          u[3] = u3;
          const C1len = sum(4, B, 4, u, C1);
          s1 = acx * bcytail;
          c = splitter * acx;
          ahi = c - (c - acx);
          alo = acx - ahi;
          c = splitter * bcytail;
          bhi = c - (c - bcytail);
          blo = bcytail - bhi;
          s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
          t1 = acy * bcxtail;
          c = splitter * acy;
          ahi = c - (c - acy);
          alo = acy - ahi;
          c = splitter * bcxtail;
          bhi = c - (c - bcxtail);
          blo = bcxtail - bhi;
          t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
          _i = s0 - t0;
          bvirt = s0 - _i;
          u[0] = s0 - (_i + bvirt) + (bvirt - t0);
          _j = s1 + _i;
          bvirt = _j - s1;
          _0 = s1 - (_j - bvirt) + (_i - bvirt);
          _i = _0 - t1;
          bvirt = _0 - _i;
          u[1] = _0 - (_i + bvirt) + (bvirt - t1);
          u3 = _j + _i;
          bvirt = u3 - _j;
          u[2] = _j - (u3 - bvirt) + (_i - bvirt);
          u[3] = u3;
          const C2len = sum(C1len, C1, 4, u, C2);
          s1 = acxtail * bcytail;
          c = splitter * acxtail;
          ahi = c - (c - acxtail);
          alo = acxtail - ahi;
          c = splitter * bcytail;
          bhi = c - (c - bcytail);
          blo = bcytail - bhi;
          s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
          t1 = acytail * bcxtail;
          c = splitter * acytail;
          ahi = c - (c - acytail);
          alo = acytail - ahi;
          c = splitter * bcxtail;
          bhi = c - (c - bcxtail);
          blo = bcxtail - bhi;
          t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
          _i = s0 - t0;
          bvirt = s0 - _i;
          u[0] = s0 - (_i + bvirt) + (bvirt - t0);
          _j = s1 + _i;
          bvirt = _j - s1;
          _0 = s1 - (_j - bvirt) + (_i - bvirt);
          _i = _0 - t1;
          bvirt = _0 - _i;
          u[1] = _0 - (_i + bvirt) + (bvirt - t1);
          u3 = _j + _i;
          bvirt = u3 - _j;
          u[2] = _j - (u3 - bvirt) + (_i - bvirt);
          u[3] = u3;
          const Dlen = sum(C2len, C2, 4, u, D);
          return D[Dlen - 1];
        }
        function orient2d(ax, ay, bx, by, cx, cy) {
          const detleft = (ay - cy) * (bx - cx);
          const detright = (ax - cx) * (by - cy);
          const det = detleft - detright;
          const detsum = Math.abs(detleft + detright);
          if (Math.abs(det) >= ccwerrboundA * detsum) return det;
          return -orient2dadapt(ax, ay, bx, by, cx, cy, detsum);
        }
        const crossProduct = (a, b) => a.x * b.y - a.y * b.x;
        const dotProduct = (a, b) => a.x * b.x + a.y * b.y;
        const compareVectorAngles = (basePt, endPt1, endPt2) => {
          const res = orient2d(basePt.x, basePt.y, endPt1.x, endPt1.y, endPt2.x, endPt2.y);
          if (res > 0) return -1;
          if (res < 0) return 1;
          return 0;
        };
        const length = (v) => Math.sqrt(dotProduct(v, v));
        const sineOfAngle = (pShared, pBase, pAngle) => {
          const vBase = {
            x: pBase.x - pShared.x,
            y: pBase.y - pShared.y
          };
          const vAngle = {
            x: pAngle.x - pShared.x,
            y: pAngle.y - pShared.y
          };
          return crossProduct(vAngle, vBase) / length(vAngle) / length(vBase);
        };
        const cosineOfAngle = (pShared, pBase, pAngle) => {
          const vBase = {
            x: pBase.x - pShared.x,
            y: pBase.y - pShared.y
          };
          const vAngle = {
            x: pAngle.x - pShared.x,
            y: pAngle.y - pShared.y
          };
          return dotProduct(vAngle, vBase) / length(vAngle) / length(vBase);
        };
        const horizontalIntersection = (pt, v, y) => {
          if (v.y === 0) return null;
          return {
            x: pt.x + v.x / v.y * (y - pt.y),
            y
          };
        };
        const verticalIntersection = (pt, v, x) => {
          if (v.x === 0) return null;
          return {
            x,
            y: pt.y + v.y / v.x * (x - pt.x)
          };
        };
        const intersection$1 = (pt1, v1, pt2, v2) => {
          if (v1.x === 0) return verticalIntersection(pt2, v2, pt1.x);
          if (v2.x === 0) return verticalIntersection(pt1, v1, pt2.x);
          if (v1.y === 0) return horizontalIntersection(pt2, v2, pt1.y);
          if (v2.y === 0) return horizontalIntersection(pt1, v1, pt2.y);
          const kross = crossProduct(v1, v2);
          if (kross == 0) return null;
          const ve = {
            x: pt2.x - pt1.x,
            y: pt2.y - pt1.y
          };
          const d1 = crossProduct(ve, v1) / kross;
          const d2 = crossProduct(ve, v2) / kross;
          const x1 = pt1.x + d2 * v1.x, x2 = pt2.x + d1 * v2.x;
          const y1 = pt1.y + d2 * v1.y, y2 = pt2.y + d1 * v2.y;
          const x = (x1 + x2) / 2;
          const y = (y1 + y2) / 2;
          return {
            x,
            y
          };
        };
        class SweepEvent {
          // for ordering sweep events in the sweep event queue
          static compare(a, b) {
            const ptCmp = SweepEvent.comparePoints(a.point, b.point);
            if (ptCmp !== 0) return ptCmp;
            if (a.point !== b.point) a.link(b);
            if (a.isLeft !== b.isLeft) return a.isLeft ? 1 : -1;
            return Segment.compare(a.segment, b.segment);
          }
          // for ordering points in sweep line order
          static comparePoints(aPt, bPt) {
            if (aPt.x < bPt.x) return -1;
            if (aPt.x > bPt.x) return 1;
            if (aPt.y < bPt.y) return -1;
            if (aPt.y > bPt.y) return 1;
            return 0;
          }
          // Warning: 'point' input will be modified and re-used (for performance)
          constructor(point, isLeft) {
            if (point.events === void 0) point.events = [this];
            else point.events.push(this);
            this.point = point;
            this.isLeft = isLeft;
          }
          link(other) {
            if (other.point === this.point) {
              throw new Error("Tried to link already linked events");
            }
            const otherEvents = other.point.events;
            for (let i = 0, iMax = otherEvents.length; i < iMax; i++) {
              const evt = otherEvents[i];
              this.point.events.push(evt);
              evt.point = this.point;
            }
            this.checkForConsuming();
          }
          /* Do a pass over our linked events and check to see if any pair
           * of segments match, and should be consumed. */
          checkForConsuming() {
            const numEvents = this.point.events.length;
            for (let i = 0; i < numEvents; i++) {
              const evt1 = this.point.events[i];
              if (evt1.segment.consumedBy !== void 0) continue;
              for (let j = i + 1; j < numEvents; j++) {
                const evt2 = this.point.events[j];
                if (evt2.consumedBy !== void 0) continue;
                if (evt1.otherSE.point.events !== evt2.otherSE.point.events) continue;
                evt1.segment.consume(evt2.segment);
              }
            }
          }
          getAvailableLinkedEvents() {
            const events = [];
            for (let i = 0, iMax = this.point.events.length; i < iMax; i++) {
              const evt = this.point.events[i];
              if (evt !== this && !evt.segment.ringOut && evt.segment.isInResult()) {
                events.push(evt);
              }
            }
            return events;
          }
          /**
           * Returns a comparator function for sorting linked events that will
           * favor the event that will give us the smallest left-side angle.
           * All ring construction starts as low as possible heading to the right,
           * so by always turning left as sharp as possible we'll get polygons
           * without uncessary loops & holes.
           *
           * The comparator function has a compute cache such that it avoids
           * re-computing already-computed values.
           */
          getLeftmostComparator(baseEvent) {
            const cache = /* @__PURE__ */ new Map();
            const fillCache = (linkedEvent) => {
              const nextEvent = linkedEvent.otherSE;
              cache.set(linkedEvent, {
                sine: sineOfAngle(this.point, baseEvent.point, nextEvent.point),
                cosine: cosineOfAngle(this.point, baseEvent.point, nextEvent.point)
              });
            };
            return (a, b) => {
              if (!cache.has(a)) fillCache(a);
              if (!cache.has(b)) fillCache(b);
              const {
                sine: asine,
                cosine: acosine
              } = cache.get(a);
              const {
                sine: bsine,
                cosine: bcosine
              } = cache.get(b);
              if (asine >= 0 && bsine >= 0) {
                if (acosine < bcosine) return 1;
                if (acosine > bcosine) return -1;
                return 0;
              }
              if (asine < 0 && bsine < 0) {
                if (acosine < bcosine) return -1;
                if (acosine > bcosine) return 1;
                return 0;
              }
              if (bsine < asine) return -1;
              if (bsine > asine) return 1;
              return 0;
            };
          }
        }
        let segmentId = 0;
        class Segment {
          /* This compare() function is for ordering segments in the sweep
           * line tree, and does so according to the following criteria:
           *
           * Consider the vertical line that lies an infinestimal step to the
           * right of the right-more of the two left endpoints of the input
           * segments. Imagine slowly moving a point up from negative infinity
           * in the increasing y direction. Which of the two segments will that
           * point intersect first? That segment comes 'before' the other one.
           *
           * If neither segment would be intersected by such a line, (if one
           * or more of the segments are vertical) then the line to be considered
           * is directly on the right-more of the two left inputs.
           */
          static compare(a, b) {
            const alx = a.leftSE.point.x;
            const blx = b.leftSE.point.x;
            const arx = a.rightSE.point.x;
            const brx = b.rightSE.point.x;
            if (brx < alx) return 1;
            if (arx < blx) return -1;
            const aly = a.leftSE.point.y;
            const bly = b.leftSE.point.y;
            const ary = a.rightSE.point.y;
            const bry = b.rightSE.point.y;
            if (alx < blx) {
              if (bly < aly && bly < ary) return 1;
              if (bly > aly && bly > ary) return -1;
              const aCmpBLeft = a.comparePoint(b.leftSE.point);
              if (aCmpBLeft < 0) return 1;
              if (aCmpBLeft > 0) return -1;
              const bCmpARight = b.comparePoint(a.rightSE.point);
              if (bCmpARight !== 0) return bCmpARight;
              return -1;
            }
            if (alx > blx) {
              if (aly < bly && aly < bry) return -1;
              if (aly > bly && aly > bry) return 1;
              const bCmpALeft = b.comparePoint(a.leftSE.point);
              if (bCmpALeft !== 0) return bCmpALeft;
              const aCmpBRight = a.comparePoint(b.rightSE.point);
              if (aCmpBRight < 0) return 1;
              if (aCmpBRight > 0) return -1;
              return 1;
            }
            if (aly < bly) return -1;
            if (aly > bly) return 1;
            if (arx < brx) {
              const bCmpARight = b.comparePoint(a.rightSE.point);
              if (bCmpARight !== 0) return bCmpARight;
            }
            if (arx > brx) {
              const aCmpBRight = a.comparePoint(b.rightSE.point);
              if (aCmpBRight < 0) return 1;
              if (aCmpBRight > 0) return -1;
            }
            if (arx !== brx) {
              const ay = ary - aly;
              const ax = arx - alx;
              const by = bry - bly;
              const bx = brx - blx;
              if (ay > ax && by < bx) return 1;
              if (ay < ax && by > bx) return -1;
            }
            if (arx > brx) return 1;
            if (arx < brx) return -1;
            if (ary < bry) return -1;
            if (ary > bry) return 1;
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;
          }
          /* Warning: a reference to ringWindings input will be stored,
           *  and possibly will be later modified */
          constructor(leftSE, rightSE, rings, windings) {
            this.id = ++segmentId;
            this.leftSE = leftSE;
            leftSE.segment = this;
            leftSE.otherSE = rightSE;
            this.rightSE = rightSE;
            rightSE.segment = this;
            rightSE.otherSE = leftSE;
            this.rings = rings;
            this.windings = windings;
          }
          static fromRing(pt1, pt2, ring) {
            let leftPt, rightPt, winding;
            const cmpPts = SweepEvent.comparePoints(pt1, pt2);
            if (cmpPts < 0) {
              leftPt = pt1;
              rightPt = pt2;
              winding = 1;
            } else if (cmpPts > 0) {
              leftPt = pt2;
              rightPt = pt1;
              winding = -1;
            } else throw new Error(`Tried to create degenerate segment at [${pt1.x}, ${pt1.y}]`);
            const leftSE = new SweepEvent(leftPt, true);
            const rightSE = new SweepEvent(rightPt, false);
            return new Segment(leftSE, rightSE, [ring], [winding]);
          }
          /* When a segment is split, the rightSE is replaced with a new sweep event */
          replaceRightSE(newRightSE) {
            this.rightSE = newRightSE;
            this.rightSE.segment = this;
            this.rightSE.otherSE = this.leftSE;
            this.leftSE.otherSE = this.rightSE;
          }
          bbox() {
            const y1 = this.leftSE.point.y;
            const y2 = this.rightSE.point.y;
            return {
              ll: {
                x: this.leftSE.point.x,
                y: y1 < y2 ? y1 : y2
              },
              ur: {
                x: this.rightSE.point.x,
                y: y1 > y2 ? y1 : y2
              }
            };
          }
          /* A vector from the left point to the right */
          vector() {
            return {
              x: this.rightSE.point.x - this.leftSE.point.x,
              y: this.rightSE.point.y - this.leftSE.point.y
            };
          }
          isAnEndpoint(pt) {
            return pt.x === this.leftSE.point.x && pt.y === this.leftSE.point.y || pt.x === this.rightSE.point.x && pt.y === this.rightSE.point.y;
          }
          /* Compare this segment with a point.
           *
           * A point P is considered to be colinear to a segment if there
           * exists a distance D such that if we travel along the segment
           * from one * endpoint towards the other a distance D, we find
           * ourselves at point P.
           *
           * Return value indicates:
           *
           *   1: point lies above the segment (to the left of vertical)
           *   0: point is colinear to segment
           *  -1: point lies below the segment (to the right of vertical)
           */
          comparePoint(point) {
            if (this.isAnEndpoint(point)) return 0;
            const lPt = this.leftSE.point;
            const rPt = this.rightSE.point;
            const v = this.vector();
            if (lPt.x === rPt.x) {
              if (point.x === lPt.x) return 0;
              return point.x < lPt.x ? 1 : -1;
            }
            const yDist = (point.y - lPt.y) / v.y;
            const xFromYDist = lPt.x + yDist * v.x;
            if (point.x === xFromYDist) return 0;
            const xDist = (point.x - lPt.x) / v.x;
            const yFromXDist = lPt.y + xDist * v.y;
            if (point.y === yFromXDist) return 0;
            return point.y < yFromXDist ? -1 : 1;
          }
          /**
           * Given another segment, returns the first non-trivial intersection
           * between the two segments (in terms of sweep line ordering), if it exists.
           *
           * A 'non-trivial' intersection is one that will cause one or both of the
           * segments to be split(). As such, 'trivial' vs. 'non-trivial' intersection:
           *
           *   * endpoint of segA with endpoint of segB --> trivial
           *   * endpoint of segA with point along segB --> non-trivial
           *   * endpoint of segB with point along segA --> non-trivial
           *   * point along segA with point along segB --> non-trivial
           *
           * If no non-trivial intersection exists, return null
           * Else, return null.
           */
          getIntersection(other) {
            const tBbox = this.bbox();
            const oBbox = other.bbox();
            const bboxOverlap = getBboxOverlap(tBbox, oBbox);
            if (bboxOverlap === null) return null;
            const tlp = this.leftSE.point;
            const trp = this.rightSE.point;
            const olp = other.leftSE.point;
            const orp = other.rightSE.point;
            const touchesOtherLSE = isInBbox(tBbox, olp) && this.comparePoint(olp) === 0;
            const touchesThisLSE = isInBbox(oBbox, tlp) && other.comparePoint(tlp) === 0;
            const touchesOtherRSE = isInBbox(tBbox, orp) && this.comparePoint(orp) === 0;
            const touchesThisRSE = isInBbox(oBbox, trp) && other.comparePoint(trp) === 0;
            if (touchesThisLSE && touchesOtherLSE) {
              if (touchesThisRSE && !touchesOtherRSE) return trp;
              if (!touchesThisRSE && touchesOtherRSE) return orp;
              return null;
            }
            if (touchesThisLSE) {
              if (touchesOtherRSE) {
                if (tlp.x === orp.x && tlp.y === orp.y) return null;
              }
              return tlp;
            }
            if (touchesOtherLSE) {
              if (touchesThisRSE) {
                if (trp.x === olp.x && trp.y === olp.y) return null;
              }
              return olp;
            }
            if (touchesThisRSE && touchesOtherRSE) return null;
            if (touchesThisRSE) return trp;
            if (touchesOtherRSE) return orp;
            const pt = intersection$1(tlp, this.vector(), olp, other.vector());
            if (pt === null) return null;
            if (!isInBbox(bboxOverlap, pt)) return null;
            return rounder.round(pt.x, pt.y);
          }
          /**
           * Split the given segment into multiple segments on the given points.
           *  * Each existing segment will retain its leftSE and a new rightSE will be
           *    generated for it.
           *  * A new segment will be generated which will adopt the original segment's
           *    rightSE, and a new leftSE will be generated for it.
           *  * If there are more than two points given to split on, new segments
           *    in the middle will be generated with new leftSE and rightSE's.
           *  * An array of the newly generated SweepEvents will be returned.
           *
           * Warning: input array of points is modified
           */
          split(point) {
            const newEvents = [];
            const alreadyLinked = point.events !== void 0;
            const newLeftSE = new SweepEvent(point, true);
            const newRightSE = new SweepEvent(point, false);
            const oldRightSE = this.rightSE;
            this.replaceRightSE(newRightSE);
            newEvents.push(newRightSE);
            newEvents.push(newLeftSE);
            const newSeg = new Segment(newLeftSE, oldRightSE, this.rings.slice(), this.windings.slice());
            if (SweepEvent.comparePoints(newSeg.leftSE.point, newSeg.rightSE.point) > 0) {
              newSeg.swapEvents();
            }
            if (SweepEvent.comparePoints(this.leftSE.point, this.rightSE.point) > 0) {
              this.swapEvents();
            }
            if (alreadyLinked) {
              newLeftSE.checkForConsuming();
              newRightSE.checkForConsuming();
            }
            return newEvents;
          }
          /* Swap which event is left and right */
          swapEvents() {
            const tmpEvt = this.rightSE;
            this.rightSE = this.leftSE;
            this.leftSE = tmpEvt;
            this.leftSE.isLeft = true;
            this.rightSE.isLeft = false;
            for (let i = 0, iMax = this.windings.length; i < iMax; i++) {
              this.windings[i] *= -1;
            }
          }
          /* Consume another segment. We take their rings under our wing
           * and mark them as consumed. Use for perfectly overlapping segments */
          consume(other) {
            let consumer = this;
            let consumee = other;
            while (consumer.consumedBy) consumer = consumer.consumedBy;
            while (consumee.consumedBy) consumee = consumee.consumedBy;
            const cmp2 = Segment.compare(consumer, consumee);
            if (cmp2 === 0) return;
            if (cmp2 > 0) {
              const tmp = consumer;
              consumer = consumee;
              consumee = tmp;
            }
            if (consumer.prev === consumee) {
              const tmp = consumer;
              consumer = consumee;
              consumee = tmp;
            }
            for (let i = 0, iMax = consumee.rings.length; i < iMax; i++) {
              const ring = consumee.rings[i];
              const winding = consumee.windings[i];
              const index2 = consumer.rings.indexOf(ring);
              if (index2 === -1) {
                consumer.rings.push(ring);
                consumer.windings.push(winding);
              } else consumer.windings[index2] += winding;
            }
            consumee.rings = null;
            consumee.windings = null;
            consumee.consumedBy = consumer;
            consumee.leftSE.consumedBy = consumer.leftSE;
            consumee.rightSE.consumedBy = consumer.rightSE;
          }
          /* The first segment previous segment chain that is in the result */
          prevInResult() {
            if (this._prevInResult !== void 0) return this._prevInResult;
            if (!this.prev) this._prevInResult = null;
            else if (this.prev.isInResult()) this._prevInResult = this.prev;
            else this._prevInResult = this.prev.prevInResult();
            return this._prevInResult;
          }
          beforeState() {
            if (this._beforeState !== void 0) return this._beforeState;
            if (!this.prev) this._beforeState = {
              rings: [],
              windings: [],
              multiPolys: []
            };
            else {
              const seg = this.prev.consumedBy || this.prev;
              this._beforeState = seg.afterState();
            }
            return this._beforeState;
          }
          afterState() {
            if (this._afterState !== void 0) return this._afterState;
            const beforeState = this.beforeState();
            this._afterState = {
              rings: beforeState.rings.slice(0),
              windings: beforeState.windings.slice(0),
              multiPolys: []
            };
            const ringsAfter = this._afterState.rings;
            const windingsAfter = this._afterState.windings;
            const mpsAfter = this._afterState.multiPolys;
            for (let i = 0, iMax = this.rings.length; i < iMax; i++) {
              const ring = this.rings[i];
              const winding = this.windings[i];
              const index2 = ringsAfter.indexOf(ring);
              if (index2 === -1) {
                ringsAfter.push(ring);
                windingsAfter.push(winding);
              } else windingsAfter[index2] += winding;
            }
            const polysAfter = [];
            const polysExclude = [];
            for (let i = 0, iMax = ringsAfter.length; i < iMax; i++) {
              if (windingsAfter[i] === 0) continue;
              const ring = ringsAfter[i];
              const poly = ring.poly;
              if (polysExclude.indexOf(poly) !== -1) continue;
              if (ring.isExterior) polysAfter.push(poly);
              else {
                if (polysExclude.indexOf(poly) === -1) polysExclude.push(poly);
                const index2 = polysAfter.indexOf(ring.poly);
                if (index2 !== -1) polysAfter.splice(index2, 1);
              }
            }
            for (let i = 0, iMax = polysAfter.length; i < iMax; i++) {
              const mp = polysAfter[i].multiPoly;
              if (mpsAfter.indexOf(mp) === -1) mpsAfter.push(mp);
            }
            return this._afterState;
          }
          /* Is this segment part of the final result? */
          isInResult() {
            if (this.consumedBy) return false;
            if (this._isInResult !== void 0) return this._isInResult;
            const mpsBefore = this.beforeState().multiPolys;
            const mpsAfter = this.afterState().multiPolys;
            switch (operation.type) {
              case "union": {
                const noBefores = mpsBefore.length === 0;
                const noAfters = mpsAfter.length === 0;
                this._isInResult = noBefores !== noAfters;
                break;
              }
              case "intersection": {
                let least;
                let most;
                if (mpsBefore.length < mpsAfter.length) {
                  least = mpsBefore.length;
                  most = mpsAfter.length;
                } else {
                  least = mpsAfter.length;
                  most = mpsBefore.length;
                }
                this._isInResult = most === operation.numMultiPolys && least < most;
                break;
              }
              case "xor": {
                const diff = Math.abs(mpsBefore.length - mpsAfter.length);
                this._isInResult = diff % 2 === 1;
                break;
              }
              case "difference": {
                const isJustSubject = (mps) => mps.length === 1 && mps[0].isSubject;
                this._isInResult = isJustSubject(mpsBefore) !== isJustSubject(mpsAfter);
                break;
              }
              default:
                throw new Error(`Unrecognized operation type found ${operation.type}`);
            }
            return this._isInResult;
          }
        }
        class RingIn {
          constructor(geomRing, poly, isExterior) {
            if (!Array.isArray(geomRing) || geomRing.length === 0) {
              throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
            }
            this.poly = poly;
            this.isExterior = isExterior;
            this.segments = [];
            if (typeof geomRing[0][0] !== "number" || typeof geomRing[0][1] !== "number") {
              throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
            }
            const firstPoint = rounder.round(geomRing[0][0], geomRing[0][1]);
            this.bbox = {
              ll: {
                x: firstPoint.x,
                y: firstPoint.y
              },
              ur: {
                x: firstPoint.x,
                y: firstPoint.y
              }
            };
            let prevPoint = firstPoint;
            for (let i = 1, iMax = geomRing.length; i < iMax; i++) {
              if (typeof geomRing[i][0] !== "number" || typeof geomRing[i][1] !== "number") {
                throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
              }
              let point = rounder.round(geomRing[i][0], geomRing[i][1]);
              if (point.x === prevPoint.x && point.y === prevPoint.y) continue;
              this.segments.push(Segment.fromRing(prevPoint, point, this));
              if (point.x < this.bbox.ll.x) this.bbox.ll.x = point.x;
              if (point.y < this.bbox.ll.y) this.bbox.ll.y = point.y;
              if (point.x > this.bbox.ur.x) this.bbox.ur.x = point.x;
              if (point.y > this.bbox.ur.y) this.bbox.ur.y = point.y;
              prevPoint = point;
            }
            if (firstPoint.x !== prevPoint.x || firstPoint.y !== prevPoint.y) {
              this.segments.push(Segment.fromRing(prevPoint, firstPoint, this));
            }
          }
          getSweepEvents() {
            const sweepEvents = [];
            for (let i = 0, iMax = this.segments.length; i < iMax; i++) {
              const segment = this.segments[i];
              sweepEvents.push(segment.leftSE);
              sweepEvents.push(segment.rightSE);
            }
            return sweepEvents;
          }
        }
        class PolyIn {
          constructor(geomPoly, multiPoly) {
            if (!Array.isArray(geomPoly)) {
              throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
            }
            this.exteriorRing = new RingIn(geomPoly[0], this, true);
            this.bbox = {
              ll: {
                x: this.exteriorRing.bbox.ll.x,
                y: this.exteriorRing.bbox.ll.y
              },
              ur: {
                x: this.exteriorRing.bbox.ur.x,
                y: this.exteriorRing.bbox.ur.y
              }
            };
            this.interiorRings = [];
            for (let i = 1, iMax = geomPoly.length; i < iMax; i++) {
              const ring = new RingIn(geomPoly[i], this, false);
              if (ring.bbox.ll.x < this.bbox.ll.x) this.bbox.ll.x = ring.bbox.ll.x;
              if (ring.bbox.ll.y < this.bbox.ll.y) this.bbox.ll.y = ring.bbox.ll.y;
              if (ring.bbox.ur.x > this.bbox.ur.x) this.bbox.ur.x = ring.bbox.ur.x;
              if (ring.bbox.ur.y > this.bbox.ur.y) this.bbox.ur.y = ring.bbox.ur.y;
              this.interiorRings.push(ring);
            }
            this.multiPoly = multiPoly;
          }
          getSweepEvents() {
            const sweepEvents = this.exteriorRing.getSweepEvents();
            for (let i = 0, iMax = this.interiorRings.length; i < iMax; i++) {
              const ringSweepEvents = this.interiorRings[i].getSweepEvents();
              for (let j = 0, jMax = ringSweepEvents.length; j < jMax; j++) {
                sweepEvents.push(ringSweepEvents[j]);
              }
            }
            return sweepEvents;
          }
        }
        class MultiPolyIn {
          constructor(geom, isSubject) {
            if (!Array.isArray(geom)) {
              throw new Error("Input geometry is not a valid Polygon or MultiPolygon");
            }
            try {
              if (typeof geom[0][0][0] === "number") geom = [geom];
            } catch (ex) {
            }
            this.polys = [];
            this.bbox = {
              ll: {
                x: Number.POSITIVE_INFINITY,
                y: Number.POSITIVE_INFINITY
              },
              ur: {
                x: Number.NEGATIVE_INFINITY,
                y: Number.NEGATIVE_INFINITY
              }
            };
            for (let i = 0, iMax = geom.length; i < iMax; i++) {
              const poly = new PolyIn(geom[i], this);
              if (poly.bbox.ll.x < this.bbox.ll.x) this.bbox.ll.x = poly.bbox.ll.x;
              if (poly.bbox.ll.y < this.bbox.ll.y) this.bbox.ll.y = poly.bbox.ll.y;
              if (poly.bbox.ur.x > this.bbox.ur.x) this.bbox.ur.x = poly.bbox.ur.x;
              if (poly.bbox.ur.y > this.bbox.ur.y) this.bbox.ur.y = poly.bbox.ur.y;
              this.polys.push(poly);
            }
            this.isSubject = isSubject;
          }
          getSweepEvents() {
            const sweepEvents = [];
            for (let i = 0, iMax = this.polys.length; i < iMax; i++) {
              const polySweepEvents = this.polys[i].getSweepEvents();
              for (let j = 0, jMax = polySweepEvents.length; j < jMax; j++) {
                sweepEvents.push(polySweepEvents[j]);
              }
            }
            return sweepEvents;
          }
        }
        class RingOut {
          /* Given the segments from the sweep line pass, compute & return a series
           * of closed rings from all the segments marked to be part of the result */
          static factory(allSegments) {
            const ringsOut = [];
            for (let i = 0, iMax = allSegments.length; i < iMax; i++) {
              const segment = allSegments[i];
              if (!segment.isInResult() || segment.ringOut) continue;
              let prevEvent = null;
              let event = segment.leftSE;
              let nextEvent = segment.rightSE;
              const events = [event];
              const startingPoint = event.point;
              const intersectionLEs = [];
              while (true) {
                prevEvent = event;
                event = nextEvent;
                events.push(event);
                if (event.point === startingPoint) break;
                while (true) {
                  const availableLEs = event.getAvailableLinkedEvents();
                  if (availableLEs.length === 0) {
                    const firstPt = events[0].point;
                    const lastPt = events[events.length - 1].point;
                    throw new Error(`Unable to complete output ring starting at [${firstPt.x}, ${firstPt.y}]. Last matching segment found ends at [${lastPt.x}, ${lastPt.y}].`);
                  }
                  if (availableLEs.length === 1) {
                    nextEvent = availableLEs[0].otherSE;
                    break;
                  }
                  let indexLE = null;
                  for (let j = 0, jMax = intersectionLEs.length; j < jMax; j++) {
                    if (intersectionLEs[j].point === event.point) {
                      indexLE = j;
                      break;
                    }
                  }
                  if (indexLE !== null) {
                    const intersectionLE = intersectionLEs.splice(indexLE)[0];
                    const ringEvents = events.splice(intersectionLE.index);
                    ringEvents.unshift(ringEvents[0].otherSE);
                    ringsOut.push(new RingOut(ringEvents.reverse()));
                    continue;
                  }
                  intersectionLEs.push({
                    index: events.length,
                    point: event.point
                  });
                  const comparator = event.getLeftmostComparator(prevEvent);
                  nextEvent = availableLEs.sort(comparator)[0].otherSE;
                  break;
                }
              }
              ringsOut.push(new RingOut(events));
            }
            return ringsOut;
          }
          constructor(events) {
            this.events = events;
            for (let i = 0, iMax = events.length; i < iMax; i++) {
              events[i].segment.ringOut = this;
            }
            this.poly = null;
          }
          getGeom() {
            let prevPt = this.events[0].point;
            const points = [prevPt];
            for (let i = 1, iMax = this.events.length - 1; i < iMax; i++) {
              const pt2 = this.events[i].point;
              const nextPt2 = this.events[i + 1].point;
              if (compareVectorAngles(pt2, prevPt, nextPt2) === 0) continue;
              points.push(pt2);
              prevPt = pt2;
            }
            if (points.length === 1) return null;
            const pt = points[0];
            const nextPt = points[1];
            if (compareVectorAngles(pt, prevPt, nextPt) === 0) points.shift();
            points.push(points[0]);
            const step = this.isExteriorRing() ? 1 : -1;
            const iStart = this.isExteriorRing() ? 0 : points.length - 1;
            const iEnd = this.isExteriorRing() ? points.length : -1;
            const orderedPoints = [];
            for (let i = iStart; i != iEnd; i += step) orderedPoints.push([points[i].x, points[i].y]);
            return orderedPoints;
          }
          isExteriorRing() {
            if (this._isExteriorRing === void 0) {
              const enclosing = this.enclosingRing();
              this._isExteriorRing = enclosing ? !enclosing.isExteriorRing() : true;
            }
            return this._isExteriorRing;
          }
          enclosingRing() {
            if (this._enclosingRing === void 0) {
              this._enclosingRing = this._calcEnclosingRing();
            }
            return this._enclosingRing;
          }
          /* Returns the ring that encloses this one, if any */
          _calcEnclosingRing() {
            let leftMostEvt = this.events[0];
            for (let i = 1, iMax = this.events.length; i < iMax; i++) {
              const evt = this.events[i];
              if (SweepEvent.compare(leftMostEvt, evt) > 0) leftMostEvt = evt;
            }
            let prevSeg = leftMostEvt.segment.prevInResult();
            let prevPrevSeg = prevSeg ? prevSeg.prevInResult() : null;
            while (true) {
              if (!prevSeg) return null;
              if (!prevPrevSeg) return prevSeg.ringOut;
              if (prevPrevSeg.ringOut !== prevSeg.ringOut) {
                if (prevPrevSeg.ringOut.enclosingRing() !== prevSeg.ringOut) {
                  return prevSeg.ringOut;
                } else return prevSeg.ringOut.enclosingRing();
              }
              prevSeg = prevPrevSeg.prevInResult();
              prevPrevSeg = prevSeg ? prevSeg.prevInResult() : null;
            }
          }
        }
        class PolyOut {
          constructor(exteriorRing) {
            this.exteriorRing = exteriorRing;
            exteriorRing.poly = this;
            this.interiorRings = [];
          }
          addInterior(ring) {
            this.interiorRings.push(ring);
            ring.poly = this;
          }
          getGeom() {
            const geom = [this.exteriorRing.getGeom()];
            if (geom[0] === null) return null;
            for (let i = 0, iMax = this.interiorRings.length; i < iMax; i++) {
              const ringGeom = this.interiorRings[i].getGeom();
              if (ringGeom === null) continue;
              geom.push(ringGeom);
            }
            return geom;
          }
        }
        class MultiPolyOut {
          constructor(rings) {
            this.rings = rings;
            this.polys = this._composePolys(rings);
          }
          getGeom() {
            const geom = [];
            for (let i = 0, iMax = this.polys.length; i < iMax; i++) {
              const polyGeom = this.polys[i].getGeom();
              if (polyGeom === null) continue;
              geom.push(polyGeom);
            }
            return geom;
          }
          _composePolys(rings) {
            const polys = [];
            for (let i = 0, iMax = rings.length; i < iMax; i++) {
              const ring = rings[i];
              if (ring.poly) continue;
              if (ring.isExteriorRing()) polys.push(new PolyOut(ring));
              else {
                const enclosingRing = ring.enclosingRing();
                if (!enclosingRing.poly) polys.push(new PolyOut(enclosingRing));
                enclosingRing.poly.addInterior(ring);
              }
            }
            return polys;
          }
        }
        class SweepLine {
          constructor(queue) {
            let comparator = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : Segment.compare;
            this.queue = queue;
            this.tree = new Tree(comparator);
            this.segments = [];
          }
          process(event) {
            const segment = event.segment;
            const newEvents = [];
            if (event.consumedBy) {
              if (event.isLeft) this.queue.remove(event.otherSE);
              else this.tree.remove(segment);
              return newEvents;
            }
            const node = event.isLeft ? this.tree.add(segment) : this.tree.find(segment);
            if (!node) throw new Error(`Unable to find segment #${segment.id} [${segment.leftSE.point.x}, ${segment.leftSE.point.y}] -> [${segment.rightSE.point.x}, ${segment.rightSE.point.y}] in SweepLine tree.`);
            let prevNode = node;
            let nextNode = node;
            let prevSeg = void 0;
            let nextSeg = void 0;
            while (prevSeg === void 0) {
              prevNode = this.tree.prev(prevNode);
              if (prevNode === null) prevSeg = null;
              else if (prevNode.key.consumedBy === void 0) prevSeg = prevNode.key;
            }
            while (nextSeg === void 0) {
              nextNode = this.tree.next(nextNode);
              if (nextNode === null) nextSeg = null;
              else if (nextNode.key.consumedBy === void 0) nextSeg = nextNode.key;
            }
            if (event.isLeft) {
              let prevMySplitter = null;
              if (prevSeg) {
                const prevInter = prevSeg.getIntersection(segment);
                if (prevInter !== null) {
                  if (!segment.isAnEndpoint(prevInter)) prevMySplitter = prevInter;
                  if (!prevSeg.isAnEndpoint(prevInter)) {
                    const newEventsFromSplit = this._splitSafely(prevSeg, prevInter);
                    for (let i = 0, iMax = newEventsFromSplit.length; i < iMax; i++) {
                      newEvents.push(newEventsFromSplit[i]);
                    }
                  }
                }
              }
              let nextMySplitter = null;
              if (nextSeg) {
                const nextInter = nextSeg.getIntersection(segment);
                if (nextInter !== null) {
                  if (!segment.isAnEndpoint(nextInter)) nextMySplitter = nextInter;
                  if (!nextSeg.isAnEndpoint(nextInter)) {
                    const newEventsFromSplit = this._splitSafely(nextSeg, nextInter);
                    for (let i = 0, iMax = newEventsFromSplit.length; i < iMax; i++) {
                      newEvents.push(newEventsFromSplit[i]);
                    }
                  }
                }
              }
              if (prevMySplitter !== null || nextMySplitter !== null) {
                let mySplitter = null;
                if (prevMySplitter === null) mySplitter = nextMySplitter;
                else if (nextMySplitter === null) mySplitter = prevMySplitter;
                else {
                  const cmpSplitters = SweepEvent.comparePoints(prevMySplitter, nextMySplitter);
                  mySplitter = cmpSplitters <= 0 ? prevMySplitter : nextMySplitter;
                }
                this.queue.remove(segment.rightSE);
                newEvents.push(segment.rightSE);
                const newEventsFromSplit = segment.split(mySplitter);
                for (let i = 0, iMax = newEventsFromSplit.length; i < iMax; i++) {
                  newEvents.push(newEventsFromSplit[i]);
                }
              }
              if (newEvents.length > 0) {
                this.tree.remove(segment);
                newEvents.push(event);
              } else {
                this.segments.push(segment);
                segment.prev = prevSeg;
              }
            } else {
              if (prevSeg && nextSeg) {
                const inter = prevSeg.getIntersection(nextSeg);
                if (inter !== null) {
                  if (!prevSeg.isAnEndpoint(inter)) {
                    const newEventsFromSplit = this._splitSafely(prevSeg, inter);
                    for (let i = 0, iMax = newEventsFromSplit.length; i < iMax; i++) {
                      newEvents.push(newEventsFromSplit[i]);
                    }
                  }
                  if (!nextSeg.isAnEndpoint(inter)) {
                    const newEventsFromSplit = this._splitSafely(nextSeg, inter);
                    for (let i = 0, iMax = newEventsFromSplit.length; i < iMax; i++) {
                      newEvents.push(newEventsFromSplit[i]);
                    }
                  }
                }
              }
              this.tree.remove(segment);
            }
            return newEvents;
          }
          /* Safely split a segment that is currently in the datastructures
           * IE - a segment other than the one that is currently being processed. */
          _splitSafely(seg, pt) {
            this.tree.remove(seg);
            const rightSE = seg.rightSE;
            this.queue.remove(rightSE);
            const newEvents = seg.split(pt);
            newEvents.push(rightSE);
            if (seg.consumedBy === void 0) this.tree.add(seg);
            return newEvents;
          }
        }
        const POLYGON_CLIPPING_MAX_QUEUE_SIZE = typeof process !== "undefined" && process.env.POLYGON_CLIPPING_MAX_QUEUE_SIZE || 1e6;
        const POLYGON_CLIPPING_MAX_SWEEPLINE_SEGMENTS = typeof process !== "undefined" && process.env.POLYGON_CLIPPING_MAX_SWEEPLINE_SEGMENTS || 1e6;
        class Operation {
          run(type, geom, moreGeoms) {
            operation.type = type;
            rounder.reset();
            const multipolys = [new MultiPolyIn(geom, true)];
            for (let i = 0, iMax = moreGeoms.length; i < iMax; i++) {
              multipolys.push(new MultiPolyIn(moreGeoms[i], false));
            }
            operation.numMultiPolys = multipolys.length;
            if (operation.type === "difference") {
              const subject = multipolys[0];
              let i = 1;
              while (i < multipolys.length) {
                if (getBboxOverlap(multipolys[i].bbox, subject.bbox) !== null) i++;
                else multipolys.splice(i, 1);
              }
            }
            if (operation.type === "intersection") {
              for (let i = 0, iMax = multipolys.length; i < iMax; i++) {
                const mpA = multipolys[i];
                for (let j = i + 1, jMax = multipolys.length; j < jMax; j++) {
                  if (getBboxOverlap(mpA.bbox, multipolys[j].bbox) === null) return [];
                }
              }
            }
            const queue = new Tree(SweepEvent.compare);
            for (let i = 0, iMax = multipolys.length; i < iMax; i++) {
              const sweepEvents = multipolys[i].getSweepEvents();
              for (let j = 0, jMax = sweepEvents.length; j < jMax; j++) {
                queue.insert(sweepEvents[j]);
                if (queue.size > POLYGON_CLIPPING_MAX_QUEUE_SIZE) {
                  throw new Error("Infinite loop when putting segment endpoints in a priority queue (queue size too big).");
                }
              }
            }
            const sweepLine = new SweepLine(queue);
            let prevQueueSize = queue.size;
            let node = queue.pop();
            while (node) {
              const evt = node.key;
              if (queue.size === prevQueueSize) {
                const seg = evt.segment;
                throw new Error(`Unable to pop() ${evt.isLeft ? "left" : "right"} SweepEvent [${evt.point.x}, ${evt.point.y}] from segment #${seg.id} [${seg.leftSE.point.x}, ${seg.leftSE.point.y}] -> [${seg.rightSE.point.x}, ${seg.rightSE.point.y}] from queue.`);
              }
              if (queue.size > POLYGON_CLIPPING_MAX_QUEUE_SIZE) {
                throw new Error("Infinite loop when passing sweep line over endpoints (queue size too big).");
              }
              if (sweepLine.segments.length > POLYGON_CLIPPING_MAX_SWEEPLINE_SEGMENTS) {
                throw new Error("Infinite loop when passing sweep line over endpoints (too many sweep line segments).");
              }
              const newEvents = sweepLine.process(evt);
              for (let i = 0, iMax = newEvents.length; i < iMax; i++) {
                const evt2 = newEvents[i];
                if (evt2.consumedBy === void 0) queue.insert(evt2);
              }
              prevQueueSize = queue.size;
              node = queue.pop();
            }
            rounder.reset();
            const ringsOut = RingOut.factory(sweepLine.segments);
            const result = new MultiPolyOut(ringsOut);
            return result.getGeom();
          }
        }
        const operation = new Operation();
        const union = function(geom) {
          for (var _len = arguments.length, moreGeoms = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            moreGeoms[_key - 1] = arguments[_key];
          }
          return operation.run("union", geom, moreGeoms);
        };
        const intersection = function(geom) {
          for (var _len2 = arguments.length, moreGeoms = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            moreGeoms[_key2 - 1] = arguments[_key2];
          }
          return operation.run("intersection", geom, moreGeoms);
        };
        const xor = function(geom) {
          for (var _len3 = arguments.length, moreGeoms = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
            moreGeoms[_key3 - 1] = arguments[_key3];
          }
          return operation.run("xor", geom, moreGeoms);
        };
        const difference = function(subjectGeom) {
          for (var _len4 = arguments.length, clippingGeoms = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
            clippingGeoms[_key4 - 1] = arguments[_key4];
          }
          return operation.run("difference", subjectGeom, clippingGeoms);
        };
        var index = {
          union,
          intersection,
          xor,
          difference
        };
        return index;
      }));
    }
  });

  // node_modules/flatqueue/index.js
  var FlatQueue = class {
    /**
     * Creates an empty queue. If `capacity` is provided, the queue is backed by fixed-size typed
     * arrays for better performance and memory use, but can't grow beyond `capacity`. `values` uses
     * `ValuesArray` (default `Float64Array`) and `ids` uses `IdsArray` (default `Uint32Array`); pass
     * narrower constructors like `Uint16Array` if your values or ids are known to fit them.
     *
     * @param {number} [capacity]
     * @param {TypedArrayConstructor} [ValuesArray]
     * @param {TypedArrayConstructor} [IdsArray]
     */
    constructor(capacity = Infinity, ValuesArray = Float64Array, IdsArray = Uint32Array) {
      const fixed = capacity !== Infinity;
      this.ids = fixed ? (
        /** @type {T[]} */
        /** @type {unknown} */
        new IdsArray(capacity)
      ) : [];
      this.values = fixed ? (
        /** @type {number[]} */
        /** @type {unknown} */
        new ValuesArray(capacity)
      ) : [];
      this.capacity = capacity;
      this.length = 0;
    }
    /** Removes all items from the queue. */
    clear() {
      this.length = 0;
    }
    /**
     * Adds `item` to the queue with the specified `priority`.
     *
     * `priority` must be a number. Items are sorted and returned from low to high priority. Multiple items
     * with the same priority value can be added to the queue, but there is no guaranteed order between these items.
     *
     * For fixed-capacity queues, throws a `RangeError` if the queue is already full.
     *
     * @param {T} item
     * @param {number} priority
     */
    push(item, priority) {
      if (this.length === this.capacity) throw new RangeError("Queue is at capacity.");
      let pos = this.length++;
      while (pos > 0) {
        const parent = pos - 1 >> 1;
        const parentValue = this.values[parent];
        if (priority >= parentValue) break;
        this.ids[pos] = this.ids[parent];
        this.values[pos] = parentValue;
        pos = parent;
      }
      this.ids[pos] = item;
      this.values[pos] = priority;
    }
    /**
     * Removes and returns the item from the head of this queue, which is one of
     * the items with the lowest priority. If this queue is empty, returns `undefined`.
     */
    pop() {
      if (this.length === 0) return void 0;
      const ids = this.ids, values = this.values, top = ids[0], last = --this.length;
      if (last > 0) {
        const id = ids[last];
        const value = values[last];
        let pos = 0;
        const halfLen = last >> 1;
        while (pos < halfLen) {
          const left = (pos << 1) + 1;
          const right = left + 1;
          const child = left + (+(right < last) & +(values[right] < values[left]));
          if (values[child] >= value) break;
          ids[pos] = ids[child];
          values[pos] = values[child];
          pos = child;
        }
        ids[pos] = id;
        values[pos] = value;
      }
      return top;
    }
    /** Returns the item from the head of this queue without removing it. If this queue is empty, returns `undefined`. */
    peek() {
      return this.length > 0 ? this.ids[0] : void 0;
    }
    /**
     * Returns the priority value of the item at the head of this queue without
     * removing it. If this queue is empty, returns `undefined`.
     */
    peekValue() {
      return this.length > 0 ? this.values[0] : void 0;
    }
    /**
     * Shrinks the internal arrays to `this.length`. No-op for queues with fixed capacity.
     *
     * `pop()` and `clear()` calls don't free memory automatically to avoid unnecessary resize operations.
     * This also means that items that have been added to the queue can't be garbage collected until
     * a new item is pushed in their place, or this method is called.
     */
    shrink() {
      if (Array.isArray(this.ids)) this.ids.length = this.length;
      if (Array.isArray(this.values)) this.values.length = this.length;
    }
  };

  // node_modules/flatbush/index.js
  var ARRAY_TYPES = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
  var VERSION = 3;
  var Flatbush = class _Flatbush {
    /**
     * Recreate a Flatbush index from raw `ArrayBuffer` or `SharedArrayBuffer` data.
     * @param {ArrayBufferLike} data
     * @param {number} [byteOffset=0] byte offset to the start of the Flatbush buffer in the referenced ArrayBuffer.
     * @returns {Flatbush} index
     */
    static from(data, byteOffset = 0) {
      if (byteOffset % 8 !== 0) {
        throw new Error("byteOffset must be 8-byte aligned.");
      }
      if (!data || data.byteLength === void 0 || "buffer" in data) {
        throw new Error("Data must be an instance of ArrayBuffer or SharedArrayBuffer.");
      }
      const [magic, versionAndType] = new Uint8Array(data, byteOffset + 0, 2);
      if (magic !== 251) {
        throw new Error("Data does not appear to be in a Flatbush format.");
      }
      const version = versionAndType >> 4;
      if (version !== VERSION) {
        throw new Error(`Got v${version} data when expected v${VERSION}.`);
      }
      const ArrayType = ARRAY_TYPES[versionAndType & 15];
      if (!ArrayType) {
        throw new Error("Unrecognized array type.");
      }
      const [nodeSize] = new Uint16Array(data, byteOffset + 2, 1);
      const [numItems] = new Uint32Array(data, byteOffset + 4, 1);
      return new _Flatbush(numItems, nodeSize, ArrayType, void 0, data, byteOffset);
    }
    /**
     * Create a Flatbush index that will hold a given number of items.
     * @param {number} numItems
     * @param {number} [nodeSize=16] Size of the tree node (16 by default).
     * @param {TypedArrayConstructor} [ArrayType=Float64Array] The array type used for coordinates storage (`Float64Array` by default).
     * @param {ArrayBufferConstructor | SharedArrayBufferConstructor} [ArrayBufferType=ArrayBuffer] The array buffer type used to store data (`ArrayBuffer` by default).
     * @param {ArrayBufferLike} [data] (Only used internally)
     * @param {number} [byteOffset=0] (Only used internally)
     */
    constructor(numItems, nodeSize = 16, ArrayType = Float64Array, ArrayBufferType = ArrayBuffer, data, byteOffset = 0) {
      if (numItems === void 0) throw new Error("Missing required argument: numItems.");
      if (isNaN(numItems) || numItems <= 0) throw new Error(`Unexpected numItems value: ${numItems}.`);
      this.numItems = +numItems;
      this.nodeSize = Math.min(Math.max(+nodeSize, 2), 65535);
      this.byteOffset = byteOffset;
      let n = numItems;
      let numNodes = n;
      this._levelBounds = [n * 4];
      do {
        n = Math.ceil(n / this.nodeSize);
        numNodes += n;
        this._levelBounds.push(numNodes * 4);
      } while (n !== 1);
      this.ArrayType = ArrayType;
      this.IndexArrayType = numNodes < 16384 ? Uint16Array : Uint32Array;
      const arrayTypeIndex = ARRAY_TYPES.indexOf(ArrayType);
      const nodesByteSize = numNodes * 4 * ArrayType.BYTES_PER_ELEMENT;
      if (arrayTypeIndex < 0) {
        throw new Error(`Unexpected typed array class: ${ArrayType}.`);
      }
      const BoxCtor = ArrayType;
      const IdxCtor = this.IndexArrayType;
      if (data) {
        this.data = data;
        this._boxes = new BoxCtor(data, byteOffset + 8, numNodes * 4);
        this._indices = new IdxCtor(data, byteOffset + 8 + nodesByteSize, numNodes);
        this._pos = numNodes * 4;
        this.minX = this._boxes[this._pos - 4];
        this.minY = this._boxes[this._pos - 3];
        this.maxX = this._boxes[this._pos - 2];
        this.maxY = this._boxes[this._pos - 1];
      } else {
        const data2 = this.data = new ArrayBufferType(8 + nodesByteSize + numNodes * this.IndexArrayType.BYTES_PER_ELEMENT);
        this._boxes = new BoxCtor(data2, 8, numNodes * 4);
        this._indices = new IdxCtor(data2, 8 + nodesByteSize, numNodes);
        this._pos = 0;
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        new Uint8Array(data2, 0, 2).set([251, (VERSION << 4) + arrayTypeIndex]);
        new Uint16Array(data2, 2, 1)[0] = nodeSize;
        new Uint32Array(data2, 4, 1)[0] = numItems;
      }
      this._queue = new FlatQueue();
    }
    /**
     * Add a given rectangle to the index.
     * @param {number} minX
     * @param {number} minY
     * @param {number} maxX
     * @param {number} maxY
     * @returns {number} A zero-based, incremental number that represents the newly added rectangle.
     */
    add(minX, minY, maxX = minX, maxY = minY) {
      const pos = this._pos;
      const index = pos >> 2;
      const boxes = this._boxes;
      this._indices[index] = index;
      boxes[pos] = minX;
      boxes[pos + 1] = minY;
      boxes[pos + 2] = maxX;
      boxes[pos + 3] = maxY;
      this._pos = pos + 4;
      if (minX < this.minX) this.minX = minX;
      if (minY < this.minY) this.minY = minY;
      if (maxX > this.maxX) this.maxX = maxX;
      if (maxY > this.maxY) this.maxY = maxY;
      return index;
    }
    /** Perform indexing of the added rectangles. */
    finish() {
      if (this._pos >> 2 !== this.numItems) {
        throw new Error(`Added ${this._pos >> 2} items when expected ${this.numItems}.`);
      }
      const boxes = this._boxes;
      if (this.numItems <= this.nodeSize) {
        boxes[this._pos++] = this.minX;
        boxes[this._pos++] = this.minY;
        boxes[this._pos++] = this.maxX;
        boxes[this._pos++] = this.maxY;
        return;
      }
      const { numItems, minX, minY, nodeSize, _indices: indices, _levelBounds: levelBounds } = this;
      const width = this.maxX - minX || 1;
      const height = this.maxY - minY || 1;
      const hilbertValues = new Int32Array(numItems);
      const hilbertMax = (1 << 16) - 1;
      const sx = hilbertMax / width;
      const sy = hilbertMax / height;
      for (let i = 0, pos2 = 0; i < numItems; i++) {
        const itemMinX = boxes[pos2++];
        const itemMinY = boxes[pos2++];
        const itemMaxX = boxes[pos2++];
        const itemMaxY = boxes[pos2++];
        const x = sx * ((itemMinX + itemMaxX) / 2 - minX) | 0;
        const y = sy * ((itemMinY + itemMaxY) / 2 - minY) | 0;
        hilbertValues[i] = hilbert(x, y);
      }
      sort(hilbertValues, boxes, indices, 0, numItems - 1, nodeSize);
      let pos = numItems * 4;
      for (let i = 0, readPos = 0; i < levelBounds.length - 1; i++) {
        const end = levelBounds[i];
        while (readPos < end) {
          const nodeIndex = readPos;
          let nodeMinX = boxes[readPos++];
          let nodeMinY = boxes[readPos++];
          let nodeMaxX = boxes[readPos++];
          let nodeMaxY = boxes[readPos++];
          for (let j = 1; j < nodeSize && readPos < end; j++) {
            nodeMinX = Math.min(nodeMinX, boxes[readPos++]);
            nodeMinY = Math.min(nodeMinY, boxes[readPos++]);
            nodeMaxX = Math.max(nodeMaxX, boxes[readPos++]);
            nodeMaxY = Math.max(nodeMaxY, boxes[readPos++]);
          }
          indices[pos >> 2] = nodeIndex;
          boxes[pos++] = nodeMinX;
          boxes[pos++] = nodeMinY;
          boxes[pos++] = nodeMaxX;
          boxes[pos++] = nodeMaxY;
        }
      }
      this._pos = pos;
    }
    /**
     * Search the index by a bounding box.
     * @param {number} minX
     * @param {number} minY
     * @param {number} maxX
     * @param {number} maxY
     * @param {(index: number, x0: number, y0: number, x1: number, y1: number) => boolean} [filterFn] An optional function that is called on every found item; if supplied, only items for which this function returns true will be included in the results array.
     * @returns {number[]} An array of indices of items intersecting or touching the given bounding box.
     */
    search(minX, minY, maxX, maxY, filterFn) {
      if (this._pos !== this._boxes.length) {
        throw new Error("Data not yet indexed - call index.finish().");
      }
      const { _boxes: boxes, _levelBounds: levelBounds, _indices: indices, nodeSize } = this;
      const numItems4 = this.numItems * 4;
      let nodeIndex = boxes.length - 4;
      let level = levelBounds.length - 1;
      const q = [];
      const results = [];
      let contained = false;
      while (nodeIndex !== void 0) {
        const end = Math.min(nodeIndex + nodeSize * 4, levelBounds[level]);
        const isNode = nodeIndex >= numItems4;
        if (contained) {
          this._collectContained(nodeIndex, end, level, numItems4, results, filterFn);
        } else {
          for (let pos = nodeIndex; pos < end; pos += 4) {
            const x0 = boxes[pos];
            if (maxX < x0) continue;
            const y0 = boxes[pos + 1];
            if (maxY < y0) continue;
            const x1 = boxes[pos + 2];
            if (minX > x1) continue;
            const y1 = boxes[pos + 3];
            if (minY > y1) continue;
            const index = indices[pos >> 2] | 0;
            if (isNode) {
              const c = +(minX <= x0 && minY <= y0 && maxX >= x1 && maxY >= y1);
              q.push(index | c, level - 1);
            } else if (filterFn === void 0 || filterFn(index, x0, y0, x1, y1)) {
              results.push(index);
            }
          }
        }
        level = /** @type {number} */
        q.pop();
        nodeIndex = q.pop();
        if (nodeIndex !== void 0) {
          contained = (nodeIndex & 1) === 1;
          nodeIndex &= ~1;
        }
      }
      return results;
    }
    /**
     * Collect all leaves of a subtree that's fully inside the query, skipping intersection tests.
     * Because the tree is packed bottom-up, those leaves occupy one contiguous block of the leaf
     * level, so we skip traversal entirely: descend to the first leaf, then sweep the flat range.
     * @param {number} nodeIndex
     * @param {number} end
     * @param {number} level
     * @param {number} numItems4
     * @param {number[]} results
     * @param {((index: number, x0: number, y0: number, x1: number, y1: number) => boolean) | undefined} filterFn
     */
    _collectContained(nodeIndex, end, level, numItems4, results, filterFn) {
      const boxes = this._boxes;
      const indices = this._indices;
      let pos = nodeIndex;
      for (let l = level; l > 0; l--) pos = indices[pos >> 2];
      const leafEnd = Math.min(pos + (end - nodeIndex) * this.nodeSize ** level, numItems4);
      if (filterFn === void 0) {
        for (; pos < leafEnd; pos += 4) results.push(indices[pos >> 2] | 0);
      } else {
        for (; pos < leafEnd; pos += 4) {
          const index = indices[pos >> 2] | 0;
          if (filterFn(index, boxes[pos], boxes[pos + 1], boxes[pos + 2], boxes[pos + 3])) results.push(index);
        }
      }
    }
    /**
     * Search items in order of distance from the given point.
     * @param {number} x
     * @param {number} y
     * @param {number} [maxResults=Infinity]
     * @param {number} [maxDistance=Infinity]
     * @param {(index: number) => boolean} [filterFn] An optional function for filtering the results.
     * @returns {number[]} An array of indices of items found.
     */
    neighbors(x, y, maxResults = Infinity, maxDistance = Infinity, filterFn) {
      if (this._pos !== this._boxes.length) {
        throw new Error("Data not yet indexed - call index.finish().");
      }
      const { _boxes: boxes, _levelBounds: levelBounds, _indices: indices, _queue: q, nodeSize } = this;
      const numItems4 = this.numItems * 4;
      const nodeSize4 = nodeSize * 4;
      const results = [];
      const maxDistSquared = maxDistance * maxDistance;
      const trackNearest = maxResults === 1;
      let bound = maxDistSquared;
      q.push(boxes.length - 4 << 1, 0);
      while (q.length) {
        const top = q.ids[0];
        if (top & 1) {
          q.pop();
          results.push(top >> 1);
          if (results.length === maxResults) break;
          continue;
        }
        q.pop();
        const nodeIndex = top >> 1;
        const isLeafLevel = nodeIndex < numItems4;
        const end = Math.min(nodeIndex + nodeSize4, upperBound(nodeIndex, levelBounds));
        for (let pos = nodeIndex; pos < end; pos += 4) {
          const minX = boxes[pos];
          const minY = boxes[pos + 1];
          const maxX = boxes[pos + 2];
          const maxY = boxes[pos + 3];
          const dx = Math.max(Math.max(minX - x, x - maxX), 0);
          const dy = Math.max(Math.max(minY - y, y - maxY), 0);
          const dist = dx * dx + dy * dy;
          if (dist > bound) continue;
          const childIndex = indices[pos >> 2] | 0;
          if (isLeafLevel) {
            if (filterFn === void 0 || filterFn(childIndex)) {
              q.push(childIndex << 1 | 1, dist);
              if (trackNearest && dist < bound) bound = dist;
            }
          } else {
            q.push(childIndex << 1, dist);
          }
        }
      }
      q.clear();
      return results;
    }
  };
  function upperBound(value, arr) {
    let i = 0;
    let j = arr.length - 1;
    while (i < j) {
      const m = i + j >> 1;
      if (arr[m] > value) {
        j = m;
      } else {
        i = m + 1;
      }
    }
    return arr[i];
  }
  function sort(values, boxes, indices, left, right, nodeSize) {
    const stack = [left, right];
    while (stack.length) {
      const r = stack.pop() || 0;
      const l = stack.pop() || 0;
      if (r - l <= nodeSize && Math.floor(l / nodeSize) >= Math.floor(r / nodeSize)) continue;
      const a = values[l];
      const b = values[l + r >> 1];
      const c = values[r];
      const pivot = a > b !== a > c ? a : b < a !== b < c ? b : c;
      let i = l - 1;
      let j = r + 1;
      while (true) {
        do
          i++;
        while (values[i] < pivot);
        do
          j--;
        while (values[j] > pivot);
        if (i >= j) break;
        swap(values, boxes, indices, i, j);
      }
      stack.push(l, j, j + 1, r);
    }
  }
  function swap(values, boxes, indices, i, j) {
    const temp = values[i];
    values[i] = values[j];
    values[j] = temp;
    const k = 4 * i;
    const m = 4 * j;
    const a = boxes[k];
    const b = boxes[k + 1];
    const c = boxes[k + 2];
    const d = boxes[k + 3];
    boxes[k] = boxes[m];
    boxes[k + 1] = boxes[m + 1];
    boxes[k + 2] = boxes[m + 2];
    boxes[k + 3] = boxes[m + 3];
    boxes[m] = a;
    boxes[m + 1] = b;
    boxes[m + 2] = c;
    boxes[m + 3] = d;
    const e = indices[i];
    indices[i] = indices[j];
    indices[j] = e;
  }
  function hilbert(x, y) {
    let a = x ^ y;
    let b = 65535 ^ a;
    let c = 65535 ^ (x | y);
    let d = x & (y ^ 65535);
    let A = a | b >> 1;
    let B = a >> 1 ^ a;
    let C = c ^ (c >> 1 ^ b & d >> 1);
    let D = d ^ (a & c >> 1 ^ d >> 1);
    a = A & A >> 2 ^ B & B >> 2;
    b = A & B >> 2 ^ B & (A ^ B) >> 2;
    c = C ^ (A & C >> 2 ^ B & D >> 2);
    d = D ^ (B & C >> 2 ^ (A ^ B) & D >> 2);
    A = a & a >> 4 ^ b & b >> 4;
    B = a & b >> 4 ^ b & (a ^ b) >> 4;
    C = c ^ (a & c >> 4 ^ b & d >> 4);
    D = d ^ (b & c >> 4 ^ (a ^ b) & d >> 4);
    c = C ^ (A & C >> 8 ^ B & D >> 8);
    d = D ^ (B & C >> 8 ^ (A ^ B) & D >> 8);
    c ^= c >> 1;
    d ^= d >> 1;
    a = x ^ y;
    b = d | 65535 ^ (a | c);
    a = (a | a << 8) & 16711935;
    a = (a | a << 4) & 252645135;
    a = (a | a << 2) & 858993459;
    a = (a | a << 1) & 1431655765;
    b = (b | b << 8) & 16711935;
    b = (b | b << 4) & 252645135;
    b = (b | b << 2) & 858993459;
    b = (b | b << 1) & 1431655765;
    return ((b << 1 | a) >>> 0) - 2147483648;
  }

  // src/city-site-entry.js
  var import_polygon_clipping = __toESM(require_polygon_clipping_umd(), 1);
  (() => {
    "use strict";
    const M = Math;
    const clamp = (value, low, high) => M.max(low, M.min(high, value));
    const round = (value) => M.round(value * 1e7) / 1e7;
    function polygonBounds(points, tolerance = 0) {
      const columns = points.map((p) => p.column), rows = points.map((p) => p.row), west = M.min(...columns), east = M.max(...columns), north = M.min(...rows), south = M.max(...rows), xMargin = (east - west) * tolerance + 1e-12, yMargin = (south - north) * tolerance + 1e-12;
      return { west: west - xMargin, east: east + xMargin, north: north - yMargin, south: south + yMargin };
    }
    function boundsCandidates(boxes) {
      if (!boxes.length) return () => [];
      const index = new Flatbush(boxes.length);
      for (const box of boxes) index.add(box.west, box.north, box.east, box.south);
      index.finish();
      return (box) => index.search(box.west, box.north, box.east, box.south).sort((a, b) => a - b);
    }
    function dryGroundPath(paths) {
      if (!paths.length) return "";
      let merged = [];
      for (let start = 0; start < paths.length; start += 512) {
        const batch = paths.slice(start, start + 512).map((points) => {
          const ring = [...points, [...points[0]]];
          return [ring];
        });
        merged.push(import_polygon_clipping.default.union(...batch));
      }
      while (merged.length > 1) {
        const next = [];
        for (let i = 0; i < merged.length; i += 2) next.push(i + 1 < merged.length ? import_polygon_clipping.default.union(merged[i], merged[i + 1]) : merged[i]);
        merged = next;
      }
      return merged[0].map((polygon) => polygon.map((ring) => "M" + ring.slice(0, -1).map((p) => p.join(" ")).join("L") + "Z").join("")).join("");
    }
    const random = (seed, salt) => {
      let value = (seed ^ M.imul(salt + 1, 2654435769)) >>> 0;
      value = M.imul(value ^ value >>> 16, 569420461);
      value = M.imul(value ^ value >>> 15, 1935289751);
      return ((value ^ value >>> 15) >>> 0) / 4294967296;
    };
    function sample(values, rows, columns, bounds, row, column) {
      const x = clamp((column - bounds.west) / (bounds.east - bounds.west) * (columns - 1), 0, columns - 1);
      const y = clamp((row - bounds.north) / (bounds.south - bounds.north) * (rows - 1), 0, rows - 1);
      const x0 = M.floor(x), y0 = M.floor(y), x1 = M.min(columns - 1, x0 + 1), y1 = M.min(rows - 1, y0 + 1);
      const fx = x - x0, fy = y - y0;
      return (values[y0 * columns + x0] * (1 - fx) + values[y0 * columns + x1] * fx) * (1 - fy) + (values[y1 * columns + x0] * (1 - fx) + values[y1 * columns + x1] * fx) * fy;
    }
    function nearest(values, rows, columns, bounds, point) {
      const x = clamp(M.round((point.column - bounds.west) / (bounds.east - bounds.west) * (columns - 1)), 0, columns - 1);
      const y = clamp(M.round((point.row - bounds.north) / (bounds.south - bounds.north) * (rows - 1)), 0, rows - 1);
      return values[y * columns + x];
    }
    const lineCache = /* @__PURE__ */ new WeakMap();
    function distanceToLine(point, points, metric) {
      let cached = lineCache.get(points);
      if (!cached || cached.rowMetric !== metric.row || cached.columnMetric !== metric.column) {
        const lines2 = points.slice(1).map((b, i) => {
          const a = points[i], dx = (b.column - a.column) * metric.column, dy = (b.row - a.row) * metric.row;
          return { a, b, dx, dy, length: dx * dx + dy * dy || 1, minDx: M.min(0, dx), maxDx: M.max(0, dx), minDy: M.min(0, dy), maxDy: M.max(0, dy) };
        });
        const origin2 = points[0];
        let index2 = null;
        if (lines2.length >= 64) {
          index2 = new Flatbush(lines2.length);
          for (const { a, b } of lines2) {
            const x0 = (a.column - origin2.column) * metric.column, x1 = (b.column - origin2.column) * metric.column, y0 = (a.row - origin2.row) * metric.row, y1 = (b.row - origin2.row) * metric.row;
            index2.add(M.min(x0, x1), M.min(y0, y1), M.max(x0, x1), M.max(y0, y1));
          }
          index2.finish();
        }
        cached = { lines: lines2, index: index2, origin: origin2, last: 0, rowMetric: metric.row, columnMetric: metric.column };
        lineCache.set(points, cached);
      }
      const { lines, index, origin } = cached;
      if (!lines.length) return { distance: Infinity, elevation: 0, widthMetres: 0 };
      const first = lines[cached.last], firstX = (point.column - first.a.column) * metric.column, firstY = (point.row - first.a.row) * metric.row, firstT = clamp((firstX * first.dx + firstY * first.dy) / first.length, 0, 1), firstDx = firstX - first.dx * firstT, firstDy = firstY - first.dy * firstT;
      let best = firstDx * firstDx + firstDy * firstDy, height = 0, widthMetres = 0, bestIndex = cached.last, bestT = firstT, candidates = null;
      if (index) {
        const x = (point.column - origin.column) * metric.column, y = (point.row - origin.row) * metric.row, radius = M.hypot(firstDx, firstDy) + 1e-9;
        candidates = index.search(x - radius, y - radius, x + radius, y + radius);
      }
      for (let i = 0; i < (candidates ? candidates.length : lines.length); i++) {
        const sourceIndex = candidates ? candidates[i] : i, { a, b, dx, dy, length, minDx, maxDx, minDy, maxDy } = lines[sourceIndex];
        const px = (point.column - a.column) * metric.column, py = (point.row - a.row) * metric.row;
        const bx = px < minDx ? minDx - px : px > maxDx ? px - maxDx : 0, by = py < minDy ? minDy - py : py > maxDy ? py - maxDy : 0;
        const bound = bx * bx + by * by;
        if (bound > best || bound === best && sourceIndex > bestIndex) continue;
        const t = clamp((px * dx + py * dy) / length, 0, 1), x = px - dx * t, y = py - dy * t, d = x * x + y * y;
        if (d < best || d === best && sourceIndex < bestIndex) {
          best = d;
          bestIndex = sourceIndex;
          bestT = t;
        }
      }
      if (Number.isFinite(bestIndex)) {
        const { a, b } = lines[bestIndex], t = bestT;
        height = (a.elevationMetres || 0) * (1 - t) + (b.elevationMetres || 0) * t;
        widthMetres = (a.widthMetres || 0) * (1 - t) + (b.widthMetres || 0) * t;
        cached.last = bestIndex;
      }
      return { distance: M.sqrt(best), elevation: height, widthMetres };
    }
    function elevationAt(surface, point, values = surface.elevationMetres) {
      if (surface.lakeTerrain && (values === surface.elevationMetres || values === surface.lakeDepths)) {
        let depth = -1e3;
        for (const field of surface.lakeTerrain) {
          const b2 = field.bounds;
          if (point.column < b2.west || point.column > b2.east || point.row < b2.north || point.row > b2.south) continue;
          if (values === surface.elevationMetres) return elevationAt(field, point);
          depth = M.max(depth, elevationAt(field, point, field.lakeDepths));
        }
        if (values === surface.lakeDepths) return depth;
      }
      const b = surface.bounds, n = surface.columns, m = surface.rows, x = clamp((point.column - b.west) / (b.east - b.west) * (n - 1), 0, n - 1), y = clamp((point.row - b.north) / (b.south - b.north) * (m - 1), 0, m - 1), i = M.min(n - 2, M.floor(x)), j = M.min(m - 2, M.floor(y)), u = x - i, v = y - j, k = j * n + i, z = values;
      return u >= v ? z[k] * (1 - u) + z[k + 1] * (u - v) + z[k + n + 1] * v : z[k] * (1 - v) + z[k + n] * (v - u) + z[k + n + 1] * u;
    }
    function isDry(surface, point) {
      return elevationAt(surface, point) > 0 && (!surface.lakeDepths || elevationAt(surface, point, surface.lakeDepths) < 0);
    }
    function* surfaceTriangles(surface, box = surface.bounds) {
      const b = surface.bounds, n = surface.columns, m = surface.rows, dx = (b.east - b.west) / (n - 1), dy = (b.south - b.north) / (m - 1), x0 = clamp(M.floor((box.west - b.west) / dx), 0, n - 2), x1 = clamp(M.floor((box.east - b.west) / dx), 0, n - 2), y0 = clamp(M.floor((box.north - b.north) / dy), 0, m - 2), y1 = clamp(M.floor((box.south - b.north) / dy), 0, m - 2);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const field = surface.lakeTerrain?.find((f) => x >= f.nativeBounds.west && x < f.nativeBounds.east && y >= f.nativeBounds.north && y < f.nativeBounds.south), grid = field || surface, s = field ? field.subdivisions : 1, firstX = field ? (x - field.nativeBounds.west) * s : x, firstY = field ? (y - field.nativeBounds.north) * s : y, gx = (grid.bounds.east - grid.bounds.west) / (grid.columns - 1), gy = (grid.bounds.south - grid.bounds.north) / (grid.rows - 1), at = (i) => {
          const point = { column: grid.bounds.west + i % grid.columns * gx, row: grid.bounds.north + M.floor(i / grid.columns) * gy };
          return { ...point, height: grid.elevationMetres[i], depth: field ? elevationAt(surface, point, surface.lakeDepths) : surface.lakeDepths?.[i] ?? -1e3 };
        };
        const startX = M.max(firstX, M.floor((box.west - grid.bounds.west) / gx)), endX = M.min(firstX + s - 1, M.floor((box.east - grid.bounds.west) / gx)), startY = M.max(firstY, M.floor((box.north - grid.bounds.north) / gy)), endY = M.min(firstY + s - 1, M.floor((box.south - grid.bounds.north) / gy));
        for (let row = startY; row <= endY; row++) for (let column = startX; column <= endX; column++) {
          const i = row * grid.columns + column;
          yield [i, i + 1, i + grid.columns + 1].map(at);
          yield [i, i + grid.columns + 1, i + grid.columns].map(at);
        }
      }
    }
    function generate(recipe, context, { seed } = {}) {
      if (!context || context.schema !== "city-site-context-v1" || !Number.isSafeInteger(seed)) {
        throw new TypeError("City terrain needs its saved metre context and a generation seed");
      }
      const count = context.rows * context.columns;
      if (!Array.isArray(context.elevationMetres) || context.elevationMetres.length !== count || !context.elevationMetres.every(Number.isFinite) || !Array.isArray(context.water) || context.water.length !== count) {
        throw new TypeError("Invalid saved city terrain samples");
      }
      seed >>>= 0;
      const character = window.WorldAtlasCityCharacter.profile(recipe);
      if (character.settlementRadiusKm) {
        const ratio = character.settlementRadiusKm / recipe.urban.radiusKm;
        recipe = { ...recipe, urban: {
          ...recipe.urban,
          radiusKm: character.settlementRadiusKm,
          radiusRows: recipe.urban.radiusRows * ratio,
          radiusColumns: recipe.urban.radiusColumns * ratio,
          coreZones: (recipe.urban.coreZones || []).map((zone) => ({
            ...zone,
            row: recipe.location.row + (zone.row - recipe.location.row) * ratio,
            column: recipe.location.column + (zone.column - recipe.location.column) * ratio,
            radiusKm: zone.radiusKm * ratio
          })),
          streetWidthsMetres: {
            arterial: M.min(4.5, recipe.urban.streetWidthsMetres?.arterial || 4.5),
            collector: M.min(3, recipe.urban.streetWidthsMetres?.collector || 3),
            local: M.min(1.8, recipe.urban.streetWidthsMetres?.local || 1.8)
          }
        } };
      }
      recipe = { ...recipe, seed };
      const SIZE = recipe.harbor || context.source.kind === "river" && context.source.referenceWidthMetres >= 18 || context.radiusKm / M.max(0.15, recipe.urban.radiusKm) > 10 ? 129 : 65;
      const bounds = { ...context.bounds }, metric = context.gridCellKilometres;
      const center = recipe.location, radiusKm = context.radiusKm, cityRadius = recipe.urban.radiusKm;
      const form = landform(recipe, context);
      const widthKm = (bounds.east - bounds.west) * metric.column;
      const heightKm = (bounds.south - bounds.north) * metric.row;
      const stepKm = M.max(widthKm, heightKm) / (SIZE - 1);
      const elevation = [], parent = [], land = [], coordinates = [];
      const phase = random(seed, 17) * M.PI * 2;
      const parentRange = M.max(...context.elevationMetres) - M.min(...context.elevationMetres);
      const amplitude = clamp(8 + parentRange * 0.12, 8, 90);
      for (let row = 0; row < SIZE; row++) for (let column = 0; column < SIZE; column++) {
        const u = column / (SIZE - 1), v = row / (SIZE - 1);
        const point = { row: bounds.north + v * (bounds.south - bounds.north), column: bounds.west + u * (bounds.east - bounds.west) };
        const original = sample(context.elevationMetres, context.rows, context.columns, bounds, point.row, point.column);
        const dry = original > 0;
        const envelope = M.sin(M.PI * u) ** 2 * M.sin(M.PI * v) ** 2;
        let detail = amplitude * envelope * (M.sin(u * 7.2 + phase) * M.cos(v * 5.4 - phase) * 0.65 + M.sin(u * 13.1 + v * 9.5 + phase * 2) * 0.22 + M.sin(u * 26.3 - phase) * M.cos(v * 22.7 + phase) * 0.09 + M.sin(u * 42.4 + v * 33.5 - phase) * 0.04);
        const x = (point.column - center.column) * metric.column, y = (point.row - center.row) * metric.row, across = -M.sin(form.axisRadians) * x + M.cos(form.axisRadians) * y;
        if (form.kind === "valley") detail += envelope * M.min(90, parentRange * 0.22) * (1 - M.exp(-((across / M.max(0.25, cityRadius * 0.38)) ** 2)));
        if (form.kind === "ridge") detail += envelope * M.min(60, parentRange * 0.12) * M.exp(-((across / M.max(0.3, cityRadius * 0.42)) ** 2));
        elevation.push(dry ? M.max(0.01, original + detail * M.min(1, original / 35)) : original);
        parent.push(original);
        land.push(dry);
        coordinates.push(point);
      }
      const coastal = coastalDetail(recipe, context, elevation, coordinates, metric, seed, stepKm);
      for (let i = 0; i < land.length; i++) land[i] = elevation[i] > 0;
      const source = context.source;
      const groundwater = source.kind === "groundwater";
      const riverMode = !groundwater && recipe.siteType === "river-city" && recipe.population?.estimate >= 3e3 && ["plain", "hills", "valley"].includes(form.kind) && random(seed, 403) > 0.32 ? "through" : "edge";
      const channels = [], confluences = [];
      let lakes = [], lakeTerrain = [], waterMask = new Array(SIZE * SIZE).fill(0), lakeDepths = new Array(SIZE * SIZE).fill(-1e3);
      if (!groundwater) {
        let dx = (source.location.column - center.column) * metric.column;
        let dy = (source.location.row - center.row) * metric.row;
        if (M.hypot(dx, dy) < 1e-3) {
          dx = sample(elevation, SIZE, SIZE, bounds, center.row, bounds.west) - sample(elevation, SIZE, SIZE, bounds, center.row, bounds.east);
          dy = sample(elevation, SIZE, SIZE, bounds, bounds.north, center.column) - sample(elevation, SIZE, SIZE, bounds, bounds.south, center.column);
        }
        const length = M.hypot(dx, dy) || 1;
        if (M.hypot(dx, dy) < 1e-3) {
          dx = M.cos(phase);
          dy = M.sin(phase);
        } else {
          dx /= length;
          dy /= length;
        }
        if (form.kind === "valley") {
          dx = M.cos(form.axisRadians);
          dy = M.sin(form.axisRadians);
        }
        const extent = M.hypot(widthKm, heightKm);
        const roadSide = (recipe.transport.corridors || []).filter((route) => route.kind === "road").reduce((sum, route) => sum + route.points.reduce((total, p) => total + (p.column - center.column) * metric.column * dy - (p.row - center.row) * metric.row * dx, 0), 0);
        const bank = roadSide > 0 ? -1 : 1;
        const terrain = { rows: SIZE, columns: SIZE, bounds, elevationMetres: elevation };
        const points = riverCourse(terrain, metric, center, {
          dx,
          dy,
          extent,
          stepKm,
          cityRadius,
          form,
          riverMode,
          bank,
          harbor: recipe.harbor,
          referenceWidthMetres: source.referenceWidthMetres || 0.5 * M.sqrt(radiusKm * radiusKm * 0.6),
          phase
        });
        const runs = landRuns(points, terrain, metric, stepKm);
        for (let run of runs) {
          if (elevationAt(terrain, run[0]) < 0.05 && elevationAt(terrain, run.at(-1)) < 0.05) {
            const summit = run.reduce((best, p, i) => p.elevationMetres > run[best].elevationMetres ? i : best, 0);
            const left = run.slice(0, summit + 1).reverse(), right = run.slice(summit);
            run = distanceToLine(center, left, metric).distance < distanceToLine(center, right, metric).distance ? left : right;
          } else if (run[0].elevationMetres < run.at(-1).elevationMetres) run.reverse();
          if (run.length < 2) continue;
          let previous = Infinity;
          const reference = M.max(2, source.referenceWidthMetres || 0.5 * M.sqrt(radiusKm * radiusKm * 0.6));
          for (let i = 0; i < run.length; i++) {
            const p = run[i], t = i / (run.length - 1), z = elevationAt(terrain, p), ahead = run[M.min(run.length - 1, i + 1)], behind = run[M.max(0, i - 1)], reach = M.hypot((ahead.column - behind.column) * metric.column, (ahead.row - behind.row) * metric.row), grade = M.abs(ahead.elevationMetres - behind.elevationMetres) / M.max(1, reach * 1e3), confinement = clamp(1 - grade * 2.5, 0.55, 1.12), mouth = run.at(-1).elevationMetres < 0.05 ? 1 + M.exp(-(((1 - t) / 0.1) ** 2)) * 0.6 : 1;
            p.widthMetres = reference * (0.8 + 0.24 * t) * confinement * mouth * (1 + 0.1 * M.sin(t * 12 + phase) + 0.035 * M.sin(t * 29 - phase));
            p.elevationMetres = z <= 0 ? 0 : M.max(0.02, M.min(z - M.min(4, z * 0.12), previous));
            previous = p.elevationMetres;
          }
          channels.push({
            points: run,
            widthMetres: M.max(...run.map((p) => p.widthMetres)),
            kind: source.kind === "river" ? "river" : "stream",
            widthModel: "catchment-reference-with-local-confinement",
            mouth: run.at(-1).elevationMetres === 0
          });
        }
        if (source.kind === "river" && recipe.population?.estimate >= 3e3 && random(seed, 2318) > 0.42) {
          const junction = tributary(channels, elevation, SIZE, bounds, metric, center, cityRadius, seed);
          if (junction) confluences.push(junction);
        }
        const reservoirs = basinLakes(elevation, SIZE, bounds, metric, channels, center, cityRadius), reservoirSurface = { rows: SIZE, columns: SIZE, bounds, elevationMetres: elevation, lakeDepths: reservoirs.lakeDepths, lakeTerrain: reservoirs.lakeTerrain };
        for (const channel of channels) {
          for (const lake of reservoirs.lakes) for (const p of channel.points) if (elevationAt(reservoirSurface, p, reservoirs.lakeDepths) > 0 && M.hypot((p.column - lake.anchor.column) * metric.column, (p.row - lake.anchor.row) * metric.row) < M.sqrt(lake.areaKm2) * 2)
            p.elevationMetres = M.max(p.elevationMetres, lake.spillElevationMetres);
          for (let i = channel.points.length - 2; i >= 0; i--) channel.points[i].elevationMetres = M.max(channel.points[i].elevationMetres, channel.points[i + 1].elevationMetres);
        }
        const drainage = channels.flatMap((ch) => ch.points);
        const valleyWidthKm = M.max(0.09, cityRadius * 0.18);
        for (let index = 0; index < elevation.length; index++) {
          if (!land[index] || waterMask[index] || !drainage.length) continue;
          const point = coordinates[index], near = channels.map((ch) => distanceToLine(point, ch.points, metric)).reduce((a, b) => a.distance < b.distance ? a : b);
          const u = (point.column - bounds.west) / (bounds.east - bounds.west), v = (point.row - bounds.north) / (bounds.south - bounds.north);
          const envelope = M.sin(M.PI * u) ** 2 * M.sin(M.PI * v) ** 2;
          const valley = M.exp(-((near.distance / valleyWidthKm) ** 2)) * M.min(1, envelope * 4);
          elevation[index] = M.max(0.01, elevation[index] - M.max(0, elevation[index] - near.elevation) * valley);
        }
        terrain.elevationMetres = elevation.map((z) => M.round(z * 100) / 100);
        const clipped = channels.flatMap((ch, sourceIndex) => landRuns(ch.points, terrain, metric, stepKm).map((run) => ({ sourceIndex, channel: { ...ch, points: run, mouth: run.at(-1).elevationMetres === 0 } }))), bindings = [];
        for (const junction of confluences) {
          const tributaryChannel = clipped.findIndex((part) => part.sourceIndex === junction.tributaryChannel && M.hypot(
            (part.channel.points.at(-1).column - junction.anchor.column) * metric.column,
            (part.channel.points.at(-1).row - junction.anchor.row) * metric.row
          ) < 1e-6);
          if (tributaryChannel < 0) continue;
          const anchor = clipped[tributaryChannel].channel.points.at(-1), mainChannel = clipped.findIndex((part) => part.sourceIndex === junction.mainChannel && distanceToLine(anchor, part.channel.points, metric).distance < 1e-6);
          if (mainChannel >= 0) bindings.push({ anchor: { ...anchor }, mainChannel, tributaryChannel });
        }
        channels.splice(0, channels.length, ...clipped.map((part) => part.channel));
        confluences.splice(0, confluences.length, ...bindings);
        ({ lakes, waterMask, lakeDepths, lakeTerrain } = basinLakes(terrain.elevationMetres, SIZE, bounds, metric, channels, center, cityRadius));
      }
      const buildable = [], slopes = [], roadBuildable = [];
      for (let row = 0; row < SIZE; row++) for (let column = 0; column < SIZE; column++) {
        const index = row * SIZE + column;
        const gradientX = (elevation[row * SIZE + M.min(SIZE - 1, column + 1)] - elevation[row * SIZE + M.max(0, column - 1)]) / (widthKm / (SIZE - 1) * 2e3);
        const gradientY = (elevation[M.min(SIZE - 1, row + 1) * SIZE + column] - elevation[M.max(0, row - 1) * SIZE + column]) / (heightKm / (SIZE - 1) * 2e3);
        const slope = M.hypot(gradientX, gradientY);
        const floodplain = channels.some((channel) => {
          const near = distanceToLine(coordinates[index], channel.points, metric);
          return near.distance < M.max(near.widthMetres / 1e3 * 1.5, stepKm * 0.72);
        });
        land[index] = land[index] && !waterMask[index];
        slopes.push(slope);
        buildable.push(Number(land[index] && slope < 0.2 && !floodplain));
        roadBuildable.push(Number(land[index] && slope < 0.65));
      }
      const surface = { rows: SIZE, columns: SIZE, bounds, elevationMetres: elevation.map((value) => M.round(value * 100) / 100), slopes, buildable, roadBuildable, waterMask, lakeDepths, lakeTerrain };
      if (channels.length && ["hillside", "valley", "ridge"].includes(form.kind)) {
        const ch = channels.reduce((a2, b) => a2.points.length > b.points.length ? a2 : b), a = ch.points[0], z = ch.points.at(-1);
        form.kind = "valley";
        form.axisRadians = M.atan2((z.row - a.row) * metric.row, (z.column - a.column) * metric.column);
        form.crossScale = 0.27;
        form.alongScale = 1.75;
        form.label = "\u6CBF\u6CB3\u8C37\u4E0E\u6CB3\u5CB8\u53F0\u5730";
      } else if (channels.length && !recipe.harbor && !["fortress", "pass", "oasis"].includes(recipe.siteType)) {
        const ch = channels.reduce((a2, b) => a2.points.length > b.points.length ? a2 : b), a = ch.points[0], z = ch.points.at(-1);
        form.kind = "riverbank";
        form.axisRadians = M.atan2((z.row - a.row) * metric.row, (z.column - a.column) * metric.column);
        form.crossScale = 0.62;
        form.alongScale = 1.6;
        form.label = "\u6CB3\u5CB8\u7F13\u5761\u53F0\u5730";
      }
      if (recipe.harbor) {
        const saved = recipe.harbor, n = saved.outward, at = (d) => ({ column: saved.shore.column + n.x * d / metric.column, row: saved.shore.row + n.y * d / metric.row }), z = (d) => elevationAt(surface, at(d));
        let low = -M.max(0.6, stepKm * 2, saved.distanceKm * 0.8), high = M.max(0.6, stepKm * 2);
        if (z(low) > 0 && z(high) <= 0) {
          for (let k = 0; k < 24; k++) {
            const mid = (low + high) / 2;
            if (z(mid) > 0) low = mid;
            else high = mid;
          }
          const shift = (low + high) / 2, shore = at(shift), landPoint = at(shift - 0.07), seaPoint = at(shift + 0.12), harbor = {
            ...saved,
            shore,
            landPoint,
            seaPoint,
            setting: coastal.setting,
            access: [center, landPoint]
          };
          if (saved.sailing?.length) {
            const a = seaPoint, z2 = saved.sailing[0], wet = Array.from({ length: 33 }, (_, i) => interpolate(a, z2, i / 32)).every((p) => elevationAt(surface, p) <= 0);
            harbor.sailing = wet ? [seaPoint, ...saved.sailing] : [];
          }
          recipe = { ...recipe, harbor, transport: { ...recipe.transport, corridors: recipe.transport.corridors.map((route) => route.id === recipe.id + "-harbor-access" ? { ...route, points: harbor.access } : route) } };
        }
      }
      if (!recipe.harbor && source.kind === "river" && recipe.population?.estimate >= 3e3) {
        const harbor = inlandHarbor(recipe, surface, channels, confluences, metric, context.nameRoots, seed);
        if (harbor) recipe = { ...recipe, harbor, transport: { ...recipe.transport, corridors: [
          ...recipe.transport.corridors,
          { id: recipe.id + "-harbor-access", kind: "road", points: harbor.access }
        ] } };
      }
      if (recipe.harbor) {
        const h = recipe.harbor, n = h.outward, t = { x: -n.y, y: n.x }, factor = clamp(M.sqrt(recipe.population.estimate / 22e3), 0.34, 1.8), capacity = M.max(1, M.min(7, M.round(M.sqrt(recipe.population.estimate / 1600)))), span = recipe.population.estimate < 1800 ? 0.1 : 0.22 + capacity * 0.016, at = (x, y) => ({ column: h.shore.column + (t.x * x + n.x * y) * factor / metric.column, row: h.shore.row + (t.y * x + n.y * y) * factor / metric.row });
        const half = span + 0.05;
        recipe = { ...recipe, harbor: {
          ...h,
          berthLayout: { scale: factor, capacity, span },
          reservedLand: [[-half, -0.14], [-half, 0.012], [half, 0.012], [half, -0.14]].map(([x, y]) => at(x, y))
        } };
      }
      const relief = contourPaths(coordinates, elevation, land, metric, surface);
      const waterSource = groundwater ? { kind: "groundwater", label: recipe.siteType === "oasis" ? "\u7EFF\u6D32\u4E95\u6CC9" : "\u5C71\u6CC9\u4E0E\u4E95\u6C34", location: { ...center } } : {
        kind: source.kind === "lake" ? "lake" : source.kind === "river" ? "tributary" : "spring-fed-stream",
        label: source.kind === "lake" ? "\u6E56\u6CCA\u4E0E\u6EAA\u6D41\u4F9B\u6C34" : source.kind === "river" ? "\u6CB3\u8C37\u652F\u6D41\u4F9B\u6C34" : "\u5C71\u6CC9\u6EAA\u6D41\u4F9B\u6C34",
        location: channels.length ? channels[0].points[M.floor(channels[0].points.length / 2)] : { ...center }
      };
      if (riverMode === "through" && channels.length) {
        const line = channels[0].points, a = line[0], b = line.at(-1), dx = (b.column - a.column) * metric.column, dy = (b.row - a.row) * metric.row, len = M.hypot(dx, dy), across = { x: -dy / len, y: dx / len };
        const points = [-1, 1].map((sign) => ({
          column: center.column + across.x * cityRadius * 1.4 * sign / metric.column,
          row: center.row + across.y * cityRadius * 1.4 * sign / metric.row
        }));
        recipe = { ...recipe, transport: { ...recipe.transport, corridors: [...recipe.transport.corridors, { id: "urban-river-spine", kind: "road", points }] } };
      }
      const bridges = crossings(recipe, surface, context, channels);
      const streetPlan = window.WorldAtlasCities.streetNetwork({
        ...recipe,
        localSite: { form, riverMode, surface, channels, bridges }
      });
      const network = ruralNetwork(recipe, surface, slopes, channels, metric, seed, bridges, streetPlan), ruralRoads = network.ruralRoads;
      const approaches = [...network.corridors, ...ruralRoads].filter((route) => route.kind === "road");
      const usedGates = new Set(streetPlan.gates.filter((gate) => gate.layer === "inner" || approaches.some((route) => distanceToLine(gate.center, route.points, metric).distance <= gate.widthKm)).map((gate) => gate.id));
      streetPlan.gates = streetPlan.gates.filter((gate) => usedGates.has(gate.id));
      streetPlan.gateStreets = streetPlan.gateStreets.filter((street) => usedGates.has(street.id));
      recipe = { ...recipe, transport: { ...recipe.transport, corridors: network.corridors } };
      if (recipe.harbor) {
        const route = network.corridors.find((r) => (r.sourceId || r.id) === recipe.id + "-harbor-access");
        recipe = { ...recipe, harbor: { ...recipe.harbor, access: route?.points || [] } };
      }
      const roadRecipe = { ...recipe, localSite: { form }, transport: { ...recipe.transport, corridors: [...network.corridors, ...ruralRoads] } };
      const farmland = fields(roadRecipe, surface, slopes, metric, channels, seed);
      const localSite = {
        schema: "city-local-site-v1",
        bounds,
        radiusKm,
        form,
        riverMode,
        ...relief,
        coastal,
        channels,
        lakes,
        confluences,
        waterSource,
        surface,
        gateStreets: streetPlan.gateStreets,
        gates: streetPlan.gates,
        enclosures: streetPlan.enclosures,
        wallSpans: streetPlan.wallSpans,
        innerEnclosures: streetPlan.innerEnclosures,
        innerWallSpans: streetPlan.innerWallSpans,
        reservedCompounds: streetPlan.reservedCompounds,
        nameRoots: context.nameRoots,
        latitudeDegrees: context.latitudeDegrees,
        farmland,
        ruralRoads,
        bridges,
        ...landscape(roadRecipe, surface, slopes, coordinates, land, seed, farmland, channels),
        model: { kind: "generated-local-refinement", parent: "saved-world-metre-terrain", boundaryBlended: true, coastlinePreserved: !coastal.refined }
      };
      localSite.annotations = geographicNames(recipe, context, localSite, metric);
      return { ...recipe, seed, localSite };
    }
    function interpolate(a, b, t) {
      return {
        row: a.row + (b.row - a.row) * t,
        column: a.column + (b.column - a.column) * t,
        elevationMetres: (a.elevationMetres || 0) + (b.elevationMetres - a.elevationMetres || 0) * t,
        widthMetres: (a.widthMetres || 0) + ((b.widthMetres || 0) - (a.widthMetres || 0)) * t
      };
    }
    function inlandHarbor(recipe, surface, channels, confluences, metric, roots, seed) {
      const distance = (a, b) => M.hypot((a.column - b.column) * metric.column, (a.row - b.row) * metric.row), target = confluences[0]?.anchor || recipe.location;
      const candidates = channels.flatMap((channel) => channel.points.slice(1, -1).map((p, i) => ({ p, i: i + 1, channel }))).filter((c) => c.p.widthMetres >= 25).sort((a, b) => distance(a.p, target) - distance(b.p, target));
      for (const { p, i, channel } of candidates.slice(0, 24)) {
        if (distance(p, recipe.location) > recipe.urban.radiusKm * 1.7) continue;
        const a = channel.points[i - 1], z = channel.points[i + 1], dx = (z.column - a.column) * metric.column, dy = (z.row - a.row) * metric.row, len = M.hypot(dx, dy), half = p.widthMetres / 2e3;
        if (!len) continue;
        for (const sign of [-1, 1]) {
          const outward = { x: dy / len * sign, y: -dx / len * sign }, at = (d) => ({ column: p.column - outward.x * d / metric.column, row: p.row - outward.y * d / metric.row }), shore = at(half), landPoint = at(half + 0.035), seaPoint = at(half * 0.25);
          if (!isDry(surface, landPoint) || channels.some((ch) => {
            const q = distanceToLine(landPoint, ch.points, metric);
            return q.distance < q.widthMetres / 2e3 + 0.015;
          })) continue;
          return {
            kind: "river",
            name: roots[M.floor(random(seed, 9021) * roots.length)] + "\u57E0",
            shore,
            landPoint,
            seaPoint,
            outward,
            setting: confluences.length ? "confluence" : "riverbank",
            shelter: 0.8,
            channelWidthMetres: p.widthMetres,
            distanceKm: distance(shore, recipe.location),
            access: [recipe.location, landPoint],
            sailing: []
          };
        }
      }
      return null;
    }
    function priorityQueue() {
      const heap = [];
      return { get length() {
        return heap.length;
      }, put(index, cost) {
        let i = heap.length;
        heap.push([index, cost]);
        while (i) {
          const p = i - 1 >> 1;
          if (heap[p][1] <= cost) break;
          heap[i] = heap[p];
          i = p;
        }
        heap[i] = [index, cost];
      }, take() {
        const first = heap[0], last = heap.pop();
        if (heap.length) {
          let i = 0;
          while (i * 2 + 1 < heap.length) {
            let j = i * 2 + 1;
            if (j + 1 < heap.length && heap[j + 1][1] < heap[j][1]) j++;
            if (heap[j][1] >= last[1]) break;
            heap[i] = heap[j];
            i = j;
          }
          heap[i] = last;
        }
        return first;
      } };
    }
    function basinLakes(elevation, n, bounds, metric, channels, center, radius) {
      const fill = new Float64Array(n * n).fill(Infinity), queue = priorityQueue(), visited = new Uint8Array(n * n), waterMask = new Array(n * n).fill(0), lakeDepths = new Array(n * n).fill(-1e3), lakes = [];
      const dx = (bounds.east - bounds.west) * metric.column / (n - 1), dy = (bounds.south - bounds.north) * metric.row / (n - 1), at = (i) => ({ column: bounds.west + i % n / (n - 1) * (bounds.east - bounds.west), row: bounds.north + M.floor(i / n) / (n - 1) * (bounds.south - bounds.north) });
      for (let i = 0; i < n * n; i++) if (i % n === 0 || i % n === n - 1 || i < n || i >= n * (n - 1) || elevation[i] <= 0) {
        fill[i] = elevation[i];
        queue.put(i, fill[i]);
      }
      while (queue.length) {
        const [i, h] = queue.take();
        if (h !== fill[i]) continue;
        const x = i % n, y = M.floor(i / n);
        for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          if (x + sx < 0 || x + sx >= n || y + sy < 0 || y + sy >= n) continue;
          const j = i + sy * n + sx, next = M.max(h, elevation[j]);
          if (next < fill[j]) {
            fill[j] = next;
            queue.put(j, next);
          }
        }
      }
      const candidates = Array.from({ length: n * n }, (_, i) => i).filter((i) => fill[i] - elevation[i] > 2.5 && elevation[i] > 0).sort((a, b) => fill[b] - elevation[b] - (fill[a] - elevation[a]));
      for (const seed of candidates) {
        if (visited[seed] || lakes.length >= 3) continue;
        const level = fill[seed] - 0.05, component = [seed];
        visited[seed] = 1;
        for (let k = 0; k < component.length; k++) {
          const i = component[k], x = i % n, y = M.floor(i / n);
          for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (x + sx <= 0 || x + sx >= n - 1 || y + sy <= 0 || y + sy >= n - 1) continue;
            const j = i + sy * n + sx;
            if (!visited[j] && elevation[j] > 0 && elevation[j] < level) {
              visited[j] = 1;
              component.push(j);
            }
          }
        }
        const area = component.length * dx * dy, anchor = at(seed), distance = M.hypot((anchor.column - center.column) * metric.column, (anchor.row - center.row) * metric.row);
        if (area < 0.02 || area > 4 || distance < radius * 0.8 || distance > radius * 4.5 || !channels.some((ch) => distanceToLine(anchor, ch.points, metric).distance < M.max(dx, dy) * 2 + ch.widthMetres / 1e3)) continue;
        const cells = new Set(component);
        const spill = component.flatMap((i) => {
          const x = i % n, y = M.floor(i / n);
          return [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([sx, sy]) => x + sx >= 0 && x + sx < n && y + sy >= 0 && y + sy < n).map(([sx, sy]) => i + sy * n + sx);
        }).filter((i) => !cells.has(i)).sort((a, b) => elevation[a] - elevation[b])[0];
        lakes.push({
          anchor,
          waterLevelMetres: level,
          spillElevationMetres: fill[seed],
          outlet: at(spill),
          areaKm2: area,
          maximumDepthMetres: level - elevation[seed],
          kind: "basin-lake",
          component,
          seed
        });
      }
      let lakeTerrain = refineLakeTerrain(elevation, n, bounds, lakes);
      const acceptedWater = new Map(lakeTerrain.map((field) => [field, new Uint8Array(field.rows * field.columns)]));
      for (const lake of lakes) {
        const field = lakeTerrain.find((f) => lake.seed % n >= f.nativeBounds.west && lake.seed % n <= f.nativeBounds.east && M.floor(lake.seed / n) >= f.nativeBounds.north && M.floor(lake.seed / n) <= f.nativeBounds.south), { columns, rows } = field, s = field.subdivisions, first = (M.floor(lake.seed / n) - field.nativeBounds.north) * s * columns + (lake.seed % n - field.nativeBounds.west) * s, level = M.min(lake.waterLevelMetres, field.spillHeights[first] - 0.05), wet = new Uint8Array(rows * columns), component = [first];
        wet[first] = 1;
        if (acceptedWater.get(field)[first] || level <= field.elevationMetres[first] + 2.5) {
          delete lake.component;
          delete lake.seed;
          continue;
        }
        for (let k = 0; k < component.length; k++) {
          const i = component[k], x = i % columns, y = M.floor(i / columns);
          for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (x + sx < 0 || x + sx >= columns || y + sy < 0 || y + sy >= rows) continue;
            const j = i + sy * columns + sx, z = field.elevationMetres[j];
            if (!wet[j] && z > 0 && z < level) {
              wet[j] = 1;
              component.push(j);
            }
          }
        }
        const tiles = new Set(component.flatMap((i) => [i, i - 1, i - columns, i - columns - 1])), patches = [], depths = /* @__PURE__ */ new Map(), atFine = (i) => ({
          column: field.bounds.west + i % columns / (columns - 1) * (field.bounds.east - field.bounds.west),
          row: field.bounds.north + M.floor(i / columns) / (rows - 1) * (field.bounds.south - field.bounds.north)
        });
        let areaKm2 = 0, maximumDepthMetres = 0;
        for (const i of tiles) {
          if (i < 0 || i >= columns * (rows - 1) || i % columns === columns - 1) continue;
          for (const tri of [[i, i + 1, i + columns + 1], [i, i + columns + 1, i + columns]]) {
            const vertices = tri.map((j) => ({ ...atFine(j), value: wet[j] ? level - field.elevationMetres[j] : -M.max(1e-9, M.abs(field.elevationMetres[j] - level)) })), poly = [];
            for (let k = 0; k < 3; k++) {
              depths.set(tri[k], vertices[k].value);
              maximumDepthMetres = M.max(maximumDepthMetres, vertices[k].value);
              const a = vertices[k], b = vertices[(k + 1) % 3];
              if (a.value > 0) poly.push(a);
              if (a.value > 0 !== b.value > 0) poly.push(interpolate(a, b, a.value / (a.value - b.value)));
            }
            if (poly.length >= 3) {
              patches.push(poly);
              const p = poly[0];
              areaKm2 += M.abs(poly.reduce((sum, a, k) => {
                const b = poly[(k + 1) % poly.length];
                return sum + (a.column - p.column) * (b.row - p.row) - (b.column - p.column) * (a.row - p.row);
              }, 0)) * metric.column * metric.row / 2;
            }
          }
        }
        delete lake.component;
        delete lake.seed;
        if (areaKm2 < 0.02 || areaKm2 > 4) continue;
        for (const [i, depth] of depths) field.lakeDepths[i] = M.max(field.lakeDepths[i], depth);
        const covered = acceptedWater.get(field);
        for (const i of component) covered[i] = 1;
        lake.patches = patches;
        lake.areaKm2 = areaKm2;
        lake.maximumDepthMetres = maximumDepthMetres;
        lake.waterLevelMetres = level;
        lake.spillElevationMetres = level + 0.05;
      }
      lakeTerrain = lakeTerrain.filter((field) => field.lakeDepths.some((depth) => depth > 0));
      for (const field of lakeTerrain) {
        delete field.spillHeights;
        const b = field.nativeBounds, s = field.subdivisions;
        for (let y = b.north; y <= b.south; y++) for (let x = b.west; x <= b.east; x++) {
          const i = y * n + x, j = (y - b.north) * s * field.columns + (x - b.west) * s;
          lakeDepths[i] = M.max(lakeDepths[i], field.lakeDepths[j]);
          waterMask[i] = Number(lakeDepths[i] > 0);
        }
      }
      return { lakes: lakes.filter((lake) => lake.patches), waterMask, lakeDepths, lakeTerrain };
    }
    function refineLakeTerrain(elevation, n, bounds, lakes) {
      const regions = lakes.map((lake) => ({
        west: M.max(0, M.min(...lake.component.map((i) => i % n)) - 2),
        east: M.min(n - 1, M.max(...lake.component.map((i) => i % n)) + 2),
        north: M.max(0, M.min(...lake.component.map((i) => M.floor(i / n))) - 2),
        south: M.min(n - 1, M.max(...lake.component.map((i) => M.floor(i / n))) + 2)
      }));
      for (let i = 0; i < regions.length; i++) for (let j = i + 1; j < regions.length; j++) {
        const a = regions[i], b = regions[j];
        if (a.east < b.west || b.east < a.west || a.south < b.north || b.south < a.north) continue;
        regions[i] = { west: M.min(a.west, b.west), east: M.max(a.east, b.east), north: M.min(a.north, b.north), south: M.max(a.south, b.south) };
        regions.splice(j, 1);
        i = -1;
        break;
      }
      const native = { columns: n, rows: n, bounds, elevationMetres: elevation }, at = (x, y) => ({ column: bounds.west + x / (n - 1) * (bounds.east - bounds.west), row: bounds.north + y / (n - 1) * (bounds.south - bounds.north) }), node = (x, y) => elevation[clamp(y, 0, n - 1) * n + clamp(x, 0, n - 1)], cubic = (a, b, c, d, t) => {
        const slope = (u, v2) => u * v2 <= 0 ? 0 : 2 * u * v2 / (u + v2), v = c - b, m0 = slope(b - a, v), m1 = slope(v, d - c), t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * b + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * c + (t3 - t2) * m1;
      };
      return regions.map((region) => {
        const subdivisions = 8, columns = (region.east - region.west) * subdivisions + 1, rows = (region.south - region.north) * subdivisions + 1, lo = at(region.west, region.north), hi = at(region.east, region.south), field = {
          columns,
          rows,
          subdivisions,
          nativeBounds: region,
          bounds: { west: lo.column, east: hi.column, north: lo.row, south: hi.row },
          elevationMetres: [],
          lakeDepths: new Array(rows * columns).fill(-1e3)
        };
        for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
          const x = region.west + column / subdivisions, y = region.north + row / subdivisions, i = M.floor(x), j = M.floor(y), u = x - i, v = y - j, z = cubic(...[-1, 0, 1, 2].map((d) => cubic(node(i - 1, j + d), node(i, j + d), node(i + 1, j + d), node(i + 2, j + d), u)), v), nativeHeight = elevationAt(native, at(x, y)), blend = clamp(M.min(x - region.west, region.east - x, y - region.north, region.south - y), 0, 1);
          field.elevationMetres.push(nativeHeight + (z - nativeHeight) * blend);
        }
        const heights = new Float64Array(rows * columns).fill(Infinity), queue = priorityQueue();
        for (let i = 0; i < heights.length; i++) if (i % columns === 0 || i % columns === columns - 1 || i < columns || i >= columns * (rows - 1) || field.elevationMetres[i] <= 0) {
          heights[i] = field.elevationMetres[i];
          queue.put(i, heights[i]);
        }
        while (queue.length) {
          const [i, h] = queue.take();
          if (h !== heights[i]) continue;
          const x = i % columns, y = M.floor(i / columns);
          for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
            if (x + sx < 0 || x + sx >= columns || y + sy < 0 || y + sy >= rows) continue;
            const j = i + sy * columns + sx, cost = M.max(h, field.elevationMetres[j]);
            if (cost < heights[j]) {
              heights[j] = cost;
              queue.put(j, cost);
            }
          }
        }
        field.spillHeights = heights;
        return field;
      });
    }
    function riverCourse(surface, metric, center, { dx, dy, extent, stepKm, cityRadius, form, riverMode, bank, harbor, referenceWidthMetres, phase }) {
      const widthKm = M.max(2e-3, referenceWidthMetres / 1e3), wavelength = M.max(6.5 * (widthKm * 3280.84) ** 1.1 / 3280.84, stepKm * 8), edge = form.kind === "plain" ? harbor ? 1.42 : 0.8 : M.max(0.36, form.crossScale * 1.35), baseline = bank * cityRadius * (riverMode === "through" ? 0.26 : edge), available = cityRadius * form.crossScale * ({ plain: 0.8, hills: 0.7, valley: 0.6, ridge: 0.25, hillside: 0.2, "coastal-slope": 0.2 }[form.kind] || 0.2), maximum = M.min(widthKm * 2.2, available, cityRadius * (riverMode === "through" ? 0.38 : edge * 0.42)), count = M.max(128, M.ceil(extent * 2 / M.min(stepKm * 0.6, wavelength / 40))), points = [], at = (along, side) => ({ row: center.row + (dy * along + dx * side) / metric.row, column: center.column + (dx * along - dy * side) / metric.column }), height = (along, side) => elevationAt(surface, at(along, side)), probe = M.max(widthKm * 2, stepKm * 2);
      for (let index = 0; index <= count; index++) {
        const along = (index / count * 2 - 1) * extent, z = height(along, baseline), rise = M.max(0, height(along, baseline - probe) - z, height(along, baseline + probe) - z), grade = M.abs(height(along - probe, baseline) - height(along + probe, baseline)) / (probe * 2e3), freedom = 1 / (1 + rise / 25 + grade * 20), bend = maximum * freedom * (0.75 * M.sin(along / wavelength * M.PI * 2 + phase) + 0.25 * M.sin(along / (wavelength * 0.67) * M.PI * 2 - phase)), point = at(along, baseline + bend);
        point.elevationMetres = elevationAt(surface, point);
        points.push(point);
      }
      return points;
    }
    function refineTributary(points, surface, metric, main, join) {
      const distance = (a, b2) => M.hypot((a.column - b2.column) * metric.column, (a.row - b2.row) * metric.row), stepKm = M.max(
        (surface.bounds.east - surface.bounds.west) * metric.column,
        (surface.bounds.south - surface.bounds.north) * metric.row
      ) / (surface.columns - 1), corridor = points.map((p) => ({ ...p, elevationMetres: elevationAt(surface, p) })), terminal = M.max(0.25, join.widthMetres / 1e3 * 1.1), b = surface.bounds;
      let travelled = 0;
      const source = points.map((p, i) => {
        if (i) travelled += distance(points[i - 1], p);
        return { ...p, alongKm: travelled };
      }), safe = (p) => {
        if (p.column < b.west - 1e-10 || p.column > b.east + 1e-10 || p.row < b.north - 1e-10 || p.row > b.south + 1e-10) return false;
        const z = elevationAt(surface, p), near = distanceToLine(p, corridor, metric);
        if (z <= 0 || z < join.elevationMetres - 1e-8 || near.distance > stepKm * 0.85 || z > near.elevation + M.max(4, stepKm * 8)) return false;
        return distance(p, join) <= terminal || distanceToLine(p, main.points, metric).distance >= join.widthMetres / 2e3 + 0.05;
      }, safeSegment = (a, z) => {
        const count = M.max(1, M.ceil(distance(a, z) / (stepKm * 0.25)));
        for (let i = 1; i < count; i++) if (!safe(interpolate(a, z, i / count))) return false;
        return true;
      }, separation = (p, a, z) => {
        const dx = (z.column - a.column) * metric.column, dy = (z.row - a.row) * metric.row, px = (p.column - a.column) * metric.column, py = (p.row - a.row) * metric.row, t = clamp((px * dx + py * dy) / (dx * dx + dy * dy || 1), 0, 1);
        return M.hypot(px - dx * t, py - dy * t);
      }, knots = [source[0]];
      function simplify(first, last) {
        if (last - first === 1) {
          knots.push(source[last]);
          return;
        }
        let split = first + 1, deviation = -1;
        for (let i = first + 1; i < last; i++) {
          const d = separation(source[i], source[first], source[last]);
          if (d > deviation) {
            deviation = d;
            split = i;
          }
        }
        if (deviation <= stepKm * 0.6 && safeSegment(source[first], source[last])) knots.push(source[last]);
        else {
          if (deviation < 1e-9) split = M.floor((first + last) / 2);
          simplify(first, split);
          simplify(split, last);
        }
      }
      simplify(0, source.length - 1);
      const out = [knots[0]], lerp = (a, z, t) => ({ ...interpolate(a, z, t), alongKm: a.alongKm + (z.alongKm - a.alongKm) * t });
      for (let i = 1; i < knots.length - 1; i++) {
        const a = knots[i - 1], p = knots[i], z = knots[i + 1], before = distance(a, p), after = distance(p, z);
        let cut = M.min(before * 0.3, after * 0.3, M.max(stepKm * 2, p.widthMetres / 1e3 * 5)), arc = null;
        for (let attempt = 0; attempt < 5 && cut > stepKm * 0.025; attempt++, cut *= 0.5) {
          const entry = lerp(a, p, 1 - cut / before), exit = lerp(p, z, cut / after), samples = M.max(6, M.ceil(cut * 2 / (stepKm * 0.3))), candidate = [];
          for (let k = 0; k <= samples; k++) {
            const t = k / samples, q = 1 - t;
            candidate.push({
              ...lerp(entry, exit, t),
              column: q * q * entry.column + 2 * q * t * p.column + t * t * exit.column,
              row: q * q * entry.row + 2 * q * t * p.row + t * t * exit.row
            });
          }
          if (candidate.every(safe) && safeSegment(out.at(-1), entry) && candidate.slice(1).every((q, k) => safeSegment(candidate[k], q))) {
            arc = candidate;
            break;
          }
        }
        if (arc) out.push(...arc);
        else out.push(p);
      }
      out.push(source.at(-1));
      const refined = [out[0]];
      for (let i = 1; i < out.length; i++) {
        const a = out[i - 1], z = out[i], count = M.max(1, M.ceil(distance(a, z) / (stepKm * 0.4)));
        for (let k = 1; k <= count; k++) refined.push(lerp(a, z, k / count));
      }
      let segment = 1, previous = points[0].elevationMetres;
      return refined.map((p, i) => {
        if (i === 0) return { ...points[0] };
        if (i === refined.length - 1) return { ...points.at(-1) };
        while (segment < source.length - 1 && source[segment].alongKm < p.alongKm) segment++;
        const a = source[segment - 1], z = source[segment], t = clamp((p.alongKm - a.alongKm) / (z.alongKm - a.alongKm || 1), 0, 1), profile = interpolate(a, z, t), height = M.max(join.elevationMetres, M.min(previous, profile.elevationMetres, elevationAt(surface, p)));
        previous = height;
        return { column: p.column, row: p.row, elevationMetres: height, widthMetres: profile.widthMetres };
      });
    }
    function tributary(channels, elevation, n, bounds, metric, center, radius, seed) {
      if (!channels.length) return null;
      const main = channels.reduce((a, b) => a.points.length > b.points.length ? a : b), distance = (a, b) => M.hypot((a.column - b.column) * metric.column, (a.row - b.row) * metric.row), join = main.points.slice(2, -2).sort((a, b) => distance(a, center) - distance(b, center))[0];
      if (!join || join.widthMetres < 18) return null;
      const at = (i) => ({ column: bounds.west + i % n / (n - 1) * (bounds.east - bounds.west), row: bounds.north + M.floor(i / n) / (n - 1) * (bounds.south - bounds.north) }), index = (p) => clamp(M.round((p.row - bounds.north) / (bounds.south - bounds.north) * (n - 1)), 0, n - 1) * n + clamp(M.round((p.column - bounds.west) / (bounds.east - bounds.west) * (n - 1)), 0, n - 1), start = index(join), cost = new Float64Array(n * n).fill(Infinity), parent = new Int32Array(n * n).fill(-1), queue = priorityQueue(), coordinates = Array.from({ length: n * n }, (_, i) => at(i)), mainDistance = new Float64Array(n * n);
      for (let i = 0; i < n * n; i++) mainDistance[i] = elevation[i] > 0 ? distanceToLine(coordinates[i], main.points, metric).distance : Infinity;
      cost[start] = 0;
      queue.put(start, 0);
      while (queue.length) {
        const [i, d] = queue.take();
        if (d !== cost[i]) continue;
        const x = i % n, y = M.floor(i / n), p = coordinates[i];
        for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          if (x + sx < 0 || x + sx >= n || y + sy < 0 || y + sy >= n) continue;
          const j = i + sy * n + sx, q = coordinates[j], length = distance(p, q);
          if (elevation[j] <= 0 || elevation[j] < join.elevationMetres || distance(q, join) > 0.25 && mainDistance[j] < join.widthMetres / 2e3 + 0.05) continue;
          const descent = M.max(0, elevation[i] - elevation[j]), next = d + length * (1 + descent / 8 + (M.abs(elevation[j] - elevation[i]) / (length * 1e3)) ** 2 * 5);
          if (next < cost[j]) {
            cost[j] = next;
            parent[j] = i;
            queue.put(j, next);
          }
        }
      }
      let best = -1, score = -Infinity;
      for (let i = 0; i < n * n; i++) {
        const x = i % n, y = M.floor(i / n);
        if (x !== 0 && x !== n - 1 && y !== 0 && y !== n - 1) continue;
        if (!Number.isFinite(cost[i]) || elevation[i] <= 0 || elevation[i] < M.max(elevation[start], join.elevationMetres) + 5) continue;
        const value = (elevation[i] - elevation[start]) / (cost[i] + 0.5) * (1 + random(seed, i + 2870) * 0.1);
        if (value > score) {
          score = value;
          best = i;
        }
      }
      if (best < 0) return null;
      const points = [];
      for (let i = best; i >= 0 && i !== start; i = parent[i]) points.push({ ...at(i), elevationMetres: elevation[i] });
      points.push({ ...join });
      if (points.length < 4) return null;
      let previous = Infinity;
      for (let i = 0; i < points.length; i++) {
        points[i].elevationMetres = M.min(previous, points[i].elevationMetres);
        previous = points[i].elevationMetres;
        points[i].widthMetres = M.max(3, join.widthMetres * (0.12 + 0.25 * i / (points.length - 1)));
      }
      const refined = refineTributary(points, { rows: n, columns: n, bounds, elevationMetres: elevation }, metric, main, join);
      channels.push({ points: refined, widthMetres: refined.at(-1).widthMetres, kind: "river", widthModel: "tributary-catchment", mouth: false });
      return { anchor: { ...join }, mainChannel: channels.indexOf(main), tributaryChannel: channels.length - 1 };
    }
    function landRuns(points, surface, metric, stepKm) {
      const runs = [];
      let run = [];
      const flush = () => {
        if (run.length > 1) runs.push(run);
        run = [];
      };
      for (let i = 1; i < points.length; i++) {
        const edge = clipEdge(points[i - 1], points[i], surface.bounds);
        if (!edge) {
          flush();
          continue;
        }
        const [a, b] = edge, len = M.hypot((b.column - a.column) * metric.column, (b.row - a.row) * metric.row), count = M.max(1, M.ceil(len / (stepKm * 0.4)));
        for (let j = 1; j <= count; j++) {
          const p = interpolate(a, b, (j - 1) / count), q = interpolate(a, b, j / count), zp = elevationAt(surface, p), zq = elevationAt(surface, q);
          if (zp <= 0 && zq <= 0) {
            flush();
            continue;
          }
          if (zp > 0 !== zq > 0) {
            let low = 0, high = 1;
            for (let k = 0; k < 22; k++) {
              const t = (low + high) / 2;
              if (elevationAt(surface, interpolate(p, q, t)) > 0 === zp > 0) low = t;
              else high = t;
            }
            const mouth = interpolate(p, q, (low + high) / 2);
            mouth.elevationMetres = 0;
            if (zp > 0) {
              if (!run.length) run.push(p);
              run.push(mouth);
              flush();
            } else {
              flush();
              run.push(mouth, q);
            }
          } else {
            if (!run.length) run.push(p);
            run.push(q);
          }
        }
      }
      flush();
      return runs;
    }
    function coastalDetail(recipe, context, elevation, coordinates, metric, seed, stepKm) {
      const harbor = recipe.harbor, result = { refined: false, setting: harbor?.setting || "open-coast", islands: [] };
      if (!harbor || harbor.kind !== "sea") return result;
      const b = context.bounds, c = recipe.location, n = harbor.outward, t = { x: -n.y, y: n.x }, r = recipe.urban.radiusKm, relief = M.max(...context.elevationMetres) - M.min(...context.elevationMetres), rugged = relief > 180 && ["steep", "escarpment", "rolling"].includes(recipe.terrain?.slopeClass), inlet = rugged && (harbor.shelter > 0.58 || random(seed, 2101) < 0.4), setback = M.hypot((harbor.shore.column - c.column) * metric.column, (harbor.shore.row - c.row) * metric.row), length = M.min(setback * 0.48, M.max(stepKm * 2, r * 0.52)), halfWidth = M.max(stepKm * 1.2, M.min(r * 0.24, 0.3));
      if (inlet && length > stepKm) {
        for (let i = 0; i < coordinates.length; i++) {
          const p = coordinates[i], x = (p.column - harbor.shore.column) * metric.column, y = (p.row - harbor.shore.row) * metric.row, along = x * n.x + y * n.y, across = x * t.x + y * t.y;
          if (along < -length || along > stepKm * 2 || M.abs(across) > halfWidth * 2 || M.hypot((p.column - c.column) * metric.column, (p.row - c.row) * metric.row) < r * 0.24) continue;
          const taper = clamp((along + length) / (length + stepKm), 0, 1), w = halfWidth * M.sqrt(taper), edge = M.abs(across) - w, depth = clamp(edge / halfWidth * 24, -24, 24);
          elevation[i] = M.min(elevation[i], depth);
        }
        result.refined = true;
        result.setting = context.latitudeDegrees > 45 && relief > 300 ? "fjord" : "sheltered-inlet";
      }
      if (!rugged && recipe.siteType !== "island-port") return result;
      const count = 1 + M.floor(random(seed, 2110) * 6);
      for (let k = 0; k < count; k++) {
        const salt = 2111 + k * 71, across = (random(seed, salt) * 2 - 1) * M.max(1.4, r * 3.8), along = M.max(0.3, r * 0.4) * (1 + random(seed, salt + 1) * 3.8), p = { column: harbor.shore.column + (n.x * along + t.x * across) / metric.column, row: harbor.shore.row + (n.y * along + t.y * across) / metric.row }, depth = sample(context.elevationMetres, context.rows, context.columns, b, p.row, p.column), rx = M.max(stepKm * 2, M.min(0.85, r * (0.12 + random(seed, salt + 2) * 0.48))), ry = rx * (0.25 + random(seed, salt + 3) * 0.68), heading = random(seed, salt + 4) * M.PI * 2, cos = M.cos(heading), sin = M.sin(heading), family = M.floor(random(seed, salt + 5) * 4), phase = random(seed, salt + 6) * M.PI * 2;
        if (depth >= -2 || depth < -100 || p.column < b.west + rx / metric.column || p.column > b.east - rx / metric.column || p.row < b.north + rx / metric.row || p.row > b.south - rx / metric.row || result.islands.some((island) => M.hypot((island.anchor.column - p.column) * metric.column, (island.anchor.row - p.row) * metric.row) < rx + island.radiusKm) || harbor.sailing && distanceToLine(p, harbor.sailing, metric).distance < rx + 0.15) continue;
        const peak = 7 + random(seed, salt + 7) * 57;
        let dryCount = 0;
        for (let i = 0; i < coordinates.length; i++) {
          const q = coordinates[i], dx = (q.column - p.column) * metric.column, dy = (q.row - p.row) * metric.row, u = (dx * cos + dy * sin) / rx, v = (-dx * sin + dy * cos) / ry, angle = M.atan2(v, u), lobes = 1 + 0.18 * M.sin(angle * (2 + family) + phase) + 0.09 * M.sin(angle * 7 - phase * 1.7), rho = M.hypot(u, v) / lobes;
          let z = peak * (1 - rho * rho);
          if (family === 1) z = M.min(z, peak * (M.hypot(u - 0.43, v - 0.28) / 0.78 - 1));
          if (family === 2) z = M.max(z, peak * 0.68 * (1 - ((u + 0.72) ** 2 / 0.55 + (v - 0.36) ** 2 / 0.66)));
          if (family === 3) z = peak * (1 - M.abs(v) / lobes - 0.63 * M.abs(u) ** 1.7);
          if (z > 0 && elevation[i] <= 0 && (!harbor.sailing?.length || distanceToLine(q, harbor.sailing, metric).distance > 0.1)) {
            elevation[i] = z;
            dryCount++;
          }
        }
        if (dryCount) {
          const summit = coordinates.map((q, i) => ({ q, i, d: M.hypot((q.column - p.column) * metric.column, (q.row - p.row) * metric.row) })).filter((v) => v.d < rx * 1.3 && elevation[v.i] > 0).sort((a, z) => elevation[z.i] - elevation[a.i])[0];
          result.islands.push({
            anchor: summit.q,
            heightMetres: M.round(peak),
            radiusKm: rx,
            shape: ["skerry", "crescent", "paired-ridge", "long-ridge"][family],
            shapeSeed: salt,
            areaKm2: dryCount * stepKm * stepKm
          });
          result.refined = true;
        }
      }
      return result;
    }
    function clipEdge(a, b, bounds) {
      let low = 0, high = 1;
      const dx = b.column - a.column, dy = b.row - a.row;
      for (const [p, q] of [[-dx, a.column - bounds.west], [dx, bounds.east - a.column], [-dy, a.row - bounds.north], [dy, bounds.south - a.row]]) {
        if (M.abs(p) < 1e-12) {
          if (q < 0) return null;
          continue;
        }
        const t = q / p;
        if (p < 0) low = M.max(low, t);
        else high = M.min(high, t);
        if (low > high) return null;
      }
      return [interpolate(a, b, low), interpolate(a, b, high)];
    }
    function ruralNetwork(recipe, surface, slopes, channels, metric, seed, bridges, streetPlan) {
      const b = surface.bounds, n = surface.columns, c = recipe.location, r = recipe.urban.radiusKm;
      const { streets: urbanStreets, gateStreets, enclosures, wallSpans, innerWallSpans, reservedCompounds } = streetPlan, portals = gateStreets.filter((street) => street.layer === "outer"), fortified = wallSpans.length > 0, allWallSpans = [...wallSpans, ...innerWallSpans];
      const inPolygon = (p, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const a = polygon[i], z = polygon[j];
          if (a.row > p.row !== z.row > p.row && p.column < (z.column - a.column) * (p.row - a.row) / (z.row - a.row) + a.column) inside = !inside;
        }
        return inside;
      };
      const compoundBounds = reservedCompounds.map((compound) => polygonBounds(compound.points, 1e-8)), enclosureBounds = enclosures.map((polygon) => polygonBounds(polygon)), wallBounds = allWallSpans.map((span) => polygonBounds(span, 1e-8)), contains = (bounds, p) => p.column >= bounds.west && p.column <= bounds.east && p.row >= bounds.north && p.row <= bounds.south, overlaps = (a, z) => a.east >= z.west && a.west <= z.east && a.south >= z.north && a.north <= z.south, edgeBounds = (a, z) => {
        const dx2 = M.abs(z.column - a.column) * 1e-8 + 1e-12, dy2 = M.abs(z.row - a.row) * 1e-8 + 1e-12;
        return {
          west: M.min(a.column, z.column) - dx2,
          east: M.max(a.column, z.column) + dx2,
          north: M.min(a.row, z.row) - dy2,
          south: M.max(a.row, z.row) + dy2
        };
      }, occupied = (p) => reservedCompounds.some((compound, i) => contains(compoundBounds[i], p) && inPolygon(p, compound.points)), insideCity = (p) => enclosures.some((polygon, i) => contains(enclosureBounds[i], p) && inPolygon(p, polygon));
      const index = (p) => clamp(M.round((p.row - b.north) / (b.south - b.north) * (n - 1)), 0, n - 1) * n + clamp(M.round((p.column - b.west) / (b.east - b.west) * (n - 1)), 0, n - 1);
      const nodes = Array.from({ length: n * n }, (_, i) => ({ row: b.north + M.floor(i / n) / (n - 1) * (b.south - b.north), column: b.west + i % n / (n - 1) * (b.east - b.west) }));
      const point = (i) => nodes[i];
      const distance = (a, b2) => M.hypot((a.column - b2.column) * metric.column, (a.row - b2.row) * metric.row);
      const cost = new Float64Array(n * n).fill(Infinity), parent = new Int32Array(n * n).fill(-1), anchors = /* @__PURE__ */ new Map(), heap = [];
      const put = (i, d) => {
        heap.push([i, d]);
        let k = heap.length - 1;
        while (k) {
          const p = k - 1 >> 1;
          if (heap[p][1] <= d) break;
          heap[k] = heap[p];
          k = p;
        }
        heap[k] = [i, d];
      };
      const take = () => {
        const first = heap[0], last = heap.pop();
        if (heap.length) {
          let i = 0;
          while (i * 2 + 1 < heap.length) {
            let j = i * 2 + 1;
            if (j + 1 < heap.length && heap[j + 1][1] < heap[j][1]) j++;
            if (heap[j][1] >= last[1]) break;
            heap[i] = heap[j];
            i = j;
          }
          heap[i] = last;
        }
        return first;
      };
      const allowed = Array.from({ length: n * n }, (_, i) => surface.roadBuildable[i] === 1 && !occupied(point(i)) && (!fortified || !insideCity(point(i))) && !channels.some((ch) => {
        const near = distanceToLine(point(i), ch.points, metric);
        return near.distance < near.widthMetres / 2e3 + 0.025;
      }));
      const links = /* @__PURE__ */ new Map(), bridgeEdges = /* @__PURE__ */ new Map();
      const waterEdges = channels.flatMap((ch) => ch.points.slice(1).map((z, i) => ({ a: ch.points[i], z })));
      const waterBins = /* @__PURE__ */ new Map(), binX = (p) => clamp(M.floor((p.column - b.west) / (b.east - b.west) * (n - 1)), 0, n - 1), binY = (p) => clamp(M.floor((p.row - b.north) / (b.south - b.north) * (n - 1)), 0, n - 1);
      const bins = (a, z) => {
        const keys = [];
        for (let y = M.min(binY(a), binY(z)); y <= M.max(binY(a), binY(z)); y++) for (let x = M.min(binX(a), binX(z)); x <= M.max(binX(a), binX(z)); x++) keys.push(y * n + x);
        return keys;
      };
      for (const edge of waterEdges) for (const key2 of bins(edge.a, edge.z)) {
        if (!waterBins.has(key2)) waterBins.set(key2, []);
        waterBins.get(key2).push(edge);
      }
      const crossesWater = (a, z) => bins(a, z).some((key2) => (waterBins.get(key2) || []).some(({ a: c2, z: d }) => {
        if (M.max(a.column, z.column) < M.min(c2.column, d.column) || M.min(a.column, z.column) > M.max(c2.column, d.column) || M.max(a.row, z.row) < M.min(c2.row, d.row) || M.min(a.row, z.row) > M.max(c2.row, d.row)) return false;
        const dx2 = z.column - a.column, dy2 = z.row - a.row, sx = d.column - c2.column, sy = d.row - c2.row, den = dx2 * sy - dy2 * sx;
        if (M.abs(den) < 1e-14) return false;
        const t = ((c2.column - a.column) * sy - (c2.row - a.row) * sx) / den, u = ((c2.column - a.column) * dy2 - (c2.row - a.row) * dx2) / den;
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
      }));
      const bankNode = (p, opposite) => {
        let best = -1, d = Infinity;
        for (let i = 0; i < n * n; i++) if (allowed[i]) {
          const q = point(i);
          if (opposite) {
            const mx = (p.column + opposite.column) / 2, my = (p.row + opposite.row) / 2;
            if ((q.column - mx) * (p.column - mx) * metric.column ** 2 + (q.row - my) * (p.row - my) * metric.row ** 2 <= 0) continue;
          }
          const v = distance(q, p);
          if (v < d) {
            best = i;
            d = v;
          }
        }
        return best;
      };
      const dx = (b.east - b.west) * metric.column / (n - 1), dy = (b.south - b.north) * metric.row / (n - 1);
      const crossing = (a, z, p, q) => {
        const x = z.column - a.column, y = z.row - a.row, sx = q.column - p.column, sy = q.row - p.row, den = x * sy - y * sx;
        if (M.abs(den) < 1e-14) return null;
        const t = ((p.column - a.column) * sy - (p.row - a.row) * sx) / den, u = ((p.column - a.column) * y - (p.row - a.row) * x) / den;
        return t >= -1e-8 && t <= 1 + 1e-8 && u >= -1e-8 && u <= 1 + 1e-8 ? interpolate(a, z, clamp(t, 0, 1)) : null;
      };
      const crossesCompoundBoundary = (a, z) => {
        const bounds = edgeBounds(a, z);
        return reservedCompounds.some((compound, i) => overlaps(bounds, compoundBounds[i]) && compound.points.some((p, j) => crossing(a, z, p, compound.points[(j + 1) % compound.points.length])));
      }, crossesReserved = (a, z) => occupied(a) || occupied(z) || crossesCompoundBoundary(a, z);
      const crossesWall = (a, z) => {
        const bounds = edgeBounds(a, z);
        return allWallSpans.some((span, i) => {
          if (!overlaps(bounds, wallBounds[i])) return false;
          const hit = crossing(a, z, span[0], span[1]);
          return hit && !gateStreets.some((portal) => distance(hit, portal.gateCenter) <= portal.widthKm);
        });
      };
      const safeAccess = (a, z) => {
        if (crossesWater(a, z) || crossesReserved(a, z) || crossesWall(a, z)) return false;
        const length = distance(a, z), steps = M.max(4, M.ceil(length / 0.025));
        let previous = elevationAt(surface, a);
        for (let k = 0; k <= steps; k++) {
          const p = interpolate(a, z, k / steps), height = elevationAt(surface, p);
          if (!isDry(surface, p) || k && M.abs(height - previous) / (M.max(length / steps, 1e-4) * 1e3) > 0.12 || channels.some((ch) => {
            const near = distanceToLine(p, ch.points, metric);
            return near.distance < near.widthMetres / 2e3 + 4e-3;
          })) return false;
          previous = height;
        }
        return true;
      };
      for (const bridge of bridges) {
        const a = bankNode(bridge.points[0], bridge.points[1]), z = bankNode(bridge.points[1], bridge.points[0]);
        if (a < 0 || z < 0 || a === z || crossesReserved(...bridge.points) || crossesWall(...bridge.points) || !safeAccess(point(a), bridge.points[0]) || !safeAccess(point(z), bridge.points[1])) continue;
        if (!links.has(a)) links.set(a, []);
        if (!links.has(z)) links.set(z, []);
        links.get(a).push(z);
        links.get(z).push(a);
        bridgeEdges.set(a + ":" + z, bridge.points);
        bridgeEdges.set(z + ":" + a, bridge.points.slice().reverse());
      }
      const sources = fortified ? portals : urbanStreets;
      for (const street of sources) for (let k = fortified ? street.points.length - 1 : 1; k < street.points.length; k++) {
        const a = street.points[k - 1], z = street.points[k], sx = (z.column - a.column) * metric.column, sy = (z.row - a.row) * metric.row, squared = sx * sx + sy * sy;
        const minX = M.max(0, M.min(index(a) % n, index(z) % n) - 1), maxX = M.min(n - 1, M.max(index(a) % n, index(z) % n) + 1), minY = M.max(0, M.min(M.floor(index(a) / n), M.floor(index(z) / n)) - 1), maxY = M.min(n - 1, M.max(M.floor(index(a) / n), M.floor(index(z) / n)) + 1);
        for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
          const i = y * n + x;
          if (!allowed[i]) continue;
          const p = point(i), t = clamp(((p.column - a.column) * metric.column * sx + (p.row - a.row) * metric.row * sy) / (squared || 1), 0, 1), q = fortified ? z : interpolate(a, z, t), d = distance(p, q);
          if (d > M.hypot(dx, dy) * 0.8 || d >= cost[i] || !safeAccess(q, p)) continue;
          cost[i] = d;
          anchors.set(i, fortified ? street.points.slice() : [q]);
          put(i, d);
        }
      }
      while (heap.length) {
        const [i, d] = take();
        if (d !== cost[i]) continue;
        const x = i % n, y = M.floor(i / n);
        for (const j of links.get(i) || []) {
          const next = d + distance(point(i), point(j)) * 1.2;
          if (next < cost[j]) {
            cost[j] = next;
            parent[j] = i;
            put(j, next);
          }
        }
        for (const [sx, sy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
          [1, 2],
          [-1, 2],
          [1, -2],
          [-1, -2],
          [2, 1],
          [-2, 1],
          [2, -1],
          [-2, -1]
        ]) {
          if (x + sx < 0 || x + sx >= n || y + sy < 0 || y + sy >= n) continue;
          const j = i + sy * n + sx;
          if (!allowed[j] || sx && sy && (!allowed[i + sx] || !allowed[i + sy * n])) continue;
          if (crossesWater(point(i), point(j)) || crossesCompoundBoundary(point(i), point(j)) || crossesWall(point(i), point(j))) continue;
          const length = M.hypot(sx * dx, sy * dy), grade = M.abs(surface.elevationMetres[i] - surface.elevationMetres[j]) / (length * 1e3);
          if (grade > 0.12) continue;
          const next = d + length * (1 + (grade / 0.035) ** 2 * 2 + random(seed, j + 67e3) * 0.18);
          if (next < cost[j]) {
            cost[j] = next;
            parent[j] = i;
            put(j, next);
          }
        }
      }
      const chainTo = (i) => {
        const chain = [];
        for (; i >= 0; i = parent[i]) chain.push(i);
        chain.reverse();
        return chain;
      };
      const pathTo = (i) => {
        const chain = chainTo(i), points = anchors.get(chain[0]).slice();
        if (distance(points.at(-1), point(chain[0])) > 1e-8) points.push(point(chain[0]));
        for (let k = 1; k < chain.length; k++) {
          const bridge = bridgeEdges.get(chain[k - 1] + ":" + chain[k]);
          if (bridge) points.push(...bridge);
          points.push(point(chain[k]));
        }
        return points;
      };
      const streetFrontage = (end, maximumDistance) => {
        let frontage = null;
        for (const street of urbanStreets) for (let k = 1; k < street.points.length; k++) {
          const a = street.points[k - 1], z = street.points[k], sx = (z.column - a.column) * metric.column, sy = (z.row - a.row) * metric.row, squared = sx * sx + sy * sy, t = clamp(((end.column - a.column) * metric.column * sx + (end.row - a.row) * metric.row * sy) / (squared || 1), 0, 1), q = interpolate(a, z, t), d = distance(q, end);
          if (d <= maximumDistance && (!frontage || d < frontage.distance) && safeAccess(q, end)) frontage = { point: q, distance: d, segment: [a, z] };
        }
        return frontage;
      };
      const corridors = [];
      for (const route of recipe.transport.corridors) {
        if (route.kind !== "road") {
          corridors.push(route);
          continue;
        }
        const clipped = route.points.slice(1).flatMap((p, i) => clipEdge(route.points[i], p, b) || []);
        if (clipped.length < 2) continue;
        const ends = [clipped[0], clipped.at(-1)], paths = [];
        for (const end of ends) {
          if (distance(end, c) <= 1e-8) continue;
          const frontage = streetFrontage(end, M.hypot(dx, dy) * 0.8);
          if (frontage?.distance <= 1e-8) {
            if (recipe.harbor && distance(end, recipe.harbor.landPoint) <= 1e-8) {
              const other = frontage.segment.reduce((best, p) => distance(p, end) > distance(best, end) ? p : best, frontage.segment[0]);
              if (distance(other, end) > 1e-8) paths.push([other, end]);
            }
            continue;
          }
          if (frontage && frontage.distance < M.hypot(dx, dy) * 0.8 && safeAccess(frontage.point, end)) {
            paths.push([frontage.point, end]);
            continue;
          }
          const node = bankNode(end);
          if (node < 0 || !Number.isFinite(cost[node]) || distance(point(node), end) > M.hypot(dx, dy) * 1.8) continue;
          const tail = point(node);
          if (!safeAccess(tail, end)) continue;
          const points = pathTo(node);
          if (distance(points.at(-1), end) > 1e-8) points.push(end);
          paths.push(points);
        }
        for (const [arm, points] of paths.entries()) corridors.push({ ...route, id: route.id + "-approach-" + arm, sourceId: route.id, points });
      }
      for (const [i, bridge] of bridges.entries()) {
        if (crossesReserved(...bridge.points) || crossesWall(...bridge.points)) continue;
        const bankPaths = bridge.points.map((bank, k) => {
          const frontage = streetFrontage(bank, r * 0.7);
          if (frontage && frontage.distance < r * 0.7) return [frontage.point, bank];
          const node = bankNode(bank, bridge.points[1 - k]);
          if (node < 0 || !Number.isFinite(cost[node]) || !safeAccess(point(node), bank)) return null;
          return pathTo(node).concat(bank);
        });
        if (bankPaths.every(Boolean) && bankPaths.some((path) => insideCity(path[0]))) {
          corridors.push({
            id: bridge.routeId + "-bridge-" + i,
            sourceId: bridge.routeId,
            kind: "road",
            points: bankPaths[0].concat(bankPaths[1].slice().reverse())
          });
          continue;
        }
        const a = bankNode(bridge.points[0], bridge.points[1]), z = bankNode(bridge.points[1], bridge.points[0]);
        if (a < 0 || z < 0 || !Number.isFinite(cost[a]) || !Number.isFinite(cost[z]) || !bridgeEdges.has(a + ":" + z)) continue;
        if (chainTo(a).includes(z) || chainTo(z).includes(a)) continue;
        corridors.push({
          id: bridge.routeId + "-bridge-" + i,
          sourceId: bridge.routeId,
          kind: "road",
          points: pathTo(a).concat(bridge.points, pathTo(z).slice().reverse())
        });
      }
      const roads = [], used = /* @__PURE__ */ new Set();
      const roadCount = M.max(2, M.min(10, M.ceil(M.sqrt((recipe.population?.estimate || 1e3) / 1e3))));
      for (let k = 0; k < roadCount; k++) {
        const angle = (k + random(seed, k + 67100) * 0.55) * M.PI * 2 / roadCount, reach = r * (2.3 + random(seed, k + 67200) * 1.6), target = { row: c.row + M.sin(angle) * reach / metric.row, column: c.column + M.cos(angle) * reach / metric.column };
        let best = -1, score = Infinity;
        for (let i = 0; i < n * n; i++) if (Number.isFinite(cost[i])) {
          const d = distance(point(i), target);
          if (d < score) {
            score = d;
            best = i;
          }
        }
        if (best < 0 || score > r * 0.8 || distance(point(best), c) < r * 1.4) continue;
        const chain = chainTo(best);
        let anchor = anchors.get(chain[0]);
        let run = [];
        const flush = () => {
          if (run.length > 1) roads.push({ id: "country-road-" + roads.length, kind: "road", local: true, points: run });
          run = [];
        };
        for (let i = 1; i < chain.length; i++) {
          const a = chain[i - 1], z = chain[i], key2 = [M.min(a, z), M.max(a, z)].join(":");
          if (used.has(key2) || bridgeEdges.has(a + ":" + z)) {
            flush();
            anchor = null;
            continue;
          }
          used.add(key2);
          if (!run.length) {
            if (anchor) run.push(...anchor);
            run.push(point(a));
          }
          run.push(point(z));
          anchor = null;
        }
        flush();
      }
      for (const route of [...roads, ...corridors].filter((route2) => route2.kind === "road")) {
        const points = [];
        for (const p of route.points) if (!points.length || distance(points.at(-1), p) > 1e-8) points.push(p);
        route.points = points;
      }
      const graph = /* @__PURE__ */ new Map(), key = (p) => `${round(p.column)}:${round(p.row)}`;
      for (const route of [...roads, ...corridors].filter((r2) => r2.kind === "road")) for (let i = 1; i < route.points.length; i++) {
        const a = key(route.points[i - 1]), z = key(route.points[i]);
        if (!graph.has(a)) graph.set(a, /* @__PURE__ */ new Set());
        if (!graph.has(z)) graph.set(z, /* @__PURE__ */ new Set());
        graph.get(a).add(z);
        graph.get(z).add(a);
      }
      const safeCurve = (a, z) => {
        if (crossesWater(a, z) || crossesReserved(a, z) || crossesWall(a, z)) return false;
        const length = distance(a, z);
        if (length < 1e-6) return true;
        if (M.abs(elevationAt(surface, a) - elevationAt(surface, z)) / (length * 1e3) > 0.12) return false;
        const steps = M.max(4, M.ceil(length / 0.025));
        let previous = elevationAt(surface, a);
        for (let k = 1; k <= steps; k++) {
          const p = interpolate(a, z, k / steps), height = elevationAt(surface, p);
          if (!isDry(surface, p) || M.abs(height - previous) / (length / steps * 1e3) > 0.12 || channels.some((ch) => {
            const near = distanceToLine(p, ch.points, metric);
            return near.distance < near.widthMetres / 2e3 + 0.01;
          })) return false;
          previous = height;
        }
        return true;
      };
      const portalVertices = new Set(gateStreets.flatMap((street) => street.points.map(key)));
      const curve = (route) => {
        if (route.kind !== "road" || route.points.length < 3) return route;
        const fixed = (p) => graph.get(key(p))?.size !== 2 || portalVertices.has(key(p)) || bridges.some((bridge) => distanceToLine(p, bridge.points, metric).distance < 0.035);
        const points = [route.points[0]];
        for (let i = 1; i < route.points.length; ) {
          let far = i;
          while (far + 1 < route.points.length && !fixed(route.points[far]) && distance(route.points[i - 1], route.points[far + 1]) < 0.38 && safeCurve(points.at(-1), route.points[far + 1])) far++;
          points.push(route.points[far]);
          i = far + 1;
        }
        const out = [points[0]];
        for (let i = 1; i < points.length - 1; i++) {
          const a = points[i - 1], p = points[i], z = points[i + 1];
          if (fixed(p)) {
            out.push(p);
            continue;
          }
          const first = interpolate(p, a, 0.42), last = interpolate(p, z, 0.42), arc = [first];
          for (let k = 1; k <= 5; k++) {
            const t = k / 5, q = 1 - t;
            arc.push({ column: q * q * first.column + 2 * q * t * p.column + t * t * last.column, row: q * q * first.row + 2 * q * t * p.row + t * t * last.row });
          }
          if (safeCurve(out.at(-1), first) && arc.slice(1).every((q, k) => safeCurve(arc[k], q))) out.push(...arc);
          else out.push(p);
        }
        out.push(points.at(-1));
        return { ...route, points: out };
      };
      const curved = (route) => {
        const result = curve(route), points = [];
        for (const p of result.points) if (!points.length || distance(points.at(-1), p) > 1e-8) points.push(p);
        return { ...result, points };
      };
      return { ruralRoads: roads.map(curved), corridors: corridors.map(curved) };
    }
    function landform(recipe, context) {
      const b = context.bounds, c = recipe.location, m = context.gridCellKilometres, r = M.max(0.5, recipe.urban.radiusKm), z = (x, y) => sample(context.elevationMetres, context.rows, context.columns, b, c.row + y / m.row, c.column + x / m.column), h = z(0, 0), dx = z(r, 0) - z(-r, 0), dy = z(0, r) - z(0, -r), cx = z(r, 0) + z(-r, 0) - 2 * h, cy = z(0, r) + z(0, -r) - 2 * h;
      const grade = M.hypot(dx, dy) / (r * 2e3), steep = ["steep", "escarpment"].includes(recipe.terrain?.slopeClass) || grade > 0.065, rolling = recipe.terrain?.slopeClass === "rolling" || grade > 0.018;
      const mixed = (z(r, r) + z(-r, -r) - z(r, -r) - z(-r, r)) / 4, delta = M.hypot(cx - cy, 2 * mixed), high = (cx + cy + delta) / 2, low = (cx + cy - delta) / 2, acrossAxis = M.atan2(2 * mixed, cx - cy) / 2;
      const valley = high > M.max(10, M.hypot(dx, dy) * 0.12) && low < high * 0.5;
      const ridge = low < -15;
      const coast = ["port", "island-port"].includes(recipe.siteType) && steep;
      const kind = coast ? "coastal-slope" : valley ? "valley" : ridge ? "ridge" : steep ? "hillside" : rolling ? "hills" : "plain";
      const axisRadians = kind === "valley" || kind === "ridge" ? acrossAxis + M.PI / 2 : kind === "plain" ? (recipe.morphology?.orientationDegrees || 0) * M.PI / 180 : M.atan2(dx, -dy);
      const crossScale = { plain: 0.92, hills: 0.64, hillside: 0.3, valley: 0.22, ridge: 0.33, "coastal-slope": 0.26 }[kind];
      return {
        kind,
        axisRadians,
        crossScale,
        alongScale: ["valley", "hillside", "coastal-slope"].includes(kind) ? 1.32 : kind === "ridge" ? 1.08 : 0.95,
        label: { plain: "\u7F13\u5761\u5E73\u539F", hills: "\u4E18\u9675\u4E0E\u7F13\u5761", hillside: "\u5C71\u5761\u53F0\u5730", valley: "\u72ED\u957F\u6CB3\u8C37", ridge: "\u5C71\u810A\u4E0E\u9AD8\u53F0", "coastal-slope": "\u6CBF\u6D77\u9661\u5761\u53F0\u5730" }[kind]
      };
    }
    function crossings(recipe, surface, context, channels) {
      const result = [], metric = context.gridCellKilometres, bounds = surface.bounds, roadWidth = M.max(5, recipe.urban.streetWidthsMetres?.arterial || 8), clearance = (p) => channels.reduce((best, ch) => {
        const near = distanceToLine(p, ch.points, metric);
        return M.min(best, near.distance - near.widthMetres / 2e3);
      }, Infinity), setback = M.max(0.012, roadWidth / 1e3);
      for (const route of recipe.transport.corridors) if (route.kind === "road") for (let segment = 1; segment < route.points.length; segment++) {
        const a = route.points[segment - 1], b = route.points[segment], dx = (b.column - a.column) * metric.column, dy = (b.row - a.row) * metric.row, length = M.hypot(dx, dy);
        if (length < 1e-3) continue;
        for (const channel of channels) for (let index = 1; index < channel.points.length; index++) {
          const c = channel.points[index - 1], d = channel.points[index], sx = (d.column - c.column) * metric.column, sy = (d.row - c.row) * metric.row, qx = (c.column - a.column) * metric.column, qy = (c.row - a.row) * metric.row, denominator = dx * sy - dy * sx;
          if (M.abs(denominator) < 1e-9) continue;
          const t = (qx * sy - qy * sx) / denominator, u = (qx * dy - qy * dx) / denominator;
          if (t < 0 || t > 1 || u < 0 || u > 1) continue;
          const point = { row: a.row + (b.row - a.row) * t, column: a.column + (b.column - a.column) * t };
          if (result.some((bridge) => M.hypot((bridge.center.column - point.column) * metric.column, (bridge.center.row - point.row) * metric.row) < 0.08)) continue;
          const widthMetres = c.widthMetres + (d.widthMetres - c.widthMetres) * u;
          const bank = (sign, axis) => {
            const vx = axis.x * sign, vy = axis.y * sign, limit = M.min(
              vx > 0 ? (bounds.east - point.column) * metric.column / vx : vx < 0 ? (bounds.west - point.column) * metric.column / vx : Infinity,
              vy > 0 ? (bounds.south - point.row) * metric.row / vy : vy < 0 ? (bounds.north - point.row) * metric.row / vy : Infinity
            ), at = (d2) => ({ row: point.row + vy * d2 / metric.row, column: point.column + vx * d2 / metric.column }), dry = (d2) => {
              const p = at(d2);
              if (!isDry(surface, p) || clearance(p) < setback) return false;
              return [-1, 1].every((side) => {
                const corner = { column: p.column - vy * roadWidth / 2e3 * side / metric.column, row: p.row + vx * roadWidth / 2e3 * side / metric.row };
                return corner.column >= bounds.west && corner.column <= bounds.east && corner.row >= bounds.north && corner.row <= bounds.south && isDry(surface, corner) && clearance(corner) >= 4e-3;
              });
            }, step = M.max(4e-3, M.min(0.025, widthMetres / 1e3 * 0.1));
            let low = 0;
            for (let high = M.min(step, limit); high > low; high = M.min(high + step, limit)) {
              if (dry(high)) {
                for (let k = 0; k < 22; k++) {
                  const mid = (low + high) / 2;
                  if (dry(mid)) high = mid;
                  else low = mid;
                }
                return { point: at(high), distanceKm: high };
              }
              low = high;
            }
            return null;
          }, roadAxis = { x: dx / length, y: dy / length }, solve = (axis) => {
            const banks = [bank(-1, axis), bank(1, axis)];
            if (banks.some((p) => !p)) return null;
            const points = banks.map((p) => p.point), heights = points.map((p) => elevationAt(surface, p)), span = banks.reduce((sum, p) => sum + p.distanceKm, 0), grade = M.abs(heights[1] - heights[0]) / (span * 1e3);
            return grade <= 0.12 ? { points, heights, span, grade, axis } : null;
          }, nearby = channels.map((ch) => ({ ch, near: distanceToLine(point, ch.points, metric) })).filter(({ near }) => near.distance < near.widthMetres / 2e3 + setback), localWidth = M.max(widthMetres, ...nearby.map(({ near }) => near.widthMetres)) / 1e3;
          let solved = solve(roadAxis);
          if (!solved || solved.span > M.max(0.06, localWidth * 2.5)) {
            const normals = nearby.map(({ ch }) => {
              let best = Infinity, normal = null;
              for (let i = 1; i < ch.points.length; i++) {
                const a2 = ch.points[i - 1], z = ch.points[i], x = (z.column - a2.column) * metric.column, y = (z.row - a2.row) * metric.row, px = (point.column - a2.column) * metric.column, py = (point.row - a2.row) * metric.row, l = M.hypot(x, y);
                if (l < 1e-9) continue;
                const t2 = clamp((px * x + py * y) / (l * l), 0, 1), d2 = M.hypot(px - x * t2, py - y * t2);
                if (d2 < best) {
                  best = d2;
                  normal = { x: -y / l, y: x / l };
                }
              }
              return normal;
            }).filter(Boolean), axes = normals.slice();
            for (let i = 0; i < normals.length; i++) for (let j = i + 1; j < normals.length; j++) for (const sign of [-1, 1]) {
              const x = normals[i].x + normals[j].x * sign, y = normals[i].y + normals[j].y * sign, l = M.hypot(x, y);
              if (l > 1e-8) axes.push({ x: x / l, y: y / l });
            }
            const score = (result2) => result2.span * (1 + (1 - M.abs(result2.axis.x * roadAxis.x + result2.axis.y * roadAxis.y)) * 0.25);
            for (let axis of axes) {
              if (axis.x * roadAxis.x + axis.y * roadAxis.y < 0) axis = { x: -axis.x, y: -axis.y };
              const candidate = solve(axis);
              if (candidate && (!solved || score(candidate) < score(solved))) solved = candidate;
            }
          }
          if (!solved) continue;
          result.push({
            id: "bridge-" + result.length,
            routeId: route.id,
            center: point,
            points: solved.points,
            widthMetres: roadWidth,
            name: Array.from(recipe.name || "\u5F53\u5730").slice(0, 3).join("") + "\u6EAA\u6865" + (result.length ? String(result.length + 1) : ""),
            grade: solved.grade,
            bankHeightsMetres: solved.heights
          });
        }
      }
      return result;
    }
    function contourPaths(points, heights, land, metric, surface) {
      const SIZE = M.round(M.sqrt(points.length));
      const dryHeights = heights.filter((_, index) => land[index]);
      if (!dryHeights.length) return { terrainBands: [], contours: [] };
      const minimum = M.min(...dryHeights), maximum = M.max(...dryHeights);
      const span = M.max(1, maximum - minimum);
      const colours = Array.from({ length: 16 }, (_, index) => {
        const t = index / 15;
        return "#" + [231 + t * 9, 242 - t * 6, 207 + t * 11].map((value) => M.round(value).toString(16).padStart(2, "0")).join("");
      });
      const levels = colours.map((_, index) => minimum + span * index / (colours.length - 1));
      const interval = [5, 10, 20, 25, 50, 100, 200, 500].find((v) => span / v <= 20) || 1e3;
      const contourLevels = Array.from({ length: M.floor(maximum / interval) - M.ceil(minimum / interval) + 1 }, (_, i) => (M.ceil(minimum / interval) + i) * interval);
      const bandPaths = levels.map(() => []);
      const lines = contourLevels.map(() => []), lineSegments = contourLevels.map(() => []);
      const shadePaths = Array.from({ length: 33 }, () => []), waterPaths = [], dryPaths = [];
      const gradients = [], slopes = [];
      for (let row = 0; row < SIZE - 1; row++) for (let column = 0; column < SIZE - 1; column++) {
        const a = row * SIZE + column, b = a + 1, c = a + SIZE, d = c + 1;
        if (![a, b, c, d].every((i) => land[i])) {
          gradients.push(null);
          continue;
        }
        const dx = (heights[b] + heights[d] - heights[a] - heights[c]) / ((points[b].column - points[a].column) * metric.column * 2e3), dy = (heights[c] + heights[d] - heights[a] - heights[b]) / ((points[c].row - points[a].row) * metric.row * 2e3);
        gradients.push({ dx, dy });
        slopes.push(M.hypot(dx, dy));
      }
      slopes.sort((a, b) => a - b);
      const exaggeration = clamp(0.45 / (slopes[M.floor(slopes.length * 0.8)] || 1), 1, 8);
      const fmt = (point) => `${round(point.column)} ${round(point.row)}`;
      const clip = (polygon, level) => {
        const result = [];
        for (let index = 0; index < polygon.length; index++) {
          const a = polygon[index], b = polygon[(index + 1) % polygon.length];
          if (a.height >= level) result.push(a);
          if (a.height >= level !== b.height >= level) {
            const t = (level - a.height) / (b.height - a.height);
            result.push({ row: a.row + (b.row - a.row) * t, column: a.column + (b.column - a.column) * t, height: level });
          }
        }
        return result;
      };
      for (let row = 0; row < SIZE - 1; row++) for (let column = 0; column < SIZE - 1; column++) {
        const a = row * SIZE + column, b = a + 1, c = a + SIZE, d = c + 1;
        const gradient = gradients[row * (SIZE - 1) + column];
        if (gradient) {
          const nx = -gradient.dx * exaggeration, ny = -gradient.dy * exaggeration, length = M.hypot(nx, ny, 1), light = (0.78 * (nx * -0.5 + ny * -0.5 + 0.70710678) + 0.22 * (ny * -0.70710678 + 0.70710678)) / length;
          const shade = clamp(M.round((light - 0.70710678) * 24) + 16, 0, 32);
          shadePaths[shade].push(`M${[a, b, d, c].map((i) => fmt(points[i])).join("L")}Z`);
        }
      }
      for (const triangle of surfaceTriangles(surface)) {
        if (triangle.some((point) => point.height <= 0)) {
          const wet = clip(triangle.map((p) => ({ ...p, height: -p.height })), 0);
          if (wet.length >= 3) waterPaths.push(`M${wet.map(fmt).join("L")}Z`);
        }
        const dry = clip(triangle, 0);
        if (dry.length < 3) continue;
        const min = M.min(...triangle.map((p) => p.height)), max = M.max(...triangle.map((p) => p.height)), ring = dry.map((p) => [round(p.column) + 0, round(p.row) + 0]), full = `M${ring.map((p) => p.join(" ")).join("L")}Z`;
        dryPaths.push(ring);
        for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
          const level = levels[levelIndex];
          if (level <= min) {
            bandPaths[levelIndex].push(full);
            continue;
          }
          if (level > max) continue;
          const polygon = clip(dry, level);
          if (polygon.length >= 3) bandPaths[levelIndex].push(`M${polygon.map(fmt).join("L")}Z`);
        }
        for (let levelIndex = 0; levelIndex < contourLevels.length; levelIndex++) {
          const level = contourLevels[levelIndex];
          if (level <= min || level >= max) continue;
          const intersections = [];
          for (let edge = 0; edge < 3; edge++) {
            const first = triangle[edge], last = triangle[(edge + 1) % 3];
            if (first.height < level === last.height < level) continue;
            const t = (level - first.height) / (last.height - first.height);
            intersections.push({ row: first.row + (last.row - first.row) * t, column: first.column + (last.column - first.column) * t });
          }
          if (intersections.length === 2) {
            lines[levelIndex].push(`M${fmt(intersections[0])}L${fmt(intersections[1])}`);
            lineSegments[levelIndex].push(intersections);
          }
        }
      }
      return {
        terrainBands: bandPaths.map((paths, index) => ({ d: paths.join(""), fill: colours[index], elevation: M.round(levels[index]) })).filter((band) => band.d),
        contours: lines.map((paths, index) => ({
          d: paths.join(""),
          elevation: contourLevels[index],
          major: index % 4 === 0,
          anchor: lineSegments[index][M.floor(lineSegments[index].length * 0.47)]?.[0]
        })).filter((line) => line.d),
        hillshade: shadePaths.map((paths, index) => ({
          d: paths.join(""),
          fill: index < 16 ? "#52675e" : "#ffffff",
          opacity: index < 16 ? (16 - index) * 0.021 : (index - 16) * 0.024
        })).filter((p) => p.d && p.opacity),
        elevationRange: { minimum: M.round(minimum), maximum: M.round(maximum), interval },
        waterArea: waterPaths.join(""),
        dryArea: dryGroundPath(dryPaths)
      };
    }
    function fields(recipe, surface, slopes, metric, channels, seed) {
      const SIZE = surface.rows;
      const roads = recipe.transport.corridors.filter((r2) => r2.kind === "road" && r2.points.length > 1), c = recipe.location, r = recipe.urban.radiusKm, b = surface.bounds;
      const local = (p) => ({ x: (p.column - c.column) * metric.column, y: (p.row - c.row) * metric.row });
      const world = (p) => ({ column: c.column + p.x / metric.column, row: c.row + p.y / metric.row });
      const box = {
        west: (b.west - c.column) * metric.column,
        east: (b.east - c.column) * metric.column,
        north: (b.north - c.row) * metric.row,
        south: (b.south - c.row) * metric.row
      };
      const form = recipe.localSite?.form || landform(recipe, { bounds: b, gridCellKilometres: metric, rows: surface.rows, columns: surface.columns, elevationMetres: surface.elevationMetres });
      const check = (p) => {
        if (p.column < b.west || p.column > b.east || p.row < b.north || p.row > b.south) return false;
        const s = sample(slopes, SIZE, SIZE, b, p.row, p.column), q = local(p), along = q.x * M.cos(form.axisRadians) + q.y * M.sin(form.axisRadians), across = -q.x * M.sin(form.axisRadians) + q.y * M.cos(form.axisRadians);
        return isDry(surface, p) && s < 0.16 && M.hypot(along / (form.alongScale * r), across / (form.crossScale * r)) > 1.12 && !channels.some((ch) => {
          const near = distanceToLine(p, ch.points, metric);
          return near.distance < near.widthMetres / 2e3 + 0.035;
        }) && !roads.some((road) => distanceToLine(p, road.points, metric).distance < 0.018);
      };
      const clip = (polygon, nx, ny, d) => {
        const out = [];
        for (let i = 0; i < polygon.length; i++) {
          const a = polygon[i], z = polygon[(i + 1) % polygon.length], da = d - a.x * nx - a.y * ny, dz = d - z.x * nx - z.y * ny;
          if (da >= 0) out.push(a);
          if (da >= 0 !== dz >= 0) {
            const t = da / (da - dz);
            out.push({ x: a.x + (z.x - a.x) * t, y: a.y + (z.y - a.y) * t });
          }
        }
        return out;
      };
      const area = (p) => M.abs(p.reduce((s, a, i) => {
        const z = p[(i + 1) % p.length];
        return s + a.x * z.y - z.x * a.y;
      }, 0)) / 2;
      const centre = (p) => ({ x: p.reduce((s, a) => s + a.x, 0) / p.length, y: p.reduce((s, a) => s + a.y, 0) / p.length });
      const sites = [], limit = recipe.population?.estimate < 1800 ? 52 : 115;
      for (let trial = 0; trial < 900 && sites.length < limit; trial++) {
        const q = { x: box.west + (box.east - box.west) * random(seed, 7e4 + trial * 3), y: box.north + (box.south - box.north) * random(seed, 70001 + trial * 3) }, p = world(q);
        const spacing = clamp(r * 0.22, 0.17, 0.55) * (0.65 + random(seed, 70002 + trial * 3));
        if (sites.some((a) => M.hypot(a.x - q.x, a.y - q.y) < spacing)) continue;
        sites.push(q);
      }
      const results = [];
      for (let holding = 0; holding < sites.length; holding++) {
        const a = sites[holding], p = world(a);
        if (!check(p)) continue;
        const roadDistance = M.min(...roads.map((road) => distanceToLine(p, road.points, metric).distance));
        if (roadDistance > M.max(0.6, r * 0.85)) continue;
        const fertility = M.sin(a.x / (r * 0.65 + 0.2) + random(seed, 811) * 6) * M.cos(a.y / (r * 0.47 + 0.3) - random(seed, 812) * 6);
        let polygon = [{ x: box.west, y: box.north }, { x: box.east, y: box.north }, { x: box.east, y: box.south }, { x: box.west, y: box.south }];
        for (let j = 0; j < sites.length && polygon.length >= 3; j++) if (j !== holding) {
          const z = sites[j];
          polygon = clip(polygon, z.x - a.x, z.y - a.y, (z.x * z.x + z.y * z.y - a.x * a.x - a.y * a.y) / 2);
        }
        if (polygon.length < 3) continue;
        const slope = sample(slopes, SIZE, SIZE, b, p.row, p.column), delta = 0.03, gx = sample(surface.elevationMetres, SIZE, SIZE, b, p.row, p.column + delta / metric.column) - sample(surface.elevationMetres, SIZE, SIZE, b, p.row, p.column - delta / metric.column), gy = sample(surface.elevationMetres, SIZE, SIZE, b, p.row + delta / metric.row, p.column) - sample(surface.elevationMetres, SIZE, SIZE, b, p.row - delta / metric.row, p.column);
        const target = clamp(r * r * 0.028, 0.05, 0.16) * (0.7 + random(seed, holding + 75e3) * 1), parcels = [];
        const divide = (poly, depth, salt) => {
          if (depth > 9 || area(poly) < target) {
            parcels.push(poly);
            return;
          }
          const xs = poly.map((p2) => p2.x), ys = poly.map((p2) => p2.y), angle = (M.max(...xs) - M.min(...xs) > M.max(...ys) - M.min(...ys) ? 0 : M.PI / 2) + (random(seed, salt) - 0.5) * 0.7, nx = M.cos(angle), ny = M.sin(angle), v = poly.map((p2) => p2.x * nx + p2.y * ny), d = M.min(...v) + (M.max(...v) - M.min(...v)) * (0.4 + random(seed, salt + 1) * 0.2), first = clip(poly, nx, ny, d), second = clip(poly, -nx, -ny, -d);
          if (first.length < 3 || second.length < 3) {
            parcels.push(poly);
            return;
          }
          divide(first, depth + 1, salt * 2 + 1);
          divide(second, depth + 1, salt * 2 + 2);
        };
        divide(polygon, 0, 76e3 + holding * 83);
        const quota = M.max(8, M.floor(1100 / sites.length));
        const selected = parcels.map((poly, i) => ({ poly, score: random(seed, holding * 2048 + i + 91e3) })).sort((a2, b2) => a2.score - b2.score).slice(0, quota).map((p2) => p2.poly);
        for (let index = 0; index < selected.length; index++) {
          let poly = selected[index];
          const mid = centre(poly), use = M.sin(mid.x / (r * 0.65 + 0.2) + random(seed, 811) * 6) * M.cos(mid.y / (r * 0.47 + 0.3) - random(seed, 812) * 6) + M.sin(mid.x / (r * 0.19 + 0.16) - mid.y / (r * 0.27 + 0.18)) * 0.32;
          if (use < -0.32 || random(seed, holding * 71 + index + 74e3) < 0.11) continue;
          const perimeter = poly.reduce((s, a2, i) => s + M.hypot(a2.x - poly[(i + 1) % poly.length].x, a2.y - poly[(i + 1) % poly.length].y), 0);
          if (area(poly) < 7e-3 || area(poly) / (perimeter * perimeter) < 0.035) continue;
          const midWorld = world(mid), localSlope = sample(slopes, SIZE, SIZE, b, midWorld.row, midWorld.column), dx = sample(surface.elevationMetres, SIZE, SIZE, b, midWorld.row, midWorld.column + delta / metric.column) - sample(surface.elevationMetres, SIZE, SIZE, b, midWorld.row, midWorld.column - delta / metric.column), dy = sample(surface.elevationMetres, SIZE, SIZE, b, midWorld.row + delta / metric.row, midWorld.column) - sample(surface.elevationMetres, SIZE, SIZE, b, midWorld.row - delta / metric.row, midWorld.column);
          const terrace = localSlope > 0.028;
          const theta = terrace ? M.atan2(dx, -dy) : random(seed, holding + index + 78e3) * M.PI, ux = M.cos(theta), uy = M.sin(theta), vx = -uy, vy = ux;
          const contour = (level) => {
            const projected2 = poly.map((q) => ({ x: q.x * ux + q.y * uy, y: q.x * vx + q.y * vy })), lo = M.min(...projected2.map((q) => q.x)), hi = M.max(...projected2.map((q) => q.x)), out = [];
            const count2 = M.max(8, M.ceil((hi - lo) / 0.025));
            for (let k = 1; k < count2; k++) {
              const x = lo + (hi - lo) * k / count2, cuts = [];
              for (let j = 0; j < projected2.length; j++) {
                const a2 = projected2[j], z = projected2[(j + 1) % projected2.length];
                if (a2.x > x !== z.x > x) cuts.push(a2.y + (z.y - a2.y) * (x - a2.x) / (z.x - a2.x));
              }
              if (cuts.length !== 2) continue;
              cuts.sort((a2, b2) => a2 - b2);
              let low2 = cuts[0], high2 = cuts[1];
              const at = (y) => ({ x: x * ux + y * vx, y: x * uy + y * vy }), height = (y) => elevationAt(surface, world(at(y))), za = height(low2), zb = height(high2);
              if (level < M.min(za, zb) || level > M.max(za, zb)) continue;
              for (let step = 0; step < 17; step++) {
                const y = (low2 + high2) / 2;
                if (height(y) < level === za < zb) low2 = y;
                else high2 = y;
              }
              out.push(at((low2 + high2) / 2));
            }
            return out;
          };
          let rowLevels = [];
          if (terrace) {
            const heights = poly.map((q) => elevationAt(surface, world(q))), lo = M.min(...heights), hi = M.max(...heights), middle = elevationAt(surface, midWorld), rise = clamp(localSlope * 70, 1.8, 5), bottom = M.max(lo, middle - rise * 0.5), top = M.min(hi, middle + rise * 0.5), lower = contour(bottom), upper = contour(top);
            if (lower.length < 4 || upper.length < 4) continue;
            const strip = [...lower, ...upper.reverse()];
            if (area(strip) < 4e-3) continue;
            poly = strip;
            rowLevels = [0.25, 0.5, 0.75].map((t) => bottom + (top - bottom) * t);
          }
          const border = poly.map((q) => ({ x: mid.x + (q.x - mid.x) * 0.985, y: mid.y + (q.y - mid.y) * 0.985 })), outline = [];
          for (let edge = 0; edge < border.length; edge++) {
            const a2 = border[edge], z = border[(edge + 1) % border.length];
            outline.push(a2);
            for (const fraction of terrace ? [] : [0.33, 0.67]) {
              const p2 = { x: a2.x + (z.x - a2.x) * fraction, y: a2.y + (z.y - a2.y) * fraction }, amount = 1e-3 + random(seed, holding * 201 + index * 23 + edge) * 3e-3, dx2 = mid.x - p2.x, dy2 = mid.y - p2.y, len = M.hypot(dx2, dy2) || 1;
              outline.push({ x: p2.x + dx2 / len * amount, y: p2.y + dy2 / len * amount });
            }
          }
          const points = outline.map(world);
          if (!points.every(check) || !check(world(mid))) continue;
          let safe = true;
          for (let i = 0; i < points.length && safe; i++) {
            const a2 = points[i], z = points[(i + 1) % points.length], length = M.hypot((a2.column - z.column) * metric.column, (a2.row - z.row) * metric.row);
            for (let t = 0.12; t < length; t += 0.12) if (!check(interpolate(a2, z, t / length))) {
              safe = false;
              break;
            }
          }
          if (!safe) continue;
          const intersects = (a2, z, p2, q) => {
            const dx2 = z.column - a2.column, dy2 = z.row - a2.row, sx = q.column - p2.column, sy = q.row - p2.row, den = dx2 * sy - dy2 * sx;
            if (M.abs(den) < 1e-12) return false;
            const t = ((p2.column - a2.column) * sy - (p2.row - a2.row) * sx) / den, u = ((p2.column - a2.column) * dy2 - (p2.row - a2.row) * dx2) / den;
            return t >= 0 && t <= 1 && u >= 0 && u <= 1;
          };
          if (roads.some((road) => road.points.some((p2) => {
            const q = local(p2);
            return poly.length >= 3 && poly.reduce((hit, a2, i) => {
              const z = poly[(i + 1) % poly.length];
              return a2.y > q.y !== z.y > q.y && q.x < (z.x - a2.x) * (q.y - a2.y) / (z.y - a2.y) + a2.x ? !hit : hit;
            }, false);
          }) || road.points.slice(1).some((q, j) => points.some((p2, i) => intersects(p2, points[(i + 1) % points.length], road.points[j], q))))) continue;
          const kind = use < -0.08 ? "meadow" : terrace ? "terrace" : random(seed, holding * 37 + index + 77e3) < 0.16 ? "orchard" : "field";
          const projected = poly.map((q) => ({ x: q.x * ux + q.y * uy, y: q.x * vx + q.y * vy })), low = M.min(...projected.map((q) => q.y)), high = M.max(...projected.map((q) => q.y)), lines = [];
          if (terrace && kind !== "meadow") for (const level of rowLevels) {
            const line = contour(level);
            if (line.length > 1) lines.push(line.map(world));
          }
          const count = terrace || kind === "meadow" ? 0 : kind === "orchard" ? 3 : 4;
          for (let row = 1; row <= count; row++) {
            const y = low + (high - low) * row / (count + 1), cuts = [];
            for (let i = 0; i < projected.length; i++) {
              const a2 = projected[i], z = projected[(i + 1) % projected.length];
              if (a2.y > y !== z.y > y) cuts.push(a2.x + (z.x - a2.x) * (y - a2.y) / (z.y - a2.y));
            }
            if (cuts.length === 2) lines.push(cuts.sort((a2, b2) => a2 - b2).map((x) => world({ x: x * ux + y * vx, y: x * uy + y * vy })));
          }
          let access = null, best = Infinity;
          for (const road of roads) for (let i = 1; i < road.points.length; i++) {
            const a2 = local(road.points[i - 1]), z = local(road.points[i]), dx2 = z.x - a2.x, dy2 = z.y - a2.y, t = clamp(((mid.x - a2.x) * dx2 + (mid.y - a2.y) * dy2) / (dx2 * dx2 + dy2 * dy2 || 1), 0, 1), q = { x: a2.x + t * dx2, y: a2.y + t * dy2 }, d = M.hypot(q.x - mid.x, q.y - mid.y);
            if (d < best) {
              best = d;
              access = world(q);
            }
          }
          results.push({
            points,
            lines,
            center: world(mid),
            access: [world(mid), access],
            kind,
            slope: localSlope,
            areaKm2: area(poly),
            fill: kind === "meadow" ? "#c8d5b4" : kind === "orchard" ? "#c0cba4" : ["#d5d1aa", "#dce0b9", "#e3ddba", "#d1d9b0"][M.floor(random(seed, holding * 71 + index + 79e3) * 4)]
          });
        }
      }
      return results;
    }
    function landscape(recipe, surface, slopes, coordinates, land, seed, farmland, channels) {
      const SIZE = surface.rows;
      const metric = recipe.urban.gridCellKilometres || { row: 10, column: 10 }, center = recipe.location, radius = recipe.urban.radiusKm;
      const trees = [], rocks = [], woods = [];
      const inside = (p, polygon) => {
        let result = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const a = polygon[i], b = polygon[j];
          if (a.row > p.row !== b.row > p.row && p.column < (b.column - a.column) * (p.row - a.row) / (b.row - a.row) + a.column) result = !result;
        }
        return result;
      };
      const roads = recipe.transport.corridors.filter((r) => r.kind === "road");
      const fieldBoxes = farmland.map((field) => ({
        field,
        boundary: field.points.concat(field.points[0]),
        west: M.min(...field.points.map((p) => p.column)),
        east: M.max(...field.points.map((p) => p.column)),
        north: M.min(...field.points.map((p) => p.row)),
        south: M.max(...field.points.map((p) => p.row))
      }));
      const stepKm = M.min(
        (surface.bounds.east - surface.bounds.west) * metric.column,
        (surface.bounds.south - surface.bounds.north) * metric.row
      ) / (SIZE - 1), fieldCandidates = boundsCandidates(fieldBoxes.map((b) => ({
        west: b.west - stepKm / metric.column,
        east: b.east + stepKm / metric.column,
        north: b.north - stepKm / metric.row,
        south: b.south + stepKm / metric.row
      }))), groundAvailable = (p) => nearest(surface.buildable, SIZE, SIZE, surface.bounds, p) === 1 && M.hypot((p.column - center.column) * metric.column, (p.row - center.row) * metric.row) > radius * 1.12 && !fieldCandidates(polygonBounds([p])).some((i) => {
        const b = fieldBoxes[i];
        return p.column >= b.west && p.column <= b.east && p.row >= b.north && p.row <= b.south && inside(p, b.field.points);
      }), available = (p) => groundAvailable(p) && !roads.some((r) => distanceToLine(p, r.points, metric).distance < 0.07), roadBlocked = new Uint8Array(coordinates.length), riverside = new Uint8Array(coordinates.length);
      const noise = (u, v) => M.sin(u * 19 + random(seed, 90) * 6) * M.cos(v * 15 + random(seed, 91) * 6) + M.sin(u * 31 - v * 24) * 0.35;
      const cover = coordinates.map((p, i) => {
        let value = M.min(
          noise(i % SIZE / (SIZE - 1), M.floor(i / SIZE) / (SIZE - 1)) - 0.5,
          sample(surface.buildable, SIZE, SIZE, surface.bounds, p.row, p.column) - 0.5,
          (M.hypot((p.column - center.column) * metric.column, (p.row - center.row) * metric.row) - radius * 1.12) / stepKm,
          surface.elevationMetres[i] / 10
        );
        if (surface.lakeDepths) value = M.min(value, -surface.lakeDepths[i] / 10);
        for (const road of roads) {
          const distance = distanceToLine(p, road.points, metric).distance;
          value = M.min(value, (distance - 0.07) / stepKm);
          if (distance < 0.07) roadBlocked[i] = 1;
        }
        for (const channel of channels) {
          const near = distanceToLine(p, channel.points, metric);
          value = M.min(value, (near.distance - near.widthMetres / 2e3 - 0.02) / stepKm);
          if (near.distance < 0.18) riverside[i] = 1;
        }
        for (const fieldIndex of fieldCandidates(polygonBounds([p]))) {
          const b = fieldBoxes[fieldIndex];
          if (p.column < b.west - stepKm / metric.column || p.column > b.east + stepKm / metric.column || p.row < b.north - stepKm / metric.row || p.row > b.south + stepKm / metric.row) continue;
          const polygon = b.field.points, distance = distanceToLine(p, b.boundary, metric).distance;
          value = M.min(value, (inside(p, polygon) ? -distance : distance) / stepKm);
        }
        return value;
      });
      const free = coordinates.map((p, i) => land[i] && groundAvailable(p) && !roadBlocked[i]);
      for (let row = 1; row < SIZE - 2; row++) for (let column = 1; column < SIZE - 2; column++) {
        const index = row * SIZE + column;
        for (const triangle of [[index, index + 1, index + SIZE + 1], [index, index + SIZE + 1, index + SIZE]]) {
          if (triangle.every((i) => cover[i] <= 0)) continue;
          const polygon = [];
          for (let edge = 0; edge < 3; edge++) {
            const first = triangle[edge], last = triangle[(edge + 1) % 3], a = coordinates[first], b = coordinates[last], va = cover[first], vb = cover[last];
            if (va > 0) polygon.push(a);
            if (va > 0 !== vb > 0) {
              const t = va / (va - vb);
              polygon.push({ row: a.row + (b.row - a.row) * t, column: a.column + (b.column - a.column) * t });
            }
          }
          if (polygon.length >= 3) woods.push(polygon);
        }
      }
      for (let row = 1; row < SIZE - 2; row++) for (let column = 1; column < SIZE - 2; column++) {
        const index = row * SIZE + column, p = coordinates[index], u = column / (SIZE - 1), v = row / (SIZE - 1);
        if (!free[index]) continue;
        const value = noise(u, v) + (slopes[index] > 0.04 ? 0.25 : 0);
        if (value > 0.3 || riverside[index]) {
          const count = value > 0.5 ? 4 : 2;
          for (let n = 0; n < count; n++) {
            const x = column + (random(seed, index * 9 + n) - 0.5) * 0.85, y = row + (random(seed, index * 9 + n + 4) - 0.5) * 0.85;
            const point = { row: surface.bounds.north + y / (SIZE - 1) * (surface.bounds.south - surface.bounds.north), column: surface.bounds.west + x / (SIZE - 1) * (surface.bounds.east - surface.bounds.west) };
            if (available(point) && trees.length < 5e3) trees.push({ point, radiusMetres: 9 + random(seed, index + n) * 11 });
          }
        } else if (slopes[index] > 0.035 && random(seed, index) < 0.18) rocks.push({ row: p.row, column: p.column });
      }
      return { woodland: woods, trees, rocks };
    }
    function geographicNames(recipe, context, site, metric) {
      const prefix = Array.from(recipe.name || "\u5F53\u5730").slice(0, 3).join(""), result = [], c = recipe.location, f = site.surface, b = f.bounds;
      const SIZE = f.rows;
      const roots = context.nameRoots || [], used = /* @__PURE__ */ new Set();
      const name = (suffix, salt) => {
        if (!roots.length) return prefix + suffix;
        const start = M.floor(random(recipe.seed || 0, salt) * roots.length);
        for (let i = 0; i < roots.length; i++) {
          const candidate = roots[(start + i) % roots.length] + suffix;
          if (!used.has(candidate)) {
            used.add(candidate);
            return candidate;
          }
        }
        throw new RangeError("City landscape name inventory exhausted");
      };
      for (const feature of context.namedFeatures || []) result.push({
        id: "world-" + feature.id,
        name: feature.name,
        kind: feature.kind === "river" ? "river" : "terrain",
        anchor: feature.location,
        priority: 4,
        detailLevel: 0
      });
      for (const [i, ch] of site.channels.entries()) {
        const anchor = ch.points[M.floor(ch.points.length * 0.53)], riverName = name(ch.kind === "river" ? "\u6CB3" : "\u6EAA", 5100 + i);
        result.push({ id: "supply-river-" + i, name: riverName, kind: "river", anchor, priority: 2, detailLevel: 0 });
        ch.name = riverName;
      }
      for (const [i, lake] of site.lakes.entries()) {
        lake.name = name("\u6E56", 5119 + i);
        result.push({ id: "local-lake-" + i, name: lake.name, kind: "river", anchor: lake.anchor, priority: 1, detailLevel: 0 });
      }
      const candidates = [];
      for (let y = 3; y < SIZE - 3; y++) for (let x = 3; x < SIZE - 3; x++) {
        const i = y * SIZE + x, z = f.elevationMetres[i];
        if (z <= site.elevationRange.minimum + 30) continue;
        if ([-SIZE - 1, -SIZE, -SIZE + 1, -1, 1, SIZE - 1, SIZE, SIZE + 1].some((d) => f.elevationMetres[i + d] > z)) continue;
        const p = { row: b.north + y / (SIZE - 1) * (b.south - b.north), column: b.west + x / (SIZE - 1) * (b.east - b.west) };
        if (M.hypot((p.row - c.row) * metric.row, (p.column - c.column) * metric.column) < recipe.urban.radiusKm * 0.9) continue;
        candidates.push({ p, z });
      }
      const peaks = [];
      for (const peak of candidates.sort((a, z) => z.z - a.z)) {
        if (peaks.some((p) => M.hypot((p.p.row - peak.p.row) * metric.row, (p.p.column - peak.p.column) * metric.column) < site.radiusKm * 0.35)) continue;
        peaks.push(peak);
        if (peaks.length === 3) break;
      }
      for (const [i, peak] of peaks.entries()) result.push({
        id: "local-peak-" + i,
        name: name(i === 0 && recipe.culture?.holyReligion?.tradition === "mountain-vow" ? "\u5723\u5C71" : i ? "\u5CAD" : "\u5C71", 5200 + i) + " \xB7 " + M.round(peak.z) + " m",
        kind: "terrain",
        anchor: peak.p,
        priority: 3,
        detailLevel: 0,
        spot: true
      });
      const cells = /* @__PURE__ */ new Map();
      for (const polygon of site.woodland) {
        const p = { row: polygon.reduce((s, p2) => s + p2.row, 0) / polygon.length, column: polygon.reduce((s, p2) => s + p2.column, 0) / polygon.length }, x = M.floor((p.column - b.west) / (b.east - b.west) * (SIZE - 1)), y = M.floor((p.row - b.north) / (b.south - b.north) * (SIZE - 1));
        cells.set(y * SIZE + x, p);
      }
      const woods = [];
      while (cells.size) {
        const first = cells.keys().next().value, queue = [first], points = [];
        cells.delete(first);
        for (let k = 0; k < queue.length; k++) {
          const i = queue[k], x = i % SIZE, y = M.floor(i / SIZE);
          points.push({ row: b.north + (y + 0.5) / (SIZE - 1) * (b.south - b.north), column: b.west + (x + 0.5) / (SIZE - 1) * (b.east - b.west) });
          for (const d of [-1, 1, -SIZE, SIZE]) if (cells.has(i + d)) {
            cells.delete(i + d);
            queue.push(i + d);
          }
        }
        if (points.length > 5) woods.push(points);
      }
      for (const [i, wood] of woods.sort((a, z) => z.length - a.length).slice(0, 4).entries()) {
        const mid = { row: wood.reduce((s, p) => s + p.row, 0) / wood.length, column: wood.reduce((s, p) => s + p.column, 0) / wood.length }, anchor = wood.reduce((a, p) => M.hypot(p.row - mid.row, p.column - mid.column) < M.hypot(a.row - mid.row, a.column - mid.column) ? p : a, wood[0]);
        result.push({ id: "local-wood-" + i, name: name("\u6797", 5300 + i), kind: "forest", anchor, priority: 5, detailLevel: 0 });
      }
      for (const [i, island] of (site.coastal.islands || []).entries()) result.push({ id: "local-island-" + i, name: name("\u5C9B", 5400 + i), kind: "terrain", anchor: island.anchor, priority: 2, detailLevel: 0 });
      for (const [i, line] of site.contours.entries()) if (line.major && line.anchor) result.push({ id: "contour-" + i, name: line.elevation + " m", kind: "elevation", anchor: line.anchor, priority: 8, detailLevel: 0 });
      return result;
    }
    window.WorldAtlasCitySite = { generate, elevationAt, isDry, surfaceTriangles, distanceToChannel: (point, channel, metric) => distanceToLine(point, channel.points, metric) };
  })();
})();
/*! Bundled license information:

polygon-clipping/dist/polygon-clipping.umd.js:
  (**
   * splaytree v3.1.2
   * Fast Splay tree for Node and browser
   *
   * @author Alexander Milevski <info@w8r.name>
   * @license MIT
   * @preserve
   *)
  (*! *****************************************************************************
      Copyright (c) Microsoft Corporation. All rights reserved.
      Licensed under the Apache License, Version 2.0 (the "License"); you may not use
      this file except in compliance with the License. You may obtain a copy of the
      License at http://www.apache.org/licenses/LICENSE-2.0

      THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
      KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
      WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
      MERCHANTABLITY OR NON-INFRINGEMENT.

      See the Apache Version 2.0 License for specific language governing permissions
      and limitations under the License.
      ***************************************************************************** *)
*/
