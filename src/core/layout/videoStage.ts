/**
 * Where a re-parented video element came from, so it can be put back.
 *
 * Re-parenting is the only way to show the service's own video at full frame
 * together with this extension's controls (see ADR-0001), but the element is
 * destroyed along with the PiP document unless it is moved back first. The
 * restore point is what makes that possible.
 */
export interface RestorePoint {
  parent: Node;
  /** The sibling that followed the video, used to restore its exact position. */
  nextSibling: Node | null;
}

/**
 * Inline styles {@link fillStage} applies, remembered so {@link clearStageStyles}
 * can put the service's own values back. The service styles its video element
 * itself, so clobbering those styles permanently would leave the player broken in
 * the service's own tab.
 */
const stageStyles = new WeakMap<HTMLVideoElement, Record<string, string>>();

/** CSS property names, already kebab-cased for `style.setProperty`. */
const STAGE_STYLES: Record<string, string> = {
  position: 'fixed',
  top: '0px',
  left: '0px',
  width: '100%',
  height: '100%',
  'object-fit': 'contain',
  // Behind the layout's overlays, which sit at z-index 1.
  'z-index': '0'
};

/**
 * Records where the video element currently sits.
 *
 * Returns `null` when the service exposes no video element, which is how the
 * caller learns to render the cover-art stage instead.
 */
export const captureRestorePoint = (
  video: HTMLVideoElement | null
): RestorePoint | null => {
  if (!video?.parentNode) {
    return null;
  }

  return {
    parent: video.parentNode,
    nextSibling: video.nextSibling
  };
};

/**
 * Moves the service's video into the PiP document.
 *
 * Returns `false` when there is nothing to host, letting the caller fall back
 * to the cover-art stage. The caller owns the returned restore point and must
 * pass it to {@link evacuateVideo} when the PiP window closes.
 */
export const hostVideo = (
  video: HTMLVideoElement | null,
  pipDocument: Document,
  restorePoint: RestorePoint | null
): boolean => {
  if (!video || !restorePoint) {
    return false;
  }

  pipDocument.body.append(video);

  return true;
};

/**
 * Makes the re-parented service video fill the PiP window.
 *
 * The service sizes its video for its own player container, so without this the
 * element arrives at whatever dimensions its inline styles described and the PiP
 * window shows a small picture in a large frame. `object-fit: contain` keeps the
 * aspect ratio, letterboxing rather than stretching.
 */
export const fillStage = (video: HTMLVideoElement | null): void => {
  if (!video) {
    return;
  }

  const previous: Record<string, string> = {};

  for (const [property, value] of Object.entries(STAGE_STYLES)) {
    previous[property] = video.style.getPropertyValue(property);
    video.style.setProperty(property, value);
  }

  if (!stageStyles.has(video)) {
    stageStyles.set(video, previous);
  }
};

/**
 * Puts back the inline styles {@link fillStage} replaced, leaving the element as
 * the service expects to find it.
 */
export const clearStageStyles = (video: HTMLVideoElement | null): void => {
  if (!video) {
    return;
  }

  const previous = stageStyles.get(video);

  if (!previous) {
    return;
  }

  for (const [property, value] of Object.entries(previous)) {
    if (value) {
      video.style.setProperty(property, value);
    } else {
      video.style.removeProperty(property);
    }
  }

  stageStyles.delete(video);
};

/**
 * Returns the video to its restore point, in its original DOM position.
 *
 * Safe to call when nothing was hosted, and safe to call twice: the element is
 * simply re-inserted into the same parent without duplicating it. A restore
 * point whose parent has left the document is tolerated, because the service
 * may re-render its shell while the PiP window is open.
 */
export const evacuateVideo = (
  video: HTMLVideoElement | null,
  restorePoint: RestorePoint | null
): void => {
  if (!video || !restorePoint) {
    return;
  }

  clearStageStyles(video);

  const { parent, nextSibling } = restorePoint;

  // `insertBefore` requires the reference node to still be a child of `parent`,
  // so fall back to appending when the service shuffled its DOM underneath us.
  const reference =
    nextSibling && nextSibling.parentNode === parent ? nextSibling : null;

  parent.insertBefore(video, reference);
};
