/**
 * Utility functions
 * ALL LOGIC PRESERVED - NO CHANGES
 */
export function randnum(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

export async function isIncognito(windowData) {
  // Server-side receives this info from client
  return windowData.isIncognito || false;
}

export function isMobile(windowData) {
  if (windowData.onorientationchange && windowData.hasOrientation) {
    return true;
  }
  return false;
}
