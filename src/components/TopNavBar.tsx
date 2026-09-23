import React from 'react';
import {
  Layers,
  Route,
  Video,
  Network,
  Mountain,
  CloudRain,
  Eye,
  AlertTriangle,
  Brain,
  Search,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Terminal,
  Settings,
  Package,
  Compass,
  Hammer,
  Car,
  Globe,
  FolderKanban,
  ChevronDown,
  FileText,
  Map as MapIcon
} from 'lucide-react';
import { CivilStudio, CivilProject } from '../types';

interface TopNavBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeDomain: string;
  setActiveDomain: (val: string) => void;
  onHitlClick: () => void;
  onOpenLogs: () => void;
  onOpenHealth: () => void;
  onOpenExportPackage: () => void;
  onOpenCivilDeliverables?: () => void;
  activeProject: CivilProject;
  onOpenProjectManager: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  searchQuery,
  setSearchQuery,
  activeDomain,
  setActiveDomain,
  onHitlClick,
  onOpenLogs,
  onOpenHealth,
  onOpenExportPackage,
  onOpenCivilDeliverables,
  activeProject,
  onOpenProjectManager,
}) => {
  // 現在のドメインからアクティブなスタジオを導出
  const currentStudio: CivilStudio = (() => {
    if (activeDomain === 'GeoLibre') return 'geolibre-terrain';
    if (['Road', 'Bridge', 'Tunnel'].includes(activeDomain)) return 'design';
    if (['Earthwork', 'Hydro'].includes(activeDomain)) return 'construction';
    if (['Walkthrough', 'Interference', 'AI Proposals'].includes(activeDomain)) return 'simulation';
    return 'twin';
  })();

  const handleSelectStudio = (studio: CivilStudio) => {
    switch (studio) {
      case 'geolibre-terrain':
        setActiveDomain('GeoLibre');
        break;
      case 'design':
        if (!['Road', 'Bridge', 'Tunnel'].includes(activeDomain)) {
          setActiveDomain('Road');
        }
        break;
      case 'construction':
        if (!['Earthwork', 'Hydro'].includes(activeDomain)) {
          setActiveDomain('Earthwork');
        }
        break;
      case 'simulation':
        if (!['Walkthrough', 'Interference', 'AI Proposals'].includes(activeDomain)) {
          setActiveDomain('Walkthrough');
        }
        break;
      case 'twin':
        setActiveDomain('Twin');
        break;
    }
  };

  return (
    <>
      {/* 1. Main Header Strip (h-14) */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 w-full h-14 bg-[#0d1117] border-b border-[#30363d]">
        {/* Brand / Project Selector */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveDomain('Twin')}>
            <span className="text-[#38bdf8] flex items-center justify-center p-1.5 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="4" cy="4" r="2" />
                <circle cx="20" cy="8" r="2" />
                <circle cx="10" cy="18" r="2" />
                <path d="M4 4l16 4-10 10-6-14" />
              </svg>
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-bold text-[#f0f6fc] tracking-tight whitespace-nowrap">
                  Nova3D Civil
                </span>
                <span className="text-[10px] font-mono px-1 rounded bg-[#21262d] text-[#38bdf8] border border-[#30363d]">
                  v5.2
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#8b949e]">
                BIM/CIM 統合ワークステーション
              </span>
            </div>
          </div>

          {/* Active Project Dropdown Trigger Pill */}
          <button
            onClick={onOpenProjectManager}
            className="flex items-center gap-2 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#38bdf8]/60 px-2.5 py-1 rounded-md transition-all text-left group"
            title="クリックして道路設計プロジェクト一覧・切替・新規作成を開く"
          >
            <div className="p-1 rounded bg-[#38bdf8]/10 text-[#38bdf8] group-hover:bg-[#38bdf8]/20 transition-colors">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-[#f0f6fc] max-w-[150px] sm:max-w-[200px] truncate">
                  {activeProject.name}
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-[#21262d] text-[#38bdf8] border border-[#30363d]">
                  {activeProject.routeCode}
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#8b949e]">
                {activeProject.roadClass} • {activeProject.designSpeed}km/h • L={activeProject.totalLengthKm}km
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] group-hover:text-[#38bdf8] transition-colors ml-1" />
          </button>

          {/* Search bar */}
          <div className="hidden 2xl:flex items-center bg-[#161b22] border border-[#30363d] rounded px-2 py-1 gap-1.5 focus-within:border-[#38bdf8] transition-colors w-52 ml-1">
            <Search className="text-[#6e7681] w-3.5 h-3.5" />
            <input
              className="bg-transparent border-none text-[#f0f6fc] placeholder-[#6e7681] text-[11px] font-mono focus:ring-0 p-0 w-full outline-none"
              placeholder="STA / レイヤー検索"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="text-[9px] font-mono text-[#6e7681] bg-[#21262d] px-1 rounded">⌘K</span>
          </div>
        </div>

        {/* Central Studio Switcher Ribbon */}
        <nav className="flex items-center gap-1 bg-[#161b22] p-1 rounded-lg border border-[#30363d]">
          {/* Studio 0: GeoLibre Terrain */}
          <button
            onClick={() => handleSelectStudio('geolibre-terrain')}
            className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-mono transition-all ${
              currentStudio === 'geolibre-terrain'
                ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
            title="国土地理院DEM5A/10B 2D/3D実地形道路線形設計スタジオ"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>GeoLibre地形設計</span>
            <span className="text-[8px] bg-[#10b981]/25 text-[#10b981] px-1 rounded font-bold border border-[#10b981]/30">
              GSI
            </span>
          </button>

          {/* Studio 1: Design */}
          <button
            onClick={() => handleSelectStudio('design')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-mono transition-all ${
              currentStudio === 'design'
                ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>幾何・構造設計</span>
          </button>

          {/* Studio 2: Construction */}
          <button
            onClick={() => handleSelectStudio('construction')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-mono transition-all ${
              currentStudio === 'construction'
                ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>施工・環境</span>
          </button>

          {/* Studio 3: Simulation */}
          <button
            onClick={() => handleSelectStudio('simulation')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-mono transition-all ${
              currentStudio === 'simulation'
                ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>走行検証</span>
            <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded font-bold">VR</span>
          </button>

          {/* Studio 4: Twin */}
          <button
            onClick={() => handleSelectStudio('twin')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-mono transition-all ${
              currentStudio === 'twin'
                ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>総合ツイン</span>
          </button>
        </nav>

        {/* Trailing Actions: Export Hub & System Telemetry */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Project Manager Button */}
          <button
            onClick={onOpenProjectManager}
            className="bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] hover:border-[#38bdf8]/50 px-2.5 py-1 rounded flex items-center gap-1.5 text-[11px] font-mono font-semibold transition-all active:scale-95 shadow-sm"
            title="道路設計プロジェクトの管理（新規作成・切替・複製・JSON保存）"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden md:inline">PJ管理</span>
          </button>

          {/* 5 Official Civil Deliverables Docs Button */}
          {onOpenCivilDeliverables && (
            <button
              onClick={onOpenCivilDeliverables}
              className="bg-[#161b22] hover:bg-[#21262d] text-[#38bdf8] border border-[#38bdf8]/40 hover:border-[#38bdf8] px-2.5 py-1 rounded flex items-center gap-1.5 text-[11px] font-mono font-semibold transition-all active:scale-95 shadow-sm"
              title="国交省 5大公式設計図書（詳細設計書、AgentSKILL、ハーネス、ループ、ロードマップ）の閲覧・出力"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">5大設計図書</span>
              <span className="text-[9px] bg-[#38bdf8]/20 px-1 rounded text-[#38bdf8]">.MD</span>
            </button>
          )}

          {/* BIM/CIM Delivery Export Button */}
          <button
            onClick={onOpenExportPackage}
            className="bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/40 px-2.5 py-1 rounded flex items-center gap-1.5 text-[11px] font-mono font-semibold transition-all active:scale-95 shadow-sm"
            title="国交省BIM/CIM納品パッケージ（LandXML/IFC/CSV）の即時出力"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">一括納品</span>
            <span className="text-[9px] bg-[#10b981]/30 px-1 rounded">ZIP</span>
          </button>

          {/* HITL Approval Primary Action */}
          <button
            onClick={onHitlClick}
            className="bg-[#38bdf8] text-[#090d13] hover:bg-[#7bd0ff] px-2.5 py-1 rounded flex items-center gap-1.5 text-[11px] font-mono font-semibold transition-all active:scale-95 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HITL承認</span>
          </button>

          {/* Diagnostics Icons */}
          <div className="flex items-center text-[#8b949e] gap-0.5 border-l border-[#30363d] pl-2">
            <button
              onClick={onOpenHealth}
              className="p-1 hover:text-[#f0f6fc] hover:bg-[#2d333b] rounded transition-colors"
              title="システム診断・VRAM負荷監視"
            >
              <Cpu className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-1 hover:text-[#f0f6fc] hover:bg-[#2d333b] rounded transition-colors"
              title="同期リフレッシュ"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenLogs}
              className="p-1 hover:text-[#f0f6fc] hover:bg-[#2d333b] rounded transition-colors"
              title="CLI実行ログ・アサーション履歴"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-1 border-l border-[#30363d]">
            <div className="w-7 h-7 rounded-full bg-[#21262d] border border-[#484f58] flex items-center justify-center text-[#38bdf8] text-[10px] font-mono font-bold">
              CE
            </div>
          </div>
        </div>
      </header>

      {/* 2. Sub-Ribbon: Studio Sub-Modules & Context Bar (h-7) */}
      <div className="fixed top-14 left-0 right-0 h-7 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3 z-40 text-[10px] font-mono text-[#8b949e]">
        {/* Dynamic Sub-modules based on selected Studio */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {currentStudio === 'design' && (
            <>
              <span className="text-[#6e7681] mr-1">幾何工種:</span>
              <button
                onClick={() => setActiveDomain('Road')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  activeDomain === 'Road'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                <Route className="w-3 h-3" />
                <span>道路幾何設計 (Road)</span>
              </button>
              <button
                onClick={() => setActiveDomain('Bridge')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  activeDomain === 'Bridge'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                <Video className="w-3 h-3" />
                <span>緑川渡河橋梁 (Bridge)</span>
                <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">STA.7+500</span>
              </button>
              <button
                onClick={() => setActiveDomain('Tunnel')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  activeDomain === 'Tunnel'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                <Network className="w-3 h-3" />
                <span>金峰山第1トンネル (Tunnel)</span>
                <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">STA.15+000</span>
              </button>
            </>
          )}

          {currentStudio === 'construction' && (
            <>
              <span className="text-[#6e7681] mr-1">施工工区:</span>
              <button
                onClick={() => setActiveDomain('Earthwork')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  activeDomain === 'Earthwork'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                <Mountain className="w-3 h-3" />
                <span>土工マスカーブLP・ダンプ運搬 (Earthwork)</span>
              </button>
              <button
                onClick={() => setActiveDomain('Hydro')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  activeDomain === 'Hydro'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                <CloudRain className="w-3 h-3" />
                <span>緑川水文出水4D＆PLATEAU環境 (Hydro)</span>
                <span className="text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] px-1 rounded font-bold">4D</span>
              </button>
            </>
          )}

          {currentStudio === 'simulation' && (
            <>
              <span className="text-[#6e7681] mr-1">検証種別:</span>
              <button
                onClick={() => setActiveDomain('Walkthrough')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  activeDomain === 'Walkthrough'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>60FPS VR視線走行 (Walkthrough)</span>
                <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded font-bold">SSD 75m</span>
              </button>
              <button
                onClick={() => setActiveDomain('Interference')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  activeDomain === 'Interference'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>建築限界・干渉チェック (Interference)</span>
              </button>
              <button
                onClick={() => setActiveDomain('AI Proposals')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  activeDomain === 'AI Proposals'
                    ? 'bg-[#a855f7]/20 text-[#a855f7] font-bold border border-[#a855f7]/40'
                    : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                <Brain className="w-3 h-3 text-[#a855f7]" />
                <span>AI設計コンペ案 (Proposals A/B/C)</span>
              </button>
            </>
          )}

          {currentStudio === 'twin' && (
            <>
              <span className="text-[#6e7681] mr-1">統合ツイン表示:</span>
              <span className="text-[#38bdf8] font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" />
                全線デジタルツイン (STA.0+000 〜 STA.24+500)
              </span>
              <span className="text-[#6e7681]">|</span>
              <span className="text-[#8b949e]">QGIS 2D PLAN × PyVista 3D CORRIDOR スプリット</span>
            </>
          )}
        </div>

        {/* Global Context Indicators */}
        <div className="hidden md:flex items-center gap-3 text-[#6e7681]">
          <span>
            路線: <strong className="text-[#38bdf8]">{activeProject.routeCode}</strong> (L={activeProject.totalLengthKm}km)
          </span>
          <span>
            CRS: <strong className="text-[#f0f6fc]">{activeProject.crs}</strong>
          </span>
          <span>
            概算: <strong className="text-[#10b981]">{activeProject.estimatedCostBillionYen}億円</strong>
          </span>
          <span className="text-[#10b981] flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
            基準適合: 100% PASS
          </span>
        </div>
      </div>
    </>
  );
};
