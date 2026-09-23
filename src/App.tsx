import React, { useState } from 'react';
import { useCivilPlatform } from './hooks/useCivilPlatform';
import { useProjectManager } from './hooks/useProjectManager';
import { TopNavBar } from './components/TopNavBar';
import { SideNavBar } from './components/SideNavBar';
import { CenterViewport } from './components/CenterViewport';
import { BottomDock } from './components/BottomDock';
import { CopilotPane } from './components/CopilotPane';
import { StatusBar } from './components/StatusBar';
import { SystemModals } from './components/SystemModals';
import { RoadDesignWorkspace } from './components/RoadDesignWorkspace';
import { BridgeDesignWorkspace } from './components/BridgeDesignWorkspace';
import { TunnelDesignWorkspace } from './components/TunnelDesignWorkspace';
import { EarthworkLogisticsWorkspace } from './components/EarthworkLogisticsWorkspace';
import { HydroSimulationWorkspace } from './components/HydroSimulationWorkspace';
import { DriverSightlineWorkspace } from './components/DriverSightlineWorkspace';
import { GeoLibreTerrainWorkspace } from './components/GeoLibreTerrainWorkspace';
import { ExportPackageModal } from './components/ExportPackageModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { CivilDeliverablesModal } from './components/CivilDeliverablesModal';
import { ChevronLeft, ChevronRight, Layers, Bot } from 'lucide-react';
import { IntersectionPoint } from './types';

