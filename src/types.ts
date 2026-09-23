export type DesignPlanId = 'A' | 'B' | 'C';

export type CivilStudio = 'design' | 'construction' | 'simulation' | 'twin' | 'geolibre-terrain' | 'slope-stability';

export type DesignSubModule = 'Road' | 'Bridge' | 'Tunnel';
export type ConstructionSubModule = 'Earthwork' | 'Hydro';
export type SimulationSubModule = 'Walkthrough' | 'Interference' | 'AI Proposals';
export type TerrainSubModule = 'GSI-DEM' | 'Contour' | 'Slope' | 'Alignment';

export type CivilDomain = DesignSubModule | ConstructionSubModule | SimulationSubModule | TerrainSubModule;

/**
 * GeoLibre / GSI 標高サンプリングポイント
 */
export interface TerrainSamplePoint {
  station: number; // 測点 (m) 例: 1420 = Sta.14+20.00
  stationLabel: string; // "Sta. 14+20.00"
  x: number; // 平面直角座標系第IX系 X (Northing, m)
  y: number; // 平面直角座標系第IX系 Y (Easting, m)
  lat: number; // 緯度 (WGS84/JGD2011 deg)
  lon: number; // 経度 (WGS84/JGD2011 deg)
  groundElevation: number; // 地盤高 GL (m)
  designElevation: number; // 計画高 FH (m)
  cutFillDepth: number; // 切土(+) / 盛土(-) 深さ (m)
  slopeDeg: number; // 現況地形傾斜角 (度)
  geologyType: 'DII' | 'DIII' | 'Alluvium' | 'Rock';
}

export type GsiLayerType = 'std' | 'ortho' | 'relief' | 'elevation-color' | 'slope';

export interface CivilProject {
  id: string;
  name: string;
  routeCode: string;
  description: string;
  roadClass: string; // e.g. '第3種第1級', '第1種第3級'
  designSpeed: number; // km/h (e.g. 60, 80)
  totalLengthKm: number; // km (e.g. 24.5)
  crs: string; // e.g. 'JGD2011 / Zone IX'
  meshResolution: string; // e.g. 'GSI 5m DEM + PLATEAU LOD2'
  updatedAt: string;
  createdAt: string;
  earthworkSummary: {
    cutM3: number;
    fillM3: number;
    balanceM3: number;
  };
  structuralFeatures: {
    bridgeCount: number;
    tunnelCount: number;
    majorBridgeName: string;
    majorTunnelName: string;
  };
  activeStation: number;
  selectedPlanId: DesignPlanId;
  estimatedCostBillionYen: number;
  tags: string[];
}


export interface DesignPlan {
  id: DesignPlanId;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  score: number;
  costBillionYen: number;
  cutVolume: number; // m³
  fillVolume: number; // m³
  balanceVolume: number; // m³
  landAcquisitionHouses: number;
  landAcquisitionCostMillionYen: number;
  workDurationDays: number;
  durationDeltaDays: number;
  isAdopted: boolean;
  co2EmissionsTon: number;
  curveRadius: number; // m
  gradientPercent: number; // %
  riverFreeboardM: number; // m
  riverObstructionRatePercent: number; // %
  sBuildingClearanceM: number; // m
  tunnelFs: number;
  averageTransportDistanceM: number;
}

export interface SpatialConstraint {
  id: string;
  category: string;
  name: string;
  statusBadge: string;
  statusColor: 'green' | 'amber' | 'blue' | 'gray';
  checked: boolean;
  metrics: { label: string; value: string; pass?: boolean; highlight?: boolean }[];
}

export interface AuditCheck {
  id: string;
  law: string;
  clause: string;
  condition: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  senderName: string;
  time: string;
  content: string;
}

export interface SkillExecutionLog {
  id: string;
  timestamp: string;
  skillName: string;
  params: Record<string, unknown>;
  status: 'SUCCESS' | 'FAILED';
  testResults: {
    testName: string;
    passed: boolean;
    message: string;
  }[];
}

export interface InvariantTestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

