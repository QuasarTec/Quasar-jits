// @flow

import _ from 'lodash';
import React from 'react';

import { maxPeopleAllowed, isDomainPremium } from '../../../../../limitations.ts';
import VideoLayout from '../../../../../modules/UI/videolayout/VideoLayout';
import { getConferenceNameForTitle } from '../../../base/conference';
import { connect, disconnect } from '../../../base/connection';
import { translate } from '../../../base/i18n';
import { getParticipantCount } from '../../../base/participants/functions';
import { connect as reactReduxConnect } from '../../../base/redux';
import { setColorAlpha } from '../../../base/util';
import { Chat } from '../../../chat';
import { Filmstrip } from '../../../filmstrip';
import { CalleeInfoContainer } from '../../../invite';
import { LargeVideo } from '../../../large-video';
import { KnockingParticipantList, LobbyScreen } from '../../../lobby';
import { ParticipantsPane } from '../../../participants-pane/components';
import { getParticipantsPaneOpen } from '../../../participants-pane/functions';
import { Prejoin, isPrejoinPageVisible } from '../../../prejoin';
import { fullScreenChanged, showToolbox } from '../../../toolbox/actions.web';
import { Toolbox } from '../../../toolbox/components/web';
import RightToolbox from '../../../toolbox/components/web/RightToolbox';
import { LAYOUTS, getCurrentLayout } from '../../../video-layout';
import { maybeShowSuboptimalExperienceNotification } from '../../functions';
import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import type { AbstractProps } from '../AbstractConference';

import ConferenceInfo from './ConferenceInfo';
import { default as Notice } from './Notice';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = [
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'fullscreenchange'
];

/**
 * The CSS class to apply to the root element of the conference so CSS can
 * modify the app layout.
 *
 * @private
 * @type {Object}
 */
const LAYOUT_CLASSNAMES = {
    [LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW]: 'horizontal-filmstrip',
    [LAYOUTS.TILE_VIEW]: 'tile-view',
    [LAYOUTS.VERTICAL_FILMSTRIP_VIEW]: 'vertical-filmstrip'
};

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {

    /**
     * The alpha(opacity) of the background
     */
    _backgroundAlpha: number,

    /**
     * Returns true if the 'lobby screen' is visible.
     */
    _isLobbyScreenVisible: boolean,

    /**
     * If participants pane is visible or not.
     */
    _isParticipantsPaneVisible: boolean,

    /**
     * The CSS class to apply to the root of {@link Conference} to modify the
     * application layout.
     */
    _layoutClassName: string,

    /**
     * Name for this conference room.
     */
    _roomName: string,

    /**
     * If prejoin page is visible or not.
     */
    _showPrejoin: boolean,

    dispatch: Function,
    t: Function
}

/**
 * The conference page of the Web application.
 */
class Conference extends AbstractConference<Props, *> {
    _onFullScreenChange: Function;
    _onShowToolbar: Function;
    _originalOnShowToolbar: Function;
    _setBackground: Function;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
        this._originalOnShowToolbar = this._onShowToolbar;
        this._onShowToolbar = _.throttle(
            () => this._originalOnShowToolbar(),
            100,
            {
                leading: true,
                trailing: false
            });

