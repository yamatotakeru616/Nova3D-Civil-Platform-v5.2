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

async function main() {
  console.log('--- 1. Checking Labels ---');
  try {
    await api('/labels', {
      method: 'POST',
      body: JSON.stringify({
        name: 'domain:cad-bim',
        color: '0284c7',
        description: 'CAD・CIM製図・幾何・図面表現'
      })
    });
    console.log('Created label: domain:cad-bim');
  } catch (e) {
    console.log('Label exists or skipped');
  }

  console.log('\n--- 2. Creating Milestone ---');
  let milestoneNumber;
  const msRes = await api('/milestones', {
    method: 'POST',
    body: JSON.stringify({
      title: 'v5.3-Sprint2: QuadView-ThreeJS-ModernUI',
      description: '四眼連動エンジニアリング設計（Three.js 3D・平面・縦断・横断）＆ワークステーションUI刷新'
    })
  });

  if (msRes.status === 201) {
    milestoneNumber = msRes.data.number;
    console.log(`Created milestone: v5.3-Sprint2: QuadView-ThreeJS-ModernUI (#${milestoneNumber})`);
  } else {
    const listRes = await api('/milestones');
    const found = listRes.data.find(m => m.title === 'v5.3-Sprint2: QuadView-ThreeJS-ModernUI');
    milestoneNumber = found?.number;
    console.log(`Using existing milestone: #${milestoneNumber}`);
  }

  console.log('\n--- 3. Posting Epic ---');
  const epicRes = await api('/issues', {
    method: 'POST',
    body: JSON.stringify({
      title: '[EPIC] 四眼連動エンジニアリング設計（Three.js 3D・平面・縦断・横断）＆ ワークステーションUI刷新',
      labels: ['type:epic', 'domain:cad-bim', 'type:ui-hud', 'perf:rtx-3050ti', 'compliance:mlit'],
      milestone: milestoneNumber,
      body: `## 概要
国土交通省道路構造令およびBIM/CIM設計照査要領に完全準拠し、疑似3D SVG描画から **Vanilla Three.js (WebGL)** への完全移行を行い、2D平面図・縦断図・横断図のCAD製図精度・操作性、および暗色高密度ワークステーションUIを刷新する最優先Epic。

### 構成サブタスク
- [ ] #Issue-1: Vanilla Three.js 本格3Dコリドー＆実地形メッシュレンダラー実装（OrbitControls・車載POV・路面マテリアル）
- [ ] #Issue-2: 2D平面図 CAD/QGISエンジンの描画・操作性高度化（スムーズパン/ズーム、正確なクロソイド・法線展開、主要点測点杭アノテーション）
- [ ] #Issue-3: 縦断プロファイルエンジンの刷新（GL地盤高vs計画高FH、VPIパラメトリック変形、凸凹型VCL縦断曲線、勾配・切盛面積HUD）
- [ ] #Issue-4: マルチアセンブリ横断スライサーの高度化（舗装・路盤層、片勾配カントすりつけ、法面1:1.5、排水工寸法線表示）
- [ ] #Issue-5: Technical Workstation Modernismに基づくUI刷新 ＆ 四眼（平面・縦断・横断・3D）完全同期レーザーシーク統合

### ハードウェア・性能制約
- Windows 11 / NVIDIA RTX 3050 Ti (4GB VRAM) 環境でのゼロレイテンシ 60FPS 維持
- VRAM消費 15MB 以下のプロシージャル最適化メッシュ設計`
    })
  });

  const epicNum = epicRes.data.number;
  console.log(`Epic created: #${epicNum}`);

  const subIssues = [
    {
      title: 'feat(viewport-3d): Vanilla Three.js 本格3Dコリドー＆実地形メッシュレンダラー実装（OrbitControls・車載POV・路面マテリアル）',
      labels: ['type:ui-hud', 'domain:cad-bim', 'perf:rtx-3050ti'],
      milestone: milestoneNumber,
      body: `Parent Epic: #${epicNum}\n\n### 1. ユーザーストーリー\n土木設計者として、道路コリドーが従来のフラットなSVG疑似3Dから、本物の3Dポリゴンメッシュ（Three.js WebGL）として滑らかに押し出し描画され、マウスによる自由な回転・パン・ズーム（OrbitControls）や、ワンクリックでの走行視点（Driver POV）へ切り替えられることを求める。\n\n### 2. 技術仕様\n- \`src/components/3d/RoadCorridorThreeView.tsx\` 新規実装\n- Vanilla Three.js (\`three\` 依存追加、React 19と完全互換)\n- プロシージャルな路面メッシュ押出（アスファルト、センターライン白線、路肩エッジ、波形ガードレール、切土・盛土法面）\n- DirectionalLight + AmbientLight による立体陰影、軽量PCFシャドウ\n- 四眼連動の測点3Dレーザーカッティングプレーン\n\n### 3. 性能制約\n- RTX 3050 Ti (4GB VRAM) 環境で常時 60FPS 維持、頂点数 20,000 以内\n\n### 4. 受入基準\n- [ ] Three.js Canvas上でマウス左ドラッグで視点回転、右ドラッグでパン、ホイールでズームができること\n- [ ] 測点シーク時に3Dカッティングプレーンが正確にコリドー上を移動すること\n- [ ] DRIVEモード（自動走行）ボタン押下時に車載カメラが線形に沿って前進すること`
    },
    {
      title: 'feat(cad-plan): 2D平面図 CAD/QGISエンジンの描画・操作性高度化（スムーズパン/ズーム、正確なクロソイド・法線展開、主要点測点杭アノテーション）',
      labels: ['type:ui-hud', 'domain:cad-bim', 'compliance:mlit'],
      milestone: milestoneNumber,
      body: `Parent Epic: #${epicNum}\n\n### 1. ユーザーストーリー\nCAD操作者として、2D平面図上でマウスホイールによる直感的なズームや中ボタンドラッグによるパンができ、道路構造令に基づく緩和曲線（クロソイド KA/KE杭）や円弧（BC/MC/EC杭）の寸法・測点杭がCAD製図基準に準拠して精緻に描画されることを求める。\n\n### 2. 技術仕様\n- スムーズなMatrix Transform（Scale & Translate）による自由パン・ズーム操作\n- 測点杭（No.杭 @20m、主要点杭 KA, KE, BC, MC, EC）の法線方向引き出し線アノテーション\n- 車線幅員（3.25m×2）、路肩（1.75m）、歩道（2.00m）の外側エッジ構成線の正確なオフセット展開\n- 地形等高線と計画高の交差から法面勾配（1:1.5）に応じた切土法肩線・盛土法尻線の展開\n\n### 3. 準拠基準\n- 国交省『土木製図基準（平面図編）』\n- 『道路構造令』第15条（曲線半径）、第16条（緩和曲線長）\n\n### 4. 受入基準\n- [ ] 平面図上でマウスホイールによる拡大縮小および中ボタンドラッグパンがスムーズに動作すること\n- [ ] IPドラッグ時に全主要点杭および接線長(TL)、外距(SL)、曲線長(CL)がリアルタイム再描画されること`
    },
    {
      title: 'feat(profile-view): 縦断プロファイルエンジンの刷新（GL地盤高vs計画高FH、VPIパラメトリック変形、凸凹型VCL縦断曲線、勾配・切盛面積HUD）',
      labels: ['type:engine', 'domain:cad-bim', 'compliance:mlit'],
      milestone: milestoneNumber,
      body: `Parent Epic: #${epicNum}\n\n### 1. ユーザーストーリー\n縦断設計者として、地形断面（地盤線 GL）と計画路面線（FH）の切土盛土関係が明瞭にハッチング表示され、変勾配点（VPI）のインタラクティブな昇降操作によって縦断曲線（VCL）および勾配（%表示）がリアルタイムに再計算されることを求める。\n\n### 2. 技術仕様\n- 縦断図SVG上のVPIハンドルドラッグ操作（標高昇降・測点シフト）\n- 道路構造令第20条準拠の凸型縦断曲線半径（$R_v \\ge 3,000\\text{m}$）/ 凹型（$R_v \\ge 2,000\\text{m}$）の放物線描画\n- 最急縦断勾配（$i \\le 4.0\\% \\sim 5.0\\%$）超過時の赤色警告フラグ\n- 計画高（FH）、地盤高（GL）、切盛高（$\\Delta h$）の下部帯図（DLバンド）リアルタイム更新\n\n### 3. 受入基準\n- [ ] VPI移動時に勾配パーセント（%）および縦断曲線長がミリ秒で再計算されること\n- [ ] 測点シークバーをドラッグすると、縦断図上のスキャンラインがノーウェイトで同期すること`
    },
    {
      title: 'feat(cross-section): マルチアセンブリ横断スライサーの高度化（舗装・路盤層、片勾配カントすりつけ、法面1:1.5、排水工寸法線表示）',
      labels: ['type:ui-hud', 'domain:cad-bim', 'compliance:mlit'],
      milestone: milestoneNumber,
      body: `Parent Epic: #${epicNum}\n\n### 1. ユーザーストーリー\n道路設計技術者として、任意の測点を選択した瞬間に、その測点における横断構成（車道カント片勾配 $i=2.0\\% \\sim 5.0\\%$、路床・路盤・表層のマルチレイヤー舗装、切土盛土のり面、U型側溝）が設計寸法線付きで明瞭に展開されることを求める。\n\n### 2. 技術仕様\n- 曲線部における片勾配すりつけ（Superelevation Cant Rotation）の動的回転\n- 地形GLと路面FHの高低差に応じた「盛土（1:1.8）/ 切土（1:1.2）」のり面小段（H=5mごと W=1.0m）の自動生成\n- アスファルト表層（$t=50\\text{mm}$）、上層路盤（$t=150\\text{mm}$）、下層路盤（$t=200\\text{mm}$）の層別ポリゴン描画\n- 切土断面積・盛土断面積のリアルタイム求積表示\n\n### 3. 受入基準\n- [ ] 測点変更に伴い、横断図の形状・断面積・寸法数値が即座に切り替わること\n- [ ] カント角の回転および法面勾配が視覚的・数値的に一致すること`
    },
    {
      title: 'feat(ui-modernism): Technical Workstation Modernismに基づくUI刷新 ＆ 四眼（平面・縦断・横断・3D）完全同期レーザーシーク統合',
      labels: ['type:ui-hud', 'domain:cad-bim', 'perf:rtx-3050ti'],
      milestone: milestoneNumber,
      body: `Parent Epic: #${epicNum}\n\n### 1. ユーザーストーリー\n土木技術者として、暗色高密度ワークステーション（#090d13ベース、JetBrains Mono × Inter）の洗練されたUI環境で、Quad-View（2×2グリッド）、Split（左右分割）、単一フルスクリーンの切り替えが瞬時に行え、どのビューをクリックしても全画面がレーザーのように完全同期することを求める。\n\n### 2. 技術仕様\n- \`RoadDesignWorkspace.tsx\` のUIコンポーネント構造リファクタリング\n- 2×2 Quad-View グリッドレイアウト（[2D平面][Three.js 3D][縦断プロファイル][横断スライサー]）の最適化\n- 各ビューポートヘッダーのクイックアクション（フルスクリーン拡大、リセット、グリッドトグル）\n- 四眼同期カーソル（ミリ秒追従・四眼連動レーザーニードル＆スキャンライン）\n- 折りたたみ可能な左右インテリジェントドックとZENモード（図面最大化）\n\n### 3. 受入基準\n- [ ] Quad-View / Split / 単一画面のトグルがスムーズに切り替わること\n- [ ] 平面、縦断、横断、3Dのいずれかで測点を変更した際、残る3画面の測点インジケータが完全に同期すること\n- [ ] UIレスポンスが60FPSで快適に動作すること`
    }
  ];

  console.log('\n--- 4. Posting 5 Sub-Issues ---');
  for (const issue of subIssues) {
    const res = await api('/issues', { method: 'POST', body: JSON.stringify(issue) });
    console.log(`Created: #${res.data.number} ${issue.title}`);
  }

  console.log('\nAll Quad-View & Three.js issues have been successfully registered on GitHub!');
}

main().catch(err => {
  console.error('Error in push_quadview_issues:', err);
  process.exit(1);
});