// -------------------------------------------------------------
// ROAD MODULE TYPES (道路幾何設計・道路構造令・標準横断)
// -------------------------------------------------------------
export interface VerticalPointOfIntersection {
  id: string; // 'VPI-01', 'VPI-02', 'VPI-03'
  stationM: number; // e.g. 1235 (1,235m = STA. 12+350)
  stationStr: string; // 'STA. 12+350'
  elevationM: number; // e.g. 85.2m
  curveLengthM: number; // 縦断曲線長 L (m), e.g. 120m
  radiusVerticalM: number; // 縦断曲線半径 Rv (m), e.g. 3000m
  gradeInPercent: number; // 手前勾配 i1 (%), e.g. +2.34%
  gradeOutPercent: number; // 後方勾配 i2 (%), e.g. -1.50%
  status: 'PASS' | 'WARN';
  isDraggable?: boolean;
}

export type ViewportLayoutMode = 'split' | '2d' | '3d' | 'quad';

export interface StationSeekInfo {
  stationM: number; // 0 to 2440m
  stationStr: string; // e.g. 'STA. 12+350'
  pileNumber: string; // e.g. 'No. 61 + 15.0m'
  designElevationM: number;
  groundElevationM: number;
  cutOrFillHeightM: number;
  cutAreaM2: number;
  fillAreaM2: number;
  superelevationPercent: number;
}

export interface IntersectionPoint {
  id: string; // 'IP-01', 'IP-02', 'IP-03', 'IP-04' etc.
  station: string; // 'STA. 12+350'
  theta: string; // "48°30' L"
  radius: number; // m, e.g. 280.0
  clothoidA: string; // "110/110"
  clothoidL: number; // m, e.g. 43.2
  superelevation: number; // %, e.g. 5.0
  widening: number; // m, e.g. 0.50
  curveLength: number; // m, e.g. 237.0
  status: 'PASS' | 'WARN';
  note?: string;
  isDraggable?: boolean;
  // 2D CAD 高度化幾何プロパティ
  x?: number; // SVG / 座標X
  y?: number; // SVG / 座標Y
  iaDeg?: number; // 交角 (Intersection Angle degrees)
  aParam?: number; // クロソイドパラメータ A (m)
  tangentLength?: number; // 接線長 TL (m)
  externalSecant?: number; // 外距 SL (m)
}

export type CadToolMode = 'select' | 'add_ip' | 'delete_ip';

export interface CadSnapSettings {
  cadastral5m: boolean;
  demSaddle: boolean;
  stationMarks: boolean;
  slopeHatch: boolean;
  corridorRibbon: boolean;
}

export interface CrossSectionAssembly {
  laneCount: number;
  laneWidth: number; // e.g. 3.5m
  totalRoadwayWidth: number; // 7.0m
  leftShoulderWidth: number; // 1.75m
  rightShoulderWidth: number; // 1.75m
  sidewalkWidth: number; // 2.5m
  sidewalkHeightCm: number; // 15cm
  embankmentSlopeRatio: number; // 1.8 (1:1.8)
  cutSlopeRatio: number; // 1.2 (1:1.2)
  crownCrossSlopePercent: number; // 2.0%
  cutAreaM2: number; // e.g. 14.2 m²
  fillAreaM2: number; // e.g. 13.8 m²
  drainageType: string; // 'U型300B'
  pavementThicknessCm: number; // 35cm
}

export interface RoadOrdinanceStandard {
  category: string; // '第3種第1級'
  designSpeedKmh: number; // 60 km/h
  minRadiusM: number; // 150 m
  maxGradePercent: number; // 5.0 %
  stoppingSightDistanceM: number; // 75 m
  maxCompositeSlopePercent: number; // 10.5 %
  minClothoidLM: number; // 50 m
  overheadClearanceM: number; // 4.50 m
}

export interface RoadAuditItem {
  id: string;
  clause: string;
  title: string;
  expression: string;
  standardValue: string;
  actualValue: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  marginPercent?: number;
}

// -------------------------------------------------------------
// BRIDGE MODULE TYPES (橋梁構造設計・力学解析・河川法・示道書)
// -------------------------------------------------------------
export interface BridgeSpan {
  id: string; // 'span-1', 'span-2', etc.
  name: string; // 'A1-P1', 'P1-P2', etc.
  lengthM: number; // e.g. 42.0, 52.0
  isAdjustable?: boolean;
}

export interface BridgePier {
  id: string; // 'P1', 'P2', 'P3', 'P4'
  name: string;
  station: string; // 'STA. 7+120'
  heightM: number; // e.g. 14.5
  columnWidthM: number; // e.g. 2.4
  pileLengthM: number; // e.g. 18.2
  pileCount: number; // e.g. 6
  reactionKN: number; // e.g. 4890
}

