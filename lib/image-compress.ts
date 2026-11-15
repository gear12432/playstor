export function isRenderableImageSrc(src?: string | null): boolean {
  if (!src) return false;
  return src.startsWith('http') || src.startsWith('/') || src.startsWith('data:image/');
}

export async function compressImageFileToDataUrl(
  file: File,
  options: {
    maxWidth: number;
    maxHeight: number;
    maxChars: number;
    initialQuality?: number;
  }
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPG, WebP, etc.).');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read the selected image file.'));
      el.src = objectUrl;
    });

    const scale = Math.min(
      1,
      options.maxWidth / Math.max(1, img.naturalWidth),
      options.maxHeight / Math.max(1, img.naturalHeight)
    );

    const targetWidth = Math.max(1, Math.round(img.naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser canvas image processing is unavailable.');
    }
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const qualities = [options.initialQuality ?? 0.82, 0.68, 0.54, 0.4];
    const mimeTypes = ['image/webp', 'image/jpeg'];

    for (const mime of mimeTypes) {
      for (const q of qualities) {
        const dataUrl = canvas.toDataURL(mime, q);
        if (dataUrl.startsWith(`data:${mime}`) && dataUrl.length <= options.maxChars) {
          return dataUrl;
        }
      }
    }

    // Final downscaled fallback if source image was very dense
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = Math.max(1, Math.round(targetWidth * 0.65));
    smallCanvas.height = Math.max(1, Math.round(targetHeight * 0.65));
    const smallCtx = smallCanvas.getContext('2d');
    if (smallCtx) {
      smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
      const fallbackUrl = smallCanvas.toDataURL('image/jpeg', 0.55);
      if (fallbackUrl.length <= options.maxChars) {
        return fallbackUrl;
      }
    }

    throw new Error('Selected image is too large even after compression. Choose a smaller image.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
