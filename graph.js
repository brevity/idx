var Fiber = Npm.require('fibers');
function Progress(){
  this.known = [];
  this.processing = {};
}

function Graph(collection){
  this.collection = collection;
  this.instances = [];
  this.inProcess = {};
  this.stepForward = {};
  this.name = function name(){return this.collection._name;};
  this.vertices = [];
  this.stats = [];
  this.immutables = [];
  this.todo = [];
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
  if(vertex.immutable){
    this.immutables.push(vertex.name);
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
Graph.prototype.updateDB = function updateDB(){
  graph = this;
  var done = false;
  var known = Object.keys(graph.values);
  var count = 0;
  for (var i = 0; i < graph.todo.length; i++){
    if (known.indexOf(graph.todo[i]) !== -1){
      count++;
    }
  }
  if(graph.todo.length == count){
    //prepare update object..  push onto reports
    var insertObj = {};
    insertObj.reports = [];
    var report = {};
    for (var val in graph.values){
      if(graph.stats.indexOf(val) !== -1){
        report[val] = graph.values[val];
      } 
      if(graph.immutables.indexOf(val) !== -1){
        insertObj[val] = graph.values[val];
      }
    }
    report.stamp = new Date();
    insertObj.reports.push(report);
    Fiber(function(){
      graph.collection.update(graph.values._id, insertObj);
    }).run();
  }else {
  }
};

Graph.prototype.walk = function walk(edge){
  graph = this;
  if(edge.type == 'local'){
    graph.values[edge.end] = edge.resolve(graph.values[edge.start]);
  } else if(edge.type == 'json') {
    var token = new RegExp("\\[start\\]");
    var url = edge.url.replace(token, graph.values[edge.start]);
    var res = edge.resolve(JSON.parse(HTTP.get(url).content));
    //console.log("json--->", res);
    graph.values[edge.end] = res;
  }
    graph.updateDB();
    graph.setConnected(edge.end);
    delete graph.progress.processing[edge.end];
    var nextVertices = graph.stepForward[edge.end];
    //this.resolveOne(graph.stepForward[edge.end]);
};


Graph.prototype.stepBack = function stepBack(edge){
  var graph = this;
  if(!graph.progress.processing[edge.end]){
    graph.progress.processing[edge.end] = true;
    //console.log("[stepBack]-------------->", edge.end, "<---", edge.start);
    graph.walk(edge);
    //console.log(graph.values);
  } else {
    var interval = setInterval(function(){
      if(graph.values[edge.end] !== undefined){
      clearInterval(interval);
      //console.log("There it is!.", graph.values);
      return graph.values[edge.end];
      }
     // console.log("somebody else is looking for", edge.end, ". Wait till they find it.", graph.values);
     //console.log(graph.inProcess);
      
    },7000);
  }
};
Graph.prototype.waitForConnection = function waitForConnection(vertex){
  var graph = this;
    var interval = setInterval(function(){
      if(graph.connected[vertex]){
        graph.resolveOne(vertex);
        clearInterval(interval);
      } else{
        console.log(".", vertex);
      }
    }, 7000);
};
Graph.prototype.connect = function connect(vertex){
  var graph = this,
      connectionCount = 0;
  for (var edge in this.edges){
    var end = this.edges[edge].end;
    if(end == vertex){
      connectionCount++;
      var start = this.edges[edge].start;
      //Maybe this is where we return our future and wait?
//      var next = graph.connected[vertex][0];
//      if(!graph.stepForward[next.end]){
//        graph.stepForward[next.end] = [];
//      }
//      graph.stepForward[next.end].push(vertex);
      graph.waitForConnection(vertex);
      graph.resolveOne(start);
    }
  }
  if(connectionCount === 0){
    graph.values[vertex] = "Error: This node is unreachable. Create an edge with " + vertex + " as the endpoint.";
    graph.updateDB();
  }
};

Graph.prototype.resolveOne = function resolveOne(vertex){
  var graph = this;
  var resolved = graph.values[vertex];
  if(resolved !== undefined){return resolved;}
  if(graph.connected[vertex] !== undefined){
    graph.stepBack(graph.connected[vertex][0]);
    //Got some async headed our way here... might want to bone up on futures again :-(
  } else {
    // line up a future to recall this function after a connected node can be resolved.
    graph.connect(vertex);
    }
};
Graph.prototype.resolveAll = function resolveAll(){
  var todo = this.todo = _.union(this.stats, this.immutables);
  console.log(todo);
  for (var vertex in todo){
    this.resolveOne(todo[vertex]);
  }
};
idx.Graph = Graph;
