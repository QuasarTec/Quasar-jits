/* @flow */

import { saveAs } from 'file-saver';
import React, { Component } from 'react';
import RecordRTC from 'recordrtc';


import { translate } from '../../base/i18n';
import { RecordStart, RecordStop, RecordPause, RecordResume } from '../../base/icons';
import { set } from '../../base/redux';
import { ToolbarButton } from '../../toolbox/components/web';


/**
 * The type of the React {@code Component} state of
 * {@link LocalRecordingButton}.
 */
type Props = {

    /**
     * Whether or not {@link LocalRecordingInfoDialog} should be displayed.
     */
    isDialogShown: boolean,

    /**
     * Callback function called when {@link LocalRecordingButton} is clicked.
     */
    onClick: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

type State = {
    recorder: RecordRTC.MultiStreamRecorder,
    recordingPaused: Boolean,
    updateStreamsIntrval: any
}

/**
 * A React {@code Component} for opening or closing the
 * {@code LocalRecordingInfoDialog}.
 *
 * @extends Component
 */
class LocalRecordingButton extends Component<Props, State> {

    /**
     * Initializes a new {@code LocalRecordingButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            recorder: null,
            recordingPaused: false
        };

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
        this.stopRecordingVideo = this.stopRecordingVideo.bind(this);
        this.startRecordingVideo = this.startRecordingVideo.bind(this);
        this.pauseRecordingVideo = this.pauseRecordingVideo.bind(this);
    }

    blobToFile(theBlob, fileName) {
        const video = new File([theBlob], fileName, { type: 'video/mp4' });

        return video;
    }

    stopRecordingVideo() {
        if (this.state.recorder === null) {
            return;
        }

        this.state.recorder.stop(blob => {
            const url = window.location.href.split('&');
            let isFramed = false;

            try {
                isFramed = window != window.top || document != top.document || self.location != top.location;
            } catch (e) {
                isFramed = true;
            }
            if (isFramed) {
                window.parent.postMessage({
                    blob
                }, '*');
            } else {
                saveAs(this.blobToFile(blob, `Record from ${new Date().toString()}.mp4`), `Record from ${new Date().toString()}.mp4`);
            }
        });

        clearInterval(this.state.updateStreamsIntrval);
        this.setState({
            recorder: null,
            updateStreamsIntrval: null
        });
        document.removeEventListener('addRemoteStreamToRecord', document);
    }

    findStreams() {
        const streams = [];
        const streams_ids = [];
        const videoElements = document.getElementsByTagName('video');
        const audioElements = document.getElementsByTagName('audio');

        for (let i = 0; i < videoElements.length; i++) {
            if (streams_ids.indexOf(videoElements[i].captureStream().id) == -1) {
                const stream = videoElements[i].captureStream();

                streams.push(stream);
                streams_ids.push(stream.id);
            }
        }

        for (let i = 0; i < audioElements.length; i++) {
            if (streams_ids.indexOf(audioElements[i].captureStream().id) == -1) {
                const stream = audioElements[i].captureStream();

                streams.push(stream);
                streams_ids.push(stream.id);
            }
        }

        return streams;
    }

    startRecordingVideo() {
        this.setState({
            recorder: new RecordRTC.MultiStreamRecorder(this.findStreams(), {
                type: 'video',
                mimeType: 'video/webm;codecs=h264',
                video: {
                    minWidth: 1280,
                    minHeight: 720,

                    maxWidth: 1920,
                    maxHeight: 1080
                },
                ignoreMutedMedia: false
            }),
            streams: this.findStreams()
        }, () => {
            this.state.recorder.record();
            document.addEventListener('QuitFromConference', () => {
                this.stopRecordingVideo();
            });
            this.setState({ updateStreamsIntrval: setInterval(() => this.state.recorder.resetVideoStreams(this.findStreams()), 5000) });
        });
    }

    pauseRecordingVideo() {
        if (this.state.recordingPaused == false) {
            this.state.recorder.pause();
            this.setState({ recordingPaused: true });
        } else {
            this.state.recorder.resume();
            this.setState({ recordingPaused: false });
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isDialogShown, t } = this.props;

        return (
            <div className='record-preview'>
                { this.state.recorder !== null
                    && <ToolbarButton
                        accessibilityLabel
                        ={t('toolbar.accessibilityLabel.localRecording')}
                        icon={this.state.recordingPaused == false ? RecordPause : RecordResume}
                        onClick={this.pauseRecordingVideo}
                        toggled={isDialogShown}
                        tooltip={t('localRecording.dialogTitle')} />
                }
                <ToolbarButton
                    accessibilityLabel
                    ={t('toolbar.accessibilityLabel.localRecording')}
                    icon={this.state.recorder === null ? RecordStart : RecordStop}
                    onClick={this.state.recorder === null ? this.startRecordingVideo : this.stopRecordingVideo}
                    toggled={isDialogShown}
                    tooltip={t('localRecording.dialogTitle')} />
            </div>
        );
    }

    _onClick: () => void;

    /**
     * Callback invoked when the Toolbar button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        this.props.onClick();
    }
}

export default translate(LocalRecordingButton);
