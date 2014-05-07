function Idx(){
  this.graphs = {};
  this.createGraph = function(collection){
    var graph = this.graphs[collection._name] = new this.graph(collection);
    collection._graph = graph;
    return graph;
  };
}
idx = new Idx();
