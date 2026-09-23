import React, { useRef, useState, useEffect } from 'react';
import {
  Compass,
  MousePointer,
  Plus,
  Trash2,
  Target,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  RotateCcw,
} from 'lucide-react';
import { IntersectionPoint, StandardAssembly } from '../../types';

interface Advanced2DCadPlanViewProps {
  ips: IntersectionPoint[];
  activeIpId: string | null;
  activeIp: IntersectionPoint | undefined;
  cadTool: 'select' | 'add_ip' | 'delete_ip';
  snapSettings: {
    cadastral5m: boolean;
    demSaddle: boolean;
    corridorRibbon: boolean;
    slopeHatch: boolean;
    stationMarks: boolean;
  };
  currentStationM: number;
  roadLengthM?: number;
  assembly: StandardAssembly;
  dynamicLandClearance: number;
  dynamicRadius: number;
  onSelectCadTool: (tool: 'select' | 'add_ip' | 'delete_ip') => void;
  onToggleSnapSetting: (key: 'cadastral5m' | 'demSaddle' | 'corridorRibbon' | 'slopeHatch' | 'stationMarks') => void;
  onSelectIp: (id: string) => void;
  onMoveIp: (id: string, x: number, y: number) => void;
  onAddIp: (x: number, y: number) => void;
  onDeleteIp: (id: string) => void;
  onSeekStation: (stationM: number) => void;
  demOverlay?: boolean;
}

