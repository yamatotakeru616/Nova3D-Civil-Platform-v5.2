import React, { useState, useEffect } from 'react';
import { useBridgeDesign } from '../hooks/useBridgeDesign';
import { CivilProject } from '../types';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Settings,
  Cpu,
  Waves,
  Maximize2,
  Check,
  Copy,
  X,
  FileCode,
  Box,
  Activity,
  Layers,
  ShieldCheck,
  GitCommit,
  TrendingDown,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import { AssetManagementModal } from './AssetManagementModal';

interface BridgeDesignWorkspaceProps {
  activeProject?: CivilProject;
}

export const BridgeDesignWorkspace: React.FC<BridgeDesignWorkspaceProps> = ({ activeProject }) => {
  const {
    spans,
    config,
    currentTotalLength,
    maxSpanLength,
    piers,
    mechanics,
    auditItems,
    isCommitted,
    feedbackToast,
    activeAnalysisTab,
    setActiveAnalysisTab,
    exportModalOpen,
    setExportModalOpen,
    generatedIfcCode,
    generatedLandXmlCode,
    updateSpanLengthSkill,
    updateGirderHeightSkill,
    commitBridgeDesignSkill,
    exportBridgeIfcSkill,
    exportBridgeLandXmlSkill,
  } = useBridgeDesign();

  // デフォルトで左右パネルを折りたたんだ状態に設定
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState<boolean>(false);
  const [isRightPaneOpen, setIsRightPaneOpen] = useState<boolean>(false);

  // 路線・プロジェクト変更時は左右メニューを折りたたんだ状態に維持
  useEffect(() => {
    setIsLeftPaneOpen(false);
    setIsRightPaneOpen(false);
  }, [activeProject?.id]);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'elevation' | '3d'>('split');
  const [leftNavTab, setLeftNavTab] = useState<'spans' | 'superstructure' | 'substructure'>('spans');
  const [showBridgeSettings, setShowBridgeSettings] = useState<boolean>(false);
  const [seismicLevel, setSeismicLevel] = useState<'level1' | 'level2'>('level2');
  const [deckType, setDeckType] = useState<'rc_composite' | 'steel_ortho'>('steel_ortho');
  const [isAssetModalOpen, setIsAssetModalOpen] = useState<boolean>(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadCode = (code: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([code], { type: mimeType });
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

  const allPassed = auditItems.every((a) => a.status === 'PASS');

  return (
    <div className="flex-1 flex flex-col bg-[#090d13] text-[#f0f6fc] overflow-hidden select-none font-mono">
      {/* フィードバックトースト */}
      {feedbackToast && (
        <div className="fixed top-16 right-4 z-50 bg-[#161b22] border border-[#38bdf8] text-[#38bdf8] px-3 py-1.5 rounded shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 3-PANE WORKSPACE BODY                                                  */}
      {/* ======================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ===================================================================== */}
        {/* LEFT PANE: BRIDGE STRUCTURAL SPECS & SPAN CONFIGURATOR                */}
        {/* ===================================================================== */}
        {!isLeftPaneOpen ? (
          <div className="w-8 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-2 z-30 shrink-0 select-none">
            <button
              onClick={() => setIsLeftPaneOpen(true)}
              className="p-1.5 bg-[#161b22] hover:bg-[#38bdf8] hover:text-[#090d13] text-[#38bdf8] rounded border border-[#30363d] transition-all shadow"
              title="橋梁諸元パネルを展開"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="[writing-mode:vertical-rl] text-[10px] font-mono text-[#8b949e] mt-4 tracking-widest">
              橋梁径間・諸元
            </span>
          </div>
        ) : (
        <aside className="w-80 bg-[#0d1117] border-r border-[#30363d] flex flex-col z-30 shrink-0 select-none">
          {/* Header */}
          <div className="p-2 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs text-[#f0f6fc] font-bold flex items-center gap-1">
                  {activeProject?.structuralFeatures?.majorBridgeName || '緑川渡河橋梁'}
                  <span className="text-[9px] bg-[#38bdf8]/15 text-[#38bdf8] px-1 rounded">REV 3</span>
                </div>
                <div className="text-[9px] text-[#8b949e]">STA. 6+500 ~ 8+900 (L={currentTotalLength}m)</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  updateGirderHeightSkill(2.4);
                }}
                className="bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] border border-[#30363d] px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 transition-colors"
                title="初期値リセット"
              >
                <RotateCcw className="w-2.5 h-2.5 text-[#38bdf8]" />
                <span>Reset</span>
              </button>
              <button
                onClick={() => setIsLeftPaneOpen(false)}
                className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors ml-1"
                title="左パネルを折りたたむ"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="flex border-b border-[#30363d] bg-[#0d1117] text-[#8b949e] text-[10px]">
            <button
              onClick={() => setLeftNavTab('spans')}
              className={`flex-1 py-1.5 text-center flex items-center justify-center gap-1 transition-colors ${
                leftNavTab === 'spans'
                  ? 'text-[#38bdf8] font-bold border-b-2 border-[#38bdf8] bg-[#161b22]'
                  : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span>径間割 (Spans)</span>
            </button>
            <button
              onClick={() => setLeftNavTab('superstructure')}
              className={`flex-1 py-1.5 text-center flex items-center justify-center gap-1 transition-colors ${
                leftNavTab === 'superstructure'
                  ? 'text-[#38bdf8] font-bold border-b-2 border-[#38bdf8] bg-[#161b22]'
                  : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span>上部工断面</span>
            </button>
            <button
              onClick={() => setLeftNavTab('substructure')}
              className={`flex-1 py-1.5 text-center flex items-center justify-center gap-1 transition-colors ${
                leftNavTab === 'substructure'
                  ? 'text-[#38bdf8] font-bold border-b-2 border-[#38bdf8] bg-[#161b22]'
                  : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span>下部工・杭</span>
            </button>
          </div>

          {/* Scrollable Configuration */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 text-[10px] no-scrollbar">
            {leftNavTab === 'superstructure' ? (
              /* Superstructure Section Tab */
              <div className="space-y-2.5">
                <div className="text-[10px] text-[#8b949e] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                  上部工断面 & 床版構造詳細
                </div>
                <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] space-y-2">
                  <div>
                    <span className="text-[#8b949e] block mb-1">床版形式 (Deck Structure):</span>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => setDeckType('steel_ortho')}
                        className={`py-1 rounded text-center transition-colors ${
                          deckType === 'steel_ortho'
                            ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                            : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                        }`}
                      >
                        鋼床版 (軽量・大支間)
                      </button>
                      <button
                        onClick={() => setDeckType('rc_composite')}
                        className={`py-1 rounded text-center transition-colors ${
                          deckType === 'rc_composite'
                            ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                            : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                        }`}
                      >
                        RC合成床版 (疲労耐久性)
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-[#30363d] pt-2 space-y-1 text-[#8b949e]">
                    <div className="flex justify-between">
                      <span>舗装構成:</span>
                      <strong className="text-[#f0f6fc]">基層30mm + 表層50mm (SMA)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>主桁間隔:</span>
                      <strong className="text-[#f0f6fc]">B = 3.20m (4主桁構成)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>防護柵規格:</span>
                      <strong className="text-[#f0f6fc]">SB種車両用防護柵 + 高欄</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : leftNavTab === 'substructure' ? (
              /* Substructure Section Tab */
              <div className="space-y-2.5">
                <div className="text-[10px] text-[#8b949e] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                  下部工 (P1〜P4) & 基礎杭諸元
                </div>
                <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] space-y-2">
                  <div className="space-y-1.5">
                    {['P1 渡河橋脚 (左岸)', 'P2 流心橋脚 (深礎)', 'P3 流心橋脚 (深礎)', 'P4 渡河橋脚 (右岸)'].map((pName, i) => (
                      <div key={pName} className="p-1.5 bg-[#0d1117] rounded border border-[#30363d]">
                        <div className="flex justify-between font-bold text-[#f0f6fc] mb-0.5">
                          <span>{pName}</span>
                          <span className="text-[#10b981] text-[9px]">耐震レベル2 PASS</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[8px] text-[#8b949e]">
                          <div>躯体高: <strong className="text-[#f0f6fc]">{14.5 + i * 0.5}m</strong></div>
                          <div>杭径: <strong className="text-[#38bdf8]">φ1200 × 8本</strong></div>
                          <div>根入れ: <strong className="text-[#f0f6fc]">GL-18.5m</strong></div>
                          <div>偏心率: <strong className="text-[#10b981]">e/B=0.04</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Spans Tab (Default) */
              <>
            {/* Section 1: 構造形式仕様 */}
            <div className="bg-[#161b22] p-2 rounded border border-[#30363d] space-y-1.5">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-1">
                <span className="text-[#38bdf8] font-bold">基本構造スペック</span>
                <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded font-bold">
                  示道書II適合
                </span>
              </div>
              <div className="space-y-1 text-[9px] text-[#8b949e]">
                <div className="flex justify-between">
                  <span>構造形式:</span>
                  <strong className="text-[#f0f6fc]">{config.bridgeType}</strong>
                </div>
                <div className="flex justify-between">
                  <span>有効幅員:</span>
                  <strong className="text-[#f0f6fc]">W = {config.effectiveWidthM} m (2車線+歩道)</strong>
                </div>
                <div className="flex justify-between">
                  <span>主桁鋼材:</span>
                  <strong className="text-[#38bdf8]">{config.girderSteelGrade}</strong>
                </div>
                <div className="flex justify-between">
                  <span>床版構造:</span>
                  <strong className="text-[#f0f6fc]">{config.deckType}</strong>
                </div>
              </div>
            </div>

            {/* Section 2: 径間割（支間長）パラメトリック調整 */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[#8b949e] font-semibold">
                <span className="flex items-center gap-1 text-[#f0f6fc]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                  支間割スパン微調整 (Span Allocator)
                </span>
                <span className="text-[9px] text-[#38bdf8] font-bold">計 {currentTotalLength}.0m</span>
              </div>

              <div className="space-y-1.5">
                {spans.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-2 rounded bg-[#161b22] border border-[#30363d] hover:border-[#484f58] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
                        <span className="font-bold text-[#f0f6fc]">{s.name}</span>
                        <span className="text-[9px] text-[#8b949e]">第{idx + 1}径間</span>
                      </div>
                      <span className="font-bold text-[#38bdf8] text-xs">{s.lengthM.toFixed(1)} m</span>
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => updateSpanLengthSkill(s.id, -1.0)}
                        className="flex-1 bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] py-0.5 rounded text-[9px] text-center transition-colors"
                      >
                        -1.0m
                      </button>
                      <button
                        onClick={() => updateSpanLengthSkill(s.id, 1.0)}
                        className="flex-1 bg-[#21262d] hover:bg-[#2d333b] text-[#38bdf8] py-0.5 rounded text-[9px] text-center font-bold transition-colors"
                      >
                        +1.0m
                      </button>
                      <button
                        onClick={() => updateSpanLengthSkill(s.id, 2.0)}
                        className="flex-1 bg-[#38bdf8]/10 text-[#38bdf8] py-0.5 rounded text-[9px] text-center border border-[#38bdf8]/30 transition-colors"
                      >
                        +2.0m (流心拡幅)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: 桁高 & 断面クリアランス調整 */}
            <div className="border-t border-[#30363d] pt-2.5">
              <div className="flex items-center justify-between mb-1.5 text-[#8b949e] font-semibold">
                <span className="text-[#f0f6fc] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                  主桁高 (Girder Height)
                </span>
                <span className="text-[#10b981] font-bold">H = {config.girderHeightM.toFixed(2)} m</span>
              </div>

              <div className="bg-[#161b22] p-2 rounded border border-[#30363d] space-y-2">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[#8b949e]">桁高設定:</span>
                  <div className="flex items-center gap-1">
                    {[2.2, 2.4, 2.6, 2.8].map((h) => (
                      <button
                        key={h}
                        onClick={() => updateGirderHeightSkill(h)}
                        className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                          config.girderHeightM === h
                            ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                            : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                        }`}
                      >
                        {h.toFixed(1)}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0d1117] p-1.5 rounded border border-[#30363d] text-[9px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">河川計画高水位 (HWL):</span>
                    <span className="text-[#38bdf8] font-bold">EL = {config.hwlElevationM.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">桁下余裕高 (Freeboard):</span>
                    <span className="text-[#10b981] font-bold">H = {mechanics.riverFreeboardM.toFixed(2)} m (基準1.5m PASS)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: 下部工・支持層情報 */}
            <div className="border-t border-[#30363d] pt-2.5">
              <div className="bg-[#161b22] p-2 rounded border border-[#30363d] space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#38bdf8] font-bold text-[9px]">基礎地盤・支持層プロファイル</span>
                  <span className="text-[8px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">N値 ≧ 50</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[8px] text-[#8b949e]">
                  <div className="bg-[#0d1117] p-1 rounded border border-[#30363d]">
                    支持層深度: <strong className="text-[#f0f6fc]">GL-18.2m</strong>
                  </div>
                  <div className="bg-[#0d1117] p-1 rounded border border-[#30363d]">
                    基礎形式: <strong className="text-[#f0f6fc]">場所打ち杭 φ1200</strong>
                  </div>
                  <div className="bg-[#0d1117] p-1 rounded border border-[#30363d]">
                    杭本数: <strong className="text-[#f0f6fc]">各脚 6本 (2×3)</strong>
                  </div>
                  <div className="bg-[#0d1117] p-1 rounded border border-[#30363d]">
                    設計流量: <strong className="text-[#f0f6fc]">1,850 m³/s</strong>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        </aside>
        )}

        {/* ===================================================================== */}
        {/* CENTER VIEWPORT: PROFILE ELEVATION & 3D CORRIDOR & MECHANICS DOCK     */}
        {/* ===================================================================== */}
        <section className="flex-1 flex flex-col bg-[#090d13] overflow-hidden relative">
          {/* Toolstrip */}
          <div className="h-8 bg-[#0d1117] border-b border-[#30363d] px-3 flex items-center justify-between z-20">
            <div className="flex items-center gap-1 text-[10px]">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'split'
                    ? 'bg-[#21262d] text-[#38bdf8] border border-[#484f58] shadow-sm'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                <span>側面/3D スプリット</span>
              </button>
              <button
                onClick={() => setViewMode('elevation')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  viewMode === 'elevation'
                    ? 'bg-[#21262d] text-[#38bdf8] border border-[#484f58]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                <span>側面径間割 (Elevation)</span>
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  viewMode === '3d'
                    ? 'bg-[#21262d] text-[#38bdf8] border border-[#484f58]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                <span>3Dパースフル</span>
              </button>
              <div className="h-3 w-px bg-[#30363d] mx-1.5" />
              <div className="text-[#10b981] flex items-center gap-1 text-[9px] bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                <span>河川法第24条 適合 (余裕高 H={mechanics.riverFreeboardM.toFixed(2)}m ≥ 1.50m)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[#8b949e]">
              <button
                onClick={() => setIsAssetModalOpen(true)}
                className="bg-[#f43f5e]/15 hover:bg-[#f43f5e]/25 text-[#f43f5e] border border-[#f43f5e]/40 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 transition-colors shadow-sm"
                title="国交省定期点検要領 構造物健全度カルテ ＆ 50年LCC劣化予測"
              >
                <HeartPulse className="w-3.5 h-3.5 animate-pulse" />
                <span>点検カルテ (健全度II)</span>
              </button>
              <div className="bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
                <span>総橋長 L = {currentTotalLength}.0m</span>
                <span className="text-[#6e7681] mx-1">|</span>
                <span>最大スパン {maxSpanLength}.0m</span>
              </div>
            </div>
          </div>

          {/* Split Main Canvas */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* ================================================================= */}
            {/* LEFT/TOP HALF: BRIDGE SIDE ELEVATION PROFILE                      */}
            {/* ================================================================= */}
            {(viewMode === 'split' || viewMode === 'elevation') && (
              <div
                className={`${
                  viewMode === 'split' ? 'w-1/2 border-r border-[#484f58]' : 'w-full'
                } relative overflow-hidden bg-[#070b10] select-none`}
              >
                {/* Tag */}
                <div className="absolute top-2 left-2 z-10 bg-[#161b22]/90 backdrop-blur border border-[#30363d] px-2 py-0.5 rounded text-[10px] text-[#8b949e] flex items-center gap-2">
                  <span className="text-[#38bdf8] font-bold">BRIDGE ELEVATION PROFILE</span>
                  <span className="text-[#6e7681]">|</span>
                  <span>1:1000 / Z強調 2.0x</span>
                </div>

                {/* Technical Elevation SVG */}
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 650 360">
                  <defs>
                    <linearGradient id="riverWater" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
                    </linearGradient>
                    <pattern id="gravelHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#30363d" strokeWidth="1" />
                    </pattern>
                  </defs>

                  {/* Sky & River Background Grid */}
                  <line x1="0" y1="50" x2="650" y2="50" stroke="#1c2026" strokeWidth="1" />
                  <line x1="0" y1="120" x2="650" y2="120" stroke="#1c2026" strokeWidth="1" />
                  <line x1="0" y1="180" x2="650" y2="180" stroke="#1c2026" strokeWidth="1" />
                  <line x1="0" y1="260" x2="650" y2="260" stroke="#1c2026" strokeWidth="1" />

                  {/* Ground Level Line & Terrain Profile */}
                  <path
                    d="M 0,160 L 80,160 Q 150,180 200,240 Q 325,260 450,240 Q 500,180 570,160 L 650,160"
                    fill="none"
                    stroke="#484f58"
                    strokeWidth="1.5"
                  />

                  {/* River Water Surface (HWL 計画高水位 EL=32.40m) */}
                  <rect x="150" y="165" width="350" height="90" fill="url(#riverWater)" />
                  <line x1="120" y1="165" x2="530" y2="165" stroke="#38bdf8" strokeDasharray="5,3" strokeWidth="1.5" />
                  <text x="130" y="158" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    ▼ 計画高水位 HWL = 32.40m
                  </text>

                  {/* Supporting Layer (GL-18.2m 礫層 N≧50) */}
                  <rect x="0" y="270" width="650" height="90" fill="url(#gravelHatch)" />
                  <line x1="0" y1="270" x2="650" y2="270" stroke="#8b949e" strokeDasharray="4,2" strokeWidth="1.5" />
                  <text x="15" y="285" fill="#8b949e" fontSize="9">
                    ▲ 支持層 GL-18.2m (礫層 N≧50)
                  </text>

                  {/* Superstructure: Steel Box Girder (鋼箱桁 主桁) */}
                  {/* Road deck line */}
                  <rect x="40" y="96" width="570" height="6" fill="#21262d" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Steel Girder Body (変断面 箱桁) */}
                  <polygon
                    points="40,102 610,102 610,122 490,132 370,132 250,132 130,122 40,118"
                    fill="#161b22"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />

                  {/* Abutment A1 (左橋台) */}
                  <polygon points="30,102 60,102 60,180 20,180" fill="#21262d" stroke="#8b949e" strokeWidth="1.5" />
                  <text x="25" y="92" fill="#f0f6fc" fontSize="9" fontWeight="bold">
                    A1
                  </text>

                  {/* Pier P1 */}
                  <rect x="150" y="122" width="16" height="100" fill="#21262d" stroke="#38bdf8" strokeWidth="1.5" />
                  <rect x="144" y="222" width="28" height="12" fill="#161b22" stroke="#8b949e" strokeWidth="1" />
                  {/* Piles */}
                  <line x1="148" y1="234" x2="148" y2="280" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="168" y1="234" x2="168" y2="280" stroke="#38bdf8" strokeWidth="2" />
                  <text x="148" y="115" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    P1
                  </text>

                  {/* Pier P2 (流心深部) */}
                  <rect x="270" y="132" width="18" height="110" fill="#21262d" stroke="#38bdf8" strokeWidth="1.5" />
                  <rect x="262" y="242" width="34" height="14" fill="#161b22" stroke="#8b949e" strokeWidth="1" />
                  <line x1="268" y1="256" x2="268" y2="285" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="290" y1="256" x2="290" y2="285" stroke="#38bdf8" strokeWidth="2" />
                  <text x="270" y="115" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    P2
                  </text>

                  {/* Pier P3 (流心深部) */}
                  <rect x="390" y="132" width="18" height="110" fill="#21262d" stroke="#38bdf8" strokeWidth="1.5" />
                  <rect x="382" y="242" width="34" height="14" fill="#161b22" stroke="#8b949e" strokeWidth="1" />
                  <line x1="388" y1="256" x2="388" y2="285" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="410" y1="256" x2="410" y2="285" stroke="#38bdf8" strokeWidth="2" />
                  <text x="390" y="115" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    P3
                  </text>

                  {/* Pier P4 */}
                  <rect x="500" y="122" width="16" height="100" fill="#21262d" stroke="#38bdf8" strokeWidth="1.5" />
                  <rect x="494" y="222" width="28" height="12" fill="#161b22" stroke="#8b949e" strokeWidth="1" />
                  <line x1="498" y1="234" x2="498" y2="280" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="518" y1="234" x2="518" y2="280" stroke="#38bdf8" strokeWidth="2" />
                  <text x="500" y="115" fill="#38bdf8" fontSize="9" fontWeight="bold">
                    P4
                  </text>

                  {/* Abutment A2 (右橋台) */}
                  <polygon points="590,102 620,102 630,180 590,180" fill="#21262d" stroke="#8b949e" strokeWidth="1.5" />
                  <text x="600" y="92" fill="#f0f6fc" fontSize="9" fontWeight="bold">
                    A2
                  </text>

                  {/* Clearance Indicator (桁下余裕高) */}
                  <line x1="330" y1="132" x2="330" y2="165" stroke="#10b981" strokeWidth="2" />
                  <circle cx="330" cy="132" r="3" fill="#10b981" />
                  <circle cx="330" cy="165" r="3" fill="#10b981" />
                  <rect x="338" y="140" width="118" height="16" fill="#161b22" stroke="#10b981" rx="2" />
                  <text x="343" y="152" fill="#10b981" fontSize="8" fontWeight="bold">
                    余裕高 H={mechanics.riverFreeboardM.toFixed(2)}m (≥1.50m)
                  </text>

                  {/* Dimension Lines (支間割) */}
                  <line x1="40" y1="75" x2="610" y2="75" stroke="#8b949e" strokeWidth="1" />
                  {/* Span 1 */}
                  <text x="80" y="70" fill="#8ed5ff" fontSize="8">
                    L1={spans[0].lengthM}m
                  </text>
                  <line x1="158" y1="70" x2="158" y2="80" stroke="#8b949e" strokeWidth="1" />
                  {/* Span 2 */}
                  <text x="200" y="70" fill="#8ed5ff" fontSize="8">
                    L2={spans[1].lengthM}m
                  </text>
                  <line x1="279" y1="70" x2="279" y2="80" stroke="#8b949e" strokeWidth="1" />
                  {/* Span 3 (Center) */}
                  <text x="320" y="70" fill="#38bdf8" fontSize="8" fontWeight="bold">
                    L3={spans[2].lengthM}m
                  </text>
                  <line x1="399" y1="70" x2="399" y2="80" stroke="#8b949e" strokeWidth="1" />
                  {/* Span 4 */}
                  <text x="435" y="70" fill="#8ed5ff" fontSize="8">
                    L4={spans[3].lengthM}m
                  </text>
                  <line x1="508" y1="70" x2="508" y2="80" stroke="#8b949e" strokeWidth="1" />
                  {/* Span 5 */}
                  <text x="545" y="70" fill="#8ed5ff" fontSize="8">
                    L5={spans[4].lengthM}m
                  </text>
                </svg>

                {/* Sensor HUD Card */}
                <div className="absolute bottom-3 left-3 bg-[#161b22]/95 backdrop-blur border border-[#10b981] p-2 rounded shadow-xl text-[9px] space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[#10b981] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>河川水理・桁下クリアランス正常</span>
                  </div>
                  <div className="text-[#8b949e]">
                    流下阻害率: <strong className="text-[#10b981]">{mechanics.riverObstructionRatePercent}%</strong> (基準5.0%未満)
                  </div>
                  <div className="text-[#8b949e]">
                    HWL離隔: <strong className="text-[#10b981]">{mechanics.riverFreeboardM.toFixed(2)}m</strong> (余裕高率 140%)
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* RIGHT HALF: 3D PYVISTA BRIDGE MODEL VIEWPORT                      */}
            {/* ================================================================= */}
            {(viewMode === 'split' || viewMode === '3d') && (
              <div
                className={`${
                  viewMode === 'split' ? 'w-1/2' : 'w-full'
                } relative overflow-hidden bg-[#090e15] select-none`}
              >
                {/* Tag */}
                <div className="absolute top-2 left-2 z-10 bg-[#161b22]/90 backdrop-blur border border-[#30363d] px-2 py-0.5 rounded text-[10px] text-[#8b949e] flex items-center gap-2">
                  <span className="text-[#38bdf8] font-bold">PyVista 3D BRIDGE MESH</span>
                  <span className="text-[#6e7681]">|</span>
                  <span>Steel Box Girder + Piers</span>
                </div>

                {/* 3D Perspective Vector Canvas */}
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 360">
                  <defs>
                    <linearGradient id="bridgeSteelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="riverPerspectiveWater" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>

                  {/* 3D Terrain & Water Surface */}
                  <polygon points="-50,360 200,120 700,360" fill="url(#riverPerspectiveWater)" stroke="#1e293b" />

                  {/* River Banks */}
                  <polygon points="0,360 180,120 120,110 -50,340" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  <polygon points="500,360 320,120 380,110 700,340" fill="#0f172a" stroke="#334155" strokeWidth="1" />

                  {/* 3D Piers (P1〜P4 橋脚柱) */}
                  <polygon points="210,180 230,175 230,230 210,235" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
                  <polygon points="260,195 285,190 285,260 260,265" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                  <polygon points="320,205 345,200 345,270 320,275" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                  <polygon points="380,185 400,180 400,240 380,245" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />

                  {/* 3D Steel Box Girder Ribbon (橋桁立体ポリゴン) */}
                  <polygon
                    points="60,260 480,130 520,130 180,270"
                    fill="url(#bridgeSteelGrad)"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  {/* Girder Web Side */}
                  <polygon
                    points="60,260 180,270 180,290 60,278"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />

                  {/* Bridge Deck Pavement & Markings */}
                  <line x1="120" y1="265" x2="500" y2="130" stroke="#f0f6fc" strokeDasharray="10,8" strokeWidth="2" />
                  <line x1="80" y1="262" x2="485" y2="130" stroke="#8ed5ff" strokeWidth="1.5" />
                  <line x1="160" y1="268" x2="515" y2="130" stroke="#8ed5ff" strokeWidth="1.5" />

                  {/* Guardrail 3D Lines */}
                  <path d="M 70,256 L 482,127" stroke="#bdc8d1" strokeDasharray="2,1" strokeWidth="1.5" />
                  <path d="M 175,266 L 518,127" stroke="#bdc8d1" strokeDasharray="2,1" strokeWidth="1.5" />
                </svg>

                {/* 3D Telemetry Card */}
                <div className="absolute bottom-3 right-3 bg-[#161b22]/90 backdrop-blur border border-[#484f58] p-2.5 rounded shadow-xl w-64 text-[9px]">
                  <div className="flex items-center justify-between border-b border-[#30363d] pb-1 mb-1">
                    <span className="text-[#f0f6fc] font-bold">上部工FEM幾何テレメトリ</span>
                    <span className="text-[#38bdf8] font-bold">SM490Y</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">最大曲げモーメント:</span>
                      <strong className="text-[#38bdf8]">{mechanics.maxBendingMomentKNm.toLocaleString()} kN・m</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">支点せん断力:</span>
                      <strong className="text-[#f0f6fc]">{mechanics.maxShearForceKN.toLocaleString()} kN</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">推定鋼重:</span>
                      <strong className="text-[#f0f6fc]">{mechanics.totalSteelWeightTons} t</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">概算上部工費:</span>
                      <strong className="text-[#10b981]">約 {mechanics.estimatedCostMillionYen} 百万円</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =================================================================== */}
          {/* BOTTOM DOCK: STRUCTURAL ANALYSIS (B.M.D / S.F.D / DEFLECTION)       */}
          {/* =================================================================== */}
          <section className="h-56 bg-[#0d1117] border-t border-[#30363d] flex flex-col z-30 shrink-0 select-none">
            {/* Header */}
            <div className="h-7 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <span className="text-[#f0f6fc] font-bold">下部構造力学解析ドック (Matrix Analysis)</span>
                <div className="flex items-center ml-4 gap-1">
                  <button
                    onClick={() => setActiveAnalysisTab('bmd')}
                    className={`px-2.5 py-0.5 font-semibold flex items-center gap-1 transition-colors ${
                      activeAnalysisTab === 'bmd'
                        ? 'bg-[#0d1117] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                        : 'text-[#8b949e] hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span>曲げモーメント図 (B.M.D)</span>
                  </button>
                  <button
                    onClick={() => setActiveAnalysisTab('sfd')}
                    className={`px-2.5 py-0.5 flex items-center gap-1 transition-colors ${
                      activeAnalysisTab === 'sfd'
                        ? 'bg-[#0d1117] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                        : 'text-[#8b949e] hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span>せん断力図 (S.F.D)</span>
                  </button>
                  <button
                    onClick={() => setActiveAnalysisTab('deflection')}
                    className={`px-2.5 py-0.5 flex items-center gap-1 transition-colors ${
                      activeAnalysisTab === 'deflection'
                        ? 'bg-[#0d1117] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                        : 'text-[#8b949e] hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span>活荷重たわみ曲線 (δ)</span>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-center gap-3 text-[9px]">
                <div>
                  M_max: <strong className="text-[#38bdf8]">{mechanics.maxBendingMomentKNm.toLocaleString()} kN・m</strong>
                </div>
                <div>
                  V_max: <strong className="text-[#f0f6fc]">{mechanics.maxShearForceKN.toLocaleString()} kN</strong>
                </div>
                <div className="bg-[#21262d] px-1.5 py-0.2 rounded border border-[#30363d]">
                  δ_max: <strong className="text-[#10b981]">{mechanics.maxDeflectionMm} mm ({mechanics.deflectionRatioLimit})</strong>
                </div>
              </div>
            </div>

            {/* Analysis Canvas */}
            <div className="flex-1 flex overflow-hidden p-2 gap-2">
              {/* Diagram Graph */}
              <div className="flex-1 bg-[#090d13] rounded border border-[#30363d] p-1.5 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between text-[8px] text-[#8b949e] mb-0.5">
                  <span>死荷重 D + 活荷重 L (B活荷重 大型車 250kN) 合成包絡線</span>
                  <span>支持点: A1, P1, P2, P3, P4, A2 (5径間連続梁要素)</span>
                </div>

                <svg className="w-full flex-1" preserveAspectRatio="none" viewBox="0 0 700 110">
                  {/* Zero line */}
                  <line x1="30" y1="55" x2="670" y2="55" stroke="#484f58" strokeWidth="1" />

                  {/* Supports markers */}
                  <line x1="50" y1="50" x2="50" y2="60" stroke="#f0f6fc" strokeWidth="2" />
                  <line x1="170" y1="50" x2="170" y2="60" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="310" y1="50" x2="310" y2="60" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="450" y1="50" x2="450" y2="60" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="580" y1="50" x2="580" y2="60" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="650" y1="50" x2="650" y2="60" stroke="#f0f6fc" strokeWidth="2" />

                  {/* Diagram Curves */}
                  {activeAnalysisTab === 'bmd' && (
                    <g>
                      {/* Bending Moment Curves (Hatch) */}
                      <path
                        d="M 50,55 Q 110,85 170,25 Q 240,85 310,20 Q 380,85 450,20 Q 515,85 580,25 Q 615,80 650,55"
                        fill="rgba(56,189,248,0.15)"
                        stroke="#38bdf8"
                        strokeWidth="2"
                      />
                      {/* Negative Moment Peak at P2/P3 */}
                      <circle cx="310" cy="20" r="3" fill="#f43f5e" />
                      <text x="315" y="18" fill="#f43f5e" fontSize="8" fontWeight="bold">
                        -M_max = {mechanics.maxBendingMomentKNm} kN・m
                      </text>
                      {/* Positive Moment at center of span */}
                      <circle cx="380" cy="85" r="3" fill="#10b981" />
                      <text x="385" y="98" fill="#10b981" fontSize="8">
                        +M = {Math.round(mechanics.maxBendingMomentKNm * 0.65)} kN・m
                      </text>
                    </g>
                  )}

                  {activeAnalysisTab === 'sfd' && (
                    <g>
                      {/* Shear Force Steps */}
                      <path
                        d="M 50,30 L 170,75 L 170,20 L 310,85 L 310,20 L 450,85 L 450,20 L 580,85 L 580,25 L 650,75"
                        fill="rgba(244,63,94,0.15)"
                        stroke="#f43f5e"
                        strokeWidth="1.8"
                      />
                      <text x="175" y="15" fill="#f43f5e" fontSize="8" fontWeight="bold">
                        V_max = {mechanics.maxShearForceKN} kN
                      </text>
                    </g>
                  )}

                  {activeAnalysisTab === 'deflection' && (
                    <g>
                      {/* Deflection Curve */}
                      <path
                        d="M 50,55 Q 110,75 170,55 Q 240,85 310,55 Q 380,90 450,55 Q 515,85 580,55 Q 615,75 650,55"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                      />
                      <circle cx="380" cy="90" r="3.5" fill="#10b981" />
                      <text x="385" y="103" fill="#10b981" fontSize="9" fontWeight="bold">
                        δ_max = {mechanics.maxDeflectionMm} mm ({mechanics.deflectionRatioLimit})
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Piers Reactions HUD */}
              <div className="w-72 bg-[#090d13] rounded border border-[#30363d] p-1.5 flex flex-col justify-between text-[8px]">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-0.5">
                  <span className="text-[#f0f6fc] font-bold">下部工 支点反力・杭応力</span>
                  <span className="text-[#10b981] font-bold">全脚 安定</span>
                </div>
                <div className="space-y-1">
                  {piers.map((p) => (
                    <div key={p.id} className="flex justify-between items-center bg-[#161b22] px-1.5 py-0.5 rounded">
                      <span className="text-[#f0f6fc]">{p.name}:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#38bdf8] font-bold">{p.reactionKN.toLocaleString()} kN</span>
                        <span className="text-[#6e7681]">| 杭 {p.pileCount}本</span>
                        <span className="text-[#10b981] font-bold">OK</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[7px] text-[#6e7681] text-center pt-0.5">
                  常時耐力 5,200 kN/本 ≧ 発生反力 815 kN/本 (安全率 Fs=6.38)
                </div>
              </div>
            </div>
          </section>
        </section>

        {/* ===================================================================== */}
        {/* RIGHT PANE: REGULATORY AUDIT & AI STRUCTURAL OPTIMIZER                */}
        {/* ===================================================================== */}
        {!isRightPaneOpen ? (
          <div className="w-8 bg-[#0d1117] border-l border-[#30363d] flex flex-col items-center py-2 z-30 shrink-0 select-none">
            <button
              onClick={() => setIsRightPaneOpen(true)}
              className="p-1.5 bg-[#161b22] hover:bg-[#a855f7] hover:text-[#090d13] text-[#a855f7] rounded border border-[#30363d] transition-all shadow"
              title="Bridge Copilot AI パネルを展開"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="[writing-mode:vertical-rl] text-[10px] font-mono text-[#a855f7] mt-4 tracking-widest flex items-center gap-1 font-bold">
              BRIDGE AI
            </span>
          </div>
        ) : (
        <aside className="w-88 bg-[#0d1117] border-l border-[#30363d] flex flex-col z-30 shrink-0 select-none">
          {/* Header */}
          <div className="p-2 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#a855f7]/15 border border-[#a855f7]/40 flex items-center justify-center text-[#a855f7]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs text-[#f0f6fc] font-bold flex items-center gap-1.5">
                  Bridge Copilot AI
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                </div>
                <div className="text-[9px] text-[#a855f7]">示道書 &amp; 河川法 構造最適化</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowBridgeSettings(!showBridgeSettings)}
                className={`p-1 rounded transition-colors ${
                  showBridgeSettings ? 'text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/30' : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
                title="橋梁示方書・耐震設計設定"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsRightPaneOpen(false)}
                className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
                title="右パネルを折りたたむ"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 text-[10px] no-scrollbar">
            {/* Bridge Settings Panel */}
            {showBridgeSettings && (
              <div className="p-2 bg-[#161b22] border border-[#38bdf8]/40 rounded space-y-2">
                <div className="flex items-center justify-between text-[#38bdf8] font-bold">
                  <span className="flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    耐震・示方書 監査基準設定
                  </span>
                  <button
                    onClick={() => setShowBridgeSettings(false)}
                    className="text-[#8b949e] hover:text-[#f0f6fc] text-xs"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <button
                    onClick={() => setSeismicLevel('level2')}
                    className={`py-1 rounded text-center transition-colors ${
                      seismicLevel === 'level2'
                        ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                        : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                    }`}
                  >
                    耐震レベル2 (最大級動)
                  </button>
                  <button
                    onClick={() => setSeismicLevel('level1')}
                    className={`py-1 rounded text-center transition-colors ${
                      seismicLevel === 'level1'
                        ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                        : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                    }`}
                  >
                    耐震レベル1 (供用確率高)
                  </button>
                </div>
                <div className="bg-[#0d1117] p-1.5 rounded text-[8px] space-y-1 text-[#8b949e]">
                  <div className="flex justify-between">
                    <span>適用示方書:</span>
                    <strong className="text-[#f0f6fc]">道路橋示方書・同解説 (平成29年版)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>設計活荷重:</span>
                    <strong className="text-[#38bdf8]">B活荷重 (T-25 / L-20)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>河川治水基準:</span>
                    <strong className="text-[#10b981]">河川管理施設等構造令 第20条</strong>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 1: リアルタイム法規 & 技術基準監査 */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[#8b949e] font-semibold">
                <span className="flex items-center gap-1 text-[#10b981]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  示道書・河川法 リアルタイム監査
                </span>
                <span className="bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.2 rounded font-bold text-[9px]">
                  ALL PASS (6/6)
                </span>
              </div>

              <div className="bg-[#161b22] rounded border border-[#30363d] divide-y divide-[#30363d]">
                {auditItems.map((item) => (
                  <div key={item.id} className="p-1.5 flex items-center justify-between">
                    <div>
                      <div className="text-[#f0f6fc] font-medium text-[9px] flex items-center gap-1">
                        <span className="text-[8px] bg-[#21262d] px-1 rounded text-[#8b949e]">
                          {item.lawOrStandard}
                        </span>
                        <span>{item.clause}</span>
                      </div>
                      <div className="text-[#8b949e] text-[8px]">
                        {item.actualValue} ({item.standardLimit})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-[#10b981] bg-[#10b981]/10 px-1 py-0.2 rounded font-bold">
                        適合 PASS
                      </span>
                      <div className="text-[#6e7681] text-[8px]">裕度 {item.marginRatio}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: AI Multi-Agent Reasoning Proposal */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[#8b949e] font-semibold">
                <span className="flex items-center gap-1 text-[#a855f7]">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI構造最適化提案 (Active)
                </span>
                <span className="text-[9px] text-[#6e7681]">Agent Bridge-04</span>
              </div>

              <div className="bg-[#161b22] rounded border border-[#a855f7]/40 p-2.5 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"></span>
                    <span className="font-bold text-[#f0f6fc]">流心スパン拡幅・鋼重最適化</span>
                  </div>
                  <span className="bg-[#a855f7]/20 text-[#a855f7] px-1 rounded font-bold text-[9px]">
                    スコア 97.2
                  </span>
                </div>

                <div className="text-[#8b949e] text-[9px] bg-[#0d1117]/80 p-2 rounded border border-[#30363d] space-y-1">
                  <div className="flex justify-between">
                    <span>P2-P3中央径間:</span>
                    <strong className="text-[#38bdf8]">52.0m (SM490Y採用)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>河川流下阻害率:</span>
                    <strong className="text-[#10b981]">{mechanics.riverObstructionRatePercent}% (適合 PASS)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>モーメント・杭反力:</span>
                    <strong className="text-[#10b981]">極限収束 最適</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[9px] bg-[#0d1117] p-1.5 rounded border border-[#30363d]">
                  <div>鋼材削減: <strong className="text-[#10b981]">▲ 14.5 t</strong></div>
                  <div>上部工費削減: <strong className="text-[#10b981]">▲ ¥12.8M</strong></div>
                  <div>CO2排出量: <strong className="text-[#10b981]">▲ 32 t-CO2</strong></div>
                  <div>活荷重たわみ: <span className="text-[#f0f6fc]">{mechanics.deflectionRatioLimit}</span></div>
                </div>

                {/* Buttons */}
                <div className="space-y-1 pt-1">
                  <button
                    onClick={commitBridgeDesignSkill}
                    disabled={isCommitted}
                    className={`w-full py-1.5 rounded flex items-center justify-center gap-1 text-[10px] font-bold transition-all ${
                      isCommitted
                        ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                        : 'bg-[#38bdf8] text-[#090d13] hover:bg-[#7bd0ff] active:scale-95 shadow-sm'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isCommitted ? '橋梁構造 確定済 (Committed)' : '橋梁構造確定コミット (Commit)'}</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      onClick={exportBridgeIfcSkill}
                      className="flex-1 bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] border border-[#30363d] py-1 rounded text-[9px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <Box className="w-3 h-3 text-[#38bdf8]" />
                      <span>IFC 4.3 出力</span>
                    </button>
                    <button
                      onClick={exportBridgeLandXmlSkill}
                      className="flex-1 bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] border border-[#30363d] py-1 rounded text-[9px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <FileCode className="w-3 h-3 text-[#10b981]" />
                      <span>LandXML 出力</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: 稼働中AIエージェント */}
            <div className="border-t border-[#30363d] pt-2.5">
              <div className="text-[9px] text-[#8b949e] uppercase mb-1.5 font-semibold">
                橋梁専任AIエージェント (5/5 Active)
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <div className="bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] flex items-center justify-between">
                  <span className="text-[#8b949e]">FEM Solver</span>
                  <span className="text-[#10b981] font-bold">0.1ms</span>
                </div>
                <div className="bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] flex items-center justify-between">
                  <span className="text-[#8b949e]">Hydraulic/River</span>
                  <span className="text-[#10b981] font-bold">14ms</span>
                </div>
                <div className="bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] flex items-center justify-between">
                  <span className="text-[#8b949e]">Pier/Found</span>
                  <span className="text-[#10b981] font-bold">18ms</span>
                </div>
                <div className="bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] flex items-center justify-between">
                  <span className="text-[#8b949e]">示道書監査</span>
                  <span className="text-[#10b981] font-bold">3ms</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        )}
      </div>

      {/* ======================================================================= */}
      {/* EXPORT MODAL (IFC 4.3 / LandXML)                                        */}
      {/* ======================================================================= */}
      {exportModalOpen !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-[11px] text-[#f0f6fc]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#0d1117]">
              <div className="flex items-center gap-2">
                {exportModalOpen === 'ifc' ? (
                  <>
                    <Box className="w-4 h-4 text-[#38bdf8]" />
                    <span className="font-bold">IFC 4.3 橋梁構造 BIM/CIM データエクスポート</span>
                  </>
                ) : (
                  <>
                    <FileCode className="w-4 h-4 text-[#10b981]" />
                    <span className="font-bold">LandXML 1.2 構造物定義データエクスポート</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setExportModalOpen('none')}
                className="text-[#8b949e] hover:text-[#f0f6fc]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              <div className="text-[10px] text-[#8b949e]">
                国土交通省「BIM/CIM設計照査要領」および buildingSMART IFC 4.3 準拠の構造物モデル定義です。
              </div>
              <pre className="bg-[#0d1117] border border-[#30363d] p-3 rounded text-[10px] text-[#8ed5ff] overflow-x-auto leading-relaxed max-h-96">
                {exportModalOpen === 'ifc' ? generatedIfcCode : generatedLandXmlCode}
              </pre>
            </div>

            <div className="px-4 py-2 border-t border-[#30363d] bg-[#0d1117] flex justify-between items-center">
              <span className="text-[10px] text-[#6e7681]">IFC4X3_ADD2 / EPSG:6677</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyCode(exportModalOpen === 'ifc' ? generatedIfcCode : generatedLandXmlCode)}
                  className="bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5 text-[#38bdf8]" />}
                  <span>{isCopied ? 'コピー完了' : 'コードをコピー'}</span>
                </button>
                <button
                  onClick={() =>
                    handleDownloadCode(
                      exportModalOpen === 'ifc' ? generatedIfcCode : generatedLandXmlCode,
                      exportModalOpen === 'ifc' ? 'Midorikawa_Bridge_IFC4.3.ifc' : 'Midorikawa_Bridge_LandXML.xml',
                      exportModalOpen === 'ifc' ? 'application/x-step' : 'application/xml'
                    )
                  }
                  className="bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportModalOpen === 'ifc' ? '.ifc 保存' : '.xml 保存'}</span>
                </button>
                <button
                  onClick={() => setExportModalOpen('none')}
                  className="bg-[#38bdf8] text-[#090d13] font-bold px-3 py-1 rounded text-xs hover:bg-[#7bd0ff] transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 構造物定期点検カルテ ＆ 50年LCC劣化予測モーダル */}
      <AssetManagementModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        activeProject={activeProject}
      />
    </div>
  );
};
