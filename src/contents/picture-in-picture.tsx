import { UiProvider } from '@synqapp/ui';
import type { PlasmoCSConfig, PlasmoCSUIProps } from 'plasmo';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { sizeForLayout } from '~core/layout/layoutSwitcher';
import { store } from '~store';
import { selectLayoutFor } from '~store/slices/layouts';
import { PipToggleButton } from '~ui/pip/PipToggleButton';
import { PipUi } from '~ui/pip/PipUi';
import { sendAnalytic } from '~util/analytics';

declare let window: {
  documentPictureInPicture?: {
    requestWindow: (options?: {
      width?: number;
      height?: number;
    }) => Promise<Window>;
  };
};

export const config: PlasmoCSConfig = {
  matches: [
    '*://music.apple.com/*',
    '*://open.spotify.com/*',
    '*://music.youtube.com/*',
    '*://music.amazon.com/*'
  ],
  all_frames: true
};

export const getRootContainer = () => {
  const container = document.createElement('div');
  container.setAttribute('id', 'synq-pip-container');
  container.style.position = 'fixed';
  container.style.top = '120px';
  container.style.right = '0';
  container.style.zIndex = '99';

  document.body.append(container);

  const style = document.createElement('style');
  style.innerHTML = `
  #synq-pip-container > .plasmo-csui-container {
    position: unset !important;
  }
  `;

  document.head.append(style);

  return container;
};

const PipTriggerUi = ({ anchor }: PlasmoCSUIProps) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (window?.documentPictureInPicture) {
      setShowButton(true);
    }
  }, []);

  const handleButtonClick = async () => {
    // Open at the size of the layout the user last chose, rather than a fixed
    // size, so the window matches the persisted preference from the start.
    // This content script runs outside React providers, so state comes straight
    // from the store rather than from a context hook.
    const { musicServiceTabs, layouts } = store.getState();
    const musicService = Object.values(musicServiceTabs)[0]?.musicService;
    const layout = selectLayoutFor(layouts, musicService);
    const { width, height } = sizeForLayout(layout);

    const pipWindow = await window.documentPictureInPicture?.requestWindow({
      width,
      height
    });

    if (!pipWindow) return;

    const container = pipWindow.document.createElement('div');
    pipWindow.document.body.append(container);

    const pipRoot = createRoot(container);
    pipRoot.render(
      <UiProvider>
        <PipUi pipDocument={pipWindow.document} />
      </UiProvider>
    );

    setShowButton(false);

    sendAnalytic({ name: 'pip_opened', params: { layout } });

    pipWindow.addEventListener('pagehide', () => {
      setShowButton(true);
      sendAnalytic({ name: 'pip_closed' });
    });
  };

  return (
    <Provider store={store}>
      <UiProvider>
        {showButton && <PipToggleButton onClick={handleButtonClick} />}
      </UiProvider>
    </Provider>
  );
};

export default PipTriggerUi;
