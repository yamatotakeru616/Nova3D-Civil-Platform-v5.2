import { IntersectionPoint } from '../types';
import { IPPoint } from '../components/GeoLibreTerrainWorkspace';

/**
 * GeoLibreの実地形IPリスト（JGD2011 第IX系 X/Y）を、
 * 道路設計モジュール（RoadDesignWorkspace）の IntersectionPoint[] 形式に高精度変換する
 */
export function convertGeoLibreIpsToRoadIps(geoIps: IPPoint[]): IntersectionPoint[] {
  if (!geoIps || geoIps.length === 0) return [];

  // 全点の座標バウンディングボックスを算出（SVGキャンバス 600x400 への正規化用）
  const allX = geoIps.map((p) => p.x);
  const allY = geoIps.map((p) => p.y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  // 起点と終点を除く中間交点（IP）を抽出
  // もし全てが中間点扱いの場合はインデックス1〜length-2をIPとし、単一の場合はそれを使用
  const ipPoints = geoIps.filter(
    (p, idx) => p.id !== 'origin' && p.id !== 'end' && idx > 0 && idx < geoIps.length - 1
  );

  const targetIps = ipPoints.length > 0 ? ipPoints : geoIps.slice(1, -1);

  return targetIps.map((p, idx) => {
    // 前後の点を特定して交角(IA)を計算
    const fullIdx = geoIps.findIndex((item) => item.id === p.id);
    const prev = fullIdx > 0 ? geoIps[fullIdx - 1] : geoIps[0];
    const next = fullIdx < geoIps.length - 1 ? geoIps[fullIdx + 1] : geoIps[geoIps.length - 1];

    const v1x = p.x - prev.x;
    const v1y = p.y - prev.y;
    const v2x = next.x - p.x;
    const v2y = next.y - p.y;

    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;

    const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
    const clampedDot = Math.max(-1, Math.min(1, dot));
    const iaRad = Math.acos(clampedDot);
    const iaDeg = (iaRad * 180) / Math.PI;

    const cross = v1x * v2y - v1y * v2x;
    const isRight = cross > 0;

    const deg = Math.floor(iaDeg);
    const min = Math.round((iaDeg - deg) * 60);
    const thetaStr = `${deg}°${min.toString().padStart(2, '0')}' ${isRight ? 'R' : 'L'}`;

    // SVGキャンバス座標マッピング (Padding: X 80〜520, Y 80〜320)
    // 東西座標(Y) -> SVG X, 南北座標(X) -> SVG Y (北が上なので反転)
    const svgX = Math.round(80 + ((p.y - minY) / spanY) * 440);
    const svgY = Math.round(320 - ((p.x - minX) / spanX) * 240);

    const radius = p.radius > 0 ? p.radius : 350;
    const clothoidA = p.clothoidA > 0 ? p.clothoidA : 120;
    const clothoidL = Number(((clothoidA * clothoidA) / radius).toFixed(1));
    const curveLength = Number((radius * iaRad + clothoidL).toFixed(1));
    const tangentLength = Number((radius * Math.tan(iaRad / 2) + clothoidL / 2).toFixed(1));
    const externalSecant = Number((radius * (1 / Math.cos(iaRad / 2) - 1)).toFixed(1));

    const km = Math.floor(p.station / 1000);
    const m = Math.round(p.station % 1000);
    const stationStr = `STA. ${km}+${m.toString().padStart(3, '0')}`;

    const idNumber = (idx + 1).toString().padStart(2, '0');

    return {
      id: `IP-${idNumber}`,
      station: stationStr,
      theta: thetaStr,
      radius,
      clothoidA: `${clothoidA}/${clothoidA}`,
      clothoidL,
      superelevation: radius < 400 ? 5.0 : 4.0,
      widening: radius < 300 ? 0.5 : 0.25,
      curveLength,
      status: radius >= 280 ? 'PASS' : 'WARN',
      note: p.name || `実地形IP-${idNumber}`,
      x: svgX,
      y: svgY,
      isDraggable: true,
      iaDeg: Number(iaDeg.toFixed(2)),
      aParam: clothoidA,
      tangentLength,
      externalSecant,
    };
  });
}
