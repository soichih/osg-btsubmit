#!/bin/bash
echo "hostname" `hostname` > output.txt
echo "whoami" `whoami` >> output.txt
echo "dumping env" >> output.txt
env | sort >> outupt.txt
cat $1 >> output.txt

cat $1

exit 0
