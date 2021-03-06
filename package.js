Package.describe({
  summary: "idx provides a mechanism for describing meteor collection items via a graph of self-resolving nodes."
});

Package.on_use(function (api, where) {
  api.use('underscore');
  api.use(['collection-hooks']);
  api.use(['emitter']);
  api.use('http');
  api.export('idx');
  api.export('graphs');
  api.add_files('idx.js', ['server']);
  api.add_files('graph.js', ['server']);
  api.add_files('d3graph.js', ['client', 'server']);
});
//
Package.on_test(function (api) {
  api.use(['tinytest','test-helpers', 'idx']);
  api.add_files(['idx_tests.js'], ['server']);

});

Npm.depends({
  "cheerio":"0.16.0"
});
