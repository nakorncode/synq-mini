import { Stack, UiProvider, token } from '@synqapp/ui';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import styled, {
  StyleSheetManager,
  createGlobalStyle,
  useTheme
} from 'styled-components';

import { Layout } from '~core/layout/Layout';
import { store, useAppSelector } from '~store';
import { selectLayoutFor } from '~store/slices/layouts';
import { PopupSettingsProvider } from '~ui/popup/contexts/PopupSettingsContext';
import ControllerScreen from '~ui/popup/screens/Controller';
import { DocumentContextProvidersWrapper } from '~ui/shared/contexts/DocumentContextProvidersWrapper';
import { useMusicServiceTab } from '~ui/shared/contexts/MusicServiceTab';
import { MarqueeStylesProvider } from '~ui/shared/styles/MarqueeStylesProvider';

interface PipUiProps {
  pipDocument: Document;
}

/**
 * The player surface inside the Picture-in-Picture window.
 *
 * The window is owned by the *service tab* content script, but its UI renders
 * into the PiP document, so styles are redirected there with
 * `StyleSheetManager`. See ADR-0001 for why this uses Document PiP at all.
 */
export const PipUi = ({ pipDocument }: PipUiProps) => {
  const theme = useTheme();

  return (
    <Provider store={store}>
      <MemoryRouter>
        <StyleSheetManager target={pipDocument.head}>
          <UiProvider>
            <DocumentContextProvidersWrapper>
              <PipGlobalStyles theme={theme} />
              <MarqueeStylesProvider />
              <PopupSettingsProvider
                value={{
                  queueCollapsible: false,
                  document: pipDocument,
                  keyControls: false
                }}
              >
                <PipRouter />
              </PopupSettingsProvider>
            </DocumentContextProvidersWrapper>
          </UiProvider>
        </StyleSheetManager>
      </MemoryRouter>
    </Provider>
  );
};

/**
 * The PiP surface always shows a player surface, never the popup's onboarding
 * routes. Which surface is shown is decided by the persisted layout; the popup's
 * own routing would otherwise take over and render a 350px-wide column here.
 */
const PipRouter = () => {
  const { musicServiceTab } = useMusicServiceTab();
  const layout = useAppSelector((state) =>
    selectLayoutFor(state.layouts, musicServiceTab?.musicService)
  );

  if (!musicServiceTab) {
    // No service tab is active yet, so there is no player to render.
    return <EmptyState />;
  }

  return (
    <Container spacing="none" $layout={layout}>
      <ControllerScreen />
    </Container>
  );
};

const PipGlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background: ${token('colors.background')};
  }
`;

interface ContainerProps {
  $layout: Layout;
}

const Container = styled(Stack)<ContainerProps>`
  align-items: ${({ $layout }) =>
    $layout === Layout.Compact ? 'stretch' : 'flex-start'};
  justify-content: flex-start;
  height: 100vh;
  overflow: hidden;
  width: 100vw;

  & > * {
    flex: 0 0 auto;
  }
`;

const EmptyState = styled.div`
  background: ${token('colors.background')};
  height: 100vh;
  width: 100vw;
`;
