import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShoppingBag, Tag, Zap } from "lucide-react";

export interface OfferData {
  id: string;
  source: "shopee" | "mercadolivre" | "telegram" | "whatsapp";
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  discountBadge?: string;
  imageUrl: string;
  link: string;
}

interface OfferWidgetProps {
  offer?: OfferData;
}

// Mock data to display if no real data is passed
const mockOffer: OfferData = {
  id: "mock1",
  source: "mercadolivre",
  title: "Smartphone Última Geração 5G 128GB",
  description: "Oferta relâmpago no grupo do WhatsApp! Aproveite enquanto durarem os estoques.",
  price: "R$ 1.299,00",
  originalPrice: "R$ 1.999,00",
  discountBadge: "-35%",
  imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351cb315?auto=format&fit=crop&q=80&w=400",
  link: "https://mercadolivre.com.br/oferta-exemplo",
};

export default function OfferWidget({ offer = mockOffer }: OfferWidgetProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!offer) return null;

  const isShopee = offer.source === "shopee";
  const themeColor = isShopee ? "from-orange-500 to-orange-600" : "from-yellow-400 to-yellow-500";
  const glowColor = isShopee ? "bg-orange-500/20" : "bg-yellow-400/20";
  const textColor = isShopee ? "text-orange-500" : "text-yellow-400";
  const badgeColor = isShopee ? "bg-orange-500 text-white" : "bg-yellow-400 text-black";

  return (
    <div className="w-full relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col group">
      {/* Background glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 ${glowColor} rounded-full blur-[4rem] pointer-events-none transition-opacity duration-1000 ${pulse ? 'opacity-100' : 'opacity-60'}`} />

      {/* Header Banner */}
      <div className={`w-full bg-gradient-to-r ${themeColor} px-4 py-2 flex items-center justify-between relative z-10 shadow-md`}>
        <div className="flex items-center gap-2">
          {isShopee ? <ShoppingBag className="w-4 h-4 text-white" /> : <Zap className="w-4 h-4 text-black" />}
          <span className={`text-[10px] font-black uppercase tracking-widest ${isShopee ? 'text-white' : 'text-black'} drop-shadow-sm`}>
            Oferta do Grupo
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${isShopee ? 'bg-white' : 'bg-black'} animate-ping`} />
        </div>
      </div>

      <div className="p-4 flex flex-col items-center relative z-10">
        {/* Product Image */}
        <div className="relative w-full h-32 mb-4 rounded-xl overflow-hidden border border-white/10 shadow-lg">
          <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
          {offer.discountBadge && (
            <div className={`absolute top-2 right-2 px-2 py-1 ${badgeColor} font-black text-xs rounded-lg shadow-lg rotate-3 scale-110`}>
              {offer.discountBadge}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full text-center mb-4">
          <h3 className="text-sm font-bold text-white/90 leading-tight line-clamp-2 mb-1">
            {offer.title}
          </h3>
          <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">
            {offer.description}
          </p>
        </div>

        {/* Price & QR Code */}
        <div className="w-full flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="flex flex-col">
            {offer.originalPrice && (
              <span className="text-[10px] text-white/40 line-through font-medium">
                {offer.originalPrice}
              </span>
            )}
            <span className={`text-xl font-black ${textColor} drop-shadow-sm`}>
              {offer.price}
            </span>
          </div>
          
          {/* QR Code */}
          <div className="relative shrink-0">
            <div className="bg-white p-1.5 rounded-lg shadow-md">
              <QRCodeSVG
                value={offer.link}
                size={50}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
                includeMargin={false}
              />
            </div>
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${badgeColor} px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider whitespace-nowrap shadow-lg`}>
              Compre
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
