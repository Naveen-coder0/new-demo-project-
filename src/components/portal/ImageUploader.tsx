import { useState, useRef, useCallback } from "react";
import { Upload, X, GripVertical, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { uploadImage } from "@/lib/upload.functions";

type Props = {
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
};

export default function ImageUploader({ images, onChange, max = 6 }: Props) {
  const upload = useServerFn(uploadImage);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !files.length) return;
      const remaining = max - images.length;
      const toUpload = Array.from(files).slice(0, remaining);
      if (!toUpload.length) return;

      setUploading(true);
      setProgress(0);
      const uploaded: string[] = [];

      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        // Compress: resize to max 1200px width, quality 0.8
        const dataUrl = await compressImage(file, 1200, 0.8);
        try {
          const result = await upload({ data: { dataUrl, folder: "wearbuy/products" } });
          uploaded.push(result.url);
        } catch (e) {
          console.error("Upload failed:", e);
        }
        setProgress(Math.round(((i + 1) / toUpload.length) * 100));
      }

      onChange([...images, ...uploaded]);
      setUploading(false);
      setProgress(0);
    },
    [images, max, onChange, upload],
  );

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  function moveImage(from: number, to: number) {
    const arr = [...images];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium">
        Product Images ({images.length}/{max})
      </p>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, idx) => (
            <div key={url + idx} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {idx > 0 && (
                  <button onClick={() => moveImage(idx, idx - 1)} className="p-1 bg-white/90 rounded-md">
                    <GripVertical className="w-3.5 h-3.5 text-foreground" />
                  </button>
                )}
                <button onClick={() => removeImage(idx)} className="p-1 bg-white/90 rounded-md">
                  <X className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-medium bg-primary text-primary-foreground rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < max && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/30"
          }`}
        >
          {uploading ? (
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
              <div className="mt-2 h-1.5 w-32 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">PNG, JPG up to 5MB each</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

/** Compress an image file to a data URL with max dimension and quality. */
function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h / w) * maxDim); w = maxDim; }
          else { w = Math.round((w / h) * maxDim); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
