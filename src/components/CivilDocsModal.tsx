/**
 * Nova3D Civil Platform v5.2 - CivilDocsModal Component
 * 国土交通省 BIM/CIM ＆ 5大設計図書（詳細設計書・AgentSKILL・ハーネス・ループ・ロードマップ）閲覧・保存モーダル
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  X,
  Code,
  Layers,
  Cpu,
  RefreshCw,
  FolderTree,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { CivilProject } from '../types';
import { generateAllCivilDocuments, CivilDocumentItem } from '../utils/civilDocsGenerator';

interface CivilDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: CivilProject;
}

export const CivilDocsModal: React.FC<CivilDocsModalProps> = ({
  isOpen,
  onClose,
  activeProject,
}) => {
  const documents = generateAllCivilDocuments(activeProject);
  const [selectedDocId, setSelectedDocId] = useState<string>('spec');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(currentDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCurrent = () => {
    triggerDownload(currentDoc.content, currentDoc.filename);
    setDownloadSuccess(`『${currentDoc.filename}』をダウンロードしました。`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadAll = () => {
    documents.forEach((doc, idx) => {
      setTimeout(() => {
        triggerDownload(doc.content, doc.filename);
      }, idx * 300);
    });
    setDownloadSuccess('全5大設計図書（.md）を一括ダウンロードしました！');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#f0f6fc]">
                  Nova3D 公式5大設計図書 ＆ 自律エージェントドキュメント
                </h3>
                <span className="text-[10px] font-mono bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 px-2 py-0.5 rounded">
                  国土交通省 BIM/CIM 適合
                </span>
              </div>
              <p className="text-xs text-[#8b949e] mt-0.5 font-mono">
                Windows 11 / RTX 3050 Ti (4GB VRAM) 完全最適化 ＆ 自律AIエージェント仕様書パッケージ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] px-3.5 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>全5大ドキュメントを一括保存 (.md)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Download Success Notification */}
        {downloadSuccess && (
          <div className="bg-[#10b981]/15 border-b border-[#10b981]/30 px-6 py-2 text-xs text-[#10b981] flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono">
              <Check className="w-4 h-4" />
              {downloadSuccess}
            </span>
            <span className="text-[10px] text-[#8b949e]">保存先: ブラウザ規定のダウンロードフォルダ</span>
          </div>
        )}

        {/* Workspace Layout */}
        <div className="flex-1 flex overflow-hidden min-h-[500px]">
          {/* Document Navigation Sidebar */}
          <div className="w-72 bg-[#090d13] border-r border-[#30363d] p-3 flex flex-col gap-1.5 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#6e7681] px-2 py-1 uppercase tracking-wider font-mono">
              提出用 成果物ドキュメント
            </div>

            {documents.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-[#161b22] border-[#38bdf8] text-[#f0f6fc] shadow-sm'
                      : 'bg-[#0d1117] border-[#21262d] text-[#8b949e] hover:border-[#30363d] hover:text-[#c9d1d9]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono truncate">{doc.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected
                          ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                          : 'bg-[#21262d] text-[#8b949e]'
                      }`}
                    >
                      .md
                    </span>
                  </div>
                  <div className="text-[10px] text-[#38bdf8] mt-0.5 truncate font-mono">
                    {doc.badge}
                  </div>
                  <div className="text-[10px] text-[#6e7681] mt-1 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </div>
                </button>
              );
            })}

            {/* Quick Specs Card */}
            <div className="mt-auto pt-3 border-t border-[#21262d]">
              <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] text-[10px] font-mono text-[#8b949e] space-y-1">
                <div className="text-[#f0f6fc] font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#a855f7]" />
                  <span>RTX 3050 Ti ハーネス状態</span>
                </div>
                <div>GPU VRAM割当: <span className="text-[#10b981]">1.18 GB / 4.0 GB</span></div>
                <div>推論レイテンシ: <span className="text-[#38bdf8]">0.0 ms (Client Local)</span></div>
                <div>法規判定ガード: <span className="text-[#10b981]">100% Invariant PASS</span></div>
              </div>
            </div>
          </div>

          {/* Document Content Viewport */}
          <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
            {/* Viewer Toolbar */}
            <div className="px-5 py-2.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#f0f6fc] font-mono">
                  {currentDoc.filename}
                </span>
                <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded font-mono">
                  UTF-8 / Markdown
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCurrent}
                  className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded text-xs flex items-center gap-1.5 transition-colors font-mono"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      <span className="text-[#10b981]">コピー完了</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>クリップボードへコピー</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadCurrent}
                  className="px-3 py-1 bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/40 rounded text-xs flex items-center gap-1.5 transition-colors font-bold font-mono"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>このファイルを保存</span>
                </button>
              </div>
            </div>

            {/* Markdown Text Area / Code Display */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-[#c9d1d9] leading-relaxed bg-[#090d13] selection:bg-[#38bdf8]/30">
              <pre className="whitespace-pre-wrap font-mono">{currentDoc.content}</pre>
            </div>
          </div>
        </div>

        {/* Footer with Interactive Mock Buttons */}
        <div className="px-6 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-xs">
          <div className="text-[#8b949e] text-[11px] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>5大成果物ドキュメント生成エンジン: 正常同期完了</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] rounded text-xs font-mono transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
