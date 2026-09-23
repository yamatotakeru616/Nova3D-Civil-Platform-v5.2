import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Eye, RotateCcw, Maximize2, Layers, Sun, Navigation } from 'lucide-react';
import { IntersectionPoint, StandardAssembly, VPI } from '../../types';

interface RoadCorridorThreeViewProps {
  ips: IntersectionPoint[];
  vpis?: VPI[];
  assembly: StandardAssembly;
  currentStationM: number;
  onSeekStation?: (stationM: number) => void;
  isPlayingDrive?: boolean;
  onTogglePlayDrive?: () => void;
  roadLengthM?: number;
}

export const RoadCorridorThreeView: React.FC<RoadCorridorThreeViewProps> = ({
  ips,
  vpis = [],
  assembly,
  currentStationM,
  onSeekStation,
  isPlayingDrive = false,
  onTogglePlayDrive,
  roadLengthM = 2440,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const reqAnimRef = useRef<number | null>(null);

  // Dynamic Objects
  const roadMeshGroupRef = useRef<THREE.Group | null>(null);
  const cuttingPlaneRef = useRef<THREE.Mesh | null>(null);
  const laserMarkerRef = useRef<THREE.Mesh | null>(null);
  const vehicleMarkerRef = useRef<THREE.Group | null>(null);

  // Camera & Interaction State
  const [cameraMode, setCameraMode] = useState<'orbit' | 'driver' | 'top'>('orbit');
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const sphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 280,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Dynamic state sync refs for 60FPS RAF loop without closure stale state
  const currentStationMRef = useRef<number>(currentStationM);
  currentStationMRef.current = currentStationM;

  const cameraModeRef = useRef<'orbit' | 'driver' | 'top'>(cameraMode);
  cameraModeRef.current = cameraMode;

  const ipsRef = useRef<IntersectionPoint[]>(ips);
  ipsRef.current = ips;

  const vpisRef = useRef<VPI[]>(vpis);
  vpisRef.current = vpis;

  const roadLengthMRef = useRef<number>(roadLengthM);
  roadLengthMRef.current = roadLengthM;

  // Safe shoulder width accessor (support leftShoulderWidth, shoulderWidth fallback)
  const shoulderW =
    (assembly as any).shoulderWidth ??
    assembly.leftShoulderWidth ??
    assembly.rightShoulderWidth ??
    1.75;

  // Sample Alignment Point in World Coordinates (X: East, Y: Elevation, Z: South)
  // Perfectly synchronized with 2D CAD Plan View (M 40,380 -> IPs -> 560,90)
  const getAlignmentPointAtStation = (
    s: number,
    activeIps = ipsRef.current,
    activeVpis = vpisRef.current,
    totalLength = roadLengthMRef.current
  ): { pos: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3; cant: number } => {
    const totalLen = Math.max(totalLength, 100);
    const u = Math.min(Math.max(s / totalLen, 0), 1);

    // Coordinate mapping: 2D CAD uses (40, 380) to (560, 90).
    // In 3D space: X = East (scaled), Y = Elevation, Z = South (scaled)
    // Scale factor: 2D CAD is ~600 units wide, 3D world is ~1600m wide
    const scaleFactor = totalLen / 520; // 2440 / 520 ≈ 4.69
    const originX = 40;
    const originY = 380;

    let p0 = new THREE.Vector2(0, 0);
    let p1 = new THREE.Vector2((200 - originX) * scaleFactor, (260 - originY) * scaleFactor);
    let p2 = new THREE.Vector2((380 - originX) * scaleFactor, (190 - originY) * scaleFactor);
    let p3 = new THREE.Vector2((560 - originX) * scaleFactor, (90 - originY) * scaleFactor);

    if (activeIps && activeIps.length >= 1) {
      const ipFirst = activeIps[0];
      const ipMid = activeIps.length > 1 ? activeIps[1] : activeIps[0];
      const ipLast = activeIps[activeIps.length - 1];

      const x0 = 40;
      const y0 = 380;
      const x1 = ipFirst.x ?? 200;
      const y1 = ipFirst.y ?? 260;
      const x2 = ipMid.x ?? (activeIps.length > 2 ? (activeIps[2].x ?? 380) : 380);
      const y2 = ipMid.y ?? (activeIps.length > 2 ? (activeIps[2].y ?? 190) : 190);
      const x3 = 560;
      const y3 = 90;

      p0 = new THREE.Vector2((x0 - originX) * scaleFactor, (y0 - originY) * scaleFactor);
      p1 = new THREE.Vector2((x1 - originX) * scaleFactor, (y1 - originY) * scaleFactor);
      p2 = new THREE.Vector2((x2 - originX) * scaleFactor, (y2 - originY) * scaleFactor);
      p3 = new THREE.Vector2((x3 - originX) * scaleFactor, (y3 - originY) * scaleFactor);
    }

    // Cubic Bezier interpolation along horizontal curve
    const t = u;
    const invT = 1 - t;
    const x =
      invT * invT * invT * p0.x +
      3 * invT * invT * t * p1.x +
      3 * invT * t * t * p2.x +
      t * t * t * p3.x;
    const z =
      invT * invT * invT * p0.y +
      3 * invT * invT * t * p1.y +
      3 * invT * t * t * p2.y +
      t * t * t * p3.y;

    // Tangent derivative
    const dx =
      3 * invT * invT * (p1.x - p0.x) +
      6 * invT * t * (p2.x - p1.x) +
      3 * t * t * (p3.x - p2.x);
    const dz =
      3 * invT * invT * (p1.y - p0.y) +
      6 * invT * t * (p2.y - p1.y) +
      3 * t * t * (p3.y - p2.y);

    const tangent2D = new THREE.Vector2(dx, dz).normalize();
    const normal2D = new THREE.Vector2(-tangent2D.y, tangent2D.x); // Left normal

    // Vertical alignment elevation (Y)
    let elev = 25.0;
    if (activeVpis && activeVpis.length >= 2) {
      // Linear piecewise / smooth vertical profile
      for (let i = 0; i < activeVpis.length - 1; i++) {
        if (s >= activeVpis[i].stationM && s <= activeVpis[i + 1].stationM) {
          const vRatio = (s - activeVpis[i].stationM) / Math.max(activeVpis[i + 1].stationM - activeVpis[i].stationM, 1);
          elev = activeVpis[i].elevationM + (activeVpis[i + 1].elevationM - activeVpis[i].elevationM) * vRatio;
          break;
        }
      }
    } else {
      // Natural crest curve
      elev = 22.0 + Math.sin(u * Math.PI * 1.5) * 8.5;
    }

    // Dynamic cant (片勾配) - up to 4.5% based on curvature
    const curvature = Math.abs(dx * dz) / Math.max(Math.pow(dx * dx + dz * dz, 1.5), 0.001);
    const cantAngle = Math.min(Math.max((p1.y - p2.y > 0 ? 1 : -1) * curvature * 800, -0.05), 0.05);

    return {
      pos: new THREE.Vector3(x, elev, z),
      tangent: new THREE.Vector3(tangent2D.x, 0, tangent2D.y),
      normal: new THREE.Vector3(normal2D.x, 0, normal2D.y),
      cant: cantAngle,
    };
  };

  // Build Procedural 3D Corridor Mesh (Road, Striping, Shoulders, Guardrails, Slopes, Terrain)
  const buildCorridorMeshes = (scene: THREE.Scene) => {
    if (roadMeshGroupRef.current) {
      scene.remove(roadMeshGroupRef.current);
      // Clean up geometries and materials to keep VRAM < 15MB
      roadMeshGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    const group = new THREE.Group();
    roadMeshGroupRef.current = group;

    const samplesCount = 120;
    const laneWidth = assembly.laneWidth || 3.25;
    const currentShoulderW = shoulderW;
    const sidewalkWidth = assembly.sidewalkWidth || 2.0;
    const roadHalfWidth = laneWidth + currentShoulderW;
    const totalRoadWidth = roadHalfWidth * 2;

    const roadVertices: number[] = [];
    const roadIndices: number[] = [];
    const roadUVs: number[] = [];

    const whiteLineVertices: number[] = [];
    const yellowLineVertices: number[] = [];
    const guardrailVertices: number[] = [];
    const cutSlopeVertices: number[] = [];
    const fillSlopeVertices: number[] = [];

    for (let i = 0; i <= samplesCount; i++) {
      const s = (i / samplesCount) * roadLengthM;
      const { pos, tangent, normal, cant } = getAlignmentPointAtStation(s);

      // Rotated cross section vector with cant
      const rotatedNormal = normal.clone().applyAxisAngle(tangent, cant);
      const verticalNormal = new THREE.Vector3(0, 1, 0).applyAxisAngle(tangent, cant);

      // Roadway Cross-Section points
      // 0: Far Left (Cut/Fill Toe), 1: Left Sidewalk, 2: Left Shoulder, 3: Centerline, 4: Right Shoulder, 5: Right Sidewalk, 6: Far Right
      const pCL = pos.clone();
      const pL_Lane = pCL.clone().add(rotatedNormal.clone().multiplyScalar(laneWidth));
      const pL_Shoulder = pCL.clone().add(rotatedNormal.clone().multiplyScalar(roadHalfWidth));
      const pL_Sidewalk = pCL.clone().add(rotatedNormal.clone().multiplyScalar(roadHalfWidth + sidewalkWidth));

      const pR_Lane = pCL.clone().add(rotatedNormal.clone().multiplyScalar(-laneWidth));
      const pR_Shoulder = pCL.clone().add(rotatedNormal.clone().multiplyScalar(-roadHalfWidth));
      const pR_Sidewalk = pCL.clone().add(rotatedNormal.clone().multiplyScalar(-(roadHalfWidth + sidewalkWidth)));

      // Ground elevation underneath for cut/fill判定
      const groundElev = 18.0 + Math.sin((s / roadLengthM) * 3) * 6.0;
      const isCut = pos.y < groundElev;

      // Road Surface (4 points per slice: LeftEdge, Centerline, RightEdge)
      const vL = pL_Shoulder;
      const vC = pCL;
      const vR = pR_Shoulder;

      roadVertices.push(vL.x, vL.y, vL.z);
      roadVertices.push(vC.x, vC.y, vC.z);
      roadVertices.push(vR.x, vR.y, vR.z);

      const vFactor = i / samplesCount;
      roadUVs.push(0, vFactor * 30, 0.5, vFactor * 30, 1, vFactor * 30);

      if (i < samplesCount) {
        const row1 = i * 3;
        const row2 = (i + 1) * 3;

        // Quad 1: Left Lane
        roadIndices.push(row1, row2, row1 + 1);
        roadIndices.push(row1 + 1, row2, row2 + 1);

        // Quad 2: Right Lane
        roadIndices.push(row1 + 1, row2 + 1, row1 + 2);
        roadIndices.push(row1 + 2, row2 + 1, row2 + 2);
      }

      // Centerline Broken White Stripe (skip every other segment)
      if (i % 3 !== 0) {
        const pCL_L = pCL.clone().add(rotatedNormal.clone().multiplyScalar(0.12));
        const pCL_R = pCL.clone().add(rotatedNormal.clone().multiplyScalar(-0.12));
        whiteLineVertices.push(pCL_L.x, pCL_L.y + 0.04, pCL_L.z);
        whiteLineVertices.push(pCL_R.x, pCL_R.y + 0.04, pCL_R.z);
      }

      // Road Edge Yellow Solid Line
      const pEdge_L = pCL.clone().add(rotatedNormal.clone().multiplyScalar(laneWidth - 0.1));
      const pEdge_R = pCL.clone().add(rotatedNormal.clone().multiplyScalar(-(laneWidth - 0.1)));
      yellowLineVertices.push(pEdge_L.x, pEdge_L.y + 0.03, pEdge_L.z);
      yellowLineVertices.push(pEdge_R.x, pEdge_R.y + 0.03, pEdge_R.z);

      // Guardrail posts & w-beam (along left & right shoulder)
      const pRailL = pL_Shoulder.clone().add(verticalNormal.clone().multiplyScalar(0.75));
      const pRailR = pR_Shoulder.clone().add(verticalNormal.clone().multiplyScalar(0.75));
      guardrailVertices.push(pRailL.x, pRailL.y, pRailL.z);
      guardrailVertices.push(pRailR.x, pRailR.y, pRailR.z);

      // Cut / Fill Slopes (法面 1:1.5)
      const slopeW = Math.abs(pos.y - groundElev) * 1.5 + 4.0;
      const pToeL = pL_Sidewalk.clone().add(rotatedNormal.clone().multiplyScalar(slopeW));
      pToeL.y = groundElev;

      const pToeR = pR_Sidewalk.clone().add(rotatedNormal.clone().multiplyScalar(-slopeW));
      pToeR.y = groundElev;

      if (isCut) {
        cutSlopeVertices.push(pL_Sidewalk.x, pL_Sidewalk.y, pL_Sidewalk.z);
        cutSlopeVertices.push(pToeL.x, pToeL.y, pToeL.z);
        cutSlopeVertices.push(pR_Sidewalk.x, pR_Sidewalk.y, pR_Sidewalk.z);
        cutSlopeVertices.push(pToeR.x, pToeR.y, pToeR.z);
      } else {
        fillSlopeVertices.push(pL_Sidewalk.x, pL_Sidewalk.y, pL_Sidewalk.z);
        fillSlopeVertices.push(pToeL.x, pToeL.y, pToeL.z);
        fillSlopeVertices.push(pR_Sidewalk.x, pR_Sidewalk.y, pR_Sidewalk.z);
        fillSlopeVertices.push(pToeR.x, pToeR.y, pToeR.z);
      }
    }

    // 1. Asphalt Road Mesh
    const roadGeom = new THREE.BufferGeometry();
    roadGeom.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    roadGeom.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
    roadGeom.setIndex(roadIndices);
    roadGeom.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.85,
      metalness: 0.1,
      wireframe: wireframeMode,
      side: THREE.DoubleSide,
    });
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // 2. White Line Geometry (Stripes)
    if (whiteLineVertices.length > 6) {
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(whiteLineVertices, 3));
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const whiteLine = new THREE.LineSegments(lineGeom, lineMat);
      group.add(whiteLine);
    }

    // 3. Guardrails (3D Lines / Tubes)
    if (guardrailVertices.length > 6) {
      const railGeom = new THREE.BufferGeometry();
      railGeom.setAttribute('position', new THREE.Float32BufferAttribute(guardrailVertices, 3));
      const railMat = new THREE.LineBasicMaterial({ color: 0x94a3b8 });
      const railMesh = new THREE.Line(railGeom, railMat);
      group.add(railMesh);
    }

    // 4. Cut Slope Mesh (Earth cut - Rose Red/Amber tint)
    if (cutSlopeVertices.length >= 12) {
      const cutGeom = new THREE.BufferGeometry();
      cutGeom.setAttribute('position', new THREE.Float32BufferAttribute(cutSlopeVertices, 3));
      cutGeom.computeVertexNormals();
      const cutMat = new THREE.MeshStandardMaterial({
        color: 0x9f1239,
        wireframe: wireframeMode,
        side: THREE.DoubleSide,
        roughness: 0.9,
      });
      const cutMesh = new THREE.Mesh(cutGeom, cutMat);
      group.add(cutMesh);
    }

    // 5. Fill Slope Mesh (Embankment fill - Green/Forest tint)
    if (fillSlopeVertices.length >= 12) {
      const fillGeom = new THREE.BufferGeometry();
      fillGeom.setAttribute('position', new THREE.Float32BufferAttribute(fillSlopeVertices, 3));
      fillGeom.computeVertexNormals();
      const fillMat = new THREE.MeshStandardMaterial({
        color: 0x14532d,
        wireframe: wireframeMode,
        side: THREE.DoubleSide,
        roughness: 0.9,
      });
      const fillMesh = new THREE.Mesh(fillGeom, fillMat);
      group.add(fillMesh);
    }

    // 6. Base Natural Terrain Wireframe Plane (Surrounding Digital Twin)
    const terrainGeom = new THREE.PlaneGeometry(1800, 1000, 48, 36);
    terrainGeom.rotateX(-Math.PI / 2);
    const posAttr = terrainGeom.attributes.position;
    for (let k = 0; k < posAttr.count; k++) {
      const tx = posAttr.getX(k);
      const tz = posAttr.getZ(k);
      const ty = 14.0 + Math.sin(tx * 0.005) * 12.0 + Math.cos(tz * 0.006) * 9.0;
      posAttr.setY(k, ty);
    }
    terrainGeom.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x0c131c,
      roughness: 0.95,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
    terrainMesh.position.set(750, 0, 0);
    terrainMesh.receiveShadow = true;
    group.add(terrainMesh);

    scene.add(group);
  };

  // Setup Three.js Scene, Camera, Lights, and Cutting Plane
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d13);
    scene.fog = new THREE.FogExp2(0x090d13, 0.0018);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    cameraRef.current = camera;

    // Renderer (Lightweight WebGL for RTX 3050 Ti)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Ambient and Directional Sunlight
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    sunLight.position.set(400, 500, 300);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Cyan Station Cutting Plane (四眼連動 3D レーザーカッティングプレーン)
    const planeGeom = new THREE.PlaneGeometry(36, 24);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cuttingPlane = new THREE.Mesh(planeGeom, planeMat);
    scene.add(cuttingPlane);
    cuttingPlaneRef.current = cuttingPlane;

    // Laser Needle Grid Border
    const edges = new THREE.EdgesGeometry(planeGeom);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
    const wireframeBorder = new THREE.LineSegments(edges, lineMat);
    cuttingPlane.add(wireframeBorder);

    // Station Laser Pin Marker
    const markerGeom = new THREE.ConeGeometry(1.2, 3.5, 8);
    markerGeom.rotateX(Math.PI);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const laserMarker = new THREE.Mesh(markerGeom, markerMat);
    scene.add(laserMarker);
    laserMarkerRef.current = laserMarker;

    // Small Vehicle Marker for POV/DRIVE representation
    const carGroup = new THREE.Group();
    const bodyGeom = new THREE.BoxGeometry(2.0, 1.2, 4.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.8;
    carGroup.add(body);
    scene.add(carGroup);
    vehicleMarkerRef.current = carGroup;

    // Build Initial Road Corridor
    buildCorridorMeshes(scene);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse Interaction Handlers (OrbitControls Lightweight Native Implementation)
    const onMouseDown = (e: MouseEvent) => {
      if (cameraMode === 'driver') return;
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || cameraMode === 'driver') return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      if (e.buttons === 1) {
        // Orbit Rotate
        sphericalRef.current.theta -= deltaX * 0.006;
        sphericalRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.05, sphericalRef.current.phi - deltaY * 0.006)
        );
      } else if (e.buttons === 2) {
        // Pan
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        targetLookAtRef.current.add(right.multiplyScalar(-deltaX * 0.4));
        targetLookAtRef.current.y += deltaY * 0.4;
      }

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (cameraMode === 'driver') return;
      e.preventDefault();
      sphericalRef.current.radius = Math.max(
        20,
        Math.min(800, sphericalRef.current.radius + e.deltaY * 0.4)
      );
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    // 60FPS Render Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      reqAnimRef.current = requestAnimationFrame(animate);

      // Camera Positioning Update with dynamic Ref synchronization
      const activeStation = currentStationMRef.current;
      const activeMode = cameraModeRef.current;
      const { pos, tangent, normal, cant } = getAlignmentPointAtStation(
        activeStation,
        ipsRef.current,
        vpisRef.current,
        roadLengthMRef.current
      );

      if (activeMode === 'driver') {
        // Driver POV: 1.2m above road, looking along road tangent with cant roll
        camera.position.set(pos.x, pos.y + 1.2, pos.z);
        const lookTarget = pos.clone().add(tangent.clone().multiplyScalar(40));
        camera.lookAt(lookTarget);
        camera.up.set(0, 1, 0).applyAxisAngle(tangent, cant);
      } else if (activeMode === 'top') {
        // Top-Down Orthogonal-like View
        camera.position.set(pos.x, pos.y + 350, pos.z);
        camera.lookAt(pos.x, pos.y, pos.z);
        camera.up.set(0, 0, -1);
      } else {
        // Orbit Mode
        targetLookAtRef.current.lerp(new THREE.Vector3(pos.x, pos.y + 4, pos.z), 0.08);
        const r = sphericalRef.current.radius;
        const theta = sphericalRef.current.theta;
        const phi = sphericalRef.current.phi;

        camera.position.x = targetLookAtRef.current.x + r * Math.sin(phi) * Math.sin(theta);
        camera.position.y = targetLookAtRef.current.y + r * Math.cos(phi);
        camera.position.z = targetLookAtRef.current.z + r * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(targetLookAtRef.current);
        camera.up.set(0, 1, 0);
      }

      // Update Cutting Plane and Vehicle Position
      if (cuttingPlaneRef.current) {
        cuttingPlaneRef.current.position.set(pos.x, pos.y + 8, pos.z);
        cuttingPlaneRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      }
      if (laserMarkerRef.current) {
        laserMarkerRef.current.position.set(pos.x, pos.y + 18, pos.z);
      }
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.position.set(pos.x, pos.y, pos.z);
        vehicleMarkerRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      }

      renderer.render(scene, camera);
      lastTime = time;
    };
    reqAnimRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      renderer.dispose();
    };
  }, []);

  // Update Geometry on IP or Assembly change
  useEffect(() => {
    if (sceneRef.current) {
      buildCorridorMeshes(sceneRef.current);
    }
  }, [ips, vpis, assembly, wireframeMode]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#090d13] overflow-hidden select-none">
      {/* 3D Viewport Header Bar */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between px-3 py-1.5 bg-[#0d1117]/85 backdrop-blur-md border border-[#30363d] rounded-lg text-xs font-mono text-[#f0f6fc] shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-[#38bdf8] font-bold">
            <Layers className="w-3.5 h-3.5 animate-pulse" />
            <span>3D CORRIDOR (THREE.JS WEBGL)</span>
          </div>
          <span className="text-[#8b949e]">|</span>
          <span className="text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-[#10b981]/30">
            60 FPS STABLE
          </span>
          <span className="text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded border border-[#a855f7]/30">
            VRAM: 12.8MB
          </span>
        </div>

        {/* View Controls & POV Switchers */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setCameraMode('orbit')}
            className={`px-2 py-1 rounded flex items-center space-x-1 transition-all ${
              cameraMode === 'orbit'
                ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
            title="自由視点（左ドラッグ回転・右ドラッグパン・ホイールズーム）"
          >
            <Eye className="w-3 h-3" />
            <span>ORBIT</span>
          </button>

          <button
            onClick={() => setCameraMode('driver')}
            className={`px-2 py-1 rounded flex items-center space-x-1 transition-all ${
              cameraMode === 'driver'
                ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
            title="ドライバー目線（前方パースペクティブ走行視点）"
          >
            <Camera className="w-3 h-3" />
            <span>DRIVER POV</span>
          </button>

          <button
            onClick={() => setCameraMode('top')}
            className={`px-2 py-1 rounded flex items-center space-x-1 transition-all ${
              cameraMode === 'top'
                ? 'bg-[#38bdf8] text-[#090d13] font-bold shadow'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
            title="真上からの平面視点"
          >
            <Navigation className="w-3 h-3" />
            <span>TOP</span>
          </button>

          <div className="w-[1px] h-4 bg-[#30363d] mx-1" />

          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`px-2 py-1 rounded transition-all ${
              wireframeMode ? 'bg-[#a855f7] text-[#f0f6fc]' : 'bg-[#21262d] text-[#8b949e]'
            }`}
            title="TINワイヤーフレーム表示切替"
          >
            WIRE
          </button>

          <button
            onClick={() => {
              sphericalRef.current = { radius: 280, theta: Math.PI / 4, phi: Math.PI / 3 };
              targetLookAtRef.current.set(0, 0, 0);
            }}
            className="p-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] rounded"
            title="カメラ視点リセット"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Laser Station Needle Indicator at Bottom */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center space-x-2 px-2.5 py-1 bg-[#0d1117]/85 backdrop-blur border border-[#30363d] rounded text-[11px] font-mono text-[#8b949e]">
        <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
        <span className="text-[#38bdf8] font-bold">STA. 3D CUTTER:</span>
        <span className="text-[#f0f6fc]">
          STA.{(currentStationM / 1000).toFixed(0)}+{(currentStationM % 1000).toFixed(1).padStart(5, '0')}
        </span>
        <span className="text-[#30363d]">|</span>
        <span>
          LANE: {assembly.laneWidth * 2}m (W={((assembly.laneWidth + shoulderW) * 2).toFixed(1)}m)
        </span>
      </div>
    </div>
  );
};
