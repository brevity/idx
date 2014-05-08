// See https://github.com/dandv/meteor-crypto-base64/blob/master/crypto-base64_tests.js for a simple example// See https://www.eventedmind.com/feed/e6gJZXNQWyNP2MLsb for more on testing with Tinytest

Tinytest.add('idx:graphs - idx', function (test) {
  test.equal(typeof idx, 'object', 'Expected values to be equali');
});

Articles = new Meteor.Collection("articles");
var articleProto = idx.createGraph(Articles);

Tinytest.add('idx:graphs - collection connection', function(test){
  test.equal(idx.graphs.articles.name(), 'articles', 'idx contains a link to the new graph as well');
  test.equal(articleProto.name(), 'articles', "<--- idx.createGraph should return the new graph instance");
});

articleProto.addVertex({ name:'pii' });
articleProto.addVertices([
  { name:'doi' },
  { name:'pii plus 1', status:true },
  { name:'article info'},
  { name:'title', status: true },
  { name:'publish date', status: true }
]);

Tinytest.add('idx:graphs - vertices', function (test) {
  test.equal(articleProto.vertices[0].name, 'pii', "<---vertices can be added to the graph with addVertex(options)");
  test.equal(articleProto.vertices.length, 5, "<-- check that all vertices are added");
  test.isTrue(articleProto.vertices instanceof Array, "<---graphs should have a verticies array");
});

articleProto.addEdge({
  start:'pii',
  end: 'pii plus 1',
  type: 'local',
  resolve: function piiPlus1FromPii(start){return 1 + start;}
});

articleProto.addEdge({
  start:'author info',
  end: 'last name',
  type: 'local',
  resolve: function titleFromPublisherJson(start){return start.last_name;}
});

articleProto.addEdge({
  start:'article info',
  end: 'publish date',
  type: 'local',
  resolve: function titleFromPublisherJson(start){return start.pubdate_pretty;}
});
articleProto.addEdge({
  start:'article info',
  end: 'title',
  type: 'local',
  resolve: function titleFromPublisherJson(start){
    return start.title;
  }
});
articleProto.addEdge({
  start: 'pii',
  end: 'article info',
  type: 'json',
  url: 'https://www.landesbioscience.com/api/articles/get_article_json/[start]',
  resolve: function articleInfoFromPii(json){
    return json;
  }
});

Tinytest.add('idx:graphs - edges', function (test) {
  test.isTrue(articleProto.edges instanceof Array, "<---graphs should have a verticies array");
  test.equal(articleProto.edges.length, 4, "<-- check that all edges are added");
});

for (var i = 0; i < 5; i++){
  Articles.insert({pii:1000 + i});
}

Tinytest.add('idx:instances - insertion', function (test) {
  test.equal( Object.keys(idx.instances.articles).length, 5, "collection.insert() should trigger the creation of a graph instance stored in _graph.instances");
});
console.log("<--------- ");

