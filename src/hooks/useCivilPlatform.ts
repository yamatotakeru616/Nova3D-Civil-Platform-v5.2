import { useState, useCallback, useMemo } from 'react';
import {
  DesignPlan,
  DesignPlanId,
  SpatialConstraint,
  ChatMessage,
  SkillExecutionLog,
  InvariantTestResult,
  IntersectionPoint,
} from '../types';

export const INITIAL_PLANS: Record<DesignPlanId, DesignPlan> = {
  A: {
    id: 'A',
    name: '環境・治水最適化案',
    badge: '案A',
    tagline: '緑川渡河スパンを5径間に最適化し流下阻害率3.2%に抑制。STA.12+380家屋移転を完全回避。',
    description: '自然共生と治水安全度を最大化した標準推奨設計案。',
    score: 98,
    costBillionYen: 12.4,
    cutVolume: 24500,
    fillVolume: 23800,
    balanceVolume: 700,
    landAcquisitionHouses: 0,
    landAcquisitionCostMillionYen: 0,
    workDurationDays: 600,
    durationDeltaDays: 0,
    isAdopted: true,
    co2EmissionsTon: 14.2,
    curveRadius: 280.0,
    gradientPercent: 2.34,
    riverFreeboardM: 2.10,
    riverObstructionRatePercent: 3.2,
    sBuildingClearanceM: 5.12,
    tunnelFs: 1.68,
    averageTransportDistanceM: 480,
  },
  B: {
    id: 'B',
    name: '土量最小コスト優先案',
    badge: '案B',
    tagline: '切土・盛土の完全イコール（切盛同数）を追求。建設発生土場外搬出ゼロ化により工費圧縮。',
    description: 'コスト効率と土工バランスを徹底優先した経済設計案。',
    score: 86,
    costBillionYen: 11.1,
    cutVolume: 21500,
    fillVolume: 21500,
    balanceVolume: 0,
    landAcquisitionHouses: 2,
    landAcquisitionCostMillionYen: 96,
    workDurationDays: 540,
    durationDeltaDays: -60,
    isAdopted: false,
    co2EmissionsTon: 11.8,
    curveRadius: 240.0,
    gradientPercent: 3.85,
    riverFreeboardM: 1.85,
    riverObstructionRatePercent: 4.1,
    sBuildingClearanceM: 3.40,
    tunnelFs: 1.55,
    averageTransportDistanceM: 320,
  },
  C: {
    id: 'C',
    name: '全線高架・景観優先案',
    badge: '案C',
    tagline: '市街地〜渡河部を高架橋で通過。自然改変・地盤掘削を最小限に抑え工期・景観保全を重視。',
    description: '支障物回避・将来維持管理性を高めたプレストレスト高架橋案。',
    score: 89,
    costBillionYen: 14.8,
    cutVolume: 8200,
    fillVolume: 7600,
    balanceVolume: 600,
    landAcquisitionHouses: 0,
    landAcquisitionCostMillionYen: 0,
    workDurationDays: 720,
    durationDeltaDays: 120,
    isAdopted: false,
    co2EmissionsTon: 18.5,
    curveRadius: 350.0,
    gradientPercent: 1.80,
    riverFreeboardM: 3.20,
    riverObstructionRatePercent: 2.1,
    sBuildingClearanceM: 7.80,
    tunnelFs: 1.82,
    averageTransportDistanceM: 210,
  },
};

