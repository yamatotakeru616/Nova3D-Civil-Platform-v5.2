import React, { useState, useRef } from 'react';
import {
  FolderKanban,
  Plus,
  Download,
  Upload,
  Copy,
  Trash2,
  CheckCircle2,
  X,
  Compass,
  Building,
  Mountain,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCcw,
  FileCode,
  Tag
} from 'lucide-react';
import { CivilProject } from '../types';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: CivilProject;
  projects: CivilProject[];
  onSwitchProject: (id: string) => void;
  onCreateProject: (data: Partial<CivilProject>) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onExportProjectJson: (id: string) => void;
  onExportAllProjectsJson: () => void;
  onImportProjectJson: (jsonStr: string) => boolean;
  onResetPresets: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  projects,
  onSwitchProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onExportProjectJson,
  onExportAllProjectsJson,
  onImportProjectJson,
  onResetPresets
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 新規作成フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    routeCode: 'R001-NEW',
    roadClass: '第3種第1級',
    designSpeed: 60,
    totalLengthKm: 15.0,
    crs: 'JGD2011 / Zone IX',
    estimatedCostBillionYen: 32.0,
    description: '',
    majorBridgeName: '新規河川渡河橋 (全長220m)',
    majorTunnelName: 'なし'
  });

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('プロジェクト名を入力してください。');
      return;
    }

    onCreateProject({
      name: formData.name.trim(),
      routeCode: formData.routeCode.trim(),
      roadClass: formData.roadClass,
      designSpeed: Number(formData.designSpeed),
      totalLengthKm: Number(formData.totalLengthKm),
      crs: formData.crs,
      estimatedCostBillionYen: Number(formData.estimatedCostBillionYen),
      description: formData.description.trim() || `${formData.name}の道路幾何・構造・土工・環境統合設計プロジェクト`,
      structuralFeatures: {
        bridgeCount: 2,
        tunnelCount: formData.majorTunnelName !== 'なし' ? 1 : 0,
        majorBridgeName: formData.majorBridgeName,
        majorTunnelName: formData.majorTunnelName
      },
      tags: ['新規作成', formData.roadClass, `${formData.designSpeed}km/h`]
    });

    setIsCreating(false);
    showNotification(`新規プロジェクト「${formData.name}」を作成し、作業対象に設定しました。`);
    // 作成完了時にモーダルを閉じてワークスペースへ
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const ok = onImportProjectJson(content);
        if (ok) {
          showNotification(`プロジェクトデータ「${file.name}」を正常にインポートしました。`);
        } else {
          alert('ファイルの形式が正しくありません。有効な .novaproject.json または バックアップJSON を選択してください。');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold text-[#f0f6fc]">
                  道路設計プロジェクトマネージャー (Project DB)
                </h2>
                <span className="text-[10px] bg-[#38bdf8]/20 text-[#38bdf8] px-1.5 py-0.5 rounded font-bold">
                  {projects.length} 件管理中
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#8b949e]">
                複数路線の線形・橋梁・トンネル・土工・水文環境データを独立管理・高速スイッチング
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="px-5 py-2.5 bg-[#10b981]/15 border-b border-[#10b981]/40 text-[#10b981] flex items-center gap-2 font-mono text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 bg-[#161b22]/50 border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="bg-[#38bdf8] text-[#090d13] hover:bg-[#7bd0ff] px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-all shadow active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'フォームを閉じる' : '新規プロジェクト作成'}</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>JSONインポート</span>
            </button>
            <button
              onClick={onExportAllProjectsJson}
              className="bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
              title="管理中の全プロジェクトを1つのJSONファイルにバックアップ保存"
            >
              <Download className="w-3.5 h-3.5 text-[#10b981]" />
              <span>全DBバックアップ</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm('プリセットの初期プロジェクト状態（熊本西道路・阿蘇山麓・有明海沿岸）に初期化しますか？')) {
                onResetPresets();
                showNotification('初期プリセットにリセットしました。');
              }
            }}
            className="text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] px-2.5 py-1 rounded flex items-center gap-1 text-[11px] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>プリセット復帰</span>
          </button>
        </div>

        {/* Main Body (Create Form or Project List) */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-[12px] flex-1">
          {/* New Project Wizard Form (Expandable) */}
          {isCreating && (
            <form
              onSubmit={handleCreateSubmit}
              className="p-4 bg-[#161b22] border border-[#38bdf8]/40 rounded-lg space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <span className="text-xs font-bold text-[#38bdf8] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  新規道路プロジェクト基本仕様の入力 (New Corridor Setup)
                </span>
                <span className="text-[10px] text-[#8b949e]">道路構造令 自動整合チェック適用</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">プロジェクト名称 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 熊本東部インター線 バイパス"
                    className="w-full bg-[#090d13] border border-[#30363d] rounded px-2.5 py-1.5 text-[#f0f6fc] focus:border-[#38bdf8] outline-none text-xs"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">路線番号 / 路線コード</label>
                  <input
                    type="text"
                    placeholder="例: R003-BP"
                    className="w-full bg-[#090d13] border border-[#30363d] rounded px-2.5 py-1.5 text-[#f0f6fc] focus:border-[#38bdf8] outline-none text-xs"
                    value={formData.routeCode}
                    onChange={(e) => setFormData({ ...formData, routeCode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">道路規格 (道路構造令)</label>
                  <select
                    className="w-full bg-[#090d13] border border-[#30363d] rounded px-2.5 py-1.5 text-[#f0f6fc] focus:border-[#38bdf8] outline-none text-xs"
                    value={formData.roadClass}
                    onChange={(e) => setFormData({ ...formData, roadClass: e.target.value })}
                  >
                    <option value="第1種第1級">第1種第1級 (高速自動車国道 平野部)</option>
                    <option value="第1種第2級">第1種第2級 (高速自動車国道 山地部)</option>
                    <option value="第1種第3級">第1種第3級 (一般国道の自動車専用道路)</option>
                    <option value="第2種第1級">第2種第1級 (都市高速道路 主幹線)</option>
                    <option value="第3種第1級">第3種第1級 (地方部の幹線バイパス・平野部)</option>
                    <option value="第3種第2級">第3種第2級 (地方部 準幹線道路)</option>
                    <option value="第4種第1級">第4種第1級 (都市部 幹線道路)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">設計速度 (km/h)</label>
                  <select
                    className="w-full bg-[#090d13] border border-[#30363d] rounded px-2.5 py-1.5 text-[#f0f6fc] focus:border-[#38bdf8] outline-none text-xs"
                    value={formData.designSpeed}
                    onChange={(e) => setFormData({ ...formData, designSpeed: Number(e.target.value) })}
                  >
                    <option value={40}>40 km/h (山岳急峻部・市街部)</option>
                    <option value={50}>50 km/h</option>
                    <option value={60}>60 km/h (標準幹線バイパス)</option>
                    <option value={80}>80 km/h (地域高規格道路)</option>
                    <option value={100}>100 km/h (高速専用線形)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">計画総延長 (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="100.0"
                    className="w-full bg-[#090d13] border border-[#30363d] rounded px-2.5 py-1.5 text-[#f0f6fc] focus:border-[#38bdf8] outline-none text-xs"
                    value={formData.totalLengthKm}
                    onChange={(e) => setFormData({ ...formData, totalLengthKm: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">測地平面直角座標系</label>
                  <select
                    className="w-full bg-[#090d13] border border-[#30363d] rounded px-2.5 py-1.5 text-[#f0f6fc] focus:border-[#38bdf8] outline-none text-xs"
                    value={formData.crs}
                    onChange={(e) => setFormData({ ...formData, crs: e.target.value })}
                  >
                    <option value="JGD2011 / Zone IX">JGD2011 / 第IX系 (熊本・福岡・佐賀・大分・長崎)</option>
                    <option value="JGD2011 / Zone II">JGD2011 / 第II系 (鹿児島・宮崎)</option>
                    <option value="JGD2011 / Zone I">JGD2011 / 第I系 (長崎離島)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">主要渡河・交差橋梁</label>
                  <input
                    type="text"
                    placeholder="例: 白川第2高架橋 (全長280m)"
                    className="w-full bg-[#090d13] border border-[#30363d] rounded px-2.5 py-1.5 text-[#f0f6fc] focus:border-[#38bdf8] outline-none text-xs"
                    value={formData.majorBridgeName}
                    onChange={(e) => setFormData({ ...formData, majorBridgeName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">概算事業費 (億円)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full bg-[#090d13] border border-[#30363d] rounded px-2.5 py-1.5 text-[#f0f6fc] focus:border-[#38bdf8] outline-none text-xs"
                    value={formData.estimatedCostBillionYen}
                    onChange={(e) => setFormData({ ...formData, estimatedCostBillionYen: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded transition-colors text-xs"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] font-bold rounded flex items-center gap-1.5 transition-colors text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  プロジェクトを作成して開く
                </button>
              </div>
            </form>
          )}

          {/* Project List Cards */}
          <div className="space-y-3">
            {projects.map((proj) => {
              const isActive = proj.id === activeProject.id;
              return (
                <div
                  key={proj.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-[#161b22] border-[#38bdf8] shadow-md shadow-[#38bdf8]/10 ring-1 ring-[#38bdf8]/40'
                      : 'bg-[#090d13] border-[#30363d] hover:border-[#484f58]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#30363d]">
                    <div
                      className="flex items-center gap-2.5 cursor-pointer flex-1"
                      onClick={() => {
                        if (!isActive) {
                          onSwitchProject(proj.id);
                          onClose();
                        }
                      }}
                      title={isActive ? '作業中プロジェクト' : 'クリックしてこのプロジェクトを開く'}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isActive ? 'bg-[#38bdf8] animate-pulse' : 'bg-[#6e7681]'
                        }`}
                      />
                      <span className="text-sm font-bold text-[#f0f6fc] hover:text-[#38bdf8] transition-colors">
                        {proj.name}
                      </span>
                      <span className="text-[10px] bg-[#21262d] border border-[#30363d] text-[#38bdf8] px-1.5 py-0.5 rounded font-bold">
                        {proj.routeCode}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-[#38bdf8]/20 text-[#38bdf8] px-2 py-0.5 rounded-full font-bold border border-[#38bdf8]/40">
                          ● 作業中 (ACTIVE)
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {!isActive && (
                        <button
                          onClick={() => {
                            onSwitchProject(proj.id);
                            onClose();
                          }}
                          className="px-3.5 py-1 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] font-bold rounded text-xs flex items-center gap-1 transition-all shadow-sm active:scale-95"
                          title={`「${proj.name}」を開いてワークスペースを表示`}
                        >
                          <span>開く</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onDuplicateProject(proj.id);
                          showNotification(`「${proj.name}」の複製を作成しました。`);
                        }}
                        className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded transition-colors"
                        title="複製 (Clone)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onExportProjectJson(proj.id)}
                        className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded transition-colors"
                        title="単一プロジェクトJSON保存"
                      >
                        <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
                      </button>
                      {projects.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`プロジェクト「${proj.name}」を完全に削除しますか？`)) {
                              onDeleteProject(proj.id);
                              showNotification(`「${proj.name}」を削除しました。`);
                            }
                          }}
                          className="p-1.5 bg-[#21262d] hover:bg-[#f43f5e]/20 text-[#8b949e] hover:text-[#f43f5e] rounded transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Description */}
                  <p className="text-[#8b949e] text-[11px] mt-2 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>

                  {/* Metrics Bento Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 p-2.5 bg-[#0d1117] rounded border border-[#21262d]">
                    <div>
                      <span className="text-[#6e7681] text-[10px] block">道路規格 / 速度:</span>
                      <span className="text-[#f0f6fc] font-bold text-xs">
                        {proj.roadClass} ({proj.designSpeed}km/h)
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6e7681] text-[10px] block">計画総延長:</span>
                      <span className="text-[#f0f6fc] font-bold text-xs">{proj.totalLengthKm} km</span>
                    </div>
                    <div>
                      <span className="text-[#6e7681] text-[10px] block">概算工費:</span>
                      <span className="text-[#10b981] font-bold text-xs">
                        約 {proj.estimatedCostBillionYen} 億円
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6e7681] text-[10px] block">土工マスバランス:</span>
                      <span className="text-[#f59e0b] font-bold text-xs">
                        切 {proj.earthworkSummary.cutM3.toLocaleString()} / 盛 {proj.earthworkSummary.fillM3.toLocaleString()} m³
                      </span>
                    </div>
                  </div>

                  {/* Footer Details */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[10px] text-[#6e7681]">
                    <div className="flex items-center gap-2">
                      <Building className="w-3 h-3 text-[#38bdf8]" />
                      <span>{proj.structuralFeatures.majorBridgeName}</span>
                      {proj.structuralFeatures.majorTunnelName !== 'なし' && (
                        <>
                          <span>•</span>
                          <Mountain className="w-3 h-3 text-[#a855f7]" />
                          <span>{proj.structuralFeatures.majorTunnelName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span>CRS: {proj.crs}</span>
                      <span>最終更新: {proj.updatedAt}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {proj.tags && proj.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {proj.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] text-[9px] border border-[#30363d]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between font-mono text-[11px] text-[#8b949e]">
          <span>
            現在選択中: <strong className="text-[#38bdf8]">{activeProject.name}</strong> ({activeProject.routeCode})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded transition-colors font-bold text-xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
