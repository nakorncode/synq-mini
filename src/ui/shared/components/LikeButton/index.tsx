import { token } from '@synqapp/ui';
import { css, styled } from 'styled-components';

import { useAlbumArt } from '~ui/shared/components/AlbumArt/useAlbumArt';

interface LikeButtonProps {
  size?: number;
}

/**
 * A persistent like control.
 *
 * Upstream only exposed like/dislike on hover over the album art, which made
 * them undiscoverable. This renders the same action as a normal control-row
 * button for services that support likes.
 *
 * Returns `null` for services without like support, so the control row does not
 * carry a dead button.
 */
export const LikeButton = ({ size }: LikeButtonProps) => {
  const { isLiked, handleLikeClick } = useAlbumArt();

  if (!handleLikeClick) {
    return null;
  }

  if (!size) {
    size = 30;
  }

  return (
    <Container
      onClick={handleLikeClick}
      $size={`${size}px`}
      $active={Boolean(isLiked)}
      title={isLiked ? 'Unlike' : 'Like'}
      aria-label={isLiked ? 'Unlike' : 'Like'}
      aria-pressed={Boolean(isLiked)}
    >
      <Heart
        $active={Boolean(isLiked)}
        $size={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 21s-7.5-4.7-9.3-9A5.2 5.2 0 0 1 12 5.6 5.2 5.2 0 0 1 21.3 12C19.5 16.3 12 21 12 21Z" />
      </Heart>
    </Container>
  );
};

interface ContainerProps {
  $size?: string;
  $active?: boolean;
}

const Container = styled.button<ContainerProps>`
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  opacity: ${({ $active }) => ($active ? 1 : 0.7)};
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

interface HeartProps {
  $active?: boolean;
  $size: number;
}

const Heart = styled.svg<HeartProps>`
  fill: ${({ $active }) =>
    $active ? token('colors.base.orange.4') : 'transparent'};
  height: ${({ $size }) => $size * 0.72}px;
  stroke: ${({ $active }) =>
    $active ? token('colors.base.orange.4') : token('colors.onBackground')};
  stroke-width: 1.8;
  transition: fill 0.1s ease-in-out, stroke 0.1s ease-in-out;
  width: ${({ $size }) => $size * 0.72}px;
`;
