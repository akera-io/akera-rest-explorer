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

AkeraExplorer.prototype.init = function(brokers, route) {
    var app = this.akeraWebInstance.app;

    route = (route === '/' ? '/explorer' : route) || '/explorer';

    if (!brokers || brokers.length === 0) {
        app.use(route + '/:broker', express.static(www_path));
        this.log('info', 'Akera REST Explorer enabled for all brokers.');
    } else {
        brokers.forEach(function(brokerName) {
            var broker_path = route + '/' + brokerName;
            app.use(broker_path, express.static(www_path));
            this.log('info', 'Akera REST EXPLORER enabled for broker\'' + brokerName);
        });
    }
};

AkeraExplorer.prototype.log = function(level, message) {
    try {
        this.akeraWebInstance.log(level, message);
    } catch (err) {}
};
