function Graph(collection){
  this.collection = collection;
  this.instances = [];
  this.name = function name(){return this.collection._name;};
  this.vertices = [];
  this.edges = [];
  this.addVertices = function(vertices){
    for (var vertex in vertices){
      this.addVertex(vertices[vertex]);
    }
  };
  this.addVertex = function addVertex(options){
    var vertex = {};
    for (var option in options){
      vertex[option] = options[option];
    }
    this.vertices.push(vertex);
  };
  this.addEdges = function(edges){
    for (var edge in edges){
      this.addEdge(edges[edge]);
    }
  };
  this.addEdge = function addEdge(options){
    var edge = {};
    for (var option in options){
      edge[option] = options[option];
    }
  this.edges.push(edge);
  };
  this.init = function inti(collection, doc){
    var instance = Object.create(this);
    instance._id = doc._id;
    instance._collection = collection;
    instance.graph = new Graph();
    instance.latestReport = {};
    //instance.prepGraph(doc);
    this.instances.push(instance);
    return instance;
  };
}

idx.Graph = Graph;
