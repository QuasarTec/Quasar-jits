import React, { useState, useEffect } from 'react';
import RecordRTC from 'recordrtc';
import Crunker from 'crunker';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

import { translate } from '../../base/i18n';
import { RecordStart, RecordStop, RecordPause, RecordResume } from '../../base/icons';
import { ToolbarButton } from '../../toolbox/components/web';

const blobToFile = (theBlob, fileName) => {
    const video = new File([ theBlob ], fileName, { type: 'video/webm' });

    return video;
};

async function mergeVideo(video, audio) {
    let ffmpeg = createFFmpeg({
        log: true
    });
    await ffmpeg.load();
    ffmpeg.FS('writeFile', 'video.webm', await fetchFile(video));
    ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(audio));
    await ffmpeg.run('-i', 'video.webm', '-i', 'audio.mp3', '-c:v', 'copy', '-c:a', 'copy', 'output.mkv');
    let data = await ffmpeg.FS('readFile', 'output.mkv');
    console.log(data)
    return new Uint8Array(data.buffer);
};

const getUserMicAudio = async () => {
    try {
        const audio = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
        });

        return audio;
    } catch {
        console.log('Couldn\'t record user\'s microphone');

        return null;
    }
};

const getAllAudioSources = async () => {
    const sources = [];
    const audioElements = document.getElementsByTagName('audio');

    const userAudio = await getUserMicAudio();

    sources.push(userAudio);

    for (const audioElement of audioElements) {
        if (!audioElement.hasAttribute('preload') && audioElement.id !== 'record') {
            const stream = audioElement.captureStream();

            sources.push(stream);
        }
    }

    return sources;
};

const getAllVideoSources = async () => {
    const sources = [];
    const videoElements = document.getElementsByTagName('video');

    for (const videoElement of videoElements) {
        const stream = videoElement.captureStream();

        sources.push(stream);
    }

    return sources;
};

const array_compare = (a, b) => {
    // if lengths are different, arrays aren't equal
    if(a.length != b.length)
       return false;

    for(let i = 1; i < a.length; i++)
       if(a[i].id != b[i].id)
          return false

    return true;
}

let chunks = [];
let audioChunks = [];
let audioStreams = [];
let audioRecorder;
let updateAudioStreamsListener;

const DesktopButton = ({ isDialogShown, t }) => {
    const [ recorder, setRecorder ] = useState(null);
    const [ isPaused, setIsPaused ] = useState(false);

    const stopRecording = async () => {
        audioRecorder.stop(blob => {
            audioChunks.push(blob)
            let audioBuffers = audioChunks.map(chunk => {
                return URL.createObjectURL(chunk)
            })
    
            let crunker = new Crunker();
    
            crunker.fetchAudio(...audioBuffers)
                            .then(buffers => {
                                return crunker.concatAudio(buffers)
                            })
                            .then(concat => {
                                return crunker.export(concat, 'audio/mp3')
                            })
                            .then(async output => {
                                const video = new Blob(chunks, {type: chunks[0].type})

                                console.log(output.blob)

                                const audioAndVideoArray = await mergeVideo(video, output.blob)
                                const audioAndVideo = new Blob([audioAndVideoArray], {
                                    type: 'video/mp4'
                                });

                                console.log(audioAndVideoArray)
                                console.log(audioAndVideo)

                                saveAs(blobToFile(
                                    audioAndVideo,
                                    `Record from ${new Date().toUTCString()}.mp4`
                                ))

                                chunks = [];
                                audioChunks = [];
                                        
                                clearInterval(updateAudioStreamsListener);
                                        
                                setRecorder(null);
                            })

        })

        
    };

    useEffect(() => {
        document.addEventListener('QuitFromConference', () => {
            stopRecording();
        });
    }, []);

    const startRecording = async () => {

        const displayStream = await navigator.mediaDevices.getDisplayMedia({video: true});

        let tracks = new MediaStream([displayStream.getVideoTracks()[0]])

        let audioStreams = await getAllAudioSources();

        audioRecorder = new RecordRTC.MultiStreamRecorder(audioStreams, {
            type: 'audio',
            mimeType: 'audio/wav'
        });
        audioRecorder.record()
        listenerOfAudioStreams()

        const userRecorder = new MediaRecorder(tracks, {
            mimeType: 'video/webm;codecs=vp8'
        });

        userRecorder.ondataavailable = e => chunks.push(e.data);
        userRecorder.onstop = stopRecording;

        userRecorder.start();

        setRecorder(userRecorder);

        
    };

    const pauseRecordingVideo = () => {
        if (!isPaused) {
            recorder.pause();
        } else if (isPaused) {
            recorder.resume();
        }

        setIsPaused(!isPaused);
    };

    const listenerOfAudioStreams = () => {
        updateAudioStreamsListener = setInterval(async () => {
            let streams = await getAllAudioSources();
            if (!array_compare(streams, audioStreams)) {
                audioRecorder.stop(blob => audioChunks.push(blob));

                audioStreams = streams;

                audioRecorder = new RecordRTC.MultiStreamRecorder(streams, {
                    type: 'audio',
                    mimeType: 'audio/wav'
                });
                audioRecorder.record()

            }
        }, 2000);
    }

    return (
        <div className = 'record-preview'>
            { recorder !== null
                && <ToolbarButton
                    accessibilityLabel
                        = { t('toolbar.accessibilityLabel.localRecording') }
                    icon = { !isPaused ? RecordPause : RecordResume }
                    onClick = { pauseRecordingVideo }
                    toggled = { isDialogShown }
                    tooltip = { t('localRecording.dialogTitle') } />
            }
            <ToolbarButton
                accessibilityLabel
                    = { t('toolbar.accessibilityLabel.localRecording') }
                icon = { recorder === null ? RecordStart : RecordStop }
                onClick = { recorder === null ? startRecording : () => recorder.stop() }
                toggled = { isDialogShown }
                tooltip = { t('localRecording.dialogTitle') } />
        </div>
    );
};

export default translate(DesktopButton);
