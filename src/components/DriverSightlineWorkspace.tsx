import React, { useState, useEffect, useRef } from 'react';
import {
  Car,
  Truck,
  Sun,
  CloudRain,
  Moon,
  Gauge,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Download,
  Navigation,
  Compass,
  Zap,
  ArrowRight,
  Maximize2,
  RefreshCw,
  Radio,
  Cpu,
  Layers,
} from 'lucide-react';
import { useDriverSightline } from '../hooks/useDriverSightline';
import { OpenDriveModal } from './OpenDriveModal';

export function DriverSightlineWorkspace() {
  const [isOpenDriveModalOpen, setIsOpenDriveModalOpen] = useState<boolean>(false);
  const [isAutonomousMode, setIsAutonomousMode] = useState<boolean>(true);
  const {
    state,
    auditItems,
    isWiperActive,
    setIsWiperActive,
    isHeadlightHigh,
    setIsHeadlightHigh,
    setCurrentStationM,
    setTargetSpeedKmh,
    setIsCruiseActive,
    setVehicleType,
    setWeather,
    setIsAccelerating,
    setIsBraking,
    exportSightlineReportCsv,
  } = useDriverSightline();

  // ワイパー往復角度アニメーション
  const [wiperAngle, setWiperAngle] = useState<number>(0);
  useEffect(() => {
    if (state.weather !== 'heavy_rain' && !isWiperActive) return;
    let animId: number;
    let t = 0;
    const loop = () => {
      t += 0.08;
      setWiperAngle(Math.sin(t) * 45);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state.weather, isWiperActive]);

  // アスファルト白線の高速スクロールオフセット
  const [stripeOffset, setStripeOffset] = useState<number>(0);
  useEffect(() => {
    let animId: number;
    const loop = () => {
      setStripeOffset((prev) => (prev + (state.speedKmh / 60) * 8) % 60);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state.speedKmh]);

  // カーブに応じた消失点Xシフト (-100 to +100 px)
  const curveOffsetX = Math.max(-120, Math.min(120, (1200 / state.curveRadiusM) * 60));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d13] text-[#f0f6fc] font-sans overflow-hidden">
      {/* 1. Header Bar */}
      <header className="h-10 border-b border-[#21262d] bg-[#0d1117] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#38bdf8]/10 rounded border border-[#38bdf8]/30">
            <Eye className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div>
            <h1 className="text-[12px] font-bold tracking-wider font-mono text-[#f0f6fc] flex items-center gap-2">
              DRIVER SIGHTLINE & VR WALKTHROUGH
              <span className="text-[10px] px-1.5 py-0.2 bg-[#38bdf8]/20 text-[#38bdf8] rounded font-normal">
                道路構造令第11条 停止視距 (SSD ≥ 75m)
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 bg-[#161b22] px-2.5 py-1 rounded border border-[#30363d]">
            <Compass className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="text-[#8b949e]">STA:</span>
            <span className="font-bold text-[#f0f6fc]">
              {(state.currentStationM / 1000).toFixed(3).replace('.', '+')}
            </span>
            <span className="text-[9px] text-[#6e7681]">/ 24+500</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#161b22] px-2.5 py-1 rounded border border-[#30363d]">
            <Gauge className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="text-[#8b949e]">SPEED:</span>
            <span className="font-bold text-[#10b981]">{state.speedKmh.toFixed(1)}</span>
            <span className="text-[9px] text-[#6e7681]">km/h</span>
          </div>

          <button
            onClick={() => setIsAutonomousMode(!isAutonomousMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all shadow-sm ${
              isAutonomousMode
                ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40'
                : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isAutonomousMode ? 'ADAS 自律走行 HUD: ON' : 'ADAS HUD: OFF'}</span>
          </button>

          <button
            onClick={() => setIsOpenDriveModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 font-bold rounded text-[11px] transition-colors shadow-sm"
            title="ASAM OpenDRIVE 1.7 ＆ 国交省ダイナミックマップを生成・保存"
          >
            <Car className="w-3.5 h-3.5" />
            <span>HDマップ (OpenDRIVE)</span>
          </button>

          <button
            onClick={exportSightlineReportCsv}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#38bdf8] hover:bg-[#0284c7] text-[#090d13] font-bold rounded text-[11px] transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>視距レポート CSV</span>
          </button>
        </div>
      </header>

      {/* 2. Main 3-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Cockpit Controls & Vehicle Setup */}
        <div className="w-80 border-r border-[#21262d] bg-[#0d1117] flex flex-col shrink-0 overflow-y-auto p-3 space-y-4 text-[11px]">
          {/* Cruise & Speed Control */}
          <div className="bg-[#161b22] p-3 rounded border border-[#30363d]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#38bdf8]" />
                走行速度制御 (CRUISE)
              </span>
              <button
                onClick={() => setIsCruiseActive(!state.isCruiseActive)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                  state.isCruiseActive
                    ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                    : 'bg-[#21262d] text-[#8b949e]'
                }`}
              >
                {state.isCruiseActive ? 'AUTO CRUISE ON' : 'MANUAL'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-2.5">
              {[40, 60, 80].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setTargetSpeedKmh(v);
                    setIsCruiseActive(true);
                  }}
                  className={`py-1 rounded font-mono text-[10px] font-bold border transition-colors ${
                    state.targetSpeedKmh === v && state.isCruiseActive
                      ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                      : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:bg-[#30363d]'
                  }`}
                >
                  {v} km/h
                  {v === 60 && <span className="text-[8px] block text-[#10b981]">設計速度</span>}
                </button>
              ))}
            </div>

            {/* Manual Throttle / Brake Touch Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#21262d]">
              <button
                onMouseDown={() => setIsAccelerating(true)}
                onMouseUp={() => setIsAccelerating(false)}
                onTouchStart={() => setIsAccelerating(true)}
                onTouchEnd={() => setIsAccelerating(false)}
                className={`py-2 rounded font-mono font-bold text-center border transition-all ${
                  state.isAccelerating
                    ? 'bg-[#10b981] text-[#090d13] border-[#10b981] shadow-lg'
                    : 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/20'
                }`}
              >
                加速 [W / ↑]
              </button>
              <button
                onMouseDown={() => setIsBraking(true)}
                onMouseUp={() => setIsBraking(false)}
                onTouchStart={() => setIsBraking(true)}
                onTouchEnd={() => setIsBraking(false)}
                className={`py-2 rounded font-mono font-bold text-center border transition-all ${
                  state.isBraking
                    ? 'bg-[#f43f5e] text-white border-[#f43f5e] shadow-lg'
                    : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30 hover:bg-[#f43f5e]/20'
                }`}
              >
                制動 [S / ↓]
              </button>
            </div>
            <p className="text-[9px] text-[#6e7681] mt-1 text-center font-mono">
              ※キーボード [W/S] または長押しで手動アクセル・急制動
            </p>
          </div>

          {/* Vehicle Type & Eye Height */}
          <div className="bg-[#161b22] p-3 rounded border border-[#30363d]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#38bdf8]" />
                車種 ＆ アイポイント (H)
              </span>
              <span className="font-mono text-[10px] text-[#38bdf8] font-bold">
                H = {state.eyeHeightM.toFixed(2)}m
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setVehicleType('passenger')}
                className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 border transition-colors ${
                  state.vehicleType === 'passenger'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <Car className="w-4 h-4" />
                <span className="text-[9px] font-mono">乗用車 (1.2m)</span>
              </button>
              <button
                onClick={() => setVehicleType('truck')}
                className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 border transition-colors ${
                  state.vehicleType === 'truck'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span className="text-[9px] font-mono">大型10t (2.5m)</span>
              </button>
              <button
                onClick={() => setVehicleType('bus')}
                className={`py-1.5 px-2 rounded flex flex-col items-center gap-1 border transition-colors ${
                  state.vehicleType === 'bus'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span className="text-[9px] font-mono">路線バス (2.1m)</span>
              </button>
            </div>
          </div>

          {/* Environment & Weather */}
          <div className="bg-[#161b22] p-3 rounded border border-[#30363d]">
            <span className="font-mono font-bold text-[#f0f6fc] block mb-2 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[#f59e0b]" />
              気象・天候モード
            </span>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button
                onClick={() => setWeather('clear')}
                className={`py-1.5 rounded flex items-center justify-center gap-1 border text-[10px] font-mono ${
                  state.weather === 'clear'
                    ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                晴天
              </button>
              <button
                onClick={() => setWeather('heavy_rain')}
                className={`py-1.5 rounded flex items-center justify-center gap-1 border text-[10px] font-mono ${
                  state.weather === 'heavy_rain'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                豪雨 (ワイパー)
              </button>
              <button
                onClick={() => setWeather('night')}
                className={`py-1.5 rounded flex items-center justify-center gap-1 border text-[10px] font-mono ${
                  state.weather === 'night'
                    ? 'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                夜間 (ライト)
              </button>
            </div>
            <div className="flex gap-2 text-[10px] font-mono">
              <button
                onClick={() => setIsWiperActive(!isWiperActive)}
                className={`flex-1 py-1 rounded border text-center ${
                  isWiperActive || state.weather === 'heavy_rain'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                    : 'bg-[#21262d] text-[#6e7681] border-[#30363d]'
                }`}
              >
                ワイパー動作
              </button>
              <button
                onClick={() => setIsHeadlightHigh(!isHeadlightHigh)}
                className={`flex-1 py-1 rounded border text-center ${
                  isHeadlightHigh || state.weather === 'night'
                    ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]'
                    : 'bg-[#21262d] text-[#6e7681] border-[#30363d]'
                }`}
              >
                ハイビーム
              </button>
            </div>
          </div>

          {/* Station Quick Seek */}
          <div className="bg-[#161b22] p-3 rounded border border-[#30363d]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-bold text-[#f0f6fc]">測点ジャンプ (STA)</span>
              <span className="font-mono text-[#38bdf8] font-bold">
                STA.{(state.currentStationM / 1000).toFixed(3).replace('.', '+')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24500"
              step="100"
              value={state.currentStationM}
              onChange={(e) => setCurrentStationM(Number(e.target.value))}
              className="w-full accent-[#38bdf8] cursor-pointer mb-2"
            />
            <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
              <button
                onClick={() => setCurrentStationM(4000)}
                className="py-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded text-center"
              >
                IP-02 急曲線
              </button>
              <button
                onClick={() => setCurrentStationM(7400)}
                className="py-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded text-center"
              >
                緑川渡河橋梁
              </button>
              <button
                onClick={() => setCurrentStationM(14000)}
                className="py-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded text-center"
              >
                金峰山トンネル
              </button>
            </div>
          </div>
        </div>

        {/* CENTER PANE: 60FPS Perspective Cockpit Viewport */}
        <div className="flex-1 flex flex-col bg-[#05070a] relative overflow-hidden">
          {/* 3D Perspective Road Canvas */}
          <div className="flex-1 relative w-full h-full">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Sky Gradient */}
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={
                      state.weather === 'night'
                        ? '#05070d'
                        : state.isInsideTunnel
                        ? '#0a0d14'
                        : state.weather === 'heavy_rain'
                        ? '#1e293b'
                        : '#0c4a6e'
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor={
                      state.weather === 'night'
                        ? '#0d1117'
                        : state.isInsideTunnel
                        ? '#161b22'
                        : state.weather === 'heavy_rain'
                        ? '#334155'
                        : '#38bdf8'
                    }
                  />
                </linearGradient>

                {/* Road Gradient */}
                <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e2430" />
                  <stop
                    offset="100%"
                    stopColor={state.weather === 'heavy_rain' ? '#0f172a' : '#12161f'}
                  />
                </linearGradient>

                {/* Headlight Beam Gradient */}
                <radialGradient id="headlightBeam" cx="50%" cy="100%" r="80%">
                  <stop offset="0%" stopColor="rgba(255,255,220,0.4)" />
                  <stop offset="60%" stopColor="rgba(255,255,200,0.15)" />
                  <stop offset="100%" stopColor="rgba(255,255,200,0)" />
                </radialGradient>

                {/* ADAS Autonomous LKA Guide Gradient */}
                <linearGradient id="adasLaneGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(56,189,248,0.05)" />
                  <stop offset="60%" stopColor="rgba(56,189,248,0.22)" />
                  <stop offset="100%" stopColor="rgba(16,185,129,0.35)" />
                </linearGradient>
              </defs>

              {/* Sky Background */}
              <rect x="0" y="0" width="1000" height="320" fill="url(#skyGrad)" />

              {/* Mountains & Background City (Kumamoto/Kinpo) */}
              {!state.isInsideTunnel && (
                <g opacity={state.weather === 'heavy_rain' ? 0.3 : 0.8}>
                  {/* Kinposan Mountain Silhouette */}
                  <polygon
                    points={`0,320 180,240 320,270 480,210 650,280 820,230 1000,320`}
                    fill={state.weather === 'night' ? '#0b1017' : '#0f172a'}
                  />
                  {/* PLATEAU LOD2/LOD3 Buildings Silhouette */}
                  <rect
                    x="80"
                    y="250"
                    width="45"
                    height="70"
                    fill={state.weather === 'night' ? '#161b22' : '#1e293b'}
                  />
                  <rect
                    x="135"
                    y="220"
                    width="60"
                    height="100"
                    fill={state.weather === 'night' ? '#161b22' : '#1e293b'}
                  />
                  <rect
                    x="750"
                    y="235"
                    width="55"
                    height="85"
                    fill={state.weather === 'night' ? '#161b22' : '#1e293b'}
                  />
                  <rect
                    x="820"
                    y="260"
                    width="70"
                    height="60"
                    fill={state.weather === 'night' ? '#161b22' : '#1e293b'}
                  />
                </g>
              )}

              {/* Midorikawa Bridge Truss Overhead (if on bridge) */}
              {state.isOnBridge && (
                <g stroke="#10b981" strokeWidth="3" opacity="0.6" fill="none">
                  {/* Truss Arches */}
                  <path d="M 150,320 Q 500,40 850,320" />
                  <path d="M 220,320 Q 500,80 780,320" />
                  {/* Vertical & Diagonal Bracings */}
                  <line x1="300" y1="320" x2="330" y2="120" />
                  <line x1="500" y1="320" x2="500" y2="60" />
                  <line x1="700" y1="320" x2="670" y2="120" />
                  <line x1="330" y1="120" x2="500" y2="320" />
                  <line x1="670" y1="120" x2="500" y2="320" />
                </g>
              )}

              {/* Tunnel Portal & Tube (if approaching or inside tunnel) */}
              {state.isInsideTunnel ? (
                /* Inside Tunnel Concrete Tube */
                <g>
                  {/* Tunnel Ceiling Arc */}
                  <path
                    d={`M 100,600 L ${400 + curveOffsetX},300 Q ${500 + curveOffsetX},220 ${
                      600 + curveOffsetX
                    },300 L 900,600 Z`}
                    fill="#161b22"
                    stroke="#30363d"
                    strokeWidth="2"
                  />
                  {/* Ceiling Lighting Line (Sodium/LED) */}
                  <line
                    x1="450"
                    y1="600"
                    x2={490 + curveOffsetX}
                    y2="240"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeDasharray="12 8"
                  />
                  <line
                    x1="550"
                    y1="600"
                    x2={510 + curveOffsetX}
                    y2="240"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeDasharray="12 8"
                  />
                </g>
              ) : state.currentStationM >= 13900 && state.currentStationM < 14200 ? (
                /* Approaching Tunnel Portal */
                <g>
                  <path
                    d={`M ${380 + curveOffsetX},320 Q ${500 + curveOffsetX},190 ${
                      620 + curveOffsetX
                    },320 Z`}
                    fill="#05070a"
                    stroke="#8b949e"
                    strokeWidth="8"
                  />
                  <text
                    x={500 + curveOffsetX}
                    y="220"
                    textAnchor="middle"
                    fill="#f0f6fc"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    金峰山第1トンネル 1,850m
                  </text>
                </g>
              ) : null}

              {/* Ground & Road Surface */}
              <polygon
                points={`0,320 1000,320 1000,600 0,600`}
                fill={state.weather === 'night' ? '#090d13' : '#0f172a'}
              />

              {/* Main Asphalt Road Perspective */}
              <polygon
                points={`-150,600 ${460 + curveOffsetX},320 ${
                  540 + curveOffsetX
                },320 1150,600`}
                fill="url(#roadGrad)"
              />

              {/* Road Shoulders (Left & Right Guardrails) */}
              <line
                x1="-150"
                y1="600"
                x2={460 + curveOffsetX}
                y2="320"
                stroke="#475569"
                strokeWidth="4"
              />
              <line
                x1="1150"
                y1="600"
                x2={540 + curveOffsetX}
                y2="320"
                stroke="#475569"
                strokeWidth="4"
              />

              {/* Left Edge Solid White Line */}
              <line
                x1="-60"
                y1="600"
                x2={475 + curveOffsetX}
                y2="320"
                stroke="#f8fafc"
                strokeWidth="3"
                opacity="0.8"
              />
              {/* Right Edge Solid White Line */}
              <line
                x1="1060"
                y1="600"
                x2={525 + curveOffsetX}
                y2="320"
                stroke="#f8fafc"
                strokeWidth="3"
                opacity="0.8"
              />

              {/* ADAS Autonomous Lane Keep (LKA) & LiDAR Sweep Overlay */}
              {isAutonomousMode && (
                <g opacity="0.85">
                  {/* Lane Keep Corridor Polygon */}
                  <polygon
                    points={`200,600 800,600 ${515 + curveOffsetX},350 ${485 + curveOffsetX},350`}
                    fill="url(#adasLaneGradient)"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="8 6"
                  />
                  {/* Center Trajectory Prediction Line */}
                  <line
                    x1="500"
                    y1="600"
                    x2={500 + curveOffsetX}
                    y2="350"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray="12 8"
                    strokeDashoffset={-stripeOffset * 1.5}
                  />
                  {/* LiDAR Radial Scanner Arcs */}
                  <path
                    d={`M ${400 + curveOffsetX * 0.4},480 A 180 60 0 0 1 ${600 + curveOffsetX * 0.4},480`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.7"
                  />
                  <path
                    d={`M ${350 + curveOffsetX * 0.6},430 A 240 70 0 0 1 ${650 + curveOffsetX * 0.6},430`}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1"
                    strokeDasharray="6 4"
                    opacity="0.5"
                  />
                  {/* Vehicle Ego Target Box */}
                  <circle cx={500 + curveOffsetX * 0.75} cy="375" r="4" fill="#10b981" />
                  <circle cx={500 + curveOffsetX * 0.75} cy="375" r="8" fill="none" stroke="#10b981" strokeWidth="1" />
                  <text
                    x={515 + curveOffsetX * 0.75}
                    y="378"
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    HD-MAP TARGET
                  </text>
                </g>
              )}

              {/* Center Dashed Line (Animated with stripeOffset) */}
              <line
                x1="500"
                y1="600"
                x2={500 + curveOffsetX}
                y2="320"
                stroke="#f8fafc"
                strokeWidth="4"
                strokeDasharray="25 20"
                strokeDashoffset={-stripeOffset}
              />

              {/* Stopping Sight Distance Cone & Target Obstacle (75m 前方) */}
              <g>
                {/* 75m SSD Distance Marker Line */}
                <line
                  x1={380 + curveOffsetX * 0.6}
                  y1="400"
                  x2={620 + curveOffsetX * 0.6}
                  y2="400"
                  stroke={state.isSightlineClear ? '#10b981' : '#f43f5e'}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text
                  x={635 + curveOffsetX * 0.6}
                  y="404"
                  fill={state.isSightlineClear ? '#10b981' : '#f43f5e'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  SSD {state.stoppingSightDistanceRequiredM}m
                </text>

                {/* Virtual Obstacle (Pylon/Hazard on lane) */}
                <g
                  transform={`translate(${490 + curveOffsetX * 0.65}, 385) scale(${
                    state.isSightlineClear ? 1 : 1.2
                  })`}
                >
                  <polygon points="10,0 20,25 0,25" fill="#f97316" />
                  <rect x="2" y="25" width="16" height="3" fill="#1e293b" />
                  <rect x="5" y="10" width="10" height="4" fill="#ffffff" />
                </g>
              </g>

              {/* Overhead Gantry Highway Sign */}
              <g>
                {/* Gantry Poles */}
                <line
                  x1="220"
                  y1="480"
                  x2="220"
                  y2="280"
                  stroke="#64748b"
                  strokeWidth="5"
                />
                <line
                  x1="780"
                  y1="480"
                  x2="780"
                  y2="280"
                  stroke="#64748b"
                  strokeWidth="5"
                />
                <line
                  x1="210"
                  y1="280"
                  x2="790"
                  y2="280"
                  stroke="#64748b"
                  strokeWidth="6"
                />

                {/* Sign Board (Green Highway Guide) */}
                <rect
                  x="330"
                  y="235"
                  width="340"
                  height="45"
                  rx="4"
                  fill="#065f46"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x="500"
                  y="262"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {state.approachingSignText}
                </text>
              </g>

              {/* Night Headlight Cone Overlay */}
              {(state.weather === 'night' || state.isInsideTunnel) && (
                <polygon
                  points="200,600 500,320 800,600"
                  fill="url(#headlightBeam)"
                  pointerEvents="none"
                />
              )}

              {/* Heavy Rain Streaks Overlay */}
              {state.weather === 'heavy_rain' && (
                <g stroke="#94a3b8" strokeWidth="1" opacity="0.4">
                  {Array.from({ length: 30 }).map((_, idx) => (
                    <line
                      key={idx}
                      x1={(idx * 37 + stripeOffset * 2) % 1000}
                      y1={(idx * 43) % 600}
                      x2={((idx * 37 + stripeOffset * 2) % 1000) - 15}
                      y2={((idx * 43) % 600) + 40}
                    />
                  ))}
                </g>
              )}

              {/* Wiper Blade (if active) */}
              {(state.weather === 'heavy_rain' || isWiperActive) && (
                <g
                  transform={`translate(500, 600) rotate(${wiperAngle})`}
                  stroke="#334155"
                  strokeWidth="6"
                >
                  <line x1="0" y1="0" x2="0" y2="-280" stroke="#0f172a" strokeWidth="8" />
                  <line x1="-30" y1="-280" x2="30" y2="-280" stroke="#0284c7" strokeWidth="4" />
                </g>
              )}

              {/* Car Dashboard Frame */}
              <path
                d="M 0,600 Q 500,520 1000,600 L 1000,600 L 0,600 Z"
                fill="#0b0f17"
                stroke="#1f2937"
                strokeWidth="2"
              />
            </svg>

            {/* In-Cockpit HUD Overlay Cards */}
            <div className="absolute bottom-3 left-4 flex items-end gap-3 pointer-events-none">
              {/* Digital Speedometer & Gear */}
              <div className="bg-[#0d1117]/85 backdrop-blur-md p-3 rounded-lg border border-[#30363d] shadow-2xl flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-mono text-[#8b949e] block">VEHICLE SPEED</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-mono text-[#10b981]">
                      {Math.round(state.speedKmh)}
                    </span>
                    <span className="text-xs font-mono text-[#8b949e]">KM/H</span>
                  </div>
                </div>

                <div className="border-l border-[#30363d] pl-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold bg-[#38bdf8]/20 text-[#38bdf8] px-1.5 py-0.5 rounded">
                      GEAR: D
                    </span>
                    {state.isCruiseActive && (
                      <span className="text-[10px] font-mono text-[#10b981] font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#10b981]" />
                        CRUISE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-[#8b949e] mt-1">
                    カント勾配: {state.roadBankDeg.toFixed(1)}% / 縦断: {state.gradePercent.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Sightline Safety Status Pill */}
              <div
                className={`p-2.5 rounded-lg border backdrop-blur-md flex items-center gap-2 ${
                  state.isSightlineClear
                    ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]'
                    : 'bg-[#f43f5e]/15 border-[#f43f5e]/40 text-[#f43f5e] animate-pulse'
                }`}
              >
                {state.isSightlineClear ? (
                  <ShieldCheck className="w-5 h-5 text-[#10b981]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[#f43f5e]" />
                )}
                <div>
                  <div className="text-[11px] font-mono font-bold">
                    {state.isSightlineClear
                      ? '停止視距: 適合 (PASS)'
                      : '停止視距: 死角注意 (WARN)'}
                  </div>
                  <div className="text-[9px] font-mono opacity-90">
                    実視距 {state.stoppingSightDistanceActualM}m ≥ 必要 {state.stoppingSightDistanceRequiredM}m
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Infrastructure Badge Top-Right */}
            <div className="absolute top-3 right-4 flex flex-col items-end gap-1.5 font-mono text-[11px]">
              <div className="bg-[#0d1117]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#30363d] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                <span className="text-[#f0f6fc] font-bold">
                  {state.isOnBridge
                    ? '緑川渡河橋梁区間 (全長380m)'
                    : state.isInsideTunnel
                    ? '金峰山第1トンネル (L=1,850m)'
                    : '平野部・土工高架盛土区間'}
                </span>
              </div>

              {isAutonomousMode && (
                <div className="bg-[#0d1117]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#a855f7]/40 shadow-lg flex items-center gap-2.5 text-[10px]">
                  <Cpu className="w-3.5 h-3.5 text-[#a855f7] animate-pulse" />
                  <div>
                    <div className="text-[#a855f7] font-bold flex items-center gap-1.5">
                      AUTONOMOUS L4 ACTIVE
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    </div>
                    <div className="text-[#8b949e]">
                      Steer: <strong className="text-[#38bdf8]">{curveOffsetX > 0 ? `+${(curveOffsetX * 0.04).toFixed(1)}°` : `${(curveOffsetX * 0.04).toFixed(1)}°`}</strong> | ODD: <strong className="text-[#10b981]">OPTIMAL</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Road Order Article 11 Sightline Audit Matrix */}
        <div className="w-88 border-l border-[#21262d] bg-[#0d1117] flex flex-col shrink-0 overflow-y-auto p-3 space-y-4 text-[11px]">
          {/* AI ADAS Agent Safety Summary */}
          <div className="bg-[#161b22] p-3 rounded border border-[#38bdf8]/40 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono font-bold text-[#38bdf8] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                ADAS リアルタイム視覚安全診断
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#10b981]/20 text-[#10b981] font-bold rounded">
                COMPLIANT
              </span>
            </div>
            <p className="text-[11px] text-[#c9d1d9] leading-relaxed">
              設計速度 <strong>60km/h</strong> における道路構造令第11条「停止視距」計算式に基づき、
              縦断勾配 {state.gradePercent.toFixed(1)}% 補正後の必要停止視距{' '}
              <strong className="text-[#f0f6fc]">{state.stoppingSightDistanceRequiredM}m</strong> に対して、
              カーブ側壁クリアランスから算出される有効見通し視距{' '}
              <strong className="text-[#10b981]">{state.stoppingSightDistanceActualM}m</strong> を確保しています。
            </p>
          </div>

          {/* Sightline Audit Matrix Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                道路構造令・視距法規照査
              </span>
              <span className="text-[10px] font-mono text-[#8b949e]">全6項目</span>
            </div>

            <div className="space-y-2">
              {auditItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#161b22] p-2.5 rounded border border-[#30363d] hover:border-[#38bdf8]/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-[#f0f6fc] text-[11px]">
                      {item.title}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        item.status === 'PASS'
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-[#8b949e] mb-1">
                    <div>基準: {item.limit}</div>
                    <div className="text-[#f0f6fc] font-bold">実績: {item.actual}</div>
                  </div>

                  <div className="text-[9px] text-[#6e7681] font-mono flex items-center justify-between border-t border-[#21262d] pt-1">
                    <span>{item.clause}</span>
                    <span className="text-[#8b949e]">{item.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Report Card */}
          <div className="bg-[#161b22] p-3 rounded border border-[#30363d] text-center">
            <span className="font-mono font-bold text-[#f0f6fc] block mb-1">
              走行視線アセスメント成果物
            </span>
            <p className="text-[10px] text-[#8b949e] mb-2.5">
              各STAにおける停止視距・見通し障害・トンネル明暗順応・標識視認性を国交省BIM/CIM様式で出力
            </p>
            <button
              onClick={exportSightlineReportCsv}
              className="w-full py-1.5 bg-[#38bdf8] hover:bg-[#0284c7] text-[#090d13] font-mono font-bold rounded flex items-center justify-center gap-1.5 text-[11px] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>走行評価レポート CSV ダウンロード</span>
            </button>
          </div>
        </div>
      </div>

      {/* Autonomous Driving HD-Map (OpenDRIVE 1.7 / GeoJSON) Modal */}
      <OpenDriveModal
        isOpen={isOpenDriveModalOpen}
        onClose={() => setIsOpenDriveModalOpen(false)}
      />
    </div>
  );
}
