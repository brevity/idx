idx.graph = function Graph(collection){
  this.collection = collection;
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
};
