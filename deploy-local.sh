#copy to the server with free jitsi
scp -r ./libs jitsi:/usr/share/jitsi-meet
scp -r ./css jitsi:/usr/share/jitsi-meet
scp -r ./images jitsi:/usr/share/jitsi-meet

#copy to the server with premium jitsi
scp -r ./libs aws-jitsi:/usr/share/jitsi-meet
scp -r ./css aws-jitsi:/usr/share/jitsi-meet
scp -r ./images aws-jitsi:/usr/share/jitsi-meet