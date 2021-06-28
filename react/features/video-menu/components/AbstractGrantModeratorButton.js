// @flow
import React from 'react';

import { isDomainPremium } from '../../../../limitations.ts';
import { openDialog, Dialog } from '../../base/dialog';
import { IconCrown } from '../../base/icons';
import {
    getLocalParticipant,
    getParticipantById,
    isParticipantModerator,
    PARTICIPANT_ROLE
} from '../../base/participants';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

import { GrantModeratorDialog } from '.';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant for whom to grant moderator status.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which kicks the remote participant.
 */
export default class AbstractGrantModeratorButton extends AbstractButton<Props, *> {
  accessibilityLabel = 'toolbar.accessibilityLabel.grantModerator';
  icon = IconCrown;
  label = 'videothumbnail.grantModerator';

  /**
   * Handles clicking / pressing the button, and kicks the participant.
   *
   * @private
   * @returns {void}
   */
  _handleClick() {
      const { dispatch, participantID } = this.props;

      if (isDomainPremium) {
          dispatch(openDialog(GrantModeratorDialog, { participantID }));
      } else {
          dispatch(openDialog(() => (
              <Dialog
                  okDisabled = { true }>
                Назначение безлимитного количества модераторов доступно в оплаченной Connect комнате
              </Dialog>
          )));
      }
  }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const { participantID } = ownProps;

    const localParticipant = getLocalParticipant(state);
    const targetParticipant = getParticipantById(state, participantID);

    return {
        visible: Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR)
          && !isParticipantModerator(targetParticipant)
    };
}
