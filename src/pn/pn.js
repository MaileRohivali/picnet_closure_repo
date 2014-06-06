﻿;
goog.provide('pn');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.structs.Set');

////////////////////////////////////////////////////////////////////////////////
// Misc Static Convenience Helpers
////////////////////////////////////////////////////////////////////////////////


/**
 * @param {!goog.array.ArrayLike} args The arguments (or any
 *    array like) object to turn into an array.
 * @return {!Array} The array object from the given arguments object.
 */
pn.toarr = function(args) { return goog.array.clone(args); };


/**
 * @param {function():undefined} ctx A function with a comment containing the
 *    required multiline string.  Example:
 *    pn.ml(function() {/*
 *      This is an
 *      Example of a multi-line
 *      string
 *    * /}) === 'This is an\nExample of a multi-line\nstring'
 * @param {Object=} opt_model The optional model using soy syntax '{$xxx}' for
 *    variables.  Ensure that the model is a dictionary with string keys so
 *    the compiler does not rename hence causing issues in compiled mode.
 * @return {string} A multi line string
 */
pn.ml = function(ctx, opt_model) {
  pn.assFun(ctx);
  // start matching after: comment start block => optional
  // whitespace => newline
  // stop matching before: last newline => optional whitespace => comment
  // end block
  var comments = /\/\*\s*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;
  var str = comments.exec(ctx.toString())[1];
  if (opt_model) {
    for (var k in opt_model) {
      str = str.replace(new RegExp('\\{\\$' + k + '}', 'g'), opt_model[k]);
    }
  }
  return str;
};


/**
 * @param {T} d The disposable object to dispose when ctx is
 *    disposed.
 * @param {!goog.Disposable} ctx The context to use when disposing d.
 * @return {T} The registered disposable.
 * @template T
 */
pn.disp = function(d, ctx) {
  ctx.registerDisposable(d);
  return d;
};

////////////////////////////////////////////////////////////////////////////////
// Assertion Helpers
////////////////////////////////////////////////////////////////////////////////


/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @param {*} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.ass = function(condition, opt_message, var_args) {
  goog.asserts.assert.apply(null, arguments);
};


/**
 * @param {*} val The value to check for the type.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.assStr = function(val, opt_message, var_args) {
  goog.asserts.assertString.apply(null, arguments);
};


/**
 * @param {*} val The value to check for the type.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.assNum = function(val, opt_message, var_args) {
  goog.asserts.assertNumber.apply(null, arguments);
};


/**
 * @param {*} val The value to check for the type.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.assBool = function(val, opt_message, var_args) {
  goog.asserts.assertBoolean.apply(null, arguments);
};


/**
 * @param {*} val The value to check for the type.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.assObj = function(val, opt_message, var_args) {
  goog.asserts.assertObject.apply(null, arguments);
};


/**
 * @param {*} val The value to check for the type.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.assArr = function(val, opt_message, var_args) {
  goog.asserts.assertArray.apply(null, arguments);
};


/**
 * @param {*} val The value to check for the type.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.assFun = function(val, opt_message, var_args) {
  goog.asserts.assertFunction.apply(null, arguments);
};


/**
 * @param {*} val The value to check for the type.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.assDefAndNotNull = function(val, opt_message, var_args) {
  goog.asserts.assert(goog.isDefAndNotNull(val), opt_message, var_args);
};


/**
 * @param {*} val The value to check for the type.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.assDef = function(val, opt_message, var_args) {
  goog.asserts.assert(goog.isDef(val), opt_message, var_args);
};


/**
 * @param {*} val The value to check for isntanceof type.
 * @param {Function} ctor The expected type to do an instanceof check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
pn.assInst = function(val, ctor, opt_message, var_args) {
  goog.asserts.assert(val instanceof ctor, opt_message, var_args);
};


/**
 * @private
 * @param {!*} thiso A referece to the callers 'this' to prepend to the
 *    arguments object.
 * @param {!goog.array.ArrayLike} args The arguments object to prepend 'this'
 *    to.
 * @param {number=} opt_limit Limit the number of args to copy.
 * @return {!Array} The array of the given arguments with this prepended to
 *    the beggining of the array.
 */
