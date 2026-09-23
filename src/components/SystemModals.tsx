import React from 'react';
import { X, CheckCircle2, AlertCircle, Activity, ShieldCheck, Terminal } from 'lucide-react';
import { SkillExecutionLog, InvariantTestResult } from '../types';

interface SystemModalsProps {
  modalType: 'none' | 'log' | 'health';
  onClose: () => void;
  logs: SkillExecutionLog[];
  verificationResults: InvariantTestResult[];
}

export const SystemModals: React.FC<SystemModalsProps> = ({
  modalType,
  onClose,
  logs,
  verificationResults,
}) => {
  if (modalType === 'none') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col font-mono text-[11px] text-[#f0f6fc]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2">
            {modalType === 'log' ? (
              <>
                <Terminal className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-bold">Live Skill Execution & Invariant Verification Logs</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-[#10b981]" />
                <span className="font-bold">System Health & Engineering Compliance Diagnostics</span>
              </>
            )}
          </div>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#f0f6fc]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {modalType === 'log' ? (
            <div className="space-y-3">
              <div className="text-[10px] text-[#8b949e]">
                Skill-based Action Architecture により、全UI・AI操作が不変条件テスト（Invariant Test）と共に監査記録されています。
              </div>
              {logs.map((log, logIdx) => (
                <div key={`${log.id}-${logIdx}`} className="bg-[#0d1117] border border-[#30363d] rounded p-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#38bdf8] font-bold">[{log.timestamp}] {log.skillName}</span>
                    <span className="text-[#10b981] bg-[#10b981]/10 px-1 rounded font-bold">{log.status}</span>
                  </div>
                  <div className="text-[10px] text-[#8b949e]">
                    Params: <code className="text-[#f0f6fc]">{JSON.stringify(log.params)}</code>
                  </div>
                  <div className="border-t border-[#21262d] pt-1 mt-1 space-y-0.5">
                    {log.testResults.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[9px]">
                        {t.passed ? (
                          <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-[#f43f5e]" />
                        )}
                        <span className={t.passed ? 'text-[#10b981]' : 'text-[#f43f5e]'}>{t.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  <div className="text-[#6e7681] text-[9px]">Vulkan Engine</div>
                  <div className="text-sm font-bold text-[#10b981]">60.0 FPS</div>
                </div>
                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  <div className="text-[#6e7681] text-[9px]">VRAM Allocation</div>
                  <div className="text-sm font-bold text-[#38bdf8]">6.8 / 24.0 GB</div>
                </div>
                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                  <div className="text-[#6e7681] text-[9px]">QGIS Sync Latency</div>
                  <div className="text-sm font-bold text-[#10b981]">2.1 ms</div>
                </div>
              </div>

              <div className="border border-[#30363d] rounded p-2 bg-[#0d1117] space-y-2">
                <div className="text-xs font-bold text-[#f0f6fc] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                  エンジニアリング自己整合性テスト (Hooks Invariants)
                </div>
                <div className="space-y-1">
                  {verificationResults.map((test, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-[#161b22] rounded border border-[#21262d] text-[10px]"
                    >
                      <div className="flex items-center gap-1.5">
                        {test.status === 'PASS' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-[#f43f5e]" />
                        )}
                        <span>{test.name}</span>
                      </div>
                      <span className="text-[#8b949e]">{test.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#30363d] bg-[#0d1117] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#21262d] hover:bg-[#2d333b] text-[#f0f6fc] px-3 py-1 rounded text-xs transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
