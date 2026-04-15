import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Film, ImageIcon, CloudUpload, PlayCircle, Edit2, QrCode, Check, X, Crop } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { MediaItem } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import ImageCropModal from "./ImageCropModal";

interface MediaLibraryProps {
  media: MediaItem[];
  uploading: boolean;
  onUpload: (files: FileList) => Promise<boolean | undefined>;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
}

export default function MediaLibrary({ media, uploading, onUpload, onDelete, onRefresh }: MediaLibraryProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingQR, setEditingQR] = useState<string | null>(null);
  const [qrInputs, setQrInputs] = useState<Record<string, string>>({});
  const [cropItem, setCropItem] = useState<MediaItem | null>(null);

  const handleFiles = async (files: FileList) => {
    const ok = await onUpload(files);
    if (ok) toast({ title: "✅ Upload concluído com sucesso!" });
    else toast({ title: "Erro no upload", variant: "destructive" });
  };

  const getFormat = (name: string) => name.split('.').pop()?.toUpperCase() || 'ARQUIVO';

  const handleSaveQR = async (mediaId: string) => {
    const url = qrInputs[mediaId] || "";
    try {
      await (supabase as any)
        .from("media_library")
        .update({ qr_link: url })
        .eq("id", mediaId);
      toast({ title: "✅ QR Code salvo!", description: url || "Link removido." });
      onRefresh?.();
    } catch {
      toast({ title: "Erro ao salvar QR Code", variant: "destructive" });
    }
    setEditingQR(null);
  };

  const startEditQR = (item: MediaItem) => {
    setEditingQR(item.id);
    setQrInputs((prev) => ({ ...prev, [item.id]: (item as any).qr_link || "" }));
  };

  const handleCropSave = async (blob: Blob) => {
    if (!cropItem || !user) return;
    try {
      const cleanName = cropItem.nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]/g, "_")
        .toLowerCase()
        .replace(/\.[^.]+$/, ".jpg");
      const path = `${user.id}/${Date.now()}-cropped-${cleanName}`;

      const { error: uploadErr } = await supabase.storage.from("media").upload(path, blob, {
        cacheControl: "3600",
        contentType: "image/jpeg",
      });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

      await supabase.from("media_library").update({ url_arquivo: publicUrl }).eq("id", cropItem.id);

      toast({ title: "✅ Imagem recortada e salva!" });
      onRefresh?.();
    } catch (err: any) {
      console.error("Erro ao salvar recorte:", err);
      toast({ title: "Erro ao salvar recorte", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Biblioteca de Mídia</h2>
          <p className="text-muted-foreground mt-1">
            Faça upload e gerencie os vídeos e imagens que serão exibidos na TV.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">💡 Dica: Cada mídia pode ter um QR Code único que aparece na tela enquanto ela está passando.</p>
        </div>
      </div>

      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-14 transition-all duration-300 ${
          dragOver 
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-xl shadow-indigo-500/10" 
            : "border-border hover:border-indigo-400/50 hover:bg-muted/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setDragOver(false); 
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); 
        }}
        onClick={() => inputRef.current?.click()}
      >
        <div className={`rounded-2xl p-5 transition-colors ${dragOver ? 'bg-indigo-500 text-white' : 'bg-primary/5 text-primary'}`}>
          {uploading ? (
            <CloudUpload className="h-8 w-8 animate-bounce" />
          ) : (
            <Upload className="h-8 w-8" />
          )}
        </div>
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold mb-1">
            {uploading ? "Enviando arquivos..." : "Arraste seus vídeos e fotos para cá"}
          </p>
          <p className="text-sm text-muted-foreground">
            ou clique para procurar no seu computador. Suporte para MP4, JPG e PNG (Máximo 50MB por arquivo).
          </p>
        </div>
        <input 
          ref={inputRef} 
          type="file" 
          className="hidden" 
          multiple 
          accept="image/*,video/*" 
          onChange={(e) => e.target.files && handleFiles(e.target.files)} 
          disabled={uploading} 
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Acervo Disponível <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-mono">{media.length}</span>
          </h3>
        </div>

        {media.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 max-w-none md:grid-cols-3 xl:grid-cols-4">
            {media.map((item) => (
              <Card key={item.id} className="group overflow-hidden border-border/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 bg-card">
                <div className="relative aspect-video bg-black/5 flex items-center justify-center overflow-hidden">
                  {item.tipo === "video" ? (
                    <>
                      <video src={item.url_arquivo} className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                      <PlayCircle className="absolute z-10 w-12 h-12 text-white/50 group-hover:text-white transition-colors drop-shadow-md" />
                    </>
                  ) : (
                    <img src={item.url_arquivo} alt={item.nome} className="absolute inset-0 h-full w-full object-contain bg-black group-hover:scale-105 transition-transform duration-700" />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Badges do topo */}
                  <div className="absolute top-3 left-3 z-20 flex gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md text-foreground shadow-sm">
                      {item.tipo === "video" ? <Film className="h-3 w-3 text-indigo-500" /> : <ImageIcon className="h-3 w-3 text-emerald-500" />}
                      {item.tipo}
                    </span>
                    {/* Badge QR se tiver link configurado */}
                    {(item as any).qr_link && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/90 px-2 py-1 text-[10px] font-semibold uppercase backdrop-blur-md text-white shadow-sm">
                        <QrCode className="h-2.5 w-2.5" /> QR
                      </span>
                    )}
                  </div>

                  {/* Actions Layer */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 scale-95 group-hover:scale-100 bg-black/20 backdrop-blur-[2px]">
                     {item.tipo === "imagem" && (
                       <Button
                         size="icon"
                         variant="secondary"
                         className="h-10 w-10 rounded-full shadow-lg"
                         title="Recortar imagem"
                         onClick={(e) => { e.stopPropagation(); setCropItem(item); }}
                       >
                          <Crop className="w-4 h-4" />
                       </Button>
                     )}
                     <Button
                       size="icon"
                       variant="secondary"
                       className="h-10 w-10 rounded-full shadow-lg"
                       title="Configurar QR Code"
                       onClick={(e) => { e.stopPropagation(); startEditQR(item); }}
                     >
                        <QrCode className="w-4 h-4" />
                     </Button>
                     <Button 
                       size="icon" 
                       variant="destructive" 
                       className="h-10 w-10 rounded-full shadow-lg"
                       onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                       title="Excluir arquivo"
                     >
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                </div>

                <CardContent className="p-4 bg-background space-y-3">
                  <div>
                    <p className="text-sm font-medium truncate mb-1" title={item.nome}>{item.nome}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span className="bg-muted px-2 py-0.5 rounded">{getFormat(item.nome)}</span>
                      <span>{item.duracao}s</span>
                    </div>
                  </div>

                  {/* QR Link editor */}
                  {editingQR === item.id ? (
                    <div className="flex gap-1.5 items-center">
                      <Input
                        value={qrInputs[item.id] || ""}
                        onChange={(e) => setQrInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="https://link-do-produto.com"
                        className="h-8 text-xs flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveQR(item.id);
                          if (e.key === "Escape") setEditingQR(null);
                        }}
                      />
                      <Button size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 shrink-0" onClick={() => handleSaveQR(item.id)}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => setEditingQR(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditQR(item)}
                      className="w-full flex items-center gap-2 text-left rounded-lg border border-border/50 px-3 py-2 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group/qr"
                    >
                      <QrCode className="w-3.5 h-3.5 text-muted-foreground group-hover/qr:text-indigo-400 shrink-0" />
                      <span className="text-[11px] text-muted-foreground truncate flex-1">
                        {(item as any).qr_link ? (item as any).qr_link.replace(/^https?:\/\//, "") : "Adicionar link QR Code..."}
                      </span>
                      <Edit2 className="w-3 h-3 text-muted-foreground/50 group-hover/qr:text-indigo-400 shrink-0" />
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl bg-muted/10">
            <div className="bg-muted p-4 rounded-full mb-4">
               <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">Nenhuma mídia encontrada</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Sua galeria está vazia. Faça o upload do seu primeiro arquivo arrastando-o para a caixa acima.
            </p>
          </div>
        )}
      </div>

      {cropItem && (
        <ImageCropModal
          open={!!cropItem}
          onClose={() => setCropItem(null)}
          imageUrl={cropItem.url_arquivo}
          imageName={cropItem.nome}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
}
