// Load modules

var lab = require('lab');
var fs = require('fs');

var expect = lab.expect;
var before = lab.before;
var after = lab.after;
var describe = lab.experiment;
var it = lab.test;

describe('Timing', function () {
  describe('#test', function () {
    it('runs a dumb test', function (done) {
      expect(true);

      done();
    });
  });
});
