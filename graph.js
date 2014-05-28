var Fiber = Npm.require('fibers'),
    util = Npm.require('util'),
    cheerio = Npm.require('cheerio');

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
          end = vertex.name,
          edges = graph.edges;

      if(typeof edges[end] !== 'object'){
        edges[end] = Object.create(null);
      }

      edges[end][start] = function bindEdgeListeners(msg){
          var listeners = edges[end];
          for (var listener in listeners){
            start.removeListener('known', listeners[listener]);
          }
          delete edges[end];
          graph.walk(edge);
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
      }).run();
    }
  }
    if(graph.immutables.indexOf(vertex) !== -1){
      var keyMod = {$set:{}}; 
      keyMod.$set[vertex] = graph.vertices[vertex].value;
      Fiber(function updateImmutable(){
        graph.collection.update(graph._id, keyMod);
      }).run();
    }
};

Graph.prototype.walkXML = function walkXML(edge){
  var graph = this;
    var token = new RegExp("\\[start\\]");
    if(graph.vertices[edge.start].value === null){return {error:"not connected"};}
    var xml;
    if(edge.url !== undefined){
      var url = edge.url.replace(token, graph.vertices[edge.start].value);
      try{
        xml = HTTP.get(url).content;
      } catch(e) {
        var errmsg = "There was an error fetching " + url + " -" + edge.start + " -> " + edge.end;
        console.log(errmsg);
        return {error:e, message:errmsg};
      }
    } else {
      xml = graph.vertices[edge.start].value;
    }
    try{
      //$ = JQuery.parse(xml);
      $ = cheerio.load(xml);
    } catch(e){
      return {error:"http:" + e.response.statusCode};
    }
    try{
      var resolution = edge.resolve($);
      return resolution;
    } catch (e) {
      var errmsg = "Fix your resolution function in the edge from " + edge.start + " to " + edge.end;
      console.log(errmsg);
      return {error:e, message:errmsg };
    }
    //var res = "wish this would work!";
};

Graph.prototype.walkJSON = function walkJSON(edge){
  var graph = this;
    var token = new RegExp("\\[start\\]");
    if(graph.vertices[edge.start].value === null){return {error:"not connected"};}
    var url = edge.url.replace(token, graph.vertices[edge.start].value);
    var json;
    try{
      json = HTTP.get(url).content;
    } catch(e) {
      var errmsg = "There was an error fetching " + url + " -" + edge.start + " -> " + edge.end;
      console.log(errmsg);
      return {error:e, message:errmsg};
    }
    try{
      json = JSON.parse(json);
    } catch(e){
      return {error:"http:" + e.response.statusCode};
    }
    try{
      var resolution = edge.resolve(json);
      return resolution;
    } catch (e) {
      var errmsg = "Fix your resolution function in the edge from " + edge.start + " to " + edge.end;
      console.log(errmsg);
      return {error:e, message:errmsg };
    }
    //var res = "wish this would work!";
};

Graph.prototype.walkLocal = function walkLocal(edge){
  var graph = this,
      value = graph.vertices[edge.start].value,
      resolution;
      try{
        resolution = edge.resolve(value);
      } catch(e) {
        var errmsg = "Fix your resolution function in the edge from " + edge.start + " to " + edge.end;
        console.log(errmsg);
        return {error:e, message:errmsg };
      }
  if(resolution === undefined || resolution === null){
    var errmsg = "The resolution function of the edge from " + edge.start + " to " + edge.end + " is either yielding undefined or null";
    return {error:true, message:errmsg};
  } else {
    return resolution;
  }
};

Graph.prototype.walk = function walk(edge){
  var graph = this,
      resolution;
  if(graph.vertices[edge.start].value === undefined){return;}
  if(edge.type == 'local'){
    resolution = graph.walkLocal(edge);
  } else if(edge.type == 'json') {
    resolution = graph.walkJSON(edge);
  } else if(edge.type == 'xml') {
    resolution = graph.walkXML(edge);
  }
  if(resolution === undefined){
   resolution = "Not able to resolve";
  }
  if(resolution.error === undefined){
    graph.vertices[edge.end].set(resolution);
    graph.updateDB(edge.end);
    delete graph.progress.processing[edge.end];
  }
  // graph.setConnected(edge.end);
  //var nextVertices = graph.stepForward[edge.end];
};

Graph.prototype.followUp = function followUp(){
};

idx.Graph = Graph;
