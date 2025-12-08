import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Loader2, Play } from 'lucide-react';
import { validateMediaFile, uploadImage } from '@/lib/imageUpload';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from '@/components/image-cropper';

interface MediaUploadProps {
  onMediaUploaded: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  onMediaRemoved?: () => void;
  currentMediaUrl?: string;
  currentMediaType?: 'image' | 'video';
  disabled?: boolean;
  label?: string;
  className?: string;
  aspectRatio?: number;
}

export function ImageUpload({ 
  onImageUploaded, 
  onImageRemoved, 
  currentImageUrl, 
  disabled = false,
  label = "Upload Image",
  className = "",
  aspectRatio = 4/5
}: ImageUploadProps) {
  // Legacy component - redirect to new MediaUpload
  return (
    <MediaUpload
      onMediaUploaded={(url, type) => onImageUploaded(url)}
      onMediaRemoved={onImageRemoved}
      currentMediaUrl={currentImageUrl}
      currentMediaType="image"
      disabled={disabled}
      label={label}
      className={className}
      aspectRatio={aspectRatio}
    />
  );
}

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  currentImageUrl?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  aspectRatio?: number;
}

export function MediaUpload({ 
  onMediaUploaded, 
  onMediaRemoved, 
  currentMediaUrl, 
  currentMediaType,
  disabled = false,
  label = "Upload Media",
  className = "",
  aspectRatio = 4/5
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentMediaUrl || null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>(currentMediaType || 'image');
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImgSrc, setCropperImgSrc] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📸 File selected:', file.name, file.type, file.size);

    // Validate file
    const validation = validateMediaFile(file);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.error);
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    if (isVideo) {
      // Handle video upload directly (no cropping)
      await handleVideoUpload(file);
    } else {
      // Handle image with cropping
      console.log('✅ Validation passed, opening cropper...');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCropperImgSrc(e.target.result as string);
          setShowCropper(true);
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input value so same file can be selected again
    event.target.value = '';
  };

  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    
    try {
      // Create preview URL for video (more memory efficient than data URL)
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload to AWS S3
      console.log('🚀 Calling uploadImage for video...');
      const result = await uploadImage(file);
      console.log('📥 Upload result:', result);
      
      if (result.success) {
        // Clean up the object URL
        URL.revokeObjectURL(previewUrl);
        // Set the uploaded URL as preview
        setPreview(result.url);
        
        onMediaUploaded(result.url, 'video');
        toast({
          title: "Upload successful",
          description: "Your video has been uploaded successfully",
        });
      } else {
        // Clean up on failure
        URL.revokeObjectURL(previewUrl);
        setPreview(null);
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      // Clean up preview on error
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setCropperImgSrc(null);
    setUploading(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(croppedBlob);

      // Upload to AWS S3
      const file = new File([croppedBlob], "upload.jpg", { type: "image/jpeg" });
      console.log('🚀 Calling uploadImage...');
      const result = await uploadImage(file);
      console.log('📥 Upload result:', result);
      
      if (result.success) {
        onMediaUploaded(result.url, 'image');
        toast({
          title: "Upload successful",
          description: "Your image has been uploaded successfully",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    setPreview(null);
    setMediaType('image');
    if (onMediaRemoved) {
      onMediaRemoved();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      
      {!preview ? (
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center overflow-hidden">
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload an image or video
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF, MP4, MOV, AVI up to 50MB
              </p>
            </div>
          </div>
          <Input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      ) : (
        <div className="relative">
          <div className="aspect-video w-full max-w-xs mx-auto bg-black rounded-lg overflow-hidden">
            {mediaType === 'video' ? (
              <video
                src={preview}
                controls
                className="w-full h-full object-contain"
                poster=""
              />
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {!uploading && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {mediaType === 'video' && !uploading && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-black/70 text-white">
                <Play className="h-3 w-3 mr-1" />
                Video
              </Badge>
            </div>
          )}
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading to cloud storage...</span>
        </div>
      )}

      {cropperImgSrc && (
        <ImageCropper
          open={showCropper}
          onClose={() => {
            setShowCropper(false);
            setCropperImgSrc(null);
          }}
          imageSrc={cropperImgSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={aspectRatio}
          circularCrop={false}
        />
      )}
    </div>
  );
}