export const INITIAL_CONSTRAINTS: SpatialConstraint[] = [
  {
    id: 'river-midori',
    category: '一級河川水系',
    name: '一級河川水系 (緑川)',
    statusBadge: 'Auto Bridge OK',
    statusColor: 'green',
    checked: true,
    metrics: [
      { label: 'HWL 計画高水位', value: 'EL+14.20m' },
      { label: '桁下余裕高 H_free', value: '2.10m (>1.50m)', pass: true },
      { label: '流下阻害率', value: '3.2% (基準<5%)', pass: true },
    ],
  },
  {
    id: 'mountain-kinpo',
    category: '尾根急峻地形',
    name: '金峰山 尾根急峻地形',
    statusBadge: 'Auto Tunnel OK',
    statusColor: 'amber',
    checked: true,
    metrics: [
      { label: '最大土被り H_cover', value: '42.0m (STA.18+600)' },
      { label: '坑口斜面安定度 Fs', value: '1.68 (>1.50)', pass: true },
      { label: '工法判定', value: 'NATM DII/DIII', highlight: true },
    ],
  },
  {
    id: 'agri-culvert',
    category: '農業用水路',
    name: '農業用水路交差',
    statusBadge: 'Pass 129%',
    statusColor: 'green',
    checked: true,
    metrics: [
      { label: '構造形式', value: 'RC Box 3.5×3.0m' },
      { label: '通水能余裕高', value: '+0.85m', pass: true },
    ],
  },
  {
    id: 'plateau-buildings',
    category: 'PLATEAU 3Dモデル',
    name: 'PLATEAU LOD2 建物群',
    statusBadge: '離隔解消済',
    statusColor: 'green',
    checked: true,
    metrics: [
      { label: 'STA.12+380 S邸離隔', value: '5.12m (>5.0m)', pass: true },
      { label: '買収対象家屋数', value: '0棟 (完全回避)', pass: true },
    ],
  },
  {
    id: 'cadastral-parcels',
    category: '公図・地番',
    name: '法務省公図・地番',
    statusBadge: '14筆 3,420m²',
    statusColor: 'gray',
    checked: true,
    metrics: [
      { label: '民有地買収概算', value: '¥3.12億' },
      { label: '境界確定ステータス', value: '合意取得中', highlight: true },
    ],
  },
  {
    id: 'utility-water',
    category: '地下埋設管',
    name: '地下埋設上水道φ600',
    statusBadge: 'PASS',
    statusColor: 'green',
    checked: true,
    metrics: [
      { label: '最小土被り', value: '1.60m (>1.20m)', pass: true },
    ],
  },
];

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: '1',
    sender: 'user',
    senderName: 'ユーザー (chief_engineer)',
    time: '14:22',
    content: 'STA.15付近の切土法面勾配を1:1.2に緩和した場合の土量影響と工費試算を出して',
  },
  {
    id: '2',
    sender: 'ai',
    senderName: 'Civil Agent Fleet',
    time: '14:23',
    content: '切土量が+1,420m³増加、残差+2,120m³となり場外搬出費180万円が追加発生します。抑止杭併用の1:1.0工法（案A準拠）がライフサイクルコスト最小です。',
  },
];

let globalLogCounter = 0;

