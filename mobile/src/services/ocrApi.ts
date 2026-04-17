import { API_BASE_URL, getAuthHeaders } from './api';
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

  const response = await fetch(`${API_BASE_URL}/ocr/extract`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData,
    // Do NOT set Content-Type manually — fetch sets multipart boundary automatically
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OCR request failed (${response.status}): ${detail}`);
  }

  return response.json() as Promise<OCRResponse>;
}
