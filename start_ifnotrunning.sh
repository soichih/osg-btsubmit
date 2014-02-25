#!/bin/bash

BASEDIR=$(dirname $0)
#echo $BASEDIR

#start btsync if not running
if ps -ef | grep -v grep | grep btsync ; then
        echo "btsync already running"
else
        echo "btsync not running.. staring now"
        $BASEDIR/bin/btsync --config $BASEDIR/bin/btsync.conf --log $BASEDIR/btsync.log &
fi

#btsubmit if not running
if ps -ef | grep -v grep | grep server.js ; then
        echo "btsubmit already running"
else
        echo "btsubmit not running.. staring now"
        nohup node $BASEDIR/server.js > $BASEDIR/btsubmit.log &
fi
