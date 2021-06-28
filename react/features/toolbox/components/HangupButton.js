// @flow

import _ from 'lodash';
import React from 'react';

import { isDomainPremium, timeLimitation, timeTillNotification } from '../../../../limitations.ts';
import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { appNavigate } from '../../app/actions';
import { disconnect } from '../../base/connection';
import { openDialog, Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { AbstractHangupButton } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';


/**
 * The type of the React {@code Component} props of {@link HangupButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends AbstractHangupButton
 */
class HangupButton extends AbstractHangupButton<Props, *> {
    _hangup: Function;

    accessibilityLabel = 'toolbar.accessibilityLabel.hangup';
    label = 'toolbar.hangup';
    tooltip = 'toolbar.hangup';

    /**
     * Initializes a new HangupButton instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._hangup = _.once(() => {
            sendAnalytics(createToolbarEvent('hangup'));

            // FIXME: these should be unified.
            if (navigator.product === 'ReactNative') {
                this.props.dispatch(appNavigate(undefined));
            } else {
                this.props.dispatch(disconnect(true));
            }
        });
    }

    // eslint-disable-next-line require-jsdoc
    componentDidMount() {
        if (!isDomainPremium) {
            setTimeout(() => {
                this.props.dispatch(openDialog(() => (
                    <Dialog
                        okDisabled = { true }>
                        Через 10 минут Ваша конференция будет окончена, для безлимитного общения необходимо перейти в оплаченную Connect комнату
                    </Dialog>
                )));
            }, timeTillNotification);

            setTimeout(() => {
                this._doHangup();
            }, timeLimitation);
        }
    }

    /**
     * Helper function to perform the actual hangup action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _doHangup() {
        this._hangup();
    }
}

export default translate(connect()(HangupButton));