export interface BridgeStructureConfig {
  bridgeType: string; // '5径間連続鋼箱桁橋'
  totalLengthM: number; // 240.0m
  effectiveWidthM: number; // 10.50m
  girderHeightM: number; // 2.40m
  girderSteelGrade: string; // 'SM490Y'
  deckType: string; // '鋼・コンクリート合成床版'
  hwlElevationM: number; // 32.40m
  designDischargeM3s: number; // 1850 m³/s
  soilSupportDepthM: number; // GL-18.2m
}

export interface BridgeAuditItem {
  id: string;
  lawOrStandard: string; // '河川法第24条' | '道路橋示方書'
  clause: string;
  title: string;
  standardLimit: string;
  actualValue: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  marginRatio: number; // e.g. 140%
  note?: string;
}

export interface BridgeMechanicsState {
  maxBendingMomentKNm: number;
  maxShearForceKN: number;
  maxDeflectionMm: number;
  deflectionRatioLimit: string; // 'L/800'
  deflectionPass: boolean;
  riverFreeboardM: number; // 桁下余裕高 (m)
  riverObstructionRatePercent: number; // 流下阻害率 (%)
  totalSteelWeightTons: number;
  estimatedCostMillionYen: number;
}

// ==================== TUNNEL DESIGN MODULE TYPES ====================
export type NatmSupportPatternType = 'CI' | 'DI' | 'DII' | 'DIII' | 'SpecialFault';
export type TunnelPortalType = 'bamboo_cut' | 'wall' | 'bellmouth';

export interface NatmSupportPatternDetail {
  id: NatmSupportPatternType;
  name: string; // e.g. 'パターン DI (普通岩)'
  rockClass: string; // e.g. '硬質凝灰岩 / RMR 52'
  shotcreteMm: number; // 150mm
  rockBoltLengthM: number; // 3.0m
  rockBoltCount: number; // 10本/断面
  rockBoltPitchM: number; // 1.2m
  steelSupport: string; // 'H-125'
  invertRequired: boolean;
  color: string;
  lengthM: number;
}

export interface TunnelConfig {
  name: string; // '金峰山第1トンネル'
  route: string; // '熊本環状西道路 (STA.17+500 - STA.19+800)'
  totalLengthM: number; // 2,300m
  excavationMethod: string; // 'NATM (発破/機械併用上半先進工法)'
  designSpeedKmh: number; // 60 km/h
  crossSectionAreaM2: number; // 68.4 m²
  innerClearanceHeightM: number; // 4.50m (建築限界)
  innerClearanceWidthM: number; // 8.50m (車道+路肩+監査歩道)
  minCoverM: number; // 14.2m (坑口部)
  maxCoverM: number; // 142.5m (尾根直下)
  portalType: TunnelPortalType;
  evacuationPassagePitchM: number; // 750m
  currentExcavatedM: number; // 840m (施工進捗)
}

export interface TunnelAuditItem {
  id: string;
  standard: string; // '道路トンネル技術基準' | 'NEXCO設計施工要領'
  clause: string;
  title: string;
  limit: string;
  actual: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  marginRatio: number; // 120%
  note?: string;
}

export interface TunnelVentilationAndSafety {
  tunnelGrade: 'AA' | 'A' | 'B' | 'C' | 'D';
  trafficVolumePerDay: number; // 18,200 台/日
  jetFanCount: number; // 8台
  evacuationShaftCount: number; // 3箇所
  hydrantPitchM: number; // 50m
  smokeExtractionRateM3s: number; // 120 m³/s
}

// -------------------------------------------------------------
// Earthwork Logistics & Geotechnical Twin Types
// -------------------------------------------------------------
export type EarthworkZoneType = 'CUT' | 'FILL' | 'TUNNEL_MUCK';

export interface EarthworkZone {
  id: string;
  name: string;
  staStart: number;
  staEnd: number;
  staLabel: string;
  type: EarthworkZoneType;
  volumeM3: number;
  soilType: string;
  swellFactor: number; // 土量変化率 L (e.g. 1.25)
  compactFactor: number; // 土量変化率 C (e.g. 0.90)
  x: number; // 2Dキャンバス用X座標 (0-1000)
}

