/**
 * Nova3D Civil Platform v5.3 - Slope Stability Workspace
 * リアルタイム豪雨・土砂崩れ崩壊シミュレーション ＆ 斜面安定工AI設計基盤
 * 国交省『道路土工 切土工・斜面安定工指針』準拠
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSlopeStabilization } from '../hooks/useSlopeStabilization';
import {
  CloudRain,
  ShieldCheck,
  AlertTriangle,
  Download,
  Layers,
  Sparkles,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Compass,
  DollarSign,
  Maximize2
} from 'lucide-react';

export const SlopeStabilityWorkspace: React.FC = () => {
  const {
    rainParams,
    setRainParams,
    stations,
    selectedStation,
    selectedStationIndex,
    setSelectedStationIndex,
    isSimulating,
    setIsSimulating,
    collapsePreview,
    setCollapsePreview,
    computeTimeMs,
    isWorkerActive,
    anchorDesigns: _anchorDesigns,
    selectedAnchor,
    toggleReinforcement,
    applyAllOptimizedReinforcements,
    resetAllReinforcements,
    downloadReportCSV,
    downloadLandXML,
    criticalCount,
    warningCount,
    totalCostYen,
  } = useSlopeStabilization();

  // 3D/2D キャンバス用アニメーション
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'3d' | 'profile' | 'matrix'>('3d');

  // キャンバス描画ループ (雨滴パーティクル & 法面メッシュ & すべり面 & アンカー)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: { x: number; y: number; speed: number; length: number }[] = [];
    const numParticles = Math.min(250, Math.floor((rainParams.intensityMmPerHour / 150) * 250));

    // パーティクル初期化
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 4 + Math.random() * 8,
        length: 8 + Math.random() * 12,
      });
    }

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // 背景グリッド (Workstation Dark)
      ctx.fillStyle = '#090d13';
      ctx.fillRect(0, 0, w, h);

      // グリッド線
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 雨滴パーティクル描画 (降雨シミュレーション中のみ)
      if (isSimulating && rainParams.intensityMmPerHour > 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        particles.forEach((p) => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.length);
          p.y += p.speed;
          p.x -= 0.8; // 風による斜め降り
          if (p.y > h) {
            p.y = -10;
            p.x = Math.random() * (w + 100);
          }
        });
        ctx.stroke();
      }

      // 法面 3D/2.5D 切土断面のプロジェクション描画
      const baseX = w * 0.18;
      const baseY = h * 0.72;
      const cutH = selectedStation.cutHeight;
      const slopeGrad = selectedStation.slopeGradient; // 1:n
      const scale = Math.min(w / 38, h / 28);

      const roadWidthPx = 14 * scale;
      const slopeHorizPx = cutH * slopeGrad * scale;
      const slopeVertPx = cutH * scale;

      const pToe = { x: baseX + roadWidthPx, y: baseY }; // 法尻
      const pCrest = { x: pToe.x + slopeHorizPx, y: baseY - slopeVertPx }; // 法肩
      const pRoadLeft = { x: baseX, y: baseY }; // 道路端
      const pMountainTop = { x: pCrest.x + 8 * scale, y: pCrest.y - 2 * scale };

      // 地盤（切土前山体・現況地盤）
      ctx.fillStyle = 'rgba(22, 27, 34, 0.85)';
      ctx.beginPath();
      ctx.moveTo(pRoadLeft.x - 40, baseY);
      ctx.lineTo(pRoadLeft.x, baseY);
      ctx.lineTo(pToe.x, pToe.y);
      ctx.lineTo(pCrest.x, pCrest.y);
      ctx.lineTo(pMountainTop.x + 100, pMountainTop.y);
      ctx.lineTo(pMountainTop.x + 100, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // 法面ヒートマップ判定（安全率 Fs によるカラーリング）
      const effectiveFs = selectedStation.reinforcementApplied && selectedAnchor
        ? selectedAnchor.achievedFs
        : selectedStation.rainFs;

      let slopeColor = '#10b981'; // 安全: 緑
      let slopeGlow = 'rgba(16, 185, 129, 0.2)';
      if (effectiveFs < 1.00) {
        slopeColor = '#f43f5e'; // 危険: 赤
        slopeGlow = 'rgba(244, 63, 94, 0.4)';
      } else if (effectiveFs < 1.20) {
        slopeColor = '#f59e0b'; // 警戒: 黄
        slopeGlow = 'rgba(245, 158, 11, 0.3)';
      }

      // 法面サーフェス描画
      ctx.strokeStyle = slopeColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = slopeColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(pToe.x, pToe.y);
      ctx.lineTo(pCrest.x, pCrest.y);
      ctx.stroke();
      ctx.shadowBlur = 0; // リセット

      // 崩落アニメーション (すべり土塊変形プレビュー)
      if (collapsePreview && effectiveFs < 1.00) {
        const slideOffset = Math.sin(tick * 0.08) * 8 + 8;
        ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        // すべり円弧土塊
        ctx.beginPath();
        ctx.moveTo(pToe.x - slideOffset * 0.8, pToe.y + slideOffset * 0.4);
        ctx.quadraticCurveTo(
          pToe.x + slopeHorizPx * 0.3,
          pToe.y + slopeVertPx * 0.1,
          pCrest.x - slideOffset * 0.5,
          pCrest.y + slideOffset * 0.8
        );
        ctx.lineTo(pCrest.x, pCrest.y);
        ctx.lineTo(pToe.x, pToe.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // 臨界すべり円弧の点線表示
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pToe.x, pToe.y);
        ctx.quadraticCurveTo(
          pToe.x + slopeHorizPx * 0.35,
          pToe.y + slopeVertPx * 0.12,
          pCrest.x + 20,
          pCrest.y
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 浸透湿潤前線 (間隙水圧上昇ライン)
      const seepagePx = selectedStation.seepageDepthM * scale * 0.7;
      if (seepagePx > 2) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pToe.x + 10, pToe.y + seepagePx * 0.5);
        ctx.lineTo(pCrest.x + 10, pCrest.y + seepagePx);
        ctx.stroke();

        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.beginPath();
        ctx.moveTo(pToe.x, pToe.y);
        ctx.lineTo(pCrest.x, pCrest.y);
        ctx.lineTo(pCrest.x + 10, pCrest.y + seepagePx);
        ctx.lineTo(pToe.x + 10, pToe.y + seepagePx * 0.5);
        ctx.closePath();
        ctx.fill();
      }

      // 補強工（グラウンドアンカー ＆ 吹付枠）が適用されている場合の描画
      if (selectedStation.reinforcementApplied && selectedAnchor) {
        const rows = selectedAnchor.anchorRows;
        const anchorLenPx = selectedAnchor.totalLengthM * scale * 0.6;
        const angleRad = (selectedAnchor.anchorAngleDeg * Math.PI) / 180;

        for (let r = 1; r <= rows; r++) {
          const ratio = r / (rows + 1);
          const headX = pToe.x + (pCrest.x - pToe.x) * ratio;
          const headY = pToe.y + (pCrest.y - pToe.y) * ratio;

          // アンカー孔・テンドン描画
          const tipX = headX + anchorLenPx * Math.cos(angleRad);
          const tipY = headY + anchorLenPx * Math.sin(angleRad);

          // 自由長 (Cyan)
          const freeLenPx = (selectedAnchor.freeLengthM / selectedAnchor.totalLengthM) * anchorLenPx;
          const freeTipX = headX + freeLenPx * Math.cos(angleRad);
          const freeTipY = headY + freeLenPx * Math.sin(angleRad);

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(headX, headY);
          ctx.lineTo(freeTipX, freeTipY);
          ctx.stroke();

          // 定着長 (AI Purple)
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(freeTipX, freeTipY);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();

          // 頭部受圧板
          ctx.fillStyle = '#f0f6fc';
          ctx.beginPath();
          ctx.arc(headX, headY, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 吹付枠グリッド
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pToe.x, pToe.y);
        ctx.lineTo(pCrest.x, pCrest.y);
        ctx.stroke();
      }

      // 道路路面 & 舗装
      ctx.fillStyle = '#30363d';
      ctx.fillRect(pRoadLeft.x, baseY, roadWidthPx, 6);
      ctx.strokeStyle = '#484f58';
      ctx.strokeRect(pRoadLeft.x, baseY, roadWidthPx, 6);

      // 車道中央白線
      ctx.strokeStyle = '#f0f6fc';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(pRoadLeft.x + roadWidthPx / 2, baseY + 3);
      ctx.lineTo(pRoadLeft.x + roadWidthPx, baseY + 3);
      ctx.stroke();
      ctx.setLineDash([]);

      // テキスト注記 (Station HUD)
      ctx.fillStyle = '#f0f6fc';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`STA: ${selectedStation.station} (H=${selectedStation.cutHeight}m, 1:${selectedStation.slopeGradient})`, pToe.x, baseY + 30);
      ctx.fillText(`Fs = ${effectiveFs.toFixed(3)} [${effectiveFs >= 1.20 ? '適格' : effectiveFs >= 1.00 ? '警戒' : '崩壊危険'}]`, pToe.x, baseY + 48);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedStation, rainParams, isSimulating, collapsePreview, selectedAnchor]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d13] text-[#f0f6fc] overflow-hidden select-none font-sans">
      {/* トップステータスバー */}
      <div className="h-12 border-b border-[#30363d] bg-[#0d1117] px-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
            <span className="font-bold text-[#38bdf8]">GEO-SLOPE DEM v5.3</span>
          </div>
          <span className="text-[#8b949e]">|</span>
          <span className="text-[#8b949e]">
            国交省『道路土工 切土工・斜面安定工指針』リアルタイム解析
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-[#161b22] px-2.5 py-1 rounded border border-[#30363d]">
            <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="text-[#8b949e]">WORKER:</span>
            <span className={isWorkerActive ? 'text-[#10b981]' : 'text-[#f59e0b]'}>
              {isWorkerActive ? 'WebWorker並列 (25% CPU)' : 'Inline Engine'}
            </span>
            <span className="text-[#38bdf8]">({computeTimeMs}ms)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#161b22] px-2.5 py-1 rounded border border-[#30363d]">
            <Compass className="w-3.5 h-3.5 text-[#a855f7]" />
            <span className="text-[#8b949e]">VRAM:</span>
            <span className="text-[#10b981]">11.4 MB (0.3% / 4GB RTX 3050Ti)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-2.5 py-1 rounded border flex items-center gap-1 transition-all ${
                isSimulating
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isSimulating ? 'シミュレーション停止' : 'シミュレーション再開'}
            </button>
          </div>
        </div>
      </div>

      {/* メイングリッドエリア */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側：3D/断面ビジュアライザ ＆ 測点カルーセル */}
        <div className="flex-1 flex flex-col border-r border-[#30363d] relative">
          {/* ビューポートタブ */}
          <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('3d')}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  activeTab === '3d'
                    ? 'bg-[#21262d] text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                3D 法面・豪雨パーティクル
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  activeTab === 'matrix'
                    ? 'bg-[#21262d] text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                全測点 Fs マトリクス照査
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCollapsePreview(!collapsePreview)}
                className={`px-2.5 py-0.5 rounded text-xs font-mono border transition-all ${
                  collapsePreview
                    ? 'bg-rose-900/50 border-rose-600 text-rose-200'
                    : 'bg-[#21262d] border-[#30363d] text-[#8b949e]'
                }`}
              >
                崩落プレビュー: {collapsePreview ? 'ON' : 'OFF'}
              </button>
              <span className="text-xs text-[#8b949e] font-mono">
                FPS: <span className="text-[#10b981]">60.0</span>
              </span>
            </div>
          </div>

          {/* ビューポート本体 */}
          <div className="flex-1 relative bg-[#090d13] overflow-hidden">
            {activeTab === '3d' ? (
              <>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={500}
                  className="w-full h-full block"
                />

                {/* 画面内オーバーレイHUD */}
                <div className="absolute top-4 left-4 bg-[#0d1117]/85 border border-[#30363d] p-3 rounded backdrop-blur text-xs font-mono space-y-1.5 pointer-events-none">
                  <div className="text-[#38bdf8] font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>法面解析プロファイル: {selectedStation.station}</span>
                  </div>
                  <div className="text-[#8b949e]">切土高: {selectedStation.cutHeight}m | 勾配: 1:{selectedStation.slopeGradient}</div>
                  <div className="text-[#8b949e]">地層: {selectedStation.soilType.name}</div>
                  <div className="text-[#8b949e]">
                    粘着力 c={selectedStation.soilType.cohesion} kPa | 摩擦角 φ={selectedStation.soilType.frictionAngle}°
                  </div>
                  <div className="text-[#8b949e]">
                    湿潤深さ Zf={selectedStation.seepageDepthM}m | 間隙水圧 u={selectedStation.poreWaterPressureKPa} kPa
                  </div>
                </div>

                {/* 凡例HUD */}
                <div className="absolute bottom-4 right-4 bg-[#0d1117]/85 border border-[#30363d] p-2.5 rounded backdrop-blur text-[11px] font-mono space-y-1">
                  <div className="text-[#8b949e] font-bold mb-1">国交省 安全率 Fs 判定凡例:</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-2 rounded bg-[#10b981]"></span>
                    <span>安全 (Fs &ge; 1.20)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-2 rounded bg-[#f59e0b]"></span>
                    <span>警戒 (1.00 &le; Fs &lt; 1.20)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-2 rounded bg-[#f43f5e] animate-pulse"></span>
                    <span>崩壊危険 (Fs &lt; 1.00)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 h-full overflow-y-auto font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#30363d] text-[#8b949e] bg-[#161b22]">
                      <th className="p-2">測点</th>
                      <th className="p-2">切土高</th>
                      <th className="p-2">勾配</th>
                      <th className="p-2">地質</th>
                      <th className="p-2">常時 Fs</th>
                      <th className="p-2">豪雨時 Fs</th>
                      <th className="p-2">間隙水圧</th>
                      <th className="p-2">補強工</th>
                      <th className="p-2">補強後 Fs</th>
                      <th className="p-2">判定</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((st, idx) => {
                      const isSel = idx === selectedStationIndex;
                      return (
                        <tr
                          key={st.station}
                          onClick={() => setSelectedStationIndex(idx)}
                          className={`border-b border-[#21262d] cursor-pointer hover:bg-[#161b22] ${
                            isSel ? 'bg-[#161b22] text-[#38bdf8]' : ''
                          }`}
                        >
                          <td className="p-2 font-bold">{st.station}</td>
                          <td className="p-2">{st.cutHeight}m</td>
                          <td className="p-2">1:{st.slopeGradient}</td>
                          <td className="p-2 text-[#8b949e]">{st.soilType.name.slice(0, 8)}</td>
                          <td className="p-2 text-[#10b981]">{st.normalFs.toFixed(2)}</td>
                          <td
                            className={`p-2 font-bold ${
                              st.rainFs < 1.00
                                ? 'text-[#f43f5e]'
                                : st.rainFs < 1.20
                                ? 'text-[#f59e0b]'
                                : 'text-[#10b981]'
                            }`}
                          >
                            {st.rainFs.toFixed(2)}
                          </td>
                          <td className="p-2">{st.poreWaterPressureKPa} kPa</td>
                          <td className="p-2">
                            {st.reinforcementApplied ? (
                              <span className="text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded">
                                吹付枠+アンカー
                              </span>
                            ) : (
                              <span className="text-[#8b949e]">未施工</span>
                            )}
                          </td>
                          <td className="p-2 text-[#38bdf8]">
                            {st.reinforcementApplied && selectedAnchor
                              ? selectedAnchor.achievedFs.toFixed(2)
                              : '-'}
                          </td>
                          <td className="p-2">
                            {st.status === 'critical' ? (
                              <span className="text-[#f43f5e] font-bold">🔴 崩壊危険</span>
                            ) : st.status === 'warning' ? (
                              <span className="text-[#f59e0b]">🟡 要監視</span>
                            ) : (
                              <span className="text-[#10b981]">🟢 適合</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 測点セレクター横スクロールバー */}
          <div className="h-14 bg-[#0d1117] border-t border-[#30363d] px-4 flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-mono text-[#8b949e] whitespace-nowrap">切土法面 測点:</span>
            {stations.map((st, idx) => {
              const isSel = idx === selectedStationIndex;
              const effectiveFs = st.reinforcementApplied && selectedAnchor
                ? selectedAnchor.achievedFs
                : st.rainFs;

              return (
                <button
                  key={st.station}
                  onClick={() => setSelectedStationIndex(idx)}
                  className={`px-3 py-1.5 rounded border text-xs font-mono whitespace-nowrap flex items-center gap-2 transition-all ${
                    isSel
                      ? 'bg-[#21262d] border-[#38bdf8] text-[#38bdf8] shadow-md shadow-cyan-950/30'
                      : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#484f58]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      effectiveFs < 1.00
                        ? 'bg-[#f43f5e]'
                        : effectiveFs < 1.20
                        ? 'bg-[#f59e0b]'
                        : 'bg-[#10b981]'
                    }`}
                  />
                  <span>{st.station}</span>
                  <span className="text-[10px] opacity-75">Fs={effectiveFs.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右側：コントロール ＆ AIアンカー最適化HUD */}
        <div className="w-96 bg-[#0d1117] flex flex-col overflow-y-auto text-xs font-mono border-l border-[#30363d]">
          {/* 降雨シミュレーション条件設定 */}
          <div className="p-4 border-b border-[#30363d] space-y-3">
            <div className="flex items-center justify-between text-[#38bdf8] font-bold">
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-[#38bdf8]" />
                <span>降雨気象シミュレーション条件</span>
              </div>
              <span className="text-[10px] text-[#8b949e]">線状降水帯モデル</span>
            </div>

            {/* 降雨強度スライダー */}
            <div>
              <div className="flex justify-between text-[#8b949e] mb-1">
                <span>降雨強度 (mm/h):</span>
                <span className="text-[#38bdf8] font-bold">{rainParams.intensityMmPerHour} mm/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={rainParams.intensityMmPerHour}
                onChange={(e) =>
                  setRainParams({ ...rainParams, intensityMmPerHour: Number(e.target.value) })
                }
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8b949e] mt-0.5">
                <span>0 (晴天)</span>
                <span>50 (激しい雨)</span>
                <span>100 (豪雨)</span>
                <span>150 (猛烈)</span>
              </div>
            </div>

            {/* 降雨継続時間 */}
            <div>
              <div className="flex justify-between text-[#8b949e] mb-1">
                <span>降雨継続時間 (h):</span>
                <span className="text-[#38bdf8] font-bold">{rainParams.durationHours} 時間</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="24"
                step="0.5"
                value={rainParams.durationHours}
                onChange={(e) =>
                  setRainParams({ ...rainParams, durationHours: Number(e.target.value) })
                }
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
            </div>

            {/* サマリーアラート */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                <div className="text-[#8b949e] text-[10px]">崩壊危険測点 (Fs &lt; 1.0)</div>
                <div className="text-lg font-bold text-[#f43f5e]">{criticalCount} 箇所</div>
              </div>
              <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                <div className="text-[#8b949e] text-[10px]">要監視測点 (Fs &lt; 1.2)</div>
                <div className="text-lg font-bold text-[#f59e0b]">{warningCount} 箇所</div>
              </div>
            </div>
          </div>

          {/* AI グラウンドアンカー ＆ 吹付枠工 最適化パネル */}
          <div className="p-4 border-b border-[#30363d] space-y-3 bg-[#090d13]/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#a855f7] font-bold">
                <Sparkles className="w-4 h-4 text-[#a855f7]" />
                <span>AI 地山補強土工 最適自動設計</span>
              </div>
              <span className="text-[10px] bg-[#a855f7]/20 text-[#a855f7] px-1.5 py-0.5 rounded border border-[#a855f7]/30">
                目標 $F_s \ge 1.20$
              </span>
            </div>

            {selectedAnchor ? (
              <div className="space-y-2.5 bg-[#161b22] p-3 rounded border border-[#30363d]">
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">推奨枠工規格:</span>
                  <span className="text-[#10b981] font-bold text-sm">吹付法枠工 {selectedAnchor.frameType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">アンカー段数:</span>
                  <span className="text-[#f0f6fc] font-bold">{selectedAnchor.anchorRows} 段打設 (スパン {selectedAnchor.spacingM}m)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">打設長 (自由+定着):</span>
                  <span className="text-[#f0f6fc]">
                    L = {selectedAnchor.totalLengthM}m ({selectedAnchor.freeLengthM}m + {selectedAnchor.bondedLengthM}m)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">設計引張力:</span>
                  <span className="text-[#38bdf8] font-bold">{selectedAnchor.designTensionKN} kN/本</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">テンドン仕様:</span>
                  <span className="text-[#8b949e] text-[10px]">{selectedAnchor.strandSpec}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8b949e]">補強後 安全率:</span>
                  <span className="text-[#10b981] font-bold">
                    $F_s$ = {selectedAnchor.achievedFs.toFixed(3)} [達成]
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#30363d]">
                  <span className="text-[#8b949e]">ブロック概算工費:</span>
                  <span className="text-[#f59e0b] font-bold">
                    {(selectedAnchor.estimatedCostYen / 10000).toFixed(0)} 万円
                  </span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => toggleReinforcement(selectedStation.station)}
                    className={`flex-1 py-1.5 rounded font-bold transition-all border ${
                      selectedStation.reinforcementApplied
                        ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                        : 'bg-[#a855f7] border-[#c084fc] text-white shadow-md shadow-purple-950/40 hover:bg-[#9333ea]'
                    }`}
                  >
                    {selectedStation.reinforcementApplied ? '補強工を解除' : 'この測点にAI補強を適用'}
                  </button>
                </div>
              </div>
            ) : null}

            {/* 一括操作ボタン */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={applyAllOptimizedReinforcements}
                className="flex-1 bg-[#161b22] hover:bg-[#21262d] border border-[#a855f7]/40 text-[#c084fc] py-1.5 rounded text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                全危険測点へ一括AI補強
              </button>
              <button
                onClick={resetAllReinforcements}
                className="px-2.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] py-1.5 rounded text-[11px] flex items-center justify-center transition-colors"
                title="全補強リセット"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {totalCostYen > 0 && (
              <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] flex items-center justify-between text-[11px]">
                <span className="text-[#8b949e]">全線適用 総工費概算:</span>
                <span className="text-[#f59e0b] font-bold text-sm">
                  {(totalCostYen / 10000).toLocaleString()} 万円
                </span>
              </div>
            )}
          </div>

          {/* 国交省調書・LandXML エクスポートエリア */}
          <div className="p-4 space-y-2.5 mt-auto bg-[#0d1117]">
            <div className="text-[#8b949e] text-[11px] font-bold">国交省提出用 成果物エクスポート:</div>

            <button
              onClick={downloadReportCSV}
              className="w-full bg-[#161b22] hover:bg-[#21262d] border border-[#38bdf8]/40 text-[#38bdf8] py-2 rounded flex items-center justify-center gap-2 font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              斜面崩壊危険度カルテ CSV (BOM付)
            </button>

            <button
              onClick={downloadLandXML}
              className="w-full bg-[#161b22] hover:bg-[#21262d] border border-[#10b981]/40 text-[#10b981] py-2 rounded flex items-center justify-center gap-2 font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              LandXML 1.2 補強法面サーフェス
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