export const Advanced2DCadPlanView: React.FC<Advanced2DCadPlanViewProps> = ({
  ips,
  activeIpId,
  activeIp,
  cadTool,
  snapSettings,
  currentStationM,
  roadLengthM = 2440,
  assembly,
  dynamicLandClearance,
  dynamicRadius,
  onSelectCadTool,
  onToggleSnapSetting,
  onSelectIp,
  onMoveIp,
  onAddIp,
  onDeleteIp,
  onSeekStation,
  demOverlay = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Smooth Matrix Pan & Zoom State (Scale & Translation)
  const [transform, setTransform] = useState<{ scale: number; x: number; y: number }>({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // IP Dragging State
  const [draggingIpId, setDraggingIpId] = useState<string | null>(null);
  const [hoveredCoord, setHoveredCoord] = useState<{ x: number; y: number } | null>(null);

  // Convert Screen Mouse Client Coordinates to SVG Internal Model Space
  const clientToSvgCoord = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    // ViewBox is 0 0 600 450
    const rawX = ((clientX - rect.left) / rect.width) * 600;
    const rawY = ((clientY - rect.top) / rect.height) * 450;

    // Invert Pan & Zoom Transform
    const modelX = (rawX - transform.x) / transform.scale;
    const modelY = (rawY - transform.y) / transform.scale;

    return { x: Math.round(modelX), y: Math.round(modelY) };
  };

  // Wheel Zoom (Centering on cursor position)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.max(0.4, Math.min(6.0, transform.scale * zoomFactor));

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseSvgX = ((e.clientX - rect.left) / rect.width) * 600;
    const mouseSvgY = ((e.clientY - rect.top) / rect.height) * 450;

    // Zoom towards mouse position
    const newX = mouseSvgX - (mouseSvgX - transform.x) * (newScale / transform.scale);
    const newY = mouseSvgY - (mouseSvgY - transform.y) * (newScale / transform.scale);

    setTransform({ scale: newScale, x: newX, y: newY });
  };

  // Middle Click or Space Drag Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle button or Alt+Left Click pan
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coord = clientToSvgCoord(e.clientX, e.clientY);
    if (coord) setHoveredCoord(coord);

    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
      return;
    }

    if (draggingIpId && coord) {
      let targetX = coord.x;
      let targetY = coord.y;

      // Cadastral 5m Snap Magnetic Guide
      if (snapSettings.cadastral5m && targetX >= 240 && targetX <= 380 && targetY >= 80 && targetY <= 160) {
        if (Math.abs(targetY - 145) < 18) {
          targetY = 145; // snap to safe buffer line
        }
      }

      onMoveIp(draggingIpId, targetX, targetY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingIpId(null);
  };

  // SVG Canvas Click (Add IP or Deselect)
  const handleSvgClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    const coord = clientToSvgCoord(e.clientX, e.clientY);
    if (!coord) return;

    if (cadTool === 'add_ip') {
      onAddIp(coord.x, coord.y);
      onSelectCadTool('select');
    }
  };

  const resetView = () => {
    setTransform({ scale: 1, x: 0, y: 0 });
  };

  // Major Stations along road (BP, KA, BC, MC, EC, KE, EP)
  const majorStationPoints = [
    { sta: 'BP No.0', staM: 0, x: 40, y: 380, type: 'BP' },
    { sta: 'KA1 No.16+8.2', staM: 328, x: 105, y: 320, type: 'KA' },
    { sta: 'BC1 No.22', staM: 440, x: 135, y: 295, type: 'BC' },
    { sta: 'MC1 No.36', staM: 720, x: 190, y: 255, type: 'MC' },
    { sta: 'EC1 No.48', staM: 960, x: 260, y: 225, type: 'EC' },
    { sta: 'KE1 No.54', staM: 1080, x: 295, y: 215, type: 'KE' },
    { sta: 'No.70', staM: 1400, x: 370, y: 190, type: 'NO' },
    { sta: 'No.90', staM: 1800, x: 450, y: 150, type: 'NO' },
    { sta: 'No.110', staM: 2200, x: 520, y: 110, type: 'NO' },
    { sta: 'EP No.122', staM: 2440, x: 560, y: 90, type: 'EP' },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-[#070b10] overflow-hidden select-none font-mono"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* 2D CAD Toolstrip HUD */}
      <div className="bg-[#161b22]/90 backdrop-blur border-b border-[#30363d] px-2.5 py-1 z-20 flex items-center justify-between text-[10px]">
        {/* Left: Mode Switchers */}
        <div className="flex items-center gap-1">
          <span className="text-[#38bdf8] font-bold mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            2D CAD / QGIS
          </span>
          <button
            onClick={() => onSelectCadTool('select')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
              cadTool === 'select'
                ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
            title="選択・移動ツール: IPをクリックで選択、ドラッグで移動"
          >
            <MousePointer className="w-2.5 h-2.5" />
            <span>選択/移動</span>
          </button>
          <button
            onClick={() => onSelectCadTool('add_ip')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
              cadTool === 'add_ip'
                ? 'bg-[#10b981] text-[#090d13] font-bold shadow animate-pulse'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#10b981]'
            }`}
            title="IP追加ツール: 平面図上をクリックして新規IPを挿入"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>IP追加</span>
          </button>
          <button
            onClick={() => onSelectCadTool('delete_ip')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
              cadTool === 'delete_ip'
                ? 'bg-[#f43f5e] text-white font-bold shadow'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#f43f5e]'
            }`}
            title="IP削除ツール: 削除したいIPをクリック"
          >
            <Trash2 className="w-2.5 h-2.5" />
            <span>IP削除</span>
          </button>
        </div>

        {/* Right: Snapping & Layers Toggles */}
        <div className="flex items-center gap-1 text-[9px]">
          <button
            onClick={() => onToggleSnapSetting('cadastral5m')}
            className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
              snapSettings.cadastral5m
                ? 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40 font-semibold'
                : 'bg-[#21262d] text-[#6e7681] border-transparent'
            }`}
            title="公図5.0m離隔マグネットスナップ"
          >
            <Target className="w-2.5 h-2.5" />
            <span>公図5m吸着</span>
          </button>
          <button
            onClick={() => onToggleSnapSetting('demSaddle')}
            className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
              snapSettings.demSaddle
                ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 font-semibold'
                : 'bg-[#21262d] text-[#6e7681] border-transparent'
            }`}
            title="DEM鞍部最小切土推奨線"
          >
            <span>〰 鞍部線</span>
          </button>
          <button
            onClick={() => onToggleSnapSetting('corridorRibbon')}
            className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
              snapSettings.corridorRibbon
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/40 font-semibold'
                : 'bg-[#21262d] text-[#6e7681] border-transparent'
            }`}
            title="車道・路肩・歩道境界リボン"
          >
            <span>═ リボン</span>
          </button>
          <button
            onClick={() => onToggleSnapSetting('slopeHatch')}
            className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
              snapSettings.slopeHatch
                ? 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/40 font-semibold'
                : 'bg-[#21262d] text-[#6e7681] border-transparent'
            }`}
            title="切土・盛土法面展開ハッチング"
          >
            <span>▥ 法面</span>
          </button>
          <button
            onClick={() => onToggleSnapSetting('stationMarks')}
            className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
              snapSettings.stationMarks
                ? 'bg-[#8ed5ff]/15 text-[#8ed5ff] border-[#8ed5ff]/40 font-semibold'
                : 'bg-[#21262d] text-[#6e7681] border-transparent'
            }`}
            title="主要点測点杭プロット (KA/BC/MC/EC/KE)"
          >
            <span>☷ 測点杭</span>
          </button>

          <div className="w-[1px] h-3 bg-[#30363d] mx-1" />

          {/* Zoom Buttons */}
          <button
            onClick={() => setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.25, 6) }))}
            className="p-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded"
            title="拡大 (ホイール上)"
          >
            <ZoomIn className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.4) }))}
            className="p-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded"
            title="縮小 (ホイール下)"
          >
            <ZoomOut className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded"
            title="表示リセット"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* SVG Container with Pan/Zoom Transform */}
      <div className="flex-1 relative overflow-hidden">
        {cadTool === 'add_ip' && (
          <div className="absolute top-2 left-2 z-10 bg-[#10b981] text-[#090d13] px-2 py-0.5 rounded text-[10px] font-bold shadow-lg animate-pulse flex items-center gap-1">
            <Plus className="w-3 h-3" />
            クリックした地点に新規IPを挿入します
          </div>
        )}
        {cadTool === 'delete_ip' && (
          <div className="absolute top-2 left-2 z-10 bg-[#f43f5e] text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg flex items-center gap-1">
            <Trash2 className="w-3 h-3" />
            削除したい交点（IP）をクリックしてください
          </div>
        )}

        <svg
          ref={svgRef}
          className={`w-full h-full ${
            cadTool === 'add_ip'
              ? 'cursor-crosshair'
              : cadTool === 'delete_ip'
              ? 'cursor-not-allowed'
              : isPanning
              ? 'cursor-grabbing'
              : 'cursor-default'
          }`}
          preserveAspectRatio="none"
          viewBox="0 0 600 450"
          onClick={handleSvgClick}
        >
          <defs>
            <pattern id="cadGrid2" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#161b22" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width="600" height="450" fill="url(#cadGrid2)" />

          {/* Scaled & Translated Model Space Group */}
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* DEM Contour Lines */}
            {demOverlay && (
              <g opacity="0.5">
                <path d="M-50,80 Q120,40 280,110 T650,90" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
                <path d="M-50,140 Q150,120 310,180 T650,160" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
                <path d="M-50,220 Q180,180 340,250 T650,230" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
                <path d="M-50,310 Q210,270 380,330 T650,300" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
                <path d="M-50,390 Q240,360 420,410 T650,380" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
              </g>
            )}

            {/* DEM Saddle Minimal Earthwork Line */}
            {snapSettings.demSaddle && (
              <g opacity="0.8">
                <path
                  d="M 40,380 C 130,290 190,260 270,220 C 350,180 430,140 560,90"
                  fill="none"
                  stroke="#10b981"
                  strokeDasharray="4,4"
                  strokeWidth="1.5"
                />
                <text x="210" y="215" fill="#10b981" fontSize="8">
                  DEM鞍部（最小土量推奨ルート）
                </text>
              </g>
            )}

            {/* Cadastral Parcel Boundaries */}
            <polygon points="180,70 260,60 290,140 200,160" fill="rgba(245,158,11,0.03)" stroke="#484f58" strokeDasharray="4,2" strokeWidth="0.8" />
            <polygon points="260,60 340,50 370,130 290,140" fill="rgba(244,63,94,0.06)" stroke="#f43f5e" strokeOpacity="0.6" strokeWidth="0.9" />
            <text x="275" y="95" fill="#f43f5e" fontSize="8" opacity="0.8">
              民有地（買収制約筆界）
            </text>

            {/* 5m Safety Margin Line */}
            {snapSettings.cadastral5m && (
              <g>
                <polyline
                  points="170,170 200,175 295,155 375,145 390,135"
                  fill="none"
                  stroke="#f59e0b"
                  strokeDasharray="3,3"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
                <text x="300" y="165" fill="#f59e0b" fontSize="7.5">
                  ⌖ 5.0m 法的離隔線
                </text>
              </g>
            )}

            {/* IP Tangent Polyline */}
            {(() => {
              const pointsStr = ['40,380', ...ips.map((p) => `${p.x ?? 380},${p.y ?? 190}`), '560,90'].join(' ');
              return (
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke="#484f58"
                  strokeDasharray="4,4"
                  strokeWidth="1"
                  opacity="0.6"
                />
              );
            })()}

            {/* Slope Hatching (Cut / Fill Batters) */}
            {snapSettings.slopeHatch && (
              <g opacity="0.45">
                {[
                  { x1: 90, y1: 320, x2: 80, y2: 308, cut: true },
                  { x1: 130, y1: 280, x2: 120, y2: 268, cut: true },
                  { x1: 180, y1: 245, x2: 170, y2: 235, cut: true },
                  { x1: 230, y1: 220, x2: 220, y2: 208, cut: false },
                  { x1: 280, y1: 200, x2: 270, y2: 190, cut: false },
                  { x1: 340, y1: 185, x2: 330, y2: 175, cut: true },
                  { x1: 400, y1: 165, x2: 390, y2: 155, cut: true },
                  { x1: 470, y1: 135, x2: 460, y2: 125, cut: false },
                ].map((s, idx) => (
                  <line
                    key={idx}
                    x1={s.x1}
                    y1={s.y1}
                    x2={s.x2}
                    y2={s.y2}
                    stroke={s.cut ? '#f43f5e' : '#10b981'}
                    strokeWidth="1.4"
                  />
                ))}
              </g>
            )}

            {/* Corridor Ribbon Offsets (Left & Right Edge) */}
            {snapSettings.corridorRibbon && (
              <g opacity="0.75">
                {/* Left Shoulder Line */}
                <path
                  d={(() => {
                    const pts = ips.map((ip) => `${(ip.x ?? 380) - 10},${(ip.y ?? 190) - 10}`);
                    return `M 30,370 Q 160,225 ${pts[0]} T 550,80`;
                  })()}
                  fill="none"
                  stroke="#38bdf8"
                  strokeDasharray="3,3"
                  strokeWidth="1.2"
                />
                {/* Right Shoulder Line */}
                <path
                  d={(() => {
                    const pts = ips.map((ip) => `${(ip.x ?? 380) + 10},${(ip.y ?? 190) + 10}`);
                    return `M 50,390 Q 200,255 ${pts[0]} T 570,100`;
                  })()}
                  fill="none"
                  stroke="#38bdf8"
                  strokeDasharray="3,3"
                  strokeWidth="1.2"
                />
              </g>
            )}

            {/* Road Centerline (Smooth Cubic Spline) */}
            <path
              d={(() => {
                const count = ips.length;
                if (count === 0) return 'M 40,380 L 560,90';
                if (count === 1) {
                  const p = ips[0];
                  return `M 40,380 Q ${p.x},${p.y} 560,90`;
                }
                let d = `M 40,380 `;
                ips.forEach((ip, idx) => {
                  const x = ip.x ?? 380;
                  const y = ip.y ?? 190;
                  if (idx === 0) {
                    d += `C 120,300 ${x - 40},${y + 20} ${x},${y} `;
                  } else {
                    d += `S ${x - 30},${y + 15} ${x},${y} `;
                  }
                });
                d += `T 560,90`;
                return d;
              })()}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.4"
            />

            {/* Major Station Piles (KA, BC, MC, EC, KE) with Callout Lines */}
            {snapSettings.stationMarks && (
              <g>
                {majorStationPoints.map((m, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer group select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeekStation(m.staM);
                    }}
                  >
                    <circle
                      cx={m.x}
                      cy={m.y}
                      r={m.type === 'KA' || m.type === 'KE' ? '4.5' : '3.5'}
                      fill={m.type === 'KA' || m.type === 'KE' ? '#a855f7' : '#8ed5ff'}
                      stroke="#090d13"
                      strokeWidth="1"
                      className="group-hover:scale-150 transition-transform group-hover:fill-[#f43f5e]"
                    />
                    <line x1={m.x - 3} y1={m.y + 3} x2={m.x + 3} y2={m.y - 3} stroke="#ffffff" strokeWidth="1" />
                    <text
                      x={m.x + 6}
                      y={m.y - 4}
                      fill={m.type === 'KA' || m.type === 'KE' ? '#c084fc' : '#8b949e'}
                      fontSize="7.5"
                      className="group-hover:fill-[#f43f5e] group-hover:font-bold transition-colors"
                    >
                      {m.sta}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Dynamic IP Markers with Drag Handles */}
            {ips.map((ip) => {
              const isSelected = ip.id === activeIpId;
              const x = ip.x ?? 380;
              const y = ip.y ?? 190;

              return (
                <g
                  key={ip.id}
                  className="cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (cadTool === 'delete_ip') {
                      onDeleteIp(ip.id);
                      return;
                    }
                    onSelectIp(ip.id);
                    setDraggingIpId(ip.id);
                  }}
                >
                  {/* IP Radius Arc Ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.min(50, (ip.radius || 150) * 0.18)}
                    fill="none"
                    stroke={isSelected ? '#38bdf8' : '#30363d'}
                    strokeDasharray="2,2"
                    strokeWidth="1"
                  />

                  {/* IP Center Diamond */}
                  <polygon
                    points={`${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`}
                    fill={isSelected ? '#38bdf8' : '#161b22'}
                    stroke={isSelected ? '#ffffff' : '#38bdf8'}
                    strokeWidth="2"
                    className="hover:scale-125 transition-transform"
                  />

                  <text
                    x={x + 11}
                    y={y + 4}
                    fill={isSelected ? '#38bdf8' : '#f0f6fc'}
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {ip.id}
                  </text>
                  <text x={x + 11} y={y + 14} fill="#8b949e" fontSize="7.5">
                    R={ip.radius}m
                  </text>
                </g>
              );
            })}

            {/* Four-View Synchronized Laser Needle */}
            {(() => {
              const t = Math.max(0, Math.min(1, currentStationM / roadLengthM));
              const ip1 = ips[0] || { x: 200, y: 260 };
              const ipMid = ips[1] || ips[0] || { x: 380, y: 190 };
              const u = 1 - t;
              const curX = u * u * u * 40 + 3 * u * u * t * (ip1.x ?? 200) + 3 * u * t * t * (ipMid.x ?? 380) + t * t * t * 560;
              const curY = u * u * u * 380 + 3 * u * u * t * (ip1.y ?? 260) + 3 * u * t * t * (ipMid.y ?? 190) + t * t * t * 90;

              const dx = 3 * u * u * ((ip1.x ?? 200) - 40) + 6 * u * t * ((ipMid.x ?? 380) - (ip1.x ?? 200)) + 3 * t * t * (560 - (ipMid.x ?? 380));
              const dy = 3 * u * u * ((ip1.y ?? 260) - 380) + 6 * u * t * ((ipMid.y ?? 190) - (ip1.y ?? 260)) + 3 * t * t * (90 - (ipMid.y ?? 190));
              const len = Math.hypot(dx, dy) || 1;
              const nx = -dy / len;
              const ny = dx / len;
              const crossHalf = 24;

              return (
                <g className="filter drop-shadow-[0_0_8px_rgba(244,63,94,0.95)]">
                  {/* Normal Cross Cutting Laser Line */}
                  <line
                    x1={curX - nx * crossHalf}
                    y1={curY - ny * crossHalf}
                    x2={curX + nx * crossHalf}
                    y2={curY + ny * crossHalf}
                    stroke="#f43f5e"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  {/* Center Dot */}
                  <circle cx={curX} cy={curY} r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.2" />
                  {/* Station Callout Flag */}
                  <rect
                    x={curX + 8}
                    y={curY - 14}
                    width="70"
                    height="13"
                    rx="2"
                    fill="#0d1117"
                    stroke="#f43f5e"
                    strokeWidth="1"
                  />
                  <text x={curX + 12} y={curY - 4} fill="#f43f5e" fontSize="7.5" fontWeight="bold">
                    STA.{(currentStationM / 1000).toFixed(0)}+{(currentStationM % 1000).toFixed(0).padStart(4, '0')}
                  </text>
                </g>
              );
            })()}
          </g>
        </svg>

        {/* Dynamic IP Parameters HUD */}
        {activeIp && (
          <div className="absolute top-3 left-3 bg-[#161b22]/95 backdrop-blur-md border border-[#38bdf8] p-2 rounded shadow-lg z-20 pointer-events-none text-[10px] max-w-xs">
            <div className="flex items-center justify-between gap-3 border-b border-[#30363d] pb-1 mb-1">
              <span className="text-[#38bdf8] font-bold flex items-center gap-1">
                <Move className="w-3 h-3" />
                {activeIp.id} 幾何諸元連動
              </span>
              <span
                className={`px-1 rounded font-bold text-[9px] ${
                  activeIp.status === 'PASS' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                }`}
              >
                {activeIp.status === 'PASS' ? 'FEASIBLE' : 'WARNING'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
              <div className="text-[#8b949e]">座標 (X, Y):</div>
              <div className="text-[#f0f6fc] font-bold">
                X={activeIp.x ?? 380}, Y={activeIp.y ?? 190}
              </div>
              <div className="text-[#8b949e]">曲線半径 R:</div>
              <div className="text-[#38bdf8] font-bold">
                R={activeIp.radius.toFixed(0)}m {activeIp.radius >= 150 ? '≥ 150m' : '< 150m'}
              </div>
              <div className="text-[#8b949e]">クロソイド長 L:</div>
              <div className="text-[#10b981] font-bold">
                A={activeIp.aParam ?? 110} (L={activeIp.clothoidL.toFixed(1)}m)
              </div>
              <div className="text-[#8b949e]">用地離隔マージン:</div>
              <div className="text-[#10b981] font-bold">{dynamicLandClearance.toFixed(2)} m (成立)</div>
            </div>
          </div>
        )}

        {/* Mouse Position HUD */}
        {hoveredCoord && (
          <div className="absolute bottom-2 right-2 bg-[#0d1117]/85 backdrop-blur border border-[#30363d] px-2 py-0.5 rounded text-[9px] text-[#8b949e]">
            X: <span className="text-[#f0f6fc]">{hoveredCoord.x}</span>, Y:{' '}
            <span className="text-[#f0f6fc]">{hoveredCoord.y}</span>
            <span className="ml-2 text-[#6e7681]">ZOOM: {(transform.scale * 100).toFixed(0)}%</span>
          </div>
        )}

        {/* Compass Rose */}
        <div className="absolute bottom-3 left-3 bg-[#161b22]/80 backdrop-blur p-1.5 rounded border border-[#30363d] flex flex-col items-center">
          <span className="text-[#38bdf8] font-bold text-xs">▲</span>
          <span className="text-[9px] text-[#f0f6fc] font-bold">N</span>
        </div>
      </div>
    </div>
  );
};
