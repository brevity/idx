function Progress(){
  this.known = [];
}

function Graph(collection){
  this.collection = collection;
  this.instances = [];
  this.name = function name(){return this.collection._name;};
  this.vertices = [];
  this.stats = [];
  this.edges = [];
  this.addVertices = function(vertices){
    for (var vertex in vertices){
      this.addVertex(vertices[vertex]);
    }
  };
}
Graph.prototype.prepGraph = function prepGraph(doc){
  this.queue = {};
  this.connected = {};
  this.values = {};
  for(var prop in doc){
      this.values[prop] = doc[prop];
      this.setConnected(prop);
  }
  this.resolveAll();
};

Graph.prototype.setConnected = function setConnected(vertex){
  for(var edge in this.edges){
    if(Object.keys(idx.instances.articles).length < 1){
    }
    if(this.edges[edge].start == vertex){
      var end = this.edges[edge].end;
          connections = this.connected;
      if (connections[end]){
        connections[end].push(this.edges[edge]);
      } else {
        connections[end] = [];
        connections[end].push(this.edges[edge]);
      }
    }
  }
};

Graph.prototype.init = function init(collection, doc){
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
  if (vertex.status){
    this.stats.push(vertex.name);
  }
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
Graph.prototype.walkBack = function walkBack(edge){
  Meteor.setTimeout(function(){
    console.log("--------------Woooooooooot! Async!");
  },Math.floor(Math.random * 10000));
};
Graph.prototype.resolveOne = function resolveOne(vertex){
  var resolved = this.values[vertex];
  var connected = this.connected[vertex];

  if(resolved !== undefined){return resolved;}
  if(connected !== undefined){
    //find the most important connecting edge
    // currently only following the first connection it finds
    return this.walkBack(connected[0]);
    //Got some async headed our way here... might want to bone up on futures again :-(
  } else {
    // line up a future to recall this function after a connected node can be resolved.
    for (var edge in this.edges){
      var end = this.edges[edge].end;
      if(end == vertex){
        var start = this.edges[edge].start;
        //Maybe this is where we return our future and wait?
        this.resolveOne(start);
      }
    }
  }
};
Graph.prototype.resolveAll = function resolveAll(){
  for (var vertex in this.stats){
    this.resolveOne(this.stats[vertex]);
  }
};
idx.Graph = Graph;
