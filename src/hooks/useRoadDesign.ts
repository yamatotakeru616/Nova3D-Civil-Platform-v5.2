import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  IntersectionPoint,
  CrossSectionAssembly,
  RoadOrdinanceStandard,
  RoadAuditItem,
  CadToolMode,
  CadSnapSettings,
  VerticalPointOfIntersection,
  ViewportLayoutMode,
  StationSeekInfo,
  CivilProject,
} from '../types';

export const INITIAL_STANDARD: RoadOrdinanceStandard = {
  category: '第3種第1級',
  designSpeedKmh: 60,
  minRadiusM: 150,
  maxGradePercent: 5.0,
  stoppingSightDistanceM: 75,
  maxCompositeSlopePercent: 10.5,
  minClothoidLM: 50,
  overheadClearanceM: 4.50,
};

export const INITIAL_VPIS: VerticalPointOfIntersection[] = [
  {
    id: 'VPI-01',
    stationM: 400,
    stationStr: 'STA. 4+000',
    elevationM: 62.0,
    curveLengthM: 100,
    radiusVerticalM: 4000,
    gradeInPercent: 1.20,
    gradeOutPercent: 2.34,
    status: 'PASS',
    isDraggable: false,
  },
  {
    id: 'VPI-02',
    stationM: 1235,
    stationStr: 'STA. 12+350',
    elevationM: 85.2,
    curveLengthM: 120,
    radiusVerticalM: 3000,
    gradeInPercent: 2.34,
    gradeOutPercent: -1.50,
    status: 'PASS',
    isDraggable: true,
  },
  {
    id: 'VPI-03',
    stationM: 1950,
    stationStr: 'STA. 19+500',
    elevationM: 68.0,
    curveLengthM: 100,
    radiusVerticalM: 3500,
    gradeInPercent: -1.50,
    gradeOutPercent: 0.80,
    status: 'PASS',
    isDraggable: false,
  },
];

export const INITIAL_IPS: IntersectionPoint[] = [
  {
    id: 'IP-01',
    station: 'STA. 4+250',
    theta: "32°15' R",
    radius: 350.0,
    clothoidA: '120/120',
    clothoidL: 41.1,
    superelevation: 4.0,
    widening: 0.25,
    curveLength: 197.0,
    status: 'PASS',
    note: '平野部接続',
    x: 180,
    y: 240,
    iaDeg: 32.25,
    aParam: 120,
    tangentLength: 101.2,
    externalSecant: 14.4,
  },
  {
    id: 'IP-02',
    station: 'STA. 12+350',
    theta: "48°30' L",
    radius: 280.0,
    clothoidA: '110/110',
    clothoidL: 43.2,
    superelevation: 5.0,
    widening: 0.50,
    curveLength: 237.0,
    status: 'PASS',
    note: '地方道すりつけ交差連動',
    isDraggable: true,
    x: 380,
    y: 190,
    iaDeg: 48.5,
    aParam: 110,
    tangentLength: 126.1,
    externalSecant: 27.2,
  },
  {
    id: 'IP-03',
    station: 'STA. 18+400',
    theta: "21°00' R",
    radius: 400.0,
    clothoidA: '140/140',
    clothoidL: 49.0,
    superelevation: 3.5,
    widening: 0.0,
    curveLength: 146.6,
    status: 'PASS',
    note: 'トンネル坑口アプローチ',
    x: 480,
    y: 130,
    iaDeg: 21.0,
    aParam: 140,
    tangentLength: 74.1,
    externalSecant: 6.8,
  },
];

export const INITIAL_ASSEMBLY: CrossSectionAssembly = {
  laneCount: 2,
  laneWidth: 3.50,
  totalRoadwayWidth: 7.00,
  leftShoulderWidth: 1.75,
  rightShoulderWidth: 1.75,
  sidewalkWidth: 2.50,
  sidewalkHeightCm: 15,
  embankmentSlopeRatio: 1.8,
  cutSlopeRatio: 1.2,
  crownCrossSlopePercent: 2.0,
  cutAreaM2: 14.2,
  fillAreaM2: 13.8,
  drainageType: 'U型300B',
  pavementThicknessCm: 35,
};

export const INITIAL_SNAP_SETTINGS: CadSnapSettings = {
  cadastral5m: true,
  demSaddle: true,
  stationMarks: true,
  slopeHatch: true,
  corridorRibbon: true,
};

// 3点から幾何交角(IA)を度数および度分文字列で算出する幾何計算関数
function calculateIntersectionAngle(
  prev: { x: number; y: number },
  curr: { x: number; y: number },
  next: { x: number; y: number }
): { iaDeg: number; thetaStr: string; isRight: boolean } {
  const v1x = curr.x - prev.x;
  const v1y = curr.y - prev.y;
  const v2x = next.x - curr.x;
  const v2y = next.y - curr.y;

  const len1 = Math.hypot(v1x, v1y) || 1;
  const len2 = Math.hypot(v2x, v2y) || 1;

  const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
  const clampedDot = Math.max(-1, Math.min(1, dot));
  const iaRad = Math.acos(clampedDot);
  const iaDeg = (iaRad * 180) / Math.PI;

  const cross = v1x * v2y - v1y * v2x;
  const isRight = cross > 0;

  const deg = Math.floor(iaDeg);
  const min = Math.round((iaDeg - deg) * 60);
  const thetaStr = `${deg}°${min.toString().padStart(2, '0')}' ${isRight ? 'R' : 'L'}`;

  return { iaDeg: Number(iaDeg.toFixed(2)), thetaStr, isRight };
}

