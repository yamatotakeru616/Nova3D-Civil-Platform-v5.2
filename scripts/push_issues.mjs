import { execSync } from 'child_process';

const REPO = 'yamatotakeru616/Nova3D-Civil-Platform-v5.2';

function getGitHubToken() {
  const output = execSync('git credential fill', {
    input: 'protocol=https\nhost=github.com\n',
    encoding: 'utf-8'
  });
  for (const line of output.split('\n')) {
    if (line.startsWith('password=')) {
      return line.substring(9).trim();
    }
  }
  throw new Error('GitHub token not found via git credential');
}

const token = getGitHubToken();
const headers = {
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Nova3D-Agent',
  'Content-Type': 'application/json'
};

async function api(path, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  const data = await res.json();
  if (!res.ok && res.status !== 422) {
    throw new Error(`API error ${res.status} on ${path}: ${JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

const labels = [
  { name: 'type:epic', color: 'a855f7', description: '大規模機能エピック' },
  { name: 'type:feature', color: '38bdf8', description: '新規機能' },
  { name: 'type:engine', color: 'f59e0b', description: '計算・物理エンジン' },
  { name: 'type:ui-hud', color: '06b6d4', description: 'UI・HUD・3D描画' },
  { name: 'type:audit', color: '10b981', description: '法規・技術基準照査' },
  { name: 'domain:geotech', color: 'd97706', description: '地盤・土質・斜面安定' },
  { name: 'domain:logistics', color: '2563eb', description: '土工施工・建機運行' },
  { name: 'domain:field-dx', color: 'ec4899', description: '現場MR・AR・WebXR' },
  { name: 'domain:bim-cim', color: '8b5cf6', description: 'BIM/CIM納品・データ交換' },
  { name: 'perf:rtx-3050ti', color: '10b981', description: 'RTX 3050 Ti 4GB VRAM 最適化' },
  { name: 'perf:web-worker', color: '6366f1', description: 'WebWorker並列化' },
  { name: 'compliance:mlit', color: 'ef4444', description: '国交省基準・法令準拠' }
];

const milestones = [
  { title: 'v5.3-Sprint1: Slope-Stability-DEM', description: '豪雨・斜面崩壊物理シミュレーション＆斜面安定工AI設計' },
  { title: 'v5.4-Sprint2: Auto-Fleet-2.0', description: '自律型建機フリート運行制御＆ASAM OpenDRIVE配信' },
  { title: 'v5.5-Sprint3: 4D-AR-Field-MR', description: 'WebXR現場MR完全同期＆出来形自動合否照査' }
];

async function main() {
  console.log('--- 1. Creating Labels ---');
  for (const label of labels) {
    try {
      await api('/labels', {
        method: 'POST',
        body: JSON.stringify(label)
      });
      console.log(`Created label: ${label.name}`);
    } catch (e) {
      console.log(`Label exists or skipped: ${label.name}`);
    }
  }

  console.log('\n--- 2. Creating Milestones ---');
  const milestoneMap = {};
  for (const ms of milestones) {
    const res = await api('/milestones', {
      method: 'POST',
      body: JSON.stringify(ms)
    });
    if (res.status === 201) {
      milestoneMap[ms.title] = res.data.number;
      console.log(`Created milestone: ${ms.title} (#${res.data.number})`);
    } else {
      // Find existing
      const existing = await api('/milestones');
      const found = existing.data.find(m => m.title === ms.title);
      if (found) milestoneMap[ms.title] = found.number;
    }
  }

  console.log('\n--- 3. Creating Issues ---');

  // Epic 1
  console.log('Posting Epic 1...');
  const epic1Res = await api('/issues', {
    method: 'POST',
    body: JSON.stringify({
      title: '[EPIC] リアルタイム豪雨・土砂崩れ崩壊シミュレーション ＆ 斜面安定工AI設計基盤',
      labels: ['type:epic', 'domain:geotech', 'compliance:mlit'],
      milestone: milestoneMap['v5.3-Sprint1: Slope-Stability-DEM'],
      body: `## 概要\n線状降水帯による100mm/h超級のゲリラ豪雨発生時に、法面切土ブロックの土壌水分浸透・間隙水圧上昇と円弧すべり面を個別要素法（DEM/2.5D格子粒子法）でリアルタイム計算し、崩壊危険度ヒートマップ表示および法枠・アンカー工の自動設計を行う基盤を構築する。\n\n### 構成サブタスク\n- [ ] WebWorker並列 2.5D DEM土壌水分・間隙水圧・斜面すべり安全率 Fs リアルタイム計算エンジン\n- [ ] 3D斜面崩落メッシュ・危険度ヒートマップ＆豪雨パーティクルビジュアライザ\n- [ ] 道路土工指針準拠の斜面判定 ＆ 地山補強土工（アンカー・法枠）AI自動配置\n- [ ] 斜面安定計算調書 LandXML 1.2 ＆ 国交省事前協議用 崩壊危険度カルテ CSV エクスポート\n\n### ハードウェア制約\n- Windows 11 / NVIDIA RTX 3050 Ti (4GB VRAM) 環境でのゼロレイテンシ 60FPS 動作`
    })
  });
  const epic1Num = epic1Res.data.number;
  console.log(`Epic 1 created: #${epic1Num}`);

  const epic1Issues = [
    {
      title: 'feat(geotech): WebWorker並列 2.5D DEM土壌水分・間隙水圧・斜面すべり安全率 Fs リアルタイム計算エンジン',
      labels: ['type:engine', 'domain:geotech', 'perf:web-worker', 'perf:rtx-3050ti'],
      milestone: milestoneMap['v5.3-Sprint1: Slope-Stability-DEM'],
      body: `Parent Epic: #${epic1Num}\n\n### 1. ユーザーストーリー\n降雨強度（0〜150mm/h）と継続時間をスライダー操作した際に、切土法面の土壌水分量、間隙水圧、および修正フェレニウス法／ジャンブ法による斜面安全率 $F_s$ がメインスレッドをブロックすることなくミリ秒でリアルタイム更新されること。\n\n### 2. 技術仕様\n- \`src/utils/slopeStabilityEngine.ts\`, \`src/workers/slopePhysicsWorker.ts\`\n- 2.5D格子ハイトマップ（0.5m解像度）上での浸透近似と修正Fellenius法すべり計算\n- WebWorker毎秒30回計算、CPU1スレッド25%以下、メインUI 60FPS維持\n\n### 3. 準拠基準\n- 国交省『道路土工 切土工・斜面安定工指針』 常時 $F_s \\ge 1.20$、降雨時 $F_s \\ge 1.00$\n\n### 4. 受入基準\n- [ ] 降雨入力から100ms以内に各測点(STA.)の法面Fs値が算出されること\n- [ ] UI操作中も60FPSを維持すること\n- [ ] $F_s < 1.00$ で危険フラグが発火すること`
    },
    {
      title: 'feat(ui-3d): 3D斜面崩落メッシュ・危険度ヒートマップ＆豪雨パーティクルビジュアライザ',
      labels: ['type:ui-hud', 'domain:geotech', 'perf:rtx-3050ti'],
      milestone: milestoneMap['v5.3-Sprint1: Slope-Stability-DEM'],
      body: `Parent Epic: #${epic1Num}\n\n### 1. ユーザーストーリー\n豪雨シミュレーション実行時に、雨滴パーティクルが斜面に降り注ぎ、危険度の高い切土法面が緑→黄→赤にカラーマッピングされ、危険箇所では土砂メッシュが変形崩落する視覚演出を確認したい。\n\n### 2. 技術仕様\n- \`src/components/SlopeStabilityWorkspace.tsx\`, \`src/components/3d/SlopeMeshRenderer.tsx\`\n- 軽量プロシージャル法面メッシュ（最大5,000頂点）\n- 雨滴パーティクル（最大1,000粒子）Instancing描画、VRAM 15MB以下\n\n### 3. 受入基準\n- [ ] RTX 3050 Ti 環境で雨滴描画中も常時60FPS維持\n- [ ] $F_s < 1.0$ の危険斜面が赤くパルス発光すること\n- [ ] 崩落プレビューON時にすべり土塊メッシュがアニメーションすること`
    },
    {
      title: 'feat(audit): 道路土工指針準拠の斜面判定 ＆ 地山補強土工（アンカー・法枠）AI自動配置',
      labels: ['type:audit', 'domain:geotech', 'compliance:mlit'],
      milestone: milestoneMap['v5.3-Sprint1: Slope-Stability-DEM'],
      body: `Parent Epic: #${epic1Num}\n\n### 1. ユーザーストーリー\n$F_s < 1.20$ となる危険斜面に対して、AIが自動的に吹付枠工（F300〜F500）およびグラウンドアンカーの必要段数・打設長・引張耐力を逆算し、必要最小限の工費で $F_s \\ge 1.20$ を回復する補強パターンを提案すること。\n\n### 2. 技術仕様\n- \`src/hooks/useSlopeStabilization.ts\`, \`src/utils/groundAnchorOptimizer.ts\`\n- 不足安全率 $\\Delta T$ の逆算、アンカー引張力と打設角度の最適化\n\n### 3. 準拠基準\n- 国交省『道路土工 切土工・斜面安定工指針』『グラウンドアンカー設計・施工基準』\n\n### 4. 受入基準\n- [ ] AI提案適用で補強土工モデルが3D重畳されること\n- [ ] 補強後に $F_s \\ge 1.20$ が保証されること\n- [ ] 工費・諸元表がHUDに即時反映されること`
    },
    {
      title: 'feat(export): 斜面安定計算調書 LandXML 1.2 ＆ 国交省事前協議用 崩壊危険度カルテ CSV エクスポート',
      labels: ['type:feature', 'domain:bim-cim', 'compliance:mlit'],
      milestone: milestoneMap['v5.3-Sprint1: Slope-Stability-DEM'],
      body: `Parent Epic: #${epic1Num}\n\n### 1. ユーザーストーリー\nシミュレーション結果と補強工設計結果を、国交省事前協議用「斜面安定計算調書 CSV」およびBIM/CIM納品用「LandXML 1.2（補強後法面TINサーフェス）」としてワンクリックで出力したい。\n\n### 2. 技術仕様\n- \`src/utils/slopeReportGenerator.ts\`\n- \`ExportPackageModal.tsx\`（BIM/CIM一括納品ハブ）に成果物11として統合\n\n### 3. 受入基準\n- [ ] CSVがBOM付UTF-8で文字化けなく開けること\n- [ ] LandXML 1.2 内に補強法面TINサーフェスが規格通り記述されていること`
    }
  ];

  for (const issue of epic1Issues) {
    const res = await api('/issues', { method: 'POST', body: JSON.stringify(issue) });
    console.log(`Created: #${res.data.number} ${issue.title}`);
  }

  // Epic 2
  console.log('\nPosting Epic 2...');
  const epic2Res = await api('/issues', {
    method: 'POST',
    body: JSON.stringify({
      title: '[EPIC] 自律型重機フリート・完全無人化フォーメーション制御基盤（Auto-Fleet 2.0）',
      labels: ['type:epic', 'domain:logistics', 'compliance:mlit'],
      milestone: milestoneMap['v5.4-Sprint2: Auto-Fleet-2.0'],
      body: `## 概要\n土工マスカーブ最適配分計画に基づき、現場で稼働する無人ダンプトラック群（10t/EV）と油圧ショベル・ブルドーザーに対し、秒単位の走行経路（ASAM OpenDRIVE）と積載・排土フォーメーション指示を自律生成し、現場完全無人施工を実現するテレマティクス管制基盤を開発する。\n\n### 構成サブタスク\n- [ ] 土工LPマスバランス連動 無人重機協調ディスパッチャ ＆ 秒単位運行タイムライン\n- [ ] 現場3D鳥瞰ビュー上の建機フリート自律アニメーション ＆ 車間クリアランスレーダー\n- [ ] ASAM OpenDRIVE v1.7 運行指示ストリーム ＆ 労働安全衛生規則・過積載防止自動照査\n- [ ] i-Construction 2.0 車載テレマティクス日報 CSV ＆ 施工4D LandXML 成果物エクスポート`
    })
  });
  const epic2Num = epic2Res.data.number;
  console.log(`Epic 2 created: #${epic2Num}`);

  const epic2Issues = [
    {
      title: 'feat(logistics): 土工LPマスバランス連動 無人重機協調ディスパッチャ ＆ 秒単位運行タイムライン',
      labels: ['type:engine', 'domain:logistics', 'perf:web-worker'],
      milestone: milestoneMap['v5.4-Sprint2: Auto-Fleet-2.0'],
      body: `Parent Epic: #${epic2Num}\n\n### 1. ユーザーストーリー\n土工マスカーブで確定した切土・盛土・仮置場の土量配分に基づき、ショベルと無人ダンプ群のサイクルタイムを自動計算し、待ち時間ゼロの最適秒単位配車ダイヤを生成したい。\n\n### 2. 技術仕様\n- \`src/utils/fleetDispatcherEngine.ts\`, \`src/hooks/useAutonomousFleet.ts\`\n- キューイング理論(M/M/s)による待ち時間極小化\n- 単線区間のデッドロック回避（トークンパッシングアルゴリズム）\n\n### 3. 準拠基準\n- 国交省『土木工事標準積算基準書』土工・運搬工\n\n### 4. 受入基準\n- [ ] ダンプ台数変更時に運搬便数と進捗率が即座に再計算されること\n- [ ] 重機同士の衝突や交互通行不全が発生しないこと`
    },
    {
      title: 'feat(ui-3d): 現場3D鳥瞰ビュー上の建機フリート自律アニメーション ＆ 車間クリアランスレーダー',
      labels: ['type:ui-hud', 'domain:logistics', 'perf:rtx-3050ti'],
      milestone: milestoneMap['v5.4-Sprint2: Auto-Fleet-2.0'],
      body: `Parent Epic: #${epic2Num}\n\n### 1. ユーザーストーリー\n現場監督として、3Dコリドーおよび工事用道路上をスムーズに走行・排土・転圧する建機群を俯瞰監視し、車両接近警告や運行異常をリアルタイムHUDで把握したい。\n\n### 2. 技術仕様\n- \`src/components/FleetControlWorkspace.tsx\`, \`src/components/3d/FleetPathRenderer.tsx\`\n- ベジエ走行補間による滑らかな60FPS移動\n- 車間距離レーダー（青: 安全、黄: 減速、赤: 緊急ブレーキ）\n\n### 3. 受入基準\n- [ ] 30台同時稼働時もRTX 3050 Ti環境で60FPS維持\n- [ ] 車両クリックで車載視点(Driver POV)に切り替わること`
    },
    {
      title: 'feat(audit): ASAM OpenDRIVE v1.7 運行指示ストリーム ＆ 労働安全衛生規則・過積載防止自動照査',
      labels: ['type:audit', 'domain:logistics', 'compliance:mlit'],
      milestone: milestoneMap['v5.4-Sprint2: Auto-Fleet-2.0'],
      body: `Parent Epic: #${epic2Num}\n\n### 1. ユーザーストーリー\n自動運転建機に配信される走行命令が ASAM OpenDRIVE 1.7 規格に準拠していること、過積載や労働安全衛生法の制限速度（構内 $V \\le 20\\text{km/h}$）に違反していないかを自動照査したい。\n\n### 2. 準拠基準\n- 『労働安全衛生規則』車両系建設機械\n- 『道路交通法』第57条（過積載防止）\n- ASAM OpenDRIVE 1.7\n\n### 3. 受入基準\n- [ ] 土質密度に応じた過積載判定が即時作動すること\n- [ ] 速度・急旋回制限監査がリアルタイム表示されること`
    },
    {
      title: 'feat(export): i-Construction 2.0 車載テレマティクス日報 CSV ＆ 施工4D LandXML 成果物エクスポート',
      labels: ['type:feature', 'domain:bim-cim', 'compliance:mlit'],
      milestone: milestoneMap['v5.4-Sprint2: Auto-Fleet-2.0'],
      body: `Parent Epic: #${epic2Num}\n\n### 1. ユーザーストーリー\n本日の自律フリート稼働実績（総運搬土量、走行距離、アイドリング時間、CO2総削減量）を i-Construction 2.0 準拠の作業日報 CSV として出力し、発注者検査に提出したい。\n\n### 2. 技術仕様\n- \`src/utils/fleetLogGenerator.ts\`\n- \`ExportPackageModal.tsx\`（納品ハブ）に成果物12として統合\n\n### 3. 受入基準\n- [ ] BOM付UTF-8で国交省標準様式CSVが出力されること`
    }
  ];

  for (const issue of epic2Issues) {
    const res = await api('/issues', { method: 'POST', body: JSON.stringify(issue) });
    console.log(`Created: #${res.data.number} ${issue.title}`);
  }

  // Epic 3
  console.log('\nPosting Epic 3...');
  const epic3Res = await api('/issues', {
    method: 'POST',
    body: JSON.stringify({
      title: '[EPIC] 4D AR現場MRグラス・完全同期プロジェクション基盤（WebXR & Construction Edge-Twin）',
      labels: ['type:epic', 'domain:field-dx', 'compliance:mlit'],
      milestone: milestoneMap['v5.5-Sprint3: 4D-AR-Field-MR'],
      body: `## 概要\n現場監督や発注者検査員が現場でMeta Quest 3 / スマートフォンをかざした際、Nova3Dの設計3Dモデル（路床面3D-TIN、構造物杭、地下配管）を空間SLAM点群と1cm精度で重畳表示し、出来形検測のメジャー実測を不要化するWebXR現場MR基盤を開発する。\n\n### 構成サブタスク\n- [ ] WebXR / 現場カメラSLAM点群 1cm精度アライメントエンジン\n- [ ] 3D-TIN路床面・下部工基礎杭・地下埋設管の実空間半透明MRレンダラー\n- [ ] 出来形管理要領準拠 設計面高低差リアルタイムヒートマップ判定 ＆ 規格値合否照査\n- [ ] GNSS測位・測点アノテーション付き現地MR検査調書 CSV ＆ スナップショット保存`
    })
  });
  const epic3Num = epic3Res.data.number;
  console.log(`Epic 3 created: #${epic3Num}`);

  const epic3Issues = [
    {
      title: 'feat(field-dx): WebXR / 現場カメラSLAM点群 1cm精度アライメントエンジン',
      labels: ['type:engine', 'domain:field-dx', 'perf:rtx-3050ti'],
      milestone: milestoneMap['v5.5-Sprint3: 4D-AR-Field-MR'],
      body: `Parent Epic: #${epic3Num}\n\n### 1. ユーザーストーリー\n基準点杭（境界杭・水準点）の既知座標とMRカメラトラッキング特徴点群を3点マッチングさせることで、1cm以内の精度で設計座標系（JGD2011 第IX系）と実空間を位置同期させたい。\n\n### 2. 技術仕様\n- \`src/utils/xrAlignmentEngine.ts\`, \`src/hooks/useXrFieldAlignment.ts\`\n- WebXR Hit Test API & カルマンフィルターによるジッター除去\n\n### 3. 受入基準\n- [ ] 3基準点から実空間推定誤差が $\\Delta \\le 10\\text{mm}$ 以内に収束すること\n- [ ] カメラ移動時にも追従が破綻しないこと`
    },
    {
      title: 'feat(ui-3d): 3D-TIN路床面・下部工基礎杭・地下埋設管の実空間半透明MRレンダラー',
      labels: ['type:ui-hud', 'domain:field-dx', 'perf:rtx-3050ti'],
      milestone: milestoneMap['v5.5-Sprint3: 4D-AR-Field-MR'],
      body: `Parent Epic: #${epic3Num}\n\n### 1. ユーザーストーリー\n完成した道路盛土の上から、地中に埋まった橋梁場所打ち杭（φ1200mm）や雨水排水管の設計位置が「X線透視」のように半透明オパシティで実空間に投影される光景を確認したい。\n\n### 2. 技術仕様\n- \`src/components/FieldXrWorkspace.tsx\`, \`src/components/3d/XrOverlayRenderer.tsx\`\n- レイヤー別透過表示切替、デプスオクルージョンシェーディング\n\n### 3. 受入基準\n- [ ] 実写ビデオ背景と3Dモデル合成描画が60FPSで動作すること\n- [ ] レイヤー切替がラグなく即時切り替わること`
    },
    {
      title: 'feat(audit): 出来形管理要領準拠 設計面高低差リアルタイムヒートマップ判定 ＆ 規格値合否照査',
      labels: ['type:audit', 'domain:field-dx', 'compliance:mlit'],
      milestone: milestoneMap['v5.5-Sprint3: 4D-AR-Field-MR'],
      body: `Parent Epic: #${epic3Num}\n\n### 1. ユーザーストーリー\n現場地面に立っているだけで、足元の実測高と設計路面高の標高差 $\\Delta h$（mm）がリアルタイムに地面へ等高線ヒートマップとしてカラープロジェクションされ、規格値（$\\pm 50\\text{mm}$）内かどうかが合否判定されること。\n\n### 2. 準拠基準\n- 国交省『地上型レーザースキャナーを用いた出来形管理要領（土工編）』\n- 規格値: 路床面 $\\pm 50\\text{mm}$、路盤面 $\\pm 30\\text{mm}$、表層 $\\pm 15\\text{mm}$\n\n### 3. 受入基準\n- [ ] 十字カーソル位置のFH/GH/標高差がmm単位で表示されること\n- [ ] 規格値外箇所が赤く警告表示されること`
    },
    {
      title: 'feat(export): GNSS測位・測点アノテーション付き現地MR検査調書 CSV ＆ スナップショット保存',
      labels: ['type:feature', 'domain:bim-cim', 'compliance:mlit'],
      milestone: milestoneMap['v5.5-Sprint3: 4D-AR-Field-MR'],
      body: `Parent Epic: #${epic3Num}\n\n### 1. ユーザーストーリー\nMR画面上で「📸 出来形検査ショット」を押すだけで、設計面差異・測点番号(STA.)・GNSS緯度経度・合格判定スタンプが焼き込まれた検査証跡画像と検査調書CSVを一括出力したい。\n\n### 2. 技術仕様\n- \`src/utils/xrInspectionReportGenerator.ts\`\n- \`ExportPackageModal.tsx\`（納品ハブ）に成果物13として統合\n\n### 3. 受入基準\n- [ ] 検査画像に電子納品基準準拠の測点情報が正しく埋め込まれること\n- [ ] 総合納品ハブから全13大成果物の一括ZIPエクスポートが行えること`
    }
  ];

  for (const issue of epic3Issues) {
    const res = await api('/issues', { method: 'POST', body: JSON.stringify(issue) });
    console.log(`Created: #${res.data.number} ${issue.title}`);
  }

  console.log('\nAll 15 issues and epics have been successfully pushed to GitHub!');
}

main().catch(err => {
  console.error('Error in push_issues:', err);
  process.exit(1);
});
