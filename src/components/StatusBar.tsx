import React from 'react';
import { CloudCheck, Activity, FolderKanban } from 'lucide-react';
import { CivilProject } from '../types';

interface StatusBarProps {
  activeProject?: CivilProject;
}

export const StatusBar: React.FC<StatusBarProps> = ({ activeProject }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-7 bg-[#0d1117] border-t border-[#30363d] px-3 flex items-center justify-between text-[10px] font-mono text-[#8b949e] z-50 select-none">
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
        {activeProject && (
          <span className="flex items-center gap-1.5 text-[#38bdf8] font-bold">
            <FolderKanban className="w-3 h-3 text-[#38bdf8]" />
            <span>{activeProject.routeCode}</span>
            <span className="text-[#6e7681] font-normal">({activeProject.roadClass} • {activeProject.designSpeed}km/h)</span>
          </span>
        )}
        <span className="text-[#6e7681]">|</span>
        <span className="flex items-center gap-1.5 text-[#f0f6fc]">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          AIステータス: <strong>7 Fleet 稼働中 (Autonomous Loop OK)</strong>
        </span>
        <span className="text-[#6e7681]">|</span>
        <span>
          GPU: <strong className="text-[#f0f6fc]">RTX 3050 Ti (4GB VRAM 最適化)</strong> (60 FPS)
        </span>
        <span className="text-[#6e7681]">|</span>
        <span>
          VRAM: <strong className="text-[#10b981]">1.1GB / 4.0GB</strong> (余裕度 72%)
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-4 text-[#6e7681]">
        <span>
          座標系: <strong className="text-[#f0f6fc]">{activeProject ? activeProject.crs : 'JGD2011 / Zone IX'}</strong>
        </span>
        <span>
          単位: <strong className="text-[#f0f6fc]">m, m², m³, ° (JIS A 0150)</strong>
        </span>
        <span className="text-[#10b981] flex items-center gap-1 font-semibold">
          <svg className="w-3 h-3 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            <polyline points="9 11 12 14 22 4" />
          </svg>
          QGIS Cloud Sync: PASS
        </span>
      </div>
    </footer>
  );
};
