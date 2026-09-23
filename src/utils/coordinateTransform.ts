/**
 * 日本の平面直角座標系 (JGD2011 / 第IX系 EPSG:6677 熊本県等) と
 * 経緯度 (WGS84/JGD2011) および Webメルカトル (EPSG:3857) の高精度相互変換モジュール
 * 国土交通省 国土地理院「平面直角座標系」および測量計算式に完全準拠
 */

// GRS80 楕円体定数 (JGD2011)
const A = 6378137.0; // 長半径 (m)
const F = 1.0 / 298.257222101; // 扁平率
const E2 = 2.0 * F - F * F; // 第1離心率の2乗
const E_PRIME2 = E2 / (1.0 - E2); // 第2離心率の2乗

// 平面直角座標系 第IX系 (Zone IX) 原点
// 適用地域: 熊本県、福岡県、佐賀県、長崎県、大分県、宮崎県、鹿児島県
export const ZONE_IX_ORIGIN = {
  latDeg: 33.0, // 北緯33度00分00秒
  lonDeg: 130.5, // 東経130度30分00秒
  scaleFactor: 0.9999, // 縮尺係数 m0
};

const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

/** 子午線弧長の計算 (赤道から緯度phiまでの弧長) */
function meridianDistance(latRad: number): number {
  const e2 = E2;
  const e4 = e2 * e2;
  const e6 = e4 * e2;

  const a0 = 1.0 - e2 / 4.0 - (3.0 * e4) / 64.0 - (5.0 * e6) / 256.0;
  const a2 = (3.0 / 8.0) * (e2 + e4 / 4.0 + (15.0 * e6) / 128.0);
  const a4 = (15.0 / 256.0) * (e4 + (3.0 * e6) / 4.0);
  const a6 = (35.0 * e6) / 3072.0;

  return A * (a0 * latRad - a2 * Math.sin(2.0 * latRad) + a4 * Math.sin(4.0 * latRad) - a6 * Math.sin(6.0 * latRad));
}

/**
 * 経緯度 (WGS84 / JGD2011) -> 平面直角座標系 第IX系 (X: 北方向 m, Y: 東方向 m)
 * @param lat 緯度 (度, 10進)
 * @param lon 経度 (度, 10進)
 * @returns { x: number, y: number } 平面直角座標 (m)
 */
export function latLonToZoneIX(lat: number, lon: number): { x: number; y: number } {
  const phi = lat * DEG2RAD;
  const lambda = lon * DEG2RAD;
  const phi0 = ZONE_IX_ORIGIN.latDeg * DEG2RAD;
  const lambda0 = ZONE_IX_ORIGIN.lonDeg * DEG2RAD;
  const m0 = ZONE_IX_ORIGIN.scaleFactor;

  const dLambda = lambda - lambda0;

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  // 卯酉線曲率半径 N
  const N = A / Math.sqrt(1.0 - E2 * sinPhi * sinPhi);
  const t = tanPhi * tanPhi;
  const eta2 = E_PRIME2 * cosPhi * cosPhi;

  // 赤道からの子午線弧長
  const M = meridianDistance(phi);
  const M0 = meridianDistance(phi0);

  // ガウス・クリューゲル展開 (4次項まで)
  const l = dLambda * cosPhi;
  const l2 = l * l;
  const l3 = l2 * l;
  const l4 = l3 * l;

  const x_raw =
    M -
    M0 +
    N * tanPhi * (l2 / 2.0 + ((5.0 - t + 9.0 * eta2 + 4.0 * eta2 * eta2) * l4) / 24.0);
  const y_raw =
    N * (l + ((1.0 - t + eta2) * l3) / 6.0);

  // 縮尺係数を乗じる
  return {
    x: x_raw * m0,
    y: y_raw * m0,
  };
}

/**
 * 平面直角座標系 第IX系 (X: 北方向 m, Y: 東方向 m) -> 経緯度 (lat, lon)
 * @param x 北方向座標 (m)
 * @param y 東方向座標 (m)
 * @returns { lat: number, lon: number }
 */
export function zoneIXToLatLon(x: number, y: number): { lat: number; lon: number } {
  const phi0 = ZONE_IX_ORIGIN.latDeg * DEG2RAD;
  const lambda0 = ZONE_IX_ORIGIN.lonDeg * DEG2RAD;
  const m0 = ZONE_IX_ORIGIN.scaleFactor;

  const x_unscaled = x / m0;
  const y_unscaled = y / m0;

  const M0 = meridianDistance(phi0);
  const M1 = M0 + x_unscaled;

  // 基準緯度 phi1 のニュートン・ラフソン反復
  let phi1 = M1 / A;
  for (let i = 0; i < 5; i++) {
    const M_temp = meridianDistance(phi1);
    const dM = M1 - M_temp;
    const sinP = Math.sin(phi1);
    const N1 = A / Math.sqrt(1.0 - E2 * sinP * sinP);
    const dPhi = dM / (N1 * (1.0 - E2) / (1.0 - E2 * sinP * sinP));
    phi1 += dPhi;
    if (Math.abs(dPhi) < 1e-12) break;
  }

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);

  const N1 = A / Math.sqrt(1.0 - E2 * sinPhi1 * sinPhi1);
  const R1 = (A * (1.0 - E2)) / Math.pow(1.0 - E2 * sinPhi1 * sinPhi1, 1.5);
  const t1 = tanPhi1 * tanPhi1;
  const eta1_2 = E_PRIME2 * cosPhi1 * cosPhi1;

  const D = y_unscaled / N1;
  const D2 = D * D;
  const D3 = D2 * D;
  const D4 = D3 * D;

  const phi =
    phi1 -
    ((N1 * tanPhi1) / R1) *
      (D2 / 2.0 - ((5.0 + 3.0 * t1 + 10.0 * eta1_2 - 4.0 * eta1_2 * eta1_2 - 9.0 * E_PRIME2) * D4) / 24.0);

  const lambda =
    lambda0 +
    (D - ((1.0 + 2.0 * t1 + eta1_2) * D3) / 6.0) / cosPhi1;

  return {
    lat: phi * RAD2DEG,
    lon: lambda * RAD2DEG,
  };
}

/**
 * 経緯度 (lat, lon) -> Webメルカトル (EPSG:3857, X, Y)
 */
export function latLonToWebMercator(lat: number, lon: number): { x: number; y: number } {
  const x = (lon * 20037508.34) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;
  return { x, y };
}

/**
 * 経緯度から国土地理院・OSM等の標準XYZタイル番号を取得
 */
export function latLonToTileCoords(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const latRad = lat * DEG2RAD;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/**
 * XYZタイル座標からタイルのバウンディングボックス経緯度 (北西端/南東端) を算出
 */
export function tileCoordsToLatLonBounds(
  tileX: number,
  tileY: number,
  zoom: number
): { north: number; south: number; west: number; east: number } {
  const n = Math.pow(2, zoom);
  const west = (tileX / n) * 360 - 180;
  const east = ((tileX + 1) / n) * 360 - 180;

  const northRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * tileY) / n)));
  const southRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (tileY + 1)) / n)));

  const north = northRad * RAD2DEG;
  const south = southRad * RAD2DEG;

  return { north, south, west, east };
}