pn.aargs_ = function(thiso, args, opt_limit) {
  var arr = [thiso],
      lim = opt_limit > 0 ? opt_limit : args.length;
  for (var i = 0; i < lim; i++) { arr.push(args[i]); }
  return arr;
};

////////////////////////////////////////////////////////////////////////////////
// String prototype enhancements
////////////////////////////////////////////////////////////////////////////////


/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @this {string} The string containing the pattern.
 * @param {...*} var_args The items to substitute into the pattern.
 * @return {string} A copy of {@code str} in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
String.prototype.pnsubs = function(var_args) {
  return goog.string.subs.apply(null, pn.aargs_(this, arguments));
};


/**
 * Fast prefix-checker.
 * @this {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 * @param {boolean=} opt_ignoreCase Wether to ignore case (default false)
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
String.prototype.pnstartsWith = function(prefix, opt_ignoreCase) {
  var fn = !!opt_ignoreCase ?
      goog.string.caseInsensitiveStartsWith :
      goog.string.startsWith;
  return fn.apply(null, pn.aargs_(this, arguments, 1));
};


/**
 * Fast suffix-checker.
 * @this {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @param {boolean=} opt_ignoreCase Wether to ignore case (default false)
 * @return {boolean} True if {@code str} ends with {@code suffix}.
 */
String.prototype.pnendsWith = function(suffix, opt_ignoreCase) {
  var fn = !!opt_ignoreCase ?
      goog.string.caseInsensitiveEndsWith :
      goog.string.endsWith;
  return fn.apply(null, pn.aargs_(this, arguments, 1));
};


/**
 * Case-insensitive equality checker.
 * @this {string} str1 First string to check.
 * @param {string} str2 Second string to check.
 * @return {boolean} True if {@code str1} and {@code str2} are the same string,
 *     ignoring case.
 */
String.prototype.pninsensitiveEquals = function(str2) {
  return goog.string.caseInsensitiveEquals.
      apply(null, pn.aargs_(this, arguments));
};


/**
 * Trims white spaces to the left and right of a string.
 * @this {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
String.prototype.pntrim = function() {
  return goog.string.trim.apply(null, pn.aargs_(this, arguments));
};


/**
 * Trims whitespaces at the left end of a string.
 * @this {string} str The string to left trim.
 * @return {string} A trimmed copy of {@code str}.
 */
String.prototype.pntrimLeft = function() {
  return goog.string.trimLeft.apply(null, pn.aargs_(this, arguments));
};


/**
 * Trims whitespaces at the right end of a string.
 * @this {string} str The string to right trim.
 * @return {string} A trimmed copy of {@code str}.
 */
String.prototype.pntrimRight = function() {
  return goog.string.trimRight.apply(null, pn.aargs_(this, arguments));
};


/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @this {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
String.prototype.pninsensitiveCompare = function(str2) {
  return goog.string.caseInsensitiveCompare.apply(null,
      pn.aargs_(this, arguments));
};


/**
 * A string comparator.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @this {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
String.prototype.pncompare = function(str2) {
  return this === str2 ? 0 : this < str2 ? -1 : 1;
};


/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @this {string} str1 The string to compare in a numerically sensitive way.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
String.prototype.pnnumerateCompare = function(str2) {
  return goog.string.numerateCompare.apply(null,
      pn.aargs_(this, arguments));
};

////////////////////////////////////////////////////////////////////////////////
// Array prototype enhancements
////////////////////////////////////////////////////////////////////////////////


/**
 * @see goog.array.clone
 * @this {Array.<T>} arr  Array or array-like object to clone.
 * @return {!Array.<T>} Clone of the input array.
 * @template T
 */
Array.prototype.pnclone = function() {
  return goog.array.clone(this);
};


/**
 * @see goog.array.concat
 * @this {Array}
 * @param {...*} var_args Items to concatenate.  Arrays will have each item
 *     added, while primitives and objects will be added as is.
 * @return {!Array} The new resultant array.
 */
Array.prototype.pnconcat = function(var_args) {
  return goog.array.concat.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.map
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):?} f The function to call for every
 *     element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return something. The result will be inserted into a new array.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array with the results from f.
 * @template T,S
 */
