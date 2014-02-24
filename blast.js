var fs = require('fs');
var events = require('events');

var osgblast = require('osg-blast');
var path = require('path');
var merge = require('merge');

exports.submit = function(dir, options, status, done) {
    console.log("blast job starting");

    var config = merge(options, {
        project: "CSIU",
        user: "hayashis",
        rundir: dir,
    });
    osgblast.run(config, status).then(function() {
        console.log("finished workflow");
        done(null); //success
    }, function() {
        done('workflow failed'); //error
    });
}


