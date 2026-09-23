/**
 * Nova3D Civil Platform v5.3 - Slope Stabilization Custom Hook
 * 豪雨シミュレーション・WebWorker並列安定計算・AIアンカー最適配置フック
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SlopeStationData,
  RainSimulationParams,
  DEFAULT_SOIL_PRESETS,
  evaluateAllSlopeStations,
} from '../utils/slopeStabilityEngine';
import {
  GroundAnchorDesign,
  optimizeGroundAnchorSystem,
} from '../utils/groundAnchorOptimizer';
import {
  generateSlopeSafetyReportCSV,
  generateSlopeLandXML,
} from '../utils/slopeReportGenerator';

// 初期代表測点データ（法面切土部）
const INITIAL_STATIONS: SlopeStationData[] = [
  {
    station: 'STA. 0+100',
    stationMeter: 100,
    cutHeight: 6.5,
    slopeGradient: 1.0, // 1:1.0
    slopeLength: 9.2,
    soilType: DEFAULT_SOIL_PRESETS.weathered_granite,
    normalFs: 1.62,
    rainFs: 1.35,
    criticalFailureRadius: 8.8,
    poreWaterPressureKPa: 0,
    seepageDepthM: 0,
    isCritical: false,
    isWarning: false,
    status: 'safe',
    reinforcementApplied: false,
  },
  {
    station: 'STA. 0+250',
    stationMeter: 250,
    cutHeight: 12.0,
    slopeGradient: 0.9,
    slopeLength: 16.1,
    soilType: DEFAULT_SOIL_PRESETS.colluvial_soil,
    normalFs: 1.38,
    rainFs: 1.05,
    criticalFailureRadius: 16.2,
    poreWaterPressureKPa: 0,
    seepageDepthM: 0,
    isCritical: false,
    isWarning: true,
    status: 'warning',
    reinforcementApplied: false,
  },
  {
    station: 'STA. 0+450',
    stationMeter: 450,
    cutHeight: 18.5,
    slopeGradient: 0.8, // 1:0.8 急勾配
    slopeLength: 23.7,
    soilType: DEFAULT_SOIL_PRESETS.tertiary_mudstone,
    normalFs: 1.34,
    rainFs: 0.82,
    criticalFailureRadius: 25.0,
    poreWaterPressureKPa: 0,
    seepageDepthM: 0,
    isCritical: true,
    isWarning: false,
    status: 'critical',
    reinforcementApplied: false,
  },
  {
    station: 'STA. 0+650',
    stationMeter: 650,
    cutHeight: 15.0,
    slopeGradient: 0.85,
    slopeLength: 19.7,
    soilType: DEFAULT_SOIL_PRESETS.colluvial_soil,
    normalFs: 1.25,
    rainFs: 0.89,
    criticalFailureRadius: 20.3,
    poreWaterPressureKPa: 0,
    seepageDepthM: 0,
    isCritical: true,
    isWarning: false,
    status: 'critical',
    reinforcementApplied: false,
  },
  {
    station: 'STA. 0+850',
    stationMeter: 850,
    cutHeight: 8.0,
    slopeGradient: 1.0,
    slopeLength: 11.3,
    soilType: DEFAULT_SOIL_PRESETS.volcanic_ash,
    normalFs: 1.45,
    rainFs: 1.15,
    criticalFailureRadius: 10.8,
    poreWaterPressureKPa: 0,
    seepageDepthM: 0,
    isCritical: false,
    isWarning: true,
    status: 'warning',
    reinforcementApplied: false,
  },
  {
    station: 'STA. 1+050',
    stationMeter: 1050,
    cutHeight: 5.0,
    slopeGradient: 1.2,
    slopeLength: 7.8,
    soilType: DEFAULT_SOIL_PRESETS.weathered_granite,
    normalFs: 1.78,
    rainFs: 1.52,
    criticalFailureRadius: 6.8,
    poreWaterPressureKPa: 0,
    seepageDepthM: 0,
    isCritical: false,
    isWarning: false,
    status: 'safe',
    reinforcementApplied: false,
  }
];

export function useSlopeStabilization() {
  const [rainParams, setRainParams] = useState<RainSimulationParams>({
    intensityMmPerHour: 95, // 初期値: 豪雨 95mm/h
    durationHours: 3.5,
    antecedentRainfallMm: 45,
    groundwaterTableRise: 1.2,
  });

  const [stations, setStations] = useState<SlopeStationData[]>(INITIAL_STATIONS);
  const [selectedStationIndex, setSelectedStationIndex] = useState<number>(2); // デフォルト: 危険な STA. 0+450
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [collapsePreview, setCollapsePreview] = useState<boolean>(false);
  const [computeTimeMs, setComputeTimeMs] = useState<number>(0.8);
  const [isWorkerActive, setIsWorkerActive] = useState<boolean>(false);
  const [anchorDesigns, setAnchorDesigns] = useState<Record<string, GroundAnchorDesign>>({});

  const workerRef = useRef<Worker | null>(null);

  // WebWorker の初期化
  useEffect(() => {
    try {
      // Vite の new Worker(?worker) 構文
      const worker = new Worker(new URL('../workers/slopePhysicsWorker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (e) => {
        if (e.data.type === 'STABILITY_RESULT') {
          const { stations: updatedStations, durationMs } = e.data.payload;
          setStations(updatedStations);
          setComputeTimeMs(durationMs);
          setIsWorkerActive(true);
        }
      };

      workerRef.current = worker;
    } catch {
      // インラインフォールバック
      setIsWorkerActive(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // 降雨・パラメータ変更時の安定計算トリガー
  const recalculate = useCallback(() => {
    const startTime = performance.now();

    if (workerRef.current && isWorkerActive) {
      workerRef.current.postMessage({
        type: 'CALCULATE_STABILITY',
        payload: {
          stations,
          rain: rainParams,
        },
      });
    } else {
      // フォールバック計算
      const updated = evaluateAllSlopeStations(stations, rainParams);
      const dur = performance.now() - startTime;
      setStations(updated);
      setComputeTimeMs(dur);
    }
  }, [stations, rainParams, isWorkerActive]);

  useEffect(() => {
    recalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rainParams.intensityMmPerHour, rainParams.durationHours, rainParams.antecedentRainfallMm, rainParams.groundwaterTableRise]);

  // AIアンカー最適化計算の自動連動
  useEffect(() => {
    const designs: Record<string, GroundAnchorDesign> = {};
    stations.forEach((st) => {
      designs[st.station] = optimizeGroundAnchorSystem(st, 1.20);
    });
    setAnchorDesigns(designs);
  }, [stations]);

  // 特定測点の補強工トグル
  const toggleReinforcement = useCallback((stationName: string) => {
    setStations((prev) =>
      prev.map((st) => {
        if (st.station === stationName) {
          const newState = !st.reinforcementApplied;
          const anchor = anchorDesigns[st.station];
          return {
            ...st,
            reinforcementApplied: newState,
            status: newState && anchor && anchor.achievedFs >= 1.20 ? 'safe' : st.status,
          };
        }
        return st;
      })
    );
  }, [anchorDesigns]);

  // 全危険測点へのワンクリック一括AI補強適用
  const applyAllOptimizedReinforcements = useCallback(() => {
    setStations((prev) =>
      prev.map((st) => {
        const anchor = anchorDesigns[st.station];
        const isHazard = st.rainFs < 1.20;
        return {
          ...st,
          reinforcementApplied: isHazard ? true : st.reinforcementApplied,
          status: isHazard && anchor && anchor.achievedFs >= 1.20 ? 'safe' : st.status,
        };
      })
    );
  }, [anchorDesigns]);

  // 全補強のリセット
  const resetAllReinforcements = useCallback(() => {
    setStations((prev) =>
      prev.map((st) => ({
        ...st,
        reinforcementApplied: false,
      }))
    );
    recalculate();
  }, [recalculate]);

  // CSVエクスポート
  const downloadReportCSV = useCallback(() => {
    const csvContent = generateSlopeSafetyReportCSV(stations, rainParams, anchorDesigns);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `斜面崩壊危険度カルテ_STA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [stations, rainParams, anchorDesigns]);

  // LandXML 1.2 エクスポート
  const downloadLandXML = useCallback(() => {
    const xmlContent = generateSlopeLandXML(stations, anchorDesigns);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Nova3D_ReinforcedSlope_LandXML1.2_${new Date().toISOString().slice(0, 10)}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [stations, anchorDesigns]);

  // 危険測点数・工費サマリー
  const criticalCount = stations.filter((s) => s.rainFs < 1.00 && !s.reinforcementApplied).length;
  const warningCount = stations.filter((s) => s.rainFs >= 1.00 && s.rainFs < 1.20 && !s.reinforcementApplied).length;
  const totalCostYen = stations
    .filter((s) => s.reinforcementApplied && anchorDesigns[s.station])
    .reduce((sum, s) => sum + (anchorDesigns[s.station]?.estimatedCostYen || 0), 0);

  const selectedStation = stations[selectedStationIndex] || stations[0];
  const selectedAnchor = anchorDesigns[selectedStation.station];

  return {
    rainParams,
    setRainParams,
    stations,
    selectedStation,
    selectedStationIndex,
    setSelectedStationIndex,
    isSimulating,
    setIsSimulating,
    collapsePreview,
    setCollapsePreview,
    computeTimeMs,
    isWorkerActive,
    anchorDesigns,
    selectedAnchor,
    toggleReinforcement,
    applyAllOptimizedReinforcements,
    resetAllReinforcements,
    downloadReportCSV,
    downloadLandXML,
    criticalCount,
    warningCount,
    totalCostYen,
  };
}
