import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string;
  sort_order: number;
}

const PhotoGallerySection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profile_gallery").select("*").eq("user_id", user.id).order("sort_order")
      .then(({ data }) => { setImages(data || []); setLoading(false); });
  }, [user]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) { toast({ title: "File too large (max 10MB)", variant: "destructive" }); continue; }
        if (!file.type.startsWith("image/")) { toast({ title: "Only images allowed", variant: "destructive" }); continue; }
        const path = `${user.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("profile-gallery").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("profile-gallery").getPublicUrl(path);
        await supabase.from("profile_gallery").insert({ user_id: user.id, image_url: urlData.publicUrl, caption: "", sort_order: images.length });
      }
      const { data } = await supabase.from("profile_gallery").select("*").eq("user_id", user.id).order("sort_order");
      setImages(data || []);
      toast({ title: "Photos uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img: GalleryImage) => {
    await supabase.from("profile_gallery").delete().eq("id", img.id);
    setImages(prev => prev.filter(i => i.id !== img.id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  if (loading) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
        <ImageIcon className="h-4 w-4" /> Photo Gallery
      </h2>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && uploadFiles(e.target.files)} />
        <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-2">Drag & drop photos here or</p>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Browse Files
        </Button>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square">
              <img src={img.image_url} alt={img.caption || "Gallery"} className="w-full h-full object-cover" />
              <button onClick={() => handleDelete(img)} className="absolute top-1 right-1 bg-destructive/80 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PhotoGallerySection;
