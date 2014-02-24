var path = require('path');
var os = require('os');
var fs = require('fs');
var spawn = require('child_process').spawn;

var glob = require('glob');
var rimraf = require('rimraf');

var config = require('./config');

/*
console.log("btsync.conf should look like following");
var config = {
    device_name: "osg-btsubmit at "+os.hostname(),
    listening_port: 12378, //0 - any
    pid_file: "/local-scratch/hayashis/osg-btsubmit/btsync.pid" ,
    check_for_updates: false,
    use_upnp: false,//true gets "UPnP: Unable to map port 192.168.96.22:12378 with UPnP."
    download_limit: 0,
    upload_limit: 0,

    folder_rescan_interval: 1, //un-official param to force rescan //https://forge.puppetlabs.com/mcanevet/btsync

    shared_folders: []
};
folders.forEach(function(folder) {
    config.shared_folders.push({
        dir: folder.dir,
        secret: folder.secret,
        use_relay_server: true,
        use_tracker: true, 
        use_dht: true,
        search_lan: true,
        use_sync_trash: false
    });
});
console.log(JSON.stringify(config, null, 2));
*/

/*
console.log("removing bin/.sync");
rimraf("bin/.sync", function() {
    console.log("starting btsync");
    temp.open('btsync.conf', function(err, conf) {
        //console.log(JSON.stringify(config));
        fs.writeSync(conf.fd, JSON.stringify(config));
        fs.close(conf.fd, function(err) {
            btsync_server = spawn('./bin/btsync', ['--nodaemon', '--config', conf.path]);
            btsync_server.stdout.on('data', function (data) {
                console.log('btsync(out): ' + data);
            });

            btsync_server.stderr.on('data', function (data) {
                console.log('btsync(err): ' + data);
            });

            btsync_server.on('close', function (code) {
                console.log("btsync died");
            });
        });
    });
});
*/

//walk all shared folders and look for run.json
function walk() {
    config.folders.forEach(function(folder) {
        glob(folder.dir+"/**/osg.json", function(err, jsons) {
            if(!err) {
                jsons.forEach(function(jsonpath) {
                    var jsondir = path.dirname(jsonpath);
                    //console.log("testing "+dir);
                    //make sure no files are currently synched
                    glob(jsondir+"/**/*.!sync", function(err, sfiles) {
                        if(sfiles.length) {
                            console.log(jsondir+" still syncing .. waiting");
                        } else {
                            console.log("submitting "+jsonpath+" for user "+folder.user);
                            try {
                                submit(folder, jsonpath);
                            } catch(e) {
                                console.log("exception thrown:"+e);
                                console.dir(jsonpath);
                            }
                        }
                    });
                });
            }
        });
    });
}

//walk periodically to find run.json
var walker = setInterval(walk, 2500);


/*
watchr.watch({
    paths: ['/local-scratch/hayashis'],
    listener: function(changeType,filePath,fileCurrentStat,filePreviousStat){
        console.log(changeType);
        console.log(filePath);
    }
});
*/

//function submit(dir, jsonpath, user) {
function submit(folder, jsonpath) {
    var current_status = null;
    var jsondir = path.dirname(jsonpath);

    function status(newstatus, msg) {
        console.log("test setting status"+newstatus);
        if(newstatus) {
            if(current_status == null) {
                console.log("setting initial status to "+newstatus);
                fs.renameSync(jsonpath, jsonpath+"."+newstatus);
            } else if(current_status != newstatus) {
                console.log("change status from "+current_status+" to "+newstatus);
                fs.renameSync(jsonpath+"."+current_status, jsonpath+"."+newstatus);
            } else {
                console.log("status hasn't changed");
            }
            current_status = newstatus;
        }

        if(msg) {
            var now = new Date();
            var log = current_status+' '+now.toString()+' '+msg;
            fs.appendFile(jsondir+'/osg.log', log+'\n', function (err) {
                if (err) throw err;
                console.log(log);
            });
        }
    }

    //start logging
    try {
        //parse osg.json
        var json = JSON.parse(fs.readFileSync(jsonpath));
        //console.dir(json);

        //inject some other params (anti-patter?)
        json.user = folder.user;
        json.project = config.project;

        //figure which service to run
        var service = null;
        switch(json.service) {
        case "blast":
            service = require("./blast"); break;
        case "echo":
            service = require("./echo"); break;
        }

        var now = new Date();
        if(service != null) {
            status("RECEIVED", "osg.json received");

            //run service
            service.submit(jsondir, json, status, function(err){
                if(err) {
                    status("FAILED", "service finished with failure.");
                } else {
                    status("COMPLETED", "service completed successfully.");
                }
            });
        } else {
            status("REJECTED", jsonpath+" contains unknown service:"+json.service);
        }
    } catch(e) {
        status("REJECTED", "failed to parse osg.json :: "+e);
    }
}

/*
process.on('SIGINT', function() {
    console.log("killing btsubmit");
    clearInterval(walker);
    process.exit(3);
})
*/

process.on('uncaughtException', function(err) {
    console.error('Caught exception (continuing): ' + err);
});
process.on('SIGINT', function() {
    console.log("osg-btsubmit received SIGINT");
    clearInterval(walker);
});
process.on('SIGTERM', function() {
    console.log("osg-btsubmit received SIGTERM");
    clearInterval(walker);
});

