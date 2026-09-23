import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Focus,
  Layers,
  Scissors,
  Car,
  Sun,
  Scale,
  Video,
  Mountain,
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  ChevronUp,
  Move,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DesignPlan, CivilDomain, IntersectionPoint } from '../types';

interface CenterViewportProps {
  currentPlan: DesignPlan;
  viewportMode: '3d' | '2d' | 'dual';
  setViewportMode: (mode: '3d' | '2d' | 'dual') => void;
  activeStation: number;
  onSeekStation: (sta: number) => void;
  cutSlopeRatio: number;
  onSwitchStudio?: (studio: CivilDomain) => void;
  ips?: IntersectionPoint[];
  onDragEnd?: (updatedIps: IntersectionPoint[], delta: { dx: number; dy: number; cutDelta: number; fillDelta: number }) => void;
  onUpdateAlignment?: (updatedIps: IntersectionPoint[]) => void;
}

const DEFAULT_CENTER_IPS: IntersectionPoint[] = [
  {
    id: 'IP-01',
    station: 'STA. 4+250',
    theta: "32°15' R",
    radius: 350.0,
    clothoidA: '120/120',
    clothoidL: 41.1,
    superelevation: 4.0,
    widening: 0.25,
    curveLength: 197.0,
    status: 'PASS',
    x: 140,
    y: 280,
    isDraggable: true,
  },
  {
    id: 'IP-02',
    station: 'STA. 12+350',
    theta: "48°30' L",
    radius: 280.0,
    clothoidA: '110/110',
    clothoidL: 43.2,
    superelevation: 5.0,
    widening: 0.50,
    curveLength: 237.0,
    status: 'PASS',
    x: 320,
    y: 195,
    isDraggable: true,
  },
  {
    id: 'IP-03',
    station: 'STA. 18+600',
    theta: "26°40' R",
    radius: 400.0,
    clothoidA: '140/140',
    clothoidL: 49.0,
    superelevation: 3.5,
    widening: 0.20,
    curveLength: 185.0,
    status: 'PASS',
    x: 470,
    y: 130,
    isDraggable: true,
  },
];

