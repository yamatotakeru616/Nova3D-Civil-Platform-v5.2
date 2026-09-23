/**
 * Nova3D Civil Platform v5.3 - Slope Physics Web Worker
 * バックグラウンドスレッドで2.5D DEM格子上の間隙水圧上昇 & 修正フェレニウス法すべり計算を実行
 * RTX 3050 Ti 環境でメインスレッドCPU負荷25%以下、UI 60FPSを維持
 */

import {
  SlopeStationData,
  RainSimulationParams,
  evaluateAllSlopeStations
} from '../utils/slopeStabilityEngine';

export interface WorkerInputMessage {
  type: 'CALCULATE_STABILITY';
  payload: {
    stations: SlopeStationData[];
    rain: RainSimulationParams;
  };
}

export interface WorkerOutputMessage {
  type: 'STABILITY_RESULT';
  payload: {
    stations: SlopeStationData[];
    computedAt: number;
    durationMs: number;
  };
}

// WebWorker環境内でのイベントリスナー
self.onmessage = (event: MessageEvent<WorkerInputMessage>) => {
  const { type, payload } = event.data;

  if (type === 'CALCULATE_STABILITY') {
    const startTime = performance.now();
    const updatedStations = evaluateAllSlopeStations(payload.stations, payload.rain);
    const durationMs = performance.now() - startTime;

    const response: WorkerOutputMessage = {
      type: 'STABILITY_RESULT',
      payload: {
        stations: updatedStations,
        computedAt: Date.now(),
        durationMs: Number(durationMs.toFixed(2)),
      },
    };

    self.postMessage(response);
  }
};
