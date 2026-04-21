import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { LayoutRectangle } from 'react-native';

import { FRAME_H, FRAME_W } from '../components/CameraOverlay/styles';

type CapturedPhoto = {
  uri: string;
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function cropToOverlayFrame(
  photo: CapturedPhoto,
  previewLayout: LayoutRectangle,
): Promise<string> {
  const viewWidth = previewLayout.width;
  const viewHeight = previewLayout.height;
  if (!viewWidth || !viewHeight) {
    return photo.uri;
  }

  const imageWidth = photo.width;
  const imageHeight = photo.height;
  if (!imageWidth || !imageHeight) {
    return photo.uri;
  }

  // Camera preview uses "cover" behavior: image is scaled to fill preview bounds.
  const scale = Math.max(viewWidth / imageWidth, viewHeight / imageHeight);
  const displayedWidth = imageWidth * scale;
  const displayedHeight = imageHeight * scale;
  const offsetX = (displayedWidth - viewWidth) / 2;
  const offsetY = (displayedHeight - viewHeight) / 2;

  const frameX = (viewWidth - FRAME_W) / 2;
  const frameY = (viewHeight - FRAME_H) / 2;

  const originX = clamp(Math.round((frameX + offsetX) / scale), 0, imageWidth - 1);
  const originY = clamp(Math.round((frameY + offsetY) / scale), 0, imageHeight - 1);
  const width = clamp(Math.round(FRAME_W / scale), 1, imageWidth - originX);
  const height = clamp(Math.round(FRAME_H / scale), 1, imageHeight - originY);

  const cropped = await manipulateAsync(
    photo.uri,
    [{ crop: { originX, originY, width, height } }],
    { compress: 0.95, format: SaveFormat.JPEG },
  );

  return cropped.uri;
}
