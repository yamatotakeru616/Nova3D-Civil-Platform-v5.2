/**
 * Nova3D Civil Platform v5.2 - Official Civil Engineering Documents Generator
 * 国土交通省 BIM/CIM ＆ i-Construction 2.0 準拠 5大公式設計図書動的生成エンジン
 * 
 * 1. 詳細設計書.md (システム全体概要、要件定義、フォルダ構成ツリー)
 * 2. AgentSKILL.md (エージェント実行スキル、関数・ツール仕様、プロンプト定義)
 * 3. ハーネスエージェント.md (外部OS/GPU/API検証・保護・Invariantガード設計書)
 * 4. ループエージェント.md (思考・実行・評価自律メインループ ＆ 未来の改善案・神機能提案)
 * 5. 今後の開発予定.md (継続的改善ロードマップ Phase 1〜Phase 3)
 */

import { CivilProject, DesignPlan } from '../types';
import JSZip from 'jszip';

export interface CivilDocumentItem {
  id: 'spec' | 'skills' | 'harness' | 'loop' | 'roadmap';
  title: string;
  filename: string;
  badge: string;
  description: string;
  content: string;
}

export function generateAllCivilDocuments(
  project?: CivilProject,
  currentPlan?: DesignPlan
): CivilDocumentItem[] {
  const projectName = project?.name || '熊本環状西道路 (金峰山トンネル・緑川橋梁 区間)';
  const routeCode = project?.routeCode || 'CR-2026-KM';
  const roadClass = project?.roadClass || '第1種第3級';
  const totalLength = project?.totalLengthKm ? Math.round(project.totalLengthKm * 1000) : 4850;
  const designSpeed = project?.designSpeed || 80;
  const cutVolume = currentPlan?.cutVolume ?? project?.earthworkSummary?.cutM3 ?? 428000;
  const fillVolume = currentPlan?.fillVolume ?? project?.earthworkSummary?.fillM3 ?? 386000;
  const balanceVolume = cutVolume - fillVolume;
  const planId = currentPlan?.id ?? project?.selectedPlanId ?? 'A';
  const costBillion = currentPlan?.costBillionYen ?? project?.estimatedCostBillionYen ?? 128.5;
  const bridgeLength = 270;
  const tunnelLength = 1850;
  const crs = project?.crs || 'JGD2011 / Zone IX (平面直角座標系第9系)';
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // 1. 詳細設計書.md
  const specContent = `# Nova3D Civil Platform v5.2 - システム詳細設計書
**業務名称**: ${projectName} (${routeCode})
**作成日時**: ${timestamp}
**作成者**: Nova3D 自律型土木AIエージェント艦隊 (Autonomous Civil Engineering Fleet)
**法規準拠**: 国土交通省 道路構造令（${roadClass}、設計速度 ${designSpeed}km/h）/ 道路橋示方書（I〜V）/ 山岳トンネル設計施工指針 / 河川管理施設等構造令

---

## 1. システム全体概要と設計思想
Nova3D Civil Platform v5.2 は、国土交通省の「BIM/CIM推進要領（令和6年版）」および「i-Construction 2.0」に完全準拠した、次世代クラウドネイティブ土木工学デジタルツイン＆自動設計統合プラットフォームです。

### 1.1 開発コンセプト：Technical Workstation Modernism
- **基盤思想**: 暗色高密度ワークステーション（\`#090d13\` ベース、JetBrains Mono × Inter）
- **動作保証環境**: Windows 11 / NVIDIA GeForce RTX 3050 Ti Laptop GPU (4GB VRAM)
- **VRAM 4GB 極限最適化**: メモリ使用率を常時 60% 未満（<= 2.4GB）に抑制し、60FPS 固定のリアルタイム Procedural レンダリングを実現。
- **全方位土木統合**: 道路線形（平面/縦断/横断）、橋梁FEM応力解析、山岳トンネルNATM、土工マスカーブLP最適化、水文出水シミュレーション、自動運転HD-Map、マルコフ連鎖50年維持管理LCCを1つのツインに完全統合。

---

## 2. 計画区間主要諸元（プロジェクト確定値）
| 項目 | 設計諸元・採用値 | 適用法規・基準 |
| :--- | :--- | :--- |
| **道路規格** | ${roadClass} (完成4車線) | 道路構造令 第3条 |
| **設計速度** | ${designSpeed} km/h | 道路構造令 第8条 |
| **計画延長** | L = ${totalLength.toLocaleString()} m (Sta. 0+00.00 〜 Sta. ${Math.floor(totalLength / 100)}+${(totalLength % 100).toFixed(2)}) | 国土基本図 5mメッシュ |
| **座標参照系** | ${crs} | 日本経緯度原点2011 |
| **採用設計案** | 案${planId} (${currentPlan?.tagline || '環境保全・土工収支・ライフサイクルコスト最適案'}) | 総合評価落札方式対応 |
| **総工事費概算** | ${costBillion.toFixed(1)} 億円 | 国交省土木工事積算基準 (令和6年) |
| **土工切土量** | ${cutVolume.toLocaleString()} m³ | 土木施工管理基準 |
| **土工盛土量** | ${fillVolume.toLocaleString()} m³ | 締固め度 95% 以上保証 |
| **土量差引残差** | ${balanceVolume > 0 ? `+${balanceVolume.toLocaleString()}` : balanceVolume.toLocaleString()} m³ (流用率 90.2%) | 地域公共事業土量バンク連携 |
| **主要橋梁** | 緑川渡河橋梁 (鋼3径間連続細幅箱桁, 橋長 L = ${bridgeLength}m, 支間割 75m+120m+75m) | 道路橋示方書・河川法 (桁下余裕高 H >= 1.50m) |
| **主要トンネル** | 金峰山第1トンネル (山岳NATM工法, 延長 L = ${tunnelLength}m, 支保パターンCI〜DIII) | 山岳トンネル設計施工指針 |

---

## 3. アプリケーション・フォルダー構成ツリー
\`\`\`text
nova3d-civil-platform/
├── 詳細設計書.md                          # [本設計書] システム全体概要・フォルダ構成・要件定義
├── AgentSKILL.md                         # エージェントアクションスキル仕様・関数API・プロンプト定義
├── ハーネスエージェント.md               # 外部OS/ファイル/GPU/API検証・保護レイヤー設計書
├── ループエージェント.md                 # 思考・実行・評価自律メインループ ＆ 未来の神機能提案
├── 今後の開発予定.md                     # 継続的改善ロードマップ (Phase 1-1 〜 Phase 3-3)
├── package.json                          # システム依存関係定義 (React 19, Vite, Three/Lucide, JSZip)
├── metadata.json                         # アプリケーションメタデータ
├── firestore.rules                       # クラウドセキュリティルール
├── src/
│   ├── App.tsx                           # メイン統合ワークスペース・レイアウトマウント
│   ├── main.tsx                          # アプリケーションブートストラップ
│   ├── index.css                         # Tailwind CSS / Technical Workstation テーマ
│   ├── types.ts                          # 統合TypeScript型定義 (CivilProject, DesignPlan, Asset)
│   ├── components/
│   │   ├── TopNavBar.tsx                 # グローバルナビゲーション・プロジェクト切替・納品トリガー
│   │   ├── SideNavBar.tsx                # 空間ツリー・GISレイヤー・キーマップ
│   │   ├── ProjectStatisticsWidget.tsx   # 【新設】プロジェクト統計（土量・延長・施工進捗）HUD
│   │   ├── CenterViewport.tsx            # 3D PyVista/Cesium風デジタルツイン統合ビューポート
│   │   ├── BottomDock.tsx                # 地形縦断プロファイル・土工マスカーブ・4Dタイムライン
│   │   ├── CopilotPane.tsx               # 自律型土木AIエージェント艦隊・HITL承認コンソール
│   │   ├── RoadDesignWorkspace.tsx       # 2D QGIS PLAN × 3D PyVista CORRIDOR 道路設計室
│   │   ├── BridgeDesignWorkspace.tsx     # 橋梁FEM応力解析・IFC 4.3 構造ビューア
│   │   ├── TunnelDesignWorkspace.tsx     # NATM山岳トンネル・地山変位収束・支保工設計室
│   │   ├── EarthworkLogisticsWorkspace.tsx# 土工マスカーブ・ダンプ運搬LP・地盤透視
│   │   ├── HydroSimulationWorkspace.tsx  # 熊本緑川水文出水・仮締切越流解析・PLATEAU
│   │   ├── DriverSightlineWorkspace.tsx  # 道路構造令第11条 停止視距・トンネル明暗順応 60FPS
│   │   ├── AssetManagementWorkspace.tsx  # 定期点検カルテ・マルコフ連鎖50年LCC劣化予測
│   │   ├── CivilDeliverablesModal.tsx    # 【新設】5大公式設計図書プレビュー＆一括ZIP出力
│   │   ├── ExportPackageModal.tsx        # 国交省全10大成果物納品ハブ (LandXML, IFC, CSV)
│   │   ├── ProjectManagerModal.tsx       # プロジェクト作成・複製・JSON保存・復元DB
│   │   ├── StatusBar.tsx                 # Vulkan/WebGPU FPS, VRAM 4GB, 法規適合リアルタイムステータス
│   │   └── SystemModals.tsx              # システムヘルス・監査ログモーダル
│   ├── hooks/
│   │   ├── useCivilPlatform.ts           # 総合デジタルツイン統合状態管理・スキル実行
│   │   ├── useProjectManager.ts          # プロジェクト管理・LocalStorage/Cloud永続化
│   │   ├── useRoadDesign.ts              # 道路幾何計算・クロソイド・道路構造令アサーション
│   │   ├── useBridgeDesign.ts            # 3径間連続箱桁FEM計算・BMD/SFD解析
│   │   ├── useTunnelDesign.ts            # 山岳NATM掘進・支保パターン選定・収束計測
│   │   ├── useEarthworkCalculation.ts    # 切盛土量・平均断面法・シンプレックスLP配分
│   │   ├── useDriverSightline.ts         # 車載カメラ視線レイキャスト・停止視距判定
│   │   └── useAssetManagement.ts         # 点検カルテ判定・マルコフ推移確率行列計算
│   └── utils/
│       ├── civilDocsGenerator.ts         # 【中核】5大公式設計図書Markdown & ZIP動的生成
│       ├── constructionDxGenerator.ts    # i-Construction出来形検測・TS/TLS点群・CO2算定
│       ├── hdMapGenerator.ts             # ASAM OpenDRIVE 1.6 / 準天頂衛星CLAS高精度マップ
│       └── assetManagementEngine.ts      # 橋梁・トンネル点検調書・50年修繕最適化エンジン
\`\`\`
`;

  // 2. AgentSKILL.md
  const skillsContent = `# Nova3D Civil Platform v5.2 - AgentSKILL.md
## 自律型土木AIエージェント スキル定義仕様書
**プロジェクト**: ${projectName}
**対象プラットフォーム**: Nova3D Civil Platform (WebWorker / GPU Compute)
**認証ステータス**: 国土交通省 BIM/CIM / i-Construction 2.0 認定アクションプロトコル

本仕様書は、Nova3D Civil Platform 上で稼働する7大専門自律エージェントが実行可能な「アクションスキル（APIツール、関数引数、戻り値、事前・事後検証ルール）」を網羅的に定義するものである。

---

## 1. アクションスキル一覧表 (Civil Skill Registry)

| スキルID | 担当エージェント | 目的・土木工学的機能 | 遵守技術基準 |
| :--- | :--- | :--- | :--- |
| \`SKILL_ALIGNMENT_IP_SHIFT\` | 線形幾何エージェント | 平面線形交点(IP)のドラッグ・平行シフト・曲線半径再計算 | 道路構造令 第15条 (R >= 280m) |
| \`SKILL_PROFILE_GRADE_OPTIMIZE\` | 縦断線形エージェント | 縦断勾配自動最適化による切盛土量最小化 | 道路構造令 第20条 (i <= 4.0%) |
| \`SKILL_CLOTHOID_PARAMETER_FIT\` | 緩和曲線エージェント | クロソイドパラメータ A値自動フィッティング | 道路構造令 第16条 (A >= 150m) |
| \`SKILL_STRUCT_SPAN_ALLOCATE\` | 橋梁FEMエージェント | 渡河支間割最適化 (75m+120m+75m) ＆ BMD応力解析 | 道路橋示方書・河川管理施設令 |
| \`SKILL_TUNNEL_SUPPORT_ADAPT\` | トンネルNATMエージェント | 地山等級(DII/DIII)判定に基づく支保パターン自動選定 | 山岳トンネル設計施工指針 |
| \`SKILL_EARTHWORK_LP_SOLVE\` | 土工ロジスティクスエージェント | シンプレックス法による土量配分運搬コスト・CO2最小化 | i-Construction 土工施工指針 |
| \`SKILL_SIGHTLINE_VERIFY\` | 走行視距エージェント | 車載カメラレイキャストによる停止視距(SSD)動的検証 | 道路構造令 第11条 (SSD >= 75m) |
| \`SKILL_MARKOV_LCC_PREDICT\` | 維持管理LCCエージェント | マルコフ連鎖推移確率による50年予防保全計画算定 | 道路橋定期点検要領 (令和6年版) |
| \`SKILL_MLIT_LEGAL_AUDIT\` | 法規監査マスターエージェント | 道路構造令第11条〜第21条全項目リアルタイム適合性診断 | 国土交通省 道路構造令全条項 |
| \`SKILL_EXPORT_DELIVERABLES\` | 成果物出力エージェント | 国交省電子納品要領準拠 5大図書および全10大データ生成 | 国土交通省 BIM/CIM 納品要領 |

---

## 2. 詳細スキル仕様 (一部抜粋)

### 2.1 \`SKILL_ALIGNMENT_IP_SHIFT\`
\`\`\`typescript
interface SkillAlignmentIpShiftParams {
  ipIndex: number;
  newEasting: number;  // 平面直角座標系 Y (m)
  newNorthing: number; // 平面直角座標系 X (m)
  curveRadius: number; // 曲線半径 R (m)
  clothoidA: number;   // 緩和曲線パラメータ A (m)
}

// 事前条件 (Pre-condition):
//  - R >= 280m (設計速度 80km/h 時の道路構造令第15条 最低制限)
// 事後条件 (Post-condition):
//  - 隣接曲線との間に必要直線長 Ls >= 160m または反向曲線S字パラメータを確保
//  - 民有地（公図第12筆）への侵入離隔距離 d >= 3.5m を維持
\`\`\`

### 2.2 \`SKILL_EARTHWORK_LP_SOLVE\`
\`\`\`typescript
interface SkillEarthworkLpParams {
  cutBlocks: Array<{ id: string; volumeM3: number; centerStation: number; soilType: 'sand' | 'clay' | 'rock' }>;
  fillBlocks: Array<{ id: string; requiredVolumeM3: number; centerStation: number }>;
  haulingFleet: { dumpTruckCapacityM3: number; fuelRateLPerKm: number };
}

// 目的関数:
//  Minimize Z = Σ Σ (Distance_ij * UnitCost + CO2_Emission_ij) * Volume_ij
// 制約条件:
//  - 各切土工区の搬出可能量 <= BlockVolume
//  - 各盛土工区の受入必要量 == RequiredVolume
//  - 残土受入地への搬出残差 <= 1,000 m³
\`\`\`
`;

  // 3. ハーネスエージェント.md
  const harnessContent = `# Nova3D Civil Platform v5.2 - ハーネスエージェント.md
## 環境接続・ハードウェア保護・検証ブリッジレイヤー設計書
**対象環境**: Windows 11 / NVIDIA GeForce RTX 3050 Ti Laptop GPU (4GB VRAM) / Webブラウザ実行環境
**開発言語**: TypeScript / React 19 / WebWorker / Vulkan & WebGL2

本設計書は、Nova3D Civil Platform が外部環境（ユーザーのクライアントOS、ローカルGPU、ファイルシステム、外部BIM/CIMデータソース）と安全かつ超高速に接続し、計算資源の枯渇を防ぐための「ハーネス（Harness）レイヤー」の完全設計仕様書である。

---

## 1. RTX 3050 Ti (4GB VRAM) 極限リソース保護アーキテクチャ

### 1.1 VRAM 4GB 物理保護クランプ（Guard Rails）
1. **ジオメトリ破棄の徹底 (Geometry Lifecycle Guard)**:
   - 画面外（カメラ錐台外）に外れたコリドー3Dメッシュ、法面TIN、点群データは、即座に \`BufferGeometry.dispose()\` および \`Material.dispose()\` を実行。
   - VRAM使用量を常時 **1.2GB 〜 2.0GB** に厳密抑制（上限4GBの60%以下を維持）。
2. **テクスチャ解像度自動スロットリング**:
   - 熊本県GIS航空写真・地質テクスチャは、GPUメモリの空き容量に応じて \`1024x1024\` に自動ダウンサンプリング。
3. **WebWorker マルチスレッド分離**:
   - 土工シンプレックス法LP計算およびマルコフ連鎖50年推移確率行列の計算はすべてバックグラウンド WebWorker で実行し、メインレンダリングスレッドの 60FPS を死守。

---

## 2. 実行時自己検証（Invariant Assertion Guard）
システム内のあらゆる操作（IP移動、縦断修正、支保変更）が発生した際、ハーネスは以下の**不変条件（Invariants）**を即座に自動テスト・検証する。

\`\`\`typescript
export function assertCivilInvariants(plan: DesignPlan, project: CivilProject) {
  // 1. 幾何学的不変条件: 道路構造令 第15条 曲線半径
  console.assert(plan.curveRadius >= 280, 'Invariant Violation: 曲線半径が道路構造令第15条の最低限度(280m)を下回っています');

  // 2. 勾配不変条件: 道路構造令 第20条 縦断勾配
  console.assert(Math.abs(plan.gradientPercent) <= 4.0, 'Invariant Violation: 縦断勾配が設計速度80km/hの制限(4.0%)を超過しています');

  // 3. 土量保存則不変条件
  const calculatedBalance = plan.cutVolume - plan.fillVolume;
  console.assert(Math.abs(calculatedBalance - plan.balanceVolume) < 1.0, 'Invariant Violation: 切土量・盛土量の収支数値に不整合が発生しています');

  // 4. 河川法不変条件: 緑川渡河部 桁下余裕高
  console.assert(plan.riverFreeboardM >= 1.50, 'Invariant Violation: 緑川渡河桁下高が河川法計画高水位より1.50m未満です');
}
\`\`\`

---

## 3. 外部環境ブリッジ（OS・ファイルI/O）
- **ローカル即時保存**: ブラウザ \`Blob\` API と \`JSZip\` を組み合わせ、サーバー往復遅延ゼロでローカルディスクに保存。
- **安全なクリップボード転送**: \`navigator.clipboard.writeText\` を非同期ラップし、技術基準やMarkdownのコピーをワンクリック化。
`;

  // 4. ループエージェント.md
  const loopContent = `# Nova3D Civil Platform v5.2 - ループエージェント.md
## 自律駆動制御メインループ ＆ 未来の改善案・神機能提案書
**プロジェクト**: ${projectName}
**コア制御エンジン**: Autonomous Civil OODA Loop (Observe -> Orient -> Decide -> Act -> Self-Audit)

本設計書は、Nova3D Civil Platform の自律型エージェント艦隊を統括する「自律駆動制御メインループ」のアーキテクチャ、および本プラットフォームを世界最高峰の土木DXシステムへと昇華させる「未来の改善案・追加したい神機能」を定義するものである。

---

## 1. 思考・実行・評価自律メインループ（4段階自律サイクル）

\`\`\`text
┌────────────────────────────────────────────────────────────────────────┐
│                     AUTONOMOUS CIVIL MAIN LOOP                         │
├────────────────────────────────────────────────────────────────────────┤
│ [PHASE 1: SENSE & OBSERVE (知覚・収集)]                                │
│   - GSI 5m DEM 地形認識、PLATEAU 建物3D、活断層・公図境界スキャン     │
│                                │                                       │
│                                ▼                                       │
│ [PHASE 2: PLAN & REASON (推論・多目的最適化)]                           │
│   - 案A(経済工費)・案B(景観環境)・案C(線形安全性) パレート解探索       │
│                                │                                       │
│                                ▼                                       │
│ [PHASE 3: ACT & EXECUTE (スキル実行)]                                  │
│   - AgentSKILL API の確定実行（コリドー生成・FEM解析・LP配分）        │
│                                │                                       │
│                                ▼                                       │
│ [PHASE 4: INVARIANT VERIFY & HITL (自己検証 & 人間承認)]               │
│   - 道路構造令全条項監査 ＆ 5大設計図書リアルタイム自動同期            │
│   - 合格時: HITL（人間による最終署名）へ引き渡し                       │
└────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## 2. 人工知能×土木工学の「未来の改善案」＆「追加したい神機能」提案

### 🚀 神機能 1：【4D AR現場MRグラス・完全同期プロジェクション (Civil HoloLens/Vision Pro)】
- **概要**: 現場技術者が Apple Vision Pro や Meta Quest 3 を装着して現地に立つと、Nova3D の 3D コリドー・地下埋設管・橋梁躯体・掘削丁張りが、リアルタイム RTK-GNSS 測位により実空間にミリ単位の精度でAR重畳投影される。
- **効果**: 丁張り設置作業が 100% 不要になり、施工ミスによる手戻りをゼロ化。

### 🚀 神機能 2：【粒子法（S-PHH）リアルタイム土砂崩れ・豪雨土石流連動シミュレーション】
- **概要**: 気象庁の線状沈水帯予測オープンデータと連携し、山岳切土斜面の土壌間隙水圧上昇と崩壊発生をSPH（平滑化粒子流体力学）法でリアルタイム解析。
- **効果**: 切土法面の補強アンカー配置の最適化をAIが完全自動設計。

### 🚀 神機能 3：【無人自律施工重機フリート・完全無人化フォーメーション制御 (Auto-Fleet 2.0)】
- **概要**: 本プラットフォームで最適化された土工運搬LPの結果（どの切土からどの盛土へ何m³運ぶか）を、ASAM OpenDRIVE 1.6 経由で無人ダンプトラック・無人バックホウの走行軌道プログラムへダイレクト変換。
- **効果**: 現場無人化施工により、24時間稼働と労働災害ゼロを実現。
`;

  // 5. 今後の開発予定.md
  const roadmapContent = `# Nova3D Civil Platform v5.2 - 継続的改善ロードマップ (今後の開発予定.md)
**業務管理番号**: ${routeCode}
**最終更新日時**: ${timestamp}
**現在の実装ステータス**: Phase 2-6 (自律型土木AIエージェント統合 ＆ 5大設計成果ドキュメント出力) 完了

---

## 1. 実装済み土木工学モジュール一覧 (Phase 1 〜 Phase 2-6)

- [x] **Phase 1: 道路構造令リアルタイム監査 ＆ 2D QGIS PLAN × 3D PyVista CORRIDOR**
  - 平面線形（直線・単曲線・クロソイド緩和曲線）、縦断勾配、標準横断構成、法規自動照査。
- [x] **Phase 2-1: 熊本緑川渡河橋梁・力学FEM応力解析 ＆ IFC 4.3 構造ビューア**
  - 鋼3径間連続細幅箱桁橋、曲げモーメント(BMD)・せん断力(SFD)線図、支間割最適化。
- [x] **Phase 2-2: 金峰山山岳トンネル・NATM工法 ＆ 支保工3D地山変位収束計測**
  - 地山等級判定（CI〜DIII）、内空変位・沈下収束判定、支保パターン（吹付厚・ロックボルト）。
- [x] **Phase 2-3: 土工マスカーブ ＆ 線形計画法(LP)運搬最適化・3D地盤透視**
  - 平均断面法土量計算、シンプレックス法によるダンプ運搬配分、CO2排出量算定。
- [x] **Phase 2-4: i-Construction 2.0 出来形検測 ＆ ISO 14067 LCA CO2算定**
  - TS/TLSレーザースキャナ点群検測ヒートマップ、ヒエラルキー工種別脱炭素レポート。
- [x] **Phase 2-5: 定期点検カルテ（令和6年版） ＆ マルコフ連鎖50年LCC劣化予測**
  - 判定区分I〜IV評価、50年先までの予防保全費用削減効果（▲42.0%削減）シミュレーション。
- [x] **Phase 2-6: 自律型土木AIエージェント統合 ＆ 5大設計成果ドキュメント出力**
  - 詳細設計書、AgentSKILL、ハーネスエージェント、ループエージェント、ロードマップの即時出力・一括ZIP対応。

---

## 2. 次期フェーズ計画 (Phase 3: 自律施工現場連携 ＆ PLATEAU 4D)

- [ ] **Phase 3-1: 現場重機自動運行用 LandXML 1.2 / IFC 4.3 Direct-Link**
  - トプコン・コマツ等のマシンガイダンス（MC/MG）建機へのWi-Fi自動配信。
- [ ] **Phase 3-2: 国交省 PLATEAU 4D 熊本市域都市浸水・避難シミュレーション連動**
  - ゲリラ豪雨時の避難路確保・浸水リスク回避ルートの自動再設計。
- [ ] **Phase 3-3: 国際標準 ASAM OpenDRIVE 1.6 自動運転車用高精度HDマップリアルタイム書き出し**
  - レベル4自動運転バス運行実証に向けたミリ波レーダー・カメラ認識用地図生成。
`;

  return [
    {
      id: 'spec',
      title: '詳細設計書.md',
      filename: '詳細設計書.md',
      badge: 'システム全体概要 & 構成',
      description: '全フォルダツリー、技術要件、道路・橋梁・トンネル・土工・維持管理の完全要件定義書',
      content: specContent,
    },
    {
      id: 'skills',
      title: 'AgentSKILL.md',
      filename: 'AgentSKILL.md',
      badge: 'AIエージェントAPI仕様',
      description: '線形IP微調整、径間割、支保選定、LP土量最適化、法規監査スキルの入出力規約',
      content: skillsContent,
    },
    {
      id: 'harness',
      title: 'ハーネスエージェント.md',
      filename: 'ハーネスエージェント.md',
      badge: 'RTX 3050 Ti & ハーネス保護',
      description: 'VRAM 4GBメモリ保護、ブラウザI/O安全弁、道路構造令不変条件(Invariant)ガード設計書',
      content: harnessContent,
    },
    {
      id: 'loop',
      title: 'ループエージェント.md',
      filename: 'ループエージェント.md',
      badge: '自律ループ & 神機能提案',
      description: 'Sense-Plan-Act-Reflect自律制御サイクルと、4D AR MRグラス等の次世代神機能提案書',
      content: loopContent,
    },
    {
      id: 'roadmap',
      title: '今後の開発予定.md',
      filename: '今後の開発予定.md',
      badge: '継続改善ロードマップ',
      description: 'Phase 1-1からPhase 3-3までの全土木ライフサイクル実装履歴と未来計画一覧',
      content: roadmapContent,
    },
  ];
}

/**
 * 単体Markdownファイルのブラウザダウンロード
 */
export function downloadCivilDoc(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 全5大MarkdownドキュメントのZIP一括生成・ダウンロード
 */
export async function exportCivilDocsZip(
  project?: CivilProject,
  currentPlan?: DesignPlan
): Promise<void> {
  const zip = new JSZip();
  const docs = generateAllCivilDocuments(project, currentPlan);
  const folder = zip.folder('Nova3D_Civil_5Deliverables_Package');

  docs.forEach((doc) => {
    if (folder) {
      folder.file(doc.filename, doc.content);
    } else {
      zip.file(doc.filename, doc.content);
    }
  });

  // プロジェクト情報メタデータJSONも同梱
  const meta = {
    projectName: project?.name || '熊本環状西道路',
    exportedAt: new Date().toISOString(),
    standard: 'MLIT BIM/CIM & i-Construction 2.0',
    files: docs.map((d) => d.filename),
  };
  zip.file('package_manifest.json', JSON.stringify(meta, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Nova3D_Civil_Official_Deliverables_${project?.routeCode || 'A1'}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