Array.prototype.pnmap = function(f, opt_obj) {
  return goog.array.map.apply(null, pn.aargs_(this, arguments));
};


/**
 * A LINQ SelectMany style mapper
 * @see goog.array.map
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {function(this:S, T, number):!Array.<R>} f The function to call
 *    for every element. This function
 *    takes 3 arguments (the element, the index and the array) and should
 *    return something. The result will be appended into a new array.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array.<R>} a new array with the results from f.
 * @template T,S,R
 */
Array.prototype.pnmapMany = function(f, opt_obj) {
  var manys = [];
  goog.array.forEach(this, function(e, idx) {
    var sub = f(e, idx);
    manys = manys.pnconcat(sub);
  });
  return manys;
};


/**
 * @see goog.array.forEach
 * @this {Array.<T>} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element.
 *     This function takes 3 arguments (the element, the index and the array).
 *     The return value is ignored. The function is called only for indexes of
 *     the array which have assigned values; it is not called for indexes which
 *     have been deleted or which have never been assigned values.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array.<T>} The current array for chaining
 *    convenience.
 * @template T,S
 */
Array.prototype.pnforEach = function(f, opt_obj) {
  goog.array.forEach.apply(null, pn.aargs_(this, arguments));
  return this;
};


/**
 * @see goog.array.filter
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array in which only elements that passed the test are
 *     present.
 * @template T,S
 */
