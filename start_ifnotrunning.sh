#!/bin/bash

BASEDIR=$(dirname $0)
#echo $BASEDIR

#start btsync if not running
if ps -ef | grep `whoami` | grep -v grep | grep btsync ; then
        echo "btsync already running"
else
        echo "btsync not running.. staring now"
        $BASEDIR/bin/btsync --config $BASEDIR/bin/btsync.conf --log $BASEDIR/btsync.log &
fi

#btsubmit if not running
if ps -ef | grep `whoami` | grep -v grep | grep server.js ; then
        echo "btsubmit already running"
else
        echo "btsubmit not running.. staring now"
        cd $BASEDIR
        nohup ~/app/node-v0.10.25-linux-x64/bin/node server.js >> btsubmit.log 2>&1 &
fi
