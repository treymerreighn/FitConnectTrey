import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/image-upload';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function TestUpload() {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    toast({
      title: "Success!",
      description: "Image uploaded to AWS S3 successfully",
    });
  };

  const handleDirectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      if (result.success) {
        setUploadedImageUrl(result.url);
        toast({
          title: "Direct upload successful",
          description: `Image uploaded: ${result.key}`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>AWS S3 Image Upload Test</CardTitle>
          <CardDescription>
            Test the cloud storage functionality for your fitness app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Component-based upload */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Upload with Component</h3>
            <ImageUpload 
              onImageUploaded={handleImageUploaded}
              label="Upload workout photo"
            />
          </div>

          {/* Direct upload */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Direct Upload</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleDirectUpload}
              disabled={uploading}
              className="mb-2"
            />
            {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
          </div>

          {/* Display uploaded image */}
          {uploadedImageUrl && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Uploaded Image</h3>
              <img
                src={uploadedImageUrl}
                alt="Uploaded"
                className="max-w-full h-auto rounded-lg shadow"
              />
              <p className="text-sm text-gray-500 mt-2 break-all">
                URL: {uploadedImageUrl}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}