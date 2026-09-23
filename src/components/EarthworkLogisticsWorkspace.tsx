import React, { useState } from 'react';
import { useEarthworkLogistics } from '../hooks/useEarthworkLogistics';
import {
  Truck,
  Layers,
  TrendingDown,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Leaf,
  Activity,
  Download,
  Copy,
  Sliders,
  Maximize2,
  RefreshCw,
  Compass,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { CivilProject } from '../types';
import { ConstructionDxModal } from './ConstructionDxModal';
import { getActiveMachineryFleet } from '../utils/constructionDxGenerator';

interface EarthworkLogisticsWorkspaceProps {
  activeProject?: CivilProject;
}

export const EarthworkLogisticsWorkspace: React.FC<EarthworkLogisticsWorkspaceProps> = ({ activeProject }) => {
  const {
    zones,
    stockyards,
    dumpFleetCount,
    setDumpFleetCount,
    useEvDumpTrucks,
    setUseEvDumpTrucks,
    activeTab,
    setActiveTab,
    boringLogs,
    totalCutM3,
    totalFillM3,
    netBalanceM3,
    transportOptimization,
    auditItems,
    generateLogisticsCsv,
    generateEarthworkLandXml,
    applyNetZeroEarthwork,
  } = useEarthworkLogistics();

  const [exportModal, setExportModal] = useState<'none' | 'csv' | 'xml'>('none');
  const [isConstructionDxOpen, setIsConstructionDxOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedBoringId, setSelectedBoringId] = useState<string>('BV-02');
  const [isBalancedApplied, setIsBalancedApplied] = useState(false);

  const selectedBoring = boringLogs.find((b) => b.id === selectedBoringId) || boringLogs[1];

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const handleApplyNetZero = () => {
    if (!isBalancedApplied) {
      applyNetZeroEarthwork();
      setIsBalancedApplied(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#090d13] text-[#f0f6fc] overflow-hidden select-none font-mono">
      {/* 1. トップサブヘッダー */}
      <div className="h-10 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded border border-[#38bdf8]/30">
            <Truck className="w-3.5 h-3.5" />
            EARTHWORK & LOGISTICS
          </span>
          <span className="text-[#8b949e]">
            全線 STA.0+000〜STA.24+500 // 土工マスカーブ最適配分・ダンプ運搬LP・3D地盤ボーリング透視
          </span>
        </div>

        {/* タブ切り替え & エクスポートボタン */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex bg-[#161b22] p-0.5 rounded border border-[#30363d]">
            <button
              onClick={() => setActiveTab('logistics')}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'logistics'
                  ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>ダンプ運行マスカーブ</span>
            </button>
            <button
              onClick={() => setActiveTab('geotech')}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'geotech'
                  ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D地盤ボーリング柱状図</span>
            </button>
          </div>

          <button
            onClick={() => setExportModal('csv')}
            className="bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>配分計画 CSV</span>
          </button>
          <button
            onClick={() => setExportModal('xml')}
            className="bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#a855f7] border border-[#a855f7]/40 px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>LandXML 1.2</span>
          </button>
          <button
            onClick={() => setIsConstructionDxOpen(true)}
            className="bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 px-2.5 py-1 rounded flex items-center gap-1 font-bold transition-colors shadow-sm"
            title="国交省 i-Construction 2.0 出来形検測・ICT建機3D面・CO2算定"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>建設DX (i-Con 2.0 / CO2)</span>
          </button>
        </div>
      </div>

      {/* 2. メイン3ペインレイアウト */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左ペイン: 土工収支・フリート設定 */}
        <div className="w-80 bg-[#0d1117] border-r border-[#21262d] flex flex-col p-3 overflow-y-auto shrink-0 gap-3 text-xs">
          {/* 土量マスバランスカード */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
                全線土量マスバランス
              </span>
              <span className="text-[10px] bg-[#38bdf8]/10 text-[#38bdf8] px-1.5 py-0.5 rounded">
                Bruckner Mass
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-[#090d13] p-2 rounded border border-[#21262d]">
                <div className="text-[10px] text-[#8b949e]">切土・残土総量</div>
                <div className="text-base font-bold text-[#f43f5e] mt-0.5">
                  {(totalCutM3 / 10000).toFixed(1)} <span className="text-xs">万m³</span>
                </div>
                <div className="text-[9px] text-[#8b949e]">トンネル残土含</div>
              </div>
              <div className="bg-[#090d13] p-2 rounded border border-[#21262d]">
                <div className="text-[10px] text-[#8b949e]">盛土所要総量</div>
                <div className="text-base font-bold text-[#10b981] mt-0.5">
                  {(totalFillM3 / 10000).toFixed(1)} <span className="text-xs">万m³</span>
                </div>
                <div className="text-[9px] text-[#8b949e]">路体・路床材</div>
              </div>
            </div>

            <div className="bg-[#090d13] p-2 rounded border border-[#21262d] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8b949e]">差引残土 (場外・仮置)</span>
                <div className="text-sm font-bold text-[#f59e0b]">
                  {netBalanceM3 > 0 ? `+${(netBalanceM3 / 10000).toFixed(2)}` : (netBalanceM3 / 10000).toFixed(2)}{' '}
                  <span className="text-xs">万m³</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8b949e]">現場内流用率</span>
                <div className="text-sm font-bold text-[#10b981]">
                  {((totalFillM3 / totalCutM3) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 残土ゼロ AIオートバランサー */}
            <button
              onClick={handleApplyNetZero}
              disabled={isBalancedApplied}
              className={`w-full py-1.5 px-2 rounded font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                isBalancedApplied
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                  : 'bg-gradient-to-r from-[#a855f7] to-[#38bdf8] text-[#090d13] hover:opacity-90 shadow-sm cursor-pointer'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {isBalancedApplied ? '✓ 残土ゼロ最適化 適用済' : '残土ゼロ AIオートバランサー実行'}
              </span>
            </button>
            {isBalancedApplied && (
              <div className="text-[10px] text-[#10b981] bg-[#10b981]/10 p-1.5 rounded border border-[#10b981]/20">
                盛土法面 1:1.8→1:1.75微調整により残土4.2万m³を現場内完全吸収（場外処分費▲8,400万円消却）
              </div>
            )}
          </div>

          {/* ダンプトラック・運行フリート設定 */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#f59e0b]" />
                10tダンプ配車フリート
              </span>
              <span className="text-[10px] text-[#8b949e]">公称 6.0 m³/台</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8b949e]">日稼働ダンプ台数:</span>
                <span className="font-bold text-[#38bdf8]">{dumpFleetCount} 台</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="2"
                value={dumpFleetCount}
                onChange={(e) => setDumpFleetCount(Number(e.target.value))}
                className="w-full accent-[#38bdf8] h-1.5 bg-[#090d13] rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#8b949e]">
                <span>20台 (小規模)</span>
                <span>60台 (標準)</span>
                <span>100台 (超高速)</span>
              </div>
            </div>

            {/* EVダンプシナリオトグル */}
            <div className="flex items-center justify-between p-2 bg-[#090d13] rounded border border-[#21262d] mt-1">
              <div className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#10b981]" />
                <span className="text-[11px] text-[#f0f6fc]">EVダンプトラック導入</span>
              </div>
              <button
                onClick={() => setUseEvDumpTrucks(!useEvDumpTrucks)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                  useEvDumpTrucks ? 'bg-[#10b981]' : 'bg-[#30363d]'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    useEvDumpTrucks ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {useEvDumpTrucks && (
              <div className="text-[10px] text-[#10b981] bg-[#10b981]/10 p-1.5 rounded">
                ⚡ 電気駆動ダンプ適用: CO2排出量 ▲78.2% 削減、走行燃料費 ▲22%
              </div>
            )}
          </div>

          {/* 仮置場（Stockyards）ステータス */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-2.5 flex flex-col gap-2">
            <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#a855f7]" />
              仮置場受入ストック
            </span>
            {stockyards.map((s) => (
              <div key={s.id} className="bg-[#090d13] p-2 rounded border border-[#21262d]">
                <div className="flex justify-between text-[11px] font-bold text-[#f0f6fc]">
                  <span>{s.name}</span>
                  <span className="text-[#38bdf8]">{s.staLabel}</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#8b949e] mt-1">
                  <span>受入容量: {s.capacityM3.toLocaleString()} m³</span>
                  <span>受入単価: ¥{s.disposalFeePerM3}/m³</span>
                </div>
                <div className="w-full bg-[#21262d] h-1.5 rounded overflow-hidden mt-1.5">
                  <div
                    className="bg-[#f59e0b] h-full"
                    style={{ width: `${(s.currentStoredM3 / s.capacityM3) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-[#8b949e] mt-0.5">
                  <span>ストック: {s.currentStoredM3.toLocaleString()} m³</span>
                  <span>{((s.currentStoredM3 / s.capacityM3) * 100).toFixed(1)}% 占有</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中央ペイン: ビューポート (Tab 1: 運行マップ / Tab 2: 3Dボーリング) */}
        <div className="flex-1 flex flex-col bg-[#090d13] overflow-hidden relative">
          {/* ICT建機テレマティクス 常時稼働HUDリボン */}
          <div className="bg-[#0d1117] border-b border-[#21262d] px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto text-[10px] select-none no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0 text-[#10b981] font-bold">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              <span>ICT TELEMATICS:</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {getActiveMachineryFleet().map((mach) => (
                <div
                  key={mach.id}
                  onClick={() => setIsConstructionDxOpen(true)}
                  className="bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] px-2 py-0.5 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                  title={`${mach.model} - クリックで建設DX詳細を開く`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span className="text-[#f0f6fc] font-bold">{mach.name.split(' ')[0]}</span>
                  <span className="text-[#38bdf8] font-mono">{mach.stationStr}</span>
                  <span className={`font-mono font-bold ${Math.abs(mach.targetSurfaceDiffMm) <= 20 ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                    {mach.targetSurfaceDiffMm > 0 ? `+${mach.targetSurfaceDiffMm}` : mach.targetSurfaceDiffMm}mm
                  </span>
                  <span className="text-[#8b949e]">({mach.co2RateKgPerHour}kg/h)</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsConstructionDxOpen(true)}
              className="px-2 py-0.5 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 rounded shrink-0 font-bold text-[9px] transition-colors"
            >
              出来形合否(98.6%) / CO2詳細
            </button>
          </div>

          {activeTab === 'logistics' ? (
            /* Tab 1: ダンプ運行マスカーブマップ */
            <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#f0f6fc] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#38bdf8]" />
                    線形計画法 (LP) 最適運搬アーク ＆ リアルタイム交通流
                  </span>
                  <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 px-1.5 py-0.5 rounded">
                    Simplex Optimal
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#8b949e]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" /> 切土工区
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> 盛土工区
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" /> トンネル残土
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> 仮置場
                  </span>
                </div>
              </div>

              {/* 路線マスカーブ2Dキャンバス */}
              <div className="flex-1 bg-[#0d1117] border border-[#21262d] rounded relative overflow-hidden flex flex-col">
                <svg className="w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cutGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                    {/* ダンプトラック運搬アニメーション用のパスマーカー */}
                    <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#38bdf8" />
                    </marker>
                  </defs>

                  {/* グリッド背景 */}
                  {Array.from({ length: 11 }).map((_, i) => (
                    <line
                      key={`grid-x-${i}`}
                      x1={i * 100}
                      y1={0}
                      x2={i * 100}
                      y2={500}
                      stroke="#21262d"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line
                      key={`grid-y-${i}`}
                      x1={0}
                      y1={i * 100}
                      x2={1000}
                      y2={i * 100}
                      stroke="#21262d"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* 基準中心線 (Brucknerゼロライン) */}
                  <line x1="40" y1="250" x2="960" y2="250" stroke="#484f58" strokeWidth="2" />
                  <text x="45" y="242" fill="#8b949e" fontSize="10">
                    ±0 m³ (マスカーブ基準線)
                  </text>

                  {/* Bruckner 土量累積曲線 (シミュレーション波形) */}
                  <path
                    d="M 50 250 Q 150 140, 220 150 T 360 280 T 520 220 T 680 130 T 820 90 T 950 220"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 50 250 Q 150 140, 220 150 T 360 280 T 520 220 T 680 130 T 820 90 T 950 220 L 950 250 L 50 250 Z"
                    fill="#38bdf8"
                    fillOpacity="0.08"
                  />

                  {/* 運搬アーク (LP最適化ルート描画) */}
                  {transportOptimization.routes.map((route, idx) => {
                    const srcZone = zones.find((z) => z.id === route.sourceId);
                    const tgtZone = zones.find((z) => z.id === route.targetId) || stockyards.find((s) => s.id === route.targetId);
                    if (!srcZone || !tgtZone) return null;

                    const startX = srcZone.x;
                    const startY = 320;
                    const endX = tgtZone.x;
                    const endY = 320;
                    const midX = (startX + endX) / 2;
                    const arcHeight = 320 - Math.min(Math.abs(endX - startX) * 0.45, 140) - idx * 6;

                    return (
                      <g key={route.id}>
                        {/* 運搬アーク放物線 */}
                        <path
                          d={`M ${startX} ${startY} Q ${midX} ${arcHeight} ${endX} ${endY}`}
                          fill="none"
                          stroke={route.targetId.startsWith('STK') ? '#f59e0b' : '#38bdf8'}
                          strokeWidth="2.5"
                          strokeDasharray="6 4"
                          opacity="0.85"
                        />
                        {/* アニメーションパルスダンプ */}
                        <circle
                          cx={midX}
                          cy={arcHeight + 15}
                          r="5"
                          fill={route.targetId.startsWith('STK') ? '#f59e0b' : '#38bdf8'}
                          className="animate-pulse"
                        />
                        <text
                          x={midX}
                          y={arcHeight + 8}
                          fill="#f0f6fc"
                          fontSize="9"
                          textAnchor="middle"
                          className="font-mono bg-[#090d13]"
                        >
                          {route.distanceKm}km ({Math.round(route.volumeM3 / 1000)}k m³)
                        </text>
                      </g>
                    );
                  })}

                  {/* 各工区ノード */}
                  {zones.map((z) => (
                    <g key={z.id} transform={`translate(${z.x}, 320)`}>
                      <circle
                        cx="0"
                        cy="0"
                        r="14"
                        fill={z.type === 'CUT' ? '#f43f5e' : z.type === 'FILL' ? '#10b981' : '#a855f7'}
                        stroke="#090d13"
                        strokeWidth="3"
                      />
                      <text x="0" y="4" fill="#090d13" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {z.type === 'CUT' ? '切' : z.type === 'FILL' ? '盛' : '坑'}
                      </text>
                      <text x="0" y="28" fill="#f0f6fc" fontSize="10" fontWeight="bold" textAnchor="middle">
                        {z.name.split(' ')[0]}
                      </text>
                      <text x="0" y="42" fill="#8b949e" fontSize="8" textAnchor="middle">
                        {z.staLabel}
                      </text>
                      <text
                        x="0"
                        y="54"
                        fill={z.type === 'CUT' ? '#f43f5e' : '#10b981'}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {(z.volumeM3 / 1000).toFixed(0)}k m³
                      </text>
                    </g>
                  ))}

                  {/* 仮置場ノード */}
                  {stockyards.map((s) => (
                    <g key={s.id} transform={`translate(${s.x}, 320)`}>
                      <rect
                        x="-12"
                        y="-12"
                        width="24"
                        height="24"
                        rx="4"
                        fill="#f59e0b"
                        stroke="#090d13"
                        strokeWidth="2"
                      />
                      <text x="0" y="4" fill="#090d13" fontSize="8" fontWeight="bold" textAnchor="middle">
                        仮
                      </text>
                      <text x="0" y="28" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {s.name.split(' ')[0]}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* 下部ステータスオーバーレイ */}
                <div className="absolute bottom-2 left-3 right-3 bg-[#161b22]/90 backdrop-blur border border-[#30363d] rounded p-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-[#8b949e]">日稼働ダンプ</span>
                      <div className="font-bold text-[#38bdf8]">{dumpFleetCount} 台 (10t積載)</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8b949e]">平均サイクル時間</span>
                      <div className="font-bold text-[#f0f6fc]">48.2 分/往復</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8b949e]">日運搬量</span>
                      <div className="font-bold text-[#10b981]">
                        {((dumpFleetCount * 7.5 * 6.0)).toLocaleString()} m³/日
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#8b949e]">推計工期:</span>
                    <span className="font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded border border-[#f59e0b]/30">
                      {transportOptimization.totalDaysRequired} 稼働日 (約 8.5ヶ月)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: 3D地盤ボーリング柱状図＆支持層透視 */
            <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#f0f6fc] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#10b981]" />
                    全線 3D地盤ボーリング柱状図 ＆ N値≧50 支持基盤サーフェス透視
                  </span>
                  <span className="text-[10px] bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 px-1.5 py-0.5 rounded">
                    Kriging Subsurface
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#8b949e]">柱状図選択:</span>
                  <select
                    value={selectedBoringId}
                    onChange={(e) => setSelectedBoringId(e.target.value)}
                    className="bg-[#161b22] border border-[#30363d] text-[#f0f6fc] text-xs rounded px-2 py-1"
                  >
                    {boringLogs.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.staLabel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ボーリング透視キャンバス */}
              <div className="flex-1 grid grid-cols-12 gap-3 bg-[#0d1117] border border-[#21262d] rounded p-3 overflow-hidden">
                {/* 6本ボーリング縦断プロファイル断面 (8 cols) */}
                <div className="col-span-8 bg-[#090d13] border border-[#21262d] rounded p-3 relative flex flex-col">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-[#8b949e]">
                      地盤縦断プロファイル (STA.0+000 〜 STA.24+500 / 深度 0m 〜 GL-30m)
                    </span>
                    <span className="text-[10px] text-[#10b981] flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-[#10b981]" /> 支持層 N≧50 基底ライン
                    </span>
                  </div>

                  <svg className="w-full flex-1" viewBox="0 0 600 280">
                    {/* 水平深度グリッド (GL 0, -10, -20, -30m) */}
                    {[0, 10, 20, 30].map((depth) => {
                      const y = 30 + (depth / 30) * 220;
                      return (
                        <g key={`d-${depth}`}>
                          <line x1="40" y1={y} x2="580" y2={y} stroke="#21262d" strokeWidth="1" strokeDasharray="3 3" />
                          <text x="35" y={y + 4} fill="#8b949e" fontSize="9" textAnchor="end">
                            GL-{depth}m
                          </text>
                        </g>
                      );
                    })}

                    {/* 支持層 N≧50 補間面（阿蘇溶結凝灰岩・安山岩基盤） */}
                    <path
                      d={`M 60 ${30 + (boringLogs[0].bearingStrataDepthM / 30) * 220}
                          L 160 ${30 + (boringLogs[1].bearingStrataDepthM / 30) * 220}
                          L 260 ${30 + (boringLogs[2].bearingStrataDepthM / 30) * 220}
                          L 360 ${30 + (boringLogs[3].bearingStrataDepthM / 30) * 220}
                          L 460 ${30 + (boringLogs[4].bearingStrataDepthM / 30) * 220}
                          L 560 ${30 + (boringLogs[5].bearingStrataDepthM / 30) * 220}
                          L 560 250 L 60 250 Z`}
                      fill="#10b981"
                      fillOpacity="0.15"
                    />
                    <path
                      d={`M 60 ${30 + (boringLogs[0].bearingStrataDepthM / 30) * 220}
                          L 160 ${30 + (boringLogs[1].bearingStrataDepthM / 30) * 220}
                          L 260 ${30 + (boringLogs[2].bearingStrataDepthM / 30) * 220}
                          L 360 ${30 + (boringLogs[3].bearingStrataDepthM / 30) * 220}
                          L 460 ${30 + (boringLogs[4].bearingStrataDepthM / 30) * 220}
                          L 560 ${30 + (boringLogs[5].bearingStrataDepthM / 30) * 220}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />

                    {/* 6本ボーリング柱状図 */}
                    {boringLogs.map((b, bIdx) => {
                      const bx = 60 + bIdx * 100;
                      const isSel = b.id === selectedBoringId;

                      return (
                        <g
                          key={b.id}
                          className="cursor-pointer group"
                          onClick={() => setSelectedBoringId(b.id)}
                        >
                          {/* 選択ハイライト */}
                          {isSel && (
                            <rect
                              x={bx - 16}
                              y="10"
                              width="32"
                              height="250"
                              fill="#38bdf8"
                              fillOpacity="0.1"
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              rx="3"
                            />
                          )}

                          {/* 柱状図各層 */}
                          {b.layers.map((layer, lIdx) => {
                            const ly = 30 + (layer.depthFromM / 30) * 220;
                            const lh = ((layer.depthToM - layer.depthFromM) / 30) * 220;
                            return (
                              <rect
                                key={lIdx}
                                x={bx - 8}
                                y={ly}
                                width="16"
                                height={lh}
                                fill={layer.color}
                                stroke="#090d13"
                                strokeWidth="0.5"
                              />
                            );
                          })}

                          {/* 地下水位マーカー */}
                          <line
                            x1={bx - 14}
                            y1={30 + (b.waterTableM / 30) * 220}
                            x2={bx + 14}
                            y2={30 + (b.waterTableM / 30) * 220}
                            stroke="#38bdf8"
                            strokeWidth="2"
                          />

                          {/* 孔名ラベル */}
                          <text
                            x={bx}
                            y="20"
                            fill={isSel ? '#38bdf8' : '#f0f6fc'}
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {b.id}
                          </text>
                          <text x={bx} y="268" fill="#8b949e" fontSize="8" textAnchor="middle">
                            {b.staLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* 選択されたボーリング孔の詳細地層スペック (4 cols) */}
                <div className="col-span-4 bg-[#090d13] border border-[#21262d] rounded p-3 flex flex-col gap-2 overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-[#21262d] pb-2">
                    <span className="font-bold text-[#38bdf8]">{selectedBoring.name}</span>
                    <span className="text-[10px] text-[#8b949e]">標高 {selectedBoring.groundElevationM}m</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <span className="text-[#8b949e]">支持層 (N≧50):</span>
                      <div className="font-bold text-[#10b981] mt-0.5">GL-{selectedBoring.bearingStrataDepthM} m</div>
                    </div>
                    <div className="bg-[#161b22] p-1.5 rounded">
                      <span className="text-[#8b949e]">地下水位 (WL):</span>
                      <div className="font-bold text-[#38bdf8] mt-0.5">GL-{selectedBoring.waterTableM} m</div>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-[#f0f6fc] mt-1">地層・N値プロファイル</div>
                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                    {selectedBoring.layers.map((l, i) => (
                      <div key={i} className="bg-[#161b22] p-2 rounded border-l-4" style={{ borderColor: l.color }}>
                        <div className="flex justify-between text-[10px] font-bold text-[#f0f6fc]">
                          <span>{l.soilName}</span>
                          <span className="text-[#f59e0b]">N = {l.nValue}</span>
                        </div>
                        <div className="text-[9px] text-[#8b949e] mt-0.5">
                          深度: GL-{l.depthFromM}m 〜 {l.depthToM}m (層厚 {(l.depthToM - l.depthFromM).toFixed(1)}m)
                        </div>
                        <div className="text-[9px] text-[#cbd5e1] mt-1">{l.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右ペイン: 最適化成果・国交省監査マトリクス */}
        <div className="w-80 bg-[#0d1117] border-l border-[#21262d] flex flex-col p-3 overflow-y-auto shrink-0 gap-3 text-xs">
          {/* LP最適化成果サマリーカード */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-[#10b981]" />
                LP運搬費用最適化サマリー
              </span>
              <span className="text-[10px] bg-[#10b981]/10 text-[#10b981] px-1.5 py-0.5 rounded font-bold">
                ▲28% 削減
              </span>
            </div>

            <div className="space-y-1.5 bg-[#090d13] p-2.5 rounded border border-[#21262d]">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8b949e]">最適運搬総費用:</span>
                <span className="font-bold text-[#f0f6fc]">
                  ¥{(transportOptimization.optimalTotalCost / 100000000).toFixed(2)} 億円
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8b949e]">工費削減額:</span>
                <span className="font-bold text-[#10b981]">
                  ▲¥{(transportOptimization.costSavingsYen / 10000).toLocaleString()} 万円
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8b949e]">総運搬便数:</span>
                <span className="font-bold text-[#38bdf8]">
                  {transportOptimization.totalTrips.toLocaleString()} 便
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8b949e]">CO2排出総量:</span>
                <span className="font-bold text-[#f59e0b]">
                  {transportOptimization.totalCo2Ton} t-CO2 (▲{transportOptimization.co2SavingsTon}t 削減)
                </span>
              </div>
            </div>
          </div>

          {/* 国交省土木積算・施工基準 リアルタイム監査マトリクス */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                国交省土工・積算基準 監査
              </span>
              <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded font-bold">
                ALL PASS
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {auditItems.map((item) => (
                <div key={item.id} className="bg-[#090d13] p-2 rounded border border-[#21262d]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#f0f6fc]">{item.title}</span>
                    <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 py-0.2 rounded font-bold">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#8b949e] mt-0.5">基準: {item.limit}</div>
                  <div className="text-[10px] text-[#38bdf8] font-bold mt-0.5">実績: {item.actual}</div>
                  {item.note && <div className="text-[9px] text-[#a855f7] mt-0.5">※ {item.note}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* AIロジスティクス提案カード */}
          <div className="bg-[#161b22] border border-[#a855f7]/40 rounded p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#a855f7] font-bold text-[11px]">
              <Zap className="w-3.5 h-3.5" />
              <span>AI物流アドバイザー (Agent Earthwork-04)</span>
            </div>
            <p className="text-[10px] text-[#cbd5e1] leading-relaxed">
              トンネル掘削ズリ（安山岩15.7万m³）は高強度岩砕のため、第2仮置場（公有水面）へ搬出せず緑川アプローチおよび終点盛土材として100%転用することで、購入盛土材費▲1億4,200万円の圧縮が可能です。
            </p>
          </div>
        </div>
      </div>

      {/* 3. エクスポートモーダル (CSV / LandXML) */}
      {exportModal !== 'none' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262d]">
              <div className="flex items-center gap-2">
                {exportModal === 'csv' ? (
                  <FileSpreadsheet className="w-4 h-4 text-[#10b981]" />
                ) : (
                  <FileCode className="w-4 h-4 text-[#a855f7]" />
                )}
                <span className="font-bold text-sm text-[#f0f6fc]">
                  {exportModal === 'csv'
                    ? '土工配分計画書 (CSV / Excel互換)'
                    : 'LandXML 1.2 土量・運搬マテリアルデータ'}
                </span>
              </div>
              <button
                onClick={() => setExportModal('none')}
                className="text-[#8b949e] hover:text-[#f0f6fc] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <pre className="bg-[#090d13] p-3 rounded border border-[#21262d] text-[11px] font-mono text-[#cbd5e1] overflow-x-auto max-h-[50vh] leading-tight">
                {exportModal === 'csv' ? generateLogisticsCsv() : generateEarthworkLandXml()}
              </pre>
            </div>

            <div className="px-4 py-3 border-t border-[#21262d] flex justify-between items-center bg-[#161b22]">
              <span className="text-[10px] text-[#8b949e]">
                国土交通省BIM/CIM土木積算要領・電子納品フォーマット適合
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleCopyCode(exportModal === 'csv' ? generateLogisticsCsv() : generateEarthworkLandXml())
                  }
                  className="bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopied ? 'コピー完了' : 'コピー'}</span>
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile(
                      exportModal === 'csv' ? generateLogisticsCsv() : generateEarthworkLandXml(),
                      exportModal === 'csv' ? 'Kumamoto_Earthwork_Logistics.csv' : 'Kumamoto_Earthwork_LandXML.xml',
                      exportModal === 'csv' ? 'text/csv;charset=utf-8;' : 'application/xml'
                    )
                  }
                  className="bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportModal === 'csv' ? '.csv 保存' : '.xml 保存'}</span>
                </button>
                <button
                  onClick={() => setExportModal('none')}
                  className="bg-[#38bdf8] text-[#090d13] font-bold px-3 py-1 rounded text-xs hover:bg-[#7bd0ff] transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 建設DX・出来形管理・CO2ライフサイクル モーダル */}
      <ConstructionDxModal
        isOpen={isConstructionDxOpen}
        onClose={() => setIsConstructionDxOpen(false)}
        activeProject={activeProject}
      />
    </div>
  );
};
