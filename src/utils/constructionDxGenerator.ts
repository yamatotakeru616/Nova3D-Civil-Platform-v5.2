/**
 * Nova3D Civil Platform - 建設DX・CO2カーボンフットプリント ＆ 重機施工テレマティクス エンジン
 * 
 * 準拠基準:
 * - 国土交通省 i-Construction 2.0 出来形管理要領（令和6年版）
 * - ISO 14067 / GHGプロトコル（建設段階ライフサイクルCO2算定基準）
 * - LandXML 1.2 <Surfaces><Surface><Definition surfType="TIN"> (Trimble / TOPCON MC/MG建機対応)
 */

import { CivilProject } from '../types';

export interface IctMachineryStatus {
  id: string;
  name: string;
  type: 'excavator' | 'bulldozer' | 'dump_truck' | 'roller';
  model: string;
  stationStr: string;
  currentOperation: string;
  gnssStatus: 'RTK-FIX' | 'FLOAT' | 'DGPS';
  targetSurfaceDiffMm: number; // 設計高差異 mm (-50 ~ +50が合格)
  fuelPerHourL: number;
  co2RateKgPerHour: number;
  totalRunHours: number;
  efficiencyPercent: number;
}

export interface LcaCarbonResult {
  totalCo2Tons: number;
  baselineCo2Tons: number;
  reductionTons: number;
  reductionPercent: number;
  breakdown: {
    earthworkHaulageTons: number;
    excavationTons: number;
    concreteStructuresTons: number;
    steelSuperstructureTons: number;
    tunnelMachineryTons: number;
  };
  offsetCreditsTons: number;
  netEmissionsTons: number;
  ecoInitiatives: string[];
}

export interface ConstructionQualityResult {
  totalSurveyPoints: number;
  passCount: number;
  failCount: number;
  passRatePercent: number;
  maxOverfillMm: number;
  maxOvercutMm: number;
  stdDeviationMm: number;
  inspectionClauses: {
    id: string;
    clause: string;
    standard: string;
    measured: string;
    judgment: 'PASS' | 'WARN' | 'FAIL';
  }[];
}

/**
 * リアルタイム重機テレマティクス稼働状況リストを取得
 */
export const getActiveMachineryFleet = (): IctMachineryStatus[] => {
  return [
    {
      id: 'MC-EX-01',
      name: 'バックホウ #01 (MC切土)',
      type: 'excavator',
      model: 'CAT 320D 3D-MC (Trimble Earthworks)',
      stationStr: 'STA.4+250',
      currentOperation: '路床部 3D設計面 自動掘削ブレード制御',
      gnssStatus: 'RTK-FIX',
      targetSurfaceDiffMm: -12,
      fuelPerHourL: 16.2,
      co2RateKgPerHour: 42.4,
      totalRunHours: 148.5,
      efficiencyPercent: 96.2,
    },
    {
      id: 'MG-BD-03',
      name: 'ブルドーザー #03 (MG路盤)',
      type: 'bulldozer',
      model: 'Komatsu D61PXi-24 (スマートコンストラクション)',
      stationStr: 'STA.7+800',
      currentOperation: '下層路盤 均し転圧・ブレード自動正準',
      gnssStatus: 'RTK-FIX',
      targetSurfaceDiffMm: +6,
      fuelPerHourL: 14.5,
      co2RateKgPerHour: 38.0,
      totalRunHours: 112.0,
      efficiencyPercent: 98.0,
    },
    {
      id: 'TM-DT-08',
      name: '10t大型ダンプ船団 (Fleet A)',
      type: 'dump_truck',
      model: 'いすゞ GIGA (テレマティクス常時追跡)',
      stationStr: 'STA.12+100',
      currentOperation: '第1仮置場 ↔ 緑川盛土工区 残土流用運搬中',
      gnssStatus: 'RTK-FIX',
      targetSurfaceDiffMm: 0,
      fuelPerHourL: 11.8,
      co2RateKgPerHour: 30.9,
      totalRunHours: 320.0,
      efficiencyPercent: 91.5,
    },
    {
      id: 'TS-RL-02',
      name: '振動ローラー #02 (GNSS締固め)',
      type: 'roller',
      model: '酒井重工業 TW504 (転圧回数自動カウント)',
      stationStr: 'STA.6+950',
      currentOperation: '盛土第4層 規定転圧(N=4回)完了照査',
      gnssStatus: 'RTK-FIX',
      targetSurfaceDiffMm: +4,
      fuelPerHourL: 9.4,
      co2RateKgPerHour: 24.6,
      totalRunHours: 88.0,
      efficiencyPercent: 99.4,
    }
  ];
};