export function useRoadDesign(project?: CivilProject) {
  // 動的IPリストステート (LocalStorage永続化 & GeoLibre連携)
  const [ips, setIps] = useState<IntersectionPoint[]>(() => {
    try {
      const storageKey = project?.id ? `road_custom_ips_${project.id}` : 'road_custom_ips_default';
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('road_custom_ips_latest');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved road IPs:', e);
    }
    return INITIAL_IPS;
  });
  const [activeIpId, setActiveIpId] = useState<string>('IP-02');
  const [cadTool, setCadTool] = useState<CadToolMode>('select');
  const [snapSettings, setSnapSettings] = useState<CadSnapSettings>(INITIAL_SNAP_SETTINGS);

  // 縦断変勾配点 (VPI) リストステート
  const [vpis, setVpis] = useState<VerticalPointOfIntersection[]>(INITIAL_VPIS);
  const [activeVpiId, setActiveVpiId] = useState<string>('VPI-02');

  // 測点双方向シーク ＆ 自動ドライブ走行ステート
  const [currentStationM, setCurrentStationM] = useState<number>(1235); // 0〜2440m
  const [isPlayingDrive, setIsPlayingDrive] = useState<boolean>(false);

  // ビューポートレイアウトモード (split / 2d / 3d / quad)
  const [viewMode, setViewMode] = useState<ViewportLayoutMode>('split');

  // IP-02 ドラッグオフセット (m) - 互換性維持
  const [ip2Offset, setIp2Offset] = useState<{ dx: number; dy: number }>({ dx: 2.40, dy: -1.15 });
  const [standard, setStandard] = useState<RoadOrdinanceStandard>(INITIAL_STANDARD);
  const [assembly, setAssembly] = useState<CrossSectionAssembly>(INITIAL_ASSEMBLY);
  const [isCommitted, setIsCommitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'section' | 'masshaul'>('profile');
  const [landXmlModalOpen, setLandXmlModalOpen] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3200);
  }, []);

  // IP変更時のLocalStorage自動保存
  useEffect(() => {
    try {
      const storageKey = project?.id ? `road_custom_ips_${project.id}` : 'road_custom_ips_default';
      localStorage.setItem(storageKey, JSON.stringify(ips));
      localStorage.setItem('road_custom_ips_latest', JSON.stringify(ips));
    } catch (e) {
      console.error('Failed to auto-save road IPs:', e);
    }
  }, [ips, project?.id]);

  // プロジェクト切り替え時のIPロード
  useEffect(() => {
    if (!project?.id) return;
    try {
      const storageKey = `road_custom_ips_${project.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIps(parsed);
          setActiveIpId(parsed[0]?.id || 'IP-01');
        }
      }
    } catch (e) {
      console.error('Failed to restore road IPs on project change:', e);
    }
  }, [project?.id]);

  // GeoLibreなど外部からの線形反映イベントをリッスン
  useEffect(() => {
    const handleAlignmentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ ips: IntersectionPoint[]; planId?: string }>;
      if (customEvent.detail?.ips && Array.isArray(customEvent.detail.ips)) {
        setIps(customEvent.detail.ips);
        if (customEvent.detail.ips.length > 0) {
          setActiveIpId(customEvent.detail.ips[0].id);
        }
        showToast('✓ GeoLibre実地形線形パラメータを道路設計スタジオへ同期完了！');
      }
    };

    window.addEventListener('road_alignment_updated', handleAlignmentUpdated);
    return () => {
      window.removeEventListener('road_alignment_updated', handleAlignmentUpdated);
    };
  }, [showToast]);

  // プロジェクト変更検知＆道路構造令規格・幾何パラメータ動的同期
  useEffect(() => {
    if (!project) return;

    if (project.roadClass === '第1種第3級' || project.designSpeed >= 80) {
      setStandard({
        category: '第1種第3級',
        designSpeedKmh: 80,
        minRadiusM: 280,
        maxGradePercent: 4.0,
        stoppingSightDistanceM: 110,
        maxCompositeSlopePercent: 9.0,
        minClothoidLM: 70,
        overheadClearanceM: 4.50,
      });
    } else if (project.roadClass === '第1種第1級' || project.designSpeed >= 100) {
      setStandard({
        category: '第1種第1級',
        designSpeedKmh: 100,
        minRadiusM: 460,
        maxGradePercent: 3.5,
        stoppingSightDistanceM: 160,
        maxCompositeSlopePercent: 8.0,
        minClothoidLM: 100,
        overheadClearanceM: 4.50,
      });
    } else {
      setStandard({
        category: project.roadClass || '第3種第1級',
        designSpeedKmh: project.designSpeed || 60,
        minRadiusM: 150,
        maxGradePercent: 5.0,
        stoppingSightDistanceM: 75,
        maxCompositeSlopePercent: 10.5,
        minClothoidLM: 50,
        overheadClearanceM: 4.50,
      });
    }

    if (project.activeStation !== undefined && project.activeStation > 0) {
      setCurrentStationM(project.activeStation);
    }

    showToast(`プロジェクト「${project.name}」(${project.routeCode}) をロードしました。`);
  }, [project?.id]);

  // 選択中のIPオブジェクト
  const activeIp = useMemo(() => {
    return ips.find((ip) => ip.id === activeIpId) || ips[0];
  }, [ips, activeIpId]);

  // リアルタイム幾何計算 (選択中IPまたはIP-02に直結)
  const dynamicRadius = useMemo(() => {
    return activeIp ? activeIp.radius : 280;
  }, [activeIp]);

  const dynamicClothoidL = useMemo(() => {
    return activeIp ? activeIp.clothoidL : 43.2;
  }, [activeIp]);

  const dynamicLandClearance = useMemo(() => {
    const ip2 = ips.find((ip) => ip.id === 'IP-02');
    if (ip2 && ip2.y !== undefined) {
      // 民有地公図の最近接境界線 (Y: 60〜140, X: 180〜370) に対する最短離隔
      // 境界ポリゴンの南端ライン Y=140 に対するY距離
      const distPx = Math.max(0, ip2.y - 140);
      // SVG 1px ≒ 0.125m (8px = 1m)
      const clearanceM = Number((distPx * 0.125).toFixed(2));
      return Math.max(1.0, clearanceM);
    }
    return Number((5.20 + (ip2Offset.dx - 2.40) * 0.95).toFixed(2));
  }, [ips, ip2Offset.dx]);

  const dynamicEarthworkBalance = useMemo(() => {
    // 全IPの変位による切土・盛土量の動的集計
    let totalCutDelta = 0;
    let totalFillDelta = 0;

    ips.forEach((ip, idx) => {
      const baseX = idx === 0 ? 180 : idx === 1 ? 380 : 450;
      const baseY = idx === 0 ? 240 : idx === 1 ? 190 : 150;
      const curX = ip.x ?? baseX;
      const curY = ip.y ?? baseY;
      const dx = (curX - baseX) * 0.1;
      const dy = (baseY - curY) * 0.1; // 上(北・山側)へ行くと切土増、下(南・谷側)へ行くと盛土増

      totalCutDelta += Math.round(dy * 320 - dx * 60);
      totalFillDelta += Math.round(-dy * 280 + dx * 90);
    });

    // VPI-02 標高連動 (標高が上がると盛土増・切土減、下がると切土増・盛土減)
    const vpi2 = vpis.find((v) => v.id === 'VPI-02');
    const vpi2DeltaElev = vpi2 ? vpi2.elevationM - 85.2 : 0;
    totalFillDelta += Math.round(vpi2DeltaElev * 450);
    totalCutDelta -= Math.round(vpi2DeltaElev * 380);

    const baseCut = 24500;
    const baseFill = 23800;
    const cut = Math.max(12000, baseCut + totalCutDelta);
    const fill = Math.max(11000, baseFill + totalFillDelta);
    const balance = cut - fill;
    return {
      cutVolume: cut,
      fillVolume: fill,
      balanceVolume: balance,
      ratioPercent: Number(((fill / cut) * 100).toFixed(1)),
    };
  }, [ips, vpis]);

  // 動的な断面積計算 (IP移動 ＆ VPI標高に伴う標準横断アセンブリのリアルタイム追従)
  const dynamicAssembly = useMemo(() => {
    const ip2 = ips.find((ip) => ip.id === 'IP-02') || ips[0];
    const dy = ip2.y !== undefined ? (190 - ip2.y) * 0.1 : 0;
    const vpi2 = vpis.find((v) => v.id === 'VPI-02');
    const vpi2DeltaElev = vpi2 ? vpi2.elevationM - 85.2 : 0;

    const calculatedCutArea = Number(Math.max(4.0, Math.min(30.0, 14.2 + dy * 1.6 - vpi2DeltaElev * 1.1)).toFixed(1));
    const calculatedFillArea = Number(Math.max(4.0, Math.min(30.0, 13.8 - dy * 1.4 + vpi2DeltaElev * 1.2)).toFixed(1));

    return {
      ...assembly,
      cutAreaM2: calculatedCutArea,
      fillAreaM2: calculatedFillArea,
    };
  }, [ips, vpis, assembly]);

  // 現在選択測点 (currentStationM) における幾何諸元・断面データのリアルタイム補間
  const stationInfo: StationSeekInfo = useMemo(() => {
    const sta = currentStationM;
    const staKm = Math.floor(sta / 1000);
    const staM = (sta % 1000).toFixed(0).padStart(3, '0');
    const stationStr = `STA. ${staKm}+${staM}`;
    const pileNo = Math.floor(sta / 20);
    const pileRem = (sta % 20).toFixed(1);
    const pileNumber = `No. ${pileNo} + ${pileRem}m`;

    // 計画高 H_design (VPIスプライン/折れ線補間)
    let designH = 50.0;
    const vpi1 = vpis[0] || { stationM: 400, elevationM: 62.0 };
    const vpi2 = vpis[1] || { stationM: 1235, elevationM: 85.2 };
    const vpi3 = vpis[2] || { stationM: 1950, elevationM: 68.0 };

    if (sta <= vpi1.stationM) {
      const ratio = sta / Math.max(1, vpi1.stationM);
      designH = 52.0 + (vpi1.elevationM - 52.0) * ratio;
    } else if (sta <= vpi2.stationM) {
      const ratio = (sta - vpi1.stationM) / Math.max(1, vpi2.stationM - vpi1.stationM);
      designH = vpi1.elevationM + (vpi2.elevationM - vpi1.elevationM) * ratio;
    } else if (sta <= vpi3.stationM) {
      const ratio = (sta - vpi2.stationM) / Math.max(1, vpi3.stationM - vpi2.stationM);
      designH = vpi2.elevationM + (vpi3.elevationM - vpi2.elevationM) * ratio;
    } else {
      const ratio = (sta - vpi3.stationM) / Math.max(1, 2440 - vpi3.stationM);
      designH = vpi3.elevationM + (50.0 - vpi3.elevationM) * ratio;
    }

    // 自然地形地盤高 H_ground (基本DEMうねり ＋ IP平面変位による山側・谷側通過標高の動的合成)
    const baseGroundH = 50.0 + 32.0 * Math.sin((sta / 2440) * Math.PI) + 7.5 * Math.sin((sta / 450) * Math.PI);
    let ipTerrainShift = 0;
    ips.forEach((ip, idx) => {
      const baseY = idx === 0 ? 240 : idx === 1 ? 190 : 130;
      const curY = ip.y ?? baseY;
      const dy = baseY - curY; // 北(上・山側)へいくと正(地盤高上昇)、南(下・谷側)へいくと負(地盤高低下)
      const ipSta = idx === 0 ? 425 : idx === 1 ? 1235 : 1840;
      const radius = idx === 1 ? 550 : 380;
      const dist = Math.abs(sta - ipSta);
      if (dist < radius) {
        const factor = Math.cos((dist / radius) * (Math.PI / 2));
        ipTerrainShift += dy * 0.16 * factor;
      }
    });
    const groundH = Number((baseGroundH + ipTerrainShift).toFixed(2));

    const diffH = Number((designH - groundH).toFixed(2));
    const rawCutArea = diffH < 0 ? Math.abs(diffH) * 5.2 + Math.pow(Math.abs(diffH), 1.5) * 1.1 : 0;
    const rawFillArea = diffH > 0 ? diffH * 4.8 + Math.pow(diffH, 1.5) * 1.3 : 0;

    // 片勾配 (IP-02近傍 STA. 900〜1500 でカントすりつけ)
    let superelev = 2.0;
    if (sta >= 850 && sta <= 1550) {
      const curveRatio = Math.max(0, 1 - Math.abs(sta - 1235) / 350);
      superelev = Number((2.0 + curveRatio * (activeIp.superelevation - 2.0)).toFixed(1));
    }

    return {
      stationM: sta,
      stationStr,
      pileNumber,
      designElevationM: Number(designH.toFixed(2)),
      groundElevationM: groundH,
      cutOrFillHeightM: diffH,
      cutAreaM2: Number((rawCutArea > 0.5 ? rawCutArea : dynamicAssembly.cutAreaM2 * (0.8 + 0.2 * Math.sin(sta / 300))).toFixed(1)),
      fillAreaM2: Number((rawFillArea > 0.5 ? rawFillArea : dynamicAssembly.fillAreaM2 * (0.8 + 0.2 * Math.cos(sta / 300))).toFixed(1)),
      superelevationPercent: superelev,
    };
  }, [currentStationM, vpis, ips, activeIp.superelevation, dynamicAssembly]);

  // 縦断プロファイル SVG 動的パスジェネレーター (IP変位・VPI標高完全連動)
  const dynamicProfilePaths = useMemo(() => {
    // 測点 0〜2440m をサンプリング (32分割)
    const samplesCount = 32;
    const groundPoints: { x: number; y: number; sta: number; gh: number }[] = [];
    const designPoints: { x: number; y: number; sta: number; fh: number }[] = [];

    const vpi1 = vpis[0] || { stationM: 400, elevationM: 62.0 };
    const vpi2 = vpis[1] || { stationM: 1235, elevationM: 85.2 };
    const vpi3 = vpis[2] || { stationM: 1950, elevationM: 68.0 };

    for (let i = 0; i <= samplesCount; i++) {
      const sta = (i / samplesCount) * 2440;
      const x = (sta / 2440) * 700;

      // 計画高 (FH)
      let fh = 50.0;
      if (sta <= vpi1.stationM) {
        const ratio = sta / Math.max(1, vpi1.stationM);
        fh = 52.0 + (vpi1.elevationM - 52.0) * ratio;
      } else if (sta <= vpi2.stationM) {
        const ratio = (sta - vpi1.stationM) / Math.max(1, vpi2.stationM - vpi1.stationM);
        fh = vpi1.elevationM + (vpi2.elevationM - vpi1.elevationM) * ratio;
      } else if (sta <= vpi3.stationM) {
        const ratio = (sta - vpi2.stationM) / Math.max(1, vpi3.stationM - vpi2.stationM);
        fh = vpi2.elevationM + (vpi3.elevationM - vpi2.elevationM) * ratio;
      } else {
        const ratio = (sta - vpi3.stationM) / Math.max(1, 2440 - vpi3.stationM);
        fh = vpi3.elevationM + (50.0 - vpi3.elevationM) * ratio;
      }

      // 地盤高 (GH)
      const baseGh = 50.0 + 32.0 * Math.sin((sta / 2440) * Math.PI) + 7.5 * Math.sin((sta / 450) * Math.PI);
      let ipShift = 0;
      ips.forEach((ip, idx) => {
        const baseY = idx === 0 ? 240 : idx === 1 ? 190 : 130;
        const curY = ip.y ?? baseY;
        const dy = baseY - curY;
        const ipSta = idx === 0 ? 425 : idx === 1 ? 1235 : 1840;
        const radius = idx === 1 ? 550 : 380;
        const dist = Math.abs(sta - ipSta);
        if (dist < radius) {
          const factor = Math.cos((dist / radius) * (Math.PI / 2));
          ipShift += dy * 0.16 * factor;
        }
      });
      const gh = baseGh + ipShift;

      // SVG Y座標へのマッピング (標高 35m〜105m -> Y 120〜15)
      const yFromEl = (el: number, maxH = 120) => {
        return Math.round(maxH - (el - 35) * 1.35);
      };

      groundPoints.push({ x: Math.round(x), y: yFromEl(gh), sta, gh });
      designPoints.push({ x: Math.round(x), y: yFromEl(fh), sta, fh });
    }

    // 地盤線 SVG Path
    const groundPath = groundPoints.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
    }, '');

    // 計画線 SVG Path
    const designPath = designPoints.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
    }, '');

    // 切土(Cut: 地盤高 > 計画高) ポリゴン群 & 盛土(Fill: 地盤高 < 計画高) ポリゴン群
    const cutSegments: string[] = [];
    const fillSegments: string[] = [];

    for (let i = 0; i < samplesCount; i++) {
      const g1 = groundPoints[i];
      const g2 = groundPoints[i + 1];
      const d1 = designPoints[i];
      const d2 = designPoints[i + 1];

      // g.y が小さいほど標高が高い (画面上側)
      const isCut1 = g1.gh > d1.fh;
      const isCut2 = g2.gh > d2.fh;

      if (isCut1 && isCut2) {
        // 切土台形
        cutSegments.push(`M ${d1.x},${d1.y} L ${g1.x},${g1.y} L ${g2.x},${g2.y} L ${d2.x},${d2.y} Z`);
      } else if (!isCut1 && !isCut2) {
        // 盛土台形
        fillSegments.push(`M ${d1.x},${d1.y} L ${g1.x},${g1.y} L ${g2.x},${g2.y} L ${d2.x},${d2.y} Z`);
      } else {
        // 交差部 (簡易近似)
        const midX = Math.round((g1.x + g2.x) / 2);
        const midY = Math.round((d1.y + d2.y) / 2);
        if (isCut1) {
          cutSegments.push(`M ${d1.x},${d1.y} L ${g1.x},${g1.y} L ${midX},${midY} Z`);
          fillSegments.push(`M ${midX},${midY} L ${g2.x},${g2.y} L ${d2.x},${d2.y} Z`);
        } else {
          fillSegments.push(`M ${d1.x},${d1.y} L ${g1.x},${g1.y} L ${midX},${midY} Z`);
          cutSegments.push(`M ${midX},${midY} L ${g2.x},${g2.y} L ${d2.x},${d2.y} Z`);
        }
      }
    }

    return {
      groundPath,
      designPath,
      cutHatchPath: cutSegments.join(' '),
      fillHatchPath: fillSegments.join(' '),
      groundPoints,
      designPoints,
    };
  }, [ips, vpis]);

  // 自動走行シミュレーションのタイマー駆動
  useEffect(() => {
    if (!isPlayingDrive) return;
    const timer = setInterval(() => {
      setCurrentStationM((prev) => {
        const next = prev + 20; // 20mピッチ前進
        return next > 2440 ? 0 : next;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [isPlayingDrive]);

  // 道路構造令 リアルタイム監査マトリクス (6条項)
  const auditMatrix: RoadAuditItem[] = useMemo(() => {
    // 選択中のIPの諸元を反映
    const currentR = activeIp?.radius ?? 280;
    const rPass = currentR >= standard.minRadiusM;
    const rMargin = Math.round((currentR / standard.minRadiusM) * 100);

    // 第20条: 縦断勾配 (i)
    const vpi2 = vpis.find((v) => v.id === 'VPI-02');
    const gradePercent = vpi2 ? Math.abs(vpi2.gradeInPercent) : 2.34;
    const gradePass = gradePercent <= standard.maxGradePercent;
    const gradeMargin = Math.round((standard.maxGradePercent / Math.max(0.1, gradePercent)) * 100);

    // 第16条: 緩和曲線長 (Clothoid)
    const currentClothoidL = activeIp?.clothoidL ?? 43.2;
    const clothoidPass = currentClothoidL >= 35; // 規格照合
    const clothoidMargin = Math.round((currentClothoidL / 35) * 100);

    // 第21条: 合成勾配 (S) = sqrt(i^2 + ic^2)
    const superElev = activeIp?.superelevation ?? 5.0;
    const compositeGrade = Number(Math.sqrt(gradePercent * gradePercent + superElev * superElev).toFixed(2));
    const compositePass = compositeGrade <= standard.maxCompositeSlopePercent;

    // 第11条: 停止視距 (Sight)
    const sightDistance = currentR >= 250 ? 112 : Math.round(80 + (currentR - 150) * 0.32);
    const sightPass = sightDistance >= standard.stoppingSightDistanceM;

    // 第12条: 建築限界 & 用地離隔クリアランス
    const overheadClearance = 6.20;
    const overheadPass = overheadClearance >= standard.overheadClearanceM && dynamicLandClearance >= 5.0;

    return [
      {
        id: 'clause-15',
        clause: '第15条: 曲線半径 (R)',
        title: '平面曲線幾何限界',
        expression: `設計R=${currentR.toFixed(0)}m ≥ 最小${standard.minRadiusM}m (${rPass ? '適合' : '令違反警告'})`,
        standardValue: `R ≥ ${standard.minRadiusM}m`,
        actualValue: `R = ${currentR.toFixed(0)}m`,
        status: rPass ? 'PASS' : 'WARN',
        marginPercent: rMargin,
      },
      {
        id: 'clause-20',
        clause: '第20条: 縦断勾配 (i)',
        title: '最急勾配制限',
        expression: `実績i=+${gradePercent}% ≤ 最大${standard.maxGradePercent}%`,
        standardValue: `i ≤ ${standard.maxGradePercent}%`,
        actualValue: `i = +${gradePercent}%`,
        status: gradePass ? 'PASS' : 'WARN',
        marginPercent: gradeMargin,
      },
      {
        id: 'clause-16',
        clause: '第16条: 緩和曲線長 (L)',
        title: 'クロソイド幾何遷移',
        expression: `Clothoid A=${activeIp?.aParam || 110} (L=${currentClothoidL.toFixed(1)}m ≥ 35m準拠)`,
        standardValue: 'L ≥ 35m',
        actualValue: `L = ${currentClothoidL.toFixed(1)}m`,
        status: clothoidPass ? 'PASS' : 'WARN',
        marginPercent: clothoidMargin,
      },
      {
        id: 'clause-21',
        clause: '第21条: 合成勾配 (S)',
        title: '片勾配・縦断合成制限',
        expression: `S=√(${gradePercent}²+${superElev}²)=${compositeGrade}% ≤ ${standard.maxCompositeSlopePercent}%`,
        standardValue: `S ≤ ${standard.maxCompositeSlopePercent}%`,
        actualValue: `S = ${compositeGrade}%`,
        status: compositePass ? 'PASS' : 'WARN',
      },
      {
        id: 'clause-11',
        clause: '第11条: 停止視距 (Sight)',
        title: '走行安全視通距離',
        expression: `可視距離 ${sightDistance}m ≥ 基準 ${standard.stoppingSightDistanceM}m`,
        standardValue: `S ≥ ${standard.stoppingSightDistanceM}m`,
        actualValue: `${sightDistance}m`,
        status: sightPass ? 'PASS' : 'WARN',
      },
      {
        id: 'clause-12',
        clause: '第12条: 建築限界 & 用地離隔',
        title: '上空離隔 & 公図境界離隔',
        expression: `公図離隔=${dynamicLandClearance.toFixed(2)}m (基準5.0m), 上空=${overheadClearance.toFixed(2)}m`,
        standardValue: `離隔 ≥ 5.0m / H ≥ ${standard.overheadClearanceM.toFixed(2)}m`,
        actualValue: `${dynamicLandClearance.toFixed(2)}m / ${overheadClearance.toFixed(2)}m`,
        status: overheadPass ? 'PASS' : 'WARN',
      },
    ];
  }, [activeIp, dynamicLandClearance, standard]);

  // -----------------------------------------------------------------
  // SKILL ACTIONS (操作のスキル化)
  // -----------------------------------------------------------------

  // CADツール選択
  const selectCadToolSkill = useCallback((tool: CadToolMode) => {
    setCadTool(tool);
    if (tool === 'add_ip') {
      showToast('✚ IP追加モード: 2D平面図上の任意の地点をクリックして新規IPを挿入');
    } else if (tool === 'delete_ip') {
      showToast('✖ IP削除モード: 削除したいIPをクリックしてください');
    } else {
      showToast('↖ 選択・移動モード: IPをクリックして選択、ドラッグして移動');
    }
  }, [showToast]);

  // スナップ設定トグル
  const toggleSnapSettingSkill = useCallback((key: keyof CadSnapSettings) => {
    setSnapSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const labels: Record<keyof CadSnapSettings, string> = {
        cadastral5m: '公図5m離隔マグネットスナップ',
        demSaddle: 'DEM鞍部推奨ライン',
        stationMarks: '測点杭（No.杭 @20m）表示',
        slopeHatch: '切盛法面展開ハッチング',
        corridorRibbon: '車道・歩道境界リボン',
      };
      showToast(`${labels[key]}: ${next[key] ? '有効 [ON]' : '無効 [OFF]'}`);
      return next;
    });
  }, [showToast]);

  // IP選択 ＆ 測点自動シーク連動
  const selectIpSkill = useCallback((id: string) => {
    setActiveIpId(id);
    const target = ips.find((ip) => ip.id === id);
    if (target) {
      // 測点文字列 (例: "STA. 12+350" -> 1235m, "STA. 4+250" -> 425m) をパースして測点シーク
      let staM = 1235;
      if (target.station) {
        const match = target.station.match(/STA\.\s*(\d+)\+(\d+)/i);
        if (match) {
          staM = parseInt(match[1], 10) * 1000 + parseInt(match[2], 10);
        }
      } else if (id === 'IP-01') {
        staM = 425;
      } else if (id === 'IP-02') {
        staM = 1235;
      } else if (id === 'IP-03') {
        staM = 1840;
      }
      setCurrentStationM(Math.max(0, Math.min(2440, staM)));
      showToast(`${target.id} (${target.station || 'STA'}) を選択し、測点へフォーカスしました (R=${target.radius}m)`);
    }
  }, [ips, showToast]);

  // IPパラメータ変更 (R, A, superelevation, widening等)
  const updateIpParamSkill = useCallback((id: string, partial: Partial<IntersectionPoint>) => {
    setIps((prev) =>
      prev.map((ip) => {
        if (ip.id !== id) return ip;
        const next = { ...ip, ...partial };

        // 半径RまたはクロソイドA値が変更された場合、クロソイド長Lと幾何諸元を自動連動再計算
        const r = next.radius;
        const a = next.aParam ?? 110;
        // L = A^2 / R
        const clothoidL = Number(((a * a) / r).toFixed(1));
        next.clothoidL = clothoidL;
        next.clothoidA = `${a}/${a}`;

        // 幾何交角 IA (度数) から接線長 TL と曲線長 CL を計算
        const ia = next.iaDeg ?? 35.0;
        const iaRad = (ia * Math.PI) / 180;
        const tl = Number((r * Math.tan(iaRad / 2) + clothoidL / 2).toFixed(1));
        const cl = Number((r * iaRad + clothoidL).toFixed(1));
        const sl = Number((r * (1 / Math.cos(iaRad / 2) - 1)).toFixed(1));
        next.tangentLength = tl;
        next.curveLength = cl;
        next.externalSecant = sl;

        // 道路構造令 適合性判定 (令第15条 R ≥ 150m, 令第16条 L ≥ 35m)
        next.status = r >= 150 && clothoidL >= 35 ? 'PASS' : 'WARN';

        return next;
      })
    );
    setIsCommitted(false);
  }, []);

  // IP移動 (ドラッグ ＆ 公図5mスナップ ＆ 幾何交角・諸元リアルタイム再計算)
  const moveIpSkill = useCallback((id: string, targetX: number, targetY: number) => {
    let finalX = targetX;
    let finalY = targetY;
    let isSnapped = false;

    // 公図5m離隔マグネットスナップ判定 (民有地ポリゴン付近: X: 200〜370, Y: 50〜140)
    if (snapSettings.cadastral5m) {
      // 民有地筆界ラインの下側マージン Y=145〜155 に近づいた場合
      if (finalX >= 220 && finalX <= 380 && finalY < 165 && finalY > 125) {
        finalY = 160; // 5.0mセーフティラインに吸着
        isSnapped = true;
      }
    }

    setIps((prev) => {
      // 全IPの新しい座標配列を構成
      const updatedCoords = prev.map((ip) => {
        if (ip.id !== id) return ip;
        return {
          ...ip,
          x: Math.round(finalX),
          y: Math.round(finalY),
        };
      });

      // 各IPの幾何交角・接線長・外距を再計算
      return updatedCoords.map((ip, idx) => {
        const prevPt = idx === 0 ? { x: 40, y: 380 } : { x: updatedCoords[idx - 1].x ?? 180, y: updatedCoords[idx - 1].y ?? 240 };
        const currPt = { x: ip.x ?? 380, y: ip.y ?? 190 };
        const nextPt = idx === updatedCoords.length - 1 ? { x: 560, y: 90 } : { x: updatedCoords[idx + 1].x ?? 560, y: updatedCoords[idx + 1].y ?? 90 };

        const { iaDeg, thetaStr } = calculateIntersectionAngle(prevPt, currPt, nextPt);
        const iaRad = (iaDeg * Math.PI) / 180;
        const r = ip.radius;
        const a = ip.aParam ?? 110;
        const clothoidL = Number(((a * a) / r).toFixed(1));
        const tl = Number((r * Math.tan(iaRad / 2) + clothoidL / 2).toFixed(1));
        const cl = Number((r * iaRad + clothoidL).toFixed(1));
        const sl = Number((r * (1 / Math.cos(iaRad / 2) - 1)).toFixed(1));

        return {
          ...ip,
          iaDeg,
          theta: thetaStr,
          clothoidL,
          tangentLength: tl,
          curveLength: cl,
          externalSecant: sl,
          status: r >= 150 && clothoidL >= 35 ? 'PASS' : 'WARN',
        };
      });
    });

    // IP-02の場合は互換性のためip2Offsetも更新
    if (id === 'IP-02') {
      const dx = Number(((finalX - 380) * 0.1).toFixed(2));
      const dy = Number(((190 - finalY) * 0.1).toFixed(2));
      setIp2Offset({ dx, dy });
    }

    if (isSnapped) {
      showToast('⌖ 公図5.0m離隔ラインにマグネットスナップ吸着しました');
    }
    setIsCommitted(false);
  }, [snapSettings.cadastral5m, showToast]);

  // 新規IP追加
  const addIpSkill = useCallback((x: number, y: number) => {
    setIps((prev) => {
      const newNum = prev.length + 1;
      const newId = `IP-0${newNum}`;
      // 前後の測点から概算測点を生成
      const approxSta = Math.round((x / 600) * 24000);
      const staKm = Math.floor(approxSta / 1000);
      const staM = approxSta % 1000;
      const stationStr = `STA. ${staKm}+${staM.toString().padStart(3, '0')}`;

      const newIp: IntersectionPoint = {
        id: newId,
        station: stationStr,
        theta: "28°00' R",
        radius: 300.0,
        clothoidA: '120/120',
        clothoidL: 48.0,
        superelevation: 4.0,
        widening: 0.25,
        curveLength: 178.0,
        status: 'PASS',
        note: '動的追加交点',
        isDraggable: true,
        x: Math.round(x),
        y: Math.round(y),
        iaDeg: 28.0,
        aParam: 120,
        tangentLength: 88.0,
        externalSecant: 9.5,
      };

      // X座標の昇順で挿入
      const nextList = [...prev, newIp].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
      setActiveIpId(newId);
      showToast(`新規交点 ${newId} (${stationStr}) を追加しました`);
      return nextList;
    });
    setCadTool('select');
  }, [showToast]);

  // IP削除
  const deleteIpSkill = useCallback((id: string) => {
    setIps((prev) => {
      if (prev.length <= 2) {
        showToast('線形定義を維持するため、最低2箇所のIPが必要です');
        return prev;
      }
      const nextList = prev.filter((ip) => ip.id !== id);
      showToast(`交点 ${id} を削除しました`);
      setActiveIpId(nextList[0]?.id || 'IP-01');
      return nextList;
    });
  }, [showToast]);

  // Skill 1: IPドラッグ
  const dragIp2Skill = useCallback((dx: number, dy: number) => {
    setIp2Offset({ dx: Number(dx.toFixed(2)), dy: Number(dy.toFixed(2)) });
    setIsCommitted(false);
  }, []);

  // Skill 2: アセンブリ変更
  const updateAssemblySkill = useCallback((partial: Partial<CrossSectionAssembly>) => {
    setAssembly((prev) => {
      const next = { ...prev, ...partial };
      // 車線幅員合計の連動更新
      if (partial.laneWidth) {
        next.totalRoadwayWidth = Number((next.laneWidth * next.laneCount).toFixed(2));
      }
      return next;
    });
    showToast('標準横断アセンブリ諸元を更新しました');
  }, [showToast]);

  // Skill 3: コミット
  const commitGeometrySkill = useCallback(() => {
    setIsCommitted(true);
    showToast(`IP-02幾何パラメータを確定コミットしました (R=${dynamicRadius}m, A=110, ΔX=+${ip2Offset.dx}m)`);
  }, [dynamicRadius, ip2Offset.dx, showToast]);

  // Skill 4: LandXMLエクスポート
  const exportLandXmlSkill = useCallback(() => {
    setLandXmlModalOpen(true);
  }, []);

  // Skill 5: QGIS属性書込
  const writeQgisAttributeSkill = useCallback(() => {
    showToast(`QGISレイヤ [road_centerline_2026] へ属性書込完了 (RTT 1.8ms)`);
  }, [showToast]);

  // LandXMLコード生成
  const generatedLandXml = useMemo(() => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2"
         version="1.2" date="${new Date().toISOString().slice(0, 10)}"
         project="Nova3D-Corridor-A1">
  <Units>
    <Metric linearUnit="meter" areaUnit="squareMeter" volumeUnit="cubicMeter"
            temperatureUnit="celsius" pressureUnit="HPa" angleUnit="decimal degrees"/>
  </Units>
  <CoordinateSystem epsgCode="6677" desc="JGD2011 / Japan Plane Rectangular CS IX"/>
  <Alignments name="Project-Corridor-A1">
    <Alignment name="CL-A1" length="2450.000" staStart="0.000">
      <CoordGeom>
        <Line length="425.000">
          <Start>128450.210 45210.880</Start>
          <End>128875.210 45210.880</End>
        </Line>
        <Curve rot="ccw" radius="${dynamicRadius}.000" length="237.000" crvType="arc">
          <Start>128875.210 45210.880</Start>
          <Center>128875.210 ${45210.880 + dynamicRadius}</Center>
          <End>129112.210 45350.880</End>
          <PI delta="48.500" external="15.200"/>
        </Curve>
        <Spiral length="${dynamicClothoidL}" radiusEnd="${dynamicRadius}.000" radiusStart="INF"
                spType="clothoid" constant="110.000"/>
      </CoordGeom>
      <Profile name="DesignGrade">
        <ProfAlign name="V-Grade-01">
          <PVI>0.000 45.200</PVI>
          <PVI>800.000 54.800</PVI>
          <PVI>1235.000 64.980</PVI>
          <ParaCurve length="120.000"/>
          <PVI>2450.000 46.730</PVI>
        </ProfAlign>
      </Profile>
    </Alignment>
  </Alignments>
</LandXML>`;
  }, [dynamicRadius, dynamicClothoidL]);

  // -------------------------------------------------------------
  // QUAD-VIEW & VPI & STATION SEEK SKILLS (四眼連動スキル群)
  // -------------------------------------------------------------
  const selectVpiSkill = useCallback((vpiId: string) => {
    setActiveVpiId(vpiId);
  }, []);

  const moveVpiSkill = useCallback((vpiId: string, targetElevationM: number) => {
    setVpis((prevVpis) => {
      const idx = prevVpis.findIndex((v) => v.id === vpiId);
      if (idx === -1) return prevVpis;
      const target = prevVpis[idx];
      const clampedElev = Number(Math.max(45.0, Math.min(110.0, targetElevationM)).toFixed(2));
      const updatedTarget = { ...target, elevationM: clampedElev };

      const newVpis = [...prevVpis];
      newVpis[idx] = updatedTarget;

      // 前後区間の勾配を再計算
      for (let i = 0; i < newVpis.length; i++) {
        const curr = newVpis[i];
        const prev = i > 0 ? newVpis[i - 1] : { stationM: 0, elevationM: 52.0 };
        const next = i < newVpis.length - 1 ? newVpis[i + 1] : { stationM: 2440, elevationM: 50.0 };

        const dStaIn = curr.stationM - prev.stationM;
        const dElevIn = curr.elevationM - prev.elevationM;
        const gIn = dStaIn !== 0 ? Number(((dElevIn / dStaIn) * 100).toFixed(2)) : 0;

        const dStaOut = next.stationM - curr.stationM;
        const dElevOut = next.elevationM - curr.elevationM;
        const gOut = dStaOut !== 0 ? Number(((dElevOut / dStaOut) * 100).toFixed(2)) : 0;

        const isPass = Math.abs(gIn) <= standard.maxGradePercent && Math.abs(gOut) <= standard.maxGradePercent;
        newVpis[i] = {
          ...curr,
          gradeInPercent: gIn,
          gradeOutPercent: gOut,
          status: isPass ? 'PASS' : 'WARN',
        };
      }
      return newVpis;
    });
  }, [standard.maxGradePercent]);

  const seekStationSkill = useCallback((staM: number) => {
    const clamped = Math.max(0, Math.min(2440, Math.round(staM)));
    setCurrentStationM(clamped);
  }, []);

  const stepStationSkill = useCallback((deltaM: number) => {
    setCurrentStationM((prev) => Math.max(0, Math.min(2440, prev + deltaM)));
  }, []);

  const togglePlayDriveSkill = useCallback(() => {
    setIsPlayingDrive((prev) => {
      const next = !prev;
      showToast(next ? '▶ 3D自動走行シミュレーション開始 (V=60km/h追従)' : '⏸ 自動走行一時停止');
      return next;
    });
  }, [showToast]);

  const setViewModeSkill = useCallback((mode: ViewportLayoutMode) => {
    setViewMode(mode);
    showToast(`ビューポートレイアウト変更: ${mode.toUpperCase()}`);
  }, [showToast]);

  return {
    ips,
    ip2Offset,
    dynamicRadius,
    dynamicClothoidL,
    dynamicLandClearance,
    dynamicEarthworkBalance,
    standard,
    assembly: dynamicAssembly,
    auditMatrix,
    isCommitted,
    activeTab,
    setActiveTab,
    landXmlModalOpen,
    setLandXmlModalOpen,
    feedbackToast,
    generatedLandXml,
    // 2D CAD State & Skills
    activeIpId,
    activeIp,
    cadTool,
    snapSettings,
    selectCadToolSkill,
    toggleSnapSettingSkill,
    selectIpSkill,
    updateIpParamSkill,
    moveIpSkill,
    addIpSkill,
    deleteIpSkill,
    // 2-2 Quad-View & VPI & Station Seek State & Skills
    vpis,
    activeVpiId,
    currentStationM,
    isPlayingDrive,
    viewMode,
    stationInfo,
    dynamicProfilePaths,
    selectVpiSkill,
    moveVpiSkill,
    seekStationSkill,
    stepStationSkill,
    togglePlayDriveSkill,
    setViewModeSkill,
    // Base Skills
    dragIp2Skill,
    updateAssemblySkill,
    commitGeometrySkill,
    exportLandXmlSkill,
    writeQgisAttributeSkill,
  };
}
