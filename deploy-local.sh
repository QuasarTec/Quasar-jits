#!/bin/bash

server_names=( jitsi aws-jitsi )
dir_names=( libs css images )

for server in "${server_names[@]}"
do
  for dir in "${dir_names[@]}"
    do
        scp -r ./${dir} ${server}:/usr/share/jitsi-meet
    done
done