export function randnum(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
export async function isIncognito(window) {
  if (!navigator.storage || !navigator.storage.estimate) {
    return false;
  }

  try {
    const { quota } = await navigator.storage.estimate();

    return quota && quota < 150 * 1024 * 1024;
  } catch {
    return false;
  }
}
export function isMobile(window) {
  if ("onorientationchange" in window && "orientation" in window) {
    return true;
  }
  return false;
}
