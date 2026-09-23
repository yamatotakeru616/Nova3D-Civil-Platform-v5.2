import React, { useState } from 'react';
import {
  X,
  HeartPulse,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  TrendingDown,
  Clock,
  ShieldCheck,
  Activity,
  Layers,
  Calendar,
  DollarSign
} from 'lucide-react';
import { CivilProject } from '../types';
import {
  getStructuralHealthRecords,
  simulateMarkovLcc,
  generatePeriodicInspectionCsv,
  generateInspectionXml,
  HealthRating
} from '../utils/assetManagementEngine';

interface AssetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: CivilProject;
}

export const AssetManagementModal: React.FC<AssetManagementModalProps> = ({
  isOpen,
  onClose,
  activeProject
}) => {
  const [activeTab, setActiveTab] = useState<'records' | 'markov' | 'lcc'>('records');
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(0);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const records = getStructuralHealthRecords(activeProject);
  const lcc = simulateMarkovLcc(activeProject);
  const selectedTimelinePoint = lcc.markovTimeline[selectedYearIndex] ?? lcc.markovTimeline[0];

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(`${filename} をダウンロードしました`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleDownloadCsv = () => {
    const csv = generatePeriodicInspectionCsv(activeProject);
    triggerDownload(csv, `${activeProject?.name ?? 'Kumamoto_West_Ring'}_MLIT_Asset_Health_Record.csv`, 'text/csv;charset=utf-8;');
  };

  const handleDownloadXml = () => {
    const xml = generateInspectionXml(activeProject);
    triggerDownload(xml, `${activeProject?.name ?? 'Kumamoto_West_Ring'}_MLIT_Asset_Audit.xml`, 'application/xml');
  };

  const getRatingBadge = (rating: HealthRating) => {
    switch (rating) {
      case 'I':
        return <span className="bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 px-2 py-0.5 rounded font-bold text-[10px]">判定 I (健全)</span>;
      case 'II':
        return <span className="bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 px-2 py-0.5 rounded font-bold text-[10px]">判定 II (予防保全)</span>;
      case 'III':
        return <span className="bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 px-2 py-0.5 rounded font-bold text-[10px]">判定 III (早期措置)</span>;
      case 'IV':
        return <span className="bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/40 px-2 py-0.5 rounded font-bold text-[10px]">判定 IV (緊急措置)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f43f5e]/15 text-[#f43f5e] rounded border border-[#f43f5e]/30">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#f0f6fc] tracking-wide">
                  構造物健全度点検カルテ ＆ マルコフ50年LCC劣化予測
                </h3>
                <span className="text-[10px] bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 px-1.5 py-0.5 rounded font-mono font-bold">
                  国交省定期点検要領
                </span>
                <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 px-1.5 py-0.5 rounded font-mono">
                  LCC ▲42.0% 削減
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
                対象路線: {activeProject?.name ?? '熊本環状西道路'} | 橋梁・トンネル・舗装近接目視点検 ＆ 50年間修繕最適化
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadXml}
              className="px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#38bdf8] border border-[#30363d] rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors"
              title="国交省 道路構造物電子納品 XML"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>点検XML</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="px-2.5 py-1.5 bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/40 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors"
              title="定期点検カルテ ＆ 50年LCC調書 CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>カルテCSV保存</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#30363d] bg-[#090d13] font-mono text-[11px]">
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'records'
                ? 'border-[#38bdf8] text-[#38bdf8] bg-[#161b22] font-bold'
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>部材別 点検診断台帳 (橋梁・トンネル・舗装)</span>
          </button>
          <button
            onClick={() => setActiveTab('markov')}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'markov'
                ? 'border-[#10b981] text-[#10b981] bg-[#161b22] font-bold'
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>マルコフ連鎖 50年劣化タイムマシン (2026〜2076)</span>
          </button>
          <button
            onClick={() => setActiveTab('lcc')}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'lcc'
                ? 'border-[#f59e0b] text-[#f59e0b] bg-[#161b22] font-bold'
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]/50'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>予防保全 LCC 費用縮減シミュレータ (▲42% 削減)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-[12px] flex-1">
          {downloadSuccess && (
            <div className="p-2.5 bg-[#10b981]/15 border border-[#10b981]/40 rounded text-[#10b981] flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* TAB 1: INSPECTION RECORDS */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">全体判定区分</div>
                  <div className="text-lg font-bold text-[#38bdf8] mt-1">判定 II</div>
                  <div className="text-[10px] text-[#10b981] mt-0.5">予防保全段階</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">健全度 I (健全)</div>
                  <div className="text-lg font-bold text-[#10b981] mt-1">{lcc.ratingCounts.I} 部材</div>
                  <div className="text-[10px] text-[#8b949e] mt-0.5">洗掘なし・空洞なし</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">健全度 II (予防保全)</div>
                  <div className="text-lg font-bold text-[#38bdf8] mt-1">{lcc.ratingCounts.II} 部材</div>
                  <div className="text-[10px] text-[#38bdf8] mt-0.5">塗膜Rc-I / 樹脂注入</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">健全度 III (早期措置)</div>
                  <div className="text-lg font-bold text-[#f59e0b] mt-1">{lcc.ratingCounts.III} 部材</div>
                  <div className="text-[10px] text-[#8b949e] mt-0.5">緊急性なし</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">長寿命化保全スコア</div>
                  <div className="text-lg font-bold text-[#f0f6fc] mt-1">{lcc.assetSustainabilityScore} 点</div>
                  <div className="text-[10px] text-[#10b981] mt-0.5">AAA グレード</div>
                </div>
              </div>

              {/* Records List */}
              <div className="border border-[#30363d] rounded divide-y divide-[#30363d] bg-[#090d13]">
                {records.map((record) => (
                  <div key={record.id} className="p-3.5 hover:bg-[#161b22]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8b949e] font-mono">{record.id}</span>
                        <span className="font-bold text-[#f0f6fc] text-xs">{record.componentName}</span>
                        <span className="text-[9px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded border border-[#30363d]">
                          {record.memberId}
                        </span>
                        <span className="text-[10px] text-[#38bdf8] font-bold">{record.stationStr}</span>
                      </div>
                      <div className="text-[#8b949e] text-[11px]">
                        損傷内容: <strong className="text-[#f0f6fc]">{record.damageType}</strong> ({record.severity})
                      </div>
                      <div className="text-[#10b981] text-[11px] flex items-center gap-1">
                        <span>推奨対策: {record.recommendedMeasure}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <div className="text-right text-[10px] text-[#8b949e]">
                        <div>点検年: {record.inspectYear}年</div>
                        <div>次回: <strong className="text-[#f0f6fc]">{record.nextInspectYear}年</strong></div>
                      </div>
                      {getRatingBadge(record.rating)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MARKOV TIMELINE */}
          {activeTab === 'markov' && (
            <div className="space-y-4">
              {/* Year Slider */}
              <div className="p-4 bg-[#161b22] border border-[#30363d] rounded space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#38bdf8]" />
                    <span className="font-bold text-[#f0f6fc]">50年間 経年劣化タイムマシンスライダー</span>
                  </div>
                  <div className="text-sm font-bold text-[#38bdf8]">
                    西暦 {selectedTimelinePoint.year} 年 (供用 {selectedTimelinePoint.year - 2026} 年目)
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={lcc.markovTimeline.length - 1}
                  step={1}
                  value={selectedYearIndex}
                  onChange={(e) => setSelectedYearIndex(parseInt(e.target.value))}
                  className="w-full accent-[#38bdf8] cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-[#8b949e]">
                  {lcc.markovTimeline.map((item, idx) => (
                    <span
                      key={item.year}
                      className={idx === selectedYearIndex ? 'text-[#38bdf8] font-bold' : ''}
                    >
                      {item.year}
                    </span>
                  ))}
                </div>
              </div>

              {/* State Distribution at Selected Year */}
              <div className="p-4 bg-[#090d13] border border-[#30363d] rounded space-y-3">
                <div className="text-xs font-bold text-[#f0f6fc]">
                  西暦 {selectedTimelinePoint.year} 年における構造物健全度 確率分布 (マルコフ推移モデル)
                </div>

                {/* Progress Bar */}
                <div className="h-6 w-full bg-[#161b22] rounded flex overflow-hidden border border-[#30363d] text-[10px] font-bold">
                  <div
                    style={{ width: `${selectedTimelinePoint.probI}%` }}
                    className="bg-[#10b981] flex items-center justify-center text-[#090d13] transition-all duration-300"
                    title={`健全度 I: ${selectedTimelinePoint.probI}%`}
                  >
                    {selectedTimelinePoint.probI >= 10 ? `I: ${selectedTimelinePoint.probI}%` : ''}
                  </div>
                  <div
                    style={{ width: `${selectedTimelinePoint.probII}%` }}
                    className="bg-[#38bdf8] flex items-center justify-center text-[#090d13] transition-all duration-300"
                    title={`健全度 II: ${selectedTimelinePoint.probII}%`}
                  >
                    {selectedTimelinePoint.probII >= 10 ? `II: ${selectedTimelinePoint.probII}%` : ''}
                  </div>
                  <div
                    style={{ width: `${selectedTimelinePoint.probIII}%` }}
                    className="bg-[#f59e0b] flex items-center justify-center text-[#090d13] transition-all duration-300"
                    title={`健全度 III: ${selectedTimelinePoint.probIII}%`}
                  >
                    {selectedTimelinePoint.probIII >= 10 ? `III: ${selectedTimelinePoint.probIII}%` : ''}
                  </div>
                  <div
                    style={{ width: `${selectedTimelinePoint.probIV}%` }}
                    className="bg-[#f43f5e] flex items-center justify-center text-[#f0f6fc] transition-all duration-300"
                    title={`健全度 IV: ${selectedTimelinePoint.probIV}%`}
                  >
                    {selectedTimelinePoint.probIV >= 10 ? `IV: ${selectedTimelinePoint.probIV}%` : ''}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div className="p-2 bg-[#161b22] rounded border border-[#10b981]/30">
                    <span className="text-[#10b981] font-bold">健全度 I (健全)</span>: {selectedTimelinePoint.probI}%
                  </div>
                  <div className="p-2 bg-[#161b22] rounded border border-[#38bdf8]/30">
                    <span className="text-[#38bdf8] font-bold">健全度 II (予防保全)</span>: {selectedTimelinePoint.probII}%
                  </div>
                  <div className="p-2 bg-[#161b22] rounded border border-[#f59e0b]/30">
                    <span className="text-[#f59e0b] font-bold">健全度 III (早期措置)</span>: {selectedTimelinePoint.probIII}%
                  </div>
                  <div className="p-2 bg-[#161b22] rounded border border-[#f43f5e]/30">
                    <span className="text-[#f43f5e] font-bold">健全度 IV (緊急措置)</span>: {selectedTimelinePoint.probIV}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LCC SIMULATION */}
          {activeTab === 'lcc' && (
            <div className="space-y-4">
              {/* LCC Big Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-[#161b22] border border-[#f43f5e]/30 rounded">
                  <div className="text-[#8b949e] text-[10px]">事後保全シナリオ 50年総費用</div>
                  <div className="text-xl font-bold text-[#f43f5e] mt-1">{lcc.fiftyYearLccCorrectiveBillion} <span className="text-xs font-normal text-[#8b949e]">億円</span></div>
                  <div className="text-[10px] text-[#8b949e] mt-0.5">判定IV到達後に架け替え・大補修</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#10b981]/30 rounded">
                  <div className="text-[#8b949e] text-[10px]">予防保全シナリオ 50年総費用</div>
                  <div className="text-xl font-bold text-[#10b981] mt-1">{lcc.fiftyYearLccPreventiveBillion} <span className="text-xs font-normal text-[#8b949e]">億円</span></div>
                  <div className="text-[10px] text-[#10b981] mt-0.5">判定IIで計画的表面保護・注入</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#38bdf8]/30 rounded">
                  <div className="text-[#8b949e] text-[10px]">ライフサイクルコスト 削減額</div>
                  <div className="text-xl font-bold text-[#38bdf8] mt-1">▲{lcc.savingBillion} <span className="text-xs font-normal text-[#8b949e]">億円</span></div>
                  <div className="text-[10px] text-[#10b981] mt-0.5">コスト縮減率 ▲{lcc.savingPercent}% 達成</div>
                </div>
              </div>

              {/* LCC Comparison Breakdown */}
              <div className="p-4 bg-[#090d13] border border-[#30363d] rounded space-y-3">
                <div className="text-xs font-bold text-[#f0f6fc]">50年間 累計修繕費推移 (事後保全 vs 予防保全)</div>
                <div className="space-y-2 text-[11px]">
                  {lcc.markovTimeline.filter((_, i) => i % 2 === 0).map((t) => (
                    <div key={t.year} className="flex items-center gap-3">
                      <span className="w-16 text-[#8b949e] font-mono">{t.year}年</span>
                      <div className="flex-1 flex flex-col gap-1">
                        {/* Corrective Bar */}
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-[10px] text-[#f43f5e]">事後保全</div>
                          <div className="flex-1 bg-[#161b22] h-2.5 rounded overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (t.correctiveCostAccumMillion / 4860) * 100)}%` }}
                              className="bg-[#f43f5e] h-full"
                            />
                          </div>
                          <span className="w-20 text-right text-[10px] text-[#f0f6fc] font-mono">
                            {(t.correctiveCostAccumMillion / 100).toFixed(1)} 億円
                          </span>
                        </div>
                        {/* Preventive Bar */}
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-[10px] text-[#10b981]">予防保全</div>
                          <div className="flex-1 bg-[#161b22] h-2.5 rounded overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (t.preventiveCostAccumMillion / 4860) * 100)}%` }}
                              className="bg-[#10b981] h-full"
                            />
                          </div>
                          <span className="w-20 text-right text-[10px] text-[#10b981] font-mono">
                            {(t.preventiveCostAccumMillion / 100).toFixed(1)} 億円
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between font-mono text-[11px] text-[#8b949e]">
          <span>準拠標準: 国土交通省 道路構造物定期点検要領（令和6年版）/ 道路橋示方書(維持管理編)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
