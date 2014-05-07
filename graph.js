function Progress(){
  this.known = [];
}
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

  this.prepGraph = function prepGraph(doc){
    this.progress.queue = {};
    this.progress.values = {};
    for(var key in this.keys){
    //  console.log('process edges for ', this.vertices[node]);
    }
    for (var edge in this.edges){
   //   console.log(this.edges[edge]);
    }
    for(var prop in doc){
        this.progress.values[prop] = doc[prop];
        this.progress.known.push(prop);
    }
    this.resolveAll();
  };
}

Graph.prototype.init = function inti(collection, doc){
  var instance = Object.create(idx.graphs[collection._name]);
  instance.collection = collection;
  instance.progress = new Progress();
  instance.progress.latestReport = {};
  instance.prepGraph(doc);
  idx.instances[collection._name][doc._id] = instance;
  return instance;
};
Graph.prototype.addVertex = function addVertex(options){
  var vertex = {};
  for (var option in options){
    vertex[option] = options[option];
  }
  this.vertices.push(vertex);
};
Graph.prototype.addEdges = function(edges){
  for (var edge in edges){
    this.addEdge(edges[edge]);
  }
};
Graph.prototype.addEdge = function addEdge(options){
  var edge = {};
  for (var option in options){
    edge[option] = options[option];
  }
  this.edges.push(edge);
};
Graph.prototype.resolveAll = function resolveAll(){
  console.log("we're not here yet1");
};
idx.Graph = Graph;
