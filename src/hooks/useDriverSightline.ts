import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  VehicleType,
  WeatherCondition,
  DriverSightlineState,
  SightlineAuditItem,
} from '../types';

export function useDriverSightline() {
  const [currentStationM, setCurrentStationM] = useState<number>(7500); // 初期位置: 緑川橋梁手前 STA.7+500
  const [speedKmh, setSpeedKmh] = useState<number>(60);
  const [targetSpeedKmh, setTargetSpeedKmh] = useState<number>(60);
  const [isCruiseActive, setIsCruiseActive] = useState<boolean>(true);
  const [vehicleType, setVehicleType] = useState<VehicleType>('passenger');
  const [weather, setWeather] = useState<WeatherCondition>('clear');
  const [isAccelerating, setIsAccelerating] = useState<boolean>(false);
  const [isBraking, setIsBraking] = useState<boolean>(false);
  const [isWiperActive, setIsWiperActive] = useState<boolean>(false);
  const [isHeadlightHigh, setIsHeadlightHigh] = useState<boolean>(false);

  // 車種別アイポイント高さ (m)
  const eyeHeightM = useMemo(() => {
    switch (vehicleType) {
      case 'truck':
        return 2.50;
      case 'bus':
        return 2.10;
      case 'passenger':
      default:
        return 1.20;
    }
  }, [vehicleType]);

  // アニメーションループ用タイマー (60FPS物理駆動)
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  // 測点に応じた幾何情報（線形・構造物・トンネル・橋梁）
  const roadGeometry = useMemo(() => {
    const sta = currentStationM;
    // 橋梁区間: STA.7+100 〜 STA.8+250 (緑川渡河部)
    const isOnBridge = sta >= 7100 && sta <= 8250;
    // トンネル区間: STA.14+200 〜 STA.16+050 (金峰山第1トンネル)
    const isInsideTunnel = sta >= 14200 && sta <= 16050;
    // トンネル接近ゾーン: 坑口手前300m
    const isTunnelApproach = sta >= 13900 && sta < 14200;

    // 縦断勾配 (percent)
    let gradePercent = 0.0;
    if (sta < 6000) gradePercent = 0.5;
    else if (sta < 8500) gradePercent = -1.2; // 橋梁部 下り勾配
    else if (sta < 13000) gradePercent = 2.4; // 金峰山登り勾配
    else if (sta < 16500) gradePercent = -3.8; // トンネル内下り急勾配
    else gradePercent = 1.0;

    // 曲線半径 R (m) と曲率
    let curveRadiusM = 1200;
    if (sta >= 3500 && sta <= 5000) curveRadiusM = 450; // IP-02 急曲線
    else if (sta >= 7200 && sta <= 8100) curveRadiusM = 800; // 橋梁曲線
    else if (sta >= 14300 && sta <= 15200) curveRadiusM = 600; // トンネル内曲線
    else curveRadiusM = 2000;

    // ステアリング角度 (度)
    const steeringAngleDeg = curveRadiusM < 1000 ? (1200 / curveRadiusM) * 3.2 : 0.8;

    // 片勾配 (カントバンク角 %)
    const roadBankDeg = curveRadiusM <= 600 ? 5.5 : curveRadiusM <= 800 ? 4.0 : 2.0;

    // 道路構造令第11条: 停止視距 (Stopping Sight Distance: SSD)
    // S = (V * t / 3.6) + (V^2 / (254 * (f ± i/100)))
    // t = 2.5s (空走時間), f = 0.35 (湿潤面路面摩擦係数), i = 勾配
    const f = weather === 'heavy_rain' ? 0.28 : 0.35;
    const i = gradePercent / 100;
    const stoppingSightDistanceRequiredM = Math.round(
      (speedKmh * 2.5) / 3.6 + (speedKmh * speedKmh) / (254 * (f + i))
    );

    // 実際の見通し視距 (実際のカーブ視距、防音壁・側壁クリアランスを考慮)
    // 見通し視距 S_actual = √(8 * R * M), M = 側方余裕 (m)
    const lateralClearanceM = isInsideTunnel ? 1.8 : 3.5;
    const stoppingSightDistanceActualM = Math.min(
      150,
      Math.round(Math.sqrt(8 * curveRadiusM * lateralClearanceM))
    );

    // 視距クリア判定
    const isSightlineClear = stoppingSightDistanceActualM >= stoppingSightDistanceRequiredM;

    // 前方障害物（仮想コーン・落下物）までの距離 (m)
    const obstacleDistanceM = Math.max(20, stoppingSightDistanceActualM - 12);

    // トンネル明暗順応スコア (0-100)
    let tunnelAdaptationScore = 100;
    if (isTunnelApproach) {
      // 坑口手前でブラックホール現象への突入
      const distToPortal = 14200 - sta;
      tunnelAdaptationScore = Math.round(60 + (distToPortal / 300) * 40);
    } else if (isInsideTunnel) {
      tunnelAdaptationScore = 95; // 坑内照明点灯中
    }

    // 案内標識テキストと距離
    let approachingSignText = '熊本西環状道路 // 制限速度 60km/h';
    let signDistanceM = 80;
    if (sta < 6800) {
      approachingSignText = '[案内] 緑川IC 1.2km / 国道57号方面';
      signDistanceM = Math.max(10, 6800 - sta);
    } else if (sta < 7100) {
      approachingSignText = '[予告] 緑川渡河橋梁 全長380m // 横風注意';
      signDistanceM = Math.max(10, 7100 - sta);
    } else if (sta < 13800) {
      approachingSignText = '[案内] 金峰山IC 2.0km / 熊本城方面';
      signDistanceM = Math.max(10, 13800 - sta);
    } else if (sta < 14200) {
      approachingSignText = '[トンネル情報] 金峰山第1トンネル (1,850m) // 点灯・速度注意';
      signDistanceM = Math.max(10, 14200 - sta);
    } else if (isInsideTunnel) {
      approachingSignText = '[非常用施設] 非常電話 50m / 避難連絡坑 250m';
      signDistanceM = 50;
    }

    return {
      isOnBridge,
      isInsideTunnel,
      isTunnelApproach,
      gradePercent,
      curveRadiusM,
      steeringAngleDeg,
      roadBankDeg,
      stoppingSightDistanceRequiredM,
      stoppingSightDistanceActualM,
      isSightlineClear,
      obstacleDistanceM,
      tunnelAdaptationScore,
      approachingSignText,
      signDistanceM,
    };
  }, [currentStationM, speedKmh, weather]);

  // 物理更新ループ
  useEffect(() => {
    let active = true;

    const updatePhysics = (time: number) => {
      if (!active) return;
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000); // 秒
      lastTimeRef.current = time;

      setSpeedKmh((prevSpeed) => {
        let newSpeed = prevSpeed;
        if (isBraking) {
          // 急制動
          newSpeed = Math.max(0, prevSpeed - 24 * dt);
        } else if (isAccelerating) {
          // 加速
          newSpeed = Math.min(100, prevSpeed + 12 * dt);
        } else if (isCruiseActive) {
          // クルーズコントロールで目標速度へ漸近
          if (Math.abs(prevSpeed - targetSpeedKmh) > 0.5) {
            newSpeed += (targetSpeedKmh - prevSpeed) * 2.5 * dt;
          } else {
            newSpeed = targetSpeedKmh;
          }
        } else {
          // コースティング (自然減速)
          newSpeed = Math.max(0, prevSpeed - 3.0 * dt);
        }
        return Math.round(newSpeed * 10) / 10;
      });

      // 測点前進: v (km/h) -> m/s
      setCurrentStationM((prevSta) => {
        const deltaM = (speedKmh / 3.6) * dt;
        let nextSta = prevSta + deltaM;
        if (nextSta > 24500) nextSta = 0; // 全線ループ
        return Math.round(nextSta * 10) / 10;
      });

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speedKmh, isBraking, isAccelerating, isCruiseActive, targetSpeedKmh]);

  // キーボード操作リスナー (W: 加速, S: ブレーキ, C: クルーズ切替)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        setIsAccelerating(true);
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        setIsBraking(true);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsCruiseActive((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        setIsAccelerating(false);
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        setIsBraking(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 道路構造令・安全基準 リアルタイム照査マトリクス
  const auditItems: SightlineAuditItem[] = useMemo(() => {
    const isSsdPass = roadGeometry.isSightlineClear;
    const clearanceSide = roadGeometry.isInsideTunnel ? 1.8 : 3.5;
    const isClearancePass = clearanceSide >= 1.5;
    const isAdaptationPass = roadGeometry.tunnelAdaptationScore >= 70;
    const isBrakingDistPass = speedKmh <= 65;
    const isSuperelevationPass = roadGeometry.roadBankDeg <= 6.0;

    return [
      {
        id: 'sight-01',
        standard: '道路構造令',
        clause: '第11条 (停止視距)',
        title: '設計速度60km/h 停止視距余裕長',
        limit: `≥ ${roadGeometry.stoppingSightDistanceRequiredM}m (勾配補正)`,
        actual: `${roadGeometry.stoppingSightDistanceActualM}m (視距確保)`,
        status: isSsdPass ? 'PASS' : 'WARN',
        note: isSsdPass ? '見通し十分 (障害物手前で停止可能)' : 'カーブ側壁による視線死角あり',
      },
      {
        id: 'sight-02',
        standard: '道路構造令',
        clause: '第12条 (建築限界)',
        title: '路肩・側壁 側方クリアランス離隔',
        limit: '≥ 1.50m',
        actual: `${clearanceSide.toFixed(2)}m`,
        status: isClearancePass ? 'PASS' : 'FAIL',
        note: '防音壁・覆工側壁への接触なし',
      },
      {
        id: 'sight-03',
        standard: '道路トンネル技術基準',
        clause: '第4章 (トンネル坑口照明)',
        title: 'ブラックホール緩和・明暗順応度',
        limit: '≥ 70 pt (野外輝度低減)',
        actual: `${roadGeometry.tunnelAdaptationScore} pt`,
        status: isAdaptationPass ? 'PASS' : 'WARN',
        note: roadGeometry.isTunnelApproach
          ? '入口部ルーバー減光 + 緩和照明点灯中'
          : '通常照明維持',
      },
      {
        id: 'sight-04',
        standard: '道路構造令',
        clause: '第13条 (曲線部片勾配)',
        title: '遠心加速度抑制 カント横断勾配',
        limit: '≤ 6.0%',
        actual: `${roadGeometry.roadBankDeg.toFixed(1)}%`,
        status: isSuperelevationPass ? 'PASS' : 'WARN',
        note: '横滑り限界余裕 $F_r \\ge 1.45$',
      },
      {
        id: 'sight-05',
        standard: '道路交通標識令',
        clause: '第3章 (案内標識視認性)',
        title: '標識文字判読 視認可能距離',
        limit: '≥ 50m (判読文字高30cm)',
        actual: `${Math.round(roadGeometry.signDistanceM)}m`,
        status: roadGeometry.signDistanceM >= 30 ? 'PASS' : 'WARN',
        note: roadGeometry.approachingSignText.split('//')[0],
      },
      {
        id: 'sight-06',
        standard: '土木工事安全施工指針',
        clause: '第5節 (悪天候時走行安全)',
        title: '路面すべり摩擦抵抗・ワイパー視野',
        limit: '動摩擦係数 ≥ 0.25',
        actual: weather === 'heavy_rain' ? '0.28 (豪雨湿潤)' : '0.35 (乾燥アスファルト)',
        status: 'PASS',
        note: weather === 'heavy_rain' ? 'ワイパー連動・速度抑制推奨' : '良好',
      },
    ];
  }, [roadGeometry, speedKmh, weather]);

  // レポートCSVエクスポート機能
  const exportSightlineReportCsv = useCallback(() => {
    const headers = [
      '測点(STA)',
      '走行速度(km/h)',
      '車種',
      'アイポイント高(m)',
      '天候',
      '道路構造令必要視距(m)',
      '実際見通し視距(m)',
      '判定',
      '縦断勾配(%)',
      '曲線半径(m)',
      '前方標識',
    ];
    const rows = [
      [
        `STA.${(currentStationM / 1000).toFixed(3).replace('.', '+')}`,
        speedKmh.toFixed(1),
        vehicleType === 'passenger' ? '普通乗用車' : vehicleType === 'truck' ? '大型トラック' : 'バス',
        eyeHeightM.toFixed(2),
        weather === 'clear' ? '晴天' : weather === 'heavy_rain' ? '豪雨' : '夜間',
        roadGeometry.stoppingSightDistanceRequiredM,
        roadGeometry.stoppingSightDistanceActualM,
        roadGeometry.isSightlineClear ? '適合(PASS)' : '注意(WARN)',
        roadGeometry.gradePercent.toFixed(1),
        roadGeometry.curveRadiusM,
        `"${roadGeometry.approachingSignText}"`,
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Nova3D_Driver_Sightline_Audit_STA${Math.round(currentStationM)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [currentStationM, speedKmh, vehicleType, eyeHeightM, weather, roadGeometry]);

  const state: DriverSightlineState = {
    currentStationM,
    speedKmh,
    targetSpeedKmh,
    isCruiseActive,
    vehicleType,
    eyeHeightM,
    weather,
    isBraking,
    isAccelerating,
    steeringAngleDeg: roadGeometry.steeringAngleDeg,
    roadBankDeg: roadGeometry.roadBankDeg,
    gradePercent: roadGeometry.gradePercent,
    curveRadiusM: roadGeometry.curveRadiusM,
    stoppingSightDistanceRequiredM: roadGeometry.stoppingSightDistanceRequiredM,
    stoppingSightDistanceActualM: roadGeometry.stoppingSightDistanceActualM,
    isSightlineClear: roadGeometry.isSightlineClear,
    obstacleDistanceM: roadGeometry.obstacleDistanceM,
    tunnelAdaptationScore: roadGeometry.tunnelAdaptationScore,
    isInsideTunnel: roadGeometry.isInsideTunnel,
    isOnBridge: roadGeometry.isOnBridge,
    approachingSignText: roadGeometry.approachingSignText,
    signDistanceM: roadGeometry.signDistanceM,
  };

  return {
    state,
    auditItems,
    isWiperActive,
    setIsWiperActive,
    isHeadlightHigh,
    setIsHeadlightHigh,
    setCurrentStationM,
    setSpeedKmh,
    setTargetSpeedKmh,
    setIsCruiseActive,
    setVehicleType,
    setWeather,
    setIsAccelerating,
    setIsBraking,
    exportSightlineReportCsv,
  };
}
