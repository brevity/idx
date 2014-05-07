// See https://github.com/dandv/meteor-crypto-base64/blob/master/crypto-base64_tests.js for a simple example// See https://www.eventedmind.com/feed/e6gJZXNQWyNP2MLsb for more on testing with Tinytest

Tinytest.add('idx:graphs - idx', function (test) {
  test.equal(typeof idx, 'object', 'Expected values to be equali');
});

var TestCollection = new Meteor.Collection('test');
var testProto = idx.createGraph(TestCollection);

Tinytest.add('idx:graphs - collection connection', function(test){
  test.equal(TestCollection._graph.name(), 'test', 'Collections should have a _graph property');
  test.equal(idx.graphs.test.name(), 'test', 'idx contains a link to the new graph as well');
  test.equal(testProto.name(), 'test', "<--- idx.createGraph should return the new graph instance");
});

testProto.addVertex({name:'n1', status:true});
testProto.addVertices([{name:'n2'}, {name:'n3'}]);

Tinytest.add('idx:graphs - vertices', function (test) {
  test.equal(testProto.vertices[0].name, 'n1', "<---vertices can be added to the graph with addVertex(options)");
  test.equal(testProto.vertices.length, 3, "<-- check that all vertices are added");
  test.isTrue(testProto.vertices instanceof Array, "<---graphs should have a verticies array");
});

testProto.addEdge({start:'n1', end:'n2'});
testProto.addEdges([{start:'n2', end:'n3'}, {start:'n3', end:'n1'}]);

Tinytest.add('idx:graphs - edges', function (test) {
  test.isTrue(testProto.edges instanceof Array, "<---graphs should have a verticies array");
  test.equal(testProto.edges.length, 3, "<-- check that all vertices are added");
});


console.log("<--------- ");
