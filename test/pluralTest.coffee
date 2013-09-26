plural = require '../lib/plural'
mocha = require 'mocha'
chai = require 'chai'
chai.should()

describe 'Plural', ->
  describe '#number', ->
    it 'should be singular for 1', ->
      plural.number(1, 'hour').should.equal("1 hour")

    it 'should be plural for 2', ->
      plural.number(2, 'hour').should.equal("2 hours")

    it 'should be plural for 0', ->
      plural.number(0, 'hour').should.equal("0 hours")

    it 'should be plural and positive for -2', ->
      plural.number(-2, 'hour').should.equal("2 hours")

    it 'should be plural and positive for -2000', ->
      plural.number(-2000, 'hour').should.equal("2000 hours")

    it 'should be plural and negative for -2 with absolute mode turned off', ->
      plural.forceAbsoluteNumbers = false
      plural.number(-2, 'hour').should.equal("-2 hours")
      plural.forceAbsoluteNumbers = true

    it 'should be singular and negative for -1 with absolute mode turned off', ->
      plural.forceAbsoluteNumbers = false
      plural.number(-1, 'hour').should.equal("-1 hour")
      plural.forceAbsoluteNumbers = true


  describe '#hours', ->
    it 'should be singular for 1', ->
      plural.hours(1).should.equal("1 hour")

    it 'should be plural for 4', ->
      plural.hours(4).should.equal("4 hours")

  describe '#minutes', ->
    it 'should be singular for 1', ->
      plural.minutes(1).should.equal("1 minute")

    it 'should be plural for 4', ->
      plural.minutes(4).should.equal("4 minutes")
