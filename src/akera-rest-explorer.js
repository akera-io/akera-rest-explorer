module.exports = AkeraExplorer;

var express = require('express');
var path = require('path');
var www_path = path.join(path.normalize(path.join(__dirname, '..')), 'www');

function AkeraExplorer() {
}

AkeraExplorer.prototype.init = function(config, router) {
    var brkName = router.__broker.name;

    router.use('/', express.static(www_path));
    router.get('/', function(req, res) {
        var templateFn = require('jade').compileFile(require.resolve('../www/index.jade'));
        res.status(200).send(templateFn({
            broker: brkName,
            restRoute: config.restRoute
        }));
    });
};

