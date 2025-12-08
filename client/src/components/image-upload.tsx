import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { validateImageFile, uploadImage } from '@/lib/imageUpload';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from '@/components/image-cropper';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  currentImageUrl?: string;
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
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImgSrc, setCropperImgSrc] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📸 File selected:', file.name, file.type, file.size);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.error);
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Validation passed, opening cropper...');
    
    // Open cropper instead of directly uploading
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCropperImgSrc(e.target.result as string);
        setShowCropper(true);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input value so same file can be selected again
    event.target.value = '';
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
        onImageUploaded(result.url);
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

  const handleRemoveImage = () => {
    setPreview(null);
    if (onImageRemoved) {
      onImageRemoved();
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
                Click to upload an image
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      ) : (
        <div className="relative">
          <div className="aspect-[4/5] w-full max-w-xs mx-auto">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          {!uploading && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
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