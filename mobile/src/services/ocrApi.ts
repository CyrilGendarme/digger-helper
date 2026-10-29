import { apiRequest } from './api';
import { OCRResponse } from '../types/ocr';

/**
 * Upload a captured image to the backend OCR endpoint.
 * @param imageUri - local file URI from expo-camera / expo-image-picker
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResponse> {
  const formData = new FormData();

  // React Native FormData accepts this shape for file uploads
  formData.append('file', {
    uri: imageUri,
    name: 'record-ref.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  // Do NOT set Content-Type manually — fetch sets multipart boundary automatically
  return apiRequest<OCRResponse>('/ocr/extract', 'OCR request', {
    method: 'POST',
    body: formData,
  });
}
