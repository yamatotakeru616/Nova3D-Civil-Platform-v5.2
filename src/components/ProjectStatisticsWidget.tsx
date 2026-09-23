import React, { useState } from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Scale,
  Route,
  HardHat,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Info
} from 'lucide-react';
import { CivilProject, DesignPlan } from '../types';

export interface ConstructionPhaseItem {
  id: string;
  name: string;
  category: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'warning' | 'pending';
  statusLabel: string;
  metricLabel: string;
  metricValue: string;
  schedulePeriod?: string;
  criticalNotice?: string;
}

interface PhaseProgressBarProps {
  phase: ConstructionPhaseItem;
  showDetails?: boolean;
}

/**
 * 施工フェーズ専用ビジュアルプログレスバー＆ステータスインジケーター
 */
export const PhaseProgressBar: React.FC<PhaseProgressBarProps> = ({ phase, showDetails = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  // ステータスに応じたカラー・テーマ設計
  const statusConfig = {
    completed: {
      barGradient: 'from-[#10b981] to-[#34d399]',
      textColor: 'text-[#10b981]',
      badgeBg: 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30',
      dotColor: 'bg-[#10b981]',
      icon: CheckCircle2,
      pulse: false,
    },
    in_progress: {
      barGradient: 'from-[#38bdf8] to-[#0ea5e9]',
      textColor: 'text-[#38bdf8]',
      badgeBg: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30',
      dotColor: 'bg-[#38bdf8]',
      icon: Activity,
      pulse: true,
    },
    warning: {
      barGradient: 'from-[#f59e0b] to-[#fbbf24]',
      textColor: 'text-[#f59e0b]',
      badgeBg: 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30',
      dotColor: 'bg-[#f59e0b]',
      icon: AlertTriangle,
      pulse: true,
    },
    pending: {
      barGradient: 'from-[#4b5563] to-[#6b7280]',
      textColor: 'text-[#6e7681]',
      badgeBg: 'bg-[#21262d] text-[#8b949e] border-[#30363d]',
      dotColor: 'bg-[#6e7681]',
      icon: Clock,
      pulse: false,
    },
  }[phase.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`p-1.5 rounded transition-all duration-200 border ${
        isHovered
          ? 'bg-[#1c2128] border-[#38bdf8]/40 shadow-sm'
          : 'bg-[#0d1117]/50 border-transparent hover:border-[#30363d]'
      }`}
    >
      {/* Header: Name, Indicator Dot, Status Badge, Percentage */}
      <div className="flex items-center justify-between text-[9px] mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Status Indicator Icon & Pulse Dot */}
          <span className="relative flex items-center justify-center shrink-0">
            {statusConfig.pulse && (
              <span
                className={`absolute w-3.5 h-3.5 rounded-full ${statusConfig.dotColor} opacity-30 animate-ping`}
              />
            )}
            <StatusIcon className={`w-3 h-3 ${statusConfig.textColor}`} />
          </span>

          <span
            className={`font-semibold truncate ${
              phase.status === 'completed'
                ? 'text-[#8b949e]'
                : phase.status === 'warning'
                ? 'text-[#f59e0b]'
                : 'text-[#f0f6fc]'
            }`}
          >
            {phase.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {/* Status Badge */}
          <span
            className={`text-[8px] px-1 py-0.2 rounded border font-sans font-medium whitespace-nowrap ${statusConfig.badgeBg}`}
          >
            {phase.statusLabel}
          </span>

          {/* Progress Percentage */}
          <span className={`font-mono font-bold text-[9.5px] ${statusConfig.textColor}`}>
            {phase.progress}%
          </span>
        </div>
      </div>

      {/* Visual Multi-Segmented Progress Bar */}
      <div className="relative h-2 w-full bg-[#161b22] rounded-full overflow-hidden border border-[#30363d]">
        {/* Progress Track Fill with Gradient & Striped Shimmer */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${statusConfig.barGradient} transition-all duration-500 relative`}
          style={{ width: `${phase.progress}%` }}
        >
          {phase.status === 'in_progress' && (
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          )}
        </div>

        {/* Segment Markers: 25%, 50%, 75% tick marks for civil inspection accuracy */}
        <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5">
          <span className="w-px h-full bg-[#30363d]/70" style={{ left: '25%' }} />
          <span className="w-px h-full bg-[#30363d]/70" style={{ left: '50%' }} />
          <span className="w-px h-full bg-[#30363d]/70" style={{ left: '75%' }} />
        </div>
      </div>

      {/* Metric Detail Sub-row */}
      <div className="flex items-center justify-between text-[8px] text-[#6e7681] mt-0.5 font-mono">
        <span className="truncate">{phase.metricLabel}: <strong className="text-[#8b949e] font-normal">{phase.metricValue}</strong></span>
        {phase.schedulePeriod && (
          <span className="text-[#6e7681] shrink-0">{phase.schedulePeriod}</span>
        )}
      </div>

      {/* Critical notice on hover or for warnings */}
      {(isHovered || phase.status === 'warning' || showDetails) && phase.criticalNotice && (
        <div
          className={`mt-1 pt-1 border-t text-[8px] flex items-center gap-1 ${
            phase.status === 'warning'
              ? 'border-[#f59e0b]/20 text-[#f59e0b]'
              : 'border-[#30363d] text-[#8b949e]'
          }`}
        >
          <Info className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{phase.criticalNotice}</span>
        </div>
      )}
    </div>
  );
};

interface ProjectStatisticsWidgetProps {
  project?: CivilProject;
  currentPlan?: DesignPlan;
}

export const ProjectStatisticsWidget: React.FC<ProjectStatisticsWidgetProps> = ({
  project,
  currentPlan,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAllPhaseDetails, setShowAllPhaseDetails] = useState<boolean>(false);

  // 切土・盛土量の算出 (currentPlan優先、フォールバックでproject)
  const cutM3 = currentPlan?.cutVolume ?? project?.earthworkSummary?.cutM3 ?? 428000;
  const fillM3 = currentPlan?.fillVolume ?? project?.earthworkSummary?.fillM3 ?? 386000;
  const balanceM3 = cutM3 - fillM3;
  const balanceRatio = fillM3 > 0 ? (cutM3 / fillM3) : 1;

  // 路線総延長 (km & メートル表示)
  const totalLengthKm = project?.totalLengthKm ?? 4.85;
  const totalLengthM = Math.round(totalLengthKm * 1000);

  // 施工フェーズ・進捗率 (Phase 2: 土工・構造物工)
  const currentPhaseName = '第2工区：土工・地盤改良 & 構造物基礎';
  const overallProgressPercent = 64;

  // 5大施工フェーズの詳細データ（工種・進捗・ステータスインジケーター）
  const constructionPhases: ConstructionPhaseItem[] = [
    {
      id: 'land',
      name: '用地補償・公図境界確定',
      category: '用地工',
      progress: 92,
      status: 'completed',
      statusLabel: '完了・登記済',
      metricLabel: '確定筆数',
      metricValue: '45 / 49 筆 (公図第12筆 買収完了)',
      schedulePeriod: '2025Q1〜Q3',
      criticalNotice: '全線残余4筆の所有権移転協議完了（登記申請中）',
    },
    {
      id: 'earthwork',
      name: '土工 (掘削・盛土・流用)',
      category: '土工',
      progress: 68,
      status: 'in_progress',
      statusLabel: '施工中・順調',
      metricLabel: '土工完了量',
      metricValue: `${Math.round(cutM3 * 0.68).toLocaleString()} / ${cutM3.toLocaleString()} m³`,
      schedulePeriod: '2025Q3〜2026Q2',
      criticalNotice: '流用率90.2%達成、残土運搬ダンプフリート稼働中',
    },
    {
      id: 'tunnel',
      name: '金峰山トンネル工 (NATM)',
      category: 'トンネル工',
      progress: 54,
      status: 'in_progress',
      statusLabel: '施工中・支保CI',
      metricLabel: '掘進延長',
      metricValue: '999 / 1,850 m (本線貫通 54%)',
      schedulePeriod: '2025Q2〜2026Q4',
      criticalNotice: '内空変位収束計測安定、切羽前前方削孔探査中',
    },
    {
      id: 'bridge',
      name: '緑川渡河橋梁工 (基礎・下部)',
      category: '橋梁工',
      progress: 42,
      status: 'warning',
      statusLabel: '要警戒・P2仮締切',
      metricLabel: '下部工進捗',
      metricValue: '橋脚P1完了 / P2仮締切施工中',
      schedulePeriod: '2025Q3〜2026Q3',
      criticalNotice: '梅雨出水期警戒体制：水位遠隔センサー連動中',
    },
    {
      id: 'pavement',
      name: '舗装・付帯設備・照明工',
      category: '舗装工',
      progress: 0,
      status: 'pending',
      statusLabel: '待機・未着工',
      metricLabel: '施工区間',
      metricValue: 'Sta.0+00 〜 Sta.48+50 着工準備',
      schedulePeriod: '2026Q3〜2027Q1',
      criticalNotice: '路盤工完了後に高機能遮熱性アスファルト舗装予定',
    },
  ];

  return (
    <div className="bg-[#161b22]/90 border border-[#30363d] rounded-md overflow-hidden text-[10px] font-mono shadow-md transition-all">
      {/* Widget Header with Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-2.5 py-1.5 bg-[#1c2128] hover:bg-[#262c36] flex items-center justify-between text-[#f0f6fc] border-b border-[#30363d]/60 transition-colors"
        title="プロジェクト統計サマリーの開閉"
      >
        <div className="flex items-center gap-1.5 font-bold text-[#38bdf8]">
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="text-[11px] tracking-wide">Project Statistics</span>
          <span className="bg-[#38bdf8]/15 text-[#38bdf8] text-[9px] px-1 py-0.2 rounded border border-[#38bdf8]/30">
            Realtime
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#8b949e]">
          <span className="text-[9px]">{isExpanded ? '畳む' : '展開'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-2 space-y-2.5 bg-[#0d1117]/60">
          {/* 1. Total Road Length Key Metric */}
          <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
            <div className="flex items-center justify-between text-[#8b949e] mb-1">
              <span className="flex items-center gap-1 text-[#7bd0ff]">
                <Route className="w-3 h-3" />
                <span>路線総延長 (Road Length)</span>
              </span>
              <span className="text-[9px] text-[#8b949e]">設計速度 {project?.designSpeed ?? 80} km/h</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-[#f0f6fc] tracking-tight">
                  {totalLengthKm.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#8b949e]">km</span>
                <span className="text-[10px] text-[#8b949e] ml-1">({totalLengthM.toLocaleString()} m)</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#38bdf8] border border-[#38bdf8]/20">
                STA.0+000 〜 {`STA.${Math.floor(totalLengthM / 100)}+${String(totalLengthM % 100).padStart(2, '0')}`}
              </span>
            </div>
          </div>

          {/* 2. Cut & Fill Earthwork Volume Balance */}
          <div className="bg-[#161b22] p-2 rounded border border-[#30363d] space-y-1.5">
            <div className="flex items-center justify-between text-[#8b949e]">
              <span className="flex items-center gap-1 text-[#f0f6fc] font-semibold">
                <Scale className="w-3 h-3 text-[#38bdf8]" />
                <span>土量収支 (Cut / Fill Balance)</span>
              </span>
              <span className="text-[9px] text-[#8b949e]">
                案{currentPlan?.id ?? project?.selectedPlanId ?? 'A'}連動
              </span>
            </div>

            {/* Cut / Fill Grid */}
            <div className="grid grid-cols-2 gap-1.5 text-[9px]">
              {/* Cut */}
              <div className="bg-[#090d13] p-1.5 rounded border border-[#f43f5e]/30">
                <div className="flex items-center justify-between text-[#f43f5e] mb-0.5">
                  <span className="flex items-center gap-0.5">
                    <TrendingDown className="w-2.5 h-2.5" />
                    <span>総切土 (Cut)</span>
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[#f0f6fc]">
                  {cutM3.toLocaleString()} <span className="text-[8px] font-normal text-[#8b949e]">m³</span>
                </div>
              </div>

              {/* Fill */}
              <div className="bg-[#090d13] p-1.5 rounded border border-[#10b981]/30">
                <div className="flex items-center justify-between text-[#10b981] mb-0.5">
                  <span className="flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span>総盛土 (Fill)</span>
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[#f0f6fc]">
                  {fillM3.toLocaleString()} <span className="text-[8px] font-normal text-[#8b949e]">m³</span>
                </div>
              </div>
            </div>

            {/* Earthwork Balance Bar Visualizer */}
            <div className="pt-1">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-[#8b949e]">残差 (差引残土/不足):</span>
                <span
                  className={`font-bold ${
                    Math.abs(balanceM3) <= 5000
                      ? 'text-[#10b981]'
                      : balanceM3 > 0
                      ? 'text-[#f59e0b]'
                      : 'text-[#f43f5e]'
                  }`}
                >
                  {balanceM3 > 0 ? `+${balanceM3.toLocaleString()}` : balanceM3.toLocaleString()} m³
                </span>
              </div>

              {/* Dual bar ratio */}
              <div className="h-2 w-full bg-[#21262d] rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, Math.max(10, (cutM3 / (cutM3 + fillM3)) * 100))}%` }}
                  className="bg-[#f43f5e] h-full"
                  title={`切土率: ${((cutM3 / (cutM3 + fillM3)) * 100).toFixed(1)}%`}
                />
                <div
                  style={{ width: `${Math.min(100, Math.max(10, (fillM3 / (cutM3 + fillM3)) * 100))}%` }}
                  className="bg-[#10b981] h-full"
                  title={`盛土率: ${((fillM3 / (cutM3 + fillM3)) * 100).toFixed(1)}%`}
                />
              </div>
              <div className="flex justify-between text-[8px] text-[#6e7681] mt-0.5">
                <span>切土 {((cutM3 / (cutM3 + fillM3)) * 100).toFixed(0)}%</span>
                <span className="text-[#10b981]">流用率 91.2%</span>
                <span>盛土 {((fillM3 / (cutM3 + fillM3)) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* 3. Construction Phase Progress with Visual Progress Bars & Indicators */}
          <div className="bg-[#161b22] p-2 rounded border border-[#30363d] space-y-2">
            <div className="flex items-center justify-between text-[#8b949e]">
              <span className="flex items-center gap-1 text-[#f0f6fc] font-semibold">
                <HardHat className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>施工進捗 (Construction Phases)</span>
              </span>
              <button
                onClick={() => setShowAllPhaseDetails(!showAllPhaseDetails)}
                className="text-[8.5px] px-1.5 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#38bdf8] border border-[#38bdf8]/30 transition-colors"
                title="各工区の特記事項・工期の表示切替"
              >
                {showAllPhaseDetails ? '注記非表示' : '特記事項'}
              </button>
            </div>

            {/* Overall Phase Title & Progress Gauge */}
            <div className="bg-[#090d13] p-1.5 rounded border border-[#30363d]/60 space-y-1">
              <div className="flex justify-between text-[9px] text-[#8b949e]">
                <span className="text-[#f0f6fc] font-medium truncate">{currentPhaseName}</span>
                <span className="text-[#10b981] font-mono font-bold">{overallProgressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-[#161b22] rounded-full overflow-hidden border border-[#30363d] relative">
                <div
                  className="h-full bg-gradient-to-r from-[#38bdf8] via-[#10b981] to-[#34d399] rounded-full transition-all duration-500 relative"
                  style={{ width: `${overallProgressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/15 animate-pulse rounded-full" />
                </div>
              </div>
              <div className="flex justify-between items-center text-[7.5px] text-[#6e7681]">
                <span>全5工区中 4工区着手</span>
                <span className="text-[#38bdf8]">2026年度 竣工予定</span>
              </div>
            </div>

            {/* Enhanced Visual Progress Bar Component for Each Phase with Status Indicators */}
            <div className="space-y-1.5 pt-0.5">
              {constructionPhases.map((phase) => (
                <PhaseProgressBar
                  key={phase.id}
                  phase={phase}
                  showDetails={showAllPhaseDetails}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
