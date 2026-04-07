import { QrCode, Smartphone } from "lucide-react";

export default function QRWidget() {
  return (
    <div className="flex flex-col items-center px-4 py-6 w-full bg-indigo-500/10 animate-fade-in relative overflow-hidden group border border-indigo-500/20">
      
      <div className="absolute top-0 right-0 p-1 opacity-5">
         <QrCode className="w-24 h-24" />
      </div>

      <div className="bg-white p-2 rounded-lg shadow-xl shadow-indigo-500/20 mb-3 z-10">
        {/* Placeholder para um QR Code real */}
        <QrCode className="w-16 h-16 text-black" />
      </div>

      <div className="text-center z-10 w-full mb-1">
        <p className="text-xs font-display font-bold text-player-text">Escaneie & Ganhe</p>
      </div>
      
      <div className="flex items-center gap-1.5 z-10 justify-center bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded w-full">
         <Smartphone className="w-3 h-3" />
         <p className="text-[9px] uppercase font-bold tracking-wider">Acesse o Cardápio</p>
      </div>

    </div>
  );
}
