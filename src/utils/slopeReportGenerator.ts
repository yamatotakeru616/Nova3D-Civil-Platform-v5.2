/**
 * Nova3D Civil Platform v5.3 - Slope Stability Report & LandXML 1.2 Generator
 * 国交省事前協議用 斜面崩壊危険度カルテ CSV & BIM/CIM納品用 LandXML 1.2 出力
 */

import { SlopeStationData, RainSimulationParams } from './slopeStabilityEngine';
import { GroundAnchorDesign } from './groundAnchorOptimizer';

/**
 * 国交省事前協議用 斜面安定性・崩壊危険度カルテ CSV (BOM付き UTF-8)
 */
export function generateSlopeSafetyReportCSV(
  stations: SlopeStationData[],
  rain: RainSimulationParams,
  anchorDesigns: Record<string, GroundAnchorDesign>
): string {
  const bom = '\uFEFF';
  const header = [
    '測点番号 (STA)',
    '累加距離 (m)',
    '切土高 H (m)',
    '法面勾配 (1:n)',
    '対象地層名',
    '粘着力 c (kN/m2)',
    '内部摩擦角 φ (deg)',
    '降雨強度 (mm/h)',
    '継続時間 (h)',
    '浸透深度 (m)',
    '間隙水圧 u (kPa)',
    '常時安全率 Fs_normal',
    '常時判定 (基準>=1.20)',
    '豪雨時安全率 Fs_rain',
    '豪雨時判定 (基準>=1.00)',
    '補強工適用有無',
    '吹付枠規格',
    'アンカー段数',
    'アンカー総長 (m)',
    '設計引張力 (kN/本)',
    '補強後安全率 Fs_reinforced',
    '最終判定',
    '概算直接工費 (円)'
  ].join(',');

  const rows = stations.map((st) => {
    const anchor = anchorDesigns[st.station];
    const isNormalPass = st.normalFs >= 1.20 ? '適格' : '要検討';
    const isRainPass = st.rainFs >= 1.00 ? '適格' : '危険(要補強)';
    const isReinforced = st.reinforcementApplied && anchor;
    const finalFs = isReinforced ? anchor.achievedFs : st.rainFs;
    const finalJudge = finalFs >= 1.20 ? '設計目標達成(適合)' : finalFs >= 1.00 ? '警戒(監視推奨)' : '崩落危険(不適合)';

    return [
      `"${st.station}"`,
      st.stationMeter.toFixed(2),
      st.cutHeight.toFixed(2),
      `"1:${st.slopeGradient.toFixed(2)}"`,
      `"${st.soilType.name}"`,
      st.soilType.cohesion.toFixed(1),
      st.soilType.frictionAngle.toFixed(1),
      rain.intensityMmPerHour,
      rain.durationHours,
      st.seepageDepthM.toFixed(2),
      st.poreWaterPressureKPa.toFixed(1),
      st.normalFs.toFixed(3),
      `"${isNormalPass}"`,
      st.rainFs.toFixed(3),
      `"${isRainPass}"`,
      isReinforced ? '"適用済"' : '"未適用"',
      isReinforced ? `"${anchor.frameType}"` : '"-"',
      isReinforced ? anchor.anchorRows : 0,
      isReinforced ? anchor.totalLengthM.toFixed(1) : '0.0',
      isReinforced ? anchor.designTensionKN : 0,
      isReinforced ? anchor.achievedFs.toFixed(3) : st.rainFs.toFixed(3),
      `"${finalJudge}"`,
      isReinforced ? anchor.estimatedCostYen : 0
    ].join(',');
  });

  const metadata = [
    '# ========================================================',
    '# 国土交通省 道路土工指針準拠 斜面安定性照査・豪雨防災カルテ',
    `# 作成日時: ${new Date().toLocaleString('ja-JP')}`,
    `# 降雨シミュレーション条件: 時間雨量 ${rain.intensityMmPerHour} mm/h, 継続 ${rain.durationHours} h, 先行降雨 ${rain.antecedentRainfallMm} mm`,
    '# 照査基準: 常時 Fs >= 1.20, 降雨時 Fs >= 1.00, 補強目標 Fs >= 1.20',
    '# ========================================================'
  ].join('\n');

  return bom + metadata + '\n\n' + header + '\n' + rows.join('\n');
}

/**
 * BIM/CIM 納品用 LandXML 1.2 (斜面補強TINサーフェス＆アンカー諸元)
 */
export function generateSlopeLandXML(
  stations: SlopeStationData[],
  anchorDesigns: Record<string, GroundAnchorDesign>
): string {
  const timestamp = new Date().toISOString();
  
  // TINサーフェス用の頂点 (Pnts) と 面 (Faces) を生成
  const pnts: string[] = [];
  const faces: string[] = [];
  let pntId = 1;

  stations.forEach((st, idx) => {
    const xBase = st.stationMeter;
    const yRoad = 0;
    const zRoad = 45.0 + Math.sin(idx * 0.4) * 5.0; // 基準標高
    const ySlopeTop = st.cutHeight * st.slopeGradient;
    const zSlopeTop = zRoad + st.cutHeight;

    // 法尻 (Toe), 法肩 (Crest)
    const p1Id = pntId++;
    const p2Id = pntId++;
    pnts.push(`<P id="${p1Id}">${yRoad.toFixed(3)} ${xBase.toFixed(3)} ${zRoad.toFixed(3)}</P>`);
    pnts.push(`<P id="${p2Id}">${ySlopeTop.toFixed(3)} ${xBase.toFixed(3)} ${zSlopeTop.toFixed(3)}</P>`);

    if (idx > 0) {
      // 直前測点との間で2つの三角形を形成
      const prevP1 = p1Id - 2;
      const prevP2 = p1Id - 1;
      faces.push(`<F>${prevP1} ${p1Id} ${prevP2}</F>`);
      faces.push(`<F>${prevP2} ${p1Id} ${p2Id}</F>`);
    }
  });

  // アンカー施工プロパティ
  const anchorProps = stations
    .filter(st => st.reinforcementApplied && anchorDesigns[st.station])
    .map(st => {
      const a = anchorDesigns[st.station];
      return `        <Feature code="GroundAnchor" source="AI-Optimizer">
          <Property label="Station" value="${st.station}"/>
          <Property label="FrameType" value="${a.frameType}"/>
          <Property label="Rows" value="${a.anchorRows}"/>
          <Property label="LengthM" value="${a.totalLengthM}"/>
          <Property label="DesignTensionKN" value="${a.designTensionKN}"/>
          <Property label="AchievedFs" value="${a.achievedFs}"/>
        </Feature>`;
    }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.landxml.org/schema/LandXML-1.2 http://www.landxml.org/schema/LandXML-1.2/LandXML-1.2.xsd"
         date="${timestamp.split('T')[0]}"
         time="${timestamp.split('T')[1].split('.')[0]}"
         version="1.2"
         language="Japanese">
  <Project name="Nova3D-Slope-Reinforcement-v5.3"/>
  <Application name="Nova3D Civil Platform" version="5.3.0" manufacturer="Nova3D Engineering Labs"/>
  <Surfaces>
    <Surface name="ReinforcedCutSlope_TIN" desc="豪雨対策 斜面安定工 TINサーフェス">
      <Definition surfType="TIN">
        <Pnts>
          ${pnts.join('\n          ')}
        </Pnts>
        <Faces>
          ${faces.join('\n          ')}
        </Faces>
      </Definition>
      <Feature code="ReinforcementSchedule">
${anchorProps}
      </Feature>
    </Surface>
  </Surfaces>
</LandXML>`;
}
