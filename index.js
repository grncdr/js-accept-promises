'use strict';

var Promise = require('bluebird');

module.exports = acceptPromises;

function acceptPromises (fn) {
  var slice = Array.prototype.slice;
  return function () {
    var self = this;
    return Promise.all(slice.call(arguments)).then(function (args) {
      return fn.apply(self, args);
    });
  };
}

acceptPromises.mutateMethods = function (object) {
  for (var key in object) {
    if (key !== 'constructor' &&
        object.hasOwnProperty(key) &&
        typeof object[key] == 'function') {
      object[key] = acceptPromises(object[key]);
    }
  }
  return object;
}
