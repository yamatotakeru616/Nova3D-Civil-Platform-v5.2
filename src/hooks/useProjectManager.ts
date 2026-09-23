import { useState, useEffect, useCallback } from 'react';
import { CivilProject } from '../types';

const STORAGE_KEY_PROJECTS = 'nova3d_civil_projects_v5.2';
const STORAGE_KEY_ACTIVE_ID = 'nova3d_active_project_id_v5.2';

const INITIAL_PROJECTS: CivilProject[] = [
  {
    id: 'kumamoto-west-ring',
    name: '熊本環状西道路 (Kumamoto West Ring)',
    routeCode: 'R501-BP',
    description: '国土交通省 九州地方整備局 熊本河川国道事務所 直轄国道バイパス事業。緑川渡河橋梁および金峰山破砕帯トンネルを含む全線24.5kmの都市間高規格道路。',
    roadClass: '第3種第1級',
    designSpeed: 60,
    totalLengthKm: 24.5,
    crs: 'JGD2011 / Zone IX',
    meshResolution: 'GSI 5m DEM + PLATEAU LOD2',
    updatedAt: '2026-09-21 02:40',
    createdAt: '2026-09-01 09:00',
    earthworkSummary: {
      cutM3: 680000,
      fillM3: 602000,
      balanceM3: 78000
    },
    structuralFeatures: {
      bridgeCount: 3,
      tunnelCount: 2,
      majorBridgeName: '緑川渡河橋梁 (全長380m)',
      majorTunnelName: '金峰山第1トンネル (全長2,150m)'
    },
    activeStation: 7500,
    selectedPlanId: 'B',
    estimatedCostBillionYen: 45.2,
    tags: ['直轄国道', 'BIM/CIM推進', '河川渡河', '山岳NATM']
  },
  {
    id: 'aso-highland-route',
    name: '阿蘇山麓アクセス道路 (Aso Highland Route)',
    routeCode: 'R057-BP',
    description: '阿蘇カルデラ西麓を結ぶ地域高規格道路。設計速度80km/hの急勾配山岳高架橋梁連続区間と火山灰性特殊土工（クロボク・シラス）の安定処理。',
    roadClass: '第1種第3級',
    designSpeed: 80,
    totalLengthKm: 18.2,
    crs: 'JGD2011 / Zone II',
    meshResolution: 'GSI 1m DEM + 航空レーザーLiDAR',
    updatedAt: '2026-09-20 18:15',
    createdAt: '2026-09-05 14:00',
    earthworkSummary: {
      cutM3: 520000,
      fillM3: 490000,
      balanceM3: 30000
    },
    structuralFeatures: {
      bridgeCount: 5,
      tunnelCount: 1,
      majorBridgeName: '白川峡谷連続高架橋 (全長520m)',
      majorTunnelName: '外輪山カルデラトンネル (全長1,600m)'
    },
    activeStation: 4200,
    selectedPlanId: 'A',
    estimatedCostBillionYen: 38.6,
    tags: ['地域高規格', '設計速度80km/h', '山岳高架', '特殊土工']
  },
  {
    id: 'ariake-coastal-route',
    name: '有明海沿岸道路 新規延伸工区 (Ariake Coastal Route)',
    routeCode: 'R208-BP',
    description: '有明海干拓デルタ地帯を縦断する高規格道路延伸部。超軟弱シルト地盤の真空圧密・載荷盛土工法およびゼロメートル地帯高潮・高波防護堤一体型構造。',
    roadClass: '第3種第1級',
    designSpeed: 60,
    totalLengthKm: 12.0,
    crs: 'JGD2011 / Zone II',
    meshResolution: 'PLATEAU LOD3 + 海岸高潮DEM',
    updatedAt: '2026-09-18 11:30',
    createdAt: '2026-09-10 10:30',
    earthworkSummary: {
      cutM3: 120000,
      fillM3: 480000,
      balanceM3: -360000
    },
    structuralFeatures: {
      bridgeCount: 4,
      tunnelCount: 0,
      majorBridgeName: '菊池川河口斜張橋 (全長640m)',
      majorTunnelName: 'なし (全線地上・高架)'
    },
    activeStation: 3500,
    selectedPlanId: 'B',
    estimatedCostBillionYen: 54.0,
    tags: ['軟弱地盤', '高潮防災', '長大斜張橋', '真空圧密']
  }
];

