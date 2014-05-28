
graphs = {some:"wierd", shit: "right?"};
graphs.get = function(){
  console.log("what?");
};
if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      getGraph: function getGraph(name){
        var graphName = name || 'articles';
        var graph = {};
        graph.Vertices = idx.graphs[graphName].Vertices;
        graph.Edges = idx.graphs[graphName].Edges;
        return graph;
      }
    });
  });
}
