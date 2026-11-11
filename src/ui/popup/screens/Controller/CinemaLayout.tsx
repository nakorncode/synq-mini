import { Flex, token } from '@synqapp/ui';
import { styled } from 'styled-components';

import { usePopupSettings } from '~ui/popup/contexts/PopupSettingsContext';
import { AlbumArt } from '~ui/shared/components/AlbumArt';
import { useAlbumArt } from '~ui/shared/components/AlbumArt/useAlbumArt';
import { ArtistName } from '~ui/shared/components/ArtistName';
import { LayoutSwitcherButton } from '~ui/shared/components/LayoutSwitcherButton';
import { TrackTitle } from '~ui/shared/components/TrackTitle';
import { useHasServiceVideo } from '~ui/shared/hooks/useHasServiceVideo';

import { useVideoStage } from './useVideoStage';

/**
 * The video-first layout.
 *
 * It mirrors the music service rather than steering it (see ADR-0001): when the
 * service exposes a video element, that element is re-parented into this window
 * and fills the frame. When the service exposes none, the layout shows the same
 * track's cover art against a blurred backdrop. Nothing here switches the
 * service's playback mode.
 */
export const CinemaLayout = () => {
  const { src } = useAlbumArt();
  const { document: pipDocument } = usePopupSettings();
  const hasVideo = useHasServiceVideo();

  useVideoStage(pipDocument, hasVideo);

  return (
    <Container justify="center" align="center" $hasVideo={hasVideo}>
      {!hasVideo && <Backdrop $src={src} aria-hidden="true" />}
      {!hasVideo && (
        <CoverArtContainer>
          <AlbumArt />
        </CoverArtContainer>
      )}
      <Overlay justify="space-between" align="flex-end">
        <Identity>
          <TrackTitle size="md" weight="semibold" />
          <ArtistName size="sm" />
        </Identity>
        <LayoutSwitcherButton size={28} />
      </Overlay>
    </Container>
  );
};

interface ContainerProps {
  $hasVideo: boolean;
}

const Container = styled(Flex)<ContainerProps>`
  background: ${token('colors.base.black')};
  height: 100vh;
  overflow: hidden;
  position: relative;
  width: 100vw;

  ${({ $hasVideo }) =>
    $hasVideo &&
    `
      /* The service's video is appended to this document by useVideoStage, so
         leaving the frame transparent lets it show through underneath. */
      background: transparent;
    `}
`;

interface BackdropProps {
  $src?: string;
}

const Backdrop = styled.div<BackdropProps>`
  background-image: ${({ $src }) => ($src ? `url(${$src})` : 'none')};
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: blur(28px) saturate(1.3);
  inset: -40px;
  opacity: 0.7;
  position: absolute;
`;

const CoverArtContainer = styled.div`
  height: min(80vh, 80vw);
  max-width: 90vw;
  position: relative;
  width: min(80vh, 80vw);
`;

const Overlay = styled(Flex)`
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent);
  bottom: 0;
  gap: ${token('spacing.sm')};
  left: 0;
  padding: ${token('spacing.md')};
  position: absolute;
  right: 0;
  z-index: 1;
`;

const Identity = styled.div`
  min-width: 0;
  overflow: hidden;
`;
