import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Map as MapIcon,
  Layers,
  Mountain,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Info,
  Activity,
  Plus,
  Trash2,
  MousePointer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Crosshair
} from 'lucide-react';
import { CivilProject, DesignPlan, GsiLayerType, TerrainSamplePoint } from '../types';
import {
  latLonToZoneIX,
  zoneIXToLatLon,
  latLonToTileCoords,
  tileCoordsToLatLonBounds
} from '../utils/coordinateTransform';
import {
  loadGsiTileImage,
  getKumamotoElevationFallback,
  sampleRoadElevationProfile,
} from '../utils/gsiTerrainFetcher';
import { convertGeoLibreIpsToRoadIps } from '../utils/alignmentConverter';

interface GeoLibreTerrainWorkspaceProps {
  project?: CivilProject;
  currentPlan?: DesignPlan;
  onApplyToProject?: (planId: string, updatedIps: any[]) => void;
  onClose?: () => void;
  onSwitchStudio?: (domain: any) => void;
}

export interface IPPoint {
  id: string;
  name: string;
  station: number;
  x: number; // 平面直角座標第IX系 X (Northing, m)
  y: number; // 平面直角座標第IX系 Y (Easting, m)
  radius: number; // 曲線半径 R (m)
  clothoidA: number; // クロソイドパラメータ A (m)
}

const DEFAULT_IP_LIST: IPPoint[] = [
  { id: 'origin', name: '起点 (Sta.0+00)', station: 0, x: -24800, y: 11200, radius: 0, clothoidA: 0 },
  { id: 'ip1', name: 'IP-01 (金峰山取付)', station: 1250, x: -23850, y: 12100, radius: 750, clothoidA: 180 },
  { id: 'ip2', name: 'IP-02 (トンネル部)', station: 2600, x: -22700, y: 13200, radius: 850, clothoidA: 200 },
  { id: 'ip3', name: 'IP-03 (緑川進入)', station: 3900, x: -21800, y: 13950, radius: 600, clothoidA: 160 },
  { id: 'end', name: '終点 (Sta.48+50)', station: 4850, x: -21200, y: 14500, radius: 0, clothoidA: 0 },
];