export function useProjectManager() {
  const [projects, setProjects] = useState<CivilProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load projects from localStorage:', e);
    }
    return INITIAL_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) {
        return savedId;
      }
    } catch (e) {
      console.warn('Failed to load activeProjectId:', e);
    }
    return 'kumamoto-west-ring';
  });

  // アクティブなプロジェクトインスタンスを特定
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  // 永続化同期
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeProjectId);
    } catch (e) {
      console.warn('Failed to save activeProjectId to localStorage:', e);
    }
  }, [activeProjectId]);

  // 1. プロジェクト切り替え
  const switchProject = useCallback((id: string) => {
    const target = projects.find((p) => p.id === id);
    if (target) {
      setActiveProjectId(id);
    }
  }, [projects]);

  // 2. 新規プロジェクト作成
  const createProject = useCallback((data: Partial<CivilProject>) => {
    const newId = `project-${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newProject: CivilProject = {
      id: newId,
      name: data.name || '新規道路幾何設計プロジェクト',
      routeCode: data.routeCode || 'R000-NEW',
      description: data.description || '新規開設された道路幾何・土工・構造物統合設計プロジェクト',
      roadClass: data.roadClass || '第3種第1級',
      designSpeed: data.designSpeed || 60,
      totalLengthKm: data.totalLengthKm || 10.0,
      crs: data.crs || 'JGD2011 / Zone IX',
      meshResolution: data.meshResolution || 'GSI 5m DEM + PLATEAU LOD2',
      updatedAt: nowStr,
      createdAt: nowStr,
      earthworkSummary: data.earthworkSummary || {
        cutM3: 250000,
        fillM3: 240000,
        balanceM3: 10000
      },
      structuralFeatures: data.structuralFeatures || {
        bridgeCount: 1,
        tunnelCount: 0,
        majorBridgeName: '新規設計高架橋 (全長180m)',
        majorTunnelName: 'なし'
      },
      activeStation: 0,
      selectedPlanId: 'A',
      estimatedCostBillionYen: data.estimatedCostBillionYen || 25.0,
      tags: data.tags || ['新設道路', 'BIM/CIM']
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newId);
    return newProject;
  }, []);

  // 3. プロジェクト複製 (Clone)
  const duplicateProject = useCallback((id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    const newId = `project-${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const clonedProject: CivilProject = {
      ...target,
      id: newId,
      name: `${target.name} (複製コピー)`,
      routeCode: `${target.routeCode}-CLONE`,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    setProjects((prev) => [clonedProject, ...prev]);
    setActiveProjectId(newId);
  }, [projects]);

  // 4. プロジェクト削除
  const deleteProject = useCallback((id: string) => {
    if (projects.length <= 1) {
      alert('プロジェクトは最低1件存在する必要があります。削除できません。');
      return;
    }

    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (activeProjectId === id) {
        setActiveProjectId(filtered[0]?.id || INITIAL_PROJECTS[0].id);
      }
      return filtered;
    });
  }, [projects, activeProjectId]);

  // 5. カレントプロジェクトの部分更新
  const updateActiveProject = useCallback((data: Partial<CivilProject>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            ...data,
            updatedAt: nowStr
          };
        }
        return p;
      })
    );
  }, [activeProjectId]);

  // 6. JSONエクスポート (単一プロジェクト)
  const exportProjectJson = useCallback((id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    const json = JSON.stringify(target, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nova3D_Project_${target.routeCode}_${target.id}.novaproject.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [projects]);

  // 7. 全プロジェクト一括エクスポート (全DBバックアップ)
  const exportAllProjectsJson = useCallback(() => {
    const backupData = {
      version: '5.2',
      exportDate: new Date().toISOString(),
      activeProjectId,
      projects
    };
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nova3D_All_Projects_Backup_v5.2_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [projects, activeProjectId]);

  // 8. JSONインポート
  const importProjectFromJson = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);

      // 全バックアップ形式の場合
      if (parsed && parsed.projects && Array.isArray(parsed.projects)) {
        setProjects(parsed.projects);
        if (parsed.activeProjectId && parsed.projects.some((p: CivilProject) => p.id === parsed.activeProjectId)) {
          setActiveProjectId(parsed.activeProjectId);
        } else if (parsed.projects.length > 0) {
          setActiveProjectId(parsed.projects[0].id);
        }
        return true;
      }

      // 単一プロジェクト形式の場合
      if (parsed && parsed.name && parsed.roadClass && parsed.designSpeed) {
        const importedProject: CivilProject = {
          ...parsed,
          id: `imported-${Date.now()}`,
          name: `${parsed.name} (インポート)`,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        setProjects((prev) => [importedProject, ...prev]);
        setActiveProjectId(importedProject.id);
        return true;
      }

      return false;
    } catch (e) {
      console.error('Failed to import project JSON:', e);
      return false;
    }
  }, []);

  // 9. デフォルトプリセットへ初期化
  const resetToPresets = useCallback(() => {
    setProjects(INITIAL_PROJECTS);
    setActiveProjectId(INITIAL_PROJECTS[0].id);
    localStorage.removeItem(STORAGE_KEY_PROJECTS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
  }, []);

  return {
    activeProject,
    activeProjectId,
    projects,
    switchProject,
    createProject,
    duplicateProject,
    deleteProject,
    updateActiveProject,
    exportProjectJson,
    exportAllProjectsJson,
    importProjectFromJson,
    resetToPresets
  };
}
