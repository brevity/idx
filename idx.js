function Idx(){
  this.graphs = {};
  this.createGraph = function(collection){
    var graph = this.graphs[collection._name] = new this.graph(collection);
    collection._graph = graph;

    collection.after.insert(function(userId, doc){
      collection._graph.init(collection, doc);
    });
    collection.after.update(function(userId, doc, fieldNames, modifier, options){
      if(doc.scrape){
        console.log('Noticed an update!');
        collection._graph.scrape(collection, doc);
      }
    });

    return graph;
  };
}
idx = new Idx();