export default function App() {
  const [isExportPackageOpen, setIsExportPackageOpen] = useState(false);
  const [isCivilDeliverablesOpen, setIsCivilDeliverablesOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isTwinLeftOpen, setIsTwinLeftOpen] = useState(true);
  const [isTwinRightOpen, setIsTwinRightOpen] = useState(false);

  // プロジェクトマネジメント（DB層）
  const {
    activeProject,
    projects,
    switchProject,
    createProject,
    duplicateProject,
    deleteProject,
    exportProjectJson,
    exportAllProjectsJson,
    importProjectFromJson,
    resetToPresets
  } = useProjectManager();

  // 総合デジタルツイン・AI設計プラットフォーム
  const {
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
  } = useCivilPlatform();

  const handleSwitchProject = (id: string) => {
    switchProject(id);
    setIsTwinLeftOpen(false);
    setIsTwinRightOpen(false);
    // 対象プロジェクトの初期測点にシーク
    const target = projects.find((p) => p.id === id);
    if (target) {
      seekStationSkill(target.activeStation || 0);
      if (target.selectedPlanId) {
        selectPlanSkill(target.selectedPlanId);
      }
    }
  };

  // GeoLibreで設計した実地形IP線形パラメータを道路設計（Road）および総合プラットフォームへ反映
  const handleApplyGeoLibreToRoadDesign = (planId: string, updatedIps: IntersectionPoint[]) => {
    // 1. 総合デジタルツイン・土量マスバランス・カーブ諸元同期
    updateAlignmentFromIpsSkill(updatedIps);

    // 2. プロジェクト単位および最新のLocalStorageへ確実永続化
    if (activeProject?.id) {
      try {
        localStorage.setItem(`road_custom_ips_${activeProject.id}`, JSON.stringify(updatedIps));
        localStorage.setItem('road_custom_ips_latest', JSON.stringify(updatedIps));
      } catch (e) {
        console.error('Failed to persist road IPs in handleApplyGeoLibreToRoadDesign:', e);
      }
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#090d13] text-[#f0f6fc] font-sans select-none antialiased">
      {/* 1. TOP HEADER & SUBMENU RIBBON */}
      <TopNavBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeDomain={activeDomain}
        setActiveDomain={setActiveDomain}
        onHitlClick={commitHitlSkill}
        onOpenLogs={() => setSystemModalOpen('log')}
        onOpenHealth={() => setSystemModalOpen('health')}
        onOpenExportPackage={() => setIsExportPackageOpen(true)}
        onOpenCivilDeliverables={() => setIsCivilDeliverablesOpen(true)}
        activeProject={activeProject}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
      />

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden pt-[calc(3.5rem+1.75rem)] pb-7">
        {activeDomain === 'GeoLibre' ? (
          /* GEOLIBRE / GSI TERRAIN DEDICATED WORKSPACE (国土地理院実地形DEM5A/10B 2D/3D道路線形設計) */
          <GeoLibreTerrainWorkspace
            project={activeProject}
            currentPlan={currentPlan}
            onApplyToProject={handleApplyGeoLibreToRoadDesign}
            onClose={() => setActiveDomain('Road')}
            onSwitchStudio={setActiveDomain}
          />
        ) : activeDomain === 'Road' ? (
          /* ROAD MODULE DEDICATED WORKSPACE (道路線形・幾何設計) */
          <RoadDesignWorkspace
            activeProject={activeProject}
            onUpdateAlignment={updateAlignmentFromIpsSkill}
            onDragEnd={updateAlignmentFromIpsSkill}
          />
        ) : activeDomain === 'Bridge' ? (
          /* BRIDGE MODULE DEDICATED WORKSPACE (橋梁設計・力学解析) */
          <BridgeDesignWorkspace activeProject={activeProject} />
        ) : activeDomain === 'Tunnel' ? (
          /* TUNNEL MODULE DEDICATED WORKSPACE (NATM山岳トンネル・支保工) */
          <TunnelDesignWorkspace activeProject={activeProject} />
        ) : activeDomain === 'Earthwork' ? (
          /* EARTHWORK & GEOTECHNICAL DEDICATED WORKSPACE (土工マスカーブ・ダンプ運搬LP・3D地盤透視) */
          <EarthworkLogisticsWorkspace activeProject={activeProject} />
        ) : activeDomain === 'Hydro' ? (
          /* HYDRO-METEOROLOGICAL & ENVIRONMENTAL DEDICATED WORKSPACE (水文出水・仮締切越流4D・PLATEAU環境) */
          <HydroSimulationWorkspace />
        ) : activeDomain === 'Walkthrough' ? (
          /* DRIVER SIGHTLINE & VR WALKTHROUGH (道路構造令第11条 停止視距・トンネル明暗順応 60FPS走行) */
          <DriverSightlineWorkspace activeProject={activeProject} />
        ) : (
          /* GENERAL CIVIL DIGITAL TWIN (総合土木デジタルツイン) */
          <>
            {/* Left Pane: Spatial Tree & Keymap */}
            {!isTwinLeftOpen ? (
              <div className="w-8 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-2 z-30 shrink-0 select-none">
                <button
                  onClick={() => setIsTwinLeftOpen(true)}
                  className="p-1.5 bg-[#161b22] hover:bg-[#38bdf8] hover:text-[#090d13] text-[#38bdf8] rounded border border-[#30363d] transition-all shadow"
                  title="空間ツリー・レイヤーを展開"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="[writing-mode:vertical-rl] text-[10px] font-mono text-[#8b949e] mt-4 tracking-widest flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#38bdf8]" />
                  レイヤー構成
                </span>
              </div>
            ) : (
              <div className="relative flex flex-col h-full shrink-0">
                <SideNavBar
                  constraints={constraints}
                  activeProject={activeProject}
                  currentPlan={currentPlan}
                  onToggleConstraint={toggleLayerSkill}
                  onOpenLogs={() => setSystemModalOpen('log')}
                  onOpenHealth={() => setSystemModalOpen('health')}
                  onRecalculateEarthwork={triggerEarthworkRecalcSkill}
                  onNewAlignRun={() => triggerEarthworkRecalcSkill()}
                />
                <button
                  onClick={() => setIsTwinLeftOpen(false)}
                  className="absolute top-2.5 right-2 z-40 p-1 bg-[#161b22]/80 hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] rounded transition-colors"
                  title="左パネルを折りたたむ"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Center Viewport + Bottom Dock */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
              <CenterViewport
                currentPlan={currentPlan}
                viewportMode={viewportMode}
                setViewportMode={setViewportMode}
                activeStation={activeStation}
                onSeekStation={seekStationSkill}
                cutSlopeRatio={cutSlopeRatio}
                onSwitchStudio={setActiveDomain}
                onUpdateAlignment={updateAlignmentFromIpsSkill}
                onDragEnd={updateAlignmentFromIpsSkill}
              />

              <BottomDock
                currentPlan={currentPlan}
                activeStation={activeStation}
                onSeekStation={seekStationSkill}
                timelineDay={timelineDay}
                setTimelineDay={setTimelineDay}
                isTimelinePlaying={isTimelinePlaying}
                setIsTimelinePlaying={setIsTimelinePlaying}
              />
            </main>

            {/* Right Pane: Multi-Agent Copilot & HITL Console */}
            {!isTwinRightOpen ? (
              <div className="w-8 bg-[#0d1117] border-l border-[#30363d] flex flex-col items-center py-2 z-30 shrink-0 select-none">
                <button
                  onClick={() => setIsTwinRightOpen(true)}
                  className="p-1.5 bg-[#161b22] hover:bg-[#a855f7] hover:text-[#090d13] text-[#a855f7] rounded border border-[#30363d] transition-all shadow"
                  title="Copilot AI 監査パネルを展開"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="[writing-mode:vertical-rl] text-[10px] font-mono text-[#a855f7] mt-4 tracking-widest flex items-center gap-1 font-bold">
                  <Bot className="w-3 h-3 text-[#a855f7]" />
                  COPILOT AI
                </span>
              </div>
            ) : (
              <div className="relative flex flex-col h-full shrink-0">
                <CopilotPane
                  selectedPlanId={selectedPlanId}
                  onSelectPlan={selectPlanSkill}
                  verificationResults={currentVerificationResults}
                  hitlStatus={hitlStatus}
                  onCommitHitl={commitHitlSkill}
                  onRollbackHitl={rollbackHitlSkill}
                  chatMessages={chatMessages}
                  onSendMessage={sendUserPromptSkill}
                  onOpenCivilDeliverables={() => setIsCivilDeliverablesOpen(true)}
                />
                <button
                  onClick={() => setIsTwinRightOpen(false)}
                  className="absolute top-2.5 right-2 z-40 p-1 bg-[#161b22]/80 hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] rounded transition-colors"
                  title="右パネルを折りたたむ"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. APPLICATION STATUSBAR */}
      <StatusBar activeProject={activeProject} />

      {/* 4. MODALS (Live Log / System Health / BIM-CIM Export / 5 Deliverables Docs / Project Manager) */}
      <SystemModals
        modalType={systemModalOpen}
        onClose={() => setSystemModalOpen('none')}
        logs={executionLogs}
        verificationResults={currentVerificationResults}
      />

      <ExportPackageModal
        isOpen={isExportPackageOpen}
        onClose={() => setIsExportPackageOpen(false)}
        activeStation={activeStation}
        activeProject={activeProject}
      />

      <CivilDeliverablesModal
        isOpen={isCivilDeliverablesOpen}
        onClose={() => setIsCivilDeliverablesOpen(false)}
        activeProject={activeProject}
        currentPlan={currentPlan}
      />

      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        activeProject={activeProject}
        projects={projects}
        onSwitchProject={handleSwitchProject}
        onCreateProject={createProject}
        onDuplicateProject={duplicateProject}
        onDeleteProject={deleteProject}
        onExportProjectJson={exportProjectJson}
        onExportAllProjectsJson={exportAllProjectsJson}
        onImportProjectJson={importProjectFromJson}
        onResetPresets={resetToPresets}
      />
    </div>
  );
}


