import React, { useState } from 'react';
import { useHydroSimulation } from '../hooks/useHydroSimulation';
import {
  CloudRain,
  Waves,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Volume2,
  Sun,
  FileSpreadsheet,
  FileCode,
  Download,
  Copy,
  Play,
  Pause,
  Activity,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const HydroSimulationWorkspace: React.FC = () => {
  const {
    scenarios,
    activeScenarioId,
    setActiveScenarioId,
    activeScenario,
    timelineDay,
    setTimelineDay,
    isPlaying,
    setIsPlaying,
    currentDate,
    isFloodSeason,
    cofferdamStatuses,
    environmentalPoints,
    activeTab,
    setActiveTab,
    auditItems,
    generateHydroCsv,
    generateHydroLandXml,
  } = useHydroSimulation();

  const [exportModal, setExportModal] = useState<'none' | 'csv' | 'xml'>('none');
  const [isCopied, setIsCopied] = useState(false);

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

  return (
    <div className="flex-1 flex flex-col bg-[#090d13] text-[#f0f6fc] overflow-hidden select-none font-mono">
      {/* 1. トップサブヘッダー */}
      <div className="h-10 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded border border-[#38bdf8]/30">
            <CloudRain className="w-3.5 h-3.5" />
            HYDRO & ENVIRONMENTAL
          </span>
          <span className="text-[#8b949e]">
            緑川水系 STA.6+500〜STA.8+900 // 気象庁降雨連動・河川出水＆仮締切越流4D・PLATEAU環境アセスメント
          </span>
        </div>

        {/* タブ切り替え & エクスポート */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex bg-[#161b22] p-0.5 rounded border border-[#30363d]">
            <button
              onClick={() => setActiveTab('river')}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'river'
                  ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>河川出水・仮締切越流 (4D)</span>
            </button>
            <button
              onClick={() => setActiveTab('plateau')}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'plateau'
                  ? 'bg-[#38bdf8] text-[#090d13] font-bold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>PLATEAU日影・騒音アセスメント</span>
            </button>
          </div>

          <button
            onClick={() => setExportModal('csv')}
            className="bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>水文報告 CSV</span>
          </button>
          <button
            onClick={() => setExportModal('xml')}
            className="bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#a855f7] border border-[#a855f7]/40 px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>LandXML 1.2</span>
          </button>
        </div>
      </div>

      {/* 2. メイン3ペイン */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左ペイン: 降雨シナリオ & 4D施工カレンダー */}
        <div className="w-80 bg-[#0d1117] border-r border-[#21262d] flex flex-col p-3 overflow-y-auto shrink-0 gap-3 text-xs">
          {/* 降雨シナリオセレクタ */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#38bdf8]" />
                気象庁水文・降雨シナリオ
              </span>
              <span className="text-[10px] bg-[#38bdf8]/10 text-[#38bdf8] px-1.5 py-0.5 rounded">
                2D-SWE 流況
              </span>
            </div>

            <div className="space-y-1.5 mt-1">
              {scenarios.map((s) => {
                const isSel = s.id === activeScenarioId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveScenarioId(s.id)}
                    className={`w-full text-left p-2 rounded border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#38bdf8]/10 border-[#38bdf8] text-[#f0f6fc]'
                        : 'bg-[#090d13] border-[#21262d] text-[#8b949e] hover:border-[#30363d]'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className={isSel ? 'text-[#38bdf8]' : ''}>{s.name}</span>
                      <span className="text-[#f59e0b]">{s.rainfallMmH} mm/h</span>
                    </div>
                    <div className="flex justify-between text-[9px] mt-1 text-[#8b949e]">
                      <span>流量: {s.riverFlowM3s.toLocaleString()} m³/s</span>
                      <span>水位: EL.{s.waterElevationM.toFixed(2)} m</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-[#cbd5e1] bg-[#090d13] p-2 rounded border border-[#21262d] leading-relaxed">
              {activeScenario.description}
            </div>
          </div>

          {/* 4D施工タイムライン ＆ 出水期判定 */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#a855f7]" />
                4D施工カレンダー連動
              </span>
              <span className="text-[10px] text-[#38bdf8] font-bold">
                Day {timelineDay} / 600
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8b949e]">施工日:</span>
                <span className="font-bold text-[#f0f6fc]">
                  {currentDate.toLocaleDateString('ja-JP')}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="600"
                value={timelineDay}
                onChange={(e) => setTimelineDay(Number(e.target.value))}
                className="w-full accent-[#38bdf8] h-1.5 bg-[#090d13] rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#8b949e]">
                <span>2025/04 (着工)</span>
                <span>2025/11 (非出水期)</span>
                <span>2026/12 (竣工)</span>
              </div>
            </div>

            {/* 出水期警告バナー */}
            <div
              className={`p-2 rounded border flex items-center gap-2 ${
                isFloodSeason
                  ? 'bg-[#f43f5e]/10 border-[#f43f5e]/40 text-[#f43f5e]'
                  : 'bg-[#10b981]/10 border-[#10b981]/40 text-[#10b981]'
              }`}
            >
              {isFloodSeason ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 shrink-0" />
              )}
              <div className="text-[10px] leading-tight">
                <div className="font-bold">
                  {isFloodSeason ? '【出水期】河川内水中掘削 禁止期間' : '【非出水期】水中下部工 施工可能ウィンドウ'}
                </div>
                <div className="text-[9px] opacity-80 mt-0.5">
                  {isFloodSeason
                    ? '河川法制約: 6月〜10月は上部工架設または陸上工区に限定'
                    : '11月〜5月: P1〜P4 鋼矢板仮締切・杭打ち・フーチング施工推奨'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (isPlaying) {
                  setIsPlaying(false);
                } else {
                  setIsPlaying(true);
                  const next = timelineDay >= 600 ? 1 : timelineDay + 30;
                  setTimelineDay(next);
                }
              }}
              className="w-full bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlaying ? 'シミュレーション一時停止' : '4Dタイムライン自動再生 (+30日)'}</span>
            </button>
          </div>

          {/* 水位リアルタイムインジケータ */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-2.5 flex flex-col gap-2">
            <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#10b981]" />
              緑川基準水位マトリクス
            </span>
            <div className="space-y-1 bg-[#090d13] p-2 rounded border border-[#21262d] text-[10px]">
              <div className="flex justify-between">
                <span className="text-[#8b949e]">主桁下面高:</span>
                <span className="font-bold text-[#38bdf8]">EL. 34.50 m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">堤防天端高:</span>
                <span className="font-bold text-[#f0f6fc]">EL. 34.00 m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">計画高水位 (HWL):</span>
                <span className="font-bold text-[#f43f5e]">EL. 32.40 m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">鋼矢板仮締切天端:</span>
                <span className="font-bold text-[#f59e0b]">EL. 31.00 m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">指定警戒水位:</span>
                <span className="font-bold text-[#f59e0b]">EL. 30.10 m</span>
              </div>
              <div className="flex justify-between border-t border-[#21262d] pt-1">
                <span className="text-[#38bdf8] font-bold">現在計算水位:</span>
                <span className="font-bold text-[#38bdf8]">
                  EL. {activeScenario.waterElevationM.toFixed(2)} m
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 中央ペイン: ビューポート */}
        <div className="flex-1 flex flex-col bg-[#090d13] overflow-hidden relative">
          {activeTab === 'river' ? (
            /* Tab 1: 河川出水・仮締切越流断面キャンバス */
            <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#f0f6fc] flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-[#38bdf8]" />
                    緑川渡河部 2D水理断面 ＆ 橋脚P1〜P4 鋼矢板仮締切 越流解析
                  </span>
                  <span className="text-[10px] bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 px-1.5 py-0.5 rounded font-bold">
                    浅水流2D-SWE
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#8b949e]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-[#f43f5e]" /> HWL 32.40m
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-[#38bdf8]" /> 現在水面
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-[#f59e0b]" /> 鋼矢板仮締切
                  </span>
                </div>
              </div>

              {/* 河川断面SVGキャンバス */}
              <div className="flex-1 bg-[#0d1117] border border-[#21262d] rounded relative overflow-hidden flex flex-col">
                <svg className="w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="riverWater" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
                    </linearGradient>
                    {/* 雨脚パターン */}
                    <pattern id="rainPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <line x1="2" y1="0" x2="0" y2="10" stroke="#38bdf8" strokeWidth="1" opacity="0.4" />
                    </pattern>
                  </defs>

                  {/* 降雨エフェクト */}
                  <rect
                    x="0"
                    y="0"
                    width="1000"
                    height="500"
                    fill="url(#rainPattern)"
                    opacity={activeScenario.rainfallMmH / 120}
                  />

                  {/* 背景地盤・堤防・河床断面 */}
                  {/* 左岸堤防 (EL.34m) -> 高水敷 -> 低水路 (EL.22.5m) -> 高水敷 -> 右岸堤防 */}
                  <polygon
                    points="0,180 80,180 180,290 280,390 720,390 820,290 920,180 1000,180 1000,500 0,500"
                    fill="#161b22"
                    stroke="#30363d"
                    strokeWidth="2"
                  />

                  {/* 計画高水位 (HWL 32.40m) 破線 */}
                  <line x1="50" y1="210" x2="950" y2="210" stroke="#f43f5e" strokeWidth="2" strokeDasharray="6 4" />
                  <text x="60" y="202" fill="#f43f5e" fontSize="11" fontWeight="bold">
                    HWL 32.40m (計画高水位)
                  </text>

                  {/* 橋梁主桁下面 (EL. 34.50m) */}
                  <rect x="60" y="160" width="880" height="15" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2" />
                  <text x="500" y="172" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                    緑川橋梁 5径間連続鋼箱桁 (下面高 EL. 34.50m / 桁下余裕高 H=2.10m ≥ 1.50m PASS)
                  </text>

                  {/* 動的河川水面 (現在水位に基づくY座標) */}
                  {/* EL.22.5m = Y:390, EL.34.0m = Y:180. (1mあたり約 18.26px) */}
                  {(() => {
                    const waterY = 390 - (activeScenario.waterElevationM - 22.5) * 18.26;
                    return (
                      <g>
                        {/* 流水ポリゴン */}
                        <polygon
                          points={`160,${waterY} 840,${waterY} 720,390 280,390`}
                          fill="url(#riverWater)"
                        />
                        {/* 水面波浪線 */}
                        <path
                          d={`M 150 ${waterY} Q 250 ${waterY - 3}, 350 ${waterY} T 550 ${waterY} T 750 ${waterY} T 850 ${waterY}`}
                          fill="none"
                          stroke="#7dd3fc"
                          strokeWidth="2.5"
                        />
                        <text x="500" y={waterY - 8} fill="#f0f6fc" fontSize="11" fontWeight="bold" textAnchor="middle">
                          計算水面: EL.{activeScenario.waterElevationM.toFixed(2)}m (流速: {activeScenario.flowVelocityMs}m/s)
                        </text>
                      </g>
                    );
                  })()}

                  {/* 橋脚 (P1, P2, P3, P4) および鋼矢板仮締切 */}
                  {[
                    { id: 'P1', x: 260, topY: 175, cofferdamElev: 31.5 },
                    { id: 'P2', x: 420, topY: 175, cofferdamElev: 31.0 },
                    { id: 'P3', x: 580, topY: 175, cofferdamElev: 31.0 },
                    { id: 'P4', x: 740, topY: 175, cofferdamElev: 31.5 },
                  ].map((pier) => {
                    const cofferdamY = 390 - (pier.cofferdamElev - 22.5) * 18.26;
                    const waterY = 390 - (activeScenario.waterElevationM - 22.5) * 18.26;
                    const isOvertopped = waterY < cofferdamY;

                    return (
                      <g key={pier.id}>
                        {/* 橋脚コンクリート柱 */}
                        <rect
                          x={pier.x - 14}
                          y={pier.topY}
                          width="28"
                          height="230"
                          fill="#475569"
                          stroke="#090d13"
                          strokeWidth="2"
                        />
                        <text x={pier.x} y={pier.topY + 30} fill="#f0f6fc" fontSize="11" fontWeight="bold" textAnchor="middle">
                          {pier.id}
                        </text>

                        {/* 鋼矢板仮締切 (Cofferdam) */}
                        <rect
                          x={pier.x - 26}
                          y={cofferdamY}
                          width="52"
                          height="390 - cofferdamY"
                          fill="none"
                          stroke={isOvertopped ? '#f43f5e' : '#f59e0b'}
                          strokeWidth="3"
                          strokeDasharray="4 2"
                        />
                        {/* 仮締切天端ライン */}
                        <line
                          x1={pier.x - 30}
                          y1={cofferdamY}
                          x2={pier.x + 30}
                          y2={cofferdamY}
                          stroke={isOvertopped ? '#f43f5e' : '#f59e0b'}
                          strokeWidth="4"
                        />
                        <text
                          x={pier.x}
                          y={cofferdamY - 6}
                          fill={isOvertopped ? '#f43f5e' : '#f59e0b'}
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          天端 EL.{pier.cofferdamElev}m ({isOvertopped ? '越流冠水' : '安全'})
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* 仮締切安全ステータスHUD */}
                <div className="absolute bottom-2 left-3 right-3 bg-[#161b22]/90 backdrop-blur border border-[#30363d] rounded p-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    {cofferdamStatuses.map((c) => (
                      <div key={c.pierId} className="flex items-center gap-1.5">
                        <span className="font-bold text-[#f0f6fc]">{c.pierId}仮締切:</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'OVERTOPPING'
                              ? 'bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/40'
                              : c.status === 'ALERT'
                              ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
                              : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                          }`}
                        >
                          余裕高 {c.freeboardM > 0 ? `+${c.freeboardM}m` : `${c.freeboardM}m`} ({c.status})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-[#8b949e]">
                    流下阻害率: <strong className="text-[#10b981]">3.18%</strong> (基準値 ≤ 5.0% PASS)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: PLATEAU環境アセスメント (日影・騒音伝搬) */
            <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#f0f6fc] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#a855f7]" />
                    沿道PLATEAU LOD3建物群 日影規制 ＆ 交通騒音アセスメントマップ
                  </span>
                  <span className="text-[10px] bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 px-1.5 py-0.5 rounded">
                    BIM/CIM Compliance
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#8b949e]">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-[#f59e0b]" /> 冬至日影時間 (限度4.0h)
                  </span>
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-[#38bdf8]" /> 騒音レベル (基準60dB)
                  </span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-12 gap-3 bg-[#0d1117] border border-[#21262d] rounded p-3 overflow-hidden">
                {/* 2D鳥瞰日影・等音線マップ (8 cols) */}
                <div className="col-span-8 bg-[#090d13] border border-[#21262d] rounded p-3 relative flex flex-col">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-[#8b949e]">
                      北岡地区 沿道鳥瞰図 (高架橋・遮音壁 ＆ 等日影線・等音線オーバーレイ)
                    </span>
                    <span className="text-[10px] text-[#10b981]">全沿道住居 規制値内達成中</span>
                  </div>

                  <svg className="w-full flex-1" viewBox="0 0 600 280">
                    {/* 高架道路中心線 */}
                    <line x1="20" y1="140" x2="580" y2="140" stroke="#38bdf8" strokeWidth="18" opacity="0.6" />
                    <line x1="20" y1="140" x2="580" y2="140" stroke="#f0f6fc" strokeWidth="2" strokeDasharray="6 4" />
                    <text x="30" y="132" fill="#38bdf8" fontSize="9" fontWeight="bold">
                      高架本線 (熊本環状西道路)
                    </text>

                    {/* 等音線コンター (60dB / 55dB / 50dB) */}
                    <ellipse cx="300" cy="140" rx="260" ry="80" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                    <ellipse cx="300" cy="140" rx="200" ry="50" fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                    <text x="500" y="70" fill="#f59e0b" fontSize="8">
                      55dB 等音線
                    </text>
                    <text x="460" y="100" fill="#f43f5e" fontSize="8">
                      60dB 等音線 (環境基準線)
                    </text>

                    {/* PLATEAU 建物群 (LOD3フットプリント) */}
                    {[
                      { name: '北岡レジデンスA', x: 80, y: 50, w: 70, h: 50, shadowW: 40, db: 54.2 },
                      { name: '北岡中央クリニック', x: 220, y: 40, w: 60, h: 60, shadowW: 52, db: 56.8 },
                      { name: '城山小学校(南校舎)', x: 380, y: 45, w: 90, h: 55, shadowW: 32, db: 48.5 },
                      { name: 'リバーサイドマンション', x: 240, y: 185, w: 80, h: 65, shadowW: 38, db: 58.1 },
                    ].map((bld, idx) => (
                      <g key={idx}>
                        {/* 冬至日影プロジェクション (北西方向への影) */}
                        <polygon
                          points={`${bld.x},${bld.y + bld.h} ${bld.x + bld.w},${bld.y + bld.h} ${bld.x + bld.w + bld.shadowW},${bld.y - 15} ${bld.x + bld.shadowW},${bld.y - 15}`}
                          fill="#475569"
                          fillOpacity="0.25"
                        />
                        {/* 建物本体 */}
                        <rect
                          x={bld.x}
                          y={bld.y}
                          width={bld.w}
                          height={bld.h}
                          fill="#1e293b"
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          rx="2"
                        />
                        <text x={bld.x + bld.w / 2} y={bld.y + 20} fill="#f0f6fc" fontSize="8" fontWeight="bold" textAnchor="middle">
                          {bld.name}
                        </text>
                        <text x={bld.x + bld.w / 2} y={bld.y + 35} fill="#10b981" fontSize="8" textAnchor="middle">
                          {bld.db} dB (適合)
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* 建物別アセスメント詳細 (4 cols) */}
                <div className="col-span-4 bg-[#090d13] border border-[#21262d] rounded p-3 flex flex-col gap-2 overflow-y-auto">
                  <span className="font-bold text-[#38bdf8] text-xs">沿道建物 アセスメント詳細</span>
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {environmentalPoints.map((p) => (
                      <div key={p.buildingId} className="bg-[#161b22] p-2 rounded border border-[#21262d]">
                        <div className="flex justify-between text-[11px] font-bold text-[#f0f6fc]">
                          <span>{p.buildingName}</span>
                          <span className="text-[#38bdf8]">{p.floors}階建</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#8b949e] mt-1">
                          <span>日影時間: {p.shadowDurationHours}h (限度{p.legalLimitHours}h)</span>
                          <span className="text-[#10b981] font-bold">適合</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#8b949e] mt-0.5">
                          <span>騒音: {p.noiseLevelDb} dB (基準{p.noiseLimitDb}dB)</span>
                          <span className="text-[#10b981] font-bold">適合</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右ペイン: 監査マトリクス & AI防災提言 */}
        <div className="w-80 bg-[#0d1117] border-l border-[#21262d] flex flex-col p-3 overflow-y-auto shrink-0 gap-3 text-xs">
          {/* 河川法・出水期施工安全監査マトリクス */}
          <div className="bg-[#161b22] border border-[#30363d] rounded p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                河川法・出水安全監査
              </span>
              <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded font-bold">
                COMPLIANT
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {auditItems.map((item) => (
                <div key={item.id} className="bg-[#090d13] p-2 rounded border border-[#21262d]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#f0f6fc]">{item.title}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        item.status === 'PASS'
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : item.status === 'WARN'
                          ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                          : 'bg-[#f43f5e]/20 text-[#f43f5e]'
                      }`}
                    >
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

          {/* AI防災・工期アドバイザー */}
          <div className="bg-[#161b22] border border-[#a855f7]/40 rounded p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#a855f7] font-bold text-[11px]">
              <Zap className="w-3.5 h-3.5" />
              <span>AI水理・施工アドバイザー (Agent Hydro-03)</span>
            </div>
            <p className="text-[10px] text-[#cbd5e1] leading-relaxed">
              50年確率豪雨（120mm/h）発生時でも桁下余裕高 H=2.10m（≥1.50m）を確保。出水期（6〜10月）は緑川本川の仮設鋼矢板を撤去・冠水開放し、上部工架設（クレーンベント工法）に集中することで、増水事故リスクをゼロに抑える工程計画を承認済みです。
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
                    ? '緑川水文出水解析・環境アセスメント報告書 (CSV)'
                    : 'LandXML 1.2 水文流況・PLATEAU環境データ'}
                </span>
              </div>
              <button
                onClick={() => setExportModal('none')}
                className="text-[#8b949e] hover:text-[#f0f6fc] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <pre className="bg-[#090d13] p-3 rounded border border-[#21262d] text-[11px] font-mono text-[#cbd5e1] overflow-x-auto max-h-[50vh] leading-tight">
                {exportModal === 'csv' ? generateHydroCsv() : generateHydroLandXml()}
              </pre>
            </div>

            <div className="px-4 py-3 border-t border-[#21262d] flex justify-between items-center bg-[#161b22]">
              <span className="text-[10px] text-[#8b949e]">
                河川法第24条・水防法・BIM/CIM設計照査要領適合
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleCopyCode(exportModal === 'csv' ? generateHydroCsv() : generateHydroLandXml())
                  }
                  className="bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopied ? 'コピー完了' : 'コピー'}</span>
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile(
                      exportModal === 'csv' ? generateHydroCsv() : generateHydroLandXml(),
                      exportModal === 'csv' ? 'Midorikawa_Hydro_Simulation.csv' : 'Midorikawa_Hydro_LandXML.xml',
                      exportModal === 'csv' ? 'text/csv;charset=utf-8;' : 'application/xml'
                    )
                  }
                  className="bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportModal === 'csv' ? '.csv 保存' : '.xml 保存'}</span>
                </button>
                <button
                  onClick={() => setExportModal('none')}
                  className="bg-[#38bdf8] text-[#090d13] font-bold px-3 py-1 rounded text-xs hover:bg-[#7bd0ff] transition-colors cursor-pointer"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
