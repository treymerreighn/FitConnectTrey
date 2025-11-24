import { apiRequest } from "./queryClient";

export interface ImageUploadResult {
  success: boolean;
  url: string;
  key: string;
}

export interface MultipleImageUploadResult {
  success: boolean;
  urls: string[];
  keys: string[];
}

export async function uploadImage(file: File): Promise<ImageUploadResult> {
  console.log('📤 uploadImage called with:', file.name, file.type, file.size);
  const formData = new FormData();
  formData.append('image', file);
  
  console.log('🌐 Making API request to /api/upload...');
  try {
    const response = await apiRequest('POST', '/api/upload', formData);
    console.log('✅ API response:', response);
    return response;
  } catch (error) {
    console.error('❌ API request failed:', error);
    throw error;
  }
}

export async function uploadMultipleImages(files: File[]): Promise<MultipleImageUploadResult> {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('images', file);
  });

  const response = await apiRequest('POST', '/api/upload-multiple', formData);
  return response;
}

export function createImageUploadFormData(file: File): FormData {
  const formData = new FormData();
  formData.append('image', file);
  return formData;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be smaller than 5MB' };
  }
  
  return { valid: true };
}