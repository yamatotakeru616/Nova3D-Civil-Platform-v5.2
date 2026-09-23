import { useState, useMemo, useCallback } from 'react';
import {
  BridgeSpan,
  BridgePier,
  BridgeStructureConfig,
  BridgeAuditItem,
  BridgeMechanicsState,
} from '../types';

export const INITIAL_SPANS: BridgeSpan[] = [
  { id: 'span-1', name: 'A1-P1', lengthM: 42.0, isAdjustable: true },
  { id: 'span-2', name: 'P1-P2', lengthM: 52.0, isAdjustable: true },
  { id: 'span-3', name: 'P2-P3', lengthM: 52.0, isAdjustable: true },
  { id: 'span-4', name: 'P3-P4', lengthM: 52.0, isAdjustable: true },
  { id: 'span-5', name: 'P4-A2', lengthM: 42.0, isAdjustable: true },
];

export const INITIAL_CONFIG: BridgeStructureConfig = {
  bridgeType: '5径間連続鋼箱桁橋 (Steel Box Girder)',
  totalLengthM: 240.0,
  effectiveWidthM: 10.50,
  girderHeightM: 2.40,
  girderSteelGrade: 'SM490Y (降伏強度 355 N/mm²)',
  deckType: '鋼・コンクリート合成床版 (t=240mm)',
  hwlElevationM: 32.40,
  designDischargeM3s: 1850,
  soilSupportDepthM: 18.2, // GL-18.2m 礫層 N≧50
};

export function useBridgeDesign() {
  const [spans, setSpans] = useState<BridgeSpan[]>(INITIAL_SPANS);
  const [config, setConfig] = useState<BridgeStructureConfig>(INITIAL_CONFIG);
  const [isCommitted, setIsCommitted] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'bmd' | 'sfd' | 'deflection'>('bmd');
  const [exportModalOpen, setExportModalOpen] = useState<'none' | 'ifc' | 'landxml'>('none');

  // トースト表示補助
  const showToast = useCallback((msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // 総橋長
  const currentTotalLength = useMemo(() => {
    return spans.reduce((sum, s) => sum + s.lengthM, 0);
  }, [spans]);

  // 最大支間長
  const maxSpanLength = useMemo(() => {
    return Math.max(...spans.map((s) => s.lengthM));
  }, [spans]);

  // 下部工（橋脚 P1〜P4）位置・反力算定
  const piers: BridgePier[] = useMemo(() => {
    let cumLength = spans[0].lengthM;
    return [
      {
        id: 'P1',
        name: '橋脚 P1',
        station: `STA. 6+${Math.round(500 + cumLength)}`,
        heightM: 13.8,
        columnWidthM: 2.2,
        pileLengthM: 17.5,
        pileCount: 6,
        reactionKN: Math.round(4200 + (spans[0].lengthM + spans[1].lengthM) * 12),
      },
      {
        id: 'P2',
        name: '橋脚 P2 (流心深部)',
        station: `STA. 6+${Math.round(500 + (cumLength += spans[1].lengthM))}`,
        heightM: 15.2,
        columnWidthM: 2.4,
        pileLengthM: 19.8,
        pileCount: 6,
        reactionKN: Math.round(4800 + (spans[1].lengthM + spans[2].lengthM) * 14),
      },
      {
        id: 'P3',
        name: '橋脚 P3 (流心深部)',
        station: `STA. 6+${Math.round(500 + (cumLength += spans[2].lengthM))}`,
        heightM: 15.0,
        columnWidthM: 2.4,
        pileLengthM: 19.2,
        pileCount: 6,
        reactionKN: Math.round(4750 + (spans[2].lengthM + spans[3].lengthM) * 14),
      },
      {
        id: 'P4',
        name: '橋脚 P4',
        station: `STA. 6+${Math.round(500 + (cumLength += spans[3].lengthM))}`,
        heightM: 13.5,
        columnWidthM: 2.2,
        pileLengthM: 17.0,
        pileCount: 6,
        reactionKN: Math.round(4180 + (spans[3].lengthM + spans[4].lengthM) * 12),
      },
    ];
  }, [spans]);

  // 力学解析（梁要素法シミュレーション値）
  const mechanics: BridgeMechanicsState = useMemo(() => {
    // 支間長と桁高に依存する曲げモーメント算定 (M = wL^2 / 10 相当)
    const deadLoadW = 42.5; // kN/m (鋼重+床版)
    const liveLoadW = 28.0; // kN/m (B活荷重等価)
    const totalW = deadLoadW + liveLoadW;
    const lMax = maxSpanLength;
    const bmdMax = Math.round((totalW * lMax * lMax) / 10.5); // kN・m (中間支点部負曲げ)
    const sfdMax = Math.round(totalW * lMax * 0.62); // kN (支点せん断力)

    // たわみ (δ = 5wL^4 / 384EI)
    const girderH = config.girderHeightM;
    const inertiaI = 0.85 * Math.pow(girderH, 3); // 断面二次モーメント概算
    const deflectionMm = Number(((lMax * lMax * 0.038) / inertiaI).toFixed(1));
    const deflectionRatioLimit = `L/${Math.round((lMax * 1000) / deflectionMm)}`;
    const deflectionPass = deflectionMm <= (lMax * 1000) / 800;

    // 河川法余裕高 (道路計画高 36.90m - 桁高 2.40m - HWL 32.40m)
    const roadElevation = 36.90;
    const girderSoffitElevation = roadElevation - girderH;
    const riverFreeboard = Number((girderSoffitElevation - config.hwlElevationM).toFixed(2));

    // 流下阻害率 (橋脚柱幅2.4m×2基 + 2.2m×2基) / 河川幅180m
    const totalPierWidth = piers.reduce((sum, p) => sum + p.columnWidthM, 0);
    const riverWidth = 180.0;
    const riverObstructionRate = Number(((totalPierWidth / riverWidth) * 100).toFixed(2));

    // 概算鋼重・工費
    const steelWeight = Math.round(currentTotalLength * 4.85 * (girderH / 2.4));
    const cost = Math.round(steelWeight * 0.82 + 650); // 百万円

    return {
      maxBendingMomentKNm: bmdMax,
      maxShearForceKN: sfdMax,
      maxDeflectionMm: deflectionMm,
      deflectionRatioLimit,
      deflectionPass,
      riverFreeboardM: riverFreeboard,
      riverObstructionRatePercent: riverObstructionRate,
      totalSteelWeightTons: steelWeight,
      estimatedCostMillionYen: cost,
    };
  }, [maxSpanLength, config.girderHeightM, config.hwlElevationM, piers, currentTotalLength]);

  // リアルタイム監査マトリクス (河川法第24条 + 道路橋示方書)
  const auditItems: BridgeAuditItem[] = useMemo(() => {
    // 1. 桁下余裕高 (河川法第24条)
    const freeboardLimit = 1.50; // m
    const freeboardPass = mechanics.riverFreeboardM >= freeboardLimit;
    const freeboardMargin = Math.round((mechanics.riverFreeboardM / freeboardLimit) * 100);

    // 2. 流下阻害率 (河川法・河川管理施設等構造令)
    const obstructionLimit = 5.0; // %
    const obstructionPass = mechanics.riverObstructionRatePercent <= obstructionLimit;
    const obstructionMargin = Math.round(((obstructionLimit - mechanics.riverObstructionRatePercent) / obstructionLimit) * 100);

    // 3. 支間中央曲げ応力度 (道路橋示方書 鋼橋編)
    const bendingStress = Math.round(mechanics.maxBendingMomentKNm / 78); // N/mm²
    const bendingAllow = 210; // N/mm² (SM490Y許容曲げ)
    const bendingPass = bendingStress <= bendingAllow;
    const bendingMargin = Math.round((bendingAllow / bendingStress) * 100);

    // 4. 支点せん断応力度 (道路橋示方書 鋼橋編)
    const shearStress = Math.round(mechanics.maxShearForceKN / 25); // N/mm²
    const shearAllow = 120; // N/mm²
    const shearPass = shearStress <= shearAllow;
    const shearMargin = Math.round((shearAllow / shearStress) * 100);

    // 5. 最大活荷重たわみ (道路橋示方書 共通編)
    const defPass = mechanics.deflectionPass;

    // 6. 杭基礎鉛直支持力 (道路橋示方書 下部工編)
    const pileCapacityKN = 5200; // φ1200 場所打ち杭 1本当たり許容
    const pileReactionMax = Math.round(Math.max(...piers.map((p) => p.reactionKN)) / 6);
    const pilePass = pileReactionMax <= pileCapacityKN;

    return [
      {
        id: 'river-freeboard',
        lawOrStandard: '河川法第24条',
        clause: '計画高水位 桁下余裕高',
        title: '桁下流木クリアランス空間',
        standardLimit: `H ≥ ${freeboardLimit.toFixed(2)}m`,
        actualValue: `H = ${mechanics.riverFreeboardM.toFixed(2)}m`,
        status: freeboardPass ? 'PASS' : 'WARN',
        marginRatio: freeboardMargin,
        note: 'HWL 32.40m + 2.10m 確保 (流木閉塞完全回避)',
      },
      {
        id: 'river-obstruction',
        lawOrStandard: '河川技術基準',
        clause: '河川横断工作物 流下阻害率',
        title: '洪水時流下断面阻害比率',
        standardLimit: `率 ≤ ${obstructionLimit.toFixed(1)}%`,
        actualValue: `率 = ${mechanics.riverObstructionRatePercent.toFixed(2)}%`,
        status: obstructionPass ? 'PASS' : 'WARN',
        marginRatio: 100 + obstructionMargin,
        note: '橋脚柱幅 2.2〜2.4m 水理楕円形断面採用',
      },
      {
        id: 'steel-bending',
        lawOrStandard: '道路橋示方書 II',
        clause: '鋼箱桁 主桁曲げ応力度',
        title: '中間支点部 負曲げ応力照査',
        standardLimit: `σ ≤ ${bendingAllow} N/mm²`,
        actualValue: `σ = ${bendingStress} N/mm²`,
        status: bendingPass ? 'PASS' : 'WARN',
        marginRatio: bendingMargin,
        note: '鋼材 SM490Y (降伏点 355 N/mm²)',
      },
      {
        id: 'steel-shear',
        lawOrStandard: '道路橋示方書 II',
        clause: '主桁腹板 せん断応力度',
        title: '支点近傍 腹板座屈・せん断照査',
        standardLimit: `τ ≤ ${shearAllow} N/mm²`,
        actualValue: `τ = ${shearStress} N/mm²`,
        status: shearPass ? 'PASS' : 'WARN',
        marginRatio: shearMargin,
      },
      {
        id: 'live-deflection',
        lawOrStandard: '道路橋示方書 I',
        clause: '活荷重たわみ制限',
        title: '通行快適性・疲労低減たわみ',
        standardLimit: 'δ ≤ L/800',
        actualValue: `δ = ${mechanics.maxDeflectionMm}mm (${mechanics.deflectionRatioLimit})`,
        status: defPass ? 'PASS' : 'WARN',
        marginRatio: 135,
      },
      {
        id: 'substructure-pile',
        lawOrStandard: '道路橋示方書 IV',
        clause: '場所打ち杭 鉛直支持力',
        title: '支持層(N≧50礫層) 到達杭支持力',
        standardLimit: `R_a ≥ ${pileReactionMax} kN/本`,
        actualValue: `耐力 5,200 kN/本`,
        status: pilePass ? 'PASS' : 'WARN',
        marginRatio: 124,
      },
    ];
  }, [mechanics, piers]);

  // -------------------------------------------------------------
  // SKILL ACTIONS (操作のスキル化)
  // -------------------------------------------------------------

  // Skill 1: スパン長の微調整
  const updateSpanLengthSkill = useCallback((spanId: string, deltaM: number) => {
    setSpans((prev) =>
      prev.map((s) => {
        if (s.id === spanId) {
          const nextL = Math.max(30.0, Math.min(75.0, Number((s.lengthM + deltaM).toFixed(1))));
          return { ...s, lengthM: nextL };
        }
        return s;
      })
    );
    setIsCommitted(false);
  }, []);

  // Skill 2: 桁高の調整
  const updateGirderHeightSkill = useCallback((heightM: number) => {
    setConfig((prev) => ({
      ...prev,
      girderHeightM: Number(heightM.toFixed(2)),
    }));
    setIsCommitted(false);
  }, []);

  // Skill 3: 橋梁構造確定コミット
  const commitBridgeDesignSkill = useCallback(() => {
    setIsCommitted(true);
    showToast(`橋梁構造パラメータを確定コミットしました (橋長 ${currentTotalLength}m, 最大スパン ${maxSpanLength}m)`);
  }, [currentTotalLength, maxSpanLength, showToast]);

  // Skill 4: IFC 4.3 構造物エクスポート
  const exportBridgeIfcSkill = useCallback(() => {
    setExportModalOpen('ifc');
  }, []);

  // Skill 5: LandXML 構造物エクスポート
  const exportBridgeLandXmlSkill = useCallback(() => {
    setExportModalOpen('landxml');
  }, []);

  // 生成される IFC 4.3 コード
  const generatedIfcCode = useMemo(() => {
    return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [BridgeDesign-4.3]'),'2;1');
FILE_NAME('Nova3D-Bridge-MidoriRiver.ifc','${new Date().toISOString()}',('CivilEngineer'),('Nova3D Platform'),'IFC4X3_ADD2','Nova3D Civil Studio','');
FILE_SCHEMA(('IFC4X3_ADD2'));
ENDSEC;
DATA;
#1=IFCPROJECT('1uX$bY$0T6F9g_G8w7a$1c',$,'MidoriRiver Bridge Project',$,$,$,$,(#10),#20);
#10=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#11,$);
#11=IFCAXIS2PLACEMENT3D(#12,#13,#14);
#12=IFCCARTESIANPOINT((128450.21,45210.88,36.90));
#13=IFCDIRECTION((0.,0.,1.));
#14=IFCDIRECTION((1.,0.,0.));
#20=IFCUNITASSIGNMENT((#21,#22));
#21=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);
#22=IFCSIUNIT(*,.MASSUNIT.,.KILO.,.GRAM.);
#30=IFCBRIDGE('2vW_aZ$1U7G0h_H9x8b$2d',$,'MidoriRiver-Bridge-CorridorA1','5-Span Continuous Steel Box Girder',$,#11,$,$,.GIRDER.);
#40=IFCBRIDGEPART('3wX_bA$2V8H1i_I0y9c$3e',$,'Superstructure-SteelBoxGirder',$,$,#11,$,$,.SUPERSTRUCTURE.);
#41=IFCBRIDGEPART('4xY_cB$3W9I2j_J1z0d$4f',$,'Substructure-PiersP1_P4',$,$,#11,$,$,.SUBSTRUCTURE.);
/* Spans: ${spans.map((s) => `${s.name}=${s.lengthM}m`).join(', ')} */
/* TotalLength: ${currentTotalLength}m, GirderHeight: ${config.girderHeightM}m, Steel: ${config.girderSteelGrade} */
ENDSEC;
END-ISO-10303-21;`;
  }, [spans, currentTotalLength, config]);

  // 生成される LandXML コード
  const generatedLandXmlCode = useMemo(() => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2"
         version="1.2" date="${new Date().toISOString().slice(0, 10)}"
         project="Nova3D-Bridge-MidoriRiver">
  <Units>
    <Metric linearUnit="meter" areaUnit="squareMeter" volumeUnit="cubicMeter"
            temperatureUnit="celsius" pressureUnit="HPa" angleUnit="decimal degrees"/>
  </Units>
  <CoordinateSystem epsgCode="6677" desc="JGD2011 / Zone IX (EPSG:6677)"/>
  <Structs name="MidoriRiver-CrossingBridge">
    <Struct name="Bridge-01" type="SteelBoxGirder" desc="5-Span Continuous Box Girder"
            length="${currentTotalLength}.000" width="${config.effectiveWidthM}">
      <PierCount>4</PierCount>
      <Spans>
        ${spans.map((s, idx) => `<Span num="${idx + 1}" name="${s.name}" length="${s.lengthM}.000"/>`).join('\n        ')}
      </Spans>
      <Clearance>
        <VerticalClearance>${mechanics.riverFreeboardM}</VerticalClearance>
        <HwlElevation>${config.hwlElevationM}</HwlElevation>
      </Clearance>
    </Struct>
  </Structs>
</LandXML>`;
  }, [currentTotalLength, config, spans, mechanics.riverFreeboardM]);

  return {
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
    // Skills
    updateSpanLengthSkill,
    updateGirderHeightSkill,
    commitBridgeDesignSkill,
    exportBridgeIfcSkill,
    exportBridgeLandXmlSkill,
  };
}
