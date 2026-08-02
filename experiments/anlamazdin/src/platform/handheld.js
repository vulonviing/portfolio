const PHONE_SHORT_SIDE_MAX = 600;

function finiteDimension(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function isHandheldPhone({
  coarsePointer = false,
  maxTouchPoints = 0,
  noHover = false,
  screenHeight,
  screenWidth,
  userAgentDataMobile = false,
} = {}) {
  const width = finiteDimension(screenWidth);
  const height = finiteDimension(screenHeight);
  if (!width || !height) return false;

  const phoneSized = Math.min(width, height) <= PHONE_SHORT_SIDE_MAX;
  const touchCapable = Number(maxTouchPoints) > 0;
  const phoneInput = userAgentDataMobile === true || (coarsePointer && noHover);
  return phoneSized && touchCapable && phoneInput;
}

export function isPortraitViewport({ height, width } = {}) {
  const safeWidth = finiteDimension(width);
  const safeHeight = finiteDimension(height);
  return Boolean(safeWidth && safeHeight && safeHeight > safeWidth);
}
