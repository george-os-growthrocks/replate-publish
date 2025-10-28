import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Camera, X, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userEmail: string;
  onUploadComplete?: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, userEmail, onUploadComplete }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true, // Replace existing avatar
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      toast.success("Avatar updated successfully!");
      setShowPreview(false);
      setPreviewUrl(null);
      setSelectedFile(null);
      
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }

      // Refresh the page to show new avatar
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Avatar removed");
      
      if (onUploadComplete) {
        onUploadComplete('');
      }

      window.location.reload();
    } catch (error) {
      console.error('Remove error:', error);
      toast.error("Failed to remove avatar");
    }
  };

  const initials = userEmail?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start gap-6">
          {/* Current Avatar */}
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-2 ring-primary/20">
              <AvatarImage src={currentAvatarUrl} alt="Profile" />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            {/* Overlay on hover */}
            <div
              className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Upload Controls */}
          <div className="flex-1">
            <h4 className="font-semibold mb-2">Profile Picture</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a photo to personalize your account. Recommended size: 400x400px
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>

              {currentAvatarUrl && (
                <Button
                  variant="ghost"
                  onClick={handleRemove}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Supported formats: JPG, PNG, GIF (max 5MB)
            </p>
          </div>
        </div>
      </Card>

      {/* Preview & Crop Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview & Upload</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {previewUrl && (
              <div className="relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 gradient-primary"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Upload Avatar
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