export function useCivilPlatform() {
  const [selectedPlanId, setSelectedPlanId] = useState<DesignPlanId>('A');
  const [activeStation, setActiveStation] = useState<number>(15200); // STA.15+200
  const [constraints, setConstraints] = useState<SpatialConstraint[]>(INITIAL_CONSTRAINTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [hitlStatus, setHitlStatus] = useState<'approved' | 'pending' | 'rolled_back'>('approved');
  const [cutSlopeRatio, setCutSlopeRatio] = useState<number>(1.0); // 1:1.0 or 1:1.2
  const [viewportMode, setViewportMode] = useState<'3d' | '2d' | 'dual'>('3d');
  const [timelineDay, setTimelineDay] = useState<number>(185);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(false);
  const [systemModalOpen, setSystemModalOpen] = useState<'none' | 'log' | 'health'>('none');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDomain, setActiveDomain] = useState<string>('Road');

  const [plans, setPlans] = useState<Record<DesignPlanId, DesignPlan>>(INITIAL_PLANS);

  const [executionLogs, setExecutionLogs] = useState<SkillExecutionLog[]>([
    {
      id: 'log-init',
      timestamp: '14:20:01',
      skillName: 'skill.initialize_corridor',
      params: { corridor: 'Corridor-A1', crs: 'JGD2011/Zone-IX' },
      status: 'SUCCESS',
      testResults: [
        { testName: 'MassBalanceConservation', passed: true, message: 'Cut (24500) - Fill (23800) == Balance (700)' },
        { testName: 'RoadDesignOrdinance_R_Min', passed: true, message: 'R=280m >= 120m PASS' },
        { testName: 'RiverAct_Freeboard', passed: true, message: 'H=2.10m >= 1.50m PASS' },
      ],
    },
  ]);

  const currentPlan = plans[selectedPlanId];

  // Self-verification / Invariant assertions logic
  const runSelfVerification = useCallback((plan: DesignPlan): InvariantTestResult[] => {
    const results: InvariantTestResult[] = [];

    // Test 1: Earthwork Mass Conservation
    const massDiff = Math.abs((plan.cutVolume - plan.fillVolume) - plan.balanceVolume);
    results.push({
      name: '土工土量保存則テスト (Mass Conservation)',
      status: massDiff < 0.001 ? 'PASS' : 'FAIL',
      detail: `切土(${plan.cutVolume}) - 盛土(${plan.fillVolume}) = 残差(${plan.balanceVolume})m³`,
    });

    // Test 2: Road Ordinance R_min (>= 120m for Class 3)
    results.push({
      name: '道路構造令第3条 (最小曲線半径 R >= 120m)',
      status: plan.curveRadius >= 120 ? 'PASS' : 'FAIL',
      detail: `現行曲線半径 R=${plan.curveRadius.toFixed(1)}m (基準: 120.0m)`,
    });

    // Test 3: Road Ordinance Longitudinal Gradient (<= 5.0%)
    results.push({
      name: '道路構造令第20条 (縦断勾配 i <= 5.0%)',
      status: plan.gradientPercent <= 5.0 ? 'PASS' : 'FAIL',
      detail: `現行最急勾配 i=+${plan.gradientPercent.toFixed(2)}% (制限値: 5.0%)`,
    });

    // Test 4: River Act Freeboard (>= 1.50m)
    results.push({
      name: '河川法第20条 (HWL余裕高 H >= 1.50m)',
      status: plan.riverFreeboardM >= 1.50 ? 'PASS' : 'FAIL',
      detail: `緑川渡河部 桁下余裕高 H=${plan.riverFreeboardM.toFixed(2)}m (基準: 1.50m)`,
    });

    // Test 5: PLATEAU Building Clearance (>= 5.00m)
    results.push({
      name: '建築基準・離隔条例 (敷地離隔 >= 5.00m)',
      status: plan.sBuildingClearanceM >= 5.00 ? 'PASS' : 'FAIL',
      detail: `STA.12+380 S邸敷地離隔 D=${plan.sBuildingClearanceM.toFixed(2)}m (基準: 5.00m)`,
    });

    // Test 6: Tunnel Portal Slope Stability (Fs >= 1.50)
    results.push({
      name: 'トンネル標準示方書 (坑口斜面安定 Fs >= 1.50)',
      status: plan.tunnelFs >= 1.50 ? 'PASS' : 'FAIL',
      detail: `金峰山東坑口 安全率 Fs=${plan.tunnelFs.toFixed(2)} (所要: 1.50)`,
    });

    return results;
  }, []);

  const currentVerificationResults = useMemo(() => {
    return runSelfVerification(currentPlan);
  }, [currentPlan, runSelfVerification]);

  // Skill Execution Engine
  const executeSkill = useCallback((skillName: string, params: Record<string, unknown>) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const isSuccess = true;
    let newPlanId = selectedPlanId;

    if (skillName === 'skill.select_design_plan') {
      const planId = params.planId as DesignPlanId;
      newPlanId = planId;
      setSelectedPlanId(planId);
    } else if (skillName === 'skill.shift_alignment') {
      setHitlStatus('approved');
    } else if (skillName === 'skill.recalculate_earthwork') {
      const slope = params.cutSlopeRatio as number || 1.2;
      setCutSlopeRatio(slope);
    } else if (skillName === 'skill.seek_station') {
      const sta = params.station as number;
      setActiveStation(sta);
    } else if (skillName === 'skill.rollback_hitl') {
      setHitlStatus('rolled_back');
    } else if (skillName === 'skill.commit_hitl') {
      setHitlStatus('approved');
    }

    const testPlan = INITIAL_PLANS[newPlanId];
    const tests = runSelfVerification(testPlan).map(t => ({
      testName: t.name,
      passed: t.status === 'PASS',
      message: `${t.status}: ${t.detail}`,
    }));

    const logEntry: SkillExecutionLog = {
      id: `log-${Date.now()}-${++globalLogCounter}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp,
      skillName,
      params,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      testResults: tests,
    };

    setExecutionLogs(prev => [logEntry, ...prev]);
  }, [selectedPlanId, runSelfVerification]);

  // Public Action Skill Callbacks
  const selectPlanSkill = useCallback((planId: DesignPlanId) => {
    executeSkill('skill.select_design_plan', { planId });
  }, [executeSkill]);

  const seekStationSkill = useCallback((staNumber: number) => {
    executeSkill('skill.seek_station', { station: staNumber });
  }, [executeSkill]);

  const toggleLayerSkill = useCallback((layerId: string) => {
    setConstraints(prev =>
      prev.map(c => (c.id === layerId ? { ...c, checked: !c.checked } : c))
    );
    executeSkill('skill.toggle_spatial_layer', { layerId });
  }, [executeSkill]);

  const commitHitlSkill = useCallback(() => {
    executeSkill('skill.commit_hitl', { commitMessage: 'IP-02 東側2.4m微小シフト承認 & 登記保全' });
  }, [executeSkill]);

  const rollbackHitlSkill = useCallback(() => {
    executeSkill('skill.rollback_hitl', { targetRevision: 'REV-01.04' });
  }, [executeSkill]);

  const triggerEarthworkRecalcSkill = useCallback(() => {
    const nextSlope = cutSlopeRatio === 1.0 ? 1.2 : 1.0;
    executeSkill('skill.recalculate_earthwork', { cutSlopeRatio: nextSlope });
    
    const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'ai',
        senderName: 'Civil Agent Fleet',
        time: timeStr,
        content: nextSlope === 1.2
          ? `法面勾配を1:1.2に緩和再計算しました。切土量+1,420m³増加。案Aの1:1.0抑止杭工法との比較グラフを更新しました。`
          : `法面勾配を1:1.0（標準抑止杭併用）に再設定しました。土量残差は+700m³の場内流用可能範囲に収束しました。`,
      }
    ]);
  }, [cutSlopeRatio, executeSkill]);

  const sendUserPromptSkill = useCallback((promptText: string) => {
    if (!promptText.trim()) return;
    const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      senderName: 'ユーザー (chief_engineer)',
      time: timeStr,
      content: promptText,
    };
    setChatMessages(prev => [...prev, userMsg]);

    executeSkill('skill.submit_natural_language_prompt', { prompt: promptText });

    setTimeout(() => {
      let aiReply = 'ご指示の内容を解析しました。現行線形パラメータおよび法規チェックを自動更新しました。';
      if (promptText.includes('案B') || promptText.includes('コスト')) {
        selectPlanSkill('B');
        aiReply = '案B（土量最小コスト優先案）に切り替えました。土量残差は0m³となりますが、S邸離隔が3.40mとなり家屋買収2棟が必要です。';
      } else if (promptText.includes('案C') || promptText.includes('景観') || promptText.includes('高架')) {
        selectPlanSkill('C');
        aiReply = '案C（全線高架・景観優先案）に切り替えました。環境負荷は最小ですが工費は14.8億円（+2.4億円）となります。';
      } else if (promptText.includes('案A') || promptText.includes('戻') || promptText.includes('標準')) {
        selectPlanSkill('A');
        aiReply = '案A（環境・治水最適化案）を再適用しました。流下阻害率3.2%・離隔5.12mで全基準適合です。';
      } else if (promptText.includes('勾配') || promptText.includes('法面')) {
        triggerEarthworkRecalcSkill();
        aiReply = '切土法面勾配パラメータを再計算しました。抑止工併用断面のマスカーブを再プロットしました。';
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          senderName: 'Civil Agent Fleet',
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          content: aiReply,
        }
      ]);
    }, 450);
  }, [executeSkill, selectPlanSkill, triggerEarthworkRecalcSkill]);

  const updateAlignmentFromIpsSkill = useCallback((
    updatedIps: IntersectionPoint[],
    delta?: { dx: number; dy: number; cutDelta: number; fillDelta: number }
  ) => {
    setPlans(prev => {
      const current = prev[selectedPlanId];
      const primaryIp = updatedIps.find(ip => ip.id === 'IP-02') || updatedIps[0];
      const newRadius = primaryIp?.radius ?? current.curveRadius;
      
      const cutDelta = delta ? delta.cutDelta : Math.round(((primaryIp?.y ?? 190) - 190) * 12);
      const fillDelta = delta ? delta.fillDelta : Math.round((190 - (primaryIp?.y ?? 190)) * 10);
      
      const newCut = Math.max(8000, current.cutVolume + cutDelta);
      const newFill = Math.max(7000, current.fillVolume + fillDelta);
      const newBalance = newCut - newFill;
      
      // S邸離隔（STA.12+380）の近傍変位連動
      const clearanceShift = delta ? delta.dy * 0.05 : ((primaryIp?.y ?? 190) - 190) * 0.04;
      const newClearance = Number(Math.max(2.5, current.sBuildingClearanceM + clearanceShift).toFixed(2));

      const updatedPlan: DesignPlan = {
        ...current,
        curveRadius: newRadius,
        cutVolume: newCut,
        fillVolume: newFill,
        balanceVolume: newBalance,
        sBuildingClearanceM: newClearance,
      };

      return {
        ...prev,
        [selectedPlanId]: updatedPlan,
      };
    });

    executeSkill('skill.update_alignment_on_drag_end', {
      ipCount: updatedIps.length,
      primaryIp: updatedIps[0]?.id,
      timestamp: Date.now(),
    });
  }, [selectedPlanId, executeSkill]);

  return {
    selectedPlanId,
    currentPlan,
    activeStation,
    constraints,
    chatMessages,
    hitlStatus,
    cutSlopeRatio,
    viewportMode,
    setViewportMode,
    timelineDay,
    setTimelineDay,
    isTimelinePlaying,
    setIsTimelinePlaying,
    executionLogs,
    currentVerificationResults,
    systemModalOpen,
    setSystemModalOpen,
    searchQuery,
    setSearchQuery,
    activeDomain,
    setActiveDomain,
    // Skills
    selectPlanSkill,
    seekStationSkill,
    toggleLayerSkill,
    commitHitlSkill,
    rollbackHitlSkill,
    triggerEarthworkRecalcSkill,
    sendUserPromptSkill,
    updateAlignmentFromIpsSkill,
  };
}
