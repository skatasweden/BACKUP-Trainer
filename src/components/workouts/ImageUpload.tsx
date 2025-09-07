import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, ImageIcon } from "lucide-react";
import { useUploadWorkoutImage } from "@/hooks/useUploadWorkoutImage";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (url: string) => void;
}

export function ImageUpload({ currentImageUrl, onImageChange }: ImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadWorkoutImage();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vänligen välj en bildfil');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bilden är för stor. Maximal storlek är 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const imageUrl = await uploadImage.mutateAsync(file);
      onImageChange(imageUrl);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setImagePreview(currentImageUrl || null);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (url: string) => {
    setImagePreview(url);
    onImageChange(url);
  };
  
  return (
    <div className="space-y-4 border border-red-500 p-4">
      <Label>🔧 DEBUG: Omslagsbild komponent laddad</Label>
      <div className="text-xs text-red-600">
        Debug info: currentImageUrl = {currentImageUrl || 'null'}, 
        imagePreview = {imagePreview || 'null'}
      </div>
      
      {/* Image Preview */}
      {imagePreview ? (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Workout cover"
            className="w-full h-40 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="w-full h-40 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Ingen bild vald</p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadImage.isPending}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploadImage.isPending ? 'Laddar upp...' : 'Ladda upp bild'}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* URL Input Alternative */}
      <div className="pt-2 border-t">
        <Label htmlFor="image_url" className="text-sm text-muted-foreground">
          Eller använd URL
        </Label>
        <Input
          id="image_url"
          value={currentImageUrl || ''}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="mt-1"
        />
      </div>
    </div>
  );
}