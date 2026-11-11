import { Icon, token } from '@synqapp/ui';
import { css, styled } from 'styled-components';

import { useAddToPlaylistButton } from './useAddToPlaylistButton';

interface AddToPlaylistButtonProps {
  size?: number;
}

/**
 * Opens the service's save-to-playlist flow.
 *
 * The icon reuses the UI package's `musicNote` glyph because the design system
 * ships no playlist icon yet.
 */
export const AddToPlaylistButton = ({ size }: AddToPlaylistButtonProps) => {
  const { handleClick } = useAddToPlaylistButton();

  if (!size) {
    size = 32;
  }

  return (
    <Container
      onClick={handleClick}
      $size={`${size}px`}
      title="Add to playlist"
      aria-label="Add to playlist"
    >
      <Icon width={size * 0.6} height={size * 0.6} icon="musicNote" />
    </Container>
  );
};

interface ContainerProps {
  $size?: string;
}

const Container = styled.button<ContainerProps>`
  align-items: center;
  background: none;
  border: none;
  color: ${token('colors.onBackground')};
  cursor: pointer;
  display: flex;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.1s ease-in-out;

  &:hover {
    opacity: 1;
  }

  ${({ $size }) =>
    $size &&
    css`
      height: ${$size};
      width: ${$size};
    `}
`;
