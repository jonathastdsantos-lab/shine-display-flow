import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crop as CropIcon, RotateCcw, Maximize, Monitor, Smartphone, Square } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
  onSave: (croppedBlob: Blob) => Promise<void>;
}

const ASPECT_OPTIONS = [
  { label: "Livre", value: "free", icon: Maximize },
  { label: "16:9 (TV)", value: "16/9", icon: Monitor },
  { label: "9:16 (Vertical)", value: "9/16", icon: Smartphone },
  { label: "4:3", value: "4/3", icon: Monitor },
  { label: "1:1", value: "1/1", icon: Square },
];

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

function getCroppedCanvas(image: HTMLImageElement, crop: PixelCrop): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}

export default function ImageCropModal({ open, onClose, imageUrl, imageName, onSave }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspectOption, setAspectOption] = useState("free");
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const parseAspect = (v: string): number => { const [a, b] = v.split("/"); return Number(a) / Number(b); };
  const aspect = aspectOption === "free" ? undefined : parseAspect(aspectOption);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      if (aspect) {
        setCrop(centerAspectCrop(width, height, aspect));
      } else {
        setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
      }
    },
    [aspect]
  );

  const handleAspectChange = (value: string) => {
    setAspectOption(value);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      if (value === "free") {
        setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
      } else {
        const a = parseAspect(value);
        setCrop(centerAspectCrop(width, height, a));
      }
    }
  };

  const handleReset = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      if (aspect) {
        setCrop(centerAspectCrop(width, height, aspect));
      } else {
        setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
      }
    }
  };

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;
    setSaving(true);
    try {
      const canvas = getCroppedCanvas(imgRef.current, completedCrop);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))),
          "image/jpeg",
          0.92
        );
      });
      await onSave(blob);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar recorte:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="w-5 h-5 text-primary" />
            Recortar Imagem
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{imageName}</p>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2">
          <Select value={aspectOption} onValueChange={handleAspectChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Proporção" />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Resetar
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center bg-black/5 rounded-lg p-2">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            className="max-h-[55vh]"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt={imageName}
              onLoad={onImageLoad}
              className="max-h-[55vh] max-w-full object-contain"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <DialogFooter className="gap-2 pt-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !completedCrop} className="bg-primary">
            {saving ? "Salvando..." : "Salvar Recorte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
