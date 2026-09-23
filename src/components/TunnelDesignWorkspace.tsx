import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mountain,
  FileCode,
  Layers,
  Flame,
  Activity,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Sliders,
  Maximize2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import { useTunnelDesign } from '../hooks/useTunnelDesign';
import { NatmSupportPatternType, TunnelPortalType, CivilProject } from '../types';
import { AssetManagementModal } from './AssetManagementModal';

interface TunnelDesignWorkspaceProps {
  activeProject?: CivilProject;
}

export const TunnelDesignWorkspace: React.FC<TunnelDesignWorkspaceProps> = ({ activeProject }) => {
  const {
    tunnelConfig,
    supportPatterns,
    selectedPatternId,
    setSelectedPatternId,
    portalAnalytics,
    safetyAndVentilation,
    engineeringEstimates,
    auditItems,
    setPortalType,
    setExcavatedM,
    adjustPatternLength,
    generateLandXmlContent,
    generateIfcContent,
    downloadLandXml,
    downloadIfc,
  } = useTunnelDesign();

  // デフォルトで左右パネルを折りたたんだ状態に設定
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState<boolean>(false);
  const [isRightPaneOpen, setIsRightPaneOpen] = useState<boolean>(false);

  // 路線・プロジェクト変更時は左右メニューを折りたたんだ状態に維持
  useEffect(() => {
    setIsLeftPaneOpen(false);
    setIsRightPaneOpen(false);
  }, [activeProject?.id]);
  const [activeCenterTab, setActiveCenterTab] = useState<'profile' | 'crossSection' | 'perspective'>('profile');
  const [copiedType, setCopiedType] = useState<'landxml' | 'ifc' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState<boolean>(false);

  const selectedPattern = supportPatterns.find((p) => p.id === selectedPatternId) || supportPatterns[1];
  const progressPercent = Math.round((tunnelConfig.currentExcavatedM / tunnelConfig.totalLengthM) * 100);

  const handleCopy = (type: 'landxml' | 'ifc') => {
    const text = type === 'landxml' ? generateLandXmlContent() : generateIfcContent();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownload = (type: 'landxml' | 'ifc') => {
    const ok = type === 'landxml' ? downloadLandXml() : downloadIfc();
    if (ok) {
      setDownloadSuccess(type === 'landxml' ? 'LandXML 1.2 (.xml)' : 'IFC 4.3 (.ifc)');
      setTimeout(() => setDownloadSuccess(null), 3500);
    }
  };

  return (
    <div id="tunnel-workspace-root" className="flex-1 flex flex-col h-[calc(100vh-80px)] bg-[#090d13] text-[#f0f6fc] overflow-hidden">
      {/* サブヘッダー HUD */}
      <div className="h-11 border-b border-[#21262d] bg-[#0d1117] px-4 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-[#38bdf8] font-mono font-semibold">
            <Mountain className="w-4 h-4 text-[#38bdf8]" />
            <span>NATM TUNNEL WORKSPACE</span>
          </div>
          <span className="text-[#30363d]">|</span>
          <span className="text-[#8b949e]">路線:</span>
          <span className="font-mono text-[#f0f6fc]">{activeProject?.structuralFeatures?.majorTunnelName || tunnelConfig.route}</span>
          <span className="text-[#30363d]">|</span>
          <span className="text-[#8b949e]">工法:</span>
          <span className="text-[#38bdf8] bg-[#38bdf8]/10 px-1.5 py-0.5 rounded border border-[#38bdf8]/30">
            {tunnelConfig.excavationMethod}
          </span>
        </div>

        {/* HUD テレメトリ */}
        <div className="flex items-center space-x-4 font-mono">
          <div className="flex items-center space-x-1">
            <span className="text-[#8b949e]">総延長:</span>
            <span className="text-[#f0f6fc] font-bold">{tunnelConfig.totalLengthM.toLocaleString()} m</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-[#8b949e]">最大土被り:</span>
            <span className="text-[#38bdf8] font-bold">{tunnelConfig.maxCoverM} m</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-[#8b949e]">内空断面積:</span>
            <span className="text-[#10b981] font-bold">{tunnelConfig.crossSectionAreaM2} m²</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-[#8b949e]">安全等級:</span>
            <span className="text-[#a855f7] bg-[#a855f7]/15 px-2 py-0.5 rounded border border-[#a855f7]/40 font-bold">
              等級 {safetyAndVentilation.tunnelGrade}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-[#8b949e]">切羽進捗:</span>
            <span className="text-[#f59e0b] font-bold">
              {tunnelConfig.currentExcavatedM}m ({progressPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* メイン 3ペイン分割レイアウト */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ============================================================ */}
        {/* 左ペイン: トンネル諸元 & NATM支保アロケータ */}
        {/* ============================================================ */}
        {!isLeftPaneOpen ? (
          <div className="w-8 bg-[#0d1117] border-r border-[#21262d] flex flex-col items-center py-2 z-30 shrink-0 select-none">
            <button
              onClick={() => setIsLeftPaneOpen(true)}
              className="p-1.5 bg-[#161b22] hover:bg-[#38bdf8] hover:text-[#090d13] text-[#38bdf8] rounded border border-[#21262d] transition-all shadow"
              title="NATM支保パネルを展開"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="[writing-mode:vertical-rl] text-[10px] font-mono text-[#8b949e] mt-4 tracking-widest">
              NATM支保・坑門工
            </span>
          </div>
        ) : (
        <div className="w-[360px] border-r border-[#21262d] bg-[#0d1117] flex flex-col shrink-0 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar select-none">
          {/* Collapse Header Bar */}
          <div className="flex items-center justify-between pb-1 border-b border-[#21262d]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#f0f6fc]">
              <Mountain className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>NATM設計諸元</span>
            </div>
            <button
              onClick={() => setIsLeftPaneOpen(false)}
              className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
              title="左パネルを折りたたむ"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 掘進進捗シミュレータ */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#38bdf8]">
                <Activity className="w-3.5 h-3.5" />
                <span>切羽掘進シミュレータ</span>
              </div>
              <span className="text-[11px] font-mono text-[#f59e0b] font-bold">{progressPercent}% 完了</span>
            </div>
            <input
              type="range"
              min="0"
              max={tunnelConfig.totalLengthM}
              step="20"
              value={tunnelConfig.currentExcavatedM}
              onChange={(e) => setExcavatedM(Number(e.target.value))}
              className="w-full accent-[#38bdf8] cursor-pointer h-1.5 bg-[#21262d] rounded"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#8b949e] mt-1.5">
              <span>STA.17+500 (西坑口 0m)</span>
              <span className="text-[#f0f6fc] font-bold">切羽: STA.17+{(500 + tunnelConfig.currentExcavatedM / 10).toFixed(0)}</span>
              <span>STA.19+800 (東坑口 2,300m)</span>
            </div>
          </div>

          {/* 坑門工（Portal）選択 */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                西坑口 坑門形式セレクタ (STA.17+500)
              </span>
              <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.5 rounded border border-[#10b981]/30">
                Fs = {portalAnalytics.slopeFs.toFixed(2)} PASS
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[
                { id: 'bamboo_cut', label: '竹割型', sub: '景観調和' },
                { id: 'wall', label: '面壁型', sub: '標準重力式' },
                { id: 'bellmouth', label: 'ベルマウス', sub: '微気圧波対策' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPortalType(item.id as TunnelPortalType)}
                  className={`py-1.5 px-2 rounded text-xs font-mono transition-all text-center border ${
                    tunnelConfig.portalType === item.id
                      ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] font-bold shadow-sm'
                      : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]'
                  }`}
                >
                  <div>{item.label}</div>
                  <div className="text-[9px] opacity-75">{item.sub}</div>
                </button>
              ))}
            </div>

            <div className="bg-[#090d13] p-2 rounded text-[11px] text-[#8b949e] leading-relaxed border border-[#21262d]">
              <p className="text-[#f0f6fc]">{portalAnalytics.portalDescription}</p>
              <div className="mt-1 flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#21262d]">
                <span>微気圧波低減効果:</span>
                <span className="text-[#38bdf8] font-bold">{portalAnalytics.microPressureReductionPct}%</span>
                <span>坑口斜面安定度:</span>
                <span className="text-[#10b981] font-bold">Fs {portalAnalytics.slopeFs.toFixed(2)} ≧ 1.50</span>
              </div>
            </div>
          </div>

          {/* NATM支保パターン延長配分アロケータ */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3 flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#38bdf8]" />
                NATM支保パターン配分 (全4区分)
              </span>
              <span className="text-[10px] font-mono text-[#8b949e]">合計 2,300m</span>
            </div>

            {/* パターン区間棒グラフ */}
            <div className="w-full h-3 rounded bg-[#090d13] overflow-hidden flex border border-[#30363d] mb-3">
              {supportPatterns.map((p) => {
                const widthPct = (p.lengthM / tunnelConfig.totalLengthM) * 100;
                return (
                  <div
                    key={p.id}
                    style={{ width: `${widthPct}%`, backgroundColor: p.color }}
                    title={`${p.id}: ${p.lengthM}m (${widthPct.toFixed(1)}%)`}
                    className="h-full border-r border-[#090d13]/50 last:border-0 hover:brightness-125 transition-all cursor-pointer"
                    onClick={() => setSelectedPatternId(p.id)}
                  />
                );
              })}
            </div>

            {/* 各パターン詳細リスト */}
            <div className="space-y-2">
              {supportPatterns.map((p) => {
                const isSelected = selectedPatternId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatternId(p.id)}
                    className={`p-2 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#21262d] border-[#38bdf8] shadow-sm'
                        : 'bg-[#0d1117] border-[#21262d] hover:border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="font-bold text-[#f0f6fc]">{p.id}</span>
                        <span className="text-[11px] text-[#8b949e]">{p.name}</span>
                      </div>
                      <span className="font-mono font-bold text-[#38bdf8]">{p.lengthM} m</span>
                    </div>

                    <div className="text-[10px] font-mono text-[#8b949e] mt-1 flex justify-between">
                      <span>{p.rockClass.split(' (')[0]}</span>
                      <span>吹付 {p.shotcreteMm}mm / ボルト {p.rockBoltLengthM}m</span>
                    </div>

                    {/* 微調整ボタン */}
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-[#30363d] flex items-center justify-between text-[10px]">
                        <span className="text-[#8b949e]">区間延長微調整:</span>
                        <div className="flex space-x-1.5 font-mono">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustPatternLength(p.id, -20);
                            }}
                            className="px-2 py-0.5 bg-[#161b22] hover:bg-[#30363d] text-[#f43f5e] rounded border border-[#30363d]"
                          >
                            -20m
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustPatternLength(p.id, 20);
                            }}
                            className="px-2 py-0.5 bg-[#161b22] hover:bg-[#30363d] text-[#10b981] rounded border border-[#30363d]"
                          >
                            +20m
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 工学的集計 HUD */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-2.5">
            <div className="text-[11px] font-semibold text-[#8b949e] uppercase mb-1.5 flex items-center justify-between">
              <span>トンネル土工・支保工マテリアル集計</span>
              <Zap className="w-3 h-3 text-[#f59e0b]" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#090d13] p-1.5 rounded border border-[#21262d]">
                <div className="text-[10px] text-[#8b949e]">総掘削土量</div>
                <div className="text-[#38bdf8] font-bold">{engineeringEstimates.totalExcavationM3.toLocaleString()} m³</div>
              </div>
              <div className="bg-[#090d13] p-1.5 rounded border border-[#21262d]">
                <div className="text-[10px] text-[#8b949e]">吹付コンクリート</div>
                <div className="text-[#10b981] font-bold">{engineeringEstimates.totalShotcreteM3.toLocaleString()} m³</div>
              </div>
              <div className="bg-[#090d13] p-1.5 rounded border border-[#21262d]">
                <div className="text-[10px] text-[#8b949e]">鋼製支保工 (H鋼)</div>
                <div className="text-[#f59e0b] font-bold">{engineeringEstimates.totalSteelWeightTons.toLocaleString()} t</div>
              </div>
              <div className="bg-[#090d13] p-1.5 rounded border border-[#21262d]">
                <div className="text-[10px] text-[#8b949e]">概算工事費</div>
                <div className="text-[#a855f7] font-bold">{engineeringEstimates.totalCostMillionYen.toLocaleString()} 億円</div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ============================================================ */}
        {/* 中央ペイン: 縦断プロファイル × 標準横断 × 3Dチューブパース */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#090d13] overflow-hidden">
          {/* ビューポート タブヘッダー */}
          <div className="h-10 border-b border-[#21262d] bg-[#0d1117] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveCenterTab('profile')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all flex items-center space-x-1.5 border ${
                  activeCenterTab === 'profile'
                    ? 'bg-[#21262d] border-[#38bdf8] text-[#38bdf8] font-bold'
                    : 'bg-transparent border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                <Mountain className="w-3.5 h-3.5" />
                <span>地質縦断プロファイル (Profile)</span>
              </button>
              <button
                onClick={() => setActiveCenterTab('crossSection')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all flex items-center space-x-1.5 border ${
                  activeCenterTab === 'crossSection'
                    ? 'bg-[#21262d] border-[#38bdf8] text-[#38bdf8] font-bold'
                    : 'bg-transparent border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>馬蹄形標準横断図 (Section)</span>
              </button>
              <button
                onClick={() => setActiveCenterTab('perspective')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all flex items-center space-x-1.5 border ${
                  activeCenterTab === 'perspective'
                    ? 'bg-[#21262d] border-[#38bdf8] text-[#38bdf8] font-bold'
                    : 'bg-transparent border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>3Dチューブ・坑門ビュー (3D BIM)</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-[#8b949e]">
              <button
                onClick={() => setIsAssetModalOpen(true)}
                className="bg-[#f43f5e]/15 hover:bg-[#f43f5e]/25 text-[#f43f5e] border border-[#f43f5e]/40 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 transition-colors shadow-sm"
                title="国交省定期点検要領 構造物健全度カルテ ＆ 50年LCC劣化予測"
              >
                <HeartPulse className="w-3.5 h-3.5 animate-pulse" />
                <span>点検カルテ (健全度II)</span>
              </button>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                PyVista 3D Engine: 60 FPS
              </span>
              <span>CRS: JGD2011 (EPSG:6670)</span>
            </div>
          </div>

          {/* ビューポート描画エリア */}
          <div className="flex-1 relative overflow-hidden bg-[#090d13] p-4 flex flex-col justify-center items-center">
            {/* 1. 地質縦断プロファイル */}
            {activeCenterTab === 'profile' && (
              <div className="w-full h-full flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#8b949e] mb-1">
                  <span className="text-[#38bdf8] font-bold">金峰山山岳尾根 縦断地質断面 (STA.17+500 〜 STA.19+800)</span>
                  <span>土被り: H=14.2m 〜 142.5m (縦断下り勾配 i = -1.80%)</span>
                </div>

                {/* SVG 縦断断面図 */}
                <div className="flex-1 w-full relative bg-[#0d1117] rounded-lg border border-[#21262d] overflow-hidden flex items-center">
                  <svg className="w-full h-full" viewBox="0 0 950 420" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#21262d" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#0d1117" stopOpacity="0.95" />
                      </linearGradient>
                      <linearGradient id="faultGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
                      </linearGradient>
                      <pattern id="hatchGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 0 20 L 20 0 M 0 0 L 20 20" stroke="#30363d" strokeWidth="0.5" opacity="0.3" />
                      </pattern>
                    </defs>

                    {/* 地盤等高線 (山体プロファイル) */}
                    <path
                      d="M 50 320 Q 200 180, 480 60 T 900 340 L 900 390 L 50 390 Z"
                      fill="url(#mountainGrad)"
                    />
                    <path
                      d="M 50 320 Q 200 180, 480 60 T 900 340"
                      stroke="#8b949e"
                      strokeWidth="2.5"
                      fill="none"
                    />

                    {/* 金峰山尾根頂点ラベル */}
                    <text x="480" y="45" fill="#f0f6fc" fontSize="11" fontFamily="monospace" textAnchor="middle">
                      ▲ 金峰山尾根直下 (EL. 327.5m / 土被り H=142.5m)
                    </text>
                    <line x1="480" y1="60" x2="480" y2="280" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />

                    {/* 断層破砕帯ゾーン (STA.18+920〜19+100) */}
                    <rect x="620" y="70" width="80" height="310" fill="url(#faultGrad)" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 2" />
                    <text x="660" y="110" fill="#f43f5e" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      金峰山破砕帯 (DIII)
                    </text>

                    {/* トンネル軸線 (標高約182m -> 141m) */}
                    <line x1="50" y1="260" x2="900" y2="300" stroke="#38bdf8" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
                    <line x1="50" y1="260" x2="900" y2="300" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />

                    {/* 支保パターン色分け帯 */}
                    {/* CI (640m -> 幅約 236px) */}
                    <rect x="250" y="254" width="240" height="12" fill="#10b981" opacity="0.8" />
                    {/* DI (960m -> 幅約 355px) */}
                    <rect x="50" y="254" width="200" height="12" fill="#38bdf8" opacity="0.8" />
                    <rect x="490" y="254" width="155" height="12" fill="#38bdf8" opacity="0.8" />
                    {/* DII (520m -> 幅約 192px) */}
                    <rect x="725" y="254" width="175" height="12" fill="#f59e0b" opacity="0.8" />
                    {/* DIII (180m -> 幅約 80px) */}
                    <rect x="645" y="254" width="80" height="12" fill="#f43f5e" opacity="0.9" />

                    {/* 避難連絡坑 (3箇所) */}
                    {[330, 600, 810].map((x, i) => (
                      <g key={i}>
                        <line x1={x} y1="270" x2={x} y2="350" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="3 2" />
                        <circle cx={x} cy="350" r="4" fill="#a855f7" />
                        <text x={x} y="365" fill="#a855f7" fontSize="9" fontFamily="monospace" textAnchor="middle">
                          避難坑 #{i + 1}
                        </text>
                      </g>
                    ))}

                    {/* 切羽現在位置マーカー */}
                    {(() => {
                      const ratio = tunnelConfig.currentExcavatedM / tunnelConfig.totalLengthM;
                      const curX = 50 + ratio * 850;
                      const curY = 260 + ratio * 40;
                      return (
                        <g>
                          <circle cx={curX} cy={curY} r="7" fill="#f59e0b" className="animate-ping" opacity="0.6" />
                          <circle cx={curX} cy={curY} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                          <line x1={curX} y1={curY - 30} x2={curX} y2={curY} stroke="#f59e0b" strokeWidth="1.5" />
                          <rect x={curX - 45} y={curY - 48} width="90" height="18" fill="#161b22" stroke="#f59e0b" rx="3" />
                          <text x={curX} y={curY - 35} fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                            切羽: {tunnelConfig.currentExcavatedM}m
                          </text>
                        </g>
                      );
                    })()}

                    {/* 西坑口・東坑口ラベル */}
                    <text x="50" y="340" fill="#f0f6fc" fontSize="11" fontFamily="monospace">
                      西坑口 STA.17+500
                    </text>
                    <text x="900" y="360" fill="#f0f6fc" fontSize="11" fontFamily="monospace" textAnchor="end">
                      東坑口 STA.19+800
                    </text>
                  </svg>

                  {/* 凡例オーバーレイ */}
                  <div className="absolute bottom-3 left-4 bg-[#161b22]/90 backdrop-blur px-3 py-1.5 rounded border border-[#21262d] flex items-center space-x-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-[#10b981] rounded" /> パターンCI
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-[#38bdf8] rounded" /> パターンDI
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-[#f59e0b] rounded" /> パターンDII
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-[#f43f5e] rounded" /> パターンDIII (破砕帯)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#a855f7]" /> 避難連絡坑 (@750m)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. 馬蹄形標準横断図 */}
            {activeCenterTab === 'crossSection' && (
              <div className="w-full h-full flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#8b949e] mb-1">
                  <span className="text-[#38bdf8] font-bold">
                    標準馬蹄形断面詳細: {selectedPattern.name} (内空面積 {tunnelConfig.crossSectionAreaM2} m²)
                  </span>
                  <span>
                    吹付厚: {selectedPattern.shotcreteMm}mm / ロックボルト: L={selectedPattern.rockBoltLengthM}m ({selectedPattern.rockBoltCount}本)
                  </span>
                </div>

                <div className="flex-1 w-full bg-[#0d1117] rounded-lg border border-[#21262d] relative flex items-center justify-center">
                  <svg className="w-[520px] h-[360px]" viewBox="0 0 520 360">
                    {/* 地山ハッチング */}
                    <circle cx="260" cy="180" r="160" fill="none" stroke="#21262d" strokeWidth="40" strokeDasharray="4 4" />

                    {/* 放射状ロックボルト */}
                    {Array.from({ length: selectedPattern.rockBoltCount }).map((_, i) => {
                      const totalCount = selectedPattern.rockBoltCount;
                      const angleDeg = -140 + (i / (totalCount - 1)) * 280;
                      const rad = (angleDeg * Math.PI) / 180;
                      const innerR = 120;
                      const boltLen = selectedPattern.rockBoltLengthM * 16; // スケール
                      const x1 = 260 + innerR * Math.cos(rad);
                      const y1 = 180 + innerR * Math.sin(rad);
                      const x2 = 260 + (innerR + boltLen) * Math.cos(rad);
                      const y2 = 180 + (innerR + boltLen) * Math.sin(rad);
                      return (
                        <g key={i}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth="2" />
                          <circle cx={x2} cy={y2} r="2.5" fill="#f59e0b" />
                        </g>
                      );
                    })}

                    {/* 吹付コンクリート外層 */}
                    <path
                      d="M 140 250 A 120 120 0 1 1 380 250 Q 260 280 140 250 Z"
                      fill="#21262d"
                      stroke="#8b949e"
                      strokeWidth={selectedPattern.shotcreteMm / 20}
                    />

                    {/* 内空馬蹄形輪郭 */}
                    <path
                      d="M 150 245 A 110 110 0 1 1 370 245 Q 260 270 150 245 Z"
                      fill="#161b22"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />

                    {/* インバートコンクリート (DII, DIIIの場合) */}
                    {selectedPattern.invertRequired && (
                      <path
                        d="M 150 245 Q 260 270 370 245 Q 260 255 150 245 Z"
                        fill="#f43f5e"
                        opacity="0.3"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* 道路路面 (舗装) */}
                    <line x1="155" y1="245" x2="365" y2="245" stroke="#30363d" strokeWidth="6" />
                    <line x1="260" y1="245" x2="260" y2="246" stroke="#f0f6fc" strokeWidth="2" strokeDasharray="8 6" />

                    {/* 建築限界ボックス (4.5m × 8.5m) */}
                    <rect
                      x="180"
                      y="145"
                      width="160"
                      height="100"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <text x="260" y="195" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      建築限界 H=4.50m / W=8.50m (PASS)
                    </text>

                    {/* ジェットファン (上部換気) */}
                    <rect x="235" y="82" width="50" height="14" rx="3" fill="#0d1117" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="260" y="93" fill="#a855f7" fontSize="8" fontFamily="monospace" textAnchor="middle">
                      JET FAN φ1030
                    </text>

                    {/* 支保工規格ラベル */}
                    <text x="260" y="320" fill="#f0f6fc" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      {selectedPattern.steelSupport}
                    </text>
                  </svg>
                </div>
              </div>
            )}

            {/* 3. 3Dチューブパース & 坑門工ビュー */}
            {activeCenterTab === 'perspective' && (
              <div className="w-full h-full flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#8b949e] mb-1">
                  <span className="text-[#38bdf8] font-bold">
                    3D Digital Twin: {tunnelConfig.portalType.toUpperCase()} 坑門 ＆ 馬蹄形チューブ内部
                  </span>
                  <span className="text-[#10b981]">微気圧波低減効果: {portalAnalytics.microPressureReductionPct}%</span>
                </div>

                <div className="flex-1 w-full bg-[#0d1117] rounded-lg border border-[#21262d] relative flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 800 380">
                    <defs>
                      <linearGradient id="tubeDepth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#090d13" />
                        <stop offset="100%" stopColor="#161b22" />
                      </linearGradient>
                    </defs>

                    {/* 奥の消失点への遠近法トンネルチューブ */}
                    <polygon points="100,320 360,200 440,200 700,320" fill="#161b22" stroke="#21262d" />
                    <polygon points="100,60 360,150 440,150 700,60" fill="#0d1117" stroke="#21262d" />
                    <polygon points="100,60 360,150 360,200 100,320" fill="#1b2129" stroke="#30363d" />
                    <polygon points="700,60 440,150 440,200 700,320" fill="#1b2129" stroke="#30363d" />

                    {/* トンネル照明具 (左右) */}
                    {[140, 220, 300].map((y, i) => {
                      const scale = 1 - i * 0.25;
                      return (
                        <g key={i}>
                          <circle cx={140 + i * 70} cy={100 + i * 20} r={4 * scale} fill="#f59e0b" />
                          <circle cx={660 - i * 70} cy={100 + i * 20} r={4 * scale} fill="#f59e0b" />
                        </g>
                      );
                    })}

                    {/* 道路中心白線 */}
                    <line x1="400" y1="200" x2="400" y2="320" stroke="#f0f6fc" strokeWidth="3" strokeDasharray="16 12" />

                    {/* 坑門工前面幾何表現 */}
                    {tunnelConfig.portalType === 'bamboo_cut' && (
                      <g>
                        <path d="M 80 320 Q 200 40, 400 30 Q 600 40, 720 320" fill="none" stroke="#10b981" strokeWidth="6" />
                        <text x="400" y="25" fill="#10b981" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          竹割型坑門 (斜面削剥最小化・景観緑化)
                        </text>
                      </g>
                    )}
                    {tunnelConfig.portalType === 'wall' && (
                      <g>
                        <rect x="70" y="40" width="660" height="40" fill="#30363d" stroke="#8b949e" strokeWidth="2" />
                        <text x="400" y="65" fill="#f0f6fc" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          面壁型重力式コンクリート坑門
                        </text>
                      </g>
                    )}
                    {tunnelConfig.portalType === 'bellmouth' && (
                      <g>
                        <ellipse cx="400" cy="180" rx="340" ry="160" fill="none" stroke="#38bdf8" strokeWidth="5" strokeDasharray="8 4" />
                        <ellipse cx="400" cy="180" rx="310" ry="145" fill="none" stroke="#38bdf8" strokeWidth="3" />
                        <text x="400" y="30" fill="#38bdf8" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          ベルマウス拡幅開口型 (微気圧波 54% 低減構造)
                        </text>
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 右ペイン: 道路トンネル技術基準 監査マトリクス & BIMエクスポート */}
        {/* ============================================================ */}
        {!isRightPaneOpen ? (
          <div className="w-8 bg-[#0d1117] border-l border-[#21262d] flex flex-col items-center py-2 z-30 shrink-0 select-none">
            <button
              onClick={() => setIsRightPaneOpen(true)}
              className="p-1.5 bg-[#161b22] hover:bg-[#10b981] hover:text-[#090d13] text-[#10b981] rounded border border-[#21262d] transition-all shadow"
              title="トンネル基準監査パネルを展開"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="[writing-mode:vertical-rl] text-[10px] font-mono text-[#10b981] mt-4 tracking-widest flex items-center gap-1 font-bold">
              TUNNEL AUDIT
            </span>
          </div>
        ) : (
        <div className="w-[380px] border-l border-[#21262d] bg-[#0d1117] flex flex-col shrink-0 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar select-none">
          {/* 監査ヘッダー */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                トンネル技術基準 リアルタイム監査
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.2 rounded border border-[#10b981]/30 font-bold">
                  PASS (6/6)
                </span>
                <button
                  onClick={() => setIsRightPaneOpen(false)}
                  className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors ml-1"
                  title="右パネルを折りたたむ"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-[11px] text-[#8b949e]">
              国交省道路トンネル技術基準・NEXCO設計施工要領に基づき、建築限界・換気・避難連絡坑・坑口斜面安定度を自動照査。
            </div>
          </div>

          {/* 監査マトリクス リスト */}
          <div className="space-y-2">
            {auditItems.map((item) => (
              <div key={item.id} className="p-2.5 rounded-lg border bg-[#161b22] border-[#21262d]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-1.5 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                    <span className="font-bold text-[#f0f6fc]">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-[#10b981]/30">
                    {item.status} ({item.marginRatio}%)
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[#8b949e] flex justify-between">
                  <span>{item.standard}</span>
                  <span className="text-[#38bdf8]">{item.actual}</span>
                </div>

                <div className="mt-1.5 text-[10px] text-[#8b949e] bg-[#090d13] p-1.5 rounded border border-[#21262d]">
                  {item.note}
                </div>
              </div>
            ))}
          </div>

          {/* AI施工・支保最適化提案 */}
          <div className="bg-[#161b22] border border-[#a855f7]/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#a855f7]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI支保工最適化提案 (Agent Tunnel-07)</span>
              </div>
              <span className="text-[10px] font-mono text-[#a855f7] bg-[#a855f7]/15 px-1.5 py-0.5 rounded">
                RECOMMENDED
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              STA.18+920 断層破砕帯（DIII区間）において、長尺鏡ボルト＋先進AGF注入工法を適用することで、掘削時の肌落ち崩壊確率を0.02%未満に抑え、インバート早期閉合により工期を18日間短縮可能です。
            </p>
            <div className="mt-2 pt-2 border-t border-[#30363d] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#10b981]">工期短縮: -18日</span>
              <span className="text-[#38bdf8]">工費削減: ▲2,400万円</span>
            </div>
          </div>

          {/* BIM/CIM エクスポート & 実ファイル保存ドック */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#f0f6fc]">
                <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>BIM/CIM 納品ファイル生成・ダウンロード</span>
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">国交省仕様</span>
            </div>

            {/* ダウンロード成功トースト */}
            {downloadSuccess && (
              <div className="mb-2 p-2 rounded bg-[#10b981]/20 border border-[#10b981] text-[#10b981] text-xs font-mono flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                <span>{downloadSuccess} をローカルに保存しました！</span>
              </div>
            )}

            <div className="space-y-2">
              {/* LandXML 1.2 */}
              <div className="bg-[#090d13] p-2.5 rounded border border-[#21262d] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold font-mono text-[#f0f6fc]">LandXML 1.2 トンネル構造体</div>
                  <div className="text-[10px] text-[#8b949e]">中心線形・覆工メッシュ・支保工属性</div>
                </div>
                <div className="flex items-center space-x-1.5 font-mono text-xs">
                  <button
                    onClick={() => handleCopy('landxml')}
                    className="p-1.5 bg-[#161b22] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded border border-[#30363d]"
                    title="XMLをクリップボードにコピー"
                  >
                    {copiedType === 'landxml' ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDownload('landxml')}
                    className="px-2.5 py-1.5 bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] font-bold rounded border border-[#38bdf8]/40 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.xml 保存</span>
                  </button>
                </div>
              </div>

              {/* IFC 4.3 */}
              <div className="bg-[#090d13] p-2.5 rounded border border-[#21262d] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold font-mono text-[#f0f6fc]">IFC 4.3 構造物モデル</div>
                  <div className="text-[10px] text-[#8b949e]">IFCTUNNEL / IFCTUNNELPART 準拠</div>
                </div>
                <div className="flex items-center space-x-1.5 font-mono text-xs">
                  <button
                    onClick={() => handleCopy('ifc')}
                    className="p-1.5 bg-[#161b22] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded border border-[#30363d]"
                    title="IFC STEP をクリップボードにコピー"
                  >
                    {copiedType === 'ifc' ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDownload('ifc')}
                    className="px-2.5 py-1.5 bg-[#a855f7]/15 hover:bg-[#a855f7]/25 text-[#a855f7] font-bold rounded border border-[#a855f7]/40 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.ifc 保存</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 構造物定期点検カルテ ＆ 50年LCC劣化予測モーダル */}
      <AssetManagementModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        activeProject={activeProject}
      />
    </div>
  );
};