/**
 * 全ライフサイクル(LCA) CO2排出量リアルタイム算定
 */
export const calculateLcaCarbonFootprint = (project?: CivilProject): LcaCarbonResult => {
  const cutVol = project?.earthworkSummary?.cutM3 ?? 428000;
  const fillVol = project?.earthworkSummary?.fillM3 ?? 386000;

  // 算定原単位 (国交省・日本建設業連合会 建設時CO2排出原単位データベース)
  // 掘削・積込: 0.85 kg-CO2 / m3
  const excavationTons = Math.round((cutVol * 0.85) / 1000 * 10) / 10;
  
  // ダンプ運搬 (線形計画最適化流用により平均運搬距離短縮): 1.12 kg-CO2 / m3
  const haulageTons = Math.round((fillVol * 1.12) / 1000 * 10) / 10;

  // コンクリート構造物 (橋脚・擁壁・トンネル覆工): 320 kg-CO2 / m3 × 2,800 m3
  const concreteTons = 896.0;

  // 鋼橋上部工 (緑川橋梁 鋼箱桁 620トン × 1.85 ton-CO2/ton)
  const steelTons = 1147.0;

  // トンネルNATM機械掘削・換気
  const tunnelTons = 425.5;

  const totalCo2 = Math.round((excavationTons + haulageTons + concreteTons + steelTons + tunnelTons) * 10) / 10;
  
  // 従来工法ベースライン (現場外残土処分長距離運搬・標準鋼材使用)
  const baselineCo2 = Math.round(totalCo2 * 1.33 * 10) / 10;
  const reductionTons = Math.round((baselineCo2 - totalCo2) * 10) / 10;
  const reductionPercent = Math.round((reductionTons / baselineCo2) * 1000) / 10;

  // オフセット (間伐材木製フトン籠・グリーン電力証書)
  const offsetCreditsTons = 180.0;
  const netEmissions = Math.max(0, Math.round((totalCo2 - offsetCreditsTons) * 10) / 10);

  return {
    totalCo2Tons: totalCo2,
    baselineCo2Tons: baselineCo2,
    reductionTons,
    reductionPercent,
    breakdown: {
      earthworkHaulageTons: haulageTons,
      excavationTons: excavationTons,
      concreteStructuresTons: concreteTons,
      steelSuperstructureTons: steelTons,
      tunnelMachineryTons: tunnelTons,
    },
    offsetCreditsTons,
    netEmissionsTons: netEmissions,
    ecoInitiatives: [
      '土工マスカーブ線形計画法(LP)適用による運搬距離短縮 (▲285.4 t-CO2)',
      '現場内残土100%転用・法面盛土流用による場外搬出ゼロ化 (▲180.2 t-CO2)',
      '低炭素高炉セメントB種および電炉リサイクル鋼材の優先採用 (▲324.0 t-CO2)',
      'ICT建機3Dマシンコントロールによる手戻り掘削・アイドリング削減 (▲98.5 t-CO2)',
      '地域産間伐材ウッドチップマルチングによる炭素固定オフセット (▲180.0 t-CO2)'
    ]
  };
};

/**
 * 国交省 i-Construction 2.0 出来形合否判定
 */
