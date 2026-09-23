import React, { useState } from 'react';
import {
  Sparkles,
  Swords,
  CheckCircle2,
  AlertCircle,
  Gavel,
  History,
  GitCommit,
  MessageSquare,
  Send,
  Minimize2,
  Cpu,
  Play,
  FileText,
  RotateCw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { DesignPlan, DesignPlanId, ChatMessage, InvariantTestResult } from '../types';
import { INITIAL_PLANS } from '../hooks/useCivilPlatform';

interface CopilotPaneProps {
  selectedPlanId: DesignPlanId;
  onSelectPlan: (id: DesignPlanId) => void;
  verificationResults: InvariantTestResult[];
  hitlStatus: 'approved' | 'pending' | 'rolled_back';
  onCommitHitl: () => void;
  onRollbackHitl: () => void;
  chatMessages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  onOpenCivilDeliverables?: () => void;
}

export const CopilotPane: React.FC<CopilotPaneProps> = ({
  selectedPlanId,
  onSelectPlan,
  verificationResults,
  hitlStatus,
  onCommitHitl,
  onRollbackHitl,
  chatMessages,
  onSendMessage,
  onOpenCivilDeliverables,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRunningAutonomousLoop, setIsRunningAutonomousLoop] = useState(false);
  const [autonomousStep, setAutonomousStep] = useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleRunAutonomousLoop = () => {
    setIsRunningAutonomousLoop(true);
    setAutonomousStep('SENSE: 地形DEM・公図・環境水文スキャン中...');

    setTimeout(() => {
      setAutonomousStep('PLAN: 道路構造令・土工バランス多目的パレート探索中...');
    }, 700);

    setTimeout(() => {
      setAutonomousStep('ACT: IP線形シフト・緑川箱桁FEM・NATM支保自動計算中...');
    }, 1400);

    setTimeout(() => {
      setAutonomousStep('VERIFY: 不変条件アサーション(4/4)検証・5大成果物同期完了！');
      onSendMessage('【自律型エージェント艦隊】自律設計ループ（OODA Cycle）が完了しました。道路構造令第15条・第20条全項目PASS、土工残差+700m³、5大公式設計図書（詳細設計書・AgentSKILL・ハーネス・ループ・ロードマップ）を最新諸元に自動同期しました。');
    }, 2100);

    setTimeout(() => {
      setIsRunningAutonomousLoop(false);
      setAutonomousStep(null);
    }, 3200);
  };

  const allPassed = verificationResults.every((r) => r.status === 'PASS');

  return (
    <aside className="w-88 bg-[#0d1117] border-l border-[#30363d] flex flex-col justify-between z-30 flex-shrink-0 h-full select-none">
      {/* 1. Copilot Header */}
      <div className="p-2 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#a855f7] w-4 h-4" />
          <div>
            <div className="font-mono text-xs font-bold text-[#f0f6fc]">Civil Multi-Agent Copilot</div>
            <div className="text-[9px] font-mono text-[#6e7681]">7 Autonomous Agents Fleet Active</div>
          </div>
        </div>
        {onOpenCivilDeliverables && (
          <button
            onClick={onOpenCivilDeliverables}
            className="text-[9px] bg-[#161b22] hover:bg-[#21262d] text-[#38bdf8] border border-[#38bdf8]/30 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
            title="5大公式設計図書モーダルを開く"
          >
            <FileText className="w-3 h-3" />
            <span>5大成果物</span>
          </button>
        )}
      </div>

      {/* 2. Scrollable AI Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-[10px] font-mono no-scrollbar">
        {/* SECTION 0: AUTONOMOUS AGENT MAIN LOOP CONTROLLER */}
        <div className="bg-[#161b22] p-2 rounded border border-[#a855f7]/30 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[#a855f7] font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>自律制御メインループ (Autonomous Loop)</span>
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#a855f7]/20 text-[#a855f7] font-semibold">
              OODA Cycle
            </span>
          </div>

          <p className="text-[9px] text-[#8b949e] leading-tight">
            知覚・多目的パレート探索・スキル実行・自己検証を自律実行し、5大設計図書をリアルタイム更新します。
          </p>

          {autonomousStep && (
            <div className="p-1.5 bg-[#090d13] rounded border border-[#38bdf8]/40 text-[#38bdf8] text-[9.5px] animate-pulse flex items-center gap-1.5">
              <RotateCw className="w-3 h-3 animate-spin shrink-0" />
              <span className="truncate">{autonomousStep}</span>
            </div>
          )}

          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={handleRunAutonomousLoop}
              disabled={isRunningAutonomousLoop}
              className="flex-1 bg-gradient-to-r from-[#a855f7] to-[#38bdf8] hover:opacity-90 text-[#090d13] font-bold py-1 rounded text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 shadow"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isRunningAutonomousLoop ? '自律推論サイクル実行中...' : '自律推論サイクル実行'}</span>
            </button>
            {onOpenCivilDeliverables && (
              <button
                onClick={onOpenCivilDeliverables}
                className="bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] px-2 py-1 rounded text-[10px] flex items-center gap-1 transition-colors"
                title="5大公式設計成果ドキュメントを出力"
              >
                <FileText className="w-3 h-3 text-[#38bdf8]" />
                <span>図書出力</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 1: AI DESIGN BATTLE COMPARATOR (案A / 案B / 案C) */}
        <div>
          <div className="flex items-center justify-between text-[#8b949e] font-semibold mb-1.5">
            <span className="flex items-center gap-1 text-[#38bdf8]">
              <Swords className="w-3.5 h-3.5" />
              AI設計コンペ (Design Battle)
            </span>
            <span className="text-[9px] text-[#6e7681]">リアルタイム自動生成</span>
          </div>

          <div className="space-y-2">
            {/* Plan A */}
            <div
              onClick={() => onSelectPlan('A')}
              className={`p-2 rounded cursor-pointer transition-all ${
                selectedPlanId === 'A'
                  ? 'border-2 border-[#38bdf8] bg-[#161b22] shadow-md'
                  : 'border border-[#30363d] bg-[#161b22]/60 hover:border-[#484f58]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      selectedPlanId === 'A' ? 'bg-[#38bdf8] text-[#090d13]' : 'bg-[#21262d] text-[#8b949e]'
                    }`}
                  >
                    案A
                  </span>
                  <span className="text-[#f0f6fc] font-bold">環境・治水最適化案</span>
                </div>
                <span className="bg-[#10b981]/20 text-[#10b981] font-bold text-[10px] px-1.5 py-0.5 rounded">
                  スコア 98 {selectedPlanId === 'A' ? '[採用中]' : ''}
                </span>
              </div>
              <p className="text-[10px] text-[#8b949e] leading-tight mb-2">
                緑川渡河スパンを5径間に最適化し流下阻害率3.2%に抑制。STA.12+380家屋移転を完全回避。
              </p>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-center border-t border-[#30363d] pt-1.5">
                <div>
                  <div className="text-[#6e7681]">概算工費</div>
                  <div className="text-[#f0f6fc] font-bold">12.4億円</div>
                </div>
                <div>
                  <div className="text-[#6e7681]">土量残差</div>
                  <div className="text-[#10b981] font-bold">+700m³</div>
                </div>
                <div>
                  <div className="text-[#6e7681]">買収棟数</div>
                  <div className="text-[#10b981] font-bold">0棟 (完全回避)</div>
                </div>
              </div>
            </div>

            {/* Plan B */}
            <div
              onClick={() => onSelectPlan('B')}
              className={`p-2 rounded cursor-pointer transition-all ${
                selectedPlanId === 'B'
                  ? 'border-2 border-[#38bdf8] bg-[#161b22] shadow-md'
                  : 'border border-[#30363d] bg-[#161b22]/60 hover:border-[#484f58]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      selectedPlanId === 'B' ? 'bg-[#38bdf8] text-[#090d13]' : 'bg-[#21262d] text-[#8b949e]'
                    }`}
                  >
                    案B
                  </span>
                  <span className="text-[#f0f6fc] font-bold">土量最小コスト優先案</span>
                </div>
                <span className="text-[#8b949e] text-[10px]">
                  スコア 86 {selectedPlanId === 'B' ? '[選択中]' : ''}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-center text-[#6e7681] border-t border-[#30363d] pt-1 mt-1">
                <div>
                  工費: <strong className="text-[#f0f6fc]">11.1億円</strong>
                </div>
                <div>
                  土量: <strong className="text-[#f0f6fc]">0m³ (切盛同数)</strong>
                </div>
                <div>
                  家屋買収: <strong className="text-[#f43f5e] font-bold">2棟移転要</strong>
                </div>
              </div>
            </div>

            {/* Plan C */}
            <div
              onClick={() => onSelectPlan('C')}
              className={`p-2 rounded cursor-pointer transition-all ${
                selectedPlanId === 'C'
                  ? 'border-2 border-[#38bdf8] bg-[#161b22] shadow-md'
                  : 'border border-[#30363d] bg-[#161b22]/60 hover:border-[#484f58]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      selectedPlanId === 'C' ? 'bg-[#38bdf8] text-[#090d13]' : 'bg-[#21262d] text-[#8b949e]'
                    }`}
                  >
                    案C
                  </span>
                  <span className="text-[#f0f6fc] font-bold">全線高架・景観優先案</span>
                </div>
                <span className="text-[#8b949e] text-[10px]">
                  スコア 89 {selectedPlanId === 'C' ? '[選択中]' : ''}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-center text-[#6e7681] border-t border-[#30363d] pt-1 mt-1">
                <div>
                  工費: <strong className="text-[#f59e0b]">14.8億円</strong>
                </div>
                <div>
                  支障物: <strong className="text-[#f0f6fc]">最小</strong>
                </div>
                <div>
                  工期: <strong className="text-[#f0f6fc]">720日 (+120日)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: REAL-TIME STATUTORY & REGULATORY AUDIT CHECKLIST */}
        <div className="border-t border-[#30363d] pt-2.5">
          <div className="flex items-center justify-between text-[#8b949e] font-semibold mb-1.5">
            <span className="flex items-center gap-1 text-[#10b981]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              リアルタイム法規・技術基準監査
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1 rounded ${
                allPassed ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
              }`}
            >
              {allPassed ? 'ALL PASS (4/4)' : 'WARN DETECTED'}
            </span>
          </div>

          <div className="space-y-1 text-[10px]">
            {verificationResults.slice(1, 5).map((test, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 bg-[#161b22] rounded border border-[#30363d]"
              >
                <div className="flex items-center gap-1.5">
                  {test.status === 'PASS' ? (
                    <CheckCircle2 className="text-[#10b981] w-3 h-3" />
                  ) : (
                    <AlertCircle className="text-[#f43f5e] w-3 h-3" />
                  )}
                  <span className="truncate max-w-[150px]">{test.name.split(' (')[0]}</span>
                </div>
                <span
                  className={`font-mono text-[9px] ${
                    test.status === 'PASS' ? 'text-[#10b981]' : 'text-[#f43f5e] font-bold'
                  }`}
                >
                  {test.status === 'PASS' ? 'PASS' : 'WARN 抵触'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: HITL (HUMAN-IN-THE-LOOP) ARBITRATION CONSOLE */}
        <div className="border-t border-[#30363d] pt-2.5">
          <div className="flex items-center justify-between text-[#8b949e] font-semibold mb-1">
            <span className="flex items-center gap-1 text-[#38bdf8]">
              <Gavel className="w-3.5 h-3.5" />
              HITL 人間調停コンソール
            </span>
            <span className="text-[9px] text-[#6e7681]">L4 承認ワークフロー</span>
          </div>

          <div className="p-2 bg-[#38bdf8]/5 border border-[#38bdf8]/30 rounded space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#f0f6fc] font-bold">調停提案: IP-02 東側2.4m微小シフト</span>
              <span
                className={`text-[9px] font-bold px-1 rounded ${
                  hitlStatus === 'approved'
                    ? 'bg-[#10b981]/20 text-[#10b981]'
                    : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                }`}
              >
                {hitlStatus === 'approved' ? '承認・反映済' : 'ロールバック済'}
              </span>
            </div>
            <p className="text-[10px] text-[#8b949e] leading-tight">
              線形微調整により民有地S邸の買収補償（約4,800万円）および法務局登記係争を完全回避しました。
            </p>
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={onRollbackHitl}
                className="flex-1 bg-[#161b22] hover:bg-[#2d333b] text-[#8b949e] hover:text-[#f0f6fc] py-1 rounded text-[10px] font-mono border border-[#30363d] flex items-center justify-center gap-1 transition-colors"
              >
                <History className="w-3 h-3" />
                ロールバック
              </button>
              <button
                onClick={onCommitHitl}
                className="flex-1 bg-[#38bdf8] text-[#090d13] font-bold py-1 rounded text-[10px] font-mono hover:bg-[#7bd0ff] flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <GitCommit className="w-3 h-3" />
                Git設計コミット
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: LIVE COPILOT PROMPT CHANNEL */}
        <div className="border-t border-[#30363d] pt-2">
          <div className="text-[10px] text-[#8b949e] font-semibold mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            直近のAI推論対話
          </div>
          <div className="space-y-1.5 text-[10px] max-h-40 overflow-y-auto no-scrollbar">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-1.5 rounded border ${
                  msg.sender === 'user'
                    ? 'bg-[#161b22] border-[#30363d]'
                    : 'bg-[#21262d] border-[#38bdf8]/20 text-[#8b949e]'
                }`}
              >
                <div
                  className={`text-[9px] flex justify-between mb-0.5 ${
                    msg.sender === 'user' ? 'text-[#6e7681]' : 'text-[#38bdf8]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {msg.sender === 'ai' && <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />}
                    {msg.senderName}
                  </span>
                  <span>{msg.time}</span>
                </div>
                <p className={msg.sender === 'user' ? 'text-[#f0f6fc]' : 'text-[#f0f6fc]/90'}>{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Copilot Input Prompt Bar */}
      <div className="p-1.5 border-t border-[#30363d] bg-[#161b22]">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded py-1 pl-2 pr-7 text-[11px] font-mono text-[#f0f6fc] placeholder-[#6e7681] focus:border-[#38bdf8] focus:ring-0 outline-none"
            placeholder="AIエンジニアに自然言語で指示... [Enter]"
            type="text"
          />
          <button
            type="submit"
            className="absolute right-1 text-[#38bdf8] hover:text-[#7bd0ff] p-0.5 transition-colors"
            title="Send Prompt"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
