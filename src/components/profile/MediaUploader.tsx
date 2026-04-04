import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, FileImage, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface MediaUploaderProps {
  bucket: string;
  folder?: string;
  accept?: string;
  maxFiles?: number;
  label?: string;
  existingFiles?: { name: string; url: string }[];
  onUpload?: (files: { name: string; url: string }[]) => void;
}

const MediaUploader = ({
  bucket,
  folder = "",
  accept = "image/*,.pdf,.doc,.docx",
  maxFiles = 5,
  label = "Upload Files",
  existingFiles = [],
  onUpload,
}: MediaUploaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState(existingFiles);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || !user) return;

    if (files.length + selected.length > maxFiles) {
      toast({ title: `Maximum ${maxFiles} files allowed`, variant: "destructive" });
      return;
    }

    setUploading(true);
    const newFiles: { name: string; url: string }[] = [];

    for (const file of Array.from(selected)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: `${file.name} is too large (max 10MB)`, variant: "destructive" });
        continue;
      }

      const path = folder ? `${user.id}/${folder}/${Date.now()}_${file.name}` : `${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);

      if (error) {
        toast({ title: `Upload failed: ${file.name}`, description: error.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      newFiles.push({ name: file.name, url: urlData.publicUrl });
    }

    const updated = [...files, ...newFiles];
    setFiles(updated);
    onUpload?.(updated);
    setUploading(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUpload?.(updated);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-lg border border-border bg-accent/50 px-2.5 py-1.5 text-xs">
            {f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? <FileImage className="h-3.5 w-3.5 text-primary" /> : <File className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="max-w-[120px] truncate text-foreground">{f.name}</span>
            <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {files.length < maxFiles && (
        <div>
          <input ref={fileInputRef} type="file" accept={accept} multiple onChange={handleUpload} className="hidden" />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            {uploading ? "Uploading…" : label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
