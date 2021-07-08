import { saveAs } from 'file-saver';
import React, { useState, useEffect } from 'react';

import { translate } from '../../base/i18n';
import { RecordStart, RecordStop, RecordPause, RecordResume } from '../../base/icons';
import { ToolbarButton } from '../../toolbox/components/web';

const blobToFile = (theBlob, fileName) => {
    const video = new File([ theBlob ], fileName, { type: 'video/webm' });

    return video;
};

const mix = streams => {
    const audioContext = new AudioContext();
    const dest = audioContext.createMediaStreamDestination();

    streams.forEach(stream => {
        const source = audioContext.createMediaStreamSource(stream);

        source.connect(dest);
    });

    return dest.stream.getTracks()[0];
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
        if (!audioElement.hasAttribute('preload')) {
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

let chunks = [];

const DesktopButton = ({ isDialogShown, t }) => {
    const [ recorder, setRecorder ] = useState(null);
    const [ isPaused, setIsPaused ] = useState(false);

    const stopRecording = () => {
        const blob = new Blob(chunks, { type: chunks[0].type });

        saveAs(blobToFile(
            blob,
            `Record from ${new Date().toString()}.webm`
        ));

        chunks = []

        setRecorder(null);
    };

    useEffect(() => {
        document.addEventListener('QuitFromConference', () => {
            stopRecording();
        });
    }, []);

    const startRecording = async () => {

        const displayStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true});
        // voiceStream for recording voice with screen recording
        const voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        let tracks = [...displayStream.getTracks(), ...voiceStream.getAudioTracks()]
        const stream = new MediaStream(tracks);

        const userRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm'
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
