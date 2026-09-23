import { useState, useMemo, useCallback } from 'react';
import {
  RainfallScenario,
  RainfallScenarioId,
  CofferdamStatus,
  EnvironmentalShadowPoint,
  HydroAuditItem,
} from '../types';

export const useHydroSimulation = () => {
  // 1. 降雨・水文シナリオリスト
  const [scenarios] = useState<RainfallScenario[]>([
    {
      id: 'normal',
      name: '平常時 (平水期)',
      rainfallMmH: 5,
      probYear: '平常時',
      riverFlowM3s: 85,
      waterElevationM: 25.80,
      flowVelocityMs: 1.15,
      description: '緑川通常流況。基準河床高 EL.22.50m に対して水深 3.30m。水中施工可能。',
    },
    {
      id: 'baiu',
      name: '梅雨前線停滞 (出水期中規模)',
      rainfallMmH: 45,
      probYear: '年超過確率 1/2',
      riverFlowM3s: 480,
      waterElevationM: 28.60,
      flowVelocityMs: 2.30,
      description: '降雨45mm/h。水位上昇 +2.80m。河川内仮設構台への警戒警報発令レベル。',
    },
    {
      id: 'typhoon',
      name: '台風接近・集中豪雨',
      rainfallMmH: 80,
      probYear: '年超過確率 1/10',
      riverFlowM3s: 1150,
      waterElevationM: 30.85,
      flowVelocityMs: 3.45,
      description: '警戒水位 EL.30.10m 超過。下部工水中掘削作業中止・重機高台退避基準。',
    },
    {
      id: 'prob_50yr',
      name: '50年確率設計豪雨 (基準外力)',
      rainfallMmH: 120,
      probYear: '年超過確率 1/50',
      riverFlowM3s: 1850,
      waterElevationM: 32.40, // 計画高水位 HWL
      flowVelocityMs: 4.20,
      description: '計画高水位 HWL 32.40m 到達。橋梁桁下面（EL.34.50m）に対して余裕高 2.10m 確保。',
    },
    {
      id: 'historic_max',
      name: '平成24年7月九州北部豪雨級',
      rainfallMmH: 155,
      probYear: '既往最大',
      riverFlowM3s: 2320,
      waterElevationM: 33.60,
      flowVelocityMs: 4.85,
      description: '計画高水位 +1.20m 超過。特別警戒警報。河川堤防天端（EL.34.00m）余裕高 40cm。',
    },
  ]);

  const [activeScenarioId, setActiveScenarioId] = useState<RainfallScenarioId>('prob_50yr');
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[3];

  // 2. 4D施工タイムライン (Day 1 - Day 600 / 2025年4月 - 2026年12月)
  const [timelineDay, setTimelineDay] = useState<number>(240); // 2025年11月 (非出水期開始)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'river' | 'plateau'>('river');

  // 日付の計算 (Day 1 = 2025-04-01)
  const currentDate = useMemo(() => {
    const base = new Date(2025, 3, 1); // 2025-04-01
    base.setDate(base.getDate() + timelineDay);
    return base;
  }, [timelineDay]);

  // 出水期判定 (河川法：6月1日〜10月31日が出水期、11月1日〜翌5月31日が非出水期)
  const isFloodSeason = useMemo(() => {
    const month = currentDate.getMonth() + 1; // 1-12
    return month >= 6 && month <= 10;
  }, [currentDate]);

  // 3. 橋脚仮締切 (Cofferdams: 鋼矢板IV型) 越流ステータス
  const cofferdamStatuses: CofferdamStatus[] = useMemo(() => {
    // 鋼矢板天端高: P1: EL.31.50m, P2: EL.31.00m, P3: EL.31.00m, P4: EL.31.50m
    const piers = [
      { pierId: 'P1', topElevationM: 31.50 },
      { pierId: 'P2', topElevationM: 31.00 },
      { pierId: 'P3', topElevationM: 31.00 },
      { pierId: 'P4', topElevationM: 31.50 },
    ];

    const currentWl = activeScenario.waterElevationM;

    return piers.map((p) => {
      const freeboard = Math.round((p.topElevationM - currentWl) * 100) / 100;
      let status: 'SAFE' | 'ALERT' | 'OVERTOPPING' = 'SAFE';
      if (freeboard < 0) {
        status = 'OVERTOPPING';
      } else if (freeboard < 0.6) {
        status = 'ALERT';
      }
      return {
        pierId: p.pierId,
        topElevationM: p.topElevationM,
        waterLevelM: currentWl,
        freeboardM: freeboard,
        isOvertoppingRisk: freeboard < 0.6,
        status,
      };
    });
  }, [activeScenario]);

  // 4. PLATEAU LOD3 建物群 環境アセスメントデータ (日影・騒音)
  const [environmentalPoints] = useState<EnvironmentalShadowPoint[]>([
    {
      buildingId: 'BLD-01',
      buildingName: '北岡1丁目 レジデンスA',
      floors: 5,
      shadowDurationHours: 2.5,
      legalLimitHours: 4.0,
      isCompliant: true,
      noiseLevelDb: 54.2,
      noiseLimitDb: 60.0,
    },
    {
      buildingId: 'BLD-02',
      buildingName: '北岡中央 クリニックビル',
      floors: 3,
      shadowDurationHours: 3.1,
      legalLimitHours: 4.0,
      isCompliant: true,
      noiseLevelDb: 56.8,
      noiseLimitDb: 60.0,
    },
    {
      buildingId: 'BLD-03',
      buildingName: '市立城山小学校 (南校舎)',
      floors: 4,
      shadowDurationHours: 1.8,
      legalLimitHours: 3.0,
      isCompliant: true,
      noiseLevelDb: 48.5,
      noiseLimitDb: 55.0, // 文教地区基準
    },
    {
      buildingId: 'BLD-04',
      buildingName: '緑川リバーサイド マンション',
      floors: 8,
      shadowDurationHours: 2.2,
      legalLimitHours: 4.0,
      isCompliant: true,
      noiseLevelDb: 58.1,
      noiseLimitDb: 60.0,
    },
  ]);

  // 5. 河川法・水防法・出水期施工安全 監査マトリクス
  const auditItems: HydroAuditItem[] = useMemo(() => {
    const isOvertopped = cofferdamStatuses.some((c) => c.status === 'OVERTOPPING');
    const minFreeboard = Math.min(...cofferdamStatuses.map((c) => c.freeboardM));

    return [
      {
        id: 'HA-01',
        standard: '河川法第24条 (出水期河川占用制限)',
        clause: '第3章 河川保全区域内仮設令',
        title: '非出水期（11月〜5月）水中下部工施工スケジュール適合',
        limit: '出水期（6〜10月）河川内水中掘削禁止',
        actual: isFloodSeason
          ? '出水期該当中 (上部工架設または陸上工区作業に限定)'
          : '非出水期ウィンドウ適合 (P1-P4水中基礎施工認可中)',
        status: isFloodSeason ? 'WARN' : 'PASS',
        note: isFloodSeason ? '河川内仮設鋼矢板は高台待機または冠水安全養生' : '安全施工可能期',
      },
      {
        id: 'HA-02',
        standard: '河川構造令第62条',
        clause: '第2節 橋梁桁下余裕高',
        title: '50年確率降雨(HWL 32.40m)時の桁下余裕高',
        limit: '桁下余裕高 H ≥ 1.50m (計画高水位 HWL対比)',
        actual: `H = 2.10m (桁下面 EL.34.50m, 余裕率 140.0%)`,
        status: 'PASS',
        note: '流木・漂流物衝突余裕高を完全確保',
      },
      {
        id: 'HA-03',
        standard: '水防法施工基準',
        clause: '第15条 工事用仮締切安全基準',
        title: '鋼矢板仮締切天端 越流安全マージン',
        limit: '天端余裕高 ΔH ≥ +0.50m (平常〜中規模出水時)',
        actual: minFreeboard > 0
          ? `最小余裕高 +${minFreeboard.toFixed(2)}m (${minFreeboard >= 0.5 ? '安全確保' : '警戒水域'})`
          : `越流発生 (${minFreeboard.toFixed(2)}m 冠水)`,
        status: isOvertopped ? 'FAIL' : minFreeboard < 0.5 ? 'WARN' : 'PASS',
        note: '越流時は水密扉閉塞およびポンプ緊急停止',
      },
      {
        id: 'HA-04',
        standard: '建築基準法第56条の2',
        clause: '日影による中高層建築物の制限',
        title: '冬至日 沿道PLATEAU建物日影規制照査',
        limit: '日影時間 ≤ 4.0時間 (測定高 1.5m / 8:00〜16:00)',
        actual: '最大 3.1時間 (北岡中央クリニックビル地点) PASS',
        status: 'PASS',
        note: '高架橋桁高・遮音壁の傾斜化による日照権クリア',
      },
      {
        id: 'HA-05',
        standard: '環境基本法騒音環境基準',
        clause: '幹線交通を担う道路に面する地域',
        title: '昼間等価騒音レベル (LAeq,d) 透過損失照査',
        limit: '昼間騒音 ≤ 60.0 dB (文教地区 55.0 dB)',
        actual: '最大 58.1 dB (全沿道住居基準達成)',
        status: 'PASS',
        note: '高機能低騒音舗装(排水性) ＋ 高さ2.0mルーバー遮音壁適用',
      },
      {
        id: 'HA-06',
        standard: '土砂災害防止法',
        clause: '第8条 斜面安定度照査',
        title: '金峰山トンネル坑口 豪雨時斜面安全率',
        limit: '豪雨時安全率 Fs ≥ 1.20',
        actual: `Fs = 1.42 (120mm/h 豪雨地下水上昇考慮時)`,
        status: 'PASS',
        note: '集水井＋水抜きボーリング工（L=40m×8本）による地下水位低下効果',
      },
    ];
  }, [isFloodSeason, cofferdamStatuses]);

  // 6. CSVレポート生成
  const generateHydroCsv = useCallback(() => {
    let csv = '\uFEFF';
    csv += '【熊本環状西道路】緑川水文出水シミュレーション ＆ 沿道PLATEAU環境アセスメント報告書\n';
    csv += `出力日時: ${new Date().toLocaleString('ja-JP')}\n`;
    csv += `適用シナリオ: ${activeScenario.name} (降雨強度: ${activeScenario.rainfallMmH} mm/h, 流量: ${activeScenario.riverFlowM3s} m³/s)\n`;
    csv += `シミュレーション水位: EL.${activeScenario.waterElevationM.toFixed(2)} m, 流速: ${activeScenario.flowVelocityMs} m/s\n`;
    csv += `4D施工タイムライン: Day ${timelineDay} (${currentDate.toLocaleDateString('ja-JP')} - ${isFloodSeason ? '出水期' : '非出水期'})\n\n`;

    csv += '橋脚ID,鋼矢板天端高(m),計算水位(m),天端余裕高(m),越流判定,安全ステータス\n';
    cofferdamStatuses.forEach((c) => {
      csv += `${c.pierId},${c.topElevationM.toFixed(2)},${c.waterLevelM.toFixed(2)},${c.freeboardM.toFixed(2)},${c.isOvertoppingRisk ? '危険' : '安全'},${c.status}\n`;
    });

    csv += '\nPLATEAU建物ID,建物名称,階数,冬至日影時間(h),日影法定制限(h),日影合致,昼間騒音レベル(dB),騒音環境基準(dB)\n';
    environmentalPoints.forEach((p) => {
      csv += `${p.buildingId},"${p.buildingName}",${p.floors},${p.shadowDurationHours},${p.legalLimitHours},${p.isCompliant ? '適合' : '不適合'},${p.noiseLevelDb},${p.noiseLimitDb}\n`;
    });

    return csv;
  }, [activeScenario, timelineDay, currentDate, isFloodSeason, cofferdamStatuses, environmentalPoints]);

  // 7. LandXML 1.2 出水・環境データ生成
  const generateHydroLandXml = useCallback(() => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2"
         version="1.2"
         date="${new Date().toISOString().split('T')[0]}"
         time="${new Date().toTimeString().split(' ')[0]}"
         readOnly="false"
         language="Japanese"
         project="Kumamoto_Ring_West_Hydro_Environmental_Twin">
  <Project name="Kumamoto_Hydro_Simulation_v5.2"/>
  <Units>
    <Metric areaUnit="squareMeter" linearUnit="meter" volumeUnit="cubicMeter" temperatureUnit="celsius" pressureUnit="HPA"/>
  </Units>
  <HydrologyReport riverName="Midorikawa" scenario="${activeScenario.name}" rainfallMmH="${activeScenario.rainfallMmH}" riverFlowM3s="${activeScenario.riverFlowM3s}">
    <WaterLevel elevationM="${activeScenario.waterElevationM}" flowVelocityMs="${activeScenario.flowVelocityMs}" hwlM="32.40" bridgeClearanceM="2.10"/>
    <Cofferdams>
      ${cofferdamStatuses.map((c) => `<Cofferdam pier="${c.pierId}" topElev="${c.topElevationM}" freeboard="${c.freeboardM}" status="${c.status}"/>`).join('')}
    </Cofferdams>
  </HydrologyReport>
  <EnvironmentalAssessment date="Winter_Solstice_Dec22">
    <PlateauBuildings>
      ${environmentalPoints.map((b) => `<Building id="${b.buildingId}" name="${b.buildingName}" shadowHours="${b.shadowDurationHours}" noiseDb="${b.noiseLevelDb}" compliant="true"/>`).join('')}
    </PlateauBuildings>
  </EnvironmentalAssessment>
</LandXML>`;
  }, [activeScenario, cofferdamStatuses, environmentalPoints]);

  return {
    scenarios,
    activeScenarioId,
    setActiveScenarioId,
    activeScenario,
    timelineDay,
    setTimelineDay,
    isPlaying,
    setIsPlaying,
    currentDate,
    isFloodSeason,
    cofferdamStatuses,
    environmentalPoints,
    activeTab,
    setActiveTab,
    auditItems,
    generateHydroCsv,
    generateHydroLandXml,
  };
};
