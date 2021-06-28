/* global interfaceConfig */

import React from 'react';

import { default as ButtonIcon } from '../../../../images/button-icon.svg';
import { isDomainPremium, defaultDomain, premiumDomain, isUserPaid } from '../../../../limitations.ts';
import { isMobileBrowser } from '../../base/environment/utils';
import { translate, translateToHTML } from '../../base/i18n';
import { Icon, IconWarning } from '../../base/icons';
import { Watermarks } from '../../base/react';
import { connect } from '../../base/redux';
import { CalendarList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';
import { SettingsButton, SETTINGS_TABS } from '../../settings';


import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';
import Login from './Login.tsx';
import Register from './Register.tsx';
import Tabs from './Tabs';

/**
 * The pattern used to validate room name.
 * @type {string}
 */
export const ROOM_NAME_VALIDATE_PATTERN_STR = '^[^?&:\u0022\u0027%#]+$';

/**
 * The Web container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {
    /**
     * Default values for {@code WelcomePage} component's properties.
     *
     * @static
     */
    static defaultProps = {
        _room: ''
    };

    /**
     * Initializes a new WelcomePage instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            ...this.state,

            generateRoomnames:
                interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE,
            selectedTab: 0,
            joinRoomName: '',
            isLoginPromptOpen: false,
            isRegisterWindowOpen: false
        };

        /**
         * The HTML Element used as the container for additional content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentRef = null;

        this._roomInputRef = null;

        /**
         * The HTML Element used as the container for additional toolbar content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalToolbarContentRef = null;

        this._additionalCardRef = null;

        /**
         * The template to use as the additional card displayed near the main one.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalCardTemplate = document.getElementById(
            'welcome-page-additional-card-template');

        /**
         * The template to use as the main content for the welcome page. If
         * not found then only the welcome page head will display.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentTemplate = document.getElementById(
            'welcome-page-additional-content-template');

        /**
         * The template to use as the additional content for the welcome page header toolbar.
         * If not found then only the settings icon will be displayed.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalToolbarContentTemplate = document.getElementById(
            'settings-toolbar-additional-content-template'
        );

        // Bind event handlers so they are only bound once per instance.
        this._onFormSubmit = this._onFormSubmit.bind(this);
        this._onRoomChange = this._onRoomChange.bind(this);
        this._setAdditionalCardRef = this._setAdditionalCardRef.bind(this);
        this._setAdditionalContentRef
            = this._setAdditionalContentRef.bind(this);
        this._setRoomInputRef = this._setRoomInputRef.bind(this);
        this._setAdditionalToolbarContentRef
            = this._setAdditionalToolbarContentRef.bind(this);
        this._onTabSelected = this._onTabSelected.bind(this);
        this._renderFooter = this._renderFooter.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    async componentDidMount() {
        super.componentDidMount();

        if (isDomainPremium) {
            const urlParams = new URLSearchParams(window.location.search);
            const hash = urlParams.get('hash');

            if (hash) {
                const res = await fetch('https://matrix.easy-stars.ru/bot/redirect/check-hash', {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        hash
                    })
                });

                const result = await res.json();

                if (result.username) {
                    localStorage.setItem('username', result.username);
                    window.location.href = window.location.href;
                }
            }
        }

        const isPaid = await isUserPaid();

        if (isDomainPremium && !isPaid) {
            window.location.href = defaultDomain;
        } else if (!isDomainPremium && isPaid) {
            const res = await fetch('https://matrix.easy-stars.ru/bot/redirect/get-hash', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    username: localStorage.getItem('username')
                })
            });

            const result = await res.json();

            if (result.hash) {
                // eslint-disable-next-line prefer-template
                window.location.href = premiumDomain + `?hash=${result.hash}`;
            }
        }

        document.body.classList.add('welcome-page');
        document.title = interfaceConfig.APP_NAME;

        if (this.state.generateRoomnames) {
            this._updateRoomname();
        }

        if (this._shouldShowAdditionalContent()) {
            this._additionalContentRef.appendChild(
                this._additionalContentTemplate.content.cloneNode(true));
        }

        if (this._shouldShowAdditionalToolbarContent()) {
            this._additionalToolbarContentRef.appendChild(
                this._additionalToolbarContentTemplate.content.cloneNode(true)
            );
        }

        if (this._shouldShowAdditionalCard()) {
            this._additionalCardRef.appendChild(
                this._additionalCardTemplate.content.cloneNode(true)
            );
        }
    }

    /**
     * Removes the classname used for custom styling of the welcome page.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        super.componentWillUnmount();

        document.body.classList.remove('welcome-page');
    }

    changeJoinRoomName = e => {
        const { value } = e.target;

        this.setState({
            joinRoomName: value
        });
    }

    joinOtherRoom = () => {
        const { joinRoomName } = this.state;

        if (/http/.test(joinRoomName)) {
            const joinUrl = new URL(joinRoomName);

            if (joinUrl.origin === window.location.origin) {
                window.location.href = joinUrl;
            }
        } else if (!/http/.test(joinRoomName)) {
            window.location.href += joinRoomName;
        }
    }

    changeLoginPromptVisibility = isOpened => {
        this.setState({
            isLoginPromptOpen: isOpened
        });
    }

    changeRegisterWindowVisibility = isOpened => {
        this.setState({
            isRegisterWindowOpen: isOpened
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const { isLoginPromptOpen, isRegisterWindowOpen } = this.state;
        const { _moderatedRoomServiceUrl, t } = this.props;
        const { DEFAULT_WELCOME_PAGE_LOGO_URL, DISPLAY_WELCOME_FOOTER } = interfaceConfig;
        const showAdditionalCard = this._shouldShowAdditionalCard();
        const showAdditionalContent = this._shouldShowAdditionalContent();
        const showAdditionalToolbarContent = this._shouldShowAdditionalToolbarContent();
        const contentClassName = showAdditionalContent ? 'with-content' : 'without-content';
        const footerClassName = DISPLAY_WELCOME_FOOTER ? 'with-footer' : 'without-footer';

        return (
            <div
                className = { `welcome ${contentClassName} ${footerClassName}` }
                id = 'welcome_page'>

                { isLoginPromptOpen
                    && <Login
                        closeLoginPrompt = { () => {
                            this.changeLoginPromptVisibility(false);
                        } } />
                }
                { isRegisterWindowOpen
                    && <Register
                        closeRegisterWindow = { () => {
                            this.changeRegisterWindowVisibility(false);
                        } } />
                }

                <nav>
                    <img
                        className = 'connect-logo'
                        src = '../../../../images/watermark.svg' />

                    <div className = 'links'>
                        <a href = 'https://easy-stars.ru/'>Quasar Technology</a>
                        <a href = 'https://messenger.easy-stars.ru/mobile_guide/'>Quasar Message</a>
                        <a href = 'https://www.youtube.com/watch?v=OKatgtc4x1I&t=11s'>Маркетинг план</a>
                        <a href = 'https://t.me/joinchat/K5fKWxce4tlkMWMy'>Контакты</a>
                    </div>

                    <div
                        style = {{ display: 'flex',
                            alignItems: 'center' }}>
                        { localStorage.getItem('username')
                            ? <button
                                className = 'login-button logout-button'
                                onClick = { () => {
                                    localStorage.removeItem('username');
                                    window.location.href = window.location.href;
                                } }>
                                Выйти
                            </button>
                            : <div className = 'login-buttons-group'>
                                <button
                                    className = 'login-button'
                                    onClick = { () => {
                                        this.changeLoginPromptVisibility(true);
                                    } }>
                                    Войти
                                </button>
                                <button
                                    className = 'login-button'
                                    onClick = { () => {
                                        this.changeRegisterWindowVisibility(true);
                                    } }>
                                    Регистрация
                                </button>
                            </div>
                        }

                        <SettingsButton
                            defaultTab = { SETTINGS_TABS.CALENDAR } />
                        {showAdditionalToolbarContent
                            ? <div
                                className = 'settings-toolbar-content'
                                ref = { this._setAdditionalToolbarContentRef } />
                            : null
                        }
                    </div>
                </nav>

                <div className = 'header'>
                    <div className = 'header-image' />
                    <div className = 'header-container'>
                        <h1 className = 'header-text-title'>
                            Connecting people
                        </h1>
                        <span className = 'header-text-subtitle'>
                            {t('welcomepage.headerSubtitle')}
                        </span>
                        <div className = 'enter_room'>
                            <div className = 'enter-room-input-container'>
                                <form onSubmit = { this._onFormSubmit }>
                                    <input
                                        aria-disabled = 'false'
                                        aria-label = 'Meeting name input'
                                        autoFocus = { true }
                                        className = 'enter-room-input'
                                        id = 'enter_room_field'
                                        onChange = { this._onRoomChange }
                                        pattern = { ROOM_NAME_VALIDATE_PATTERN_STR }
                                        placeholder = 'Введите название конференции'
                                        ref = { this._setRoomInputRef }
                                        title = { t('welcomepage.roomNameAllowedChars') }
                                        type = 'text' />
                                    <div
                                        className = { _moderatedRoomServiceUrl
                                            ? 'warning-with-link'
                                            : 'warning-without-link' }>
                                        {this._renderInsecureRoomNameWarning()}
                                    </div>
                                </form>
                            </div>
                            <button
                                aria-disabled = 'false'
                                aria-label = 'Старт'
                                className = 'welcome-page-button'
                                id = 'enter_room_button'
                                onClick = { this._onFormSubmit }
                                tabIndex = '0'
                                type = 'button'>
                                <ButtonIcon />
                                Старт
                            </button>
                        </div>

                        <div className = 'enter_room join_room'>
                            <div className = 'enter-room-input-container'>
                                <form>
                                    <input
                                        className = 'enter-room-input'
                                        onChange = { this.changeJoinRoomName }
                                        placeholder = 'Введите название комнаты'
                                        ref = { this._setRoomInputRef }
                                        type = 'text' />
                                </form>
                            </div>
                            <button
                                aria-disabled = 'false'
                                aria-label = 'Старт'
                                className = 'welcome-page-button'
                                id = 'enter_room_button'
                                onClick = { this.joinOtherRoom }
                                tabIndex = '0'
                                type = 'button'>
                                Присоединиться
                            </button>
                        </div>

                        {_moderatedRoomServiceUrl && (
                            <div id = 'moderated-meetings'>
                                <p>
                                    {
                                        translateToHTML(
                                            t, 'welcomepage.moderatedMessage', { url: _moderatedRoomServiceUrl })
                                    }
                                </p>
                            </div>)}
                    </div>
                </div>

                <div className = 'welcome-cards-container'>
                    <div className = 'welcome-card-row'>
                        <h1 className = 'main-title'>История конференций:</h1>
                        <div className = 'welcome-tabs welcome-card welcome-card--blue'>
                            {this._renderTabs()}
                        </div>
                        {showAdditionalCard
                            ? <div
                                className = 'welcome-card welcome-card--dark'
                                ref = { this._setAdditionalCardRef } />
                            : null}
                    </div>

                    {showAdditionalContent
                        ? <div
                            className = 'welcome-page-content'
                            ref = { this._setAdditionalContentRef } />
                        : null}
                </div>
                <footer className = 'footer-info'>
                    <div className = 'container left'>
                        <img src = '../../../../images/quasar-tech.svg' />
                        <img src = '../../../../images/watermark.svg' />
                        <img src = '../../../../images/quasar-messenger.svg' />
                    </div>
                    <div className = 'container center'>
                        <div className = 'links'>
                            <a href = 'https://easy-stars.ru/'>Quasar Technology</a>
                            <a href = 'https://messenger.easy-stars.ru/mobile_guide/'>Quasar Message</a>
                            <a href = 'https://www.youtube.com/watch?v=OKatgtc4x1I&t=11s'>Маркетинг план</a>
                            <a href = 'https://t.me/joinchat/K5fKWxce4tlkMWMy'>Контакты</a>
                        </div>

                        <p>Компания Quasar Technology © 2021</p>
                    </div>
                    <div className = 'container right'>
                        <a>Ознакомьтесь<br /> с <span className = 'underline'>политикой конфиденциальности</span></a>
                        <img src = '../../../../images/qcloud.svg' />
                    </div>
                </footer>
                <footer className = 'footer-info-mobile'>
                    <div className = 'logos'>
                        <div className = 'logo-top logo'>
                            <img src = '../../../../images/quasar-tech.svg' />
                            <img src = '../../../../images/quasar-messenger.svg' />
                        </div>
                        <div className = 'logo'>
                            <img src = '../../../../images/watermark.svg' />
                            <img src = '../../../../images/qcloud.svg' />
                        </div>
                    </div>

                    <div className = 'text'>
                        <a>Ознакомьтесь<br /> с <span className = 'underline'>политикой конфиденциальности</span></a>
                        <p>Компания Quasar Technology © 2021</p>
                    </div>
                </footer>
            </div>

        );
    }

    /**
     * Renders the insecure room name warning.
     *
     * @inheritdoc
     */
    _doRenderInsecureRoomNameWarning() {
        return (
            <div className = 'insecure-room-name-warning'>
                <Icon src = { IconWarning } />
                <span>
                    {this.props.t('security.insecureRoomNameWarning')}
                </span>
            </div>
        );
    }

    /**
     * Prevents submission of the form and delegates join logic.
     *
     * @param {Event} event - The HTML Event which details the form submission.
     * @private
     * @returns {void}
     */
    _onFormSubmit(event) {
        event.preventDefault();

        if (!this._roomInputRef || this._roomInputRef.reportValidity()) {
            this._onJoin();
        }
    }

    /**
     * Overrides the super to account for the differences in the argument types
     * provided by HTML and React Native text inputs.
     *
     * @inheritdoc
     * @override
     * @param {Event} event - The (HTML) Event which details the change such as
     * the EventTarget.
     * @protected
     */
    _onRoomChange(event) {
        super._onRoomChange(event.target.value);
    }

    /**
     * Callback invoked when the desired tab to display should be changed.
     *
     * @param {number} tabIndex - The index of the tab within the array of
     * displayed tabs.
     * @private
     * @returns {void}
     */
    _onTabSelected(tabIndex) {
        this.setState({ selectedTab: tabIndex });
    }

    /**
     * Renders the footer.
     *
     * @returns {ReactElement}
     */
    _renderFooter() {
        const { t } = this.props;
        const {
            MOBILE_DOWNLOAD_LINK_ANDROID,
            MOBILE_DOWNLOAD_LINK_F_DROID,
            MOBILE_DOWNLOAD_LINK_IOS
        } = interfaceConfig;

        return (<footer className = 'welcome-footer'>
            <div className = 'welcome-footer-centered'>
                <div className = 'welcome-footer-padded'>
                    <div className = 'welcome-footer-row-block welcome-footer--row-1'>
                        <div className = 'welcome-footer-row-1-text'>{t('welcomepage.jitsiOnMobile')}</div>
                        <a
                            className = 'welcome-badge'
                            href = { MOBILE_DOWNLOAD_LINK_IOS }>
                            <img src = './images/app-store-badge.png' />
                        </a>
                        <a
                            className = 'welcome-badge'
                            href = { MOBILE_DOWNLOAD_LINK_ANDROID }>
                            <img src = './images/google-play-badge.png' />
                        </a>
                        <a
                            className = 'welcome-badge'
                            href = { MOBILE_DOWNLOAD_LINK_F_DROID }>
                            <img src = './images/f-droid-badge.png' />
                        </a>
                    </div>
                </div>
            </div>
        </footer>);
    }

    /**
     * Renders tabs to show previous meetings and upcoming calendar events. The
     * tabs are purposefully hidden on mobile browsers.
     *
     * @returns {ReactElement|null}
     */
    _renderTabs() {
        if (isMobileBrowser()) {
            return null;
        }

        const { _calendarEnabled, _recentListEnabled, t } = this.props;

        const tabs = [];

        if (_calendarEnabled) {
            tabs.push({
                label: t('welcomepage.calendar'),
                content: <CalendarList />
            });
        }

        if (_recentListEnabled) {
            tabs.push({
                label: t('welcomepage.recentList'),
                content: <RecentList />
            });
        }

        if (tabs.length === 0) {
            return null;
        }

        return (
            <Tabs
                onSelect = { this._onTabSelected }
                selected = { this.state.selectedTab }
                tabs = { tabs } />);
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * additional card shown near the tabs card.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the welcome page content.
     * @private
     * @returns {void}
     */
    _setAdditionalCardRef(el) {
        this._additionalCardRef = el;
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * welcome page content.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the welcome page content.
     * @private
     * @returns {void}
     */
    _setAdditionalContentRef(el) {
        this._additionalContentRef = el;
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * toolbar additional content.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the additional toolbar content.
     * @private
     * @returns {void}
     */
    _setAdditionalToolbarContentRef(el) {
        this._additionalToolbarContentRef = el;
    }

    /**
     * Sets the internal reference to the HTMLInputElement used to hold the
     * welcome page input room element.
     *
     * @param {HTMLInputElement} el - The HTMLElement for the input of the room name on the welcome page.
     * @private
     * @returns {void}
     */
    _setRoomInputRef(el) {
        this._roomInputRef = el;
    }

    /**
     * Returns whether or not an additional card should be displayed near the tabs.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalCard() {
        return interfaceConfig.DISPLAY_WELCOME_PAGE_ADDITIONAL_CARD
            && this._additionalCardTemplate
            && this._additionalCardTemplate.content
            && this._additionalCardTemplate.innerHTML.trim();
    }

    /**
     * Returns whether or not additional content should be displayed below
     * the welcome page's header for entering a room name.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalContent() {
        return interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT
            && this._additionalContentTemplate
            && this._additionalContentTemplate.content
            && this._additionalContentTemplate.innerHTML.trim();
    }

    /**
     * Returns whether or not additional content should be displayed inside
     * the header toolbar.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalToolbarContent() {
        return interfaceConfig.DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT
            && this._additionalToolbarContentTemplate
            && this._additionalToolbarContentTemplate.content
            && this._additionalToolbarContentTemplate.innerHTML.trim();
    }
}

export default translate(connect(_mapStateToProps)(WelcomePage));