export const CenterViewport: React.FC<CenterViewportProps> = ({
  currentPlan,
  viewportMode,
  setViewportMode,
  activeStation,
  onSeekStation,
  cutSlopeRatio,
  onSwitchStudio,
  ips: externalIps,
  onDragEnd,
  onUpdateAlignment,
}) => {
  const [cameraAngle, setCameraAngle] = useState<'iso' | 'top'>('iso');
  const [isEarthworkMeshVisible, setIsEarthworkMeshVisible] = useState(true);
  const [isCutawayActive, setIsCutawayActive] = useState(false);
  const [isSunStudyActive, setIsSunStudyActive] = useState(false);
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isIpOverlayVisible, setIsIpOverlayVisible] = useState(true);
  const [activeHudPill, setActiveHudPill] = useState<'earthwork' | 'station' | 'bridge' | 'tunnel' | 'curve' | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // IP ドラッグ状態
  const [viewportIps, setViewportIps] = useState<IntersectionPoint[]>(externalIps || DEFAULT_CENTER_IPS);
  const [initialIpsSnapshot, setInitialIpsSnapshot] = useState<IntersectionPoint[]>(externalIps || DEFAULT_CENTER_IPS);
  const [draggingIpId, setDraggingIpId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredIpId, setHoveredIpId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // 外部からのIP更新に同期
  useEffect(() => {
    if (externalIps && externalIps.length > 0) {
      setViewportIps(externalIps);
      setInitialIpsSnapshot(externalIps);
    }
  }, [externalIps]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2800);
  };

  // IPドラッグ開始 (クリック時も測点シーク連動)
  const handleMouseDownIp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingIpId(id);
    const ip = viewportIps.find((p) => p.id === id);
    if (ip) {
      setDragStartPos({ x: ip.x ?? 300, y: ip.y ?? 200 });
      setInitialIpsSnapshot([...viewportIps]);

      // 測点文字列 (例: STA. 12+350 -> 12350m) をパースして測点シーク
      if (ip.station) {
        const match = ip.station.match(/STA\.\s*(\d+)\+(\d+)/i);
        if (match) {
          const sta = parseInt(match[1], 10) * 1000 + parseInt(match[2], 10);
          onSeekStation(sta);
        }
      }
    }
  };

  // マウス移動（ドラッグ中の座標追従）
  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (!draggingIpId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 600;
    const svgY = ((e.clientY - rect.top) / rect.height) * 400;

    const clampedX = Math.max(30, Math.min(570, Math.round(svgX)));
    const clampedY = Math.max(30, Math.min(370, Math.round(svgY)));

    setViewportIps((prev) =>
      prev.map((ip) => {
        if (ip.id !== draggingIpId) return ip;
        // 半径Rの微動シミュレーション (Y位置が上がるとカーブ急減、下がると緩曲)
        const radiusDelta = Math.round((200 - clampedY) * 0.8);
        const dynamicRadius = Math.max(130, Math.min(600, Math.round(currentPlan.curveRadius + radiusDelta)));
        return {
          ...ip,
          x: clampedX,
          y: clampedY,
          radius: dynamicRadius,
          status: dynamicRadius >= 150 ? 'PASS' : 'WARN',
        };
      })
    );
  };

  // ドラッグ終了ハンドラー (onDragEnd)
  const handleDragEndInternal = useCallback(() => {
    if (!draggingIpId) return;

    const movedIp = viewportIps.find((p) => p.id === draggingIpId);
    const origIp = initialIpsSnapshot.find((p) => p.id === draggingIpId);

    const dx = movedIp && origIp ? (movedIp.x ?? 0) - (origIp.x ?? 0) : 0;
    const dy = movedIp && origIp ? (movedIp.y ?? 0) - (origIp.y ?? 0) : 0;

    // 土量変動の算出 (Y変位に伴う切盛バランス変化)
    const cutDelta = Math.round(dy * 15 - dx * 4);
    const fillDelta = Math.round(-dy * 12 + dx * 6);

    const deltaPayload = { dx, dy, cutDelta, fillDelta };

    // 1. 親への onDragEnd コールバック
    if (onDragEnd) {
      onDragEnd(viewportIps, deltaPayload);
    }
    // 2. onUpdateAlignment コールバック
    if (onUpdateAlignment) {
      onUpdateAlignment(viewportIps);
    }

    // 3. フィードバックトースト通知
    showToast(
      `✓ [${draggingIpId}] 線形更新完了: R=${movedIp?.radius ?? 280}m | 変位(ΔX:${dx >= 0 ? `+${dx}` : dx}, ΔY:${dy >= 0 ? `+${dy}` : dy}) | 土量収支連動`
    );

    setDraggingIpId(null);
    setDragStartPos(null);
    setInitialIpsSnapshot([...viewportIps]);
  }, [draggingIpId, viewportIps, initialIpsSnapshot, onDragEnd, onUpdateAlignment]);

  const handleSvgMouseUp = () => {
    if (draggingIpId) {
      handleDragEndInternal();
    }
  };

  const stationFormatted = `STA. ${(activeStation / 1000).toFixed(0)}+${(activeStation % 1000)
    .toString()
    .padStart(3, '0')}`;

  return (
    <div className="flex-1 flex flex-col bg-[#090d13] relative overflow-hidden select-none">
      {/* 1. Viewport Mode Switching Bar */}
      <div className="h-8 bg-[#0d1117]/90 backdrop-blur border-b border-[#30363d] flex items-center justify-between px-3 z-20">
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <button
            onClick={() => setViewportMode('3d')}
            className={`px-3 py-1 font-semibold flex items-center gap-1 transition-colors ${
              viewportMode === '3d'
                ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-b-2 border-[#38bdf8]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b]'
            }`}
          >
            <span>3Dデジタルツイン (PyVista)</span>
          </button>
          <button
            onClick={() => setViewportMode('2d')}
            className={`px-3 py-1 flex items-center gap-1 transition-colors ${
              viewportMode === '2d'
                ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-b-2 border-[#38bdf8]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b]'
            }`}
          >
            <span>QGIS 2D平面線形</span>
          </button>
          <button
            onClick={() => setViewportMode('dual')}
            className={`px-3 py-1 flex items-center gap-1 transition-colors ${
              viewportMode === 'dual'
                ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-b-2 border-[#38bdf8]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#2d333b]'
            }`}
          >
            <span>デュアル同期</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-[#8b949e]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            Vulkan 60.0 FPS
          </span>
          <span className="text-[#6e7681]">|</span>
          <span className="text-[#f0f6fc]">X: 568,742.123 Y: 4,735,912.456 Z: 98.765</span>
          <span className="text-[#6e7681]">|</span>
          <span>
            線形総延長: <strong className="text-[#38bdf8] font-bold">1,245.678m</strong>
          </span>
        </div>
      </div>

      {/* 2. Main 3D Perspective Graphic Stage */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#090d13]">
        {/* Visual Layer: 3D Digital Twin Image */}
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHVAX1QsIUau67R2PxJ8PNWQrzC2jJh_awH1feCJ8eyYT1jIa2vbqdLvMzqE_4jSfvIMtAP8sw4hl7C_QL1NcNnJn-vkBcCpbOpaL121fHgrX_TN4ma7nSS6aPedM36O0k6U57stA2aYmRiANxGEPWrgM03ADyrYqAbIT7h26gOZWRYEUzTwSjg_VKe_7j7zI7tvcQZZrG7RWL3oKYLZRNt2DRf5B1wIaGA0IYcH2Gfopxx-tbkVo6"
          alt="3D Civil Engineering Corridor Simulation"
        />

        {/* Subtle Gradient Scrim to guarantee high UI contrast */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#090d13]/80 via-transparent to-[#090d13]/70 pointer-events-none" />

        {/* Interactive IP & Alignment Vector Overlay Layer */}
        {isIpOverlayVisible && (
          <div
            className="absolute inset-0 z-10"
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
          >
            <svg
              ref={svgRef}
              className="w-full h-full cursor-crosshair"
              viewBox="0 0 600 400"
              preserveAspectRatio="none"
              onClick={(e) => {
                if (!svgRef.current) return;
                const rect = svgRef.current.getBoundingClientRect();
                const svgX = ((e.clientX - rect.left) / rect.width) * 600;
                const ratio = Math.max(0, Math.min(1, (svgX - 30) / 540));
                onSeekStation(Math.round(ratio * 25000));
              }}
            >
              {/* 旧線形ゴースト（破線） */}
              {draggingIpId && initialIpsSnapshot.length > 0 && (
                <path
                  d={(() => {
                    let d = `M 30,350 `;
                    initialIpsSnapshot.forEach((ip, idx) => {
                      const x = ip.x ?? 300;
                      const y = ip.y ?? 200;
                      if (idx === 0) d += `Q ${x - 30},${y + 10} ${x},${y} `;
                      else d += `T ${x},${y} `;
                    });
                    d += `T 570,70`;
                    return d;
                  })()}
                  fill="none"
                  stroke="#8b949e"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  opacity="0.5"
                />
              )}

              {/* 計画線形スプライン (リアルタイム追従) */}
              <path
                d={(() => {
                  let d = `M 30,350 `;
                  viewportIps.forEach((ip, idx) => {
                    const x = ip.x ?? 300;
                    const y = ip.y ?? 200;
                    if (idx === 0) d += `Q ${x - 30},${y + 10} ${x},${y} `;
                    else d += `T ${x},${y} `;
                  });
                  d += `T 570,70`;
                  return d;
                })()}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
              />

              {/* 接線ポリライン */}
              <polyline
                points={`30,350 ${viewportIps.map((ip) => `${ip.x ?? 300},${ip.y ?? 200}`).join(' ')} 570,70`}
                fill="none"
                stroke="#30363d"
                strokeDasharray="4,4"
                strokeWidth="1"
              />

              {/* 各IPのインタラクティブ・ドラッグハンドル */}
              {viewportIps.map((ip) => {
                const isDragging = ip.id === draggingIpId;
                const isHovered = ip.id === hoveredIpId;
                const x = ip.x ?? 300;
                const y = ip.y ?? 200;

                return (
                  <g
                    key={ip.id}
                    className="cursor-move select-none"
                    onMouseEnter={() => setHoveredIpId(ip.id)}
                    onMouseLeave={() => setHoveredIpId(null)}
                    onMouseDown={(e) => handleMouseDownIp(ip.id, e)}
                    onMouseUp={handleSvgMouseUp}
                  >
                    {/* 透明な広域ヒットエリア (掴みやすさ向上) */}
                    <circle cx={x} cy={y} r="22" fill="transparent" />

                    {/* ドラッグ中・ホバー時の波紋リング */}
                    {(isDragging || isHovered) && (
                      <circle
                        cx={x}
                        cy={y}
                        r={isDragging ? 20 : 14}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                        strokeDasharray={isDragging ? '3,2' : undefined}
                        className={isDragging ? 'animate-spin' : undefined}
                        opacity={isDragging ? 0.9 : 0.5}
                      />
                    )}

                    {/* 外輪ハンドル */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isDragging ? 9 : 7}
                      fill={isDragging ? '#38bdf8' : isHovered ? '#161b22' : '#0d1117'}
                      stroke={isDragging ? '#ffffff' : ip.status === 'PASS' ? '#38bdf8' : '#f59e0b'}
                      strokeWidth={isDragging ? 2.5 : 2}
                      className="transition-transform duration-100"
                    />

                    {/* 中心点 */}
                    <circle
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill={isDragging ? '#090d13' : '#38bdf8'}
                    />

                    {/* IP名 & 幾何諸元バッジ */}
                    <rect
                      x={x + 10}
                      y={y - 18}
                      width={isDragging ? 95 : 62}
                      height="18"
                      rx="3"
                      fill="#0d1117"
                      stroke={isDragging ? '#38bdf8' : '#30363d'}
                      strokeWidth="1"
                      className="shadow-lg"
                      opacity="0.9"
                    />
                    <text
                      x={x + 14}
                      y={y - 6}
                      fill={isDragging ? '#38bdf8' : '#f0f6fc'}
                      fontFamily="monospace"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {ip.id} {isDragging ? `R=${ip.radius}m` : ''}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* ドラッグ中リアルタイム追従HUDバブル */}
            {draggingIpId && (() => {
              const activeIp = viewportIps.find((p) => p.id === draggingIpId);
              const origIp = initialIpsSnapshot.find((p) => p.id === draggingIpId);
              const dx = activeIp && origIp ? (activeIp.x ?? 0) - (origIp.x ?? 0) : 0;
              const dy = activeIp && origIp ? (activeIp.y ?? 0) - (origIp.y ?? 0) : 0;
              const cutEst = Math.round(dy * 15 - dx * 4);

              return (
                <div
                  className="absolute pointer-events-none bg-[#161b22]/95 border border-[#38bdf8] p-2 rounded-lg shadow-2xl text-[10px] font-mono z-30"
                  style={{
                    left: `${Math.min(75, Math.max(10, ((activeIp?.x ?? 300) / 600) * 100))}%`,
                    top: `${Math.min(75, Math.max(15, ((activeIp?.y ?? 200) / 400) * 100 + 4))}%`,
                  }}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[#38bdf8] border-b border-[#30363d] pb-1 mb-1">
                    <Move className="w-3 h-3 animate-spin" />
                    <span>{draggingIpId} リアルタイムドラッグ中</span>
                    <span className="text-[9px] px-1 bg-[#10b981]/20 text-[#10b981] rounded">
                      {activeIp?.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                    <span className="text-[#8b949e]">曲線半径:</span>
                    <strong className="text-[#f0f6fc]">R = {activeIp?.radius}m</strong>
                    <span className="text-[#8b949e]">ドラッグ変位:</span>
                    <strong className="text-[#38bdf8]">
                      ΔX: {dx >= 0 ? `+${dx}` : dx}, ΔY: {dy >= 0 ? `+${dy}` : dy}
                    </strong>
                    <span className="text-[#8b949e]">推定切土変化:</span>
                    <strong className={cutEst >= 0 ? 'text-[#f43f5e]' : 'text-[#10b981]'}>
                      {cutEst >= 0 ? `+${cutEst}` : cutEst} m³
                    </strong>
                  </div>
                  <div className="text-[8px] text-[#8b949e] mt-1 pt-1 border-t border-[#30363d]/60">
                    ※ マウスを離すとアライメント状態が確定保存されます
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 3D Gizmo Compass & Viewport Controls (Top Right Overlay) */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-20">
          <div className="bg-[#161b22]/90 backdrop-blur border border-[#30363d] p-1.5 rounded flex flex-col items-center gap-1 shadow-lg">
            <div className="w-12 h-12 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 50 50">
                <line x1="25" y1="25" x2="42" y2="25" stroke="#f43f5e" strokeWidth="2" />
                <text x="44" y="27" fill="#f43f5e" fontFamily="monospace" fontSize="8">
                  X
                </text>
                <line x1="25" y1="25" x2="25" y2="8" stroke="#10b981" strokeWidth="2" />
                <text x="23" y="6" fill="#10b981" fontFamily="monospace" fontSize="8">
                  Y
                </text>
                <line x1="25" y1="25" x2="12" y2="38" stroke="#38bdf8" strokeWidth="2" />
                <text x="7" y="42" fill="#38bdf8" fontFamily="monospace" fontSize="8">
                  Z
                </text>
                <circle cx="25" cy="25" r="3" fill="#ffffff" />
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-1 w-full text-center text-[9px] font-mono">
              <button
                onClick={() => {
                  setCameraAngle('top');
                  showToast('カメラ視点を「TOP (直交上面視)」に切り替えました');
                }}
                className={`px-1 py-0.5 rounded transition-colors ${
                  cameraAngle === 'top'
                    ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                    : 'bg-[#21262d] hover:bg-[#2d333b] text-[#8b949e]'
                }`}
              >
                TOP
              </button>
              <button
                onClick={() => {
                  setCameraAngle('iso');
                  showToast('カメラ視点を「ISO (3D斜めパース)」に切り替えました');
                }}
                className={`px-1 py-0.5 rounded transition-colors ${
                  cameraAngle === 'iso'
                    ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                    : 'bg-[#21262d] hover:bg-[#2d333b] text-[#8b949e]'
                }`}
              >
                ISO
              </button>
            </div>
          </div>

          {/* Vertical Viewport Toolstrip */}
          <div className="bg-[#161b22]/90 backdrop-blur border border-[#30363d] p-1 rounded flex flex-col gap-1 text-[#8b949e] shadow-lg">
            <button
              onClick={() => {
                const nextState = !isIpOverlayVisible;
                setIsIpOverlayVisible(nextState);
                showToast(`IP点ドラッグハンドルを${nextState ? '表示' : '非表示'}にしました`);
              }}
              className={`p-1 rounded transition-colors ${
                isIpOverlayVisible
                  ? 'text-[#38bdf8] bg-[#38bdf8]/20 border border-[#38bdf8]/40'
                  : 'hover:text-[#f0f6fc] hover:bg-[#2d333b]'
              }`}
              title="IPドラッグハンドル表示切替 (Intersection Points)"
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onSeekStation(15200);
                showToast('回廊中心測点 STA. 15+200 へフォーカスしました');
              }}
              className="p-1 hover:text-[#f0f6fc] hover:bg-[#2d333b] rounded transition-colors"
              title="Fit to Corridor"
            >
              <Focus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const nextState = !isEarthworkMeshVisible;
                setIsEarthworkMeshVisible(nextState);
                showToast(`土量3Dボリュメトリックメッシュ表示を${nextState ? '有効化' : '非表示'}にしました`);
              }}
              className={`p-1 rounded transition-colors ${
                isEarthworkMeshVisible
                  ? 'text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/30'
                  : 'hover:text-[#f0f6fc] hover:bg-[#2d333b]'
              }`}
              title="Toggle Volumetric Earthwork Mesh"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const nextState = !isCutawayActive;
                setIsCutawayActive(nextState);
                showToast(`断面切断プレーン (Cutaway) を${nextState ? '有効化' : '無効化'}にしました`);
              }}
              className={`p-1 rounded transition-colors ${
                isCutawayActive
                  ? 'text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30'
                  : 'hover:text-[#f0f6fc] hover:bg-[#2d333b]'
              }`}
              title="Cutaway Cross Section Plane"
            >
              <Scissors className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (onSwitchStudio) {
                  onSwitchStudio('walkthrough');
                } else {
                  showToast('ドライビング視界スタジオへ遷移します');
                }
              }}
              className="p-1 hover:text-[#f0f6fc] hover:bg-[#2d333b] rounded transition-colors"
              title="Drive-through POV Walk"
            >
              <Car className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const nextState = !isSunStudyActive;
                setIsSunStudyActive(nextState);
                showToast(`日影・日照シミュレーション (Solar Study) を${nextState ? '開始' : '停止'}しました`);
              }}
              className={`p-1 rounded transition-colors ${
                isSunStudyActive
                  ? 'text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/30 animate-pulse'
                  : 'hover:text-[#f0f6fc] hover:bg-[#2d333b]'
              }`}
              title="Sun Shadow Solar Study"
            >
              <Sun className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-[#30363d] my-0.5" />
            <button
              onClick={() => {
                const nextState = !isHudVisible;
                setIsHudVisible(nextState);
                showToast(nextState ? 'HUDオーバーレイを表示しました' : 'ZENモード: 全HUDを非表示にしました');
              }}
              className={`p-1 rounded transition-colors ${
                !isHudVisible
                  ? 'text-[#38bdf8] bg-[#38bdf8]/20 border border-[#38bdf8]/40'
                  : 'hover:text-[#f0f6fc] hover:bg-[#2d333b]'
              }`}
              title={isHudVisible ? 'ZENモード: HUDを隠して全画面表示' : 'HUDを再表示'}
            >
              {isHudVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-[#38bdf8]" />}
            </button>
          </div>
        </div>

        {/* Viewport Overlay Indicators for Active Modes */}
        <div className="absolute top-16 right-3 flex flex-col items-end gap-1.5 z-20 pointer-events-none">
          {cameraAngle === 'top' && (
            <div className="bg-[#161b22]/90 border border-[#38bdf8] text-[#38bdf8] text-[9px] font-mono px-2 py-0.5 rounded shadow">
              視点: 直交平面正射 (TOP VIEW)
            </div>
          )}
          {isCutawayActive && (
            <div className="bg-[#161b22]/90 border border-[#f59e0b] text-[#f59e0b] text-[9px] font-mono px-2 py-0.5 rounded shadow">
              横断切断クリッピングプレーン展開中
            </div>
          )}
          {isSunStudyActive && (
            <div className="bg-[#161b22]/90 border border-[#fbbf24] text-[#fbbf24] text-[9px] font-mono px-2 py-0.5 rounded shadow">
              日影角シミュレーション稼働中 (夏至 12:00)
            </div>
          )}
        </div>

        {/* Interactive Toast Notification */}
        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#161b22] border border-[#38bdf8] text-[#38bdf8] px-3 py-1.5 rounded-lg shadow-2xl text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-[#10b981]" />
            <span>{notification}</span>
          </div>
        )}

        {/* =================================================================== */}
        {/* STREAMLINED SMART HUD PILL BAR (MINIMAL & NON-INTRUSIVE)           */}
        {/* =================================================================== */}
        {isHudVisible && (
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-auto">
            {/* Top Minimal Pill Bar */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
              {/* Earthwork Pill */}
              <button
                onClick={() => setActiveHudPill(activeHudPill === 'earthwork' ? null : 'earthwork')}
                className={`px-2.5 py-1 rounded-full backdrop-blur border flex items-center gap-1.5 transition-all shadow-md ${
                  activeHudPill === 'earthwork'
                    ? 'bg-[#161b22] border-[#38bdf8] text-[#38bdf8] ring-1 ring-[#38bdf8]'
                    : 'bg-[#0d1117]/85 border-[#30363d] text-[#f0f6fc] hover:border-[#8b949e]'
                }`}
              >
                <Scale className="w-3 h-3 text-[#38bdf8]" />
                <span>土量:</span>
                <strong className="text-[#10b981]">{currentPlan.balanceVolume >= 0 ? `+${currentPlan.balanceVolume}` : currentPlan.balanceVolume}m³</strong>
                <span className="text-[9px] text-[#8b949e]">(97.1%)</span>
                {activeHudPill === 'earthwork' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Station & Slope Pill */}
              <button
                onClick={() => setActiveHudPill(activeHudPill === 'station' ? null : 'station')}
                className={`px-2.5 py-1 rounded-full backdrop-blur border flex items-center gap-1.5 transition-all shadow-md ${
                  activeHudPill === 'station'
                    ? 'bg-[#161b22] border-[#10b981] text-[#10b981] ring-1 ring-[#10b981]'
                    : 'bg-[#0d1117]/85 border-[#30363d] text-[#f0f6fc] hover:border-[#8b949e]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                <span>{stationFormatted}</span>
                <span className="text-[#8b949e]">|</span>
                <span>i={currentPlan.gradientPercent > 0 ? `+${currentPlan.gradientPercent.toFixed(1)}` : currentPlan.gradientPercent.toFixed(1)}%</span>
                {activeHudPill === 'station' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Bridge Spec Pill */}
              <button
                onClick={() => setActiveHudPill(activeHudPill === 'bridge' ? null : 'bridge')}
                className={`px-2.5 py-1 rounded-full backdrop-blur border flex items-center gap-1.5 transition-all shadow-md ${
                  activeHudPill === 'bridge'
                    ? 'bg-[#161b22] border-[#38bdf8] text-[#38bdf8] ring-1 ring-[#38bdf8]'
                    : 'bg-[#0d1117]/85 border-[#30363d] text-[#f0f6fc] hover:border-[#8b949e]'
                }`}
              >
                <Video className="w-3 h-3 text-[#38bdf8]" />
                <span>緑川橋 L=250m</span>
                <span className="text-[9px] text-[#10b981] bg-[#10b981]/15 px-1 rounded">OK</span>
                {activeHudPill === 'bridge' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Curve / Tunnel Pill */}
              <button
                onClick={() => setActiveHudPill(activeHudPill === 'curve' ? null : 'curve')}
                className={`px-2.5 py-1 rounded-full backdrop-blur border flex items-center gap-1.5 transition-all shadow-md ${
                  activeHudPill === 'curve'
                    ? 'bg-[#161b22] border-[#f59e0b] text-[#f59e0b] ring-1 ring-[#f59e0b]'
                    : 'bg-[#0d1117]/85 border-[#30363d] text-[#f0f6fc] hover:border-[#8b949e]'
                }`}
              >
                <Mountain className="w-3 h-3 text-[#f59e0b]" />
                <span>R={currentPlan.curveRadius.toFixed(0)}m / A=110</span>
                {activeHudPill === 'curve' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Expandable Detail Card (Only appears when a pill is clicked) */}
            {activeHudPill === 'earthwork' && (
              <div className="bg-[#161b22]/95 backdrop-blur border border-[#38bdf8]/50 p-2.5 rounded-lg shadow-2xl w-64 text-[10px] font-mono space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-1">
                  <span className="text-[#f0f6fc] font-bold">土量収支詳細内訳</span>
                  <button onClick={() => setActiveHudPill(null)} className="text-[#8b949e] hover:text-[#f0f6fc] text-xs">✕</button>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">切土 (Cut):</span>
                  <strong className="text-[#f43f5e]">{currentPlan.cutVolume.toLocaleString()} m³</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">盛土 (Fill):</span>
                  <strong className="text-[#10b981]">{currentPlan.fillVolume.toLocaleString()} m³</strong>
                </div>
                <div className="flex justify-between border-t border-[#30363d] pt-1">
                  <span className="text-[#8b949e]">場内流用率:</span>
                  <strong className="text-[#38bdf8]">97.1% (残土ゼロ設計)</strong>
                </div>
              </div>
            )}

            {activeHudPill === 'station' && (
              <div className="bg-[#161b22]/95 backdrop-blur border border-[#10b981]/50 p-2.5 rounded-lg shadow-2xl w-60 text-[10px] font-mono space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-1">
                  <span className="text-[#f0f6fc] font-bold">測点勾配センサー</span>
                  <button onClick={() => setActiveHudPill(null)} className="text-[#8b949e] hover:text-[#f0f6fc] text-xs">✕</button>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">測点:</span>
                  <strong className="text-[#f0f6fc]">{stationFormatted}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">縦断勾配:</span>
                  <strong className="text-[#10b981]">i = {currentPlan.gradientPercent > 0 ? `+${currentPlan.gradientPercent.toFixed(2)}` : currentPlan.gradientPercent.toFixed(2)}% (令規格 ≤5.0%)</strong>
                </div>
                <div className="w-full bg-[#21262d] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#10b981]" style={{ width: `${Math.min(currentPlan.gradientPercent * 18, 100)}%` }} />
                </div>
              </div>
            )}

            {activeHudPill === 'bridge' && (
              <div className="bg-[#161b22]/95 backdrop-blur border border-[#38bdf8]/50 p-2.5 rounded-lg shadow-2xl w-64 text-[10px] font-mono space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-1">
                  <span className="text-[#f0f6fc] font-bold">緑川渡河橋梁 仕様</span>
                  <button onClick={() => setActiveHudPill(null)} className="text-[#8b949e] hover:text-[#f0f6fc] text-xs">✕</button>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">形式:</span>
                  <strong className="text-[#f0f6fc]">5径間連続鋼床版箱桁</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">桁下余裕高:</span>
                  <strong className="text-[#10b981]">{currentPlan.riverFreeboardM.toFixed(2)}m (基準 +{(currentPlan.riverFreeboardM - 1.5).toFixed(2)}m)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">河道流下阻害率:</span>
                  <strong className="text-[#10b981]">{currentPlan.riverObstructionRatePercent}% (&lt; 5.0%)</strong>
                </div>
              </div>
            )}

            {activeHudPill === 'curve' && (
              <div className="bg-[#161b22]/95 backdrop-blur border border-[#f59e0b]/50 p-2.5 rounded-lg shadow-2xl w-64 text-[10px] font-mono space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-1">
                  <span className="text-[#f0f6fc] font-bold">幾何曲線諸元 & 離隔</span>
                  <button onClick={() => setActiveHudPill(null)} className="text-[#8b949e] hover:text-[#f0f6fc] text-xs">✕</button>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">曲線半径 R:</span>
                  <strong className="text-[#10b981]">{currentPlan.curveRadius.toFixed(1)}m (PASS)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">緩和曲線 A:</span>
                  <strong className="text-[#f0f6fc]">A = 110.0 (Clothoid)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">建物離隔 (S邸):</span>
                  <strong className="text-[#10b981]">{currentPlan.sBuildingClearanceM.toFixed(2)}m (&gt; 5.0m クリア)</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
