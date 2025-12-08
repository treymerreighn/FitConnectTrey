import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/image-upload';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { InsertPost } from '@shared/schema';

export default function TestImagePost() {
  const [images, setImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();

  const handleImageUploaded = (url: string) => {
    console.log('✅ Image uploaded:', url);
    setImages(prev => [...prev, url]);
    toast({ title: 'Image uploaded', description: url });
  };

  const createTestPost = async () => {
    if (images.length === 0) {
      toast({ title: 'No images', description: 'Upload an image first', variant: 'destructive' });
      return;
    }

    setPosting(true);
    try {
      const postData: InsertPost = {
        userId: '44595091',
        type: 'progress',
        caption: 'Test post with images',
        images: images,
        exerciseTags: [],
        mediaItems: [],
      };

      console.log('📤 Creating post with data:', postData);
      const result = await api.createPost(postData);
      console.log('✅ Post created:', result);

      toast({ title: 'Success!', description: `Post created with ${images.length} image(s)` });
      setImages([]);
    } catch (error) {
      console.error('❌ Error creating post:', error);
      toast({ title: 'Error', description: String(error), variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Test Image Upload & Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Upload Images</h3>
            <ImageUpload onImageUploaded={handleImageUploaded} />
          </div>

          {images.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Uploaded Images ({images.length})</h3>
              <div className="grid grid-cols-2 gap-2">
                {images.map((url, i) => (
                  <div key={i} className="border rounded p-2">
                    <img src={url} alt={`Upload ${i + 1}`} className="w-full h-32 object-cover rounded" />
                    <p className="text-xs mt-1 truncate">{url}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={createTestPost} disabled={posting || images.length === 0} className="w-full">
            {posting ? 'Creating Post...' : `Create Post with ${images.length} Image(s)`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
