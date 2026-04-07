import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, Film, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MediaItem } from "@/hooks/useDashboardData";

interface MediaLibraryProps {
  media: MediaItem[];
  uploading: boolean;
  onUpload: (files: FileList) => Promise<boolean | undefined>;
  onDelete: (id: string) => void;
}

export default function MediaLibrary({ media, uploading, onUpload, onDelete }: MediaLibraryProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList) => {
    const ok = await onUpload(files);
    if (ok) toast({ title: "Upload concluído!" });
    else toast({ title: "Erro no upload", variant: "destructive" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">Biblioteca de Mídia</h2>
        <p className="text-muted-foreground text-sm mt-1">Gerencie imagens e vídeos do seu canal</p>
      </div>

      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 transition-all duration-200 ${
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 hover:bg-muted/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <div className="rounded-full bg-primary/10 p-4">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium">{uploading ? "Enviando..." : "Arraste arquivos ou clique para enviar"}</p>
          <p className="text-xs text-muted-foreground mt-1">Suporte a imagens (JPG, PNG, WebP) e vídeos (MP4, WebM)</p>
        </div>
        <input ref={inputRef} type="file" className="hidden" multiple accept="image/*,video/*" onChange={(e) => e.target.files && handleFiles(e.target.files)} disabled={uploading} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {media.map((item) => (
          <Card key={item.id} className="group overflow-hidden border-border/50 transition-shadow hover:shadow-md">
            <div className="relative aspect-video bg-muted">
              {item.tipo === "video" ? (
                <video src={item.url_arquivo} className="h-full w-full object-cover" muted />
              ) : (
                <img src={item.url_arquivo} alt={item.nome} className="h-full w-full object-cover" />
              )}
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                  {item.tipo === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                  {item.tipo}
                </span>
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <CardContent className="p-3">
              <p className="text-sm font-medium truncate">{item.nome}</p>
              <p className="text-xs text-muted-foreground">{item.duracao}s</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {media.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Nenhuma mídia enviada ainda</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Envie imagens e vídeos para começar</p>
        </div>
      )}
    </div>
  );
}
