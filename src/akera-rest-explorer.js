module.exports = RestExplorer;

var path = require('path');
var www_path = path.join(path.normalize(path.join(__dirname, '..')), 'www');

function RestExplorer(akeraWebApp) {
  this.init = function(config, router) {
    if (!router || !router.__app || typeof router.__app.require !== 'function') {
      throw new Error('Invalid Akera web service router.');
    }

    var akeraApp = router.__app;
    var express = akeraApp.require('express');
    var jade = akeraApp.require('jade');

    config = config || {};
    config.route = akeraApp.getRoute(config.route || '/rest/explorer/');
    var crudRoute = akeraApp.getRoute(this.getServiceRoute(akeraApp,
        router.__broker, 'akera-rest-crud'), router);

    router.use(config.route, express.static(www_path));
    router.get(config.route, function(req, res) {
      var templateFn = jade.compileFile(require.resolve('../www/index.jade'));
      res.status(200).send(templateFn({
        broker : req.broker.alias,
        restRoute : crudRoute
      }));
    });
  };

  this.getServiceRoute = function(akeraApp, broker, srvName) {
    try {
      var service = akeraApp.getService(srvName, broker);
      return service.config.route;
    } catch (err) {
      return null;
    }
  };

  if (akeraWebApp !== undefined) {
    throw new Error('REST Explorer can only be mounted at the broker level.');
  }
}

RestExplorer.init = function(config, router) {
  var restExp = new RestExplorer();
  restExp.init(config, router);
};

RestExplorer.dependencies = function() {
  return [ 'akera-rest-crud' ];
};