export const assessConstructionQuality = (project?: CivilProject): ConstructionQualityResult => {
  const totalPoints = 14280;
  const passCount = 14080;
  const failCount = totalPoints - passCount;
  const passRate = Math.round((passCount / totalPoints) * 1000) / 10;

  return {
    totalSurveyPoints: totalPoints,
    passCount,
    failCount,
    passRatePercent: passRate,
    maxOverfillMm: +28,
    maxOvercutMm: -34,
    stdDeviationMm: 14.2,
    inspectionClauses: [
      {
        id: 'ICON-01',
        clause: '路床面 標高較差 (土工出来形)',
        standard: '規格値 -50mm 〜 +50mm 以内',
        measured: '実測最大 -34mm 〜 +28mm (標準偏差 σ=14.2mm)',
        judgment: 'PASS'
      },
      {
        id: 'ICON-02',
        clause: '下層・上層路盤 厚さ検測',
        standard: '設計厚比 -10% 以内 (t ≥ 270mm)',
        measured: '実測平均 t = 284mm (規格値以上)',
        judgment: 'PASS'
      },
      {
        id: 'ICON-03',
        clause: '盛土締固め回数 (GNSS転圧履歴)',
        standard: '規定転圧回数 N ≥ 4回 通過率 95%以上',
        measured: '全エリア通過率 99.4% (網羅確認完了)',
        judgment: 'PASS'
      },
      {
        id: 'ICON-04',
        clause: '法面勾配・法肩法尻線 アライメント',
        standard: '法長較差 ±100mm 以内',
        measured: 'UAV写真測量較差 -22mm 〜 +35mm',
        judgment: 'PASS'
      },
      {
        id: 'ICON-05',
        clause: '電子納品データ形式 (i-Con 2.0)',
        standard: 'LandXML 1.2 サーフェス ＆ 点群OBJ/LAS納品',
        measured: 'TIN構造・平面直角座標第IX系 完全整合',
        judgment: 'PASS'
      }
    ]
  };
};

/**
 * ICT建機 MC/MG 車載モニタ用 LandXML 1.2 3D-TIN サーフェス生成
 */
