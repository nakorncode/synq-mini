import { useCallback } from 'react';

import { nextLayout, sizeForLayout } from '~core/layout/layoutSwitcher';
import { useAppDispatch, useAppSelector } from '~store';
import { selectLayoutFor, setLayout } from '~store/slices/layouts';
import { useMusicServiceTab } from '~ui/shared/contexts/MusicServiceTab';
import { sendAnalytic } from '~util/analytics';

declare let window: Window & {
  documentPictureInPicture?: {
    window?: Window;
  };
};

/**
 * Switches the player surface to the next layout and, when a Picture-in-Picture
 * window is open, resizes it to match.
 *
 * Resizing a PiP window requires a user gesture, so this must stay inside the
 * click handler that calls it. When there is no PiP window (the in-page mini
 * player) only the preference is stored.
 */
export const useLayoutSwitcher = () => {
  const dispatch = useAppDispatch();
  const { musicServiceTab } = useMusicServiceTab();
  const musicService = musicServiceTab?.musicService;
  const currentLayout = useAppSelector((state) =>
    selectLayoutFor(state.layouts, musicService)
  );

  const handleClick = useCallback(() => {
    const layout = nextLayout(currentLayout);

    if (musicService) {
      dispatch(setLayout({ musicService, layout }));
    }

    const pipWindow = window.documentPictureInPicture?.window;

    if (pipWindow && !pipWindow.closed) {
      const { width, height } = sizeForLayout(layout);

      try {
        pipWindow.resizeTo(width, height);
      } catch {
        // Chrome rejects the resize when the gesture was consumed elsewhere.
        // The layout still applies; only the window keeps its current size.
      }
    }

    sendAnalytic({ name: 'switch_layout', params: { layout } });
  }, [currentLayout, dispatch, musicService]);

  return { currentLayout, handleClick };
};
