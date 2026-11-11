import { Flex, token } from '@synqapp/ui';
import { useState } from 'react';
import styled, { css } from 'styled-components';

import { AddToPlaylistButton } from '~ui/shared/components/AddToPlaylistButton';
import { LayoutSwitcherButton } from '~ui/shared/components/LayoutSwitcherButton';
import { LikeButton } from '~ui/shared/components/LikeButton';
import { NextButton } from '~ui/shared/components/NextButton';
import { PlayPauseButton } from '~ui/shared/components/PlayPauseButton';
import { PreviousButton } from '~ui/shared/components/PreviousButton';
import { RepeatButton } from '~ui/shared/components/RepeatButton';
import { ShuffleButton } from '~ui/shared/components/ShuffleButton';
import { VolumeButton } from '~ui/shared/components/VolumeButton';
import { VolumeSlider } from '~ui/shared/components/VolumeSlider';

/**
 * The control row of the standard layout.
 *
 * Shuffle, like, and add-to-playlist are first-class buttons here rather than
 * hover-only affordances, because the point of the standard layout is that every
 * action is reachable without discovering a hidden state. The volume slider
 * still takes over the row on hover, as before.
 */
export const ControlButtons = () => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleVolumeMouseEnter = () => {
    setShowVolumeSlider(true);
  };

  const handleVolumeMouseLeave = () => {
    setShowVolumeSlider(false);
  };

  return (
    <ControlButtonsContainer>
      <ControlButtonsFlex justify="space-between" align="center">
        <div
          onMouseEnter={handleVolumeMouseEnter}
          onMouseLeave={handleVolumeMouseLeave}
        >
          <VolumeButton />
        </div>
        <HideableButtonContainer $hidden={showVolumeSlider}>
          <ShuffleButton />
        </HideableButtonContainer>
        <HideableButtonContainer $hidden={showVolumeSlider}>
          <PreviousButton />
        </HideableButtonContainer>
        <HideableButtonContainer $hidden={showVolumeSlider}>
          <PlayPauseButton />
        </HideableButtonContainer>
        <HideableButtonContainer $hidden={showVolumeSlider}>
          <NextButton />
        </HideableButtonContainer>
        <HideableButtonContainer $hidden={showVolumeSlider}>
          <RepeatButton />
        </HideableButtonContainer>
        <HideableButtonContainer $hidden={showVolumeSlider}>
          <LikeButton />
        </HideableButtonContainer>
        <HideableButtonContainer $hidden={showVolumeSlider}>
          <AddToPlaylistButton />
        </HideableButtonContainer>
        <HideableButtonContainer $hidden={showVolumeSlider}>
          <LayoutSwitcherButton />
        </HideableButtonContainer>
      </ControlButtonsFlex>
      <VolumeSliderContainer
        justify="flex-end"
        align="center"
        $show={showVolumeSlider}
        onMouseEnter={handleVolumeMouseEnter}
        onMouseLeave={handleVolumeMouseLeave}
      >
        <VolumeSlider />
      </VolumeSliderContainer>
    </ControlButtonsContainer>
  );
};

const ControlButtonsContainer = styled.div`
  position: relative;
  height: 30px;
`;

const ControlButtonsFlex = styled(Flex)`
  position: absolute;
  z-index: 1;
  width: 100%;
`;

interface HideableButtonContainerProps {
  $hidden?: boolean;
}

const HideableButtonContainer = styled.div<HideableButtonContainerProps>`
  opacity: 1;

  ${({ $hidden }) =>
    $hidden &&
    css`
      opacity: 0;
    `}
`;

interface VolumeSliderContainerProps {
  $show?: boolean;
}

const VolumeSliderContainer = styled(Flex)<VolumeSliderContainerProps>`
  height: 100%;
  opacity: 0;
  transition: opacity 0.1s ease-in-out;
  position: absolute;
  z-index: 0;
  width: 85%;
  right: ${token('spacing.2xs')};
  padding-left: ${token('spacing.xs')};

  ${({ $show }) =>
    $show &&
    css`
      opacity: 1;
      z-index: 1;
    `}
`;
