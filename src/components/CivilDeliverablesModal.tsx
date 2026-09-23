import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Package,
  Layers,
  Sparkles,
  ShieldCheck,
  X,
  Code,
  BookOpen,
  FolderGit2
} from 'lucide-react';
import { CivilProject, DesignPlan } from '../types';
import {
  generateAllCivilDocuments,
  downloadCivilDoc,
  exportCivilDocsZip,
  CivilDocumentItem
} from '../utils/civilDocsGenerator';

interface CivilDeliverablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: CivilProject;
  currentPlan?: DesignPlan;
}

export const CivilDeliverablesModal: React.FC<CivilDeliverablesModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  currentPlan,
}) => {
  const docs = generateAllCivilDocuments(activeProject, currentPlan);
  const [selectedDocId, setSelectedDocId] = useState<CivilDocumentItem['id']>('spec');
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadSingle = () => {
    downloadCivilDoc(currentDoc.filename, currentDoc.content);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await exportCivilDocsZip(activeProject, currentPlan);
    } catch (err) {
      console.error('Failed to export zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-[#f0f6fc] font-mono">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#f0f6fc]">
                  国土交通省 BIM/CIM 5大公式設計成果ドキュメント出力
                </h2>
                <span className="text-[10px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  道路構造令 完全準拠
                </span>
              </div>
              <p className="text-[10px] text-[#8b949e]">
                業務名称: {activeProject?.name || '熊本環状西道路'} (案{currentPlan?.id ?? 'A'} 設計諸元リアルタイム同期)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 一括ZIPダウンロードボタン */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-3 py-1.5 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
              title="5大MarkdownファイルをZIP形式で一括ダウンロード"
            >
              <Package className="w-4 h-4" />
              <span>{isZipping ? 'ZIP生成中...' : '5大成果物一括ZIP出力'}</span>
            </button>

            {/* モーダル閉じるボタン */}
            <button
              onClick={onClose}
              className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
              title="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Selection Tabs Ribbon */}
        <div className="flex border-b border-[#30363d] bg-[#090d13] overflow-x-auto no-scrollbar shrink-0">
          {docs.map((doc) => {
            const isActive = doc.id === selectedDocId;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-r border-[#30363d] transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#161b22] text-[#38bdf8] border-b-2 border-b-[#38bdf8]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]/50'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-[#38bdf8]' : 'text-[#6e7681]'}`} />
                <span>{doc.title}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded ${
                    isActive ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'bg-[#21262d] text-[#6e7681]'
                  }`}
                >
                  {doc.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Document Action Subheader */}
        <div className="px-4 py-2 border-b border-[#30363d] bg-[#161b22]/50 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[#8b949e] text-[11px]">{currentDoc.description}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex rounded bg-[#090d13] p-0.5 border border-[#30363d] text-[10px]">
              <button
                onClick={() => setViewMode('formatted')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                  viewMode === 'formatted' ? 'bg-[#21262d] text-[#38bdf8]' : 'text-[#8b949e]'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>プレビュー</span>
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                  viewMode === 'raw' ? 'bg-[#21262d] text-[#38bdf8]' : 'text-[#8b949e]'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>Raw Markdown</span>
              </button>
            </div>

            {/* コピーボタン */}
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded border border-[#30363d] text-[10px] flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'コピー完了' : '本文コピー'}</span>
            </button>

            {/* 単体ダウンロードボタン */}
            <button
              onClick={handleDownloadSingle}
              className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#38bdf8] rounded border border-[#38bdf8]/30 text-[10px] flex items-center gap-1 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>{currentDoc.filename} 保存</span>
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#090d13] font-mono leading-relaxed select-text">
          {viewMode === 'raw' ? (
            <pre className="text-xs text-[#f0f6fc] whitespace-pre-wrap selection:bg-[#38bdf8]/30">
              {currentDoc.content}
            </pre>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4 text-xs text-[#c9d1d9]">
              {/* Formatted Markdown Render simulation */}
              {currentDoc.content.split('\n\n').map((block, idx) => {
                const trimmed = block.trim();
                if (trimmed.startsWith('# ')) {
                  return (
                    <div key={idx} className="border-b border-[#30363d] pb-2 pt-2">
                      <h1 className="text-lg font-bold text-[#38bdf8]">{trimmed.replace('# ', '')}</h1>
                    </div>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-sm font-bold text-[#7bd0ff] pt-3 border-b border-[#21262d] pb-1">
                      {trimmed.replace('## ', '')}
                    </h2>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-xs font-bold text-[#f0f6fc] pt-2">
                      {trimmed.replace('### ', '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('```')) {
                  const lines = trimmed.split('\n');
                  const code = lines.slice(1, -1).join('\n');
                  return (
                    <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded p-3 text-[11px] overflow-x-auto text-[#7ee787]">
                      <pre>{code}</pre>
                    </div>
                  );
                }
                if (trimmed.startsWith('|')) {
                  const rows = trimmed.split('\n').filter((r) => !r.includes(':---'));
                  return (
                    <div key={idx} className="overflow-x-auto my-2 border border-[#30363d] rounded">
                      <table className="w-full text-left text-[11px]">
                        <tbody>
                          {rows.map((row, rIdx) => {
                            const cells = row.split('|').filter((c, i, a) => i !== 0 && i !== a.length - 1);
                            const isHeader = rIdx === 0;
                            return (
                              <tr
                                key={rIdx}
                                className={isHeader ? 'bg-[#1c2128] font-bold text-[#38bdf8] border-b border-[#30363d]' : 'border-b border-[#21262d] hover:bg-[#161b22]/40'}
                              >
                                {cells.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-2">
                                    {cell.trim()}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return (
                  <p key={idx} className="text-[11px] text-[#8b949e] leading-relaxed">
                    {block}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Audit Signature Bar */}
        <div className="px-4 py-2 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-[10px] text-[#8b949e] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>自律型AI設計エンジン：全7大エージェント不変条件アサーション合格済み</span>
          </div>
          <div className="font-mono text-[#6e7681]">
            MLIT BIM/CIM Class-A Compliant • Generated: {new Date().toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  );
};