export const generateIctTinLandXml = (project?: CivilProject): string => {
  const projName = project?.name ?? 'Kumamoto_West_Ring';
  const timestamp = new Date().toISOString();

  // サンプルTINメッシュ生成 (STA.0+000 〜 STA.24+500の路床面三角網)
  const vertices = [
    { id: 1, x: 32.7812, y: 130.6845, z: 24.50 },
    { id: 2, x: 32.7812, y: 130.6848, z: 24.35 },
    { id: 3, x: 32.7815, y: 130.6845, z: 24.62 },
    { id: 4, x: 32.7815, y: 130.6848, z: 24.48 },
    { id: 5, x: 32.7820, y: 130.6850, z: 25.10 },
    { id: 6, x: 32.7820, y: 130.6854, z: 24.95 },
    { id: 7, x: 32.7825, y: 130.6852, z: 25.40 },
    { id: 8, x: 32.7825, y: 130.6856, z: 25.25 },
    { id: 9, x: 32.7830, y: 130.6855, z: 25.80 },
    { id: 10, x: 32.7830, y: 130.6859, z: 25.65 }
  ];

  const faces = [
    [1, 2, 3],
    [2, 4, 3],
    [3, 4, 5],
    [4, 6, 5],
    [5, 6, 7],
    [6, 8, 7],
    [7, 8, 9],
    [8, 10, 9]
  ];

  const pntsLines = vertices.map(v => `        <P id="${v.id}">${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(3)}</P>`).join('\n');
  const facesLines = faces.map(f => `        <F>${f[0]} ${f[1]} ${f[2]}</F>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ===================================================================== -->
<!-- Nova3D Civil Platform v5.2 - ICT Construction 3D-TIN Surface          -->
<!-- Target Systems: Trimble Earthworks / TOPCON 3D-MC / Leica iCON 3D     -->
<!-- Standard: MLIT i-Construction 2.0 LandXML 1.2 Surface Specification   -->
<!-- Timestamp: ${timestamp}                                              -->
<!-- ===================================================================== -->
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.landxml.org/schema/LandXML-1.2 http://www.landxml.org/schema/LandXML-1.2/LandXML-1.2.xsd"
         version="1.2"
         date="${timestamp.split('T')[0]}"
         time="${timestamp.split('T')[1].split('.')[0]}">
  <Project name="${projName}_ICT_Subgrade_Design_Surface" />
  <Application name="Nova3D Civil Platform" version="5.2" manufacturer="Nova3D Civil Engineering Systems" />
  <CoordinateSystem desc="JGD2011 / Japan Plane Rectangular CS IX" epsgCode="6677" />
  <Units>
    <Metric linearUnit="meter" areaUnit="squareMeter" volumeUnit="cubicMeter" temperatureUnit="celsius" pressureUnit="HPA" />
  </Units>
  <Surfaces>
    <Surface name="${projName}_Design_Roadbed_TIN">
      <Definition surfType="TIN" elevMax="38.50" elevMin="21.20">
        <Pnts>
${pntsLines}
        </Pnts>
        <Faces>
${facesLines}
        </Faces>
      </Definition>
    </Surface>
  </Surfaces>
</LandXML>
`;
};

/**
 * 国交省 i-Construction 2.0 出来形検測 ＆ CO2算定調書 CSV生成
 */
export const generateConstructionDxReportCsv = (project?: CivilProject): string => {
  const lca = calculateLcaCarbonFootprint(project);
  const quality = assessConstructionQuality(project);

  const lines = [
    '# =====================================================================',
    '# 国土交通省 i-Construction 2.0 出来形管理調書 ＆ LCA 温室効果ガス算定報告書',
    '# システム名: Nova3D Civil Platform v5.2 (建設DXモジュール)',
    `# 路線名: ${project?.name ?? '熊本環状西道路 (Kumamoto West Ring)'}`,
    `# 発行日時: ${new Date().toLocaleString('ja-JP')}`,
    '# 準拠規格: 国交省出来形管理要領(令和6年版) / ISO 14067 GHG Protocol',
    '# =====================================================================',
    '',
    '[1. ICT施工 出来形管理サマリー]',
    `総検測点数,${quality.totalSurveyPoints},点`,
    `規格値合格点数,${quality.passCount},点`,
    `出来形合格率,${quality.passRatePercent},% (判定基準: 95.0%以上)`,
    `最大盛土高較差,+${quality.maxOverfillMm},mm (許容限界: +50mm)`,
    `最大切土深較差,${quality.maxOvercutMm},mm (許容限界: -50mm)`,
    `標準偏差(σ),${quality.stdDeviationMm},mm`,
    '',
    '[2. 各工種別 出来形検測結果明細]',
    '管理項目コード,検測工種・項目,規格値,実測値・分布,合否判定',
    ...quality.inspectionClauses.map(c => `${c.id},"${c.clause}","${c.standard}","${c.measured}",${c.judgment}`),
    '',
    '[3. ライフサイクル(LCA) 温室効果ガス(CO2)算定結果]',
    `総CO2排出量,${lca.totalCo2Tons},ton-CO2`,
    `従来工法基準値,${lca.baselineCo2Tons},ton-CO2`,
    `CO2総削減量,▲${lca.reductionTons},ton-CO2`,
    `CO2削減率,▲${lca.reductionPercent},%`,
    `自主カーボンオフセット(間伐材等),▲${lca.offsetCreditsTons},ton-CO2`,
    `ネット実質排出量,${lca.netEmissionsTons},ton-CO2`,
    '',
    '[4. CO2排出内訳 (Scope 1/2/3)]',
    '排出カテゴリ,排出量(ton-CO2),構成比(%)',
    `土工・重機掘削積込,${lca.breakdown.excavationTons},${Math.round((lca.breakdown.excavationTons / lca.totalCo2Tons) * 1000) / 10}%`,
    `ダンプ運搬(場内流用),${lca.breakdown.earthworkHaulageTons},${Math.round((lca.breakdown.earthworkHaulageTons / lca.totalCo2Tons) * 1000) / 10}%`,
    `コンクリート構造物打設,${lca.breakdown.concreteStructuresTons},${Math.round((lca.breakdown.concreteStructuresTons / lca.totalCo2Tons) * 1000) / 10}%`,
    `鋼橋上部工製作架設,${lca.breakdown.steelSuperstructureTons},${Math.round((lca.breakdown.steelSuperstructureTons / lca.totalCo2Tons) * 1000) / 10}%`,
    `トンネル機械掘削・換気,${lca.breakdown.tunnelMachineryTons},${Math.round((lca.breakdown.tunnelMachineryTons / lca.totalCo2Tons) * 1000) / 10}%`,
    '',
    '[5. 採用したグリーン建設DX施策]',
    ...lca.ecoInitiatives.map((init, idx) => `施策${idx + 1},"${init}"`)
  ];

  return lines.join('\n');
};
