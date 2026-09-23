import React, { useState } from 'react';
import {
  X,
  Cpu,
  Download,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Layers,
  Activity,
  Truck,
  ShieldCheck,
  FileSpreadsheet,
  FileCode,
  Gauge
} from 'lucide-react';
import { CivilProject } from '../types';
import {
  getActiveMachineryFleet,
  calculateLcaCarbonFootprint,
  assessConstructionQuality,
  generateIctTinLandXml,
  generateConstructionDxReportCsv
} from '../utils/constructionDxGenerator';

interface ConstructionDxModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: CivilProject;
}

export const ConstructionDxModal: React.FC<ConstructionDxModalProps> = ({
  isOpen,
  onClose,
  activeProject
}) => {
  const [activeTab, setActiveTab] = useState<'telematics' | 'quality' | 'carbon'>('telematics');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const fleet = getActiveMachineryFleet();
  const lca = calculateLcaCarbonFootprint(activeProject);
  const quality = assessConstructionQuality(activeProject);

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

  const handleDownloadTinXml = () => {
    const xml = generateIctTinLandXml(activeProject);
    triggerDownload(xml, `${activeProject?.name ?? 'Kumamoto_West_Ring'}_ICT_Subgrade_3D_TIN.xml`, 'application/xml');
  };

  const handleDownloadReportCsv = () => {
    const csv = generateConstructionDxReportCsv(activeProject);
    triggerDownload(csv, `${activeProject?.name ?? 'Kumamoto_West_Ring'}_iCon20_Quality_CO2_Report.csv`, 'text/csv;charset=utf-8;');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#10b981]/15 text-[#10b981] rounded border border-[#10b981]/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#f0f6fc] tracking-wide">
                  建設DX・CO2カーボンフットプリント ＆ 重機テレマティクス
                </h3>
                <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 px-1.5 py-0.5 rounded font-mono font-bold">
                  i-Construction 2.0
                </span>
                <span className="text-[10px] bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 px-1.5 py-0.5 rounded font-mono">
                  ISO 14067 GHG
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
                対象路線: {activeProject?.name ?? '熊本環状西道路'} | 設計面TIN連動 / 出来形合否照査 / ライフサイクルCO2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTinXml}
              className="px-2.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#38bdf8] border border-[#30363d] rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors"
              title="Trimble / TOPCON MC建機用 3D設計面 LandXML 1.2 TIN"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>3D-TIN (.xml)</span>
            </button>
            <button
              onClick={handleDownloadReportCsv}
              className="px-2.5 py-1.5 bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/40 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors"
              title="出来形検測調書 ＆ CO2算定報告書 CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>調書CSV保存</span>
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
            onClick={() => setActiveTab('telematics')}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'telematics'
                ? 'border-[#38bdf8] text-[#38bdf8] bg-[#161b22] font-bold'
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]/50'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>ICT建機テレマティクス (MC/MG車載)</span>
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'quality'
                ? 'border-[#10b981] text-[#10b981] bg-[#161b22] font-bold'
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>i-Con 2.0 出来形検測ヒートマップ (±50mm)</span>
          </button>
          <button
            onClick={() => setActiveTab('carbon')}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'carbon'
                ? 'border-[#a855f7] text-[#a855f7] bg-[#161b22] font-bold'
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]/50'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>ライフサイクル(LCA) CO2排出削減メーター</span>
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

          {/* TAB 1: TELEMATICS */}
          {activeTab === 'telematics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">稼働中ICT建機</div>
                  <div className="text-xl font-bold text-[#38bdf8] mt-1">4 台</div>
                  <div className="text-[10px] text-[#10b981] mt-0.5">全機 GNSS RTK-FIX 正常</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">平均刃先設計面差異</div>
                  <div className="text-xl font-bold text-[#10b981] mt-1">-3.0 mm</div>
                  <div className="text-[10px] text-[#8b949e] mt-0.5">規格公差 ±50mm 完全適合</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">時間あたり軽油消費</div>
                  <div className="text-xl font-bold text-[#f0f6fc] mt-1">51.9 L/h</div>
                  <div className="text-[10px] text-[#38bdf8] mt-0.5">エコ運転率 96.3%</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">時間あたりCO2排出</div>
                  <div className="text-xl font-bold text-[#a855f7] mt-1">135.9 kg/h</div>
                  <div className="text-[10px] text-[#10b981] mt-0.5">従来機比 ▲18.4% 削減</div>
                </div>
              </div>

              {/* Machinery Cards */}
              <div className="border border-[#30363d] rounded divide-y divide-[#30363d] bg-[#090d13]">
                {fleet.map((mach) => (
                  <div key={mach.id} className="p-3.5 hover:bg-[#161b22]/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f0f6fc] text-xs">{mach.name}</span>
                        <span className="text-[9px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded border border-[#30363d]">
                          {mach.model}
                        </span>
                        <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded font-bold">
                          {mach.gnssStatus}
                        </span>
                      </div>
                      <div className="text-[#8b949e] text-[11px]">
                        現在位置: <span className="text-[#38bdf8] font-bold">{mach.stationStr}</span> | 作業内容: {mach.currentOperation}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] self-end md:self-center">
                      <div className="text-right">
                        <div className="text-[#8b949e] text-[10px]">設計差異</div>
                        <div className={`font-bold ${Math.abs(mach.targetSurfaceDiffMm) <= 20 ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                          {mach.targetSurfaceDiffMm > 0 ? `+${mach.targetSurfaceDiffMm}` : mach.targetSurfaceDiffMm} mm
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#8b949e] text-[10px]">燃費・CO2</div>
                        <div className="text-[#f0f6fc] font-bold">
                          {mach.fuelPerHourL} L/h <span className="text-[#a855f7]">({mach.co2RateKgPerHour} kg/h)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#8b949e] text-[10px]">稼働効率</div>
                        <div className="text-[#10b981] font-bold">{mach.efficiencyPercent}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: QUALITY (i-Con 2.0) */}
          {activeTab === 'quality' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-[#10b981]/20 text-[#10b981]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-[#f0f6fc] font-bold">
                      国交省 i-Construction 2.0 出来形検測合格率: <span className="text-[#10b981] text-sm">{quality.passRatePercent}%</span> (合格基準 ≥ 95.0%)
                    </div>
                    <div className="text-[11px] text-[#8b949e] mt-0.5">
                      検測総点数: {quality.totalSurveyPoints.toLocaleString()} 点 (合格: {quality.passCount.toLocaleString()} / 不合格: {quality.failCount}) | 標準偏差 σ={quality.stdDeviationMm}mm
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 px-2 py-1 rounded font-bold">
                    全管理基準 合格 (PASS)
                  </span>
                </div>
              </div>

              {/* Heatmap Visual Tolerance Indicator */}
              <div className="p-3 bg-[#090d13] border border-[#30363d] rounded space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8b949e]">出来形較差分布ヒートマップ (許容限界: -50mm 〜 +50mm)</span>
                  <span className="text-[#f0f6fc]">実測範囲: <strong className="text-[#f43f5e]">{quality.maxOvercutMm}mm</strong> 〜 <strong className="text-[#10b981]">+{quality.maxOverfillMm}mm</strong></span>
                </div>
                <div className="h-4 w-full bg-[#161b22] rounded flex overflow-hidden border border-[#30363d]">
                  <div style={{ width: '4%' }} className="bg-[#f43f5e]" title="過掘削 (-50mm超): 0.8%" />
                  <div style={{ width: '22%' }} className="bg-[#38bdf8]" title="掘削寄り (-50mm〜-10mm): 22%" />
                  <div style={{ width: '52%' }} className="bg-[#10b981]" title="目標中心 (-10mm〜+10mm): 52%" />
                  <div style={{ width: '21%' }} className="bg-[#a855f7]" title="盛土寄り (+10mm〜+50mm): 21%" />
                  <div style={{ width: '1%' }} className="bg-[#f59e0b]" title="過盛土 (+50mm超): 0.6%" />
                </div>
                <div className="flex justify-between text-[9px] text-[#8b949e]">
                  <span>-50mm (規格限界)</span>
                  <span className="text-[#38bdf8]">-20mm</span>
                  <span className="text-[#10b981] font-bold">0.0mm (設計基準面)</span>
                  <span className="text-[#a855f7]">+20mm</span>
                  <span>+50mm (規格限界)</span>
                </div>
              </div>

              {/* Clauses Table */}
              <div className="border border-[#30363d] rounded divide-y divide-[#30363d] bg-[#090d13]">
                {quality.inspectionClauses.map((clause) => (
                  <div key={clause.id} className="p-3 hover:bg-[#161b22]/40 transition-colors flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8b949e] font-mono">{clause.id}</span>
                        <span className="text-[#f0f6fc] font-bold text-xs">{clause.clause}</span>
                      </div>
                      <div className="text-[11px] text-[#8b949e]">
                        規格値: <span className="text-[#f0f6fc]">{clause.standard}</span> | 実測値: <span className="text-[#38bdf8]">{clause.measured}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 px-2 py-0.5 rounded font-bold">
                      {clause.judgment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CARBON LCA */}
          {activeTab === 'carbon' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">総CO2排出量 (ライフサイクル)</div>
                  <div className="text-xl font-bold text-[#f0f6fc] mt-1">{lca.totalCo2Tons} <span className="text-xs font-normal text-[#8b949e]">ton-CO2</span></div>
                  <div className="text-[10px] text-[#10b981] mt-0.5">基準比 ▲{lca.reductionPercent}% 削減達成</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">総CO2削減量 (vs 従来工法)</div>
                  <div className="text-xl font-bold text-[#10b981] mt-1">▲{lca.reductionTons} <span className="text-xs font-normal text-[#8b949e]">ton-CO2</span></div>
                  <div className="text-[10px] text-[#8b949e] mt-0.5">従来基準: {lca.baselineCo2Tons} ton</div>
                </div>
                <div className="p-3 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="text-[#8b949e] text-[10px]">実質ネット排出量 (オフセット後)</div>
                  <div className="text-xl font-bold text-[#a855f7] mt-1">{lca.netEmissionsTons} <span className="text-xs font-normal text-[#8b949e]">ton-CO2</span></div>
                  <div className="text-[10px] text-[#a855f7] mt-0.5">間伐材等オフセット: ▲{lca.offsetCreditsTons} ton</div>
                </div>
              </div>

              {/* Emissions Breakdown */}
              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded space-y-2">
                <div className="text-xs font-bold text-[#f0f6fc]">工種別CO2排出内訳 (Scope 1 / Scope 2 / Scope 3)</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                  <div className="p-2 bg-[#090d13] rounded border border-[#30363d]">
                    <div className="text-[#8b949e] text-[10px]">土工・掘削積込</div>
                    <div className="text-[#f0f6fc] font-bold mt-0.5">{lca.breakdown.excavationTons} t</div>
                  </div>
                  <div className="p-2 bg-[#090d13] rounded border border-[#30363d]">
                    <div className="text-[#8b949e] text-[10px]">ダンプ場内流用</div>
                    <div className="text-[#f0f6fc] font-bold mt-0.5">{lca.breakdown.earthworkHaulageTons} t</div>
                  </div>
                  <div className="p-2 bg-[#090d13] rounded border border-[#30363d]">
                    <div className="text-[#8b949e] text-[10px]">コンクリート構造物</div>
                    <div className="text-[#f0f6fc] font-bold mt-0.5">{lca.breakdown.concreteStructuresTons} t</div>
                  </div>
                  <div className="p-2 bg-[#090d13] rounded border border-[#30363d]">
                    <div className="text-[#8b949e] text-[10px]">鋼橋上部工製作</div>
                    <div className="text-[#f0f6fc] font-bold mt-0.5">{lca.breakdown.steelSuperstructureTons} t</div>
                  </div>
                  <div className="p-2 bg-[#090d13] rounded border border-[#30363d]">
                    <div className="text-[#8b949e] text-[10px]">トンネル機械掘削</div>
                    <div className="text-[#f0f6fc] font-bold mt-0.5">{lca.breakdown.tunnelMachineryTons} t</div>
                  </div>
                </div>
              </div>

              {/* Eco Initiatives List */}
              <div className="border border-[#30363d] rounded p-3 bg-[#090d13] space-y-1.5">
                <div className="text-xs font-bold text-[#10b981] flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>採用された低炭素・カーボンニュートラル建設DX技術</span>
                </div>
                <ul className="space-y-1 text-[11px] text-[#8b949e] list-disc list-inside">
                  {lca.ecoInitiatives.map((init, i) => (
                    <li key={i} className="leading-relaxed text-[#f0f6fc]/90">
                      {init}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between font-mono text-[11px] text-[#8b949e]">
          <span>準拠標準: 国土交通省 i-Construction 2.0 / ISO 14067 ライフサイクルGHGプロトコル</span>
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
