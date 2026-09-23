import React, { useState } from 'react';
import {
  TrendingUp,
  Sliders,
  BarChart2,
  Calendar,
  Maximize2,
  Play,
  Pause,
  Leaf,
} from 'lucide-react';
import { DesignPlan } from '../types';

interface BottomDockProps {
  currentPlan: DesignPlan;
  activeStation: number;
  onSeekStation: (sta: number) => void;
  timelineDay: number;
  setTimelineDay: (day: number) => void;
  isTimelinePlaying: boolean;
  setIsTimelinePlaying: (playing: boolean) => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  currentPlan,
  activeStation,
  onSeekStation,
  timelineDay,
  setTimelineDay,
  isTimelinePlaying,
  setIsTimelinePlaying,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'cross' | 'mass' | '4d'>('profile');

  // Interpolate cursor position in SVG (Station 0 to 25000 -> 0 to 800)
  const cursorX = Math.min(Math.max((activeStation / 25000) * 800, 20), 780);

  // Road Elevation dynamically reflects Plan
  const roadYOffset = currentPlan.id === 'B' ? 5 : currentPlan.id === 'C' ? -12 : 0;

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(clickX / rect.width, 1));
    const targetSta = Math.round(ratio * 25000);
    onSeekStation(targetSta);
  };

  return (
    <section className="h-48 bg-[#0d1117] border-t border-[#30363d] flex flex-col z-30 flex-shrink-0 select-none">
      {/* 1. Dock Tab Bar */}
      <div className="h-7 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3">
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1 font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#0d1117] text-[#38bdf8] border-b-2 border-[#38bdf8]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b]'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>地形断面縦断プロファイル (Profile)</span>
          </button>
          <button
            onClick={() => setActiveTab('cross')}
            className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
              activeTab === 'cross'
                ? 'bg-[#0d1117] text-[#38bdf8] border-b-2 border-[#38bdf8]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b]'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>横断離隔スライサー (STA. 12+400)</span>
          </button>
          <button
            onClick={() => setActiveTab('mass')}
            className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
              activeTab === 'mass'
                ? 'bg-[#0d1117] text-[#38bdf8] border-b-2 border-[#38bdf8]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b]'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>土量マスカーブ (Mass-Haul)</span>
          </button>
          <button
            onClick={() => setActiveTab('4d')}
            className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
              activeTab === '4d'
                ? 'bg-[#0d1117] text-[#38bdf8] border-b-2 border-[#38bdf8]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b]'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>4D施工タイムライン</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-[#6e7681]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#f59e0b]" />
            現況地形DEM
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#38bdf8]" />
            計画道路線形 ({currentPlan.badge})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#60a5fa]" />
            河川HWL EL+14.20m
          </span>
          <Maximize2 className="w-3.5 h-3.5 ml-2 cursor-pointer hover:text-[#f0f6fc]" />
        </div>
      </div>

      {/* 2. Analytical Profile Multi-Chart Area */}
      <div className="flex-1 flex p-2 gap-2 overflow-hidden">
        {/* Main Profile Vector Plot */}
        <div className="flex-1 bg-[#090d13] rounded border border-[#30363d] relative p-2 flex flex-col justify-between">
          <div className="relative w-full h-24 cursor-crosshair">
            <svg
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 800 100"
              onClick={handleSvgClick}
            >
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="800" y2="25" stroke="#21262d" strokeWidth="1" />
              <line x1="0" y1="50" x2="800" y2="50" stroke="#21262d" strokeWidth="1" />
              <line x1="0" y1="75" x2="800" y2="75" stroke="#21262d" strokeWidth="1" />

              {/* River HWL Water Level */}
              <line x1="160" y1="80" x2="320" y2="80" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="200" y="76" fill="#38bdf8" fontFamily="monospace" fontSize="8">
                緑川 HWL EL+14.20m (余裕高 {currentPlan.riverFreeboardM.toFixed(2)}m)
              </text>

              {/* Natural Ground DEM Profile (Amber Line) */}
              <path
                d="M0,90 Q80,85 160,82 T260,84 T340,70 T440,30 T560,10 T680,40 T800,85"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />

              {/* Road Design Elevation Profile (Solid Cyan Line) */}
              <path
                d={`M0,${85 + roadYOffset} L180,${68 + roadYOffset} L320,${68 + roadYOffset} L480,${
                  48 + roadYOffset
                } L620,${48 + roadYOffset} L800,${75 + roadYOffset}`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />

              {/* Bridge Structure Span Representation */}
              <rect x="180" y={65 + roadYOffset} width="140" height="4" rx="1" fill="#60a5fa" />
              <line x1="220" y1={69 + roadYOffset} x2="220" y2="84" stroke="#60a5fa" strokeWidth="2" />
              <line x1="270" y1={69 + roadYOffset} x2="270" y2="84" stroke="#60a5fa" strokeWidth="2" />
              <text x="210" y={58 + roadYOffset} fill="#8ed5ff" fontFamily="monospace" fontSize="8">
                渡河橋梁 L=250m
              </text>

              {/* Tunnel Section Representation */}
              <rect
                x="520"
                y={44 + roadYOffset}
                width="160"
                height="8"
                rx="2"
                fill="#a855f7"
                fillOpacity="0.3"
                stroke="#a855f7"
                strokeWidth="1"
              />
              <text x="540" y={38 + roadYOffset} fill="#d6a9ff" fontFamily="monospace" fontSize="8">
                金峰山TN L=480m (NATM Fs={currentPlan.tunnelFs})
              </text>

              {/* Current Station Cursor */}
              <line
                x1={cursorX}
                y1="0"
                x2={cursorX}
                y2="100"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle cx={cursorX} cy="58" r="3" fill="#f43f5e" />
            </svg>
          </div>

          {/* Profile Station Tick Labels */}
          <div className="flex justify-between text-[9px] font-mono text-[#6e7681] border-t border-[#30363d] pt-1">
            <span className="cursor-pointer hover:text-[#f0f6fc]" onClick={() => onSeekStation(0)}>
              STA.0+000 (EL+10.0m)
            </span>
            <span className="cursor-pointer hover:text-[#f0f6fc]" onClick={() => onSeekStation(5000)}>
              STA.5+000
            </span>
            <span className="text-[#38bdf8] font-bold cursor-pointer" onClick={() => onSeekStation(15200)}>
              STA.15+200 [現在位置]
            </span>
            <span className="cursor-pointer hover:text-[#f0f6fc]" onClick={() => onSeekStation(20000)}>
              STA.20+000 (トンネル区間)
            </span>
            <span className="cursor-pointer hover:text-[#f0f6fc]" onClick={() => onSeekStation(25000)}>
              STA.25+000 (終点交差点)
            </span>
          </div>
        </div>

        {/* Cross-Section Slicer Preview (STA. 15+200) */}
        <div className="w-64 bg-[#090d13] rounded border border-[#30363d] p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
            <span className="text-[#f0f6fc] font-semibold">
              横断ビュー: STA.{(activeStation / 1000).toFixed(0)}+
              {(activeStation % 1000).toString().padStart(3, '0')}
            </span>
            <span className="text-[#10b981] text-[9px]">2車線 幅員13.5m</span>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 160 70">
              {/* Ground Slope Line */}
              <path d="M5,48 L45,45 L115,40 L155,35" fill="none" stroke="#f59e0b" strokeDasharray="2 2" strokeWidth="1" />
              {/* Road Subgrade & Embankment Trapezoid */}
              <polygon
                points="35,42 125,42 140,55 20,55"
                fill="rgba(16, 185, 129, 0.15)"
                stroke="#10b981"
                strokeWidth="1"
              />
              {/* Pavement Surface */}
              <rect x="35" y="40" width="90" height="2" fill="#38bdf8" />
              {/* Roadway Centerline */}
              <line x1="80" y1="32" x2="80" y2="52" stroke="#f43f5e" strokeDasharray="2 1" strokeWidth="1" />
              <text x="73" y="30" fill="#8b949e" fontFamily="monospace" fontSize="6">
                CL
              </text>
              {/* Dimensions */}
              <line x1="35" y1="36" x2="125" y2="36" stroke="#484f58" strokeWidth="0.75" />
              <text x="68" y="35" fill="#f0f6fc" fontFamily="monospace" fontSize="6">
                W=13.5m
              </text>
              {/* Cut/Fill Tag */}
              <text x="25" y="64" fill="#10b981" fontFamily="monospace" fontSize="7">
                盛土工: +12.4m²
              </text>
            </svg>
          </div>
          <div className="text-[9px] font-mono text-[#6e7681] flex justify-between">
            <span>車道 3.25m × 2</span>
            <span>歩道 2.50m (両側)</span>
            <span>横断勾配: 2.0%</span>
          </div>
        </div>

        {/* 4D Mini Construction Timeline Bar */}
        <div className="w-72 bg-[#090d13] rounded border border-[#30363d] p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#f0f6fc] font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#a855f7]" />
              4D施工シミュレータ
            </span>
            <span className="text-[#38bdf8] font-bold">
              Day {timelineDay} / {currentPlan.workDurationDays}
            </span>
          </div>

          <div className="space-y-1 my-1">
            <div className="flex justify-between text-[10px] text-[#8b949e]">
              <span>進行工程: <strong>Step 03 盛土・法面保護工</strong></span>
              <span className="text-[#10b981] font-bold">
                {Math.round((timelineDay / currentPlan.workDurationDays) * 100)}% 完了
              </span>
            </div>
            {/* Timeline Range Track */}
            <div className="relative w-full h-2 bg-[#21262d] rounded overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#38bdf8] rounded"
                style={{ width: `${(timelineDay / currentPlan.workDurationDays) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-[#6e7681] font-mono">
              <span>着工 2025/04</span>
              <span>緑川橋梁架設 2025/11</span>
              <span>竣工 2026/12</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#30363d] text-[9px] text-[#8b949e]">
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-[#10b981]" />
              CO₂抑制率: <strong className="text-[#10b981]">94.2%</strong>
            </span>
            <button
              onClick={() => {
                if (isTimelinePlaying) {
                  setIsTimelinePlaying(false);
                } else {
                  setIsTimelinePlaying(true);
                  const nextDay = timelineDay >= currentPlan.workDurationDays ? 1 : timelineDay + 30;
                  setTimelineDay(nextDay);
                }
              }}
              className="bg-[#161b22] hover:bg-[#2d333b] text-[#38bdf8] px-2 py-0.5 rounded text-[9px] font-mono flex items-center gap-1 transition-colors"
            >
              {isTimelinePlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
              {isTimelinePlaying ? '停止' : '再生'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
