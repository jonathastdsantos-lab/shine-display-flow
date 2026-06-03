import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── Mocks dos hooks (controlados por testes) ──
const syncMock = vi.fn();
const playMock = vi.fn();

vi.mock("@/hooks/usePlayerSync", () => ({
  usePlayerSync: (...args: any[]) => syncMock(...args),
}));
vi.mock("@/hooks/useMediaPlayback", () => ({
  useMediaPlayback: (...args: any[]) => playMock(...args),
}));

// Templates: stub mínimo p/ identificar qual foi renderizado
vi.mock("@/pages/player/templates/CorporateTemplate", () => ({
  default: () => <div data-testid="tpl-corporate">corporate</div>,
}));
vi.mock("@/pages/player/templates/RetailTemplate", () => ({
  default: () => <div data-testid="tpl-retail">retail</div>,
}));
vi.mock("@/pages/player/templates/LBarTemplate", () => ({
  default: () => <div data-testid="tpl-lbar">lbar</div>,
}));
vi.mock("@/pages/player/templates/SplitTemplate", () => ({
  default: () => <div data-testid="tpl-split">split</div>,
}));
vi.mock("@/pages/player/templates/CustomTemplate", () => ({
  default: () => <div data-testid="tpl-custom">custom</div>,
}));
vi.mock("@/pages/player/PlayerError", () => ({
  default: ({ error }: any) => (
    <div data-testid="player-error">{error?.message || "erro"}</div>
  ),
}));

import Player from "@/pages/Player";

const baseSync = {
  mediaItems: [],
  clientId: null,
  city: "São Paulo",
  template: "corporativo",
  newsCategory: "technology",
  headlines: [],
  widgetConfig: null,
  layoutConfig: null,
  igHandle: "",
  paused: false,
  adWidgetEnabled: false,
  adWidgetUrl: undefined,
  remoteIntervention: { active: false, message: "", type: null },
  nextCommandSignal: 0,
  error: null,
  loading: false,
  retry: vi.fn(),
};

const basePlay = {
  currentIndex: 0,
  current: undefined,
  fading: false,
  videoRef: { current: null },
  showAdOverlay: false,
  mediaPlayCount: 0,
  goToNext: vi.fn(),
};

function renderPlayer() {
  return render(
    <MemoryRouter initialEntries={["/player/pl-1"]}>
      <Routes>
        <Route path="/player/:playlist_id" element={<Player />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  syncMock.mockReturnValue(baseSync);
  playMock.mockReturnValue(basePlay);
});

describe("<Player />", () => {
  it("renderiza estado de loading", () => {
    syncMock.mockReturnValue({ ...baseSync, loading: true, mediaItems: [] });
    renderPlayer();
    expect(screen.getByText(/Carregando programação/i)).toBeInTheDocument();
  });

  it("renderiza estado vazio quando não há mídias", () => {
    syncMock.mockReturnValue({ ...baseSync, loading: false, mediaItems: [] });
    renderPlayer();
    expect(screen.getByText(/Aguardando Programação Local/i)).toBeInTheDocument();
  });

  it("renderiza CorporateTemplate quando há mídias e template=corporativo", () => {
    const media = [{ id: "m1", url_arquivo: "x", tipo: "imagem", duracao: 5 } as any];
    syncMock.mockReturnValue({ ...baseSync, mediaItems: media, template: "corporativo" });
    playMock.mockReturnValue({ ...basePlay, current: media[0] });
    renderPlayer();
    expect(screen.getByTestId("tpl-corporate")).toBeInTheDocument();
  });

  it("renderiza PlayerError quando fetchData falha", () => {
    syncMock.mockReturnValue({
      ...baseSync,
      error: { kind: "playlist_fetch", message: "Falha ao contatar servidor" },
    });
    renderPlayer();
    expect(screen.getByTestId("player-error")).toHaveTextContent(
      "Falha ao contatar servidor"
    );
  });
});