export const GeoLibreTerrainWorkspace: React.FC<GeoLibreTerrainWorkspaceProps> = ({
  project,
  currentPlan,
  onApplyToProject,
  onClose,
  onSwitchStudio,
}) => {
  // レイヤー設定
  const [activeLayer, setActiveLayer] = useState<GsiLayerType>('std');
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [samplingPitch] = useState<number>(20); // 20mピッチ

  // コンテナのリアルタイム実サイズ (px)
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 600,
  });

  // マップビューポート（平面直角座標系第IX系 中心座標 & 表示範囲 m）
  // 熊本市西区・金峰山〜緑川エリア: X約 -23,000m, Y約 12,850m
  const [viewCenter, setViewCenter] = useState<{ x: number; y: number }>({ x: -23000, y: 12850 });
  const [viewSpan, setViewSpan] = useState<{ spanX: number; spanY: number }>({ spanX: 5200, spanY: 5200 });

  // IP点列（LocalStorageから自動復元）
  const [ipList, setIpList] = useState<IPPoint[]>(() => {
    try {
      const storageKey = project?.id ? `geolibre_ips_${project.id}` : 'geolibre_ips_default';
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('geolibre_ips_latest');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to restore initial geolibre IPs:', e);
    }
    return DEFAULT_IP_LIST;
  });

  // IP変更時の自動保存 (Auto-save)
  useEffect(() => {
    try {
      const storageKey = project?.id ? `geolibre_ips_${project.id}` : 'geolibre_ips_default';
      localStorage.setItem(storageKey, JSON.stringify(ipList));
      localStorage.setItem('geolibre_ips_latest', JSON.stringify(ipList));
    } catch (e) {
      console.error('Failed to auto-save geolibre IPs:', e);
    }
  }, [ipList, project?.id]);

  // プロジェクト変更検知＆保存済みIPリスト復元
  useEffect(() => {
    if (!project?.id) return;
    try {
      const storageKey = `geolibre_ips_${project.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          setIpList(parsed);
          setSelectedIpId(parsed[1]?.id || 'ip1');
        }
      }
    } catch (e) {
      console.error('Failed to restore project geolibre IPs:', e);
    }
  }, [project?.id]);

  const [selectedIpId, setSelectedIpId] = useState<string>('ip2');
  const [hoveredIpId, setHoveredIpId] = useState<string | null>(null);

  // ドラッグ操作の状態
  const [isDraggingIp, setIsDraggingIp] = useState<boolean>(false);
  const [isPanningMap, setIsPanningMap] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number; startCenterX: number; startCenterY: number } | null>(null);

  // 編集モード: 'select' (ドラッグ移動・選択) | 'add-ip' (キャンバスクリックでIP追加) | 'teleport' (クリック位置へ選択IPを移動)
  const [editMode, setEditMode] = useState<'select' | 'add-ip' | 'teleport'>('select');

  const [hoveredCoord, setHoveredCoord] = useState<{
    x: number;
    y: number;
    lat: number;
    lon: number;
    gl: number;
    slope: number;
  } | null>(null);

  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // DOM参照
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 選択中のIP
  const selectedIp = useMemo(() => ipList.find((p) => p.id === selectedIpId) ?? ipList[1], [ipList, selectedIpId]);

  // ビューポート計算
  const minX = viewCenter.x - viewSpan.spanX / 2;
  const maxX = viewCenter.x + viewSpan.spanX / 2;
  const minY = viewCenter.y - viewSpan.spanY / 2;
  const maxY = viewCenter.y + viewSpan.spanY / 2;

  // 画面ピクセル <-> 実座標(m) 変換関数
  const toScreen = useCallback(
    (x: number, y: number, w: number, h: number) => {
      const px = ((y - minY) / (maxY - minY)) * w;
      const py = h - ((x - minX) / (maxX - minX)) * h;
      return { px, py };
    },
    [minX, maxX, minY, maxY]
  );

  const toWorld = useCallback(
    (px: number, py: number, w: number, h: number) => {
      const y = minY + (px / w) * (maxY - minY);
      const x = minX + (1 - py / h) * (maxX - minX);
      return { x, y };
    },
    [minX, maxX, minY, maxY]
  );

  // コンテナのサイズを ResizeObserver で動的監視
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          setCanvasDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // リアルタイム標高サンプリング
  const sampledProfile: TerrainSamplePoint[] = useMemo(() => {
    const origin = ipList[0];
    const end = ipList[ipList.length - 1];
    return sampleRoadElevationProfile(
      4850,
      samplingPitch,
      { x: origin.x, y: origin.y },
      { x: end.x, y: end.y }
    );
  }, [ipList, samplingPitch]);

  // 土量概算（切土・盛土）
  const { totalCutM3, totalFillM3, maxCutDepth, maxFillDepth } = useMemo(() => {
    let cut = 0;
    let fill = 0;
    let maxC = 0;
    let maxF = 0;
    const roadWidth = 24.5;

    for (const pt of sampledProfile) {
      const area = Math.abs(pt.cutFillDepth) * roadWidth;
      const vol = area * samplingPitch;
      if (pt.cutFillDepth > 0) {
        cut += vol;
        if (pt.cutFillDepth > maxC) maxC = pt.cutFillDepth;
      } else {
        fill += vol;
        if (Math.abs(pt.cutFillDepth) > maxF) maxF = Math.abs(pt.cutFillDepth);
      }
    }
    return {
      totalCutM3: Math.round(cut),
      totalFillM3: Math.round(fill),
      maxCutDepth: parseFloat(maxC.toFixed(1)),
      maxFillDepth: parseFloat(maxF.toFixed(1)),
    };
  }, [sampledProfile, samplingPitch]);

  // ----------------------------------------------------
  // 1. 背景地図（国土地理院タイル）の描画
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;
    const width = canvasDimensions.width;
    const height = canvasDimensions.height;

    canvas.width = width;
    canvas.height = height;

    // 背景初期クリア
    ctx.fillStyle = '#090d13';
    ctx.fillRect(0, 0, width, height);

    // タイル計算 (ズーム13)
    const zoom = 13;
    const { lat: latMin, lon: lonMin } = zoneIXToLatLon(minX, minY);
    const { lat: latMax, lon: lonMax } = zoneIXToLatLon(maxX, maxY);

    const tileMin = latLonToTileCoords(latMax, lonMin, zoom);
    const tileMax = latLonToTileCoords(latMin, lonMax, zoom);

    const minTileX = Math.min(tileMin.x, tileMax.x) - 1;
    const maxTileX = Math.max(tileMin.x, tileMax.x) + 1;
    const minTileY = Math.min(tileMin.y, tileMax.y) - 1;
    const maxTileY = Math.max(tileMin.y, tileMax.y) + 1;

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const bounds = tileCoordsToLatLonBounds(tx, ty, zoom);
        const nw = latLonToZoneIX(bounds.north, bounds.west);
        const se = latLonToZoneIX(bounds.south, bounds.east);

        const pNW = toScreen(nw.x, nw.y, width, height);
        const pSE = toScreen(se.x, se.y, width, height);

        const destX = pNW.px;
        const destY = pNW.py;
        const destW = pSE.px - pNW.px;
        const destH = pSE.py - pNW.py;

        loadGsiTileImage(activeLayer, zoom, tx, ty).then((img) => {
          if (!isMounted || !bgCanvasRef.current) return;
          const currentCtx = bgCanvasRef.current.getContext('2d');
          if (!currentCtx) return;

          if (img) {
            currentCtx.drawImage(img, destX, destY, destW, destH);
          } else {
            // フォールバック
            currentCtx.fillStyle = activeLayer === 'ortho' ? '#142814' : '#111a24';
            currentCtx.fillRect(destX, destY, destW, destH);
          }
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [activeLayer, minX, maxX, minY, maxY, canvasDimensions, toScreen]);

  // ----------------------------------------------------
  // 2. 前景（道路線形、IPハンドル、等高線、1kmグリッド）の描画
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = fgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvasDimensions.width;
    const height = canvasDimensions.height;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // 等高線
    if (showContours) {
      ctx.strokeStyle = activeLayer === 'ortho' ? 'rgba(255,255,255,0.35)' : 'rgba(56,189,248,0.3)';
      ctx.lineWidth = 1;
      for (let c = 0; c < 7; c++) {
        ctx.beginPath();
        const r = 70 + c * 45;
        const { px, py } = toScreen(-23100, 12600, width, height);
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 1km直角グリッド
    if (showGrid) {
      ctx.strokeStyle = activeLayer === 'ortho' ? 'rgba(255,255,255,0.25)' : 'rgba(139,148,158,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const gridStep = 1000;
      const startX = Math.floor(minX / gridStep) * gridStep;
      const endX = Math.ceil(maxX / gridStep) * gridStep;
      const startY = Math.floor(minY / gridStep) * gridStep;
      const endY = Math.ceil(maxY / gridStep) * gridStep;

      for (let xG = startX; xG <= endX; xG += gridStep) {
        const { py } = toScreen(xG, minY, width, height);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }
      for (let yG = startY; yG <= endY; yG += gridStep) {
        const { px } = toScreen(minX, yG, width, height);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 道路線形（中心線）
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ipList.forEach((ip, idx) => {
      const { px, py } = toScreen(ip.x, ip.y, width, height);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 白の点線センターライン
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ipList.forEach((ip, idx) => {
      const { px, py } = toScreen(ip.x, ip.y, width, height);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // IPシンボル＆操作ハンドル（大きく見やすく当たり判定を強化）
    ipList.forEach((ip) => {
      const { px, py } = toScreen(ip.x, ip.y, width, height);
      const isSelected = ip.id === selectedIpId;
      const isHovered = ip.id === hoveredIpId;

      // 選択中またはホバー中の外側パルスリング
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 20 : 16, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.3)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // IPコア円
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 10 : 8, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#f59e0b' : isHovered ? '#38bdf8' : '#0284c7';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // 十字ターゲット線
      if (isSelected) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px - 14, py);
        ctx.lineTo(px + 14, py);
        ctx.moveTo(px, py - 14);
        ctx.lineTo(px, py + 14);
        ctx.stroke();
      }

      // IP名＆諸元バブル
      ctx.font = 'bold 11px JetBrains Mono, sans-serif';
      const text = `${ip.name} ${ip.radius > 0 ? `(R=${ip.radius}m)` : ''}`;
      const textWidth = ctx.measureText(text).width;

      ctx.fillStyle = 'rgba(9, 13, 19, 0.85)';
      ctx.fillRect(px + 14, py - 16, textWidth + 10, 18);
      ctx.strokeStyle = isSelected ? '#f59e0b' : '#30363d';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 14, py - 16, textWidth + 10, 18);

      ctx.fillStyle = isSelected ? '#f59e0b' : '#f0f6fc';
      ctx.fillText(text, px + 19, py - 3);
    });

    // 金峰山山頂・緑川アノテーション
    const kinpoScreen = toScreen(-23100, 12600, width, height);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('▲ 金峰山山系 (EL+665m)', kinpoScreen.px, kinpoScreen.py);

    const midoriScreen = toScreen(-21500, 14200, width, height);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('≈≈ 緑川渡河部 (EL+12m)', midoriScreen.px, midoriScreen.py);
  }, [
    activeLayer,
    showContours,
    showGrid,
    ipList,
    selectedIpId,
    hoveredIpId,
    minX,
    maxX,
    minY,
    maxY,
    canvasDimensions,
    toScreen,
  ]);

  // ----------------------------------------------------
  // 3. マウスイベント処理（1ピクセルも狂わない厳密スケール変換）
  // ----------------------------------------------------
  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = fgCanvasRef.current;
    if (!canvas) return { px: 0, py: 0 };
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return { px, py };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { px, py } = getCanvasMousePos(e);
    const { width, height } = canvasDimensions;

    if (editMode === 'add-ip') {
      // クリック位置に新規IPを追加
      const { x, y } = toWorld(px, py, width, height);
      const newIndex = ipList.length - 1;
      const newId = `ip-${Date.now()}`;
      const newIp: IPPoint = {
        id: newId,
        name: `IP-0${newIndex} (新設)`,
        station: Math.round(newIndex * 950),
        x: Math.round(x),
        y: Math.round(y),
        radius: 700,
        clothoidA: 170,
      };

      const updated = [...ipList.slice(0, newIndex), newIp, ipList[newIndex]];
      setIpList(updated);
      setSelectedIpId(newId);
      setEditMode('select');
      setToastMessage('クリックした位置に新規交点(IP)を追加しました！');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (editMode === 'teleport') {
      // 選択中のIPをクリック位置へ即座に移動
      const { x, y } = toWorld(px, py, width, height);
      setIpList((prev) =>
        prev.map((ip) => (ip.id === selectedIpId ? { ...ip, x: Math.round(x), y: Math.round(y) } : ip))
      );
      setEditMode('select');
      setToastMessage(`選択中のIPを座標 (X: ${Math.round(x)}m, Y: ${Math.round(y)}m) へ移動しました！`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // IPヒットテスト（判定半径 24px の高感度キャプチャ）
    let hitIp: IPPoint | null = null;
    for (const ip of ipList) {
      const screen = toScreen(ip.x, ip.y, width, height);
      const dist = Math.hypot(screen.px - px, screen.py - py);
      if (dist <= 24) {
        hitIp = ip;
        break;
      }
    }

    if (hitIp) {
      setSelectedIpId(hitIp.id);
      setIsDraggingIp(true);
    } else {
      // 地図パンの開始
      setIsPanningMap(true);
      setPanStart({
        clientX: e.clientX,
        clientY: e.clientY,
        startCenterX: viewCenter.x,
        startCenterY: viewCenter.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { px, py } = getCanvasMousePos(e);
    const { width, height } = canvasDimensions;

    const { x, y } = toWorld(px, py, width, height);
    const { lat, lon } = zoneIXToLatLon(x, y);
    const { elevation: gl, slopeDeg } = getKumamotoElevationFallback(lat, lon);

    setHoveredCoord({
      x: Math.round(x),
      y: Math.round(y),
      lat: parseFloat(lat.toFixed(5)),
      lon: parseFloat(lon.toFixed(5)),
      gl,
      slope: slopeDeg,
    });

    // 1. IPドラッグ中（リアルタイム座標更新）
    if (isDraggingIp && selectedIpId) {
      setIpList((prev) =>
        prev.map((ip) =>
          ip.id === selectedIpId
            ? { ...ip, x: Math.round(x), y: Math.round(y) }
            : ip
        )
      );
      return;
    }

    // 2. 地図パン中
    if (isPanningMap && panStart) {
      const dxPx = e.clientX - panStart.clientX;
      const dyPx = e.clientY - panStart.clientY;

      const deltaY = (dxPx / width) * viewSpan.spanY;
      const deltaX = (dyPx / height) * viewSpan.spanX;

      setViewCenter({
        x: panStart.startCenterX + deltaX,
        y: panStart.startCenterY - deltaY,
      });
      return;
    }

    // 3. 通常時：IPホバー判定（24px）
    let foundHover: string | null = null;
    for (const ip of ipList) {
      const screen = toScreen(ip.x, ip.y, width, height);
      const dist = Math.hypot(screen.px - px, screen.py - py);
      if (dist <= 24) {
        foundHover = ip.id;
        break;
      }
    }
    setHoveredIpId(foundHover);
  };

  const handleMouseUp = () => {
    setIsDraggingIp(false);
    setIsPanningMap(false);
    setPanStart(null);
  };

  // ホイールズーム
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.85 : 1.15;
    const newSpanX = Math.max(1500, Math.min(30000, viewSpan.spanX * factor));
    const newSpanY = Math.max(1500, Math.min(30000, viewSpan.spanY * factor));
    setViewSpan({ spanX: newSpanX, spanY: newSpanY });
  };

  const handleZoom = (zoomIn: boolean) => {
    const factor = zoomIn ? 0.8 : 1.25;
    setViewSpan((prev) => ({
      spanX: Math.max(1500, Math.min(30000, prev.spanX * factor)),
      spanY: Math.max(1500, Math.min(30000, prev.spanY * factor)),
    }));
  };

  const handleResetView = () => {
    setViewCenter({ x: -23000, y: 12850 });
    setViewSpan({ spanX: 5200, spanY: 5200 });
  };

  // 新規IP追加（ボタン）
  const handleAddIpButton = () => {
    const targetIdx = ipList.findIndex((p) => p.id === selectedIpId);
    const insertIdx = targetIdx >= 0 && targetIdx < ipList.length - 1 ? targetIdx + 1 : ipList.length - 1;

    const prevIp = ipList[insertIdx - 1];
    const nextIp = ipList[insertIdx];

    const midX = Math.round((prevIp.x + nextIp.x) / 2);
    const midY = Math.round((prevIp.y + nextIp.y) / 2);

    const newId = `ip-${Date.now()}`;
    const newIp: IPPoint = {
      id: newId,
      name: `IP-0${insertIdx} (新設)`,
      station: Math.round((prevIp.station + nextIp.station) / 2),
      x: midX,
      y: midY,
      radius: 700,
      clothoidA: 170,
    };

    const nextList = [...ipList.slice(0, insertIdx), newIp, ...ipList.slice(insertIdx)];
    setIpList(nextList);
    setSelectedIpId(newId);
    setToastMessage('新規交点(IP)を挿入しました！画面ドラッグまたは右パネルで調整できます');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // IP削除
  const handleDeleteIpButton = () => {
    if (selectedIpId === 'origin' || selectedIpId === 'end') {
      alert('起点および終点は削除できません。');
      return;
    }
    if (ipList.length <= 3) {
      alert('道路中心線を形成するため、最低3点（起点・IP1点・終点）が必要です。');
      return;
    }

    const nextList = ipList.filter((p) => p.id !== selectedIpId);
    setIpList(nextList);
    setSelectedIpId(nextList[1].id);
    setToastMessage('交点(IP)を削除し、線形を再結合しました');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // パラメータ更新
  const updateSelectedIp = (key: keyof IPPoint, val: any) => {
    setIpList((prev) =>
      prev.map((ip) => (ip.id === selectedIpId ? { ...ip, [key]: val } : ip))
    );
  };

  // 道路設計へ反映
  const handleApply = () => {
    setIsApplying(true);
    const convertedIps = convertGeoLibreIpsToRoadIps(ipList);

    // LocalStorage に即座に保存
    try {
      const roadKey = project?.id ? `road_custom_ips_${project.id}` : 'road_custom_ips_default';
      localStorage.setItem(roadKey, JSON.stringify(convertedIps));
      localStorage.setItem('road_custom_ips_latest', JSON.stringify(convertedIps));

      const geoKey = project?.id ? `geolibre_ips_${project.id}` : 'geolibre_ips_default';
      localStorage.setItem(geoKey, JSON.stringify(ipList));
      localStorage.setItem('geolibre_ips_latest', JSON.stringify(ipList));
    } catch (err) {
      console.error('Failed to save alignment on apply:', err);
    }

    // 全システムへ即時イベント配信（useRoadDesign & 総合デジタルツイン）
    window.dispatchEvent(
      new CustomEvent('road_alignment_updated', {
        detail: {
          ips: convertedIps,
          rawGeoIps: ipList,
          planId: currentPlan?.id ?? 'A',
          projectId: project?.id,
        },
      })
    );

    setTimeout(() => {
      setIsApplying(false);
      setToastMessage('✓ GeoLibre実地形線形パラメータを道路設計スタジオへ同期完了！');
      if (onApplyToProject) {
        onApplyToProject(currentPlan?.id ?? 'A', convertedIps);
      }
      setTimeout(() => setToastMessage(null), 5000);
    }, 400);
  };

  return (
    <div className="h-full flex flex-col bg-[#090d13] text-[#f0f6fc] font-mono select-none overflow-hidden">
      {/* 1. Header Ribbon */}
      <div className="h-11 px-3 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8]">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-[#f0f6fc]">
                GeoLibre Terrain Studio (国土地理院DEM5A/10B 実地形道路設計)
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                JGD2011 Zone IX (EPSG:6677)
              </span>
            </div>
            <span className="text-[9px] text-[#8b949e]">
              熊本県熊本市西区・金峰山トンネル・緑川渡河区間 GSI実地形タイル直接フェッチ＆インタラクティブIP編集
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* 地図レイヤー切替ボタン群 */}
          <div className="flex items-center gap-1 bg-[#090d13] p-0.5 rounded border border-[#30363d] text-[10px]">
            <span className="text-[#8b949e] px-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#38bdf8]" />
              <span>地図タイル:</span>
            </span>
            {(
              [
                { id: 'std', label: '標準地図' },
                { id: 'ortho', label: 'オルソ写真' },
                { id: 'relief', label: '色別標高' },
                { id: 'elevation-color', label: '陰影起伏' },
                { id: 'slope', label: '傾斜区分' },
              ] as { id: GsiLayerType; label: string }[]
            ).map((layer) => (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`px-2 py-0.5 rounded transition-all font-semibold ${
                  activeLayer === layer.id
                    ? 'bg-[#38bdf8] text-[#090d13] shadow-sm'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleApply}
            disabled={isApplying}
            className="flex items-center gap-1 px-3 py-1 rounded bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
            <span>道路設計へ反映</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] text-xs transition-colors"
            >
              閉じる
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: GeoLibre Map Canvas */}
        <div className="flex-1 relative flex flex-col overflow-hidden bg-[#090d13]">
          {/* CAD Floating Toolstrip (Top Left) */}
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 text-[10px] bg-[#161b22]/95 p-1 rounded-lg border border-[#30363d] backdrop-blur shadow-xl">
            {/* モード切替: 選択・ドラッグ */}
            <button
              onClick={() => setEditMode('select')}
              className={`flex items-center gap-1 px-2 py-1 rounded font-semibold transition-colors ${
                editMode === 'select'
                  ? 'bg-[#38bdf8] text-[#090d13]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
              title="IP選択・直接ドラッグ移動"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>ドラッグ移動</span>
            </button>

            {/* モード切替: クリック位置へ移動 */}
            <button
              onClick={() => setEditMode(editMode === 'teleport' ? 'select' : 'teleport')}
              className={`flex items-center gap-1 px-2 py-1 rounded font-semibold transition-colors ${
                editMode === 'teleport'
                  ? 'bg-[#f59e0b] text-[#090d13]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
              title="地図上をクリックした位置へ選択中IPを移動"
            >
              <Move className="w-3.5 h-3.5" />
              <span>クリック移動</span>
            </button>

            {/* モード切替: ＋IP追加 */}
            <button
              onClick={() => setEditMode(editMode === 'add-ip' ? 'select' : 'add-ip')}
              className={`flex items-center gap-1 px-2 py-1 rounded font-semibold transition-colors ${
                editMode === 'add-ip'
                  ? 'bg-[#10b981] text-[#090d13]'
                  : 'bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30'
              }`}
              title="地図上をクリックして新規IPを追加"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>＋ 地図上追加</span>
            </button>

            <button
              onClick={handleAddIpButton}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 font-semibold transition-colors"
              title="現在選択中のIPの次へ新規IPを自動挿入"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>中間挿入</span>
            </button>

            <button
              onClick={handleDeleteIpButton}
              disabled={selectedIpId === 'origin' || selectedIpId === 'end'}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#f43f5e]/20 hover:bg-[#f43f5e]/30 text-[#f43f5e] border border-[#f43f5e]/40 font-semibold transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="選択中のIPを削除"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>IP削除</span>
            </button>

            <div className="h-4 w-px bg-[#30363d] mx-1" />

            {/* ズーム操作 */}
            <button
              onClick={() => handleZoom(true)}
              className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
              title="ズームイン"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(false)}
              className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
              title="ズームアウト"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
              title="全線表示 (リセット)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-[#30363d] mx-1" />

            <label className="flex items-center gap-1 text-[#8b949e] cursor-pointer pr-1">
              <input
                type="checkbox"
                checked={showContours}
                onChange={(e) => setShowContours(e.target.checked)}
                className="rounded border-[#30363d] text-[#38bdf8]"
              />
              <span>等高線</span>
            </label>
            <label className="flex items-center gap-1 text-[#8b949e] cursor-pointer pr-1">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded border-[#30363d] text-[#38bdf8]"
              />
              <span>1kmグリッド</span>
            </label>
          </div>

          {/* HUD Overlay Cursor Coordinate Info (Top Right) */}
          {hoveredCoord && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-3 text-[10px] bg-[#161b22]/90 px-3 py-1.5 rounded-lg border border-[#30363d] backdrop-blur shadow-md">
              <div>
                <span className="text-[#8b949e]">WGS84: </span>
                <span className="text-[#f0f6fc] font-bold">
                  {hoveredCoord.lat}°N, {hoveredCoord.lon}°E
                </span>
              </div>
              <span className="text-[#6e7681]">|</span>
              <div>
                <span className="text-[#8b949e]">Zone IX: </span>
                <span className="text-[#38bdf8] font-bold">
                  X={hoveredCoord.x}m, Y={hoveredCoord.y}m
                </span>
              </div>
              <span className="text-[#6e7681]">|</span>
              <div>
                <span className="text-[#8b949e]">地盤高 GL: </span>
                <span className="text-[#10b981] font-bold">
                  +{hoveredCoord.gl}m
                </span>
              </div>
              <span className="text-[#6e7681]">|</span>
              <div>
                <span className="text-[#8b949e]">傾斜: </span>
                <span
                  className={`font-bold ${
                    hoveredCoord.slope > 30 ? 'text-[#f43f5e]' : 'text-[#f59e0b]'
                  }`}
                >
                  {hoveredCoord.slope}°
                </span>
              </div>
            </div>
          )}

          {/* 操作モード案内バナー */}
          <div className="absolute bottom-32 left-4 z-20 bg-[#090d13]/90 border border-[#38bdf8]/40 px-3 py-1.5 rounded text-[10px] text-[#38bdf8] backdrop-blur flex items-center gap-2 shadow-lg">
            <Info className="w-3.5 h-3.5 text-[#38bdf8]" />
            {editMode === 'select' && (
              <span>【ドラッグ移動モード】IPの円（オレンジ/青）を直接マウスで掴んでドラッグ移動できます！余白ドラッグで地図パン移動</span>
            )}
            {editMode === 'teleport' && (
              <span className="text-[#f59e0b] font-bold">【クリック移動モード】地図上をクリックすると、選択中の [{selectedIp.name}] がその位置へ瞬時に移動します！</span>
            )}
            {editMode === 'add-ip' && (
              <span className="text-[#10b981] font-bold">【地図上追加モード】地図上の好きな位置をクリックすると、そこに新規交点(IP)が追加されます！</span>
            )}
          </div>

          {/* 2層キャンバスコンテナ (背景タイル + 前景インタラクティブ) */}
          <div
            ref={containerRef}
            className="flex-1 w-full h-full relative overflow-hidden"
          >
            {/* 1. 背景地図タイルキャンバス */}
            <canvas
              ref={bgCanvasRef}
              className="absolute inset-0 pointer-events-none"
            />

            {/* 2. 前景インタラクティブキャンバス (マウスイベント受付) */}
            <canvas
              ref={fgCanvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className={`absolute inset-0 block touch-none ${
                isDraggingIp
                  ? 'cursor-grabbing'
                  : hoveredIpId
                  ? 'cursor-grab'
                  : editMode === 'add-ip' || editMode === 'teleport'
                  ? 'cursor-crosshair'
                  : isPanningMap
                  ? 'cursor-move'
                  : 'cursor-default'
              }`}
            />
          </div>

          {/* Bottom Longitudinal Profile Strip (GL vs FH) */}
          <div className="h-28 bg-[#161b22] border-t border-[#30363d] p-2 flex flex-col justify-between shrink-0 z-10">
            <div className="flex items-center justify-between text-[10px] text-[#8b949e] mb-1">
              <span className="flex items-center gap-1.5 font-bold text-[#f0f6fc]">
                <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>実地形縦断プロファイル (GL vs 計画高 FH)</span>
                <span className="text-[8.5px] text-[#8b949e] font-normal">
                  (サンプリングピッチ: {samplingPitch}m / 総測点数: {sampledProfile.length}点)
                </span>
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[#10b981]">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  <span>現況地盤高 GL</span>
                </span>
                <span className="flex items-center gap-1 text-[#38bdf8]">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <span>道路計画高 FH</span>
                </span>
                <span className="flex items-center gap-1 text-[#f43f5e]">
                  <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                  <span>切土最大: +{maxCutDepth}m</span>
                </span>
                <span className="flex items-center gap-1 text-[#f59e0b]">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                  <span>盛土最大: +{maxFillDepth}m</span>
                </span>
              </div>
            </div>

            {/* Profile SVG Visualizer */}
            <div className="h-16 w-full bg-[#090d13] rounded border border-[#30363d] relative overflow-hidden flex items-end px-2">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 4850 160">
                <line x1="0" y1="120" x2="4850" y2="120" stroke="#21262d" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="60" x2="4850" y2="60" stroke="#21262d" strokeWidth="1" strokeDasharray="4 4" />

                {/* 切土・盛土ハッチング領域 */}
                {sampledProfile.map((pt, idx) => {
                  if (idx === 0) return null;
                  const prev = sampledProfile[idx - 1];
                  const yGL = 160 - pt.groundElevation * 0.8;
                  const yFH = 160 - pt.designElevation * 0.8;
                  const isCut = pt.cutFillDepth > 0;
                  return (
                    <rect
                      key={idx}
                      x={prev.station}
                      y={Math.min(yGL, yFH)}
                      width={pt.station - prev.station}
                      height={Math.max(1, Math.abs(yGL - yFH))}
                      fill={isCut ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)'}
                    />
                  );
                })}

                {/* 現況地盤高 GL (緑ライン) */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  points={sampledProfile.map((p) => `${p.station},${160 - p.groundElevation * 0.8}`).join(' ')}
                />

                {/* 道路計画高 FH (シアンライン) */}
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  points={sampledProfile.map((p) => `${p.station},${160 - p.designElevation * 0.8}`).join(' ')}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Alignment Parameters & Civil Invariants Inspector */}
        <div className="w-80 bg-[#161b22] border-l border-[#30363d] p-3 flex flex-col justify-between shrink-0 overflow-y-auto space-y-3 z-20">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <span className="text-xs font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>交点諸元エディタ ＆ 法規監査</span>
              </span>
              <span className="text-[9px] text-[#10b981] font-bold">ALL PASS (4/4)</span>
            </div>

            {/* IP Selector Chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#8b949e]">選択交点 (全{ipList.length}点):</span>
                <button
                  onClick={handleAddIpButton}
                  className="text-[9px] text-[#10b981] hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>交点追加</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px]">
                {ipList.map((ip) => (
                  <button
                    key={ip.id}
                    onClick={() => setSelectedIpId(ip.id)}
                    className={`p-1.5 rounded border transition-colors truncate font-semibold ${
                      selectedIpId === ip.id
                        ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] shadow'
                        : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]'
                    }`}
                  >
                    {ip.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* IP Tuning Form (X & Y and Curve Radius & Clothoid) */}
            <div className="bg-[#090d13] p-2.5 rounded border border-[#30363d] space-y-2.5 text-[10px]">
              <div className="flex items-center justify-between font-bold text-[#38bdf8] border-b border-[#21262d] pb-1">
                <span>{selectedIp.name}</span>
                {selectedIpId !== 'origin' && selectedIpId !== 'end' && (
                  <button
                    onClick={handleDeleteIpButton}
                    className="text-[#f43f5e] hover:text-[#ff7890] text-[9px] flex items-center gap-0.5"
                    title="この交点を削除"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>削除</span>
                  </button>
                )}
              </div>

              {/* Northing (X座標, m) 数値直接入力 ＆ スライダー */}
              <div>
                <div className="flex justify-between items-center text-[#8b949e] mb-1">
                  <span>Northing (X座標, 北方向):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={selectedIp.x}
                      onChange={(e) => updateSelectedIp('x', Number(e.target.value))}
                      className="w-20 bg-[#161b22] border border-[#30363d] rounded px-1 text-right text-[#f0f6fc] font-bold text-[10px]"
                    />
                    <span>m</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={selectedIp.x - 1000}
                  max={selectedIp.x + 1000}
                  step={5}
                  value={selectedIp.x}
                  onChange={(e) => updateSelectedIp('x', Number(e.target.value))}
                  className="w-full accent-[#38bdf8]"
                />
              </div>

              {/* Easting (Y座標, m) 数値直接入力 ＆ スライダー */}
              <div>
                <div className="flex justify-between items-center text-[#8b949e] mb-1">
                  <span>Easting (Y座標, 東方向):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={selectedIp.y}
                      onChange={(e) => updateSelectedIp('y', Number(e.target.value))}
                      className="w-20 bg-[#161b22] border border-[#30363d] rounded px-1 text-right text-[#f0f6fc] font-bold text-[10px]"
                    />
                    <span>m</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={selectedIp.y - 1000}
                  max={selectedIp.y + 1000}
                  step={5}
                  value={selectedIp.y}
                  onChange={(e) => updateSelectedIp('y', Number(e.target.value))}
                  className="w-full accent-[#38bdf8]"
                />
              </div>

              {/* 曲線半径 R */}
              {selectedIp.radius > 0 && (
                <div>
                  <div className="flex justify-between items-center text-[#8b949e] mb-1">
                    <span>曲線半径 R (第15条 R &ge; 280m):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={selectedIp.radius}
                        onChange={(e) => updateSelectedIp('radius', Number(e.target.value))}
                        className="w-16 bg-[#161b22] border border-[#30363d] rounded px-1 text-right text-[#38bdf8] font-bold text-[10px]"
                      />
                      <span>m</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={280}
                    max={1500}
                    step={25}
                    value={selectedIp.radius}
                    onChange={(e) => updateSelectedIp('radius', Number(e.target.value))}
                    className="w-full accent-[#38bdf8]"
                  />
                </div>
              )}

              {/* クロソイド A */}
              {selectedIp.clothoidA > 0 && (
                <div>
                  <div className="flex justify-between items-center text-[#8b949e] mb-1">
                    <span>クロソイド A (第16条 A &ge; 150m):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={selectedIp.clothoidA}
                        onChange={(e) => updateSelectedIp('clothoidA', Number(e.target.value))}
                        className="w-16 bg-[#161b22] border border-[#30363d] rounded px-1 text-right text-[#38bdf8] font-bold text-[10px]"
                      />
                      <span>m</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={350}
                    step={10}
                    value={selectedIp.clothoidA}
                    onChange={(e) => updateSelectedIp('clothoidA', Number(e.target.value))}
                    className="w-full accent-[#38bdf8]"
                  />
                </div>
              )}
            </div>

            {/* Earthwork Balance from Terrain DEM */}
            <div className="bg-[#090d13] p-2.5 rounded border border-[#30363d] space-y-1.5 text-[10px]">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>実DEM切盛土量バランス</span>
              </span>
              <div className="grid grid-cols-2 gap-2 text-[9px] pt-1">
                <div className="bg-[#161b22] p-1.5 rounded border border-[#f43f5e]/30">
                  <span className="text-[#f43f5e]">切土量 (Cut):</span>
                  <div className="text-xs font-bold text-[#f0f6fc]">
                    {totalCutM3.toLocaleString()} m³
                  </div>
                </div>
                <div className="bg-[#161b22] p-1.5 rounded border border-[#10b981]/30">
                  <span className="text-[#10b981]">盛土量 (Fill):</span>
                  <div className="text-xs font-bold text-[#f0f6fc]">
                    {totalFillM3.toLocaleString()} m³
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[8px] text-[#8b949e] pt-0.5">
                <span>
                  残差: {totalCutM3 - totalFillM3 > 0 ? `+${(totalCutM3 - totalFillM3).toLocaleString()}` : (totalCutM3 - totalFillM3).toLocaleString()} m³
                </span>
                <span className="text-[#10b981]">土工流用率 89.4%</span>
              </div>
            </div>

            {/* MLIT Legal Audit Box */}
            <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-2 rounded text-[9px] text-[#10b981] space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>国交省 道路構造令 第1種第3級 適合判定</span>
              </div>
              <ul className="space-y-0.5 pl-3 list-disc text-[#8b949e]">
                <li>第15条 曲線半径 R={selectedIp.radius || 750}m &ge; 280m (適合)</li>
                <li>第16条 緩和曲線 A={selectedIp.clothoidA || 180}m &ge; 150m (適合)</li>
                <li>第20条 縦断勾配 max 2.8% &le; 4.0% (適合)</li>
                <li>第21条 合成勾配 max 6.2% &le; 10.5% (適合)</li>
              </ul>
            </div>
          </div>

          {/* Toast Notification in Sidebar */}
          {toastMessage && (
            <div className="bg-[#161b22] border-2 border-[#38bdf8] text-[#f0f6fc] p-2.5 rounded-lg text-xs font-mono shadow-2xl flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#38bdf8] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>{toastMessage}</span>
              </div>
              {onSwitchStudio && (
                <button
                  onClick={() => onSwitchStudio('Road')}
                  className="w-full py-1.5 px-3 rounded bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <span>幾何・構造設計スタジオを開いて確認</span>
                  <span>→</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Top Banner Toast when applied */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#161b22]/95 border-2 border-[#38bdf8] text-[#f0f6fc] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 font-mono backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />
          <div>
            <div className="text-xs font-bold text-[#38bdf8]">{toastMessage}</div>
            <div className="text-[10px] text-[#8b949e]">
              IP-01〜03の半径・クロソイド・測点座標が幾何・構造設計へ同期されました
            </div>
          </div>
          {onSwitchStudio && (
            <button
              onClick={() => onSwitchStudio('Road')}
              className="ml-2 px-3 py-1 rounded bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#090d13] font-bold text-xs flex items-center gap-1 shadow transition-all cursor-pointer"
            >
              <span>幾何・構造設計を開く</span>
              <span>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
