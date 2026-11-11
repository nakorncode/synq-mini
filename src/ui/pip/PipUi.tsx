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
 * routes: those would render a 350px-wide column here, which is the wrong shape
 * for a window the user has resized. Which surface is shown is decided by the
 * persisted layout.
 *
 * Rendering does not wait for the active tab to be known. The tab id arrives
 * asynchronously from the background worker, and gating on it would leave the
 * window blank whenever that reply is slower than the window's first paint. The
 * controller screen already handles a missing tab by showing its idle state, and
 * it re-renders once the tab resolves.
 */
const PipRouter = () => {
  const { musicServiceTab } = useMusicServiceTab();
  const layout = useAppSelector((state) =>
    selectLayoutFor(state.layouts, musicServiceTab?.musicService)
  );

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
