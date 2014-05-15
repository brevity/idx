var Fiber = Npm.require('fibers'),
    util = Npm.require('util');

function Progress(){
  this.known = [];
  this.processing = {};
}

function Vertex(options){
  EventEmitter.call(this);
  for (var option in options){
    this[option] = options[option];
  }
}
util.inherits(Vertex, EventEmitter);
Vertex.prototype.setMaxListeners(30);

Vertex.prototype.known = function known(){
  var vertex = this;
  this.emit('known', {name:vertex.name, value:vertex.value});
};

Vertex.prototype.prep = function prep(graph){
  var vertex = this;

  if(typeof graph.edges !== 'object'){
    graph.edges = Object.create(null);
  }

  _.map(graph.Edges, function createEdgeInstances(edge, key){

    if(edge.end == vertex.name){
      var start = graph.vertices[edge.start],
          end = vertex.name;

      var edges = graph.edges;

      if(typeof edges[end] !== 'object'){
        edges[end] = Object.create(null);
      }
      edges[end][start] = function bindEdgeListeners(msg){
        // console.log("resolving", end, "from", start );

          var listeners = edges[end];
          for (var listener in listeners){
            start.removeListener('known', listeners[listener]);
          }
          delete edges[end];
          //Fiber(function goWalking(){
            graph.walk(edge);
          //}).run();
          vertex.emit();
          graph.followUp();
      };
      start.once("known", edges[end][start]);
    }
  });
};

Vertex.prototype.set = function set(value){
  var vertex = this;
  vertex.value = value;
  vertex.known();
};

function Graph(collection){
  this.collection = collection;
  this.instances = [];
  this.inProcess = {};
  this.stepForward = {};
  this.name = function name(){return this.collection._name;};
  this.Vertices = {};
  this.stats = [];
  this.immutables = [];
  this.todo = [];
  this.Edges = [];
  this.addVertices = function addVertices(vertices){
    for (var vertex in vertices){
      this.addVertex(vertices[vertex]);
    }
  };
}
Graph.prototype.prepGraph = function prepGraph(doc){
  var graph = this,
      known = [];
  graph._id = doc._id;
  graph.vertices = {};
  
  _.map(graph.Vertices, function createVerticesInstances(key, val){
      var Vertex = graph.Vertices[val],
          vertex = Object.create(Vertex);
      graph.vertices[val] = vertex;
    });
  _.map(graph.Vertices, function prepVerticesInstances(key, val){
      graph.vertices[val].prep(graph);
    });
  _.map(doc, function setVerticesInitialValues(val, key){
    if(key !== '_id'){
      graph.vertices[key].set(val);
    }
  });
      //this.setConnected(prop);
  //this.resolveAll();
};


Graph.prototype.init = function init(collection, doc){
  var instance = Object.create(idx.graphs[collection._name]);
  instance.collection = collection;
  instance.progress = new Progress();
  instance.progress.latestReport = {};
  instance.prepGraph(doc);
  idx.instances[collection._name][doc._id] = instance;
};


Graph.prototype.addVertex = function addVertex(options){
  var graph = this,
      vertex = new Vertex(options);
  graph.Vertices[vertex.name] = vertex;
  if (vertex.status){
    graph.stats.push(vertex.name);
  }
  if(vertex.immutable){
    graph.immutables.push(vertex.name);
  }
};
Graph.prototype.addEdges = function addEdges(Edges){
  for (var edge in Edges){
    this.addEdge(Edges[edge]);
  }
};
Graph.prototype.addEdge = function addEdge(options){
  var edge = {};
  for (var option in options){
    edge[option] = options[option];
  }
  this.Edges.push(edge);
};

Graph.prototype.updateDB = function updateDB(vertex){
  graph = this;
  if(graph.stats.indexOf(vertex) !== -1){
    var known = Object.keys(graph.vertices);
    var count = 0;
    for (var i = 0; i < graph.stats.length; i++){
      if (known.indexOf(graph.stats[i]) !== -1){
        count++;
      }
    }
    //AJT
    if(graph.stats.length == count){
      var reportsMod = {$push:{reports:{}}};
      var report = {};
      for (var val in graph.vertices){
        if(graph.stats.indexOf(val) !== -1){
          report[val] = graph.vertices[val].value;
        } 
      }
      report.stamp = new Date();
      reportsMod.$push.reports = report;
      Fiber(function updateReport(){
        graph.collection.update(graph._id, reportsMod);
        // console.log("updating DB with ", vertex);
        // console.log("[DBWRITE] -", val);
      }).run();
    }
  }
    // console.log("It's immutable.. writing..", vertex, graph.immutables);
    if(graph.immutables.indexOf(vertex) !== -1){
      var keyMod = {$set:{}}; 
      keyMod.$set[vertex] = graph.vertices[vertex].value;
      Fiber(function updateImmutable(){
        // console.log("[DBWRITE] -", vertex);
        graph.collection.update(graph._id, keyMod);
      }).run();
    }
};
Graph.prototype.walkJSON = function walkJSON(edge){
    var token = new RegExp("\\[start\\]");
    if(graph.vertices[edge.start].value === null){return {error:"not connected"};}
    var url = edge.url.replace(token, graph.vertices[edge.start].value);
    var json;
    try{
      json = JSON.parse(HTTP.get(url).content);
    } catch(e){
      //console.log("error finding", edge.end, ":", e.stack);
      console.log("error with json", json);
      return {error:"http:" + e.response.statusCode};
    }
    try{
      var resolution = edge.resolve(json);
      return resolution;
    } catch (e) {
      console.log("error finding", edge.end, ":", e.message);
      return {error:e};
    }
    //var res = "wish this would work!";
};

Graph.prototype.walk = function walk(edge){
  var graph = this,
      resolution;

  if(edge.type == 'local'){
    resolution = edge.resolve(graph.vertices[edge.start].value);
  } else if(edge.type == 'json') {
    resolution = graph.walkJSON(edge);
  }
  if(resolution === undefined){
   resolution = "Not able to resolve";
  }
  graph.vertices[edge.end].set(resolution);
  graph.updateDB(edge.end);
  // graph.setConnected(edge.end);
  delete graph.progress.processing[edge.end];
  var nextVertices = graph.stepForward[edge.end];
};

Graph.prototype.followUp = function followUp(){
};

idx.Graph = Graph;
