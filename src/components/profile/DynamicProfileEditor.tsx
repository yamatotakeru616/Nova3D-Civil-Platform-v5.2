import React, { useRef, useState } from 'react';
import { Layers, AlertTriangle, CheckCircle2, Sliders, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { VPI, StandardParameters } from '../../types';

interface DynamicProfileEditorProps {
  vpis: VPI[];
  standard: StandardParameters;
  currentStationM: number;
  roadLengthM?: number;
  dynamicProfilePaths: {
    groundPath: string;
    designPath: string;
    cutHatchPath: string;
    fillHatchPath: string;
  };
  onSelectVpi?: (id: string) => void;
  onMoveVpi: (id: string, elevationM: number) => void;
  onSeekStation: (stationM: number) => void;
  activeVpiId?: string | null;
}

export const DynamicProfileEditor: React.FC<DynamicProfileEditorProps> = ({
  vpis,
  standard,
  currentStationM,
  roadLengthM = 2440,
  dynamicProfilePaths,
  onSelectVpi,
  onMoveVpi,
  onSeekStation,
  activeVpiId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingVpiId, setDraggingVpiId] = useState<string | null>(null);

  // VPI-02 Target
  const vpi2 = vpis.find((v) => v.id === 'VPI-02') || { elevationM: 64.98, gradeInPercent: 2.34, gradeOutPercent: -1.82 };

  // Handle SVG Click to Seek Station
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingVpiId) return;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeekStation(Math.round(ratio * roadLengthM));
  };

  // Convert client Y to Elevation M (Range: 45m to 95m, SVG Y: 100 to 20)
  const clientYToElevation = (clientY: number): number | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const svgY = ((clientY - rect.top) / rect.height) * 130;
    // Y=25 -> 85m, Y=105 -> 45m
    const t = 1 - Math.max(0, Math.min(1, (svgY - 20) / 85));
    const elev = 45.0 + t * 40.0;
    return Math.round(elev * 10) / 10;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingVpiId) {
      const newElev = clientYToElevation(e.clientY);
      if (newElev !== null) {
        onMoveVpi(draggingVpiId, Math.max(45, Math.min(95, newElev)));
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingVpiId(null);
  };

  return (
    <div
      className="relative w-full h-full flex flex-col bg-[#090d13] overflow-hidden select-none font-mono text-[10px]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Profile Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d1117]/90 border-b border-[#30363d] text-xs">
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span className="text-[#f0f6fc] font-bold">縦断プロファイル (PROFILE & VPI ENGINE)</span>
          <span className="text-[#6e7681]">|</span>
          <span className="text-[10px] text-[#8b949e]">H 1:1000 / V 1:200 (Z 5.0x 強調)</span>
        </div>

        {/* VPI Quick Elevation Tweaker */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
            <span className="text-[#8b949e]">VPI-02 標高 FH:</span>
            <button
              onClick={() => onMoveVpi('VPI-02', Math.max(45, vpi2.elevationM - 0.5))}
              className="px-1.5 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded text-[9px]"
              title="VPI-02 標高 -0.5m"
            >
              -0.5m
            </button>
            <span className="text-[#38bdf8] font-bold">{vpi2.elevationM.toFixed(2)}m</span>
            <button
              onClick={() => onMoveVpi('VPI-02', Math.min(95, vpi2.elevationM + 0.5))}
              className="px-1.5 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded text-[9px]"
              title="VPI-02 標高 +0.5m"
            >
              +0.5m
            </button>
          </div>

          <div
            className={`flex items-center space-x-1 px-2 py-0.5 rounded border ${
              Math.abs(vpi2.gradeInPercent) <= standard.maxGradePercent
                ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
                : 'bg-[#f43f5e]/15 text-[#f43f5e] border-[#f43f5e]/40'
            }`}
          >
            {Math.abs(vpi2.gradeInPercent) <= standard.maxGradePercent ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            <span>令第20条 勾配 {Math.abs(vpi2.gradeInPercent).toFixed(1)}% (限界±5.0%)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas for Vertical Profile */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="none"
          viewBox="0 0 700 130"
          onClick={handleSvgClick}
        >
          {/* Background Grid & Elevation Datum Lines */}
          <line x1="0" y1="25" x2="700" y2="25" stroke="#161b22" strokeWidth="1" />
          <line x1="0" y1="55" x2="700" y2="55" stroke="#161b22" strokeWidth="1" />
          <line x1="0" y1="85" x2="700" y2="85" stroke="#161b22" strokeWidth="1" />
          <line x1="0" y1="115" x2="700" y2="115" stroke="#21262d" strokeWidth="1.2" />

          {/* Station Vertical Grid Lines */}
          {[0, 100, 200, 300, 400, 500, 600, 700].map((gx, idx) => (
            <line key={idx} x1={gx} y1="0" x2={gx} y2="130" stroke="#161b22" strokeWidth="1" />
          ))}

          {/* Ground Line GL (Dashed Gray) */}
          <path
            d={dynamicProfilePaths.groundPath}
            fill="none"
            stroke="#6e7681"
            strokeDasharray="4,3"
            strokeWidth="1.6"
          />

          {/* Cut Hatch Area (Rose Tint) */}
          <path d={dynamicProfilePaths.cutHatchPath} fill="rgba(244,63,94,0.3)" />

          {/* Fill Hatch Area (Green Tint) */}
          <path d={dynamicProfilePaths.fillHatchPath} fill="rgba(16,185,129,0.3)" />

          {/* Design Grade Line FH with Vertical Curve Arc (Cyan Solid) */}
          <path
            d={dynamicProfilePaths.designPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.4"
          />

          {/* Dynamic VPI Tangents & Parabolic Curve Indicator */}
          {vpis.map((vpi) => {
            const ratio = vpi.stationM / roadLengthM;
            const vx = Math.round(ratio * 700);
            // Elevation mapping to SVG Y
            const vy = Math.round(115 - ((vpi.elevationM - 45) / 40) * 85);
            const isSelected = vpi.id === activeVpiId;

            return (
              <g
                key={vpi.id}
                className="cursor-ns-resize group"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingVpiId(vpi.id);
                  if (onSelectVpi) onSelectVpi(vpi.id);
                }}
              >
                {/* Parabolic Crest/Sag Radius Envelope */}
                <circle
                  cx={vx}
                  cy={vy}
                  r="14"
                  fill="none"
                  stroke="#38bdf8"
                  strokeDasharray="2,2"
                  strokeWidth="0.8"
                  opacity="0.6"
                />

                {/* VPI Center Node */}
                <circle
                  cx={vx}
                  cy={vy}
                  r={isSelected ? '5.5' : '4'}
                  fill={isSelected ? '#f43f5e' : '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="group-hover:scale-150 transition-transform"
                />

                {/* Vertical Elevation Callout Flag */}
                <rect
                  x={vx - 28}
                  y={vy - 20}
                  width="56"
                  height="14"
                  rx="2"
                  fill="#0d1117"
                  stroke={isSelected ? '#f43f5e' : '#30363d'}
                  strokeWidth="1"
                />
                <text
                  x={vx}
                  y={vy - 10}
                  fill={isSelected ? '#f43f5e' : '#38bdf8'}
                  fontSize="7.5"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {vpi.id} {vpi.elevationM.toFixed(1)}m
                </text>
              </g>
            );
          })}

          {/* Synchronized Four-View Station Scan Laser */}
          {(() => {
            const needleX = Math.round((currentStationM / roadLengthM) * 700);
            return (
              <g className="filter drop-shadow-[0_0_8px_rgba(244,63,94,0.95)]">
                <line x1={needleX} y1="0" x2={needleX} y2="120" stroke="#f43f5e" strokeWidth="2.2" />
                <polygon
                  points={`${needleX - 5},0 ${needleX + 5},0 ${needleX},8`}
                  fill="#f43f5e"
                />
                <rect
                  x={needleX + 4}
                  y="4"
                  width="64"
                  height="12"
                  rx="2"
                  fill="#0d1117"
                  stroke="#f43f5e"
                  strokeWidth="1"
                />
                <text x={needleX + 8} y="13" fill="#f43f5e" fontSize="7" fontWeight="bold">
                  STA.{(currentStationM / 1000).toFixed(0)}+{(currentStationM % 1000).toFixed(0).padStart(4, '0')}
                </text>
              </g>
            );
          })()}

          {/* Datum Elevation Band Labels (DL Band) */}
          <text x="6" y="24" fill="#6e7681" fontSize="7">DL +85.0m</text>
          <text x="6" y="54" fill="#6e7681" fontSize="7">DL +65.0m</text>
          <text x="6" y="84" fill="#6e7681" fontSize="7">DL +45.0m</text>
        </svg>

        {/* Legend Box at Bottom Right */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-3 bg-[#0d1117]/85 backdrop-blur px-2.5 py-1 rounded border border-[#30363d] text-[9px]">
          <div className="flex items-center space-x-1">
            <span className="w-3 h-0.5 bg-[#38bdf8]" />
            <span className="text-[#38bdf8]">計画路面 (FH)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-0.5 bg-[#6e7681] border-b border-dashed border-[#6e7681]" />
            <span className="text-[#8b949e]">現況地盤 (GL)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-[#f43f5e]/30 border border-[#f43f5e]" />
            <span className="text-[#f43f5e]">切土部</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-[#10b981]/30 border border-[#10b981]" />
            <span className="text-[#10b981]">盛土部</span>
          </div>
        </div>
      </div>
    </div>
  );
};
