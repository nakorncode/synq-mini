import { sendToContent } from '~core/messaging/sendToContent';
import { MusicControllerMessage } from '~types';
import { useMusicServiceTab } from '~ui/shared/contexts/MusicServiceTab';
import { sendAnalytic } from '~util/analytics';

/**
 * Opens the music service's own "save to playlist" flow.
 *
 * v1 delegates to the service's action menu rather than rendering a playlist
 * picker of its own (see Q8=C). The service owns playlist membership, so this
 * keeps the extension out of write APIs it has no verified access to.
 */
export const useAddToPlaylistButton = () => {
  const { musicServiceTab } = useMusicServiceTab();

  const handleClick = () => {
    sendToContent(
      {
        name: MusicControllerMessage.OPEN_ADD_TO_PLAYLIST
      },
      musicServiceTab?.tabId
    );
    sendAnalytic({ name: 'open_add_to_playlist' });
  };

  return { handleClick };
};
