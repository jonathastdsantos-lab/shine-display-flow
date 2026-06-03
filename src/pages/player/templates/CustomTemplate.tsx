import ClockWidget from "@/components/ClockWidget";
import WeatherWidget from "@/components/WeatherWidget";
import NewsTicker from "@/components/NewsTicker";
import FinanceWidget from "@/components/FinanceWidget";
import SocialWidget from "@/components/SocialWidget";
import QRWidget from "@/components/QRWidget";
import CameraWidget from "@/components/CameraWidget";
import ContentFeedWidget from "@/components/ContentFeedWidget";
import MotivationalWidget from "@/components/MotivationalWidget";
import CryptoProWidget from "@/components/CryptoProWidget";
import KPIDashboard from "@/components/KPIDashboard";
import TransitWidget from "@/components/TransitWidget";
import CountdownWidget from "@/components/CountdownWidget";
import YoutubeWidget from "@/components/YoutubeWidget";
import type { Zone } from "@/utils/AILayoutAssistant";
import type { BusinessSegment } from "@/utils/ContentFeed";
import { RemoteAlertOverlay, isYoutubeUrl } from "@/pages/player/shared";
import type { TemplateProps } from "./types";

function ContentFeedZone({ segment }: { segment: string }) {
  return <ContentFeedWidget segment={segment as BusinessSegment} />;
}

export default function CustomTemplate(p: TemplateProps) {
  const renderZone = (zone: Zone) => {
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${zone.x}%`,
      top: `${zone.y}%`,
      width: `${zone.width}%`,
      height: `${zone.height}%`,
      overflow: "hidden",
      opacity: zone.opacity !== undefined ? zone.opacity / 100 : 1,
      borderRadius: zone.borderRadius ? `${zone.borderRadius}px` : undefined,
      backgroundColor: zone.backgroundColor || undefined,
    };

    switch (zone.type) {
      case "media": {
        const objectFit =
          zone.config?.fit === "contain" ? "object-contain" : "object-cover";
        return (
          <div key={zone.id} style={style} className="bg-black">
            {isYoutubeUrl(p.current?.url_arquivo) ? (
              <YoutubeWidget key={p.current?.id} url={p.current?.url_arquivo} onEnded={p.goToNext} duracao={p.current?.duracao} />
            ) : p.current?.tipo === "video" ? (
              <video
                ref={p.videoRef}
                key={p.current.id}
                src={p.current.url_arquivo}
                className={`w-full h-full ${objectFit}`}
                muted
                autoPlay
                playsInline
              />
            ) : (
              <img
                key={p.current?.id}
                src={p.current?.url_arquivo}
                alt=""
                className={`w-full h-full ${objectFit} bg-black`}
              />
            )}
          </div>
        );
      }
      case "clock":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14] flex items-center justify-center p-2">
            <ClockWidget
              weatherCity={zone.config?.city || p.city}
              fontSize={zone.config?.fontSize}
              variant={zone.config?.variant}
              showWeather={zone.config?.showWeather !== false}
            />
          </div>
        );
      case "weather":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14] p-2">
            <WeatherWidget
              city={zone.config?.city || p.city}
              fontSize={zone.config?.fontSize}
              variant={zone.config?.variant}
            />
          </div>
        );
      case "news":
        return (
          <div key={zone.id} style={{ ...style, overflow: "hidden" }} className="bg-[#0A0D14]">
            <NewsTicker headlines={p.headlines} />
          </div>
        );
      case "finance":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14] p-2">
            <FinanceWidget />
          </div>
        );
      case "social":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14] p-2">
            <SocialWidget instagramHandle={zone.config?.handle || p.igHandle} />
          </div>
        );
      case "qr":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14] flex items-center justify-center p-3">
            <QRWidget url={zone.config?.url || p.currentQrLink || ""} size={zone.config?.size} />
          </div>
        );
      case "camera":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14] p-2">
            <CameraWidget />
          </div>
        );
      case "text":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14] flex items-center justify-center p-4">
            <p
              className="text-white leading-snug"
              style={{
                fontSize: zone.config?.fontSize ? `${zone.config.fontSize}px` : "1.25rem",
                textAlign: zone.config?.align || "center",
                fontWeight: "bold",
              }}
            >
              {zone.config?.text || ""}
            </p>
          </div>
        );
      case "motivational":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14]">
            <MotivationalWidget
              customQuote={zone.config?.customQuote}
              fontSize={zone.config?.fontSize}
            />
          </div>
        );
      case "crypto_pro":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14]">
            <CryptoProWidget fontSize={zone.config?.fontSize} />
          </div>
        );
      case "kpi_dashboard":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14]">
            <KPIDashboard
              label={zone.config?.label}
              value={zone.config?.value}
              target={zone.config?.target}
              suffix={zone.config?.suffix}
              fontSize={zone.config?.fontSize}
            />
          </div>
        );
      case "transit":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14]">
            <TransitWidget />
          </div>
        );
      case "countdown":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14]">
            <CountdownWidget
              targetDate={zone.config?.targetDate}
              label={zone.config?.label}
              fontSize={zone.config?.fontSize}
            />
          </div>
        );
      case "content_feed":
        return (
          <div key={zone.id} style={style} className="bg-[#0A0D14] overflow-hidden">
            <ContentFeedZone segment={zone.config?.segment || "corporativo"} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen relative bg-black overflow-hidden">
      <RemoteAlertOverlay
        active={p.remoteIntervention.active}
        message={p.remoteIntervention.message}
        type={p.remoteIntervention.type}
      />
      {(p.layoutConfig.zones as Zone[]).map(renderZone)}
    </div>
  );
}
