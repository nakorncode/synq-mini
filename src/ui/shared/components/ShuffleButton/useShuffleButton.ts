import { sendToContent } from '~core/messaging/sendToContent';
import { MusicControllerMessage } from '~types';
import { useMusicServiceTab } from '~ui/shared/contexts/MusicServiceTab';
import { sendAnalytic } from '~util/analytics';

export const useShuffleButton = () => {
  const { musicServiceTab } = useMusicServiceTab();

  // The player state carries no shuffle flag, so the button is a plain action
  // rather than a stateful toggle: the service is the source of truth and the
  // observer will report back if it changes anything we display.
  const handleClick = () => {
    sendToContent(
      {
        name: MusicControllerMessage.TOGGLE_SHUFFLE
      },
      musicServiceTab?.tabId
    );
    sendAnalytic({
      name: 'toggle_shuffle'
    });
  };

  return { handleClick };
};
