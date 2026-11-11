import { Icon, token } from '@synqapp/ui';
import { css, styled } from 'styled-components';

import { type Layout } from '~core/layout/Layout';
import { nextLayout } from '~core/layout/layoutSwitcher';
import { useLayoutSwitcher } from '~ui/shared/hooks/useLayoutSwitcher';

const LAYOUT_LABELS: Record<Layout, string> = {
  compact: 'Compact',
  standard: 'Standard',
  cinema: 'Cinema'
};

interface LayoutSwitcherButtonProps {
  size?: number;
}

/**
 * Cycles the player surface through the available layouts.
 *
 * The label names the layout the click will move *to*, so it reads as an action
 * rather than as a status.
 */
export const LayoutSwitcherButton = ({ size }: LayoutSwitcherButtonProps) => {
  const { currentLayout, handleClick } = useLayoutSwitcher();

  if (!size) {
    size = 32;
  }

  const targetLabel = LAYOUT_LABELS[nextLayout(currentLayout)];
  const label = `Switch to ${targetLabel} layout`;

  return (
    <Container
      onClick={handleClick}
      $size={`${size}px`}
      title={label}
      aria-label={label}
    >
      <Icon width={size * 0.6} height={size * 0.6} icon="mobile" />
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
