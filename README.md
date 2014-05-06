# accept-promises

Let them into your heart and/or functions.

## Synopsis

```
var assert = require('assert');
var acceptPromises = require('./');
var Promise = require('bluebird');

var add = acceptPromises(function (a, b) {
  return a + b;
});

var assertIsPromise = function (it) {
  assert(Promise.is(it));
};

assertPromise(add(1, 2));

add(1, 2).then(function (three) {
  assert.equal(3, three);
});

assertPromise(
 add(1, Promise.resolve(2))).then(function (three) {
  assert.equal(3, three);
 })
);
```

In addition to decorating individual functions, there is also a helper for
walking over an object prototype:

```
function Calculator () {}

Calculator.prototype = acceptPromises.mutateMethods({
  add: function (a, b) { return a + b },
  sub: function (a, b) { return a - b },
  mul: function (a, b) { return a * b },
  div: function (a, b) { return a / b }
});
```

## Description

This module exports a function decorator that will wait for all Promise
arguments to a function to settle. This allows you to avoid writing a lot of
`.then` boilerplate in your code, and write things as though they are sync.

## Acknowledgements

This is really just the `bindSync` decorator from [z-core][] pulled out into
it's own module, since it was the only part of `z-core` that I really wanted.

[z-core]: https://github.com/jakobmattsson/z-core

## License

MIT