Array.prototype.pnfilter = function(f, opt_obj) {
  return goog.array.filter.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.filter
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {number} The length of the given array after applying the specified
 *    filter (if any).
 * @template T,S
 */
Array.prototype.pncount = function(f, opt_obj) {
  return goog.isFunction(f) ?
      goog.array.filter.apply(null, pn.aargs_(this, arguments)).length :
      this.length;
};


/**
 * @see goog.array.reduce
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, R, T, number, ?) : R} f The function to call for
 *     every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {?=} opt_val The initial value to pass into the function on the
 *    first call.  This defaults to 0 if not specified.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {R} Result of evaluating f repeatedly across the values of the array.
 * @template T,S,R
 */
Array.prototype.pnreduce = function(f, opt_val, opt_obj) {
  var args = pn.aargs_(this, arguments);
  if (args.length === 2) args.push(0); // Default to 0 for val.
  return goog.array.reduce.apply(null, args);
};


/**
 * @see goog.array.every
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} false if any element fails the test.
 * @template T,S
 */
Array.prototype.pnall = function(f, opt_obj) {
  return goog.array.every.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.findIndex
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {boolean} Wether any element in the array matches the specified
 *    filter.
 * @template T,S
 */
Array.prototype.pnany = function(f, opt_obj) {
  return goog.array.findIndex.apply(null, pn.aargs_(this, arguments)) >= 0;
};


/**
 * @see goog.array.filter
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean=} opt_f The function to
 *     call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!T} The only matching element or an error is thrown.
 * @template T,S
 */
Array.prototype.pnsingle = function(opt_f, opt_obj) {
  var arr = this;
  if (arguments.length) { arr = this.pnfilter.apply(this, arguments); }
  if (arr.length !== 1) {
    throw new Error('Expected single match got: ' + arr.length);
  }
  return arr[0];
};


/**
 * @see goog.array.filter
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean=} opt_f The function to
 *     call for every element. This function takes 3 arguments (the element,
 *     the index and the array) and must return a Boolean. If the return value
 *     is true the element is added to the result array. If it is false the
 *     element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!T} The only matching element or an error is thrown if nore than 1.
 * @template T,S
 */
Array.prototype.pnsingleOrNull = function(opt_f, opt_obj) {
  var arr = this;
  if (arguments.length) { arr = this.pnfilter.apply(this, arguments); }
  if (arr.length > 1) {
    throw new Error('Expected single match got: ' + arr.length);
  }
  return arr.length === 0 ? null : arr[0];
};


/**
 * @see goog.array.filter
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean=} opt_f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {T} The first matching element or an Error if no matching elements.
 * @template T,S
 */
Array.prototype.pnfirstOrNull = function(opt_f, opt_obj) {
  var arr = this;
  if (arguments.length) { arr = this.pnfilter.apply(this, arguments); }
  if (arr.length < 1) return null;
  return arr[0];
};


/**
 * @see goog.array.filter
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean=} opt_f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {T} The first matching element or an Error if no matching elements.
 * @template T,S
 */
Array.prototype.pnfirst = function(opt_f, opt_obj) {
  var arr = this;
  if (arguments.length) { arr = this.pnfilter.apply(this, arguments); }
  if (arr.length < 1) throw new Error('Expected at least one element');
  return arr[0];
};


/**
 * @see goog.array.filter
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean=} opt_f The function to
 *     call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {T} The last machine element or Error.
 * @template T,S
 */
Array.prototype.pnlastOrNull = function(opt_f, opt_obj) {
  var arr = this;
  if (arguments.length) { arr = this.pnfilter.apply(this, arguments); }
  if (arr.length < 1) return null;
  return arr[arr.length - 1];
};


/**
 * @see goog.array.filter
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean=} opt_f The function to call
 *     for element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {T} The last machine element or Error.
 * @template T,S
 */
Array.prototype.pnlast = function(opt_f, opt_obj) {
  var arr = this;
  if (arguments.length) { arr = this.pnfilter.apply(this, arguments); }
  if (arr.length < 1) throw new Error('Expected at least one element');
  return arr[arr.length - 1];
};


/**
 * @see goog.array.equals
 * @this {Array} arr1 The first array to compare.
 * @param {goog.array.ArrayLike} arr2 The second array to compare.
 * @param {Function=} opt_equalsFn Optional comparison function.
 *     Should take 2 arguments to compare, and return true if the arguments
 *     are equal. Defaults to {@link goog.array.defaultCompareEquality} which
 *     compares the elements using the built-in '===' operator.
 * @return {boolean} Whether the two arrays are equal.
 */
Array.prototype.pnequals = function(arr2, opt_equalsFn) {
  return goog.array.equals.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.contains
 * @this {Array} arr The array to test for the presence of the
 *     element.
 * @param {*} obj The object for which to test.
 * @return {boolean} true if obj is present.
 */
Array.prototype.pncontains = function(obj) {
  return goog.array.contains.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.find
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {T} The first array element that passes the test, or null if no
 *     element is found.
 * @template T,S
 */
Array.prototype.pnfind = function(f, opt_obj) {
  return goog.array.find.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.findIndex
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the first array element that passes the test,
 *     or -1 if no element is found.
 * @template T,S
 */
Array.prototype.pnfindIndex = function(f, opt_obj) {
  return goog.array.findIndex.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.findIndex
 * @this {Array} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at index 0.
 * @return {number} The index of the first matching array element.
 */
Array.prototype.pnindexOf = function(obj, opt_fromIndex) {
  return goog.array.indexOf.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.reduce
 * @this {Array} arr The array to test.
 * @return {boolean} true if empty.
 */
Array.prototype.pnisEmpty = function() {
  return goog.array.isEmpty.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.zip
 * @this {Array}
 * @param {...goog.array.ArrayLike} var_args Arrays to be combined.
 * @return {!Array.<!Array>} A new array of arrays created from provided arrays.
 */
Array.prototype.pnzip = function(var_args) {
  return goog.array.zip.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.sort
 * @this {Array.<T>} arr The array to be sorted.
 * @param {?function(T,T):number=} opt_compareFn Optional comparison
 *     function by which the
 *     array is to be ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {!Array.<T>} A reference to self array.
 * @template T
 */
Array.prototype.pnsort = function(opt_compareFn) {
  goog.array.sort.apply(null, pn.aargs_(this, arguments));
  return this;
};


/**
 * @see goog.array.sortObjectsByKey
 * @this {Array.<T>} arr An array of objects to sort.
 * @param {string} key The object key to sort by.
 * @param {Function=} opt_compareFn The function to use to compare key
 *     values.
 * @return {!Array.<T>} A reference to self array.
 * @template T
 */
Array.prototype.pnsortObjectsByKey = function(key, opt_compareFn) {
  goog.array.sortObjectsByKey.apply(null, pn.aargs_(this, arguments));
  return this;
};


/**
 * @see goog.array.remove
 * Removes the first occurrence of a particular value from an array.
 * @this {Array} The array from which to remove the specified item.
 * @param {*} obj Object to remove.
 * @return {boolean} True if an element was removed.
 */
Array.prototype.pnremove = function(obj) {
  return goog.array.remove.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.array.removeDuplicates
 * @this {!Array.<T>} arr The array from which to remove duplicates.
 * @param {Array=} opt_rv An optional array in which to return the results,
 *     instead of performing the removal inplace.  If specified, the original
 *     array will remain unchanged.
 * @return {!Array.<T>} A reference to self array.
 * @template T
 */
Array.prototype.pnremoveDuplicates = function(opt_rv) {
  goog.array.removeDuplicates.apply(null, pn.aargs_(this, arguments));
  return this;
};


/**
 * @see goog.array.removeDuplicates
 * @this {!Array.<T>} arr The array from which to remove duplicates.
 * @param {string} key The object property to use as the duplicate comparer.
 * @return {!Array.<T>} A reference to self array.
 * @template T
 */
Array.prototype.pnremoveDuplicatesByKey = function(key) {
  var added = {};
  return this.pnfilter(function(e) {
    var k = e[key];
    if (k in added) return false;
    added[k] = true;
    return true;
  });
};


/**
 * @this {Array.<T>|goog.array.ArrayLike} arr The array to reverse.
 * @return {!Array.<T>} The reversed array.
 * @template T
 */
Array.prototype.pnreverse = function() {
  var arr = this.slice();
  arr.reverse();
  return arr;
};


/**
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {number} n The number of items to skip.
 * @return {!Array.<T>} The new array with skipped items.
 * @template T,S
 */
Array.prototype.pnskip = function(n) {
  return this.pnfilter(function(e, idx) { return idx >= n; });
};


/**
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {number} n The number of items to take.
 * @return {!Array.<T>} The new array with n items.
 * @template T,S
 */
Array.prototype.pntake = function(n) {
  return this.pnfilter(function(e, idx) { return idx < n; });
};


/**
 * @this {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {function(T,number):string=} opt_key An optional function that
 *    takes the array item and index and returns the key for this map. If this
 *    is not specified its assumed that the value at the array is the key
 *    (must be a string).
 * @param {function(T,number):*=} opt_value A function that takes the array item
 *    and index and returns the value for this map (if null the item is used).
 * @return {!Object.<*>} The new map.
 * @template T
 */
Array.prototype.pntoMap = function(opt_key, opt_value) {
  var map = {};
  this.pnreduce(function(acc, item, idx) {
    var id = opt_key ? opt_key(item, idx) : item;
    pn.assStr(id, 'Expected a string id: %s', id);
    pn.ass(map[id] === undefined, 'Map already contains key %s', id);
    map[id] = opt_value ? opt_value(item, idx) : item;
  });
  return map;
};


/**
 * @this {Array.<T>} arr Array over which to iterate.
 * @param {!Array.<T>} arr2 A second array to remove from the first.
 * @return {!Array.<T>} A new array with items from arr2 removed from this
 *    array.
 * @template T
 */
Array.prototype.pnexcept = function(arr2) {
  pn.assArr(arr2);
  return new goog.structs.Set(this).difference(arr2).getValues();
};


/**
 * @this {Array.<T>} arr Array over which to iterate.
 * @param {!Array.<T>} arr2 A second array to join to the first.
 * @return {!Array.<T>} A new array with items from both arrays but no
 *    duplicates
 * @template T
 */
Array.prototype.pnunion = function(arr2) {
  pn.assArr(arr2);
  var s = new goog.structs.Set(this);
  s.addAll(arr2);
  return s.getValues();
};


/**
 * @this {Array} arr Array over which to iterate.
 * @param {!Array} largerarray The array which we want to check contains all
 *    elements in this array.  I.e. This is the superset array.
 * @return {boolean} Wether 'this' is a subset of the passed in argument.
 */
Array.prototype.pnissubset = function(largerarray) {
  pn.assArr(largerarray);
  return new goog.structs.Set(this).isSubsetOf(largerarray);
};


/**
 * @this {Array.<T>} arr Array over which to iterate.
 * @param {!Array.<T>} arr2 A second array to find the common values with.
 * @return {!Array.<T>} A new array with common items from both arrays.
 * @template T
 */
Array.prototype.pnintersect = function(arr2) {
  pn.assArr(arr2);
  return new goog.structs.Set(this).intersection(arr2).getValues();
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {*} value The value to repeat.
 * @param {number} n The repeat count.
 * @return {!Array} An array with the repeated value.
 */
pn.repeat = function(value, n) {
  pn.assDef(value);
  pn.assNum(n);

  return goog.array.repeat(value, n);
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {number} start The starting item in the range.
 * @param {number} stop The last item in the range.
 * @param {number=} opt_step The step size.
 * @return {!Array} An array with the specified range.
 */
pn.range = function(start, stop, opt_step) {
  pn.assNum(start);
  pn.assNum(stop);

  var step = opt_step || (start > stop ? -1 : 1);
  if (step > 0) pn.ass(stop >= start);
  else pn.ass(stop < start);

  var result = [];
  for (var i = start; step > 0 ? i <= stop : i >= stop; i += step) {
    result.push(i);
  }
  return result;
};

////////////////////////////////////////////////////////////////////////////////
// Function prototype enhancements
////////////////////////////////////////////////////////////////////////////////


/**
 * @see goog.bind
 * @this {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} See above.
 */
Function.prototype.pnbind = function(selfObj, var_args) {
  return goog.bind.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.partial
 * @this {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
Function.prototype.pnpartial = function(var_args) {
  return goog.partial.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.functions.compose
 * @this {Function} The initial function to add to the composition.
 * @param {...Function} var_args A list of functions.
 * @return {!Function} The composition of all inputs.
 */
Function.prototype.pncompose = function(var_args) {
  var args = pn.aargs_(this, arguments).pnreverse();
  return goog.functions.compose.apply(null, args);
};


/**
 * @see goog.functions.and
 * @this {Function} The initial function to include in the test.
 * @param {...Function} var_args A list of functions.
 * @return {!Function} A function that ANDs its component functions.
 */
Function.prototype.pnand = function(var_args) {
  return goog.functions.and.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.functions.not
 * @this {Function} The initial function to include in the test.
 * @param {!Function} f The original function.
 * @return {!Function} A function that delegates to f and returns opposite.
 */
Function.prototype.pnnot = function(f) {
  return goog.functions.not.apply(null, pn.aargs_(this, arguments));
};


/**
 * @see goog.functions.or
 * @this {Function} The initial function to include in the test.
 * @param {...Function} var_args A list of functions.
 * @return {!Function} A function that ORs its component functions.
 */
Function.prototype.pnor = function(var_args) {
  return goog.functions.or.apply(null, pn.aargs_(this, arguments));
};


/**
 * @this {Function} The function whose arguments we will flip
 * @return {!Function} A function with flipped arguments.
 */
Function.prototype.pnflip = function() {
  var f = this;
  return function() {
    var args = Array.prototype.slice.call(arguments);
    return f.apply(this, args.reverse());
  };
};
