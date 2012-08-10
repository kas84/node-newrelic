'use strict';

var path         = require('path')
  , chai         = require('chai')
  , should       = chai.should()
  , trace        = require(path.join(__dirname, '..', 'lib', 'trace'))
  , Tracer       = require(path.join(__dirname, '..', 'lib', 'trace-legacy', 'tracer'))
  , FakeyMcAgent = require(path.join(__dirname, 'lib', 'stub_agent'))
  ;

describe('execution tracing', function () {
  describe('within the tracer', function () {
    var agent
      , transaction
      , teststamp
      ;

    function stubDuration () {
      return 0;
    }

    before(function () {
      teststamp = Date.now();
    });

    beforeEach(function (done) {
      agent = new FakeyMcAgent();
      transaction = trace.createTransaction(agent);

      return done();
    });

    afterEach(function () {
      agent.stop();
    });

    it('should insert a trace into the stats traced by the agent', function (done) {
      var tracer = new Tracer(transaction, 'Custom/Test');
      tracer.getDurationInMillis = stubDuration;
      tracer.finish();
      agent.transactions.length.should.equal(1);

      var stats = agent.transactions[0].scopedStats.byName('Custom/Test');
      JSON.stringify(stats).should.equal('[1,0,0,0,0,0]', 'should only have one invocation of the test trace');

      return done();
    });

    it('should only insert a single trace per transaction', function (done) {
      var tracer = new Tracer(transaction, 'Custom/Test2');
      tracer.getDurationInMillis = stubDuration;
      tracer.finish();
      agent.transactions.length.should.equal(1);

      tracer = new Tracer(transaction, 'Custom/Test3');
      tracer.getDurationInMillis = stubDuration;
      tracer.finish();
      agent.transactions.length.should.equal(1);

      var stats = agent.transactions[0].scopedStats;
      JSON.stringify(stats.getMetricData()).should.equal('[[{"name":"Custom/Test2"},[1,0,0,0,0,0]]]');

      return done();
    });
  });
});