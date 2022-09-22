#!/bin/bash

server_names=( jitsi )
dir_names=( libs css images )

cp /home/mike/Work/Node/lib-jitsi-meet/dist/umd/lib-jitsi-meet.e2ee-worker.js /home/mike/Work/Node/Quasar-jits/libs/lib-jitsi-meet.e2ee-worker.js
cp /home/mike/Work/Node/lib-jitsi-meet/dist/umd/lib-jitsi-meet.min.js /home/mike/Work/Node/Quasar-jits/libs/lib-jitsi-meet.min.js
cp /home/mike/Work/Node/lib-jitsi-meet/dist/umd/lib-jitsi-meet.min.map /home/mike/Work/Node/Quasar-jits/libs/lib-jitsi-meet.min.map

for server in "${server_names[@]}"
do
  for dir in "${dir_names[@]}"
    do
        scp -r ./${dir} ${server}:/usr/share/jitsi-meet
    done
done