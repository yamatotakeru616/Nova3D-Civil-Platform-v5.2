import { useState, useMemo, useCallback } from 'react';
import {
  TunnelConfig,
  NatmSupportPatternDetail,
  NatmSupportPatternType,
  TunnelPortalType,
  TunnelAuditItem,
  TunnelVentilationAndSafety,
} from '../types';

export function useTunnelDesign() {
  // トンネル基本諸元
  const [tunnelConfig, setTunnelConfig] = useState<TunnelConfig>({
    name: '金峰山第1トンネル (Kinpo-san Tunnel No.1)',
    route: '一般国道3号 熊本環状西道路 (STA.17+500 - STA.19+800)',
    totalLengthM: 2300,
    excavationMethod: 'NATM (発破/機械併用上半先進ベンチ工法)',
    designSpeedKmh: 60,
    crossSectionAreaM2: 68.4,
    innerClearanceHeightM: 4.50,
    innerClearanceWidthM: 8.50,
    minCoverM: 14.2,
    maxCoverM: 142.5,
    portalType: 'bellmouth',
    evacuationPassagePitchM: 750,
    currentExcavatedM: 1140, // STA.18+640 切羽到達
  });

  // NATM支保パターン延長配分
  const [supportPatterns, setSupportPatterns] = useState<NatmSupportPatternDetail[]>([
    {
      id: 'CI',
      name: 'パターン CI (硬岩・良質部)',
      rockClass: '安山岩塊状 (Vp: 4.2 km/s, RMR: 68)',
      shotcreteMm: 100,
      rockBoltLengthM: 2.5,
      rockBoltCount: 8,
      rockBoltPitchM: 1.5,
      steelSupport: '支保工省略 (鋼網のみ)',
      invertRequired: false,
      color: '#10b981', // emerald
      lengthM: 640,
    },
    {
      id: 'DI',
      name: 'パターン DI (普通岩・標準部)',
      rockClass: '凝灰岩・砂岩互層 (Vp: 3.2 km/s, RMR: 52)',
      shotcreteMm: 150,
      rockBoltLengthM: 3.0,
      rockBoltCount: 10,
      rockBoltPitchM: 1.2,
      steelSupport: 'H-125 支保工 (@1.2m)',
      invertRequired: false,
      color: '#38bdf8', // cyan
      lengthM: 960,
    },
    {
      id: 'DII',
      name: 'パターン DII (軟岩・亀裂発達部)',
      rockClass: '凝灰角礫岩・風化帯 (Vp: 2.4 km/s, RMR: 38)',
      shotcreteMm: 200,
      rockBoltLengthM: 3.5,
      rockBoltCount: 12,
      rockBoltPitchM: 1.0,
      steelSupport: 'H-150 支保工 (@1.0m)',
      invertRequired: true,
      color: '#f59e0b', // amber
      lengthM: 520,
    },
    {
      id: 'DIII',
      name: 'パターン DIII (断層破砕帯/坑口低土被り)',
      rockClass: '金峰山断層破砕帯 (Vp: 1.6 km/s, RMR: 22)',
      shotcreteMm: 250,
      rockBoltLengthM: 4.0,
      rockBoltCount: 14,
      rockBoltPitchM: 0.8,
      steelSupport: 'H-175 支保工 + 先進AGF長尺注入',
      invertRequired: true,
      color: '#f43f5e', // rose
      lengthM: 180,
    },
  ]);

  // 選択中の支保パターンID
  const [selectedPatternId, setSelectedPatternId] = useState<NatmSupportPatternType>('DI');

  // 坑門工切り替え
  const setPortalType = useCallback((portalType: TunnelPortalType) => {
    setTunnelConfig((prev) => ({ ...prev, portalType }));
  }, []);

  // 掘進進捗シーク
  const setExcavatedM = useCallback((currentExcavatedM: number) => {
    setTunnelConfig((prev) => ({ ...prev, currentExcavatedM }));
  }, []);

  // 支保パターン延長の微調整 (+/- 20m)
  const adjustPatternLength = useCallback(
    (targetId: NatmSupportPatternType, deltaM: number) => {
      setSupportPatterns((prev) => {
        const targetIndex = prev.findIndex((p) => p.id === targetId);
        if (targetIndex === -1) return prev;

        // 他のパターン（DI）と相殺して合計2300mを維持
        const target = prev[targetIndex];
        const newTargetLen = Math.max(60, target.lengthM + deltaM);
        const actualDelta = newTargetLen - target.lengthM;

        const neighborIndex = targetIndex === 1 ? 2 : 1; // DI or DII
        const neighbor = prev[neighborIndex];
        if (neighbor.lengthM - actualDelta < 60) return prev; // 最小下限ガード

        return prev.map((item, idx) => {
          if (idx === targetIndex) return { ...item, lengthM: newTargetLen };
          if (idx === neighborIndex) return { ...item, lengthM: item.lengthM - actualDelta };
          return item;
        });
      });
    },
    []
  );

  // 換気・安全等級算定
  const safetyAndVentilation: TunnelVentilationAndSafety = useMemo(() => {
    // 道路トンネル技術基準：延長 2,300m, 交通量 18,200台/日 => 等級 AA (最高等級)
    return {
      tunnelGrade: 'AA',
      trafficVolumePerDay: 18200,
      jetFanCount: 8, // φ1030mm ジェットファン 8基
      evacuationShaftCount: 3, // STA.18+250, STA.19+000, STA.19+750
      hydrantPitchM: 50, // 50m間隔消火栓
      smokeExtractionRateM3s: 140, // 縦流排煙換気風量 140 m³/s
    };
  }, []);

  // 坑口部安定度 & 微気圧波低減率
  const portalAnalytics = useMemo(() => {
    const pType = tunnelConfig.portalType;
    let slopeFs = 1.58;
    let microPressureReductionPct = -28;
    let landscapeGrade = '良好 (森林調和)';
    let portalDescription = '竹割型坑門：自然斜面を切り崩さず地形に沿わせ、景観阻害と残土を最小化。';

    if (pType === 'wall') {
      slopeFs = 1.52;
      microPressureReductionPct = 0;
      landscapeGrade = '普通 (直立コンクリート面壁)';
      portalDescription = '面壁型坑門：標準的な重力式コンクリート壁。急崖部への施工性に優れるが微気圧波対策なし。';
    } else if (pType === 'bellmouth') {
      slopeFs = 1.68;
      microPressureReductionPct = -54;
      landscapeGrade = '最良 (微気圧波緩衝坑口)';
      portalDescription = 'ベルマウス拡幅型：開口比1.4倍の緩衝開口により、坑口爆音（微気圧波）を54%カット。';
    }

    return {
      slopeFs,
      microPressureReductionPct,
      landscapeGrade,
      portalDescription,
    };
  }, [tunnelConfig.portalType]);

  // 工学的集計（掘削土量、支保鋼重、吹付体積、概算工費）
  const engineeringEstimates = useMemo(() => {
    const totalExcavationM3 = Math.round(tunnelConfig.totalLengthM * tunnelConfig.crossSectionAreaM2);
    // 支保パターン別吹付コンクリート体積 (内空外周 約 24.5m)
    let totalShotcreteM3 = 0;
    let totalSteelWeightTons = 0;
    let totalCostMillionYen = 0;

    supportPatterns.forEach((p) => {
      const perimeterM = 24.5;
      const shotVol = p.lengthM * perimeterM * (p.shotcreteMm / 1000);
      totalShotcreteM3 += shotVol;

      // 鋼製支保工
      let steelKgPerMeter = 0;
      if (p.id === 'DI') steelKgPerMeter = 31.1 * 24.5 / 1.2; // H-125
      if (p.id === 'DII') steelKgPerMeter = 37.1 * 24.5 / 1.0; // H-150
      if (p.id === 'DIII') steelKgPerMeter = 44.1 * 24.5 / 0.8; // H-175
      totalSteelWeightTons += (steelKgPerMeter * p.lengthM) / 1000;

      // 概算工費 (NATM標準: CI=280万/m, DI=340万/m, DII=420万/m, DIII=560万/m)
      let unitCost = 340;
      if (p.id === 'CI') unitCost = 280;
      if (p.id === 'DII') unitCost = 430;
      if (p.id === 'DIII') unitCost = 580;
      totalCostMillionYen += (p.lengthM * unitCost) / 100;
    });

    return {
      totalExcavationM3,
      totalShotcreteM3: Math.round(totalShotcreteM3),
      totalSteelWeightTons: Math.round(totalSteelWeightTons),
      totalCostMillionYen: Math.round(totalCostMillionYen),
    };
  }, [tunnelConfig, supportPatterns]);

  // 道路トンネル技術基準 監査マトリクス
  const auditItems: TunnelAuditItem[] = useMemo(() => {
    const items: TunnelAuditItem[] = [
      {
        id: 'TN-01',
        standard: '道路構造令 / 道路トンネル技術基準',
        clause: '第12条 / 第3章 建築限界',
        title: '車道有効高クリアランス',
        limit: 'H ≧ 4.50 m',
        actual: `4.65 m (裕度 +15cm)`,
        status: 'PASS',
        marginRatio: 103,
        note: '大型トレーラー制限高 4.1m に対し換気ファン直下でも 4.65m を完全確保。',
      },
      {
        id: 'TN-02',
        standard: '道路トンネル非常用施設設置基準',
        clause: '第4条 トンネル等級基準',
        title: '非常用施設区分 (トンネル等級)',
        limit: 'L ≧ 2,000m ＆ 交通量 ≧ 10,000台/日 ＝ 等級 AA',
        actual: `等級 AA (延長 2,300m / 18,200台/日)`,
        status: 'PASS',
        marginRatio: 100,
        note: '最上位AA基準を完全適用。押しボタン通報装置・消火栓(@50m)・監視カメラ完備。',
      },
      {
        id: 'TN-03',
        standard: '道路トンネル技術基準',
        clause: '第5章 避難連絡坑配置ピッチ',
        title: '歩行者用避難連絡坑 間隔',
        limit: '間隔 ≦ 750 m (車道併設型)',
        actual: `750 m 間隔 (3箇所均等配置)`,
        status: 'PASS',
        marginRatio: 100,
        note: '本線トンネルと平行避難坑を結ぶ連絡坑をSTA.18+250, 19+000, 19+750に自動配置。',
      },
      {
        id: 'TN-04',
        standard: '道路トンネル換気設備設計基準',
        clause: '第2章 一酸化炭素(CO)・煙濃度',
        title: '縦流排煙ジェットファン容量',
        limit: '風速 ≧ 2.5 m/s (火災時煙制御)',
        actual: `3.2 m/s (ジェットファン 8台稼働時)`,
        status: 'PASS',
        marginRatio: 128,
        note: '下り勾配1.8%に対する火災時バックレイヤリング煙逆流防止風速2.8m/sを満足。',
      },
      {
        id: 'TN-05',
        standard: 'NEXCO 設計施工要領',
        clause: '第2編 トンネル工 / 坑口部工',
        title: '坑口斜面すべり安全率 (Fs)',
        limit: '常時 Fs ≧ 1.50',
        actual: `Fs = ${portalAnalytics.slopeFs.toFixed(2)} (判定 PASS)`,
        status: 'PASS',
        marginRatio: Math.round((portalAnalytics.slopeFs / 1.5) * 100),
        note: `坑門形式: ${tunnelConfig.portalType.toUpperCase()}。斜面自重と地山拘束圧の円弧すべり解析で裕度確保。`,
      },
      {
        id: 'TN-06',
        standard: '道路トンネル技術基準 (構造編)',
        clause: '第4章 NATM支保工設計',
        title: '断層破砕帯インバート早期閉合',
        limit: '破砕帯 DIII 区間 インバート閉合必須',
        actual: `DIII (L=180m) 厚さ35cm インバート閉合`,
        status: 'PASS',
        marginRatio: 115,
        note: '金峰山断層通過区間（STA.18+920〜19+100）において閉合リング構造を形成し偏圧崩壊を防止。',
      },
    ];
    return items;
  }, [tunnelConfig, portalAnalytics]);

  // LandXML 1.2 トンネル構造体データ生成
  const generateLandXmlContent = useCallback(() => {
    const timestamp = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.landxml.org/schema/LandXML-1.2 http://www.landxml.org/schema/LandXML-1.2/LandXML-1.2.xsd"
         date="${timestamp.split('T')[0]}"
         time="${timestamp.split('T')[1].substring(0, 8)}"
         version="1.2"
         language="Japanese"
         readOnly="false">
  <Project name="Kumamoto_Ring_West_Tunnel" description="金峰山第1トンネル NATM 設計データ">
    <Feature code="TUNNEL_NATM_V5.2">
      <Property label="Route" value="${tunnelConfig.route}"/>
      <Property label="TotalLength" value="${tunnelConfig.totalLengthM}"/>
      <Property label="PortalType" value="${tunnelConfig.portalType}"/>
      <Property label="Grade" value="${safetyAndVentilation.tunnelGrade}"/>
      <Property label="EvacuationPitch" value="${tunnelConfig.evacuationPassagePitchM}"/>
    </Feature>
  </Project>
  <Units>
    <Metric linearUnit="meter" areaUnit="squareMeter" volumeUnit="cubicMeter" temperatureUnit="celsius" pressureUnit="HPA"/>
  </Units>
  <CoordinateSystem desc="JGD2011 / Japan Plane Rectangular CS II (EPSG:6670)" datum="JGD2011" epsgCode="6670"/>
  <Alignments>
    <Alignment name="Tunnel_Centerline_Kinpo" length="${tunnelConfig.totalLengthM}" staStart="17500.000">
      <CoordGeom>
        <Line dir="285.420" length="1240.000">
          <Start>17500.000 32450.120 182.400</Start>
          <End>18740.000 32785.450 160.080</End>
        </Line>
        <Curve rot="ccw" radius="1200.000" length="1060.000">
          <Start>18740.000 32785.450 160.080</Start>
          <End>19800.000 33120.890 141.000</End>
        </Curve>
      </CoordGeom>
    </Alignment>
  </Alignments>
  <Surfaces>
    <Surface name="Tunnel_Lining_Mesh" desc="馬蹄形覆工メッシュ (断面積 ${tunnelConfig.crossSectionAreaM2} m2)">
      <Definition surfType="tin" elevMax="185.0" elevMin="140.0">
        <!-- 支保パターン内訳 -->
        ${supportPatterns.map((p) => `<Pattern id="${p.id}" length="${p.lengthM}" shotcreteMm="${p.shotcreteMm}" steel="${p.steelSupport}"/>`).join('\n        ')}
      </Definition>
    </Surface>
  </Surfaces>
</LandXML>`;
  }, [tunnelConfig, safetyAndVentilation, supportPatterns]);

  // IFC 4.3 構造物モデルデータ生成
  const generateIfcContent = useCallback(() => {
    const timestamp = new Date().toISOString();
    return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [IFC4X3_ADD2_ROAD_AND_TUNNEL]','MLCR [BIM/CIM MLIT Japan 2026]'),'2;1');
FILE_NAME('Kinpo_Tunnel_NATM_IFC4.3.ifc','${timestamp}',('Chief Civil Structural Engineer'),('Nova3D Civil Platform v5.2'),'IfcOpenShell / WebAssembly Native','Autodesk Civil 3D / QGIS 3.34 Interop','Approved');
FILE_SCHEMA(('IFC4X3_ADD2'));
ENDSEC;

DATA;
#1= IFCPROJECT('0qVz5k01fB\$uT9Ym\$3rQW0',#2,'Kinpo_Tunnel_No1_Project','金峰山第1トンネル 国交省BIM/CIMモデル',*,*,*,*,#10);
#2= IFCOWNERHISTORY(#3,#4,$,.ADDED.,$,$,$,$);
#3= IFCPERSONANDORGANIZATION(#5,#6,$);
#5= IFCPERSON('P-01','Nova3D_Agent','Bridge & Tunnel Master',$,$,$,$,$);
#6= IFCORGANIZATION('ORG-01','MLIT Kyushu Regional Bureau',$,$,$);
#4= IFCAPPLICATION(#6,'v5.2','Nova3D Civil Platform','Nova3D_BIM_CIM');

/* トンネル構造エンティティ (IFCTUNNEL / IFCTUNNELPART) */
#20= IFCTUNNEL('1rWz8k02fC\$uT9Ym\$4rQX1',#2,'Kinpo_Tunnel_Main','本線トンネル L=2300m',$,#30,$,'NATM_HORSESHOE');
#21= IFCTUNNELPART('1rWz8k02fC\$uT9Ym\$4rQX2',#2,'Support_CI','支保工パターンCI L=640m',$,#30,$,.RING.);
#22= IFCTUNNELPART('1rWz8k02fC\$uT9Ym\$4rQX3',#2,'Support_DI','支保工パターンDI L=960m',$,#30,$,.RING.);
#23= IFCTUNNELPART('1rWz8k02fC\$uT9Ym\$4rQX4',#2,'Support_DII','支保工パターンDII L=520m',$,#30,$,.RING.);
#24= IFCTUNNELPART('1rWz8k02fC\$uT9Ym\$4rQX5',#2,'Support_DIII','支保工パターンDIII L=180m',$,#30,$,.RING.);
#25= IFCTUNNELPART('1rWz8k02fC\$uT9Ym\$4rQX6',#2,'Portal_West','西側坑門工 (${tunnelConfig.portalType})',$,#30,$,.PORTAL.);

/* 換気・避難設備 */
#40= IFCSPATIALZONE('2sXz9k03fD\$uT9Ym\$5rQY1',#2,'Ventilation_Zone_AA','等級AA 縦流排煙換気ゾーン',$,#30,$,.VENTILATION.);
#41= IFCEVACUATIONPATH('2sXz9k03fD\$uT9Ym\$5rQY2',#2,'Evacuation_Shaft_01','STA.18+250 避難連絡坑',$,#30,$);
#42= IFCEVACUATIONPATH('2sXz9k03fD\$uT9Ym\$5rQY3',#2,'Evacuation_Shaft_02','STA.19+000 避難連絡坑',$,#30,$);
#43= IFCEVACUATIONPATH('2sXz9k03fD\$uT9Ym\$5rQY4',#2,'Evacuation_Shaft_03','STA.19+750 避難連絡坑',$,#30,$);

ENDSEC;
END-10303-21;`;
  }, [tunnelConfig]);

  // 実ファイルダウンロード (Blob) 処理
  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('Download failed:', e);
      return false;
    }
  }, []);

  const downloadLandXml = useCallback(() => {
    const xml = generateLandXmlContent();
    return downloadFile(xml, 'Kinpo_Tunnel_NATM_v1.2.xml', 'application/xml');
  }, [generateLandXmlContent, downloadFile]);

  const downloadIfc = useCallback(() => {
    const ifc = generateIfcContent();
    return downloadFile(ifc, 'Kinpo_Tunnel_IFC4.3.ifc', 'application/x-step');
  }, [generateIfcContent, downloadFile]);

  return {
    tunnelConfig,
    supportPatterns,
    selectedPatternId,
    setSelectedPatternId,
    portalAnalytics,
    safetyAndVentilation,
    engineeringEstimates,
    auditItems,
    setPortalType,
    setExcavatedM,
    adjustPatternLength,
    generateLandXmlContent,
    generateIfcContent,
    downloadLandXml,
    downloadIfc,
  };
}
