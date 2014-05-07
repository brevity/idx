function Idx(){
  this.graphs = {};
  this.instances = {};
  this.createGraph = function(collection){
    var name = collection._name;
    this.instances[name] = {};
    var graph = this.graphs[name] = new this.Graph(collection);

    collection.after.insert(function(userId, doc){
      idx.graphs[name].init(collection, doc);
    });
    collection.before.update(function(userId, doc, fieldNames, modifier, options){
      if(doc.scrape){
        console.log('Noticed an update!');
        idx.graphs[name].scrape(collection, doc);
      }
    });

    return graph;
  };
}
idx = new Idx();
