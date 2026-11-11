import { Flex, token } from '@synqapp/ui';
import { useState } from 'react';
import { css, styled } from 'styled-components';

import { AlbumArt } from '~ui/shared/components/AlbumArt';
import { LayoutSwitcherButton } from '~ui/shared/components/LayoutSwitcherButton';
import { NextButton } from '~ui/shared/components/NextButton';
import { PlayPauseButton } from '~ui/shared/components/PlayPauseButton';
import { PreviousButton } from '~ui/shared/components/PreviousButton';
import { RepeatButton } from '~ui/shared/components/RepeatButton';
import { ShuffleButton } from '~ui/shared/components/ShuffleButton';
import { TrackTitle } from '~ui/shared/components/TrackTitle';

/**
 * The smallest player surface: identity plus the two controls needed to keep
 * listening. Everything else stays hidden until the pointer enters, so the
 * window can stay tiny without losing access to the full control set.
 */
export const CompactLayout = () => {
  const [revealSecondary, setRevealSecondary] = useState(false);

  return (
    <Container
      align="center"
      justify="space-between"
      onMouseEnter={() => setRevealSecondary(true)}
      onMouseLeave={() => setRevealSecondary(false)}
    >
      <ArtContainer>
        <AlbumArt />
      </ArtContainer>
      <Identity>
        <TrackTitle size="sm" weight="semibold" />
      </Identity>
      <Controls align="center" justify="flex-end">
        <SecondaryControls $hidden={!revealSecondary}>
          <ShuffleButton size={22} />
          <PreviousButton size={22} />
          <RepeatButton size={22} />
        </SecondaryControls>
        <PlayPauseButton size={26} />
        <NextButton size={26} />
        <LayoutSwitcherButton size={22} />
      </Controls>
    </Container>
  );
};

const Container = styled(Flex)`
  gap: ${token('spacing.2xs')};
  height: 100vh;
  min-width: 0;
  overflow: hidden;
  padding: 0 ${token('spacing.xs')};
  width: 100%;
`;

const ArtContainer = styled.div`
  flex: 0 0 auto;
  height: 48px;
  width: 48px;
`;

const Identity = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
`;

const Controls = styled(Flex)`
  flex: 0 0 auto;
  gap: ${token('spacing.2xs')};
`;

interface SecondaryControlsProps {
  $hidden?: boolean;
}

const SecondaryControls = styled(Flex)<SecondaryControlsProps>`
  align-items: center;
  gap: ${token('spacing.2xs')};
  opacity: 1;
  transition: opacity 0.1s ease-in-out;

  ${({ $hidden }) =>
    $hidden &&
    css`
      opacity: 0;
      width: 0;
      overflow: hidden;
    `}
`;
