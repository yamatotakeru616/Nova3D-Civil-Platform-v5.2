import React, { useState } from 'react';
import {
  FolderKanban,
  MoreVertical,
  PlayCircle,
  Layers,
  Bot,
  Droplets,
  Mountain,
  Grid,
  Building2,
  FileText,
  Activity,
  Compass,
  CheckCircle,
  RotateCcw,
  Calculator,
} from 'lucide-react';
import { SpatialConstraint, CivilProject, DesignPlan } from '../types';
import { ProjectStatisticsWidget } from './ProjectStatisticsWidget';

interface SideNavBarProps {
  constraints: SpatialConstraint[];
  activeProject?: CivilProject;
  currentPlan?: DesignPlan;
  onToggleConstraint: (id: string) => void;
  onOpenLogs: () => void;
  onOpenHealth: () => void;
  onRecalculateEarthwork: () => void;
  onNewAlignRun: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  constraints,
  activeProject,
  currentPlan,
  onToggleConstraint,
  onOpenLogs,
  onOpenHealth,
  onRecalculateEarthwork,
  onNewAlignRun,
}) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'ai'>('tree');

  return (
    <aside className="w-80 bg-[#0d1117] border-r border-[#30363d] flex flex-col justify-between z-30 flex-shrink-0 h-full select-none">
      {/* 1. Project Identifier Header */}
      <div className="p-2 border-b border-[#30363d]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 truncate">
            <FolderKanban className="text-[#38bdf8] w-4 h-4 shrink-0" />
            <span className="font-mono text-xs text-[#f0f6fc] font-bold truncate">
              {activeProject?.name || 'Project Corridor-A1'}
            </span>
          </div>
          <MoreVertical className="text-[#6e7681] cursor-pointer hover:text-[#f0f6fc] w-3.5 h-3.5 shrink-0" />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-[#6e7681]">
          <span>Vulkan Engine • 60 FPS</span>
          <span className="text-[#10b981]">VRAM 6.8GB</span>
        </div>
        <button
          onClick={onNewAlignRun}
          className="mt-2 w-full bg-[#161b22] hover:bg-[#2d333b] text-[#38bdf8] border border-[#38bdf8]/30 rounded py-1 text-[10px] font-mono font-semibold flex items-center justify-center gap-1 transition-colors active:scale-98"
        >
          <PlayCircle className="w-3 h-3" />
          <span>New Align Run</span>
        </button>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="grid grid-cols-2 border-b border-[#30363d] text-[10px] font-mono">
        <button
          onClick={() => setActiveTab('tree')}
          className={`py-1.5 text-center font-medium flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'tree'
              ? 'border-b-2 border-[#38bdf8] text-[#38bdf8] bg-[#161b22]'
              : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b]'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>空間制約ツリー</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`py-1.5 text-center flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'ai'
              ? 'border-b-2 border-[#a855f7] text-[#a855f7] bg-[#161b22]'
              : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b]'
          }`}
        >
          <Bot className="w-3 h-3" />
          <span>AI指示・対話</span>
        </button>
      </div>

      {/* 3. Content Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2.5 text-[10px] font-mono no-scrollbar">
        {/* Project Statistics Widget prominently anchored at top of sidebar */}
        <ProjectStatisticsWidget project={activeProject} currentPlan={currentPlan} />

        {activeTab === 'tree' ? (
          <>
            <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider px-0.5 pt-1">
              Spatial Constraints & GIS
            </div>
            {constraints.map((c) => {
              const getIcon = () => {
                switch (c.id) {
                  case 'river-midori':
                    return <Droplets className="w-3 h-3 text-[#38bdf8]" />;
                  case 'mountain-kinpo':
                    return <Mountain className="w-3 h-3 text-[#f59e0b]" />;
                  case 'agri-culvert':
                    return <Grid className="w-3 h-3 text-[#8b949e]" />;
                  case 'plateau-buildings':
                    return <Building2 className="w-3 h-3 text-[#7bd0ff]" />;
                  case 'cadastral-parcels':
                    return <FileText className="w-3 h-3 text-[#f59e0b]" />;
                  case 'utility-water':
                    return <Activity className="w-3 h-3 text-[#6e7681]" />;
                  default:
                    return <Layers className="w-3 h-3 text-[#38bdf8]" />;
                }
              };

              return (
                <div
                  key={c.id}
                  className={`border rounded p-1.5 transition-colors ${
                    c.checked ? 'border-[#30363d] bg-[#161b22]/50' : 'border-[#21262d] bg-[#0d1117]/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[#f0f6fc] font-medium mb-1">
                    <span className="flex items-center gap-1.5 cursor-pointer" onClick={() => onToggleConstraint(c.id)}>
                      <input
                        type="checkbox"
                        checked={c.checked}
                        onChange={() => onToggleConstraint(c.id)}
                        className="rounded bg-[#0d1117] border-[#484f58] text-[#38bdf8] focus:ring-0 w-3 h-3 cursor-pointer"
                      />
                      {getIcon()}
                      <span className="text-[11px] truncate">{c.name}</span>
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1 rounded ${
                        c.statusColor === 'green'
                          ? 'bg-[#10b981]/15 text-[#10b981]'
                          : c.statusColor === 'amber'
                          ? 'bg-[#f59e0b]/15 text-[#f59e0b]'
                          : 'bg-[#21262d] text-[#8b949e]'
                      }`}
                    >
                      {c.statusBadge}
                    </span>
                  </div>

                  {c.checked && (
                    <div className="pl-5 text-[9px] space-y-0.5 text-[#8b949e] font-mono">
                      {c.metrics.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span>{m.label}:</span>
                          <span
                            className={`${
                              m.pass ? 'text-[#10b981] font-bold' : m.highlight ? 'text-[#38bdf8]' : 'text-[#f0f6fc]'
                            }`}
                          >
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Recalculate Trigger Buttons */}
            <div className="pt-2 space-y-1.5">
              <button
                onClick={onRecalculateEarthwork}
                className="w-full bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] border border-[#30363d] rounded py-1 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-[#38bdf8]" />
                <span>自然地形再認識 & 構造物自動割付</span>
              </button>
              <button
                onClick={onRecalculateEarthwork}
                className="w-full bg-[#21262d] hover:bg-[#2d333b] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] rounded py-1 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors"
              >
                <Calculator className="w-3 h-3" />
                <span>公図買収影響再計算</span>
              </button>
            </div>
          </>
        ) : (
          <div className="p-2 space-y-2 text-[#8b949e]">
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
              <div className="text-[#38bdf8] font-bold mb-1 flex items-center gap-1">
                <Bot className="w-3 h-3" />
                AI エージェント指示概要
              </div>
              <p className="text-[10px] leading-relaxed text-[#f0f6fc]">
                Corridor-A1 は熊本平野〜金峰山東山麓を連絡する規格第3種第2級道路です。緑川渡河部での治水余裕高（H≥1.50m）確保と、STA.12+380付近の民有地（S邸）離隔保全がクリティカルパスです。
              </p>
            </div>
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] space-y-1">
              <div className="text-xs text-[#f0f6fc] font-semibold">自律エージェント運用方針</div>
              <div className="flex items-center gap-1 text-[#10b981]">
                <CheckCircle className="w-3 h-3" />
                <span>土量残差目標: ±1,000m³ 以内</span>
              </div>
              <div className="flex items-center gap-1 text-[#10b981]">
                <CheckCircle className="w-3 h-3" />
                <span>家屋補償件数: 0棟維持</span>
              </div>
              <div className="flex items-center gap-1 text-[#10b981]">
                <CheckCircle className="w-3 h-3" />
                <span>NATM工法地山評価: DII/DIII</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Mini-Locator Keymap Box */}
      <div className="border-t border-[#30363d] p-2 bg-[#161b22]/30">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-[#8b949e]">
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#38bdf8]" />
            キーマップ (広域)
          </span>
          <span className="text-[9px]">縮尺 1:25,000</span>
        </div>
        <div className="relative h-28 w-full bg-[#090d13] rounded border border-[#30363d] overflow-hidden flex items-center justify-center">
          <img
            className="w-full h-full object-cover opacity-60"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIOXidG5g2mqyptYSbBHVMnmLxqPKCtegNWc9dLMZeVvoeVlD2xrZ2ft00P60WlzKBca63u16j-ypIWz_cWgctZDmfy9n5oPzbp-OVW4mpxBjIN23QmogNl116ubE0ii-6RU7_qqJrtXQ3Xeq3uHAqsLRH7jfZ-T2z7fTU6S7LNvmX_njo3SzuCsRqrGVSMLH404L26kCYknxUd3kbum1RbJAsrsI1Da3XyIOJXiihmKto9JOrLE3Q"
            alt="Kumamoto GIS Satellite Topography"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/80 via-transparent to-transparent pointer-events-none" />
          {/* Viewport Bounds Box */}
          <div className="absolute w-14 h-10 border-2 border-[#38bdf8] bg-[#38bdf8]/20 rounded-sm pointer-events-none flex items-center justify-center">
            <span className="text-[8px] font-mono text-[#38bdf8] font-bold">STA.15</span>
          </div>
        </div>
      </div>

      {/* 5. Sidebar Footer Tabs */}
      <div className="border-t border-[#30363d] p-1 grid grid-cols-2 text-[10px] font-mono bg-[#0d1117]">
        <button
          onClick={onOpenLogs}
          className="flex items-center justify-center gap-1 py-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b] rounded transition-colors"
        >
          <Activity className="w-3 h-3 text-[#38bdf8]" />
          <span>Live Log</span>
        </button>
        <button
          onClick={onOpenHealth}
          className="flex items-center justify-center gap-1 py-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b] rounded transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          <span>System Health</span>
        </button>
      </div>
    </aside>
  );
};
