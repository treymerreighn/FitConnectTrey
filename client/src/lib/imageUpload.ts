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
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiRequest('POST', '/api/upload', formData);
  return response;
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

export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024; // 50MB for videos
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Videos
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (isVideo) {
      return { valid: false, error: `Unsupported video format: ${file.type}. Please use MP4, MOV, AVI, WebM, or OGG.` };
    } else if (isImage) {
      return { valid: false, error: `Unsupported image format: ${file.type}. Please use JPEG, PNG, GIF, or WebP.` };
    } else {
      return { valid: false, error: 'Please upload a valid image or video file.' };
    }
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { valid: false, error: `File must be smaller than ${maxSizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.` };
  }
  
  return { valid: true };
}

// Keep the old function for backward compatibility
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