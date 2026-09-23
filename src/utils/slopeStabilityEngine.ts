/**
 * Nova3D Civil Platform v5.3 - Slope Stability Engine
 * 国交省『道路土工 切土工・斜面安定工指針』準拠
 * 修正フェレニウス法 (Modified Fellenius Method) & 降雨浸透・間隙水圧解析エンジン
 */

export interface SoilLayerProperties {
  id: string;
  name: string;
  cohesion: number;          // 粘着力 c (kN/m2)
  frictionAngle: number;     // 内部摩擦角 φ (deg)
  unitWeight: number;        // 自然単位体積重量 γ (kN/m3)
  saturatedWeight: number;   // 飽和単位体積重量 γsat (kN/m3)
  permeability: number;      // 透水係数 k (m/s)
}

export interface SlopeSlice {
  index: number;
  width: number;             // スライス幅 b (m)
  height: number;            // スライス平均高さ h (m)
  baseAngle: number;         // すべり面底面傾斜角 α (rad)
  weight: number;            // スライス土塊重量 W (kN/m)
  poreWaterPressure: number; // 間隙水圧 u (kN/m2)
  arcLength: number;         // 底面円弧長 l = b / cos(α) (m)
  effectiveNormalForce: number; // 有効垂直力 N' (kN/m)
}

export interface SlopeStationData {
  station: string;           // 測点名 (例: STA. 0+450)
  stationMeter: number;      // 測点累加距離 (m)
  cutHeight: number;         // 切土高 H (m)
  slopeGradient: number;     // 法面勾配 1:n (例: 0.8 => 1:0.8)
  slopeLength: number;       // 法面長 (m)
  soilType: SoilLayerProperties;
  normalFs: number;          // 常時安全率
  rainFs: number;            // 降雨時安全率
  criticalFailureRadius: number; // 臨界すべり円半径 R (m)
  poreWaterPressureKPa: number;  // 代表間隙水圧 (kPa)
  seepageDepthM: number;     // 浸透湿潤前線深さ (m)
  isCritical: boolean;       // 危険判定 (Fs < 1.0)
  isWarning: boolean;        // 警戒判定 (1.0 <= Fs < 1.20)
  status: 'safe' | 'warning' | 'critical';
  reinforcementApplied: boolean;
  reinforcedFs?: number;     // 補強後安全率
}

export interface RainSimulationParams {
  intensityMmPerHour: number; // 降雨強度 (mm/h)
  durationHours: number;      // 継続時間 (h)
  antecedentRainfallMm: number; // 先行降雨量 (mm)
  groundwaterTableRise: number; // 地下水位上昇量 (m)
}

// 代表的な土質パラメータのプリセット（国交省道路土工指針準拠）
export const DEFAULT_SOIL_PRESETS: Record<string, SoilLayerProperties> = {
  weathered_granite: {
    id: 'weathered_granite',
    name: '風化花崗岩（マサ土）',
    cohesion: 15.0,
    frictionAngle: 32.0,
    unitWeight: 18.5,
    saturatedWeight: 20.0,
    permeability: 1.2e-5,
  },
  tertiary_mudstone: {
    id: 'tertiary_mudstone',
    name: '新第三紀 泥岩（破砕帯）',
    cohesion: 22.0,
    frictionAngle: 24.0,
    unitWeight: 19.5,
    saturatedWeight: 20.8,
    permeability: 5.0e-7,
  },
  volcanic_ash: {
    id: 'volcanic_ash',
    name: '火山灰質粘性土（関東ローム）',
    cohesion: 18.0,
    frictionAngle: 20.0,
    unitWeight: 14.5,
    saturatedWeight: 16.0,
    permeability: 8.5e-6,
  },
  colluvial_soil: {
    id: 'colluvial_soil',
    name: '崖錐堆積土（崩積土）',
    cohesion: 8.0,
    frictionAngle: 28.0,
    unitWeight: 17.8,
    saturatedWeight: 19.2,
    permeability: 3.5e-4,
  }
};

/**
 * 降雨浸透による湿潤前線深さ Zf および間隙水圧 u の簡易物理算定 (Green-Ampt近似)
 */
export function calculateSeepageAndPorePressure(
  soil: SoilLayerProperties,
  rain: RainSimulationParams
): { seepageDepthM: number; porePressureKPa: number } {
  const totalRainMm = rain.intensityMmPerHour * rain.durationHours + rain.antecedentRainfallMm;
  const effectiveRainM = (totalRainMm / 1000) * 0.75; // 表面流出を差し引いた有効浸透量

  // 湿潤前線深さ Z_f ≒ 有効浸透量 / 有効間隙率(約0.20〜0.35)
  const effectivePorosity = 0.28;
  const theoreticalZf = effectiveRainM / effectivePorosity;
  const seepageDepthM = Math.min(theoreticalZf, 8.5); // 最大深度クリップ

  // 間隙水圧 u: 浸透先端での過剰間隙水圧と地下水位上昇の合算 (単位: kPa)
  const unitWaterWeight = 9.81; // kN/m3
  const rainIntensityFactor = Math.min(rain.intensityMmPerHour / 80, 2.0);
  const porePressureKPa = (seepageDepthM * 0.45 * unitWaterWeight * rainIntensityFactor) +
                          (rain.groundwaterTableRise * unitWaterWeight * 0.85);

  return {
    seepageDepthM: Number(seepageDepthM.toFixed(2)),
    porePressureKPa: Number(porePressureKPa.toFixed(1))
  };
}

/**
 * 修正フェレニウス法 (Fellenius / Ordinary Method of Slices) による斜面安全率 Fs の計算
 *
 * F_s = \frac{\sum [ c' \cdot l + (W \cos \alpha - u \cdot l) \tan \phi' ]}{\sum [ W \sin \alpha ]}
 */
export function calculateFelleniusSafetyFactor(
  cutHeight: number,
  slopeGradient: number, // 1:n
  soil: SoilLayerProperties,
  porePressureKPa: number = 0,
  additionalAnchorTensionKN: number = 0 // アンカーによる抑止力 (kN/m)
): { fs: number; slices: SlopeSlice[]; resistingMoment: number; drivingMoment: number } {
  const numSlices = 16;
  const slopeAngleRad = Math.atan(1 / slopeGradient);
  const slopeHorizontalLength = cutHeight * slopeGradient;

  // すべり円弧幾何の設定
  const R = cutHeight * 1.35; // 円弧半径
  const totalBaseLength = slopeHorizontalLength * 1.4;
  const sliceWidth = totalBaseLength / numSlices;

  const phiRad = (soil.frictionAngle * Math.PI) / 180;
  const c = soil.cohesion;

  const slices: SlopeSlice[] = [];
  let sumResisting = 0;
  let sumDriving = 0;

  for (let i = 0; i < numSlices; i++) {
    const xCenter = (i + 0.5) * sliceWidth;
    // 仮想中心からの傾斜角 α (rad)
    const normalizedPos = (xCenter - totalBaseLength / 2) / (totalBaseLength / 2);
    const alphaRad = normalizedPos * (slopeAngleRad * 0.95);

    // 土塊高さ h (m)
    const h = Math.max(0.8, Math.sin(Math.PI * (i + 0.5) / numSlices) * cutHeight * 0.7);

    // 単位体積重量の決定（間隙水圧がある場合は飽和重量に近い値）
    const gamma = porePressureKPa > 5 ? soil.saturatedWeight : soil.unitWeight;
    const W = gamma * sliceWidth * h; // kN/m

    const arcLength = sliceWidth / Math.max(Math.cos(alphaRad), 0.15);
    const u = Math.min(porePressureKPa * (h / cutHeight), 65); // スライス深さに応じた間隙水圧

    // 有効垂直力 N' = W * cos(alpha) - u * l
    const N_prime = Math.max(0, W * Math.cos(alphaRad) - u * arcLength);

    // 抵抗力 R_i = c * l + N' * tan(phi)
    const sliceResisting = c * arcLength + N_prime * Math.tan(phiRad);

    // すべり力 S_i = W * sin(alpha)
    const sliceDriving = W * Math.sin(alphaRad);

    slices.push({
      index: i,
      width: sliceWidth,
      height: h,
      baseAngle: alphaRad,
      weight: W,
      poreWaterPressure: u,
      arcLength: arcLength,
      effectiveNormalForce: N_prime,
    });

    sumResisting += sliceResisting;
    sumDriving += sliceDriving;
  }

  // アンカー抑止力（すべり面での抵抗力加算）
  if (additionalAnchorTensionKN > 0) {
    sumResisting += additionalAnchorTensionKN;
  }

  // 安全率 Fs (駆動力が微小な場合のゼロ除算防止)
  const safeDriving = Math.max(sumDriving, 1.0);
  const fs = sumResisting / safeDriving;

  return {
    fs: Number(fs.toFixed(3)),
    slices,
    resistingMoment: sumResisting * R,
    drivingMoment: safeDriving * R,
  };
}

/**
 * 測点リスト全体の豪雨時安定計算を一括実行
 */
export function evaluateAllSlopeStations(
  stations: SlopeStationData[],
  rain: RainSimulationParams
): SlopeStationData[] {
  return stations.map((st) => {
    // 降雨による間隙水圧と浸透深さを計算
    const { seepageDepthM, porePressureKPa } = calculateSeepageAndPorePressure(st.soilType, rain);

    // 常時安全率 (u = 0)
    const normalResult = calculateFelleniusSafetyFactor(st.cutHeight, st.slopeGradient, st.soilType, 0);

    // 降雨時安全率 (u > 0)
    const rainResult = calculateFelleniusSafetyFactor(st.cutHeight, st.slopeGradient, st.soilType, porePressureKPa);

    const rainFs = rainResult.fs;
    const isCritical = rainFs < 1.00;
    const isWarning = rainFs >= 1.00 && rainFs < 1.20;

    const status: 'safe' | 'warning' | 'critical' = isCritical
      ? 'critical'
      : isWarning
      ? 'warning'
      : 'safe';

    return {
      ...st,
      normalFs: normalResult.fs,
      rainFs: rainFs,
      criticalFailureRadius: Number((st.cutHeight * 1.35).toFixed(1)),
      poreWaterPressureKPa: porePressureKPa,
      seepageDepthM,
      isCritical,
      isWarning,
      status,
    };
  });
}