export interface Stockyard {
  id: string;
  name: string;
  sta: number;
  staLabel: string;
  capacityM3: number;
  currentStoredM3: number;
  disposalFeePerM3: number; // 残土受入・処分単価 (円/m³)
  x: number;
}

export interface DumpTransportRoute {
  id: string;
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  volumeM3: number;
  distanceKm: number;
  truckTrips: number; // 10tダンプ (積載容量 6.0 m³/台)
  transportCostYen: number;
  co2EmissionKg: number;
  isOptimal: boolean;
}

export interface BoringLayer {
  depthFromM: number;
  depthToM: number;
  soilName: string; // '表土・盛土' | 'シルト質粘土' | '砂質礫' | '凝灰角礫岩(支持層)'
  nValue: number; // 0 - 50+
  color: string;
  description: string;
}

export interface BoringLog {
  id: string;
  name: string;
  staLabel: string;
  staM: number;
  groundElevationM: number;
  bearingStrataDepthM: number; // 支持層 (N≧50) 出現深度 (m)
  waterTableM: number; // 地下水位 GL-m
  layers: BoringLayer[];
}

export interface EarthworkAuditItem {
  id: string;
  standard: string; // '国交省土木工事積算基準' | '建設発生土利用技術指針' | '労働安全衛生規則'
  clause: string;
  title: string;
  limit: string;
  actual: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  note?: string;
}

// -------------------------------------------------------------
// Hydro-Meteorological Twin & Environmental CIM Types
// -------------------------------------------------------------
export type RainfallScenarioId = 'normal' | 'baiu' | 'typhoon' | 'prob_50yr' | 'historic_max';

export interface RainfallScenario {
  id: RainfallScenarioId;
  name: string;
  rainfallMmH: number; // 降雨強度 mm/h
  probYear: string; // '平常時' | '年超過確率 1/2' | '年超過確率 1/10' | '年超過確率 1/50' | '既往最大'
  riverFlowM3s: number; // 河川流量 m³/s
  waterElevationM: number; // 水位 (EL. m)
  flowVelocityMs: number; // 平均流速 m/s
  description: string;
}

export interface CofferdamStatus {
  pierId: string; // 'P1' | 'P2' | 'P3' | 'P4'
  topElevationM: number; // 鋼矢板天端高 EL. m (e.g. 31.00m)
  waterLevelM: number; // 現在の水位 EL. m
  freeboardM: number; // 天端余裕高 = topElevationM - waterLevelM
  isOvertoppingRisk: boolean;
  status: 'SAFE' | 'ALERT' | 'OVERTOPPING';
}

export interface EnvironmentalShadowPoint {
  buildingId: string;
  buildingName: string;
  floors: number;
  shadowDurationHours: number; // 冬至日影時間 (8:00 - 16:00)
  legalLimitHours: number; // 建築基準法第56条の2 制限 (e.g. 4.0時間)
  isCompliant: boolean;
  noiseLevelDb: number; // 昼間等価騒音レベル LAeq,d
  noiseLimitDb: number; // 環境基本法基準 (60dB)
}

export interface HydroAuditItem {
  id: string;
  standard: string;
  clause: string;
  title: string;
  limit: string;
  actual: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  note?: string;
}

// -------------------------------------------------------------
// Driver Sightline & VR Walkthrough Types
// -------------------------------------------------------------
export type VehicleType = 'passenger' | 'truck' | 'bus';
export type WeatherCondition = 'clear' | 'heavy_rain' | 'night';

export interface DriverSightlineState {
  currentStationM: number;
  speedKmh: number;
  targetSpeedKmh: number;
  isCruiseActive: boolean;
  vehicleType: VehicleType;
  eyeHeightM: number;
  weather: WeatherCondition;
  isBraking: boolean;
  isAccelerating: boolean;
  steeringAngleDeg: number;
  roadBankDeg: number;
  gradePercent: number;
  curveRadiusM: number;
  stoppingSightDistanceRequiredM: number;
  stoppingSightDistanceActualM: number;
  isSightlineClear: boolean;
  obstacleDistanceM: number;
  tunnelAdaptationScore: number;
  isInsideTunnel: boolean;
  isOnBridge: boolean;
  approachingSignText: string;
  signDistanceM: number;
}

export interface SightlineAuditItem {
  id: string;
  standard: string;
  clause: string;
  title: string;
  limit: string;
  actual: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  note?: string;
}
