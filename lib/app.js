var _ = require('lodash');
var logfmt = require('logfmt');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

var router = require('./router');
var render = require('./render');
var Resolver = require('./resolver');

var NodeSource = require('./sources/node');
var IoJsSource = require('./sources/iojs');
var NpmSource = require('./sources/npm');
var YarnSource = require('./sources/yarn');
var NginxSource = require('./sources/nginx');
var MongoDBSource = require('./sources/mongodb');

module.exports = function App(resolvers) {
  var app = express();
  var resolvers = resolvers || {
    node: new Resolver(new NodeSource()),
    iojs: new Resolver(new IoJsSource()),
    npm: new Resolver(new NpmSource()),
    nginx: new Resolver(new NginxSource()),
    mongodb: new Resolver(new MongoDBSource()),
    yarn: new Resolver(new YarnSource())
  };

  app.resolvers = resolvers;

  if (process.env.NODE_ENV !== 'test') {
    app.use(logfmt.requestLogger());
  }

  app
    .use(cors())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .get('/', renderInstructions)
    .get('/ssl', sendSSL);

  Object.keys(resolvers).forEach(function attachRouter(key) {
    app.use('/' + key + ':format?', router(resolvers[key]));
  });

  return app;

  function renderInstructions(req, res, next) {
    render(resolvers, onRender);

    function onRender(err, html) {
      if (err) throw err;
      res.send(html);
    }
  }

  function sendSSL(req, res, next) {
    res.type('text');
    res.send([
      '"Demonstration of domain control for DigiCert order #00462258"',
      '"Please send the approval email to: ops@heroku.com"'
    ].join('\n'));
  }
};
