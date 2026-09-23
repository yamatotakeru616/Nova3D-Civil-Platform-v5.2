/**
 * Nova3D Civil Platform v5.3 - Ground Anchor & Slope Reinforcement AI Optimizer
 * 国交省『道路土工 切土工・斜面安定工指針』『グラウンドアンカー設計・施工基準』準拠
 */

import { SlopeStationData, calculateFelleniusSafetyFactor } from './slopeStabilityEngine';

export interface GroundAnchorDesign {
  station: string;
  stationMeter: number;
  frameType: 'F300' | 'F400' | 'F500'; // 吹付法枠規格 (枠スパン: 1.5m〜2.5m)
  anchorRows: number;                 // 段数 (1〜4段)
  spacingM: number;                   // ピッチ (m)
  anchorAngleDeg: number;             // 打設角度 (下向き deg, 通常15°〜25°)
  freeLengthM: number;                // 自由長 (m)
  bondedLengthM: number;              // 定着長 (m)
  totalLengthM: number;               // 総長 (m)
  designTensionKN: number;            // 1本当たり設計引張力 Td (kN)
  requiredRestoringForceKNPerM: number;// 単位幅当たり必要抑止力 Pr (kN/m)
  initialFs: number;                  // 補強前降雨安全率
  targetFs: number;                   // 目標計画安全率 (1.20)
  achievedFs: number;                 // 補強後達成安全率 (>= 1.20)
  estimatedCostYen: number;           // 概算施工費 (円)
  strandSpec: string;                 // 鋼より線仕様 (例: 12S12.7, 19S15.2)
  isFeasible: boolean;
}

// 吹付枠・アンカー積算単価（国交省土木工事標準積算基準 参考）
const UNIT_COSTS = {
  F300: 16500, // 円/m2 (吹付枠工 F300)
  F400: 22000, // 円/m2 (吹付枠工 F400)
  F500: 29500, // 円/m2 (吹付枠工 F500)
  anchorPerMeter: 38000, // 円/m (削孔・テンドン・グラウト注入・頭部定着具)
  framePrepPerM2: 4500,  // 円/m2 (法面清掃・ワイヤーメッシュ張)
};

/**
 * 危険法面に対するAIグラウンドアンカーおよび吹付枠工の最適自動配置
 */
export function optimizeGroundAnchorSystem(
  station: SlopeStationData,
  targetFs: number = 1.20
): GroundAnchorDesign {
  const currentFs = Math.max(0.5, station.rainFs);
  const cutH = station.cutHeight;
  const slopeGrad = station.slopeGradient; // 1:n
  const slopeLength = Math.sqrt(cutH * cutH + Math.pow(cutH * slopeGrad, 2));

  // 1. 必要抑止力 Pr (kN/m) の逆算
  // 目標安全率 targetFs を達成するために必要な単位幅当たりの抵抗力増分
  const baseResult = calculateFelleniusSafetyFactor(cutH, slopeGrad, station.soilType, station.poreWaterPressureKPa);
  const drivingMoment = baseResult.drivingMoment;
  const resistingMoment = baseResult.resistingMoment;
  const R = cutH * 1.35;

  // targetFs = (resistingMoment + Pr * R) / drivingMoment
  // Pr = (targetFs * drivingMoment - resistingMoment) / R
  const deficitResistance = Math.max(0, targetFs * (drivingMoment / R) - (resistingMoment / R));
  const requiredPr = Math.max(25, deficitResistance * 1.05); // 安全率余裕 5%

  // 2. 枠工タイプの決定（法面高と必要抑止力に基づく選定）
  let frameType: 'F300' | 'F400' | 'F500' = 'F400';
  let frameSpacing = 2.0; // m
  if (cutH <= 10 && requiredPr < 120) {
    frameType = 'F300';
    frameSpacing = 1.5;
  } else if (cutH > 18 || requiredPr >= 280) {
    frameType = 'F500';
    frameSpacing = 2.5;
  }

  // 3. アンカー段数 (rows) の最適化
  let anchorRows = 2;
  if (cutH <= 8) anchorRows = 1;
  else if (cutH > 8 && cutH <= 14) anchorRows = 2;
  else if (cutH > 14 && cutH <= 20) anchorRows = 3;
  else anchorRows = 4;

  // 4. アンカー諸元の算定
  const anchorAngleDeg = 20.0; // 打設角度 20度（標準）
  const totalAnchorsPerM = anchorRows / frameSpacing; // 単位幅あたりのアンカー本数

  // 1本当たり設計引張力 Td (kN)
  // Pr = sum(Td * cos(theta + alpha) ...) => 概算 Td = Pr / (totalAnchorsPerM * cos(15°))
  const cosEff = Math.cos((15 * Math.PI) / 180);
  const designTensionKN = Math.min(650, Math.max(120, Math.round(requiredPr / (totalAnchorsPerM * cosEff))));

  // 5. テンドン仕様の選定
  let strandSpec = '7S12.7 (破断耐力 1,280kN)';
  if (designTensionKN > 400) {
    strandSpec = '19S15.2 (破断耐力 3,500kN)';
  } else if (designTensionKN > 250) {
    strandSpec = '12S12.7 (破断耐力 2,200kN)';
  }

  // 6. 自由長・定着長・総長の算定
  // 仮想すべり面深度を超える自由長Lf + 地盤定着長La
  const estimatedSlipDepthM = Math.max(4.0, cutH * 0.45);
  const freeLengthM = Number((estimatedSlipDepthM + 2.5).toFixed(1));
  const bondedLengthM = Number((Math.max(4.5, designTensionKN / 55)).toFixed(1)); // 定着地盤摩擦考慮
  const totalLengthM = Number((freeLengthM + bondedLengthM).toFixed(1));

  // 7. 補強後の達成安全率の検証
  const addedEffectiveTensionKNPerM = designTensionKN * totalAnchorsPerM * cosEff;
  const verifiedResult = calculateFelleniusSafetyFactor(
    cutH,
    slopeGrad,
    station.soilType,
    station.poreWaterPressureKPa,
    addedEffectiveTensionKNPerM
  );
  const achievedFs = verifiedResult.fs;

  // 8. 概算施工費の計算（法面単位ブロック: 幅20m延長想定）
  const blockWidthM = 20.0;
  const slopeAreaM2 = slopeLength * blockWidthM;
  const totalAnchorCount = Math.round(blockWidthM / frameSpacing) * anchorRows;

  const frameCost = slopeAreaM2 * UNIT_COSTS[frameType];
  const prepCost = slopeAreaM2 * UNIT_COSTS.framePrepPerM2;
  const anchorCost = totalAnchorCount * totalLengthM * UNIT_COSTS.anchorPerMeter;
  const estimatedCostYen = Math.round(frameCost + prepCost + anchorCost);

  return {
    station: station.station,
    stationMeter: station.stationMeter,
    frameType,
    anchorRows,
    spacingM: frameSpacing,
    anchorAngleDeg,
    freeLengthM,
    bondedLengthM,
    totalLengthM,
    designTensionKN,
    requiredRestoringForceKNPerM: Number(requiredPr.toFixed(1)),
    initialFs: station.rainFs,
    targetFs,
    achievedFs,
    estimatedCostYen,
    strandSpec,
    isFeasible: achievedFs >= targetFs,
  };
}