        // Bind event handler so it is only bound once for every instance.
        this._onFullScreenChange = this._onFullScreenChange.bind(this);
        this._setBackground = this._setBackground.bind(this);
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        document.title = `${this.props._roomName} | ${interfaceConfig.APP_NAME}`;
        this._start();
    }

    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps) {
        if (this.props._shouldDisplayTileView
            === prevProps._shouldDisplayTileView) {
            return;
        }

        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        VideoLayout.refreshLayout();
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.removeEventListener(name, this._onFullScreenChange));

        APP.conference.isJoined() && this.props.dispatch(disconnect());
    }

    /**
     * Reload the page when a connection issues appears.
     *
     * @inheritdoc
     */
    _onhandleReload() {
        console.log('reload window');
        // eslint-disable-next-line no-self-assign
        window.location.href = window.location.href;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isLobbyScreenVisible,
            _isParticipantsPaneVisible,
            _layoutClassName,
            _showPrejoin,
            participantCount
        } = this.props;

        if (!isDomainPremium && participantCount > maxPeopleAllowed && !APP.conference.isJoined()) {
            window.location.href = defaultDomain + '?error=%D0%9B%D0%B8%D0%BC%D0%B8%D1%82+%D1%83%D1%87%D0%B0%D1%81%D1%82%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2+%D0%B4%D0%B0%D0%BD%D0%BD%D0%BE%D0%B9+%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D1%8B+%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%81%D0%B8%D0%BB+100+%D1%87%D0%B5%D0%BB%D0%BE%D0%B2%D0%B5%D0%BA%2C+%D0%B1%D0%BE%D0%BB%D1%8C%D1%88%D0%B5%D0%B5+%D0%BA%D0%BE%D0%BB%D0%B8%D1%87%D0%B5%D1%81%D1%82%D0%B2%D0%BE+%D1%83%D1%87%D0%B0%D1%81%D1%82%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2+%D0%B2%D0%BE%D0%B7%D0%BC%D0%BE%D0%B6%D0%BD%D0%BE+%D0%B2+%D0%BE%D0%BF%D0%BB%D0%B0%D1%87%D0%B5%D0%BD%D0%BD%D0%BE%D0%B9+Connect+%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D0%B5';
        }

        return (
            <div id = 'layout_wrapper'>
                <div
                    className = { _layoutClassName }
                    id = 'videoconference_page'
                    onMouseMove = { this._onShowToolbar }
                    ref = { this._setBackground }>
                    <ConferenceInfo />

                    <Notice />
                    <div id = 'videospace'>
                        <LargeVideo />
                        {!_isParticipantsPaneVisible && <KnockingParticipantList />}
                        <Filmstrip />
                        {window.innerWidth > 1000
                            && <button
                                className = 'reload-button'
                                onClick = { this._onHandleReload }>
                                <img src = '../../../../../images/qcloud_logo.svg' />
                            </button>}
                    </div>

                    {_showPrejoin || _isLobbyScreenVisible
                        || (window.innerWidth <= 1000 ? <RightToolbox /> : <Toolbox />)}
                    <Chat />

                    {this.renderNotificationsContainer()}

                    <CalleeInfoContainer />

                    {_showPrejoin && <Prejoin />}

                </div>
                <ParticipantsPane />
            </div>
        );
    }

    /**
     * Sets custom background opacity based on config. It also applies the
     * opacity on parent element, as the parent element is not accessible directly,
     * only though it's child.
     *
     * @param {Object} element - The DOM element for which to apply opacity.
     *
     * @private
     * @returns {void}
     */
    _setBackground(element) {
        if (!element) {
            return;
        }

        if (this.props._backgroundAlpha !== undefined) {
            const elemColor = element.style.background;
            const alphaElemColor = setColorAlpha(elemColor, this.props._backgroundAlpha);

            element.style.background = alphaElemColor;
            if (element.parentElement) {
                const parentColor = element.parentElement.style.background;
                const alphaParentColor = setColorAlpha(parentColor, this.props._backgroundAlpha);

                element.parentElement.style.background = alphaParentColor;
            }
        }
    }

    /**
     * Updates the Redux state when full screen mode has been enabled or
     * disabled.
     *
     * @private
     * @returns {void}
     */
    _onFullScreenChange() {
        this.props.dispatch(fullScreenChanged(APP.UI.isFullScreen()));
    }

    /**
     * Displays the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onShowToolbar() {
        this.props.dispatch(showToolbox());
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    _start() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.addEventListener(name, this._onFullScreenChange));

        const { dispatch, t } = this.props;

        dispatch(connect());

        maybeShowSuboptimalExperienceNotification(dispatch, t);
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        ...abstractMapStateToProps(state),
        _backgroundAlpha: state['features/base/config'].backgroundAlpha,
        _isLobbyScreenVisible: state['features/base/dialog']?.component === LobbyScreen,
        _isParticipantsPaneVisible: getParticipantsPaneOpen(state),
        _layoutClassName: LAYOUT_CLASSNAMES[getCurrentLayout(state)],
        _roomName: getConferenceNameForTitle(state),
        _showPrejoin: isPrejoinPageVisible(state),
        participantCount: getParticipantCount(state)
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
