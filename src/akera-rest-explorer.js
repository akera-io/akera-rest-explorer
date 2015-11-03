module.exports = AkeraExplorer;

var express = require('express');
var path = require('path');
var www_path = path.join(path.normalize(path.join(__dirname, '..')), 'www');

function AkeraExplorer(akeraWebInstance) {
    if (akeraWebInstance && akeraWebInstance.app) {
        this.akeraWebInstance = akeraWebInstance;
    } else {
        throw new Error('Invalid akera web application instance');
    }
}

AkeraExplorer.prototype.init = function(brokerName, route) {
    var app = this.akeraWebInstance.app;

    route = (route === '/' ? '/explorer' : route) || '/explorer';
    app.use(route + (brokerName ? '/' + brokerName : '/:broker'), express.static(www_path));
    app.get(route + (brokerName ? '/' + brokerName : '/:broker'), function(req, res) {
        var brkName = req.params.broker;
        var templateFn = require('jade').compileFile(require.resolve('../www/index.jade'));
        res.status(200).send(templateFn({
            broker: brkName
        }));

    });
    this.log('info', 'Akera REST Explorer enabled for all brokers.');
};

AkeraExplorer.prototype.log = function(level, message) {
    try {
        this.akeraWebInstance.log(level, message);
    } catch (err) {}
};
