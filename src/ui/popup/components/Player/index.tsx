import { Flex, token } from '@synqapp/ui';
import styled from 'styled-components';

import { AlbumArt } from '../../../shared/components/AlbumArt';
import { PlayerControls } from '../PlayerControls';

/**
 * The standard player surface.
 *
 * Cover art is 84px rather than the upstream 105px, a deliberate 20% reduction
 * so the whole surface reads as compact without dropping any control.
 */
const COVER_ART_SIZE = 84;

export const Player = () => {
  return (
    <Flex direction="row" justify="space-between" align="center">
      <AlbumArtContainer>
        <AlbumArt thumbs={false} />
      </AlbumArtContainer>
      <PlayerControlsContainer>
        <PlayerControls />
      </PlayerControlsContainer>
    </Flex>
  );
};

const AlbumArtContainer = styled.div`
  flex: 0 0 auto;
  height: ${COVER_ART_SIZE}px;
  width: ${COVER_ART_SIZE}px;
`;

const PlayerControlsContainer = styled.div`
  height: fit-content;
  margin-left: ${token('spacing.sm')};
  margin-top: ${token('spacing.none')};
  width: calc(100% - ${COVER_ART_SIZE}px - ${token('spacing.sm')});
`;
