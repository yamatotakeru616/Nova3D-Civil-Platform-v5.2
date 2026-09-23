import React from 'react';
import { Sliders, Maximize2, ShieldCheck, Ruler } from 'lucide-react';
import { StandardAssembly } from '../../types';

interface AdvancedCrossSectionViewProps {
  assembly: StandardAssembly;
  stationStr: string;
  pileNumber: string;
  currentStationM: number;
  designElevationM: number;
  groundElevationM: number;
  cutOrFillHeightM: number;
  superelevationPercent: number;
  cutAreaM2: number;
  fillAreaM2: number;
  onUpdateAssembly?: (key: keyof StandardAssembly, val: number) => void;
}

export const AdvancedCrossSectionView: React.FC<AdvancedCrossSectionViewProps> = ({
  assembly,
  stationStr,
  pileNumber,
  currentStationM,
  designElevationM,
  groundElevationM,
  cutOrFillHeightM,
  superelevationPercent,
  cutAreaM2,
  fillAreaM2,
}) => {
  const isCut = cutOrFillHeightM < 0;
  const isFill = cutOrFillHeightM > 0;

  // Layer Thickness Constants in SVG Scale
  const surfaceThickness = 4; // 表層 t=50mm
  const baseThickness = 7;    // 上層路盤 t=150mm
  const subbaseThickness = 9; // 下層路盤 t=200mm
  const totalPavementH = surfaceThickness + baseThickness + subbaseThickness;

  const laneHalfW = (assembly.laneWidth || 3.25) * 14;
  const shoulderWidthVal =
    (assembly as any).shoulderWidth ??
    assembly.leftShoulderWidth ??
    assembly.rightShoulderWidth ??
    1.75;
  const shoulderW = shoulderWidthVal * 14;
  const sidewalkW = (assembly.sidewalkWidth || 2.0) * 14;
  const roadHalfW = laneHalfW + shoulderW;

  const centerCX = 210;
  const roadSurfaceY = 95;

  // Superelevation rotation (Cant in degrees)
  const cantDeg = (superelevationPercent - 2.0) * 1.1;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#090d13] overflow-hidden select-none font-mono text-[10px]">
      {/* Header Info Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d1117]/90 border-b border-[#30363d] text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-ping" />
          <span className="text-[#f0f6fc] font-bold">
            横断スライサー ({stationStr} / {pileNumber})
          </span>
          <span className="text-[#6e7681]">|</span>
          <span className="text-[10px] text-[#38bdf8]">
            STA.{(currentStationM / 1000).toFixed(0)}+{(currentStationM % 1000).toFixed(1).padStart(5, '0')}
          </span>
        </div>

        {/* Realtime Quantities & Cant Badges */}
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="text-[#8b949e]">片勾配:</span>
          <span className="text-[#a855f7] font-bold bg-[#a855f7]/15 px-1.5 py-0.5 rounded border border-[#a855f7]/30">
            {superelevationPercent.toFixed(1)}% (CANT)
          </span>
          <span className="text-[#8b949e]">全幅員:</span>
          <span className="text-[#38bdf8] font-bold">
            W={((assembly.laneWidth + assembly.shoulderWidth + assembly.sidewalkWidth) * 2).toFixed(2)}m
          </span>
        </div>
      </div>

      {/* Cross-Section Graphic SVG Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-2">
        <svg className="w-full h-full max-h-56" viewBox="0 0 420 180">
          <defs>
            {/* Pavement multi-layer pattern */}
            <linearGradient id="asphaltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2d333b" />
              <stop offset="100%" stopColor="#1e2228" />
            </linearGradient>
            <linearGradient id="baseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#484f58" />
              <stop offset="100%" stopColor="#30363d" />
            </linearGradient>
          </defs>

          {/* Natural Ground Line GL (Dashed Gray) */}
          <path
            d="M 15,115 Q 120,108 210,100 T 405,82"
            fill="none"
            stroke="#6e7681"
            strokeDasharray="4,3"
            strokeWidth="1.4"
          />
          <text x="365" y="78" fill="#6e7681" fontSize="7">現況地盤 GL</text>

          {/* Left Cut Slope & Berms (切土法面 1:1.2 + 犬走り小段) */}
          {isCut && (
            <g>
              <polygon
                points={`
                  ${centerCX - roadHalfW - sidewalkW - 35},${roadSurfaceY - 45}
                  ${centerCX - roadHalfW - sidewalkW - 25},${roadSurfaceY - 30}
                  ${centerCX - roadHalfW - sidewalkW - 12},${roadSurfaceY - 30}
                  ${centerCX - roadHalfW - sidewalkW},${roadSurfaceY - 4}
                  ${centerCX - roadHalfW - sidewalkW},115
                  ${centerCX - roadHalfW - sidewalkW - 35},115
                `}
                fill="rgba(244,63,94,0.2)"
              />
              <polyline
                points={`
                  ${centerCX - roadHalfW - sidewalkW - 35},${roadSurfaceY - 45}
                  ${centerCX - roadHalfW - sidewalkW - 25},${roadSurfaceY - 30}
                  ${centerCX - roadHalfW - sidewalkW - 12},${roadSurfaceY - 30}
                  ${centerCX - roadHalfW - sidewalkW},${roadSurfaceY - 4}
                `}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.2"
              />
              {/* U-type Side Ditch (U型側溝 300x300) */}
              <rect
                x={centerCX - roadHalfW - sidewalkW - 6}
                y={roadSurfaceY - 4}
                width="6"
                height="8"
                fill="#21262d"
                stroke="#8b949e"
                strokeWidth="1"
              />
            </g>
          )}

          {/* Right Fill Embankment Slope (盛土法面 1:1.8) */}
          {isFill && (
            <g>
              <polygon
                points={`
                  ${centerCX + roadHalfW + sidewalkW},${roadSurfaceY - 2}
                  ${centerCX + roadHalfW + sidewalkW + 42},${roadSurfaceY + 45}
                  ${centerCX + roadHalfW + sidewalkW},${roadSurfaceY + 45}
                `}
                fill="rgba(16,185,129,0.2)"
              />
              <line
                x1={centerCX + roadHalfW + sidewalkW}
                y1={roadSurfaceY - 2}
                x2={centerCX + roadHalfW + sidewalkW + 42}
                y2={roadSurfaceY + 45}
                stroke="#10b981"
                strokeWidth="2.2"
              />
            </g>
          )}

          {/* Rotated Road Assembly with Cant Rotation */}
          <g transform={`rotate(${cantDeg}, ${centerCX}, ${roadSurfaceY})`}>
            {/* Layer 3: Subbase (下層路盤 t=200mm) */}
            <rect
              x={centerCX - roadHalfW}
              y={roadSurfaceY + surfaceThickness + baseThickness}
              width={roadHalfW * 2}
              height={subbaseThickness}
              fill="#21262d"
              stroke="#30363d"
              strokeWidth="0.8"
            />

            {/* Layer 2: Base Course (上層路盤 t=150mm) */}
            <rect
              x={centerCX - roadHalfW}
              y={roadSurfaceY + surfaceThickness}
              width={roadHalfW * 2}
              height={baseThickness}
              fill="url(#baseGrad)"
              stroke="#484f58"
              strokeWidth="0.8"
            />

            {/* Layer 1: Surface Asphalt Course (表層 t=50mm) */}
            <rect
              x={centerCX - roadHalfW}
              y={roadSurfaceY}
              width={roadHalfW * 2}
              height={surfaceThickness}
              fill="url(#asphaltGrad)"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />

            {/* Centerline White Stripe Marker */}
            <line
              x1={centerCX}
              y1={roadSurfaceY - 1}
              x2={centerCX}
              y2={roadSurfaceY + 1}
              stroke="#ffffff"
              strokeWidth="2"
            />

            {/* Left Shoulder & Sidewalk */}
            <rect
              x={centerCX - roadHalfW - sidewalkW}
              y={roadSurfaceY - 3}
              width={sidewalkW}
              height={6}
              fill="#161b22"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* Right Shoulder & Sidewalk */}
            <rect
              x={centerCX + roadHalfW}
              y={roadSurfaceY - 3}
              width={sidewalkW}
              height={6}
              fill="#161b22"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* Guardrails (W-beam) */}
            <line
              x1={centerCX - roadHalfW}
              y1={roadSurfaceY - 12}
              x2={centerCX - roadHalfW}
              y2={roadSurfaceY}
              stroke="#bdc8d1"
              strokeWidth="1.5"
            />
            <circle cx={centerCX - roadHalfW} cy={roadSurfaceY - 12} r="2" fill="#bdc8d1" />

            <line
              x1={centerCX + roadHalfW}
              y1={roadSurfaceY - 12}
              x2={centerCX + roadHalfW}
              y2={roadSurfaceY}
              stroke="#bdc8d1"
              strokeWidth="1.5"
            />
            <circle cx={centerCX + roadHalfW} cy={roadSurfaceY - 12} r="2" fill="#bdc8d1" />
          </g>

          {/* Dimension Lines (CAD製図基準引出線) */}
          <g opacity="0.85">
            {/* Centerline Dimension Arrow */}
            <line x1={centerCX} y1="35" x2={centerCX} y2={roadSurfaceY - 8} stroke="#f43f5e" strokeDasharray="3,2" strokeWidth="1" />
            <text x={centerCX - 12} y="32" fill="#f43f5e" fontSize="7.5" fontWeight="bold">CL</text>

            {/* Carriageway Width Dimension Bar */}
            <line x1={centerCX - laneHalfW} y1="48" x2={centerCX + laneHalfW} y2="48" stroke="#38bdf8" strokeWidth="1" />
            <line x1={centerCX - laneHalfW} y1="44" x2={centerCX - laneHalfW} y2="52" stroke="#38bdf8" strokeWidth="1" />
            <line x1={centerCX + laneHalfW} y1="44" x2={centerCX + laneHalfW} y2="52" stroke="#38bdf8" strokeWidth="1" />
            <text x={centerCX - 28} y="44" fill="#38bdf8" fontSize="7.5" fontWeight="bold">
              車道幅員 2×{assembly.laneWidth}m = {(assembly.laneWidth * 2).toFixed(2)}m
            </text>

            {/* Sidewalk Width Callout */}
            <line x1={centerCX - roadHalfW - sidewalkW} y1="62" x2={centerCX - roadHalfW} y2="62" stroke="#94a3b8" strokeWidth="0.8" />
            <text x={centerCX - roadHalfW - sidewalkW + 4} y="58" fill="#94a3b8" fontSize="7">
              歩道 {assembly.sidewalkWidth}m
            </text>
          </g>

          {/* Pavement Layer Annotation Callout Box */}
          <g transform="translate(18, 140)">
            <rect width="135" height="34" rx="2" fill="#0d1117" stroke="#30363d" strokeWidth="1" />
            <text x="6" y="10" fill="#38bdf8" fontSize="7" fontWeight="bold">■ 舗装構成 (標準設計):</text>
            <text x="6" y="19" fill="#8b949e" fontSize="6.5">① アスファルト表層 (t=50mm)</text>
            <text x="6" y="27" fill="#8b949e" fontSize="6.5">② 粒度調整砕石路盤 (t=350mm)</text>
          </g>
        </svg>
      </div>

      {/* Quantities & Earthwork Balance Footer Bar */}
      <div className="grid grid-cols-4 gap-2 bg-[#161b22] px-3 py-1.5 border-t border-[#30363d] text-[10px]">
        <div>
          <span className="text-[#8b949e]">切土断面積:</span>{' '}
          <strong className="text-[#f43f5e]">{cutAreaM2.toFixed(1)} m²</strong>
        </div>
        <div>
          <span className="text-[#8b949e]">盛土断面積:</span>{' '}
          <strong className="text-[#10b981]">{fillAreaM2.toFixed(1)} m²</strong>
        </div>
        <div>
          <span className="text-[#8b949e]">計画高 FH:</span>{' '}
          <strong className="text-[#38bdf8]">{designElevationM.toFixed(2)} m</strong>
        </div>
        <div>
          <span className="text-[#8b949e]">切盛高 Δh:</span>{' '}
          <strong className={cutOrFillHeightM < 0 ? 'text-[#f43f5e]' : 'text-[#10b981]'}>
            {cutOrFillHeightM > 0 ? `+${cutOrFillHeightM.toFixed(2)}` : cutOrFillHeightM.toFixed(2)} m
          </strong>
        </div>
      </div>
    </div>
  );
};
