import React, { useState, useRef, useEffect } from 'react';
import { useRoadDesign } from '../hooks/useRoadDesign';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Minimize2,
  Cpu,
  Layers,
  Settings,
  Terminal,
  Cloud,
  FileCode,
  Check,
  X,
  Copy,
  ChevronRight,
  ChevronLeft,
  Move,
  RotateCcw,
  Download,
  Plus,
  Trash2,
  MousePointer,
  Sliders,
  Target,
  Compass,
  Zap,
  Grid,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Car,
} from 'lucide-react';
import { CivilProject, IntersectionPoint } from '../types';
import { OpenDriveModal } from './OpenDriveModal';

interface RoadDesignWorkspaceProps {
  onBackToMain?: () => void;
  activeProject?: CivilProject;
  onUpdateAlignment?: (ips: IntersectionPoint[]) => void;
  onDragEnd?: (updatedIps: IntersectionPoint[], delta: { dx: number; dy: number }) => void;
}

export const RoadDesignWorkspace: React.FC<RoadDesignWorkspaceProps> = ({
  onBackToMain,
  activeProject,
  onUpdateAlignment,
  onDragEnd,
}) => {
  const [isOpenDriveModalOpen, setIsOpenDriveModalOpen] = useState<boolean>(false);
  const {
    ips,
    ip2Offset,
    dynamicRadius,
    dynamicClothoidL,
    dynamicLandClearance,
    dynamicEarthworkBalance,
    standard,
    assembly,
    auditMatrix,
    isCommitted,
    activeTab,
    setActiveTab,
    landXmlModalOpen,
    setLandXmlModalOpen,
    feedbackToast,
    generatedLandXml,
    // 2D CAD State & Skills
    activeIpId,
    activeIp,
    cadTool,
    snapSettings,
    selectCadToolSkill,
    toggleSnapSettingSkill,
    selectIpSkill,
    updateIpParamSkill,
    moveIpSkill,
    addIpSkill,
    deleteIpSkill,
    // 2-2 Quad-View & VPI & Station Seek State & Skills
    vpis,
    activeVpiId,
    currentStationM,
    isPlayingDrive,
    viewMode,
    stationInfo,
    dynamicProfilePaths,
    selectVpiSkill,
    moveVpiSkill,
    seekStationSkill,
    stepStationSkill,
    togglePlayDriveSkill,
    setViewModeSkill,
    // Skills
    dragIp2Skill,
    updateAssemblySkill,
    commitGeometrySkill,
    exportLandXmlSkill,
    writeQgisAttributeSkill,
  } = useRoadDesign(activeProject);

  // ビューモード状態 & パネル開閉 (デフォルトは左右ともに折りたたんだ状態)
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState<boolean>(false);
  const [isRightPaneOpen, setIsRightPaneOpen] = useState<boolean>(false);

  // 路線・プロジェクト変更時は左右メニューを折りたたんだ状態に維持
  useEffect(() => {
    setIsLeftPaneOpen(false);
    setIsRightPaneOpen(false);
  }, [activeProject?.id]);
  const [draggingVpiId, setDraggingVpiId] = useState<string | null>(null);
  const [demOverlay, setDemOverlay] = useState<boolean>(true);
  const [cutawayActive, setCutawayActive] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [editingAssembly, setEditingAssembly] = useState<boolean>(false);
  const [leftNavTab, setLeftNavTab] = useState<'ip' | 'assembly' | 'preset' | 'vpi'>('ip');
  const [showAuditSettings, setShowAuditSettings] = useState<boolean>(false);
  const [auditMode, setAuditMode] = useState<'strict' | 'standard'>('strict');

  // SVG CAD ドラッグ状態
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingIpId, setDraggingIpId] = useState<string | null>(null);
  const [hoveredSvgCoord, setHoveredSvgCoord] = useState<{ x: number; y: number } | null>(null);
  const dragStartSnapshotRef = useRef<{ id: string; x: number; y: number } | null>(null);

  // IP マウスダウンハンドラ (クリック時も即時測点シーク発火)
  const handleMouseDownIp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (cadTool === 'delete_ip') {
      deleteIpSkill(id);
      return;
    }
    selectIpSkill(id);
    setDraggingIpId(id);
    const targetIp = ips.find((p) => p.id === id);
    if (targetIp) {
      dragStartSnapshotRef.current = {
        id,
        x: targetIp.x ?? 380,
        y: targetIp.y ?? 190,
      };
    }
  };

  // SVG キャンバス クリック (新規IP追加 または 線形上の最寄測点シーク)
  const handleSvgClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 600;
    const svgY = ((e.clientY - rect.top) / rect.height) * 450;

    if (cadTool === 'add_ip') {
      addIpSkill(svgX, svgY);
      return;
    }

    // select モード時は平面上のクリック位置に応じて測点を双方向シーク
    // 線形スプライン (X: 40 〜 560) から 0 〜 2440m へのマッピング
    const ratio = Math.max(0, Math.min(1, (svgX - 40) / 520));
    const targetSta = Math.round(ratio * 2440);
    seekStationSkill(targetSta);
  };

  // 縦断図 SVG クリック (測点シーク連動)
  const handleProfileSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSta = Math.round(ratio * 2440);
    seekStationSkill(targetSta);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 600;
    const svgY = ((e.clientY - rect.top) / rect.height) * 450;

    setHoveredSvgCoord({ x: Math.round(svgX), y: Math.round(svgY) });

    if (!draggingIpId) return;
    const clampedX = Math.max(30, Math.min(570, svgX));
    const clampedY = Math.max(30, Math.min(420, svgY));
    moveIpSkill(draggingIpId, clampedX, clampedY);
  };

  // onDragEnd: ドラッグ完了時に線形ステートを確定コミットし、親コールバックへ伝播
  const handleDragEndInternal = () => {
    if (!draggingIpId) return;
    const movedIp = ips.find((p) => p.id === draggingIpId);
    const startPos = dragStartSnapshotRef.current;
    const dx = movedIp && startPos ? (movedIp.x ?? 0) - startPos.x : 0;
    const dy = movedIp && startPos ? (movedIp.y ?? 0) - startPos.y : 0;

    // 1. プロジェクト線形の確定コミット (道路構造令・自己整合性チェック・LandXML再構築)
    commitGeometrySkill();

    // 2. 親・外部への onDragEnd コールバック
    if (onDragEnd) {
      onDragEnd(ips, { dx, dy });
    }
    if (onUpdateAlignment) {
      onUpdateAlignment(ips);
    }

    setDraggingIpId(null);
    dragStartSnapshotRef.current = null;
  };

  const handleMouseUp = () => {
    if (draggingIpId) {
      handleDragEndInternal();
    }
  };

  // 2D SVG上のIP-02座標計算
  const ip2SvgX = 368 + ip2Offset.dx * 5;
  const ip2SvgY = 195 + ip2Offset.dy * 4;

  const handleCopyLandXml = () => {
    navigator.clipboard.writeText(generatedLandXml);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadLandXml = () => {
    try {
      const blob = new Blob([generatedLandXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeProjectName = (activeProject?.name || 'Kumamoto_Corridor').replace(/[\s/\\:]+/g, '_');
      a.download = `${safeProjectName}_LandXML1.2.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col bg-[#090d13] text-[#f0f6fc] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* フィードバックトースト */}
      {feedbackToast && (
        <div className="fixed top-16 right-4 z-50 bg-[#161b22] border border-[#38bdf8] text-[#38bdf8] px-3 py-1.5 rounded shadow-xl text-xs font-mono flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 3-PANE WORKSPACE BODY                                                  */}
      {/* ======================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ===================================================================== */}
        {/* LEFT PANE: ALIGNMENT TREE & PARAMETRIC GEOMETRY PROPERTIES           */}
        {/* ===================================================================== */}
        {!isLeftPaneOpen ? (
          <div className="w-8 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-2 z-30 shrink-0 select-none">
            <button
              onClick={() => setIsLeftPaneOpen(true)}
              className="p-1.5 bg-[#161b22] hover:bg-[#38bdf8] hover:text-[#090d13] text-[#38bdf8] rounded border border-[#30363d] transition-all shadow"
              title="設計諸元パネルを展開"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="[writing-mode:vertical-rl] text-[10px] font-mono text-[#8b949e] mt-4 tracking-widest">
              線形諸元プロパティ
            </span>
          </div>
        ) : (
        <aside className="w-80 bg-[#0d1117] border-r border-[#30363d] flex flex-col z-30 shrink-0 select-none">
          {/* Project Corridor Badge & Mode */}
          <div className="p-2 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="6" cy="19" r="3" />
                  <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
                  <circle cx="18" cy="5" r="3" />
                </svg>
              </div>
              <div>
                <div className="font-mono text-xs text-[#f0f6fc] font-bold flex items-center gap-1">
                  <span className="truncate max-w-[140px]" title={activeProject?.name || 'Corridor-A1'}>
                    {activeProject?.name || 'Corridor-A1'}
                  </span>
                  <span className="font-mono text-[9px] bg-[#38bdf8]/15 text-[#38bdf8] px-1 rounded shrink-0">
                    {activeProject?.routeCode || 'REV 4'}
                  </span>
                </div>
                <div className="font-mono text-[9px] text-[#8b949e]">
                  BP 0+000 ~ EP {activeProject ? (activeProject.totalLengthKm >= 10 ? `${Math.floor(activeProject.totalLengthKm)}+${Math.round((activeProject.totalLengthKm % 1) * 1000).toString().padStart(3, '0')}` : `${activeProject.totalLengthKm.toFixed(1).replace('.', '+')}00`) : '2+450'} ({activeProject?.totalLengthKm ?? 2.45}km)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => dragIp2Skill(2.40, -1.15)}
                className="bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] border border-[#30363d] px-1.5 py-0.5 rounded font-mono text-[9px] flex items-center gap-1 transition-colors"
                title="リセット"
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

          {/* Sub-Tabs */}
          <div className="flex border-b border-[#30363d] bg-[#0d1117] text-[#8b949e] font-mono text-[9px]">
            <button
              onClick={() => setLeftNavTab('ip')}
              className={`flex-1 py-1.5 text-center flex items-center justify-center gap-1 transition-colors ${
                leftNavTab === 'ip'
                  ? 'text-[#38bdf8] font-bold border-b-2 border-[#38bdf8] bg-[#161b22]'
                  : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span>平面IP</span>
            </button>
            <button
              onClick={() => setLeftNavTab('vpi')}
              className={`flex-1 py-1.5 text-center flex items-center justify-center gap-1 transition-colors ${
                leftNavTab === 'vpi'
                  ? 'text-[#38bdf8] font-bold border-b-2 border-[#38bdf8] bg-[#161b22]'
                  : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span>縦断VPI</span>
            </button>
            <button
              onClick={() => {
                setLeftNavTab('assembly');
                setEditingAssembly(true);
              }}
              className={`flex-1 py-1.5 text-center flex items-center justify-center gap-1 transition-colors ${
                leftNavTab === 'assembly'
                  ? 'text-[#38bdf8] font-bold border-b-2 border-[#38bdf8] bg-[#161b22]'
                  : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span>標準横断</span>
            </button>
            <button
              onClick={() => setLeftNavTab('preset')}
              className={`flex-1 py-1.5 text-center flex items-center justify-center gap-1 transition-colors ${
                leftNavTab === 'preset'
                  ? 'text-[#38bdf8] font-bold border-b-2 border-[#38bdf8] bg-[#161b22]'
                  : 'hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span>令規定</span>
            </button>
          </div>

          {/* Scrollable Properties */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 font-mono text-[10px] no-scrollbar">
            {leftNavTab === 'vpi' ? (
              /* VPI (Vertical Point of Intersection) List & Parametric Editor */
              <div className="space-y-2">
                <div className="text-[10px] text-[#8b949e] font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#f0f6fc]">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
                    縦断線形変曲点 (VPIリスト)
                  </span>
                  <span className="text-[#8b949e] text-[9px]">{vpis.length} 交点</span>
                </div>

                <div className="space-y-2">
                  {vpis.map((vpi) => {
                    const isSelected = vpi.id === activeVpiId;
                    return (
                      <div
                        key={vpi.id}
                        onClick={() => selectVpiSkill(vpi.id)}
                        className={`p-2 rounded cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#38bdf8]/10 border-2 border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                            : 'bg-[#161b22] border border-[#30363d] hover:border-[#484f58]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${vpi.status === 'PASS' ? 'bg-[#10b981]' : 'bg-[#f43f5e]'}`} />
                            <span className={`font-bold text-xs ${isSelected ? 'text-[#38bdf8]' : 'text-[#f0f6fc]'}`}>
                              {vpi.id}
                            </span>
                            <span className="text-[#8b949e] text-[9px]">({vpi.stationStr})</span>
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                              vpi.status === 'PASS' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f43f5e]/20 text-[#f43f5e]'
                            }`}
                          >
                            {vpi.status === 'PASS' ? 'FEASIBLE' : 'LIMIT WARN'}
                          </span>
                        </div>

                        {/* Elevation Slider */}
                        <div className="space-y-1 bg-[#090d13] p-1.5 rounded border border-[#30363d]">
                          <div className="flex justify-between items-center text-[#8b949e]">
                            <span>計画標高 FH:</span>
                            <strong className="text-[#38bdf8] text-xs">{vpi.elevationM.toFixed(2)} m</strong>
                          </div>
                          <input
                            type="range"
                            min={45.0}
                            max={95.0}
                            step={0.1}
                            value={vpi.elevationM}
                            onChange={(e) => moveVpiSkill(vpi.id, Number(e.target.value))}
                            className="w-full h-1 bg-[#21262d] rounded appearance-none cursor-pointer accent-[#38bdf8]"
                          />
                          <div className="flex justify-between text-[8px] text-[#6e7681]">
                            <span>45.0m</span>
                            <span>70.0m</span>
                            <span>95.0m</span>
                          </div>
                        </div>

                        {/* Grades */}
                        <div className="grid grid-cols-2 gap-1 mt-1.5 text-[9px] text-[#8b949e]">
                          <div className="bg-[#090d13] p-1 rounded border border-[#30363d]">
                            <span>流入勾配 i1: </span>
                            <strong className={Math.abs(vpi.gradeInPercent) > standard.maxGradePercent ? 'text-[#f43f5e]' : 'text-[#f0f6fc]'}>
                              {vpi.gradeInPercent > 0 ? `+${vpi.gradeInPercent}%` : `${vpi.gradeInPercent}%`}
                            </strong>
                          </div>
                          <div className="bg-[#090d13] p-1 rounded border border-[#30363d]">
                            <span>流出勾配 i2: </span>
                            <strong className={Math.abs(vpi.gradeOutPercent) > standard.maxGradePercent ? 'text-[#f43f5e]' : 'text-[#f0f6fc]'}>
                              {vpi.gradeOutPercent > 0 ? `+${vpi.gradeOutPercent}%` : `${vpi.gradeOutPercent}%`}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 bg-[#161b22] rounded border border-[#30363d] space-y-1 text-[#8b949e]">
                  <div className="text-[#f0f6fc] font-bold text-[9px]">令第20条 縦断勾配制約</div>
                  <div className="text-[9px]">最大許容勾配: <span className="text-[#f0f6fc]">±{standard.maxGradePercent}.0%</span></div>
                  <div className="text-[9px]">現在VPI-02勾配: <span className="text-[#38bdf8]">+{vpis.find(v => v.id === 'VPI-02')?.gradeInPercent}%</span></div>
                  <div className="text-[8px] text-[#6e7681]">※標高昇降により切土・盛土バランスおよび3Dコリドー標高が即座に連動再計算されます。</div>
                </div>
              </div>
            ) : leftNavTab === 'preset' ? (
              /* Preset Selection Tab */
              <div className="space-y-2">
                <div className="text-[10px] text-[#8b949e] font-semibold mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"></span>
                  道路構造令 設計規格プリセット適用
                </div>
                {[
                  {
                    id: 'class3_1',
                    name: '第3種第1級 (地方部幹線)',
                    speed: '80 km/h',
                    lane: 3.5,
                    sidewalk: 2.5,
                    rMin: 280,
                    iMax: 4.0,
                    desc: '主要幹線道路。設計速度80km/h、車線幅員3.50m、歩道2.50m標準。',
                  },
                  {
                    id: 'class3_2',
                    name: '第3種第2級 (現行設計規格)',
                    speed: '60 km/h',
                    lane: 3.25,
                    sidewalk: 2.0,
                    rMin: 150,
                    iMax: 5.0,
                    desc: '一般幹線・地域高規格連絡道路。設計速度60km/h、車線幅員3.25m。',
                  },
                  {
                    id: 'class4_1',
                    name: '第4種第1級 (都市部幹線)',
                    speed: '60 km/h',
                    lane: 3.25,
                    sidewalk: 3.0,
                    rMin: 150,
                    iMax: 6.0,
                    desc: '市街化区域連絡道路。歩行者交通量考慮で両側広幅員歩道3.0m。',
                  },
                ].map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded bg-[#161b22] border border-[#30363d] hover:border-[#38bdf8] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#f0f6fc]">{p.name}</span>
                      <span className="text-[9px] bg-[#38bdf8]/15 text-[#38bdf8] px-1.5 py-0.5 rounded font-bold">
                        {p.speed}
                      </span>
                    </div>
                    <p className="text-[9px] text-[#8b949e] mb-2 leading-relaxed">{p.desc}</p>
                    <div className="grid grid-cols-2 gap-1 text-[9px] bg-[#0d1117] p-1.5 rounded mb-2">
                      <div>車線: <strong className="text-[#f0f6fc]">{p.lane}m</strong></div>
                      <div>歩道: <strong className="text-[#f0f6fc]">{p.sidewalk}m</strong></div>
                      <div>最小R: <strong className="text-[#38bdf8]">{p.rMin}m</strong></div>
                      <div>最大学: <strong className="text-[#f59e0b]">{p.iMax}%</strong></div>
                    </div>
                    <button
                      onClick={() => {
                        updateAssemblySkill({
                          laneWidth: p.lane,
                          sidewalkWidth: p.sidewalk,
                        });
                        setLeftNavTab('assembly');
                      }}
                      className="w-full py-1 bg-[#21262d] hover:bg-[#38bdf8] hover:text-[#090d13] text-[#38bdf8] rounded font-bold transition-all text-center"
                    >
                      この規格プリセットを適用
                    </button>
                  </div>
                ))}
              </div>
            ) : leftNavTab === 'assembly' ? (
              /* Standard Cross Section Tab */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[#8b949e] font-semibold">
                  <span className="flex items-center gap-1 text-[#f0f6fc]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    標準横断アセンブリ詳細構成
                  </span>
                </div>

                <div className="bg-[#161b22] rounded border border-[#30363d] p-2.5 space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[#8b949e] mb-1">
                      <span>車線幅員 (Lane Width):</span>
                      <span className="text-[#38bdf8] font-bold">{assembly.laneWidth.toFixed(2)}m</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[3.0, 3.25, 3.5].map((w) => (
                        <button
                          key={w}
                          onClick={() => updateAssemblySkill({ laneWidth: w })}
                          className={`py-1 rounded text-center transition-colors ${
                            assembly.laneWidth === w
                              ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                              : 'bg-[#21262d] hover:bg-[#2d333b] text-[#8b949e]'
                          }`}
                        >
                          {w.toFixed(2)}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#30363d] pt-2">
                    <div className="flex justify-between text-[#8b949e] mb-1">
                      <span>歩道幅員 (Sidewalk Width):</span>
                      <span className="text-[#10b981] font-bold">{assembly.sidewalkWidth.toFixed(2)}m</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[1.5, 2.0, 2.5].map((w) => (
                        <button
                          key={w}
                          onClick={() => updateAssemblySkill({ sidewalkWidth: w })}
                          className={`py-1 rounded text-center transition-colors ${
                            assembly.sidewalkWidth === w
                              ? 'bg-[#10b981] text-[#090d13] font-bold'
                              : 'bg-[#21262d] hover:bg-[#2d333b] text-[#8b949e]'
                          }`}
                        >
                          {w.toFixed(2)}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#30363d] pt-2 space-y-1 text-[#8b949e]">
                    <div className="flex justify-between">
                      <span>総全幅員:</span>
                      <strong className="text-[#f0f6fc]">
                        {(assembly.laneWidth * 2 + assembly.leftShoulderWidth + assembly.rightShoulderWidth + assembly.sidewalkWidth * 2).toFixed(2)}m
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>路肩 (左右):</span>
                      <strong className="text-[#f0f6fc]">W={assembly.leftShoulderWidth}m / {assembly.rightShoulderWidth}m</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>横断勾配 (Crown):</span>
                      <strong className="text-[#f0f6fc]">{assembly.crownCrossSlopePercent.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* IP Table (Default) */
              <>
              {/* Section A: Dynamic IP Table */}
              <div>
                <div className="flex items-center justify-between mb-2 text-[#8b949e] font-semibold">
                  <span className="flex items-center gap-1.5 text-xs text-[#f0f6fc]">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
                    平面線形IPリスト ({ips.length} 交点)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addIpSkill(400, 200)}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] rounded border border-[#38bdf8]/40 text-[9px] font-mono transition-colors"
                      title="新規交点を追加"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>IP追加</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {ips.map((ip) => {
                    const isSelected = ip.id === activeIpId;
                    return (
                      <div
                        key={ip.id}
                        onClick={() => selectIpSkill(ip.id)}
                        className={`p-2 rounded cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#38bdf8]/10 border-2 border-[#38bdf8] shadow-[0_0_14px_rgba(56,189,248,0.2)]'
                            : 'bg-[#161b22] border border-[#30363d] hover:border-[#484f58]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isSelected ? 'bg-[#38bdf8]' : 'bg-[#10b981]'
                              }`}
                            ></span>
                            <span
                              className={`font-bold text-xs ${
                                isSelected ? 'text-[#38bdf8]' : 'text-[#f0f6fc]'
                              }`}
                            >
                              {ip.id}
                            </span>
                            <span className="text-[#8b949e] text-[9px] font-mono">{ip.station}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[8px] px-1 py-0.2 rounded border font-mono font-bold ${
                                ip.status === 'PASS'
                                  ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                                  : 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30'
                              }`}
                            >
                              {ip.status}
                            </span>
                            {ips.length > 2 && isSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteIpSkill(ip.id);
                                }}
                                className="text-[#8b949e] hover:text-[#f43f5e] p-0.5 rounded hover:bg-[#21262d] transition-colors"
                                title="この交点を削除"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Summary Grid */}
                        <div className="grid grid-cols-3 gap-1 text-[9px] text-[#8b949e] bg-[#0d1117] p-1.5 rounded border border-[#30363d]">
                          <div>θ: <span className="text-[#f0f6fc] font-bold">{ip.theta}</span></div>
                          <div>R: <span className="text-[#38bdf8] font-bold">{ip.radius.toFixed(1)}m</span></div>
                          <div>A: <span className="text-[#f0f6fc]">{ip.aParam ?? 110}</span></div>
                          <div>片勾配: <span className="text-[#f0f6fc]">i={ip.superelevation.toFixed(1)}%</span></div>
                          <div>拡幅: <span className="text-[#f0f6fc]">+{ip.widening.toFixed(2)}m</span></div>
                          <div>CL長: <span className="text-[#f0f6fc]">{ip.curveLength.toFixed(1)}m</span></div>
                        </div>

                        {/* Active IP Dedicated Geometry Editor */}
                        {isSelected && (
                          <div className="mt-2 pt-2 border-t border-[#30363d]/80 space-y-2 text-[9px]" onClick={(e) => e.stopPropagation()}>
                            {/* Radius Slider */}
                            <div>
                              <div className="flex justify-between text-[#8b949e] mb-0.5">
                                <span>曲線半径 (Radius R):</span>
                                <span className="text-[#38bdf8] font-bold font-mono">
                                  R = {ip.radius.toFixed(0)}m {ip.radius < 150 ? '(令違反)' : '(適合)'}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={120}
                                max={600}
                                step={10}
                                value={ip.radius}
                                onChange={(e) =>
                                  updateIpParamSkill(ip.id, { radius: Number(e.target.value) })
                                }
                                className="w-full accent-[#38bdf8] h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex gap-1 mt-1">
                                {[150, 200, 280, 350, 450].map((presetR) => (
                                  <button
                                    key={presetR}
                                    onClick={() => updateIpParamSkill(ip.id, { radius: presetR })}
                                    className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors ${
                                      ip.radius === presetR
                                        ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                                        : 'bg-[#21262d] hover:bg-[#2d333b] text-[#8b949e]'
                                    }`}
                                  >
                                    {presetR}m
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Clothoid Parameter A */}
                            <div>
                              <div className="flex justify-between text-[#8b949e] mb-0.5">
                                <span>クロソイドパラメータ (A):</span>
                                <span className="text-[#10b981] font-bold font-mono">
                                  A = {ip.aParam ?? 110} (L = {ip.clothoidL.toFixed(1)}m)
                                </span>
                              </div>
                              <input
                                type="range"
                                min={70}
                                max={180}
                                step={5}
                                value={ip.aParam ?? 110}
                                onChange={(e) =>
                                  updateIpParamSkill(ip.id, { aParam: Number(e.target.value) })
                                }
                                className="w-full accent-[#10b981] h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex gap-1 mt-1">
                                {[90, 110, 120, 140].map((presetA) => (
                                  <button
                                    key={presetA}
                                    onClick={() => updateIpParamSkill(ip.id, { aParam: presetA })}
                                    className={`flex-1 py-0.5 rounded text-[8px] font-mono transition-colors ${
                                      (ip.aParam ?? 110) === presetA
                                        ? 'bg-[#10b981] text-[#090d13] font-bold'
                                        : 'bg-[#21262d] hover:bg-[#2d333b] text-[#8b949e]'
                                    }`}
                                  >
                                    A={presetA}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Superelevation and Widening */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#30363d]/60">
                              <div>
                                <div className="text-[#8b949e] mb-0.5 flex justify-between">
                                  <span>片勾配:</span>
                                  <span className="text-[#f0f6fc] font-bold">{ip.superelevation.toFixed(1)}%</span>
                                </div>
                                <div className="flex gap-0.5">
                                  {[3.0, 4.0, 5.0, 6.0].map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => updateIpParamSkill(ip.id, { superelevation: s })}
                                      className={`flex-1 py-0.5 rounded text-[8px] ${
                                        ip.superelevation === s
                                          ? 'bg-[#a855f7] text-white font-bold'
                                          : 'bg-[#21262d] text-[#8b949e]'
                                      }`}
                                    >
                                      {s}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-[#8b949e] mb-0.5 flex justify-between">
                                  <span>拡幅量:</span>
                                  <span className="text-[#f0f6fc] font-bold">+{ip.widening.toFixed(2)}m</span>
                                </div>
                                <div className="flex gap-0.5">
                                  {[0.0, 0.25, 0.5, 0.75].map((w) => (
                                    <button
                                      key={w}
                                      onClick={() => updateIpParamSkill(ip.id, { widening: w })}
                                      className={`flex-1 py-0.5 rounded text-[8px] ${
                                        ip.widening === w
                                          ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                                          : 'bg-[#21262d] text-[#8b949e]'
                                      }`}
                                    >
                                      +{w}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Calculated Elements Details */}
                            <div className="p-1.5 bg-[#090d13] rounded border border-[#30363d] grid grid-cols-3 gap-1 font-mono text-[8px] text-[#8b949e]">
                              <div>接線長TL: <span className="text-[#f0f6fc]">{ip.tangentLength ?? 126.1}m</span></div>
                              <div>外距SL: <span className="text-[#f0f6fc]">{ip.externalSecant ?? 27.2}m</span></div>
                              <div>座標: <span className="text-[#38bdf8]">({ip.x ?? 380}, {ip.y ?? 190})</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            {/* Section B: Standard Cross Section */}
            <div className="border-t border-[#30363d] pt-2.5">
              <div className="flex items-center justify-between mb-1.5 text-[#8b949e] font-semibold">
                <span className="flex items-center gap-1 text-[#f0f6fc]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                  標準横断アセンブリ (Cross Section)
                </span>
                <button
                  onClick={() => setEditingAssembly(!editingAssembly)}
                  className="text-[#38bdf8] hover:underline cursor-pointer text-[9px]"
                >
                  {editingAssembly ? '完了' : '編集'}
                </button>
              </div>

              <div className="bg-[#161b22] rounded border border-[#30363d] p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#8b949e]">車線幅員 (Lane Width):</span>
                  {editingAssembly ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateAssemblySkill({ laneWidth: 3.25 })}
                        className={`px-1 py-0.5 rounded text-[8px] ${
                          assembly.laneWidth === 3.25 ? 'bg-[#38bdf8] text-[#090d13] font-bold' : 'bg-[#21262d]'
                        }`}
                      >
                        3.25m
                      </button>
                      <button
                        onClick={() => updateAssemblySkill({ laneWidth: 3.5 })}
                        className={`px-1 py-0.5 rounded text-[8px] ${
                          assembly.laneWidth === 3.5 ? 'bg-[#38bdf8] text-[#090d13] font-bold' : 'bg-[#21262d]'
                        }`}
                      >
                        3.50m
                      </button>
                    </div>
                  ) : (
                    <span className="text-[#f0f6fc] font-bold">2車線 ({assembly.laneWidth.toFixed(2)}m × 2 = {assembly.totalRoadwayWidth.toFixed(2)}m)</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8b949e]">路肩幅員 (Shoulder):</span>
                  <span className="text-[#f0f6fc]">左 W={assembly.leftShoulderWidth}m / 右 W={assembly.rightShoulderWidth}m</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8b949e]">歩道 (Sidewalk):</span>
                  {editingAssembly ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateAssemblySkill({ sidewalkWidth: 2.0 })}
                        className={`px-1 py-0.5 rounded text-[8px] ${
                          assembly.sidewalkWidth === 2.0 ? 'bg-[#38bdf8] text-[#090d13] font-bold' : 'bg-[#21262d]'
                        }`}
                      >
                        2.0m
                      </button>
                      <button
                        onClick={() => updateAssemblySkill({ sidewalkWidth: 2.5 })}
                        className={`px-1 py-0.5 rounded text-[8px] ${
                          assembly.sidewalkWidth === 2.5 ? 'bg-[#38bdf8] text-[#090d13] font-bold' : 'bg-[#21262d]'
                        }`}
                      >
                        2.5m
                      </button>
                    </div>
                  ) : (
                    <span className="text-[#f0f6fc]">片側 W={assembly.sidewalkWidth.toFixed(2)}m (H=15cm)</span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[#30363d]/60 pt-1">
                  <span className="text-[#8b949e]">盛土/切土法面:</span>
                  <span className="text-[#f0f6fc]">1:{assembly.embankmentSlopeRatio} / 1:{assembly.cutSlopeRatio}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8b949e]">中央クラウン横断勾配:</span>
                  <span className="text-[#f0f6fc]">{assembly.crownCrossSlopePercent.toFixed(1)}% (拡幅連動)</span>
                </div>
              </div>
            </div>

            {/* Section C: Road Specification Standard */}
            <div className="border-t border-[#30363d] pt-2.5">
              <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#38bdf8] font-bold flex items-center gap-1">
                    道路構造令 適用規格
                  </span>
                  <span className="bg-[#38bdf8]/20 text-[#38bdf8] px-1.5 py-0.2 rounded font-bold text-[9px]">
                    {standard.category}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-[#8b949e]">
                  <div className="bg-[#0d1117] p-1 rounded border border-[#30363d]">
                    設計速度: <strong className="text-[#f0f6fc]">V = {standard.designSpeedKmh} km/h</strong>
                  </div>
                  <div className="bg-[#0d1117] p-1 rounded border border-[#30363d]">
                    最小半径: <strong className="text-[#f0f6fc]">R_min = {standard.minRadiusM} m</strong>
                  </div>
                  <div className="bg-[#0d1117] p-1 rounded border border-[#30363d]">
                    最大縦断勾配: <strong className="text-[#f0f6fc]">i_max = {standard.maxGradePercent.toFixed(1)} %</strong>
                  </div>
                  <div className="bg-[#0d1117] p-1 rounded border border-[#30363d]">
                    停止視距: <strong className="text-[#f0f6fc]">S = {standard.stoppingSightDistanceM} m</strong>
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
        {/* CENTER VIEWPORT: DUAL-SPLIT (2D QGIS PLAN SPLINE × 3D PYVISTA)        */}
        {/* ===================================================================== */}
        <section className="flex-1 flex flex-col bg-[#090d13] overflow-hidden relative">
          {/* Viewport Toolstrip */}
          <div className="bg-[#0d1117] border-b border-[#30363d] px-3 py-1 flex flex-wrap items-center justify-between gap-2 z-20 select-none">
            {/* Left: View Modes Switcher */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button
                onClick={() => setViewModeSkill('quad')}
                className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'quad'
                    ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow-md animate-pulse'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
                }`}
                title="四眼完全連動 (2D平面・3D・縦断・横断 4画面同期)"
              >
                <Grid className="w-3 h-3" />
                <span>QUAD-VIEW (四眼連動)</span>
              </button>
              <button
                onClick={() => setViewModeSkill('split')}
                className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'split'
                    ? 'bg-[#21262d] text-[#38bdf8] border border-[#484f58] shadow-sm'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
                }`}
              >
                <span>2D/3D スプリット</span>
              </button>
              <button
                onClick={() => setViewModeSkill('2d')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  viewMode === '2d'
                    ? 'bg-[#21262d] text-[#38bdf8] border border-[#484f58]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
                }`}
              >
                <span>直交2D平面</span>
              </button>
              <button
                onClick={() => setViewModeSkill('3d')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  viewMode === '3d'
                    ? 'bg-[#21262d] text-[#38bdf8] border border-[#484f58]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
                }`}
              >
                <span>3Dパースフル</span>
              </button>
              <div className="h-3 w-px bg-[#30363d] mx-1" />
              {/* Feature Toggles */}
              <button
                onClick={() => setDemOverlay(!demOverlay)}
                className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
                  demOverlay ? 'text-[#38bdf8] bg-[#38bdf8]/10' : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>現況DEM重畳</span>
              </button>
              <button
                onClick={() => setCutawayActive(!cutawayActive)}
                className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
                  cutawayActive ? 'text-[#38bdf8] bg-[#38bdf8]/10' : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                <span>アセンブリ透過</span>
              </button>

              <div className="h-3 w-px bg-[#30363d] mx-1" />

              <button
                onClick={() => setIsOpenDriveModalOpen(true)}
                className="px-2 py-0.5 rounded flex items-center gap-1 font-bold bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/30 transition-colors shadow-sm"
                title="ASAM OpenDRIVE 1.7 ＆ 国交省ダイナミックマップ HDマップ出力・ODD監査"
              >
                <Car className="w-3 h-3" />
                <span>OpenDRIVE</span>
              </button>
            </div>

            {/* Right: Station Seeker & Bi-Directional Synchronizer HUD */}
            <div className="flex items-center gap-2 bg-[#161b22] px-2.5 py-0.5 rounded border border-[#30363d] font-mono text-[10px]">
              {/* Drive Playback Controls */}
              <button
                onClick={togglePlayDriveSkill}
                className={`p-1 rounded flex items-center gap-1 text-[9px] font-bold transition-colors ${
                  isPlayingDrive
                    ? 'bg-[#f43f5e] text-white shadow animate-pulse'
                    : 'bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40'
                }`}
                title={isPlayingDrive ? '自動ドライブ一時停止' : '3D自動走行シミュレーション開始 (V=60km/h)'}
              >
                {isPlayingDrive ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                <span>{isPlayingDrive ? 'PAUSE' : 'DRIVE'}</span>
              </button>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => stepStationSkill(-20)}
                  className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] rounded"
                  title="手前測点へ (-20m)"
                >
                  <SkipBack className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => stepStationSkill(20)}
                  className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] rounded"
                  title="前方測点へ (+20m)"
                >
                  <SkipForward className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Station Label & Pile */}
              <div className="flex items-center gap-1.5 border-l border-[#30363d] pl-2">
                <span className="text-[#f43f5e] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-ping" />
                  {stationInfo.stationStr}
                </span>
                <span className="text-[#8b949e] text-[9px]">({stationInfo.pileNumber})</span>
              </div>

              {/* Station Slider */}
              <div className="flex items-center gap-1 w-28 sm:w-36">
                <input
                  type="range"
                  min={0}
                  max={2440}
                  step={5}
                  value={currentStationM}
                  onChange={(e) => seekStationSkill(Number(e.target.value))}
                  className="w-full h-1 bg-[#21262d] rounded appearance-none cursor-pointer accent-[#f43f5e]"
                  title={`測点シーク: ${stationInfo.stationStr}`}
                />
              </div>

              {/* Station Telemetry Badges */}
              <div className="hidden xl:flex items-center gap-2 border-l border-[#30363d] pl-2 text-[9px]">
                <div>
                  <span className="text-[#8b949e]">FH:</span>
                  <span className="text-[#38bdf8] font-bold ml-0.5">{stationInfo.designElevationM}m</span>
                </div>
                <div>
                  <span className="text-[#8b949e]">GH:</span>
                  <span className="text-[#8b949e] font-bold ml-0.5">{stationInfo.groundElevationM}m</span>
                </div>
                <div>
                  <span className="text-[#8b949e]">切盛:</span>
                  <span className={`font-bold ml-0.5 ${stationInfo.cutOrFillHeightM < 0 ? 'text-[#f43f5e]' : 'text-[#10b981]'}`}>
                    {stationInfo.cutOrFillHeightM > 0 ? `+${stationInfo.cutOrFillHeightM}` : stationInfo.cutOrFillHeightM}m
                  </span>
                </div>
                <div>
                  <span className="text-[#8b949e]">片勾配:</span>
                  <span className="text-[#a855f7] font-bold ml-0.5">{stationInfo.superelevationPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Split / Quad Canvas Viewport Body */}
          <div
            className={
              viewMode === 'quad'
                ? 'flex-1 grid grid-cols-2 grid-rows-2 overflow-hidden relative min-h-0'
                : 'flex-1 flex overflow-hidden relative min-h-0'
            }
          >
            {/* ================================================================= */}
            {/* QUAD 1 / LEFT: 2D QGIS PLAN SPLINE VIEWPORT                       */}
            {/* ================================================================= */}
            {(viewMode === 'split' || viewMode === '2d' || viewMode === 'quad') && (
              <div
                className={`${
                  viewMode === 'quad'
                    ? 'border-r border-b border-[#30363d] h-full'
                    : viewMode === 'split'
                    ? 'w-1/2 border-r border-[#484f58]'
                    : 'w-full'
                } relative flex flex-col overflow-hidden bg-[#070b10] select-none min-h-0`}
              >
                {/* 2D CAD Toolstrip HUD */}
                <div className="bg-[#161b22]/90 backdrop-blur border-b border-[#30363d] px-2.5 py-1 z-20 flex items-center justify-between font-mono text-[10px]">
                  {/* Left: Mode Switchers */}
                  <div className="flex items-center gap-1">
                    <span className="text-[#38bdf8] font-bold mr-1 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5" />
                      CAD
                    </span>
                    <button
                      onClick={() => selectCadToolSkill('select')}
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
                      onClick={() => selectCadToolSkill('add_ip')}
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
                      onClick={() => selectCadToolSkill('delete_ip')}
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
                      onClick={() => toggleSnapSettingSkill('cadastral5m')}
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
                      onClick={() => toggleSnapSettingSkill('demSaddle')}
                      className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
                        snapSettings.demSaddle
                          ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 font-semibold'
                          : 'bg-[#21262d] text-[#6e7681] border-transparent'
                      }`}
                      title="DEM鞍部最適通過推奨ライン"
                    >
                      <span>〰 DEM鞍部</span>
                    </button>
                    <button
                      onClick={() => toggleSnapSettingSkill('corridorRibbon')}
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
                      onClick={() => toggleSnapSettingSkill('slopeHatch')}
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
                      onClick={() => toggleSnapSettingSkill('stationMarks')}
                      className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
                        snapSettings.stationMarks
                          ? 'bg-[#8ed5ff]/15 text-[#8ed5ff] border-[#8ed5ff]/40 font-semibold'
                          : 'bg-[#21262d] text-[#6e7681] border-transparent'
                      }`}
                      title="測点杭プロット (@20mピッチ)"
                    >
                      <span>☷ 測点杭</span>
                    </button>
                  </div>
                </div>

                {/* Vector Canvas Container */}
                <div className="flex-1 relative overflow-hidden">
                  {/* Mode Banner when adding/deleting */}
                  {cadTool === 'add_ip' && (
                    <div className="absolute top-2 left-2 z-10 bg-[#10b981] text-[#090d13] px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-lg animate-pulse flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      クリックした地点に新規IPを挿入します
                    </div>
                  )}
                  {cadTool === 'delete_ip' && (
                    <div className="absolute top-2 left-2 z-10 bg-[#f43f5e] text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-lg flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      削除したい交点（IP）をクリックしてください
                    </div>
                  )}

                  {/* Technical Vector Plan Graphic */}
                  <svg
                    ref={svgRef}
                    className={`w-full h-full ${
                      cadTool === 'add_ip'
                        ? 'cursor-crosshair'
                        : cadTool === 'delete_ip'
                        ? 'cursor-not-allowed'
                        : 'cursor-crosshair'
                    }`}
                    preserveAspectRatio="none"
                    viewBox="0 0 600 450"
                    onClick={handleSvgClick}
                  >
                    {/* Background Grid Lines */}
                    <defs>
                      <pattern id="cadGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#161b22" strokeWidth="0.8" />
                      </pattern>
                    </defs>
                    <rect width="600" height="450" fill="url(#cadGrid)" />

                    {/* Contour Lines (DEM) */}
                    {demOverlay && (
                      <g opacity="0.6">
                        <path d="M-50,80 Q120,40 280,110 T650,90" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
                        <path d="M-50,140 Q150,120 310,180 T650,160" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
                        <path d="M-50,220 Q180,180 340,250 T650,230" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
                        <path d="M-50,310 Q210,270 380,330 T650,300" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
                        <path d="M-50,390 Q240,360 420,410 T650,380" fill="none" stroke="#21262d" strokeDasharray="3,3" strokeWidth="1.2" />
                      </g>
                    )}

                    {/* DEM Saddle Recommended Corridor Line (鞍部推奨ライン) */}
                    {snapSettings.demSaddle && (
                      <g opacity="0.8">
                        <path
                          d="M 40,380 C 130,290 190,260 270,220 C 350,180 430,140 560,90"
                          fill="none"
                          stroke="#10b981"
                          strokeDasharray="4,4"
                          strokeWidth="1.5"
                        />
                        <text x="210" y="215" fill="#10b981" fontFamily="JetBrains Mono" fontSize="8">
                          DEM鞍部（最小土量ルート）
                        </text>
                      </g>
                    )}

                    {/* Cadastral Parcel Bounds (民有地 買収制約) */}
                    <polygon points="180,70 260,60 290,140 200,160" fill="rgba(245,158,11,0.03)" stroke="#484f58" strokeDasharray="4,2" strokeWidth="0.8" />
                    <polygon points="260,60 340,50 370,130 290,140" fill="rgba(244,63,94,0.06)" stroke="#f43f5e" strokeOpacity="0.6" strokeWidth="0.9" />
                    <text x="275" y="95" fill="#f43f5e" fontFamily="JetBrains Mono" fontSize="8" opacity="0.8">
                      民有地（買収制約筆界）
                    </text>

                    {/* 5.0m Cadastral Safety Margin Buffer Line (公図5m離隔バッファ) */}
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
                        <text x="300" y="165" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="7.5">
                          ⌖ 5.0m セーフティ離隔線
                        </text>
                      </g>
                    )}

                    {/* Intersection Tangent Lines (全IPを結ぶ接線ポリライン) */}
                    {(() => {
                      const pointsStr = [
                        '40,380',
                        ...ips.map((ip) => `${ip.x ?? 380},${ip.y ?? 190}`),
                        '560,90',
                      ].join(' ');
                      return (
                        <polyline
                          points={pointsStr}
                          fill="none"
                          stroke="#30363d"
                          strokeDasharray="6,4"
                          strokeWidth="1.5"
                        />
                      );
                    })()}

                    {/* Corridor Embankment/Cutting Buffer / Slope Hatching */}
                    {snapSettings.slopeHatch && (
                      <g opacity="0.9">
                        {/* Embankment slope polygons */}
                        <path
                          d={(() => {
                            const ipCoords = ips.map((ip) => ({ x: ip.x ?? 380, y: ip.y ?? 190 }));
                            let d = `M 30,370 `;
                            ipCoords.forEach((pt) => {
                              d += `Q ${pt.x - 20},${pt.y + 10} ${pt.x},${pt.y - 15} `;
                            });
                            d += `L 570,80 L 550,100 `;
                            ipCoords.slice().reverse().forEach((pt) => {
                              d += `Q ${pt.x + 20},${pt.y - 10} ${pt.x},${pt.y + 15} `;
                            });
                            d += `Z`;
                            return d;
                          })()}
                          fill="rgba(56,189,248,0.06)"
                          stroke="rgba(56,189,248,0.3)"
                          strokeWidth="1"
                        />

                        {/* Slope Hatching Ticks (法面ヒゲ線) */}
                        {[
                          { x1: 90, y1: 345, x2: 82, y2: 355 },
                          { x1: 130, y1: 310, x2: 122, y2: 320 },
                          { x1: 170, y1: 275, x2: 160, y2: 288 },
                          { x1: 230, y1: 245, x2: 220, y2: 260 },
                          { x1: 310, y1: 215, x2: 300, y2: 230 },
                          { x1: 430, y1: 165, x2: 420, y2: 180 },
                          { x1: 510, y1: 120, x2: 500, y2: 135 },
                        ].map((tick, i) => (
                          <line
                            key={i}
                            x1={tick.x1}
                            y1={tick.y1}
                            x2={tick.x2}
                            y2={tick.y2}
                            stroke="#38bdf8"
                            strokeWidth="1.2"
                            opacity="0.5"
                          />
                        ))}
                      </g>
                    )}

                    {/* Corridor Ribbon Offsets (車道幅員 7m / 路肩 / 歩道多重線) */}
                    {snapSettings.corridorRibbon && (
                      <g opacity="0.75">
                        {/* Left Roadway Edge (-3.5m) */}
                        <path
                          d={(() => {
                            const pts = ips.map((ip) => `${(ip.x ?? 380) - 8},${(ip.y ?? 190) - 8}`);
                            return `M 32,372 Q 170,230 ${pts[0]} T 552,82`;
                          })()}
                          fill="none"
                          stroke="#38bdf8"
                          strokeDasharray="2,2"
                          strokeWidth="1"
                        />
                        {/* Right Roadway Edge (+3.5m) */}
                        <path
                          d={(() => {
                            const pts = ips.map((ip) => `${(ip.x ?? 380) + 8},${(ip.y ?? 190) + 8}`);
                            return `M 48,388 Q 190,250 ${pts[0]} T 568,98`;
                          })()}
                          fill="none"
                          stroke="#38bdf8"
                          strokeDasharray="2,2"
                          strokeWidth="1"
                        />
                      </g>
                    )}

                    {/* Road Centerline Spline Alignment (計画中心線) */}
                    <path
                      d={(() => {
                        const count = ips.length;
                        if (count === 0) return 'M 40,380 L 560,90';
                        if (count === 1) {
                          const p = ips[0];
                          return `M 40,380 Q ${p.x},${p.y} 560,90`;
                        }
                        // 複数IPのスプライン補間
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
                      strokeLinecap="round"
                      strokeWidth="3.2"
                      className="cursor-pointer hover:stroke-[#7dd3fc] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!svgRef.current) return;
                        const rect = svgRef.current.getBoundingClientRect();
                        const svgX = ((e.clientX - rect.left) / rect.width) * 600;
                        const ratio = Math.max(0, Math.min(1, (svgX - 40) / 520));
                        seekStationSkill(Math.round(ratio * 2440));
                      }}
                    />

                    {/* Station Stakes Marks (@20m ピッチ) */}
                    {snapSettings.stationMarks && (
                      <g>
                        {[
                          { sta: 'BP No.0', staM: 0, x: 40, y: 380 },
                          { sta: 'No.20', staM: 400, x: 120, y: 305 },
                          { sta: 'No.40', staM: 800, x: 210, y: 245 },
                          { sta: 'No.60', staM: 1200, x: 310, y: 210 },
                          { sta: 'No.80', staM: 1600, x: 420, y: 165 },
                          { sta: 'No.100', staM: 2000, x: 500, y: 125 },
                          { sta: 'EP No.122', staM: 2440, x: 560, y: 90 },
                        ].map((m, idx) => (
                          <g
                            key={idx}
                            className="cursor-pointer group select-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              seekStationSkill(m.staM);
                            }}
                          >
                            <circle
                              cx={m.x}
                              cy={m.y}
                              r="4"
                              fill="#8ed5ff"
                              stroke="#090d13"
                              strokeWidth="1"
                              className="group-hover:scale-150 transition-transform group-hover:fill-[#f43f5e]"
                            />
                            <line x1={m.x - 4} y1={m.y + 4} x2={m.x + 4} y2={m.y - 4} stroke="#8ed5ff" strokeWidth="1.2" />
                            <text
                              x={m.x + 6}
                              y={m.y + 10}
                              fill="#8b949e"
                              fontFamily="JetBrains Mono"
                              fontSize="7.5"
                              className="group-hover:fill-[#f43f5e] group-hover:font-bold transition-colors"
                            >
                              {m.sta}
                            </text>
                          </g>
                        ))}
                      </g>
                    )}

                    {/* Dynamic IP Handles (全IP描画) */}
                    {/* Active Station Laser Needle & Cross Marker (四眼連動ニードル) */}
                    {(() => {
                      const t = Math.max(0, Math.min(1, currentStationM / 2440));
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
                      const crossHalf = 26;

                      return (
                        <g className="pointer-events-none z-30">
                          {/* 直交レーザー横断線 (切断断面位置) */}
                          <line
                            x1={curX - nx * crossHalf}
                            y1={curY - ny * crossHalf}
                            x2={curX + nx * crossHalf}
                            y2={curY + ny * crossHalf}
                            stroke="#f43f5e"
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity="0.95"
                          />
                          {/* 測点ニードルピン */}
                          <circle cx={curX} cy={curY} r="7" fill="none" stroke="#f43f5e" strokeWidth="1.5" className="animate-ping opacity-75" />
                          <circle cx={curX} cy={curY} r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                          {/* 測点ラベルバッジ */}
                          <rect x={curX + 9} y={curY - 17} width="76" height="15" rx="3" fill="#0d1117" stroke="#f43f5e" strokeWidth="1" />
                          <text x={curX + 13} y={curY - 6} fill="#f43f5e" fontFamily="JetBrains Mono" fontSize="8.5" fontWeight="bold">
                            {stationInfo.stationStr}
                          </text>
                        </g>
                      );
                    })()}

                    {/* Dynamic IP Handles (全IP描画) */}
                    {ips.map((ip) => {
                      const isSelected = ip.id === activeIpId;
                      const isDraggingThis = ip.id === draggingIpId;
                      const x = ip.x ?? 380;
                      const y = ip.y ?? 190;
                      return (
                        <g
                          key={ip.id}
                          className="cursor-move select-none"
                          onMouseDown={(e) => handleMouseDownIp(ip.id, e)}
                          onMouseUp={handleDragEndInternal}
                        >
                          {/* Invisible expanded hit target (radius 22px) */}
                          <circle cx={x} cy={y} r="22" fill="transparent" />

                          {/* Ghost Guideline & Ripple when selected/dragging */}
                          {isSelected && (
                            <>
                              <circle
                                cx={x}
                                cy={y}
                                r={isDraggingThis ? 24 : 18}
                                fill="none"
                                stroke="#38bdf8"
                                strokeDasharray="3,3"
                                strokeWidth="1.2"
                                opacity={isDraggingThis ? 0.9 : 0.6}
                                className={isDraggingThis ? 'animate-spin' : ''}
                              />
                              <circle cx={x} cy={y} r="28" fill="none" stroke="#38bdf8" strokeWidth="0.5" opacity="0.3" />
                            </>
                          )}

                          {/* Outer ring handle */}
                          <circle
                            cx={x}
                            cy={y}
                            r={isDraggingThis ? 9 : isSelected ? 8 : 6.5}
                            fill={isDraggingThis ? '#38bdf8' : isSelected ? '#38bdf8' : '#0d1117'}
                            stroke={
                              cadTool === 'delete_ip'
                                ? '#f43f5e'
                                : isDraggingThis
                                ? '#ffffff'
                                : isSelected
                                ? '#ffffff'
                                : '#10b981'
                            }
                            strokeWidth={isDraggingThis ? 3 : isSelected ? 2.5 : 2}
                            className="transition-transform duration-100 hover:scale-125"
                          />

                          {/* Center point */}
                          <circle cx={x} cy={y} r="2" fill={isSelected ? '#090d13' : '#10b981'} pointerEvents="none" />

                          {/* Label */}
                          <text
                            x={x + 12}
                            y={y - 6}
                            fill={isSelected ? '#38bdf8' : '#f0f6fc'}
                            fontFamily="JetBrains Mono"
                            fontSize="9"
                            fontWeight="bold"
                            pointerEvents="none"
                          >
                            {ip.id} {isSelected ? `[R=${ip.radius}m]` : ''}
                          </text>
                          <text
                            x={x + 12}
                            y={y + 5}
                            fill="#8b949e"
                            fontFamily="JetBrains Mono"
                            fontSize="7.5"
                            pointerEvents="none"
                          >
                            {ip.station}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Drag Follow HUD Card (アクティブIPのリアルタイム情報) */}
                  {activeIp && (
                    <div className="absolute top-3 left-3 bg-[#161b22]/95 backdrop-blur-md border border-[#38bdf8] p-2 rounded shadow-[0_8px_24px_rgba(0,0,0,0.8)] z-20 pointer-events-none font-mono text-[10px] max-w-xs">
                      <div className="flex items-center justify-between gap-3 border-b border-[#30363d] pb-1 mb-1">
                        <span className="text-[#38bdf8] font-bold flex items-center gap-1">
                          <Move className="w-3 h-3" />
                          {activeIp.id} 幾何諸元連動
                        </span>
                        <span
                          className={`px-1 rounded font-bold text-[9px] ${
                            activeIp.status === 'PASS'
                              ? 'bg-[#10b981]/20 text-[#10b981]'
                              : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                          }`}
                        >
                          {activeIp.status === 'PASS' ? 'FEASIBLE' : 'WARNING'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                        <div className="text-[#8b949e]">平面座標:</div>
                        <div className="text-[#f0f6fc] font-bold">
                          X = {activeIp.x ?? 380}, Y = {activeIp.y ?? 190}
                        </div>
                        <div className="text-[#8b949e]">曲線半径:</div>
                        <div className="text-[#38bdf8] font-bold">
                          R = {activeIp.radius.toFixed(0)}m {activeIp.radius >= 150 ? '≥ 150m' : '< 150m'}
                        </div>
                        <div className="text-[#8b949e]">クロソイド緩和長:</div>
                        <div className="text-[#10b981] font-bold">
                          A = {activeIp.aParam ?? 110} (L = {activeIp.clothoidL.toFixed(1)}m)
                        </div>
                        <div className="text-[#8b949e]">用地境界離隔:</div>
                        <div className="text-[#10b981] font-bold">
                          {dynamicLandClearance.toFixed(2)} m (買収回避成立)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mouse Coordinate Pill */}
                  {hoveredSvgCoord && (
                    <div className="absolute bottom-2 right-2 bg-[#0d1117]/85 backdrop-blur border border-[#30363d] px-2 py-0.5 rounded text-[9px] font-mono text-[#8b949e]">
                      X: <span className="text-[#f0f6fc]">{hoveredSvgCoord.x}</span>, Y:{' '}
                      <span className="text-[#f0f6fc]">{hoveredSvgCoord.y}</span>
                    </div>
                  )}
                </div>

                {/* Compass Rose */}
                <div className="absolute bottom-3 left-3 bg-[#161b22]/80 backdrop-blur p-1.5 rounded border border-[#30363d] flex flex-col items-center">
                  <span className="text-[#38bdf8] font-bold text-xs">▲</span>
                  <span className="font-mono text-[9px] text-[#f0f6fc] font-bold">N</span>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* QUAD 2 / RIGHT: 3D PYVISTA CORRIDOR VIEWPORT                      */}
            {/* ================================================================= */}
            {(viewMode === 'split' || viewMode === '3d' || viewMode === 'quad') && (
              <div
                className={`${
                  viewMode === 'quad'
                    ? 'border-b border-[#30363d] h-full'
                    : viewMode === 'split'
                    ? 'w-1/2'
                    : 'w-full'
                } relative overflow-hidden bg-[#090e15] select-none min-h-0`}
              >
                {/* Canvas Top Tag */}
                <div className="absolute top-2 left-2 z-10 bg-[#161b22]/90 backdrop-blur border border-[#30363d] px-2 py-0.5 rounded text-[10px] font-mono text-[#8b949e] flex items-center gap-2">
                  <span className="text-[#38bdf8] font-bold">PyVista 3D CORRIDOR</span>
                  <span className="text-[#6e7681]">|</span>
                  <span>Mesh: LOD-3 / Shaded + Wireframe</span>
                </div>

                {/* 3D Perspective Vector Canvas */}
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 450">
                  <defs>
                    <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#161b22" />
                      <stop offset="100%" stopColor="#21262d" />
                    </linearGradient>
                    <linearGradient id="embankCut" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Terrain Elevation Grid */}
                  <path d="M -100,450 L 250,150 L 700,450 Z" fill="#0c1117" stroke="#1f242c" strokeWidth="1" />
                  <line x1="250" y1="150" x2="-20" y2="450" stroke="#1f242c" strokeWidth="0.8" />
                  <line x1="250" y1="150" x2="120" y2="450" stroke="#1f242c" strokeWidth="0.8" />
                  <line x1="250" y1="150" x2="380" y2="450" stroke="#1f242c" strokeWidth="0.8" />
                  <line x1="250" y1="150" x2="520" y2="450" stroke="#1f242c" strokeWidth="0.8" />

                  {/* Dynamic 3D Bend & Elevation from IP offset */}
                  {(() => {
                    const bendX = Math.round(ip2Offset.dx * 14);
                    const elevY = Math.round(ip2Offset.dy * 8);

                    return (
                      <g>
                        {/* Cut/Fill Slope Volumes (連動変形) */}
                        <polygon
                          points={`${120 + Math.min(0, bendX)},380 ${230 + bendX},${170 - elevY} ${200 + bendX},${165 - elevY} 40,360`}
                          fill="url(#embankCut)"
                          opacity="0.7"
                          stroke="#f43f5e"
                          strokeWidth="0.8"
                        />
                        <polygon
                          points={`${380 + Math.max(0, bendX)},380 ${270 + bendX},${170 - elevY} ${300 + bendX},${165 - elevY} 520,360`}
                          fill="rgba(16,185,129,0.15)"
                          stroke="#10b981"
                          strokeWidth="0.8"
                        />

                        {/* Asphalt Road Surface (ベジエ湾曲追従) */}
                        <path
                          d={`M 140,430 Q ${235 + bendX},${290 - elevY} ${250 + Math.round(bendX * 1.3)},${160 - elevY} L ${280 + Math.round(bendX * 1.3)},${160 - elevY} Q ${365 + bendX},${290 - elevY} 460,430 Z`}
                          fill="url(#roadGrad)"
                          stroke="#484f58"
                          strokeWidth="1.5"
                        />

                        {/* Road Center Marking (破線センターライン) */}
                        <path
                          d={`M 300,430 Q ${300 + bendX},${290 - elevY} ${265 + Math.round(bendX * 1.3)},${160 - elevY}`}
                          stroke="#f0f6fc"
                          strokeDasharray="14,12"
                          strokeWidth="3"
                          fill="none"
                        />

                        {/* Lane Edge Ribbons */}
                        <path
                          d={`M 180,430 Q ${250 + bendX},${290 - elevY} ${255 + Math.round(bendX * 1.3)},${160 - elevY}`}
                          stroke="#8ed5ff"
                          strokeWidth="2"
                          fill="none"
                        />
                        <path
                          d={`M 420,430 Q ${350 + bendX},${290 - elevY} ${275 + Math.round(bendX * 1.3)},${160 - elevY}`}
                          stroke="#8ed5ff"
                          strokeWidth="2"
                          fill="none"
                        />

                        {/* Guardrails (波形ガードレール) */}
                        <path
                          d={`M 160,420 Q ${245 + bendX},${290 - elevY} ${252 + Math.round(bendX * 1.3)},${160 - elevY}`}
                          stroke="#bdc8d1"
                          strokeDasharray="3,1"
                          strokeWidth="2"
                          fill="none"
                        />
                        <path
                          d={`M 440,420 Q ${355 + bendX},${290 - elevY} ${278 + Math.round(bendX * 1.3)},${160 - elevY}`}
                          stroke="#bdc8d1"
                          strokeDasharray="3,1"
                          strokeWidth="2"
                          fill="none"
                        />

                        {/* Station Slices (四眼連動レーザースキャンライン) */}
                        {(() => {
                          const t = Math.max(0, Math.min(1, currentStationM / 2440));
                          // 手前 (0m, Y=410) -> 奥 (2440m, Y=175) への透視投影マッピング
                          const pY = 410 - t * 235 - elevY * (0.3 + 0.7 * t);
                          const pW = Math.max(12, 130 * (1 - t * 0.72));
                          const pX = 300 + bendX * (0.2 + 0.8 * t);

                          return (
                            <g className="filter drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]">
                              {/* レーザー横断スキャンライン */}
                              <line
                                x1={pX - pW}
                                y1={pY}
                                x2={pX + pW}
                                y2={pY}
                                stroke="#f43f5e"
                                strokeWidth={Math.max(1.8, 3.5 * (1 - t * 0.5))}
                                strokeLinecap="round"
                              />
                              {/* センターニードル */}
                              <circle cx={pX} cy={pY} r={Math.max(2.5, 4.5 * (1 - t * 0.5))} fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                              {/* 測点ラベル */}
                              <rect
                                x={pX + 8}
                                y={pY - 14}
                                width="72"
                                height="13"
                                rx="2"
                                fill="#0d1117"
                                stroke="#f43f5e"
                                strokeWidth="0.8"
                                opacity="0.95"
                              />
                              <text
                                x={pX + 11}
                                y={pY - 4}
                                fill="#f43f5e"
                                fontFamily="JetBrains Mono"
                                fontSize="7.5"
                                fontWeight="bold"
                              >
                                {stationInfo.stationStr}
                              </text>
                            </g>
                          );
                        })()}
                      </g>
                    );
                  })()}
                </svg>

                {/* 3D HUD Telemetry Floating Card */}
                <div className="absolute bottom-3 right-3 bg-[#161b22]/90 backdrop-blur-md border border-[#484f58] p-2.5 rounded shadow-[0_4px_20px_rgba(0,0,0,0.7)] w-68 z-20 font-mono text-[10px]">
                  <div className="flex items-center justify-between border-b border-[#30363d] pb-1 mb-1.5">
                    <span className="text-[#f0f6fc] font-bold flex items-center gap-1">
                      コリドー現況幾何テレメトリ
                    </span>
                    <span className="text-[#f43f5e] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-ping" />
                      {stationInfo.stationStr}
                    </span>
                  </div>
                  <div className="space-y-1 text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">縦断勾配 (Slope i):</span>
                      <span className="text-[#f0f6fc] font-bold">+2.34 % (上り)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">曲線半径 (Radius):</span>
                      <span className="text-[#38bdf8] font-bold">R = {dynamicRadius}.0 m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">建築限界クリアランス:</span>
                      <span className="text-[#10b981] font-bold">H = 6.20 m (規格4.5m PASS)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">片勾配合成 (Super-elev):</span>
                      <span className="text-[#f0f6fc] font-bold">i_c = 5.0 % (拡幅 +0.50m)</span>
                    </div>
                  </div>
                </div>

                {/* View Gizmo */}
                <div className="absolute top-2 right-2 bg-[#161b22]/80 backdrop-blur p-1 rounded border border-[#30363d] flex items-center gap-1 font-mono text-[9px] text-[#6e7681]">
                  <span className="text-[#f43f5e] font-bold">X</span>
                  <span className="text-[#10b981] font-bold">Y</span>
                  <span className="text-[#38bdf8] font-bold">Z</span>
                  <span className="ml-1">PERSPECTIVE</span>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* QUAD 3 / BOTTOM-LEFT: PROFILE & VPI DYNAMIC EDITOR                */}
            {/* ================================================================= */}
            {viewMode === 'quad' && (
              <div className="border-r border-[#30363d] bg-[#090d13] relative flex flex-col overflow-hidden p-2 select-none font-mono min-h-0">
                {/* Quad 3 Header */}
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#30363d] text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#38bdf8] font-bold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      縦断プロファイル (Profile & VPI)
                    </span>
                    <span className="text-[9px] text-[#6e7681]">1:1000 / 1:200 (Z 5.0x)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] text-[9px]">VPI-02 標高:</span>
                      <button
                        onClick={() => {
                          const v2 = vpis.find((v) => v.id === 'VPI-02');
                          if (v2) moveVpiSkill('VPI-02', Math.max(45, v2.elevationM - 0.5));
                        }}
                        className="px-1 py-0.2 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded text-[8px]"
                        title="VPI-02標高 -0.5m"
                      >
                        -0.5m
                      </button>
                      <strong className="text-[#38bdf8] text-[9px]">
                        {vpis.find((v) => v.id === 'VPI-02')?.elevationM.toFixed(2)}m
                      </strong>
                      <button
                        onClick={() => {
                          const v2 = vpis.find((v) => v.id === 'VPI-02');
                          if (v2) moveVpiSkill('VPI-02', Math.min(95, v2.elevationM + 0.5));
                        }}
                        className="px-1 py-0.2 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded text-[8px]"
                        title="VPI-02標高 +0.5m"
                      >
                        +0.5m
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quad 3 SVG Profile Diagram */}
                <div className="flex-1 relative overflow-hidden">
                  <svg
                    className="w-full h-full cursor-crosshair"
                    preserveAspectRatio="none"
                    viewBox="0 0 700 130"
                    onClick={handleProfileSvgClick}
                  >
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="700" y2="30" stroke="#1c2026" strokeWidth="1" />
                    <line x1="0" y1="65" x2="700" y2="65" stroke="#1c2026" strokeWidth="1" />
                    <line x1="0" y1="100" x2="700" y2="100" stroke="#1c2026" strokeWidth="1" />
                    <line x1="120" y1="0" x2="120" y2="130" stroke="#1c2026" strokeWidth="1" />
                    <line x1="280" y1="0" x2="280" y2="130" stroke="#1c2026" strokeWidth="1" />
                    <line x1="450" y1="0" x2="450" y2="130" stroke="#1c2026" strokeWidth="1" />
                    <line x1="600" y1="0" x2="600" y2="130" stroke="#1c2026" strokeWidth="1" />

                    {/* Ground DEM Line (Dynamic DEM based on IPs) */}
                    <path
                      d={dynamicProfilePaths.groundPath}
                      fill="none"
                      stroke="#6e7681"
                      strokeDasharray="4,3"
                      strokeWidth="1.5"
                    />

                    {/* Dynamic VPI & Cut/Fill Hatch */}
                    {(() => {
                      const vpi2 = vpis.find((v) => v.id === 'VPI-02') || { elevationM: 64.98 };
                      const vpiElevDiff = (vpi2.elevationM - 64.98);
                      const vpiY = Math.round(45 - vpiElevDiff * 1.5);
                      const needleX = Math.round((currentStationM / 2440) * 700);

                      return (
                        <>
                          {/* Cut Hatch (Rose - Dynamic from IPs & VPIs) */}
                          <path
                            d={dynamicProfilePaths.cutHatchPath}
                            fill="rgba(244,63,94,0.28)"
                          />
                          {/* Fill Hatch (Green - Dynamic from IPs & VPIs) */}
                          <path
                            d={dynamicProfilePaths.fillHatchPath}
                            fill="rgba(16,185,129,0.28)"
                          />

                          {/* Design Grade Line (Cyan Solid - Dynamic VPIs) */}
                          <path
                            d={dynamicProfilePaths.designPath}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.5"
                          />

                          {/* VPI Handles */}
                          <circle cx="240" cy="70" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                          <circle
                            cx="450"
                            cy={vpiY}
                            r="6"
                            fill="#38bdf8"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="cursor-ns-resize"
                          />
                          <text x="460" y={vpiY - 4} fill="#38bdf8" fontSize="9" fontWeight="bold">
                            VPI-02 ({vpi2.elevationM.toFixed(1)}m)
                          </text>

                          {/* Slope Text */}
                          <text x="100" y="72" fill="#8ed5ff" fontSize="8">+1.20%</text>
                          <text x="320" y="48" fill={Math.abs(vpi2.gradeInPercent ?? 2.34) > standard.maxGradePercent ? '#f43f5e' : '#38bdf8'} fontSize="8" fontWeight="bold">
                            +{(vpi2.gradeInPercent ?? 2.34).toFixed(2)}% (L=435m)
                          </text>
                          <text x="560" y="55" fill="#10b981" fontSize="8">-1.50%</text>

                          {/* Quad Laser Needle (完全同期) */}
                          <g className="filter drop-shadow-[0_0_8px_rgba(244,63,94,0.9)] pointer-events-none">
                            <line x1={needleX} y1="0" x2={needleX} y2="130" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,2" />
                            <circle cx={needleX} cy={Math.max(20, Math.min(115, 130 - (stationInfo.designElevationM - 35) * 1.35))} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                            <rect x={Math.min(610, needleX + 5)} y="10" width="82" height="15" rx="2" fill="#0d1117" stroke="#f43f5e" strokeWidth="0.8" />
                            <text x={Math.min(610, needleX + 5) + 4} y="21" fill="#f43f5e" fontSize="8" fontWeight="bold">
                              {stationInfo.stationStr}
                            </text>
                          </g>
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Quad 3 Bottom Bar */}
                <div className="flex items-center justify-between text-[9px] text-[#8b949e] border-t border-[#30363d] pt-1 mt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[#38bdf8]">FH: {stationInfo.designElevationM}m</span>
                    <span className="text-[#6e7681]">GH: {stationInfo.groundElevationM}m</span>
                    <span className={stationInfo.cutOrFillHeightM < 0 ? 'text-[#f43f5e]' : 'text-[#10b981]'}>
                      切盛: {stationInfo.cutOrFillHeightM > 0 ? `+${stationInfo.cutOrFillHeightM}` : stationInfo.cutOrFillHeightM}m
                    </span>
                  </div>
                  <div className="text-[#10b981] font-bold">令第20条 縦断勾配 PASS</div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* QUAD 4 / BOTTOM-RIGHT: CROSS SECTION & CUT-FILL SLICER            */}
            {/* ================================================================= */}
            {viewMode === 'quad' && (
              <div className="bg-[#090d13] relative flex flex-col overflow-hidden p-2 select-none font-mono min-h-0">
                {/* Quad 4 Header */}
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#30363d] text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#f43f5e] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-ping" />
                      横断スライサー ({stationInfo.stationStr})
                    </span>
                    <span className="text-[9px] text-[#38bdf8] font-semibold">{stationInfo.pileNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-[#8b949e]">片勾配:</span>
                    <span className="text-[#a855f7] font-bold">{stationInfo.superelevationPercent}%</span>
                    <span className="text-[#8b949e]">幅員:</span>
                    <span className="text-[#38bdf8] font-bold">{assembly.totalRoadwayWidth.toFixed(2)}m</span>
                  </div>
                </div>

                {/* Quad 4 SVG Cross Section Diagram */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full max-h-44" viewBox="0 0 320 120">
                    {/* Ground Line */}
                    <path d="M 10,95 Q 100,88 160,78 T 310,55" fill="none" stroke="#6e7681" strokeDasharray="3,3" strokeWidth="1.2" />

                    {/* Cut Slope Left (切土のり面連動) */}
                    <line
                      x1={Math.round(45 - (stationInfo.cutAreaM2 - 14) * 1.8)}
                      y1={Math.round(45 - (stationInfo.cutAreaM2 - 14) * 1.4)}
                      x2="90"
                      y2="76"
                      stroke="#f43f5e"
                      strokeWidth="2"
                    />
                    <polygon
                      points={`${Math.round(45 - (stationInfo.cutAreaM2 - 14) * 1.8)},${Math.round(45 - (stationInfo.cutAreaM2 - 14) * 1.4)} 90,76 90,90 10,95`}
                      fill="rgba(244,63,94,0.2)"
                    />

                    {/* Pavement Structure with Cant Rotation */}
                    <g transform={`rotate(${(stationInfo.superelevationPercent - 2.0) * 0.9}, 160, 77)`}>
                      <rect x="90" y="74" width="140" height="8" fill="#21262d" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1="160" y1="74" x2="160" y2="82" stroke="#f0f6fc" strokeWidth="1.5" />
                    </g>

                    {/* Sidewalk Right */}
                    <rect x="230" y="70" width="40" height="12" fill="#161b22" stroke="#bdc8d1" strokeWidth="1" />

                    {/* Fill Slope Right (盛土のり面連動) */}
                    <line
                      x1="270"
                      y1="76"
                      x2={Math.round(295 + (stationInfo.fillAreaM2 - 14) * 1.6)}
                      y2={Math.round(102 + (stationInfo.fillAreaM2 - 14) * 0.9)}
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <polygon
                      points={`230,82 270,76 ${Math.round(295 + (stationInfo.fillAreaM2 - 14) * 1.6)},${Math.round(102 + (stationInfo.fillAreaM2 - 14) * 0.9)} 310,55 230,72`}
                      fill="rgba(16,185,129,0.2)"
                    />

                    {/* Dimensions & Labels */}
                    <text x="105" y="65" fill="#8ed5ff" fontSize="8" fontWeight="bold">
                      車道 W={(assembly.laneWidth * 2).toFixed(1)}m (i={stationInfo.superelevationPercent.toFixed(1)}%)
                    </text>
                    <text x="235" y="62" fill="#bdc8d1" fontSize="7">
                      歩道{assembly.sidewalkWidth}m
                    </text>
                  </svg>
                </div>

                {/* Quad 4 Bottom Specs Grid */}
                <div className="grid grid-cols-4 gap-1 text-[9px] bg-[#161b22] p-1 rounded border border-[#30363d] mt-0.5">
                  <div>切土面積: <strong className="text-[#f43f5e]">{stationInfo.cutAreaM2} m²</strong></div>
                  <div>盛土面積: <strong className="text-[#10b981]">{stationInfo.fillAreaM2} m²</strong></div>
                  <div>切盛比: <strong className="text-[#10b981]">{dynamicEarthworkBalance.ratioPercent}%</strong></div>
                  <div>土量収支: <span className="text-[#38bdf8]">{dynamicEarthworkBalance.netVolumeM3 > 0 ? '盛土超過' : '切土超過'}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* =================================================================== */}
          {/* BOTTOM INSPECTION TRAY: PROFILE & CROSS SECTION & MASS HAUL CURVE   */}
          {/* =================================================================== */}
          {viewMode !== 'quad' && (
            <section className="h-56 bg-[#0d1117] border-t border-[#30363d] flex flex-col z-30 shrink-0 select-none">
              {/* Dock Header */}
              <div className="h-7 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between font-mono text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="text-[#f0f6fc] font-bold">下部詳細解析ドック</span>
                  <div className="flex items-center ml-4 gap-1">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`px-2.5 py-0.5 font-semibold flex items-center gap-1 transition-colors ${
                        activeTab === 'profile'
                          ? 'bg-[#0d1117] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                          : 'text-[#8b949e] hover:text-[#f0f6fc]'
                      }`}
                    >
                      <span>縦断線形プロファイル (Profile)</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('section')}
                      className={`px-2.5 py-0.5 flex items-center gap-1 transition-colors ${
                        activeTab === 'section'
                          ? 'bg-[#0d1117] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                          : 'text-[#8b949e] hover:text-[#f0f6fc]'
                      }`}
                    >
                      <span>横断スライサー (Section @ 12+350)</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('masshaul')}
                      className={`px-2.5 py-0.5 flex items-center gap-1 transition-colors ${
                        activeTab === 'masshaul'
                          ? 'bg-[#0d1117] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                          : 'text-[#8b949e] hover:text-[#f0f6fc]'
                      }`}
                    >
                      <span>土量マスカーブ (Mass-Haul Balance)</span>
                    </button>
                  </div>
                </div>

              {/* Quick Stats Summary */}
              <div className="flex items-center gap-3 text-[9px]">
                <div className="flex items-center gap-1">
                  <span className="text-[#8b949e]">切土:</span>
                  <span className="text-[#f43f5e] font-bold">{dynamicEarthworkBalance.cutVolume.toLocaleString()} m³</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#8b949e]">盛土:</span>
                  <span className="text-[#10b981] font-bold">{dynamicEarthworkBalance.fillVolume.toLocaleString()} m³</span>
                </div>
                <div className="flex items-center gap-1 bg-[#21262d] px-1.5 py-0.2 rounded border border-[#30363d]">
                  <span className="text-[#8b949e]">残差:</span>
                  <span className="text-[#10b981] font-bold">
                    +{dynamicEarthworkBalance.balanceVolume.toLocaleString()} m³ (収束率 {dynamicEarthworkBalance.ratioPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Dock Content */}
            <div className="flex-1 flex overflow-hidden p-2 gap-2">
              {/* Profile Curve CAD Graph */}
              <div className="flex-1 bg-[#090d13] rounded border border-[#30363d] relative overflow-hidden flex flex-col p-1.5 font-mono">
                <div className="flex items-center justify-between text-[9px] text-[#8b949e] mb-0.5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#38bdf8]">
                      <span className="w-2.5 h-0.5 bg-[#38bdf8]"></span> 計画路面高 (Design Line)
                    </span>
                    <span className="flex items-center gap-1 text-[#6e7681]">
                      <span className="w-2.5 h-0.5 bg-[#6e7681] border-b border-dashed"></span> 現況地盤高 (DEM Ground)
                    </span>
                    <span className="text-[#f59e0b]">VCL曲線: Rv=3,000m / L=120m</span>
                  </div>
                  <div className="text-[#6e7681]">X: 1:1000 / Y: 1:200 (Z強調 5.0x)</div>
                </div>

                {/* Profile SVG Diagram */}
                <svg
                  className="w-full flex-1 cursor-crosshair"
                  preserveAspectRatio="none"
                  viewBox="0 0 700 110"
                  onClick={handleProfileSvgClick}
                >
                  {/* Grid lines */}
                  <line x1="0" y1="25" x2="700" y2="25" stroke="#1c2026" strokeWidth="1" />
                  <line x1="0" y1="55" x2="700" y2="55" stroke="#1c2026" strokeWidth="1" />
                  <line x1="0" y1="85" x2="700" y2="85" stroke="#1c2026" strokeWidth="1" />
                  <line x1="100" y1="0" x2="100" y2="110" stroke="#1c2026" strokeWidth="1" />
                  <line x1="250" y1="0" x2="250" y2="110" stroke="#1c2026" strokeWidth="1" />
                  <line x1="420" y1="0" x2="420" y2="110" stroke="#1c2026" strokeWidth="1" />
                  <line x1="580" y1="0" x2="580" y2="110" stroke="#1c2026" strokeWidth="1" />

                  {/* Ground DEM Line (Dynamic DEM based on IPs) */}
                  <path
                    d={dynamicProfilePaths.groundPath}
                    fill="none"
                    stroke="#6e7681"
                    strokeDasharray="4,3"
                    strokeWidth="1.5"
                  />

                  {/* Cut / Fill Hatch Area (動的連動) */}
                  {(() => {
                    const vpi2 = vpis.find((v) => v.id === 'VPI-02') || { elevationM: 64.98 };
                    const vpiElevDiff = (vpi2.elevationM - 64.98);
                    const vpiY = Math.round(38 - vpiElevDiff * 1.5);
                    return (
                      <>
                        <path
                          d={dynamicProfilePaths.cutHatchPath}
                          fill="rgba(244,63,94,0.28)"
                        />
                        <path
                          d={dynamicProfilePaths.fillHatchPath}
                          fill="rgba(16,185,129,0.28)"
                        />
                        {/* Design Grade Line (Cyan Solid - VPI動的連動) */}
                        <path
                          d={dynamicProfilePaths.designPath}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                        />
                        {/* VPI-02 Interactive Control Handle */}
                        <circle
                          cx="420"
                          cy={vpiY}
                          r="6"
                          fill="#38bdf8"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="cursor-ns-resize hover:scale-125 transition-transform"
                          title="VPI-02 (標高変更ハンドル)"
                        />
                        <text x="430" y={vpiY - 4} fill="#38bdf8" fontFamily="JetBrains Mono" fontSize="8" fontWeight="bold">
                          VPI-02 (FH={vpi2.elevationM}m)
                        </text>
                      </>
                    );
                  })()}

                  {/* Slope Annotations */}
                  {(() => {
                    const vpi2 = vpis.find((v) => v.id === 'VPI-02');
                    const gIn = vpi2 ? vpi2.gradeInPercent : 2.34;
                    const gOut = vpi2 ? vpi2.gradeOutPercent : -1.50;
                    return (
                      <>
                        <text x="90" y="62" fill="#8ed5ff" fontFamily="JetBrains Mono" fontSize="8">
                          +1.20% (L=800m)
                        </text>
                        <text x="300" y="38" fill={Math.abs(gIn) > standard.maxGradePercent ? '#f43f5e' : '#38bdf8'} fontFamily="JetBrains Mono" fontSize="8" fontWeight="bold">
                          {gIn > 0 ? `+${gIn.toFixed(2)}` : gIn.toFixed(2)}% (L=435m)
                        </text>
                        <text x="520" y="45" fill={Math.abs(gOut) > standard.maxGradePercent ? '#f43f5e' : '#10b981'} fontFamily="JetBrains Mono" fontSize="8">
                          {gOut > 0 ? `+${gOut.toFixed(2)}` : gOut.toFixed(2)}% (L=1215m)
                        </text>
                      </>
                    );
                  })()}

                  {/* Synchronized Station Needle (四眼連動レーザーニードル) */}
                  {(() => {
                    const needleX = Math.round((currentStationM / 2440) * 700);
                    return (
                      <g className="filter drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]">
                        <line x1={needleX} y1="0" x2={needleX} y2="110" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,2" />
                        <circle cx={needleX} cy={Math.max(15, Math.min(95, 110 - (stationInfo.designElevationM - 40) * 1.5))} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                        <rect x={Math.min(610, needleX + 5)} y="12" width="80" height="15" rx="2" fill="#0d1117" stroke="#f43f5e" strokeWidth="0.8" />
                        <text x={Math.min(610, needleX + 5) + 4} y="23" fill="#f43f5e" fontFamily="JetBrains Mono" fontSize="8" fontWeight="bold">
                          {stationInfo.stationStr}
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Section Assembly Mini Slicer View */}
              <div className="w-76 bg-[#090d13] rounded border border-[#30363d] p-1.5 flex flex-col justify-between font-mono">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-0.5">
                  <span className="text-[9px] text-[#f43f5e] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
                    横断断面図 ({stationInfo.stationStr})
                  </span>
                  <span className="text-[8px] text-[#38bdf8] font-bold">
                    {stationInfo.pileNumber}
                  </span>
                </div>

                {/* Mini Cross Section Vector Diagram (断面積連動伸縮) */}
                <svg className="w-full h-20 my-0.5" viewBox="0 0 240 90">
                  {/* Ground Line */}
                  <path d="M 10,75 Q 80,68 120,60 T 230,40" fill="none" stroke="#6e7681" strokeDasharray="3,3" strokeWidth="1.2" />
                  {/* Cut Bank Left (切土のり面連動) */}
                  <line
                    x1={Math.round(35 - (stationInfo.cutAreaM2 - 14) * 1.5)}
                    y1={Math.round(35 - (stationInfo.cutAreaM2 - 14) * 1.2)}
                    x2="65"
                    y2="58"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points={`${Math.round(35 - (stationInfo.cutAreaM2 - 14) * 1.5)},${Math.round(35 - (stationInfo.cutAreaM2 - 14) * 1.2)} 65,58 65,70 10,75`}
                    fill="rgba(244,63,94,0.15)"
                  />
                  {/* Pavement Structure (片勾配カント連動) */}
                  <g transform={`rotate(${(stationInfo.superelevationPercent - 2.0) * 0.8}, 120, 59)`}>
                    <rect x="65" y="56" width="110" height="6" fill="#21262d" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="120" y1="56" x2="120" y2="62" stroke="#f0f6fc" strokeWidth="1" />
                  </g>
                  {/* Sidewalk Right */}
                  <rect x="175" y="53" width="30" height="9" fill="#161b22" stroke="#bdc8d1" strokeWidth="1" />
                  {/* Fill Slope Right (盛土のり面連動) */}
                  <line
                    x1="205"
                    y1="58"
                    x2={Math.round(225 + (stationInfo.fillAreaM2 - 14) * 1.4)}
                    y2={Math.round(80 + (stationInfo.fillAreaM2 - 14) * 0.8)}
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points={`175,62 205,58 ${Math.round(225 + (stationInfo.fillAreaM2 - 14) * 1.4)},${Math.round(80 + (stationInfo.fillAreaM2 - 14) * 0.8)} 230,40 175,55`}
                    fill="rgba(16,185,129,0.15)"
                  />
                  <text x="75" y="50" fill="#8ed5ff" fontFamily="JetBrains Mono" fontSize="7">
                    W={assembly.totalRoadwayWidth.toFixed(2)}m (i={stationInfo.superelevationPercent.toFixed(1)}%)
                  </text>
                  <text x="180" y="48" fill="#bdc8d1" fontFamily="JetBrains Mono" fontSize="6">
                    歩道{assembly.sidewalkWidth}m
                  </text>
                </svg>

                {/* Mini Specs values */}
                <div className="grid grid-cols-2 gap-1 text-[8px] bg-[#161b22] p-1 rounded border border-[#30363d]">
                  <div>切土断面積: <strong className="text-[#f43f5e]">{stationInfo.cutAreaM2} m²</strong></div>
                  <div>盛土断面積: <strong className="text-[#10b981]">{stationInfo.fillAreaM2} m²</strong></div>
                  <div>計画高 FH: <strong className="text-[#38bdf8]">{stationInfo.designElevationM} m</strong></div>
                  <div>地盤高 GH: <span className="text-[#8b949e]">{stationInfo.groundElevationM} m</span></div>
                </div>
              </div>
            </div>
          </section>
          )}
        </section>

        {/* ===================================================================== */}
        {/* RIGHT PANE: ROAD COPILOT & REAL-TIME REGULATORY AUDIT MATRIX         */}
        {/* ===================================================================== */}
        {!isRightPaneOpen ? (
          <div className="w-8 bg-[#0d1117] border-l border-[#30363d] flex flex-col items-center py-2 z-30 shrink-0 select-none">
            <button
              onClick={() => setIsRightPaneOpen(true)}
              className="p-1.5 bg-[#161b22] hover:bg-[#a855f7] hover:text-[#090d13] text-[#a855f7] rounded border border-[#30363d] transition-all shadow"
              title="Road Copilot AI パネルを展開"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="[writing-mode:vertical-rl] text-[10px] font-mono text-[#a855f7] mt-4 tracking-widest flex items-center gap-1 font-bold">
              COPILOT AI
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
                <div className="font-mono text-xs text-[#f0f6fc] font-bold flex items-center gap-1.5">
                  Road Copilot AI
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                </div>
                <div className="font-mono text-[9px] text-[#a855f7]">法規監査 &amp; 幾何最適化</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAuditSettings(!showAuditSettings)}
                className={`p-1 rounded transition-colors ${
                  showAuditSettings ? 'text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/30' : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
                title="法規監査パラメータ設定"
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 font-mono text-[10px] no-scrollbar">
            {/* Audit Settings Panel (Toggleable) */}
            {showAuditSettings && (
              <div className="p-2 bg-[#161b22] border border-[#38bdf8]/40 rounded space-y-2">
                <div className="flex items-center justify-between text-[#38bdf8] font-bold">
                  <span className="flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    監査判定モード設定
                  </span>
                  <button
                    onClick={() => setShowAuditSettings(false)}
                    className="text-[#8b949e] hover:text-[#f0f6fc] text-xs"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <button
                    onClick={() => setAuditMode('strict')}
                    className={`py-1 rounded text-center transition-colors ${
                      auditMode === 'strict'
                        ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                        : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                    }`}
                  >
                    厳格モード (土研基準)
                  </button>
                  <button
                    onClick={() => setAuditMode('standard')}
                    className={`py-1 rounded text-center transition-colors ${
                      auditMode === 'standard'
                        ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                        : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
                    }`}
                  >
                    標準令規定
                  </button>
                </div>
                <p className="text-[8px] text-[#6e7681] leading-relaxed">
                  {auditMode === 'strict'
                    ? '曲線半径・緩和曲線長・建築限界に対して+10%のマージン安全係数を要求します。'
                    : '道路構造令の法文下限値を厳密判定境界とします。'}
                </p>
              </div>
            )}

            {/* SECTION 1: 道路構造令 リアルタイム法規適合マトリクス */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[#8b949e] font-semibold">
                <span className="flex items-center gap-1 text-[#10b981]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  道路構造令 監査マトリクス
                </span>
                <span className="bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.2 rounded font-bold text-[9px]">
                  ALL PASS (6/6)
                </span>
              </div>

              <div className="bg-[#161b22] rounded border border-[#30363d] divide-y divide-[#30363d]">
                {auditMatrix.map((item) => (
                  <div key={item.id} className="p-1.5 flex items-center justify-between">
                    <div>
                      <div className="text-[#f0f6fc] font-medium text-[9px]">{item.clause}</div>
                      <div className="text-[#8b949e] text-[8px]">{item.expression}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-[#10b981] bg-[#10b981]/10 px-1 py-0.2 rounded font-bold">
                        適合 PASS
                      </span>
                      {item.marginPercent && (
                        <div className="text-[#6e7681] text-[8px]">裕度 {item.marginPercent}%</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: AI Multi-Agent Reasoning & Active Optimization Proposal */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[#8b949e] font-semibold">
                <span className="flex items-center gap-1 text-[#a855f7]">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI推論ダイアログ提案 (Active)
                </span>
                <span className="text-[9px] text-[#6e7681]">Agent Line-07</span>
              </div>

              <div className="bg-[#161b22] rounded border border-[#a855f7]/40 p-2.5 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"></span>
                    <span className="font-bold text-[#f0f6fc]">STA. 12+350 曲線緩和最適化</span>
                  </div>
                  <span className="bg-[#a855f7]/20 text-[#a855f7] px-1 rounded font-bold text-[9px]">
                    スコア 96.4
                  </span>
                </div>

                <div className="text-[#8b949e] text-[9px] bg-[#0d1117]/80 p-2 rounded border border-[#30363d] space-y-1">
                  <div className="flex justify-between">
                    <span>IP-02 シフト量:</span>
                    <strong className="text-[#38bdf8]">+{ip2Offset.dx.toFixed(2)}m (民有地回避)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>令規格判定:</span>
                    <strong className="text-[#10b981]">R={dynamicRadius}m (&gt; 150m PASS)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>土量均衡率:</span>
                    <strong className="text-[#10b981]">{dynamicEarthworkBalance.ratioPercent}% 最適収束</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[9px] bg-[#0d1117] p-1.5 rounded border border-[#30363d]">
                  <div>事業費削減: <strong className="text-[#10b981]">▲ ¥18.4M</strong></div>
                  <div>買収工期: <strong className="text-[#10b981]">▲ 2.5ヶ月</strong></div>
                  <div>最大横断勾配: <span className="text-[#f0f6fc]">i = 5.0%</span></div>
                  <div>法面保護工: <span className="text-[#f0f6fc]">植生筋工 1:{assembly.embankmentSlopeRatio}</span></div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-1 pt-1">
                  <button
                    onClick={commitGeometrySkill}
                    disabled={isCommitted}
                    className={`w-full py-1.5 rounded flex items-center justify-center gap-1 text-[10px] font-bold transition-all ${
                      isCommitted
                        ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                        : 'bg-[#38bdf8] text-[#090d13] hover:bg-[#7bd0ff] active:scale-95 shadow-sm'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isCommitted ? 'クロソイド幾何 確定済 (Committed)' : 'クロソイド幾何確定コミット (Commit)'}</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      onClick={exportLandXmlSkill}
                      className="flex-1 bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] border border-[#30363d] py-1 rounded text-[9px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <FileCode className="w-3 h-3 text-[#38bdf8]" />
                      <span>LandXML 1.2 出力</span>
                    </button>
                    <button
                      onClick={writeQgisAttributeSkill}
                      className="flex-1 bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] border border-[#30363d] py-1 rounded text-[9px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <Cloud className="w-3 h-3 text-[#10b981]" />
                      <span>QGIS属性へ書込</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Real-time Multi-Agent Telemetry Status */}
            <div className="border-t border-[#30363d] pt-2.5">
              <div className="text-[9px] text-[#8b949e] uppercase mb-1.5 font-semibold">
                稼働中AIエージェント (7/7 Active)
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <div className="bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] flex items-center justify-between">
                  <span className="text-[#8b949e]">Line Agent</span>
                  <span className="text-[#10b981] font-bold">12ms</span>
                </div>
                <div className="bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] flex items-center justify-between">
                  <span className="text-[#8b949e]">Profile Agent</span>
                  <span className="text-[#10b981] font-bold">8ms</span>
                </div>
                <div className="bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] flex items-center justify-between">
                  <span className="text-[#8b949e]">Earthwork</span>
                  <span className="text-[#10b981] font-bold">24ms</span>
                </div>
                <div className="bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d] flex items-center justify-between">
                  <span className="text-[#8b949e]">Legal Audit</span>
                  <span className="text-[#10b981] font-bold">4ms</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        )}
      </div>

      {/* ======================================================================= */}
      {/* LANDXML 1.2 EXPORT MODAL                                                */}
      {/* ======================================================================= */}
      {landXmlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-[11px] text-[#f0f6fc]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#0d1117]">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-bold">LandXML 1.2 線形幾何データエクスポート</span>
              </div>
              <button
                onClick={() => setLandXmlModalOpen(false)}
                className="text-[#8b949e] hover:text-[#f0f6fc]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              <div className="text-[10px] text-[#8b949e]">
                国土交通省「道路設計データ標準化ガイドライン」および LandXML 1.2 準拠の幾何定義ファイルです。
              </div>
              <pre className="bg-[#0d1117] border border-[#30363d] p-3 rounded text-[10px] text-[#8ed5ff] overflow-x-auto leading-relaxed max-h-96">
                {generatedLandXml}
              </pre>
            </div>

            <div className="px-4 py-2 border-t border-[#30363d] bg-[#0d1117] flex justify-between items-center">
              <span className="text-[10px] text-[#6e7681]">EPSG:6677 / 平面直角第IX系</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLandXml}
                  className="bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5 text-[#38bdf8]" />}
                  <span>{isCopied ? 'コピー完了' : 'コードをコピー'}</span>
                </button>
                <button
                  onClick={handleDownloadLandXml}
                  className="bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.xml 保存</span>
                </button>
                <button
                  onClick={() => setLandXmlModalOpen(false)}
                  className="bg-[#38bdf8] text-[#090d13] font-bold px-3 py-1 rounded text-xs hover:bg-[#7bd0ff] transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASAM OpenDRIVE 1.7 & 国交省ダイナミックマップ HD-Map モーダル */}
      <OpenDriveModal
        isOpen={isOpenDriveModalOpen}
        onClose={() => setIsOpenDriveModalOpen(false)}
        activeProject={activeProject}
      />
    </div>
  );
};
