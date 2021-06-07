import React from 'react';

import DesktopButton from './DesktopButton';
import MobileButton from './MobileButton';

// const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isMobile = () => true;

const LocalRecordingButton = ({ isDialogShown, t }) => isMobile()
    ? <MobileButton
        isDialogShown = { isDialogShown }
        t = { t } />
    : <DesktopButton
        isDialogShown = { isDialogShown }
        t = { t } />;

export default LocalRecordingButton;
