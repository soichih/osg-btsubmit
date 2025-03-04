var fs = require('fs');
var osg = require('osg');

exports.submit = function(dir, options, status, done) {
    console.log("echo submitting cwd:"+process.cwd());
    var workflow = new osg.Workflow();
    var job = workflow.submit({
        executable: __dirname+'/echo.wn.sh',
        receive: ['output.txt'],
        timeout: 60*1000, //kill job in 60 seconds
        arguments: [options.input],
        condor: {
            "+ProjectName": options.project,
            "+PortalUser": options.user
        },
        rundir: function(rundir, done) {
            console.log("setting up "+rundir);
            fs.symlink(dir+'/'+options.input, rundir+'/'+options.input, done);
        }
    });
    job.on('submit', function(info) {
        //console.dir(info.options);
        //don't stringify info object.. it will carash..
        status("SUBMITTED", "Echo service submitted");
    });
    job.on('execute', function(info) {
        status("RUNNING", "Echo job running :: "+JSON.stringify(info, null, 2));
    });
    job.on('imagesize', function(info) {
        status("RUNNING", "image size :: "+JSON.stringify(info, null, 2));
    });
    job.on('terminate', function(info) {

        status("RUNNING", "terminated with return code:"+info.ret);
        fs.readFile(job.stdout, 'utf8', function (err,data) {
            status("RUNNING", data);
            fs.readFile(job.stderr, 'utf8', function (err,data) {
                status("RUNNING", data);
                if(info.ret == 0) {
                    fs.createReadStream(job.rundir+'/output.txt').pipe(fs.createWriteStream(dir+'/output.txt'));
                    done(null); //success
                } else {
                    done(ret); //fail
                }
           });
        });
    });
}
