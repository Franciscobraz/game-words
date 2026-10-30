import type { Locator, Page } from '@playwright/test';
import jsQR from 'jsqr';

/** The text a QR reader gets from a real screenshot of `qr`; null when it cannot read it (TVLOBBY-01 AC 2). */
export async function readQr(page: Page, qr: Locator): Promise<string | null> {
  const png = await qr.screenshot();
  const image = await page.evaluate(pixelsOfPng, png.toString('base64'));
  return jsQR(Uint8ClampedArray.from(image.data), image.width, image.height)?.data ?? null;
}

/** Runs in the page, which already has a PNG decoder. */
async function pixelsOfPng(base64: string): Promise<{ width: number; height: number; data: number[] }> {
  const response = await fetch(`data:image/png;base64,${base64}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0);
  const { width, height, data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
  return { width, height, data: Array.from(data) };
}
