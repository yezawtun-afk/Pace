import { Platform } from 'react-native';

/**
 * Web-only: turns an SVG data URL into a PNG data URL by drawing it onto a
 * canvas. Native capture already produces a PNG, so this never runs there.
 */
async function svgToPng(svgDataUrl: string, width: number, height: number): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  const image = new Image();
  image.width = width;
  image.height = height;
  image.src = svgDataUrl;

  try {
    await image.decode();
  } catch {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return null;

  // The card is designed on warm paper, so the PNG gets the same ground
  // instead of a transparent background.
  context.fillStyle = '#FBF8F4';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/png');
}

/** Downloads a data URL in the browser. No-op on native. */
export async function downloadImage(
  dataUrl: string,
  filename: string,
  width = 1080,
  height = 1920,
): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;

  const isSvg = dataUrl.startsWith('data:image/svg');
  const href = isSvg ? ((await svgToPng(dataUrl, width, height)) ?? dataUrl) : dataUrl;

  const link = document.createElement('a');
  link.href = href;
  link.download = href === dataUrl && isSvg ? filename.replace(/\.[^.]+$/, '.svg') : filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  return true;
}
