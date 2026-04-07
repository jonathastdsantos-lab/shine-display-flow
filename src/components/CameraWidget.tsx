import { Camera, Video } from "lucide-react";

export default function CameraWidget() {
  return (
    <div className="flex flex-col items-center px-2 py-3 w-full bg-slate-900/50 animate-fade-in relative overflow-hidden group border border-slate-700/50 rounded-xl">
      
      <div className="flex items-center justify-between w-full px-2 mb-2 z-10">
        <div className="flex items-center gap-1.5 text-slate-300">
           <Camera className="w-3 h-3" />
           <span className="text-[9px] uppercase font-bold tracking-widest">Câmera 01</span>
        </div>
        <div className="flex items-center gap-1">
           <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
           <span className="text-[8px] text-red-500 font-bold uppercase">Ao Vivo</span>
        </div>
      </div>

      <div className="w-full aspect-video rounded overflow-hidden bg-black relative z-10 border border-slate-800">
        {/* Simulação de um feed de CFTV com uma imagem de câmera de segurança stock ou ruído leve */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=400')] bg-cover bg-center opacity-80 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
        <div className="absolute bottom-1 right-2 text-[8px] font-mono text-white/70 drop-shadow-md">
           CAM_KIDS_PLAYGROUND
        </div>
      </div>

    </div>
  );
}
