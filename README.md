# accept-promises

Let them into your heart and/or functions.

## Synopsis

```javascript
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

```javascript
function Calculator () {}

Calculator.prototype = acceptPromises.mutateMethods({
  add: function (a, b) { return a + b },
  sub: function (a, b) { return a - b },
  mul: function (a, b) { return a * b },
  div: function (a, b) { return a / b }
});
```

## Description

This module exports a function decorator that will wait for all Promise arguments to a function to settle. This allows you to avoid writing a lot of `.then` boilerplate in your code, and write things as though they are sync.

## OMG that example sucks! Using promises for adding numbers WTF!?

Ok, so you're unconvinced that you might want to decorate a method (or all methods) to accept promises. Here's where I half-assedly attempt to convince you. A more thorough presentation by @jakobmattsson using his [`z`](https://github.com/jakobmattsson/z-core) library (where I first saw this idea) is online [here](https://github.com/jakobmattsson/z-presentation). 

First, let's assume your program communicates with two remote services: an `AuthenticationService` where we send credentials and receive user details, and a `UsageMeteringService` that provides rate-limiting.

In the regular node callback style, we might have a function like this:

```javascript
function wrapHandler (authenticate, getUsage, originalHandler) {
  return function wrapped (credentials, params, callback) {
    authenticate(credentials, function (err, user) {
      if (err) callback(err);
      else getUsage(user, function (err, usage) {
        if (err) callback(err);
        else if (usage.allowed) {
          params.user = user;
          originalHandler(params, callback);
        } else {
          callback(new Error("Rate limit exceeded"));
        }
      });
    })
  }
}
```

That's not too bad, but the `if (err) callback(err)` idiom can be a bit noisy and error-prone. I need to remember to put `else` before `getUsage`, or `return callback(err)`. I am also not protected from exceptions thrown by `callback` or `originalHandler`. This sort of error-handling is where promises really excel, so let's rewrite our example assuming that our services return [bluebird](https://github.com/petkaantonov/bluebird) promises:

```javascript
function wrapHandler (authenticate, getUsage, originalHandler) {
  return function wrapped (credentials, params, callback) {
    return authenticate(credentials).then(function (user) {
      return getUsage(user).then(function (usage) {
        if (usage.allowed) {
          params.user = user;
          return originalHandler(params);
        } else {
          throw new Error("Rate limit exceeded");
        }
      })
    }).nodeify(callback); // use callback if present
  }
}
```

Nice. That looks a little cleaner, and safer in terms of exception handling, but it's still essentially the same form. The problem is that the nesting of the `getUsage` call inside the callback to `authenticate` makes it difficult to refactor that code. What `acceptPromises` does is remove this bit of `.then` boilerplate:

```javascript
var acceptPromises = require('accept-promises');

function wrapHandler (authenticate, getUsage, originalHandler) {
  getUsage = acceptPromises(getUsage);
  return function wrapped (credentials, params, callback) {
    var user = authenticate(credentials);
    return getUsage(user).then(function (usage) {
      if (usage.allowed) {
        // safe to get the value from this promise, because it will be
        // resolved before getUsage runs.
        params.user = user.value();
        return originalHandler(params);
      } else {
        throw new Error("Rate limit exceeded");
      }
    }).nodeify(callback);
  }
}
```

but `acceptPromises` allows to separate and refactor this code even more cleanly:

```javascript
var acceptPromises = require('accept-promises');

function wrapHandler (authenticate, getUsage, originalHandler) {
  getUsage = acceptPromises(getUsage);
  return function wrapped (credentials, params, callback) {
    var user = authenticate(credentials);
    var usage = getUsage(user);
    return checkUsage(user, usage, params).then(originalHandler).nodeify(callback);
  }
}


var checkUsage = acceptPromises(function (user, usage, params) {
  if (usage.allowed) {
    params.user = user;
    return params;
  } else {
    throw new Error("Rate limit exceeded");
  }
});
```

## Acknowledgements

This is really just the `bindSync` decorator from [z-core][] pulled out into
it's own module, since it was the only part of `z-core` that I wanted.

[z-core]: https://github.com/jakobmattsson/z-core

## License

MIT
