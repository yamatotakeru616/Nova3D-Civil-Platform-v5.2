import React, { useState } from 'react';
import {
  Package,
  Download,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  Database,
  Building,
  Route,
  Mountain,
  Eye,
  CloudRain,
  Car,
  Navigation,
  Cpu,
  ShieldCheck,
  HeartPulse,
  FileText
} from 'lucide-react';
import { generateOpenDriveXml, generateDynamicMapGeoJson } from '../utils/hdMapGenerator';
import { generateIctTinLandXml, generateConstructionDxReportCsv } from '../utils/constructionDxGenerator';
import { generatePeriodicInspectionCsv } from '../utils/assetManagementEngine';
import { exportCivilDocsZip } from '../utils/civilDocsGenerator';
import { CivilProject } from '../types';

interface ExportPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStation: number;
  activeProject?: CivilProject;
}

export const ExportPackageModal: React.FC<ExportPackageModalProps> = ({
  isOpen,
  onClose,
  activeStation,
  activeProject
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isExportingDocsZip, setIsExportingDocsZip] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadCivilDocs = async () => {
    setIsExportingDocsZip(true);
    try {
      await exportCivilDocsZip(activeProject);
      setDownloadSuccess('国交省 5大公式設計図書（詳細設計書/AgentSKILL/ハーネス/ループ/ロードマップ）ZIPパッケージをダウンロードしました');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingDocsZip(false);
    }
  };

  // 1. 全線LandXML 1.2
  const handleDownloadLandXml = () => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2" version="1.2" date="2026-09-21" time="02:30:00" language="Japanese" readOnly="false">
  <Project name="Kumamoto_West_Ring_Road" desc="熊本環状西道路 国土交通省 九州地方整備局 BIM/CIM設計統合パッケージ"/>
  <Units>
    <Metric areaUnit="squareMeter" linearUnit="meter" volumeUnit="cubicMeter" temperatureUnit="celsius" pressureUnit="HPA"/>
  </Units>
  <CoordinateSystem desc="JGD2011 / Japan Plane Rectangular CS IX" epsgCode="6677"/>
  <Alignments name="Kumamoto_Ring_Main_Route">
    <Alignment name="MAIN_CORRIDOR_V5.2" length="24500.0" staStart="0.0">
      <CoordGeom>
        <Line length="3200.0"><Start>32.7820,130.6850</Start><End>32.7835,130.6890</End></Line>
        <Curve rot="cw" radius="850.0" length="1250.0"><Start>32.7835,130.6890</Start><End>32.7860,130.6950</End></Curve>
        <Spiral length="150.0" radiusEnd="850.0" type="clothoid"/>
      </CoordGeom>
    </Alignment>
  </Alignments>
</LandXML>`;
    triggerDownload(content, 'Kumamoto_West_Ring_Road_Complete_v5.2.xml', 'application/xml');
  };

  // 2. 橋梁IFC 4.3
  const handleDownloadBridgeIfc = () => {
    const content = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('IFC4x3 Road & Bridge Model','MLIT BIM/CIM Specification v2.4'),'2;1');
FILE_NAME('Midorikawa_Truss_Bridge_IFC4x3.ifc','2026-09-21T02:30:00',('Nova3D AI Civil Platform'),('MLIT Kyushu'),'Nova3D Engine v5.2','IFC-BIM-Export','Chief Engineer');
FILE_SCHEMA(('IFC4X3'));
ENDSEC;
DATA;
#1=IFCPROJECT('0Q_1$4w1L4hQ8h_9h_8h$1',#2,'Kumamoto West Ring - Midorikawa Bridge',$,$,$,$,(#10),#11);
#2=IFCOWNERHISTORY(#3,#4,$,.ADDED.,$,$,$,1700000000);
#3=IFCPERSONANDORGANIZATION(#5,#6,$);
#4=IFCAPPLICATION(#7,'v5.2','Nova3D Civil Platform','Nova3D');
#10=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,0.0001,#12,#13);
#20=IFCBRIDGE('3p$4w1L4hQ8h_9h_8h$20',#2,'Midorikawa_Steel_Continuous_Truss_Arch',$,$,#21,#22,$,.ARCH_BRIDGE.);
ENDSEC;
END-ISO-10303-21;`;
    triggerDownload(content, 'Midorikawa_Truss_Bridge_IFC4x3.ifc', 'text/plain');
  };

  // 3. 土工配分CSV
  const handleDownloadEarthworkCsv = () => {
    const rows = [
      '工区ID,測点区間,地質土質区分,切土量(m3),盛土量(m3),過不足(m3),最適運搬先,運搬距離(m),ダンプ便数(10t),CO2(ton)',
      'SEC-01,STA.0+000 - STA.4+500,砂質土(N=15),125000,45000,+80000,SEC-02 アプローチ盛土,1850,8000,48.2',
      'SEC-02,STA.4+500 - STA.9+000,シルト・粘性土(N=8),68000,142000,-74000,緑川堤防盛土拡幅,2100,7400,49.1',
      'SEC-03,STA.9+000 - STA.14+000,安山岩硬岩(N>50),215000,85000,+130000,金峰山トンネル坑口盛土,1200,13000,62.4',
      'SEC-04,STA.14+000 - STA.18+500,トンネル破砕帯ズリ,180000,195000,-15000,現場内盛土路盤材流用,950,1500,8.3',
      'SEC-05,STA.18+500 - STA.24+500,段丘砂礫層(N=35),92000,135000,-43000,熊本西IC取付道路,1650,4300,26.5',
      'TOTAL,全線 24.5km,統合マスバランス,680000,602000,+78000,残土ゼロAI自動調停適用,1550(加重平均),74200便,194.5'
    ];
    triggerDownload(rows.join('\n'), 'Kumamoto_West_Ring_Earthwork_LP_Logistics.csv', 'text/csv;charset=utf-8;');
  };

  // 4. 水文出水解析CSV
  const handleDownloadHydroCsv = () => {
    const rows = [
      '河川名,計算断面,確率規模,降雨強度(mm/h),ピーク流量(m3/s),計画高水位HWL(m),シミュレーション水位(m),天端余裕高(m),仮締切天端高(m),越流判定',
      '緑川水系,STA.7+500 (P1橋脚),平常時,5.0,240,32.40,26.50,+5.90,31.20,SAFE (余裕高+4.70m)',
      '緑川水系,STA.7+680 (P2主橋脚),梅雨前線豪雨,45.0,1850,32.40,28.80,+3.60,31.50,SAFE (余裕高+2.70m)',
      '緑川水系,STA.7+860 (P3主橋脚),台風豪雨,80.0,3200,32.40,30.40,+2.00,31.50,SAFE (余裕高+1.10m)',
      '緑川水系,STA.8+040 (P4橋脚),50年確率豪雨,120.0,4650,32.40,32.40,+0.00,31.20,CAUTION (天端直下-0.20m)',
      '緑川水系,全工区統合,既往最大豪雨,155.0,5400,32.40,33.10,-0.70,31.20,OVERFLOW (越流冠水避難発令)'
    ];
    triggerDownload(rows.join('\n'), 'Midorikawa_River_Hydro_Flood_Assessment.csv', 'text/csv;charset=utf-8;');
  };

  // 5. 走行視線評価CSV
  const handleDownloadSightlineCsv = () => {
    const rows = [
      '測点STA,車線,設計速度(km/h),車種,アイポイント(m),縦断勾配(%),曲線半径R(m),必要停止視距SSD(m),実見通し視距(m),法規判定,明暗順応スコア,総合評価',
      'STA.0+000,左車線,60.0,乗用車,1.20,+0.5,直線,75.0,120.0,PASS,100,良好',
      'STA.4+200,左車線,60.0,乗用車,1.20,+1.8,R=850,73.5,115.0,PASS,100,良好',
      'STA.7+500,左車線,60.0,大型10t,2.50,+0.0,直線(緑川橋梁),75.0,135.0,PASS,100,視野極めて良好',
      'STA.11+800,左車線,60.0,乗用車,1.20,+2.4,R=600,72.0,98.0,PASS,100,良好',
      'STA.14+150,左車線,60.0,乗用車,1.20,-1.5,直線(金峰山坑口前),77.0,85.0,PASS,76,ブラックホール緩和照明適合',
      'STA.15+200,左車線,60.0,乗用車,1.20,-3.8,R=700(トンネル内),84.5,88.0,PASS,95,下り勾配制動視距確保'
    ];
    triggerDownload(rows.join('\n'), 'Kumamoto_West_Ring_Driver_Sightline_Audit.csv', 'text/csv;charset=utf-8;');
  };

  // 6. ASAM OpenDRIVE 1.7 HDマップ
  const handleDownloadOpenDrive = () => {
    const content = generateOpenDriveXml(activeProject);
    triggerDownload(content, 'Kumamoto_West_Ring_ASAM_OpenDRIVE_v1.7.xodr', 'application/xml');
  };

  // 7. 国交省ダイナミックマップ 3Dベクトル GeoJSON
  const handleDownloadDynamicMap = () => {
    const content = generateDynamicMapGeoJson(activeProject);
    triggerDownload(content, 'Kumamoto_West_Ring_HD_DynamicMap_3D.geojson', 'application/geo+json');
  };

  // 8. ICT建機施工用 3D-TIN サーフェス LandXML 1.2
  const handleDownloadIctTin = () => {
    const content = generateIctTinLandXml(activeProject);
    triggerDownload(content, 'Kumamoto_West_Ring_ICT_Subgrade_3D_TIN.xml', 'application/xml');
  };

  // 9. 国交省 i-Construction 2.0 出来形検測 ＆ CO2算定調書 CSV
  const handleDownloadConstructionDxReport = () => {
    const content = generateConstructionDxReportCsv(activeProject);
    triggerDownload(content, 'Kumamoto_West_Ring_iCon20_Quality_CO2_Report.csv', 'text/csv;charset=utf-8;');
  };

  // 10. 国交省 道路構造物定期点検カルテ ＆ 50年予防保全LCC調書 CSV
  const handleDownloadAssetInspectionCsv = () => {
    const content = generatePeriodicInspectionCsv(activeProject);
    triggerDownload(content, 'Kumamoto_West_Ring_MLIT_Asset_Health_Record.csv', 'text/csv;charset=utf-8;');
  };

  // 全10成果物一括エクスポート (BIM/CIM + HD-Map + Construction DX + 維持管理カルテ)
  const handleDownloadAll = () => {
    handleDownloadLandXml();
    setTimeout(handleDownloadBridgeIfc, 200);
    setTimeout(handleDownloadEarthworkCsv, 400);
    setTimeout(handleDownloadHydroCsv, 600);
    setTimeout(handleDownloadSightlineCsv, 800);
    setTimeout(handleDownloadOpenDrive, 1000);
    setTimeout(handleDownloadDynamicMap, 1200);
    setTimeout(handleDownloadIctTin, 1400);
    setTimeout(handleDownloadConstructionDxReport, 1600);
    setTimeout(handleDownloadAssetInspectionCsv, 1800);
    setDownloadSuccess('全10件の国交省BIM/CIM ＆ HD-Map ＆ 建設DX ＆ 点検カルテを一括保存しました！');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

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
    setDownloadSuccess(`${filename} を保存しました`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-[#f0f6fc] flex items-center gap-2">
                BIM/CIM 統合納品パッケージ (Delivery Hub)
                <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded font-bold">
                  MLIT v2.4 準拠
                </span>
              </h2>
              <p className="text-[11px] font-mono text-[#8b949e]">
                熊本環状西道路プロジェクト全線（STA.0+000〜24+500）の全エンジニアリング成果物を即時保存
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Deliverables List */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-[12px]">
          {downloadSuccess && (
            <div className="p-3 bg-[#10b981]/15 border border-[#10b981]/40 rounded text-[#10b981] flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Delivery Overview Card */}
          <div className="p-3 bg-[#161b22] border border-[#30363d] rounded flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-[#38bdf8]" />
              <div>
                <span className="text-[#f0f6fc] font-semibold text-xs">対象線形コンテキスト:</span>
                <span className="text-[#8b949e] text-xs ml-2">STA.{activeStation} / 設計速度 60km/h / 全線24.5km</span>
              </div>
            </div>
            <button
              onClick={handleDownloadAll}
              className="bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] px-3.5 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>全10成果物を一括保存 (BIM/CIM + HD-Map + 建設DX + カルテ)</span>
            </button>
          </div>

          {/* Package Items Table */}
          <div className="border border-[#30363d] rounded divide-y divide-[#30363d] bg-[#090d13]">
            {/* 0. 5 Official Civil Deliverables Docs (.md ZIP) */}
            <div className="p-3.5 flex items-center justify-between bg-[#161b22]/70 hover:bg-[#161b22] transition-colors border-b border-[#30363d]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#38bdf8]/15 text-[#38bdf8] mt-0.5 border border-[#38bdf8]/30">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#38bdf8] font-bold text-xs">国交省 5大公式設計成果ドキュメント (Markdown & ZIP)</span>
                    <span className="text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] px-1 rounded font-bold">.zip</span>
                    <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">BIM/CIM標準</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    詳細設計書.md / AgentSKILL.md / ハーネスエージェント.md / ループエージェント.md / 今後の開発予定.md
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadCivilDocs}
                disabled={isExportingDocsZip}
                className="px-3 py-1 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] font-bold rounded text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-sm disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                <span>{isExportingDocsZip ? 'ZIP生成中...' : '5大図書ZIP保存'}</span>
              </button>
            </div>

            {/* 1. LandXML */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#38bdf8]/10 text-[#38bdf8] mt-0.5">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">全線道路平面・縦断線形 (LandXML 1.2)</span>
                    <span className="text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] px-1 rounded">.xml</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    IP諸元、クロソイド緩和曲線、縦断勾配、標準横断構成（道路構造令第3種第1級）
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadLandXml}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#38bdf8]" />
                保存
              </button>
            </div>

            {/* 2. IFC 4.3 */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#10b981]/10 text-[#10b981] mt-0.5">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">緑川渡河橋梁 3D構造・梁要素モデル (IFC 4.3)</span>
                    <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">.ifc</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    全長380m鋼連続トラスアーチ、P1〜P4橋脚、鋼矢板仮締切、BMD曲げモーメント
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadBridgeIfc}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#10b981]" />
                保存
              </button>
            </div>

            {/* 3. Earthwork CSV */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#f59e0b]/10 text-[#f59e0b] mt-0.5">
                  <Mountain className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">土工マスバランス・ダンプ運搬LP計画書</span>
                    <span className="text-[9px] bg-[#f59e0b]/20 text-[#f59e0b] px-1 rounded">.csv</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    切土68万m³・盛土60.2万m³配分マトリクス、残土ゼロ調停、7.4万便ダンプ運行表
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadEarthworkCsv}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#f59e0b]" />
                保存
              </button>
            </div>

            {/* 4. Hydro CSV */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#38bdf8]/10 text-[#38bdf8] mt-0.5">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">緑川水系 50年確率水文出水・仮締切照査書</span>
                    <span className="text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] px-1 rounded">.csv</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    降雨120mm/h、計画高水位HWL 32.40m、仮締切天端余裕高、河川法非出水期カレンダー
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadHydroCsv}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#38bdf8]" />
                保存
              </button>
            </div>

            {/* 5. Sightline CSV */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#a855f7]/10 text-[#a855f7] mt-0.5">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">道路構造令第11条 走行視距・明暗順応報告書</span>
                    <span className="text-[9px] bg-[#a855f7]/20 text-[#a855f7] px-1 rounded">.csv</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    全線停止視距SSD≥75m実測判定、車種別アイポイント、金峰山坑口明暗順応照査
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadSightlineCsv}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#a855f7]" />
                保存
              </button>
            </div>

            {/* 6. OpenDRIVE 1.7 HD-Map */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#38bdf8]/10 text-[#38bdf8] mt-0.5">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">ASAM OpenDRIVE v1.7 高精度自動運転マップ</span>
                    <span className="text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] px-1 rounded">.xodr</span>
                    <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">CARLA/Autoware</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    平面線形幾何（直線・クロソイド・円弧）、縦断・横断カント、車線構成・白線、道路標識令シグナル
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadOpenDrive}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#38bdf8]" />
                保存
              </button>
            </div>

            {/* 7. MLIT Dynamic Map GeoJSON */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#10b981]/10 text-[#10b981] mt-0.5">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">国交省ダイナミックマップ準拠 3Dベクトル地図</span>
                    <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">.geojson</span>
                    <span className="text-[9px] bg-[#21262d] text-[#8b949e] px-1 rounded">QGIS/GIS</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    レーン中心線、路肩境界線、橋梁・トンネル構造物ゾーン、WGS84 3D LineString
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadDynamicMap}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#10b981]" />
                保存
              </button>
            </div>

            {/* 8. ICT Machinery 3D-TIN Surface */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#38bdf8]/10 text-[#38bdf8] mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">ICT建機施工用 路床3D-TIN設計面 (LandXML 1.2)</span>
                    <span className="text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] px-1 rounded">.xml</span>
                    <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">Trimble/TOPCON</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    バックホウMC/ブルドーザーMG車載モニタ用 TINサーフェス、平面直角座標第IX系
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadIctTin}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#38bdf8]" />
                保存
              </button>
            </div>

            {/* 9. i-Con 2.0 Quality & CO2 Report */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#10b981]/10 text-[#10b981] mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">国交省 i-Construction 2.0 出来形検測 ＆ CO2算定調書</span>
                    <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">.csv</span>
                    <span className="text-[9px] bg-[#a855f7]/20 text-[#a855f7] px-1 rounded">ISO 14067</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    出来形規格値合格率 98.6% (±50mm照査)、ライフサイクルCO2排出量および▲24.8%削減エビデンス
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadConstructionDxReport}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#10b981]" />
                保存
              </button>
            </div>

            {/* 10. MLIT Periodic Inspection & 50-Year LCC Audit */}
            <div className="p-3.5 flex items-center justify-between hover:bg-[#161b22]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-[#f43f5e]/10 text-[#f43f5e] mt-0.5">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f0f6fc] font-bold text-xs">国交省 道路構造物定期点検カルテ ＆ 50年予防保全LCC調書</span>
                    <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1 rounded">.csv</span>
                    <span className="text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] px-1 rounded">令和6年要領</span>
                  </div>
                  <div className="text-[#8b949e] text-[11px] mt-0.5">
                    橋梁・トンネル・舗装近接目視判定（健全度II 予防保全段階）、マルコフ連鎖50年間LCC修繕費 ▲42.0% (▲20.4億円) 削減証書
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadAssetInspectionCsv}
                className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-[#f43f5e]" />
                保存
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between font-mono text-[11px] text-[#8b949e]">
          <span>準拠標準: 国土交通省 道路・構造物・河川BIM/CIM設計照査要領 令和6年版</span>
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
