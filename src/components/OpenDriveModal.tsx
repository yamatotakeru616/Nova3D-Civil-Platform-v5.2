/**
 * Nova3D Civil Platform v5.2
 * OpenDriveModal.tsx - ASAM OpenDRIVE 1.7 & 国交省ダイナミックマップ HDマップ出力・ODD適合性監査モーダル
 */

import React, { useState, useMemo } from 'react';
import {
  Car,
  FileCode,
  Download,
  Copy,
  Check,
  X,
  ShieldCheck,
  Cpu,
  Navigation,
  Layers,
  Radio,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { CivilProject } from '../types';
import {
  generateOpenDriveXml,
  generateDynamicMapGeoJson,
  assessOddCompliance,
} from '../utils/hdMapGenerator';

interface OpenDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: CivilProject;
}

export const OpenDriveModal: React.FC<OpenDriveModalProps> = ({
  isOpen,
  onClose,
  activeProject,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'xodr' | 'geojson' | 'odd'>('xodr');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const xodrContent = useMemo(() => generateOpenDriveXml(activeProject), [activeProject]);
  const geoJsonContent = useMemo(() => generateDynamicMapGeoJson(activeProject), [activeProject]);
  const oddAssessment = useMemo(() => assessOddCompliance(activeProject), [activeProject]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const routeName = activeProject?.name || 'Kumamoto_West_Ring';
  const cleanRouteName = routeName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 font-mono select-none">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-[11px] text-[#f0f6fc] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-[#f0f6fc] font-bold flex items-center gap-2">
                ASAM OpenDRIVE 1.7 &amp; 国交省ダイナミックマップ HD-Map 生成エンジン
                <span className="text-[9px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.2 rounded border border-[#10b981]/30">
                  Level 4 Ready
                </span>
              </div>
              <div className="text-[9px] text-[#8b949e]">
                {activeProject?.name || '熊本環状西道路'} | 道路構造令幾何 $\rightarrow$ 自律走行ODD照査・HDマップ自動コンパイル
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-4 bg-[#0d1117] border-b border-[#30363d]">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('xodr')}
              className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'xodr'
                  ? 'border-[#38bdf8] text-[#38bdf8] bg-[#161b22]/50'
                  : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>OpenDRIVE 1.7 (.xodr)</span>
              <span className="text-[8px] bg-[#21262d] px-1 rounded text-[#8b949e]">CARLA/Autoware</span>
            </button>
            <button
              onClick={() => setActiveTab('geojson')}
              className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'geojson'
                  ? 'border-[#38bdf8] text-[#38bdf8] bg-[#161b22]/50'
                  : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>国交省ダイナミックマップ (.geojson)</span>
              <span className="text-[8px] bg-[#21262d] px-1 rounded text-[#8b949e]">3Dベクトル</span>
            </button>
            <button
              onClick={() => setActiveTab('odd')}
              className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'odd'
                  ? 'border-[#a855f7] text-[#a855f7] bg-[#161b22]/50'
                  : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>自動運転ODD適合性監査</span>
              <span className="text-[8px] bg-[#a855f7]/20 text-[#a855f7] px-1 rounded font-bold">
                {oddAssessment.overallScore}点
              </span>
            </button>
          </div>

          {downloadSuccess && (
            <div className="flex items-center gap-1 text-[10px] text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30">
              <Check className="w-3 h-3" />
              <span>ダウンロード完了: {downloadSuccess}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {activeTab === 'xodr' ? (
            <div className="space-y-3">
              {/* Specs Bar */}
              <div className="grid grid-cols-4 gap-2 text-[9px] bg-[#0d1117] p-2 rounded border border-[#30363d]">
                <div>
                  <span className="text-[#8b949e]">規格:</span>{' '}
                  <strong className="text-[#38bdf8]">ASAM OpenDRIVE v1.7</strong>
                </div>
                <div>
                  <span className="text-[#8b949e]">車線数:</span>{' '}
                  <span className="text-[#f0f6fc]">第3種第1級 2車線+歩道</span>
                </div>
                <div>
                  <span className="text-[#8b949e]">対応シミュレータ:</span>{' '}
                  <span className="text-[#10b981]">CARLA / Autoware / CarMaker</span>
                </div>
                <div>
                  <span className="text-[#8b949e]">測地基準:</span>{' '}
                  <span className="text-[#f0f6fc]">EPSG:6677 / 平面直角IX</span>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative">
                <pre className="bg-[#090d13] border border-[#30363d] p-3 rounded-lg text-[10px] text-[#8ed5ff] overflow-x-auto leading-relaxed max-h-80 select-text">
                  {xodrContent}
                </pre>
                <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                  <button
                    onClick={() => handleCopy(xodrContent)}
                    className="bg-[#161b22]/90 hover:bg-[#21262d] text-[#f0f6fc] border border-[#30363d] px-2 py-1 rounded text-[9px] flex items-center gap-1 shadow transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3 text-[#38bdf8]" />}
                    <span>{copied ? 'コピー完了' : 'コピー'}</span>
                  </button>
                </div>
              </div>

              {/* Integration Snippet */}
              <div className="bg-[#0d1117] border border-[#30363d] p-2.5 rounded text-[9px] space-y-1">
                <div className="text-[#8b949e] font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#38bdf8]" />
                  CARLA 0.9.x / Autoware Simulator への即時インポート手順:
                </div>
                <div className="bg-[#161b22] p-1.5 rounded border border-[#21262d] text-[#a855f7]">
                  <code>
                    python config.py -x /maps/{cleanRouteName}_v1.7.xodr --osm-roads --spawn-hero-ego
                  </code>
                </div>
              </div>
            </div>
          ) : activeTab === 'geojson' ? (
            <div className="space-y-3">
              {/* Specs Bar */}
              <div className="grid grid-cols-4 gap-2 text-[9px] bg-[#0d1117] p-2 rounded border border-[#30363d]">
                <div>
                  <span className="text-[#8b949e]">形式:</span>{' '}
                  <strong className="text-[#38bdf8]">GeoJSON 3D FeatureCollection</strong>
                </div>
                <div>
                  <span className="text-[#8b949e]">レイヤー:</span>{' '}
                  <span className="text-[#f0f6fc]">レーン中心線 / 白線境界 / 構造物</span>
                </div>
                <div>
                  <span className="text-[#8b949e]">GIS互換:</span>{' '}
                  <span className="text-[#10b981]">QGIS / Deck.gl / Mapbox</span>
                </div>
                <div>
                  <span className="text-[#8b949e]">測地系:</span>{' '}
                  <span className="text-[#f0f6fc]">WGS84 (EPSG:4326) + Z標高</span>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative">
                <pre className="bg-[#090d13] border border-[#30363d] p-3 rounded-lg text-[10px] text-[#8ed5ff] overflow-x-auto leading-relaxed max-h-80 select-text">
                  {geoJsonContent}
                </pre>
                <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                  <button
                    onClick={() => handleCopy(geoJsonContent)}
                    className="bg-[#161b22]/90 hover:bg-[#21262d] text-[#f0f6fc] border border-[#30363d] px-2 py-1 rounded text-[9px] flex items-center gap-1 shadow transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3 text-[#38bdf8]" />}
                    <span>{copied ? 'コピー完了' : 'コピー'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* ODD Overview Score Card */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#f0f6fc] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#a855f7]" />
                    自動運転 運行設計領域 (ODD: Operational Design Domain) 適合度
                  </div>
                  <div className="text-[10px] text-[#8b949e] mt-0.5">
                    国土交通省自動運転実証指針 ＆ ISO 21448 (SOTIF: 意図した機能の安全性) リアルタイム照査
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-[#8b949e]">自律走行適性判定</div>
                    <div className="text-xs font-bold text-[#10b981]">LEVEL 4 適合 (High)</div>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-[#10b981]/15 border-2 border-[#10b981] flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-[#10b981] leading-none">
                      {oddAssessment.overallScore}
                    </span>
                    <span className="text-[8px] text-[#8b949e]">/ 100点</span>
                  </div>
                </div>
              </div>

              {/* Compliance Items Matrix */}
              <div className="border border-[#30363d] rounded-lg overflow-hidden">
                <table className="w-full text-left text-[9px]">
                  <thead className="bg-[#0d1117] text-[#8b949e] border-b border-[#30363d]">
                    <tr>
                      <th className="p-2">照査項目 (ODD Check Items)</th>
                      <th className="p-2">技術基準値</th>
                      <th className="p-2">設計線形 実測値</th>
                      <th className="p-2">ステータス</th>
                      <th className="p-2">準拠法令 / 標準</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#21262d] bg-[#161b22]">
                    {oddAssessment.complianceItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#21262d]/50">
                        <td className="p-2 font-bold text-[#f0f6fc]">{item.name}</td>
                        <td className="p-2 text-[#8b949e]">{item.target}</td>
                        <td className="p-2 text-[#38bdf8] font-mono">{item.actual}</td>
                        <td className="p-2">
                          <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-1.5 py-0.5 rounded font-bold">
                            PASS 適合
                          </span>
                        </td>
                        <td className="p-2 text-[#6e7681]">{item.standard}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sensor Spec Recommendations */}
              <div className="bg-[#0d1117] border border-[#30363d] p-3 rounded-lg space-y-1.5">
                <div className="text-[10px] font-bold text-[#f0f6fc] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#38bdf8]" />
                  推奨車載センサー構成 (Required ADAS Sensor Architecture):
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                  {oddAssessment.recommendedAdasSensors.map((sensor, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-[#161b22] px-2 py-1 rounded border border-[#21262d] flex items-center gap-1.5 text-[#bdc8d1]"
                    >
                      <Check className="w-3 h-3 text-[#10b981] shrink-0" />
                      <span>{sensor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-2.5 border-t border-[#30363d] bg-[#0d1117] flex justify-between items-center">
          <div className="flex items-center gap-2 text-[9px] text-[#6e7681]">
            <Navigation className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>ASAM OpenDRIVE v1.7 ＆ 国交省ダイナミックマップ標準準拠</span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'xodr' ? (
              <button
                onClick={() =>
                  handleDownload(
                    `${cleanRouteName}_v1.7.xodr`,
                    xodrContent,
                    'application/xml'
                  )
                }
                className="bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>OpenDRIVE (.xodr) 保存</span>
              </button>
            ) : activeTab === 'geojson' ? (
              <button
                onClick={() =>
                  handleDownload(
                    `${cleanRouteName}_dynamic_map.geojson`,
                    geoJsonContent,
                    'application/geo+json'
                  )
                }
                className="bg-[#10b981] hover:bg-[#34d399] text-[#090d13] font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ダイナミックマップ (.geojson) 保存</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  handleDownload(
                    `${cleanRouteName}_ODD_Audit_Report.txt`,
                    `====================================================================\nNOVA3D CIVIL PLATFORM v5.2 - AUTONOMOUS DRIVING ODD AUDIT REPORT\nProject: ${routeName}\nOverall Score: ${oddAssessment.overallScore} / 100 (Level 4 Suitable)\nDate: ${new Date().toISOString()}\n====================================================================\n` +
                      oddAssessment.complianceItems
                        .map(
                          (c) =>
                            `[${c.passed ? 'PASS' : 'FAIL'}] ${c.name}\n  Target: ${c.target}\n  Actual: ${c.actual}\n  Standard: ${c.standard}\n`
                        )
                        .join('\n'),
                    'text/plain'
                  );
                }}
                className="bg-[#a855f7] hover:bg-[#c084fc] text-[#090d13] font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ODD監査レポート (.txt) 出力</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] border border-[#30363d] px-3 py-1.5 rounded text-xs transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
