# Nova3D Civil Platform v5.2 - GitHub Issues 策定仕様書

本ドキュメントは、Nova3D Civil Platform v5.2 の次期スプリントとして GitHub Issues にそのまま登録可能な構造化イシューセットである。各イシューにはタイトル、ラベル、マイルストーン、概要、技術仕様、準拠土木基準、および受入基準チェックリストが含まれている。

---

## 📋 マイルストーン & ラベル設計

### マイルストーン
- `v5.3-Sprint1: Slope-Stability-DEM` (豪雨・斜面崩壊物理シミュレーション)
- `v5.4-Sprint2: Auto-Fleet-2.0` (自律型建機フリート運行制御)
- `v5.5-Sprint3: 4D-AR-Field-MR` (WebXR現場MR完全同期)

### 推奨ラベル体系
- 領域: `domain:geotech`, `domain:logistics`, `domain:field-dx`, `domain:bim-cim`
- 種別: `type:epic`, `type:feature`, `type:engine`, `type:ui-hud`, `type:audit`
- 性能・制約: `perf:rtx-3050ti`, `perf:web-worker`, `compliance:mlit`

---

# Epic 1: リアルタイム豪雨・土砂崩れ崩壊シミュレーション（S-PHH / 個別要素法DEM）
**Issue Title**: `[EPIC] リアルタイム豪雨・土砂崩れ崩壊シミュレーション ＆ 斜面安定工AI設計基盤`  
**Labels**: `type:epic`, `domain:geotech`, `compliance:mlit`  
**Milestone**: `v5.3-Sprint1: Slope-Stability-DEM`

### 概要
線状降水帯による100mm/h超級のゲリラ豪雨発生時に、法面切土ブロックの土壌水分浸透・間隙水圧上昇と円弧すべり面を個別要素法（DEM/2.5D格子粒子法）でリアルタイム計算し、崩壊危険度ヒートマップ表示および法枠・アンカー工の自動設計を行う基盤を構築する。

### 構成サブイシュー
- [ ] #1-1: WebWorker並列 2.5D個別要素法（DEM）土壌水分・間隙水圧・斜面すべり安全率 $F_s$ リアルタイム算出エンジン
- [ ] #1-2: 3D斜面崩落メッシュ・危険度ヒートマップ＆線状降水帯豪雨パーティクルビジュアライザ
- [ ] #1-3: 『道路土工 切土工・斜面安定工指針』準拠の斜面判定 ＆ 地山補強土工（アンカー・法枠）AI自動配置
- [ ] #1-4: 崩壊危険度カルテ CSV & 斜面安定計算調書 LandXML 1.2 エクスポート機能

---

### Issue 1-1: WebWorker並列 2.5D個別要素法（DEM）土壌水分・間隙水圧・斜面すべり安全率 $F_s$ リアルタイム算出エンジン
**Title**: `feat(geotech): WebWorker並列 2.5D DEM土壌水分・間隙水圧・斜面すべり安全率 Fs リアルタイム計算エンジン`  
**Labels**: `type:engine`, `domain:geotech`, `perf:web-worker`, `perf:rtx-3050ti`  
**Milestone**: `v5.3-Sprint1: Slope-Stability-DEM`

#### 1. ユーザーストーリー
土木設計技術者として、降雨強度（mm/h）と継続時間をスライダー操作した際に、切土法面の土壌水分量 $w$、間隙水圧 $u$、および修正フェレニウス法／ジャンブ法による斜面安全率 $F_s$ がメインスレッドをブロックすることなくミリ秒でリアルタイム更新されることを求める。

#### 2. 技術仕様 & アルゴリズム
- **配置ファイル**: `src/utils/slopeStabilityEngine.ts`, `src/workers/slopePhysicsWorker.ts`
- **計算モデル**:
  - 2.5Dハイトマップ格子（セル解像度 0.5m〜1.0m）上でのリチャーズ式（Richards equation）1次元浸透近似
  - すべり安全率算定（修正Fellenius法）:
    $$F_s = \frac{\sum [ c' \cdot l + (W \cos \alpha - u \cdot l) \tan \phi' ]}{\sum W \sin \alpha}$$
  - $c'$: 有効粘着力, $\phi'$: 有効せん断抵抗角, $W$: スライス重量, $\alpha$: すべり面傾斜角, $u$: 間隙水圧
- **パフォーマンス制約**:
  - WebWorker内で毎秒30回の連続反復計算を実行。
  - メインUIの60FPS描画を阻害せず、CPU負荷を1スレッド25%以下に維持。

#### 3. 準拠土木基準
- 国土交通省『道路土工 切土工・斜面安定工指針（平成21年度版）』
- 常時安全率 $F_{s0} \ge 1.20$、降雨時・地震時安全率 $F_{se} \ge 1.00$

#### 4. 受入基準 (Acceptance Criteria)
- [ ] 降雨強度（0〜150mm/h）の入力変更から100ms以内に各測点（STA.）の法面 $F_s$ 値が算出される。
- [ ] WebWorkerとのメッセージ通信が非同期で動作し、UIのスクロールやカメラ回転が60FPSで動作する。
- [ ] 許容下限（$F_s < 1.00$）を割り込んだ場合に危険フラグ `isCriticalSlope = true` が通知される。

---

### Issue 1-2: 3D斜面崩落メッシュ・危険度ヒートマップ＆線状降水帯豪雨パーティクルビジュアライザ
**Title**: `feat(ui-3d): 3D斜面崩落メッシュ・危険度ヒートマップ＆豪雨パーティクルビジュアライザ`  
**Labels**: `type:ui-hud`, `domain:geotech`, `perf:rtx-3050ti`  
**Milestone**: `v5.3-Sprint1: Slope-Stability-DEM`

#### 1. ユーザーストーリー
技術者・発注者として、豪雨シミュレーション実行時に、雨滴パーティクルが斜面に降り注ぎ、崩壊危険度の高い切土法面が緑（安全）→黄（注意）→赤（崩壊危険）にカラーマッピングされ、危険箇所では土砂メッシュが変形崩落する視覚演出を確認したい。

#### 2. 技術仕様 & アルゴリズム
- **配置ファイル**: `src/components/SlopeStabilityWorkspace.tsx`, `src/components/3d/SlopeMeshRenderer.tsx`
- **レンダリング**:
  - HTML5 Canvas 3D / WebGL による軽量プロシージャル法面メッシュ（最大頂点数 5,000以内）
  - $F_s$ 値に応じた法面頂点カラー補間（緑 $F_s \ge 1.2$, 琥珀 $1.0 \le F_s < 1.2$, 赤 $F_s < 1.0$）
  - 豪雨パーティクル（最大1,000粒子）の軽量Instancing描画（VRAM消費 15MB以下）
- **UIコンポーネント**:
  - 降雨シナリオ切替（平常 5mm/h、梅雨 45mm/h、台風 80mm/h、線状降水帯 120mm/h、既往最大 155mm/h）
  - 危険斜面フォーカスボタン（該当測点へのカメラオートパン）

#### 3. 受入基準 (Acceptance Criteria)
- [ ] RTX 3050 Ti (4GB VRAM) 環境において、雨滴描画中も常時60FPSを維持する。
- [ ] 危険度が赤色（$F_s < 1.0$）の斜面がパルス発光し、視覚的に直感把握できる。
- [ ] 「崩落プレビュー」トグルON時に、すべり土塊メッシュが下方に変形アニメーションする。

---

### Issue 1-3: 『道路土工 切土工・斜面安定工指針』準拠の斜面判定 ＆ 地山補強土工（アンカー・法枠）AI自動配置
**Title**: `feat(audit): 道路土工指針準拠の斜面判定 ＆ 地山補強土工（アンカー・法枠）AI自動配置`  
**Labels**: `type:audit`, `domain:geotech`, `compliance:mlit`  
**Milestone**: `v5.3-Sprint1: Slope-Stability-DEM`

#### 1. ユーザーストーリー
設計技術者として、$F_s < 1.20$ となる危険斜面に対して、AIが自動的に吹付枠工（F300〜F500）および鉄筋挿入工／グラウンドアンカーの必要段数・打設長・引張耐力を逆算し、必要最低限の工費で $F_s \ge 1.20$ を回復する補強パターンを提案してほしい。

#### 2. 技術仕様 & アルゴリズム
- **配置ファイル**: `src/hooks/useSlopeStabilization.ts`, `src/utils/groundAnchorOptimizer.ts`
- **設計ロジック**:
  - 不足安全率 $\Delta T = (F_{s,\text{req}} - F_s) \cdot \sum W \sin \alpha$ の算出
  - アンカー引張力 $T_d$ および打設角度 $\beta$（標準 $15^\circ \sim 20^\circ$）の自動最適化
  - 格子枠形式（現場打吹付枠 F300, F400, F500）の自動選定と工費概算算出
- **HUDカード**:
  - 補強前後の $F_s$ 比較バーグラフ
  - 対策工概算工費（万円）および施工延長（m）

#### 3. 準拠土木基準
- 国土交通省『道路土工 切土工・斜面安定工指針』第4章「のり面保護工・のり面補強工」
- 日本道路協会『グラウンドアンカー設計・施工基準』

#### 4. 受入基準 (Acceptance Criteria)
- [ ] AI提案適用ボタンを押下すると、即座に補強土工（アンカーライン・枠メッシュ）が3D空間上に重畳配置される。
- [ ] 補強後の安全率が確実に $F_s \ge 1.20$ に回復することが不変条件テスト（Invariant Test）で検証される。
- [ ] 工費最小化パラメータ（打設長・本数）が諸元表としてHUDに即時反映される。

---

### Issue 1-4: 崩壊危険度カルテ CSV & 斜面安定計算調書 LandXML 1.2 エクスポート機能
**Title**: `feat(export): 斜面安定計算調書 LandXML 1.2 ＆ 国交省事前協議用 崩壊危険度カルテ CSV エクスポート`  
**Labels**: `type:feature`, `domain:bim-cim`, `compliance:mlit`  
**Milestone**: `v5.3-Sprint1: Slope-Stability-DEM`

#### 1. ユーザーストーリー
技術者として、シミュレーション結果と補強工設計結果を、国土交通省の事前協議用フォーマットに準拠した「斜面安定計算調書 CSV」およびBIM/CIM納品用の「LandXML 1.2（補強後法面TINサーフェス）」としてワンクリックで出力したい。

#### 2. 技術仕様
- **配置ファイル**: `src/utils/slopeReportGenerator.ts`, `src/components/ExportPackageModal.tsx` への統合
- **出力成果物**:
  1. `SLOPE_STABILITY_REPORT.csv`: 測点ピッチ毎のGL/FH、土質パラメータ（c, $\phi$, $\gamma$）、間隙水圧、算定安全率、対策工諸元
  2. `SLOPE_REINFORCED_SURFACE.xml`: 補強法面およびアンカー芯線を包含する LandXML 1.2 構造化データ
  3. `ExportPackageModal.tsx`（BIM/CIM全成果物一括納品ハブ）に成果物11として追加統合

#### 3. 受入基準 (Acceptance Criteria)
- [ ] 出力された CSV が Excel / 国交省電子納品ビューアで文字化け（BOM付UTF-8）なく閲覧可能であること。
- [ ] LandXML 1.2 内に `<CrossSects>` および `<Surface name="SlopeReinforced">` が規格通り記述されていること。

---

# Epic 2: 自律型重機フリート・完全無人化フォーメーション制御（Auto-Fleet 2.0）
**Issue Title**: `[EPIC] 自律型重機フリート・完全無人化フォーメーション制御基盤（Auto-Fleet 2.0）`  
**Labels**: `type:epic`, `domain:logistics`, `compliance:mlit`  
**Milestone**: `v5.4-Sprint2: Auto-Fleet-2.0`

### 概要
土工マスカーブ最適配分計画に基づき、現場で稼働する無人ダンプトラック群（10t/EV）と油圧ショベル・ブルドーザーに対し、秒単位の走行経路（ASAM OpenDRIVE）と積載・排土フォーメーション指示を自律生成し、現場完全無人施工を実現するテレマティクス管制基盤を開発する。

### 構成サブイシュー
- [ ] #2-1: 線形計画法(LP)マスバランスに基づく無人ダンプ・油圧ショベル協調走行経路・秒単位運行ディスパッチャ
- [ ] #2-2: 現場3D鳥瞰ビュー上の建機フリート自律稼働HUD＆衝突防止クリアランスレーダー
- [ ] #2-3: ASAM OpenDRIVE v1.7 リアルタイム運行指示配信 ＆ 労働安全衛生法・過積載防止自動照査
- [ ] #2-4: i-Construction 2.0 車載テレマティクス運行ログ CSV & 施工プロセスタスク LandXML 出力

---

### Issue 2-1: 線形計画法(LP)マスバランスに基づく無人ダンプ・油圧ショベル協調走行経路・秒単位運行ディスパッチャ
**Title**: `feat(logistics): 土工LPマスバランス連動 無人重機協調ディスパッチャ ＆ 秒単位運行タイムライン`  
**Labels**: `type:engine`, `domain:logistics`, `perf:web-worker`  
**Milestone**: `v5.4-Sprint2: Auto-Fleet-2.0`

#### 1. ユーザーストーリー
現場施工管理者として、土工マスカーブで確定した切土・盛土・仮置場の土量配分に基づき、複数台のショベル（積込地点）と無人ダンプ群（運搬路）のサイクルタイム（積込 $t_1$、運搬 $t_2$、排土 $t_3$、復路 $t_4$）を自動計算し、待ち時間ゼロの最適秒単位配車ダイヤを生成したい。

#### 2. 技術仕様 & アルゴリズム
- **配置ファイル**: `src/utils/fleetDispatcherEngine.ts`, `src/hooks/useAutonomousFleet.ts`
- **運行アルゴリズム**:
  - キューイング理論（$M/M/s$ 待ち行列モデル）によるショベル待ち時間極小化
  - 単線・交互通行区間（工事用仮設道路）のデッドロック回避（トークンパッシングアルゴリズム）
  - EVダンプのバッテリー残量（SOC）に基づく充電ステーション自動ピットイン判定

#### 3. 準拠土木基準
- 国土交通省『土木工事標準積算基準書（施工パッケージ型積算方式）』土工・運搬工
- 『建設機械経費積算要領』

#### 4. 受入基準 (Acceptance Criteria)
- [ ] ダンプ台数（10〜50台）を変更した際、全車両の1日の運搬便数と土工進捗率が即座に再計算される。
- [ ] 重機同士の正面衝突や仮設道でのすれ違い不全が発生しないタイムスロット整合性が検証される。

---

### Issue 2-2: 現場3D鳥瞰ビュー上の建機フリート自律稼働HUD＆衝突防止クリアランスレーダー
**Title**: `feat(ui-3d): 現場3D鳥瞰ビュー上の建機フリート自律アニメーション ＆ 車間クリアランスレーダー`  
**Labels**: `type:ui-hud`, `domain:logistics`, `perf:rtx-3050ti`  
**Milestone**: `v5.4-Sprint2: Auto-Fleet-2.0`

#### 1. ユーザーストーリー
現場監督として、3Dコリドーおよび工事用道路上をスムーズに走行・排土・転圧する建機群（3Dアイコンおよび軌跡ライン）を俯瞰監視し、車両接近警告や運行異常をリアルタイムHUDで把握したい。

#### 2. 技術仕様
- **配置ファイル**: `src/components/FleetControlWorkspace.tsx`, `src/components/3d/FleetPathRenderer.tsx`
- **視覚演出**:
  - 設計線形に沿ったダンプのベジエ走行補間（60FPSスムーズ移動）
  - 前後車間距離安全センサー（青: 余裕 $\ge 30\text{m}$、黄: 減速域 $15 \sim 30\text{m}$、赤: 緊急自動ブレーキ $< 15\text{m}$）
  - 車載HUDピル（車番、積載土量 $10.0\text{t}$、速度、SOC残量、CO2排出量）

#### 3. 受入基準 (Acceptance Criteria)
- [ ] 30台の建機が同時に自律走行しても、RTX 3050 Ti環境で60FPSを維持すること。
- [ ] 車両をクリックすると、車載カメラ視点（Driver POV）にシームレスに切り替わること。

---

### Issue 2-3: ASAM OpenDRIVE v1.7 リアルタイム運行指示配信 ＆ 労働安全衛生法・過積載防止自動照査
**Title**: `feat(audit): ASAM OpenDRIVE v1.7 運行指示ストリーム ＆ 労働安全衛生規則・過積載防止自動照査`  
**Labels**: `type:audit`, `domain:logistics`, `compliance:mlit`  
**Milestone**: `v5.4-Sprint2: Auto-Fleet-2.0`

#### 1. ユーザーストーリー
運行管理者として、自動運転建機に配信される走行命令が ASAM OpenDRIVE 1.7 規格に準拠していること、また過積載（最大積載量 $10,000\text{kg}$ 超過）や労働安全衛生法の運行制限速度（構内 $V \le 20\text{km/h}$）に違反していないかを自動照査したい。

#### 2. 準拠法令・基準
- 『労働安全衛生規則』第2編第2章「車両系建設機械」
- 『道路交通法』第57条（過積載の防止）
- ASAM OpenDRIVE 1.7 道路ジオメトリおよびオブジェクト仕様

#### 3. 受入基準 (Acceptance Criteria)
- [ ] 運搬土質密度（砂質土 $\rho=1.8\text{t/m}^3$、岩塊 $\rho=2.2\text{t/m}^3$）に応じた過積載判定が即時作動すること。
- [ ] 全車両の制限速度・急旋回制限に関するリアルタイム適合監査カードが全GREEN表示となること。

---

### Issue 2-4: i-Construction 2.0 車載テレマティクス運行ログ CSV & 施工プロセスタスク LandXML 出力
**Title**: `feat(export): i-Construction 2.0 車載テレマティクス日報 CSV ＆ 施工4D LandXML 成果物エクスポート`  
**Labels**: `type:feature`, `domain:bim-cim`, `compliance:mlit`  
**Milestone**: `v5.4-Sprint2: Auto-Fleet-2.0`

#### 1. ユーザーストーリー
施工管理技術者として、本日の自律フリート稼働実績（総運搬土量、走行距離、アイドリング時間、CO2総削減量）を i-Construction 2.0 準拠のテレマティクス作業日報 CSV として出力し、発注者検査に即座に提出したい。

#### 2. 技術仕様
- **配置ファイル**: `src/utils/fleetLogGenerator.ts`
- **出力内容**:
  1. `FLEET_TELEMATICS_REPORT.csv`: 車両別稼働時間、走行速度分布、運搬土量、燃費・電力消費量、エコドライブ率
  2. `BIM/CIM納品ハブ (ExportPackageModal)` への成果物12としての統合

#### 3. 受入基準 (Acceptance Criteria)
- [ ] CSVエクスポートがBOM付UTF-8でダウンロードされ、国交省標準様式に準拠していること。

---

# Epic 3: 4D AR現場MRグラス・完全同期プロジェクション（Edge-SLAM & WebXR）
**Issue Title**: `[EPIC] 4D AR現場MRグラス・完全同期プロジェクション基盤（WebXR & Construction Edge-Twin）`  
**Labels**: `type:epic`, `domain:field-dx`, `compliance:mlit`  
**Milestone**: `v5.5-Sprint3: 4D-AR-Field-MR`

### 概要
現場監督や発注者検査員が現場でMeta Quest 3 / スマートフォンをかざした際、Nova3Dの設計3Dモデル（路床面3D-TIN、構造物杭、地下配管）を空間SLAM点群と1cm精度で重畳表示し、出来形検測のメジャー実測を不要化するWebXR現場MR基盤を開発する。

### 構成サブイシュー
- [ ] #3-1: RTX 3050 Ti Tensorコア活用型 WebXR / 現場カメラSLAM点群 1cm精度位置合わせエンジン
- [ ] #3-2: 3D-TIN路床面・橋梁杭・地下埋設インフラの実空間半透明重畳レンダラー
- [ ] #3-3: 国交省『出来形管理要領（土工・舗装工）』準拠 リアルタイム設計面差異ヒートマップ照合
- [ ] #3-4: 現地MR検査証跡写真メタデータ付き検査報告書 CSV/PDF エクスポート

---

### Issue 3-1: RTX 3050 Ti Tensorコア活用型 WebXR / 現場カメラSLAM点群 1cm精度位置合わせエンジン
**Title**: `feat(field-dx): WebXR / 現場カメラSLAM点群 1cm精度アライメントエンジン`  
**Labels**: `type:engine`, `domain:field-dx`, `perf:rtx-3050ti`  
**Milestone**: `v5.5-Sprint3: 4D-AR-Field-MR`

#### 1. ユーザーストーリー
現場技術者として、基準点杭（境界杭・水準点）の既知座標とスマートフォン/MRデバイスのカメラトラッキング特徴点群を3点マッチング（ICPアルゴリズム）させることで、1cm以内の精度で設計座標系（JGD2011 第IX系）と実空間を位置同期させたい。

#### 2. 技術仕様
- **配置ファイル**: `src/utils/xrAlignmentEngine.ts`, `src/hooks/useXrFieldAlignment.ts`
- **アルゴリズム**:
  - WebXR Hit Test API & 特徴点トラッキング
  - 3点座標マッチングによるアフィン変換行列（Rotation, Translation, Scale）のリアルタイム導出
  - ジッター除去（カルマンフィルター／移動平均平滑化）

#### 3. 受入基準 (Acceptance Criteria)
- [ ] 3つの既知基準点（ベンチマーク）の入力から、実空間の推定誤差が $\Delta \le 10\text{mm}$ 以内に収束すること。
- [ ] 手ブレやカメラ移動時にもモデルの空間固定が破綻せず、滑らかに追従すること。

---

### Issue 3-2: 3D-TIN路床面・橋梁杭・地下埋設インフラの実空間半透明重畳レンダラー
**Title**: `feat(ui-3d): 3D-TIN路床面・下部工基礎杭・地下埋設管の実空間半透明MRレンダラー`  
**Labels**: `type:ui-hud`, `domain:field-dx`, `perf:rtx-3050ti`  
**Milestone**: `v5.5-Sprint3: 4D-AR-Field-MR`

#### 1. ユーザーストーリー
検査官として、完成した道路盛土の上から、地中に埋まった橋梁場所打ち杭（φ1200mm）や雨水排水管の設計位置が「X線透視」のように半透明オパシティで実空間に投影される光景を確認したい。

#### 2. 技術仕様
- **配置ファイル**: `src/components/FieldXrWorkspace.tsx`, `src/components/3d/XrOverlayRenderer.tsx`
- **視覚表現**:
  - レイヤー別透過表示切替（路床3D-TIN、構造物躯体、地下杭・基礎、排水暗渠）
  - デプスオクルージョン（手前の実地盤による適切なオクルージョンシェーディング）
  - オパシティスライダー（0%〜100%透過）

#### 3. 受入基準 (Acceptance Criteria)
- [ ] 実写ビデオ背景と3Dモデルの合成描画が60FPSで動作すること。
- [ ] レイヤー切替操作に対してラグなく即座に表示対象が切り替わること。

---

### Issue 3-3: 国交省『出来形管理要領（土工・舗装工）』準拠 リアルタイム設計面差異ヒートマップ照合
**Title**: `feat(audit): 出来形管理要領準拠 設計面高低差リアルタイムヒートマップ判定 ＆ 規格値合否照査`  
**Labels**: `type:audit`, `domain:field-dx`, `compliance:mlit`  
**Milestone**: `v5.5-Sprint3: 4D-AR-Field-MR`

#### 1. ユーザーストーリー
監督職員として、現場地面に立っているだけで、現在の足元の実測高と設計路面高の標高差 $\Delta h$（mm）がリアルタイムに足元地面へ等高線ヒートマップとしてカラープロジェクションされ、規格値（$\pm 50\text{mm}$）内かどうかが瞬時に合否判定されることを求める。

#### 2. 準拠土木基準
- 国土交通省『地上型レーザースキャナーを用いた出来形管理要領（土工編）』
- 『デジタルデータを活用した鉄筋出来形計測要領』
- 規格値: 路床面 $\pm 50\text{mm}$、路盤面 $\pm 30\text{mm}$、表層 $\pm 15\text{mm}$

#### 3. 受入基準 (Acceptance Criteria)
- [ ] 画面中心のレティクル（十字カーソル）位置の設計標高（FH）、現況標高（GH）、標高差（$\Delta h$）がミリメートル単位でHUD表示されること。
- [ ] 規格値外（$\Delta h > 50\text{mm}$ または $< -50\text{mm}$）の箇所が赤く警告表示されること。

---

### Issue 3-4: 現地MR検査証跡写真メタデータ付き検査報告書 CSV/PDF エクスポート
**Title**: `feat(export): GNSS測位・測点アノテーション付き現地MR検査調書 CSV ＆ スナップショット保存`  
**Labels**: `type:feature`, `domain:bim-cim`, `compliance:mlit`  
**Milestone**: `v5.5-Sprint3: 4D-AR-Field-MR`

#### 1. ユーザーストーリー
検査員として、MR画面上で「📸 出来形検査ショット」ボタンを押すだけで、重畳表示された設計面差異・測点番号（STA.）・GNSS緯度経度・合格判定スタンプが焼き込まれた検査証跡画像と検査調書CSVを一括出力したい。

#### 2. 技術仕様
- **配置ファイル**: `src/utils/xrInspectionReportGenerator.ts`
- **成果物形式**:
  1. `FIELD_INSPECTION_PHOTO_[STA].png`: 測定値HUDがオーバーレイされた検査写真
  2. `FIELD_INSPECTION_REPORT.csv`: 測点、設計高、実測高、較差、規格値、判定（合格/不合格）、検査日時、立会者署名欄
  3. `BIM/CIM納品ハブ (ExportPackageModal)` への成果物13としての統合

#### 3. 受入基準 (Acceptance Criteria)
- [ ] 検査画像に電子納品基準準拠の測点情報が正しくメタデータおよび視覚レイヤとして埋め込まれること。
- [ ] 総合納品ハブから全13大成果物の一括ZIPエクスポートが行えること。

---

# Epic 4: 四眼連動エンジニアリング設計（Three.js 3D・平面・縦断・横断）＆ ワークステーションUI刷新
**Issue Title**: `[EPIC] 四眼連動エンジニアリング設計（Three.js 3D・平面・縦断・横断）＆ ワークステーションUI刷新` (#16)  
**Labels**: `type:epic`, `domain:cad-bim`, `type:ui-hud`, `perf:rtx-3050ti`, `compliance:mlit`  
**Milestone**: `v5.3-Sprint2: QuadView-ThreeJS-ModernUI`

### 概要
国土交通省道路構造令およびBIM/CIM設計照査要領に完全準拠し、疑似3D SVG描画から **Vanilla Three.js (WebGL)** への完全移行を行い、2D平面図・縦断図・横断図のCAD製図精度・操作性、および暗色高密度ワークステーションUIを刷新する最優先Epic。

### 構成サブイシュー
- [ ] #17: feat(viewport-3d): Vanilla Three.js 本格3Dコリドー＆実地形メッシュレンダラー実装（OrbitControls・車載POV・路面マテリアル）
- [ ] #18: feat(cad-plan): 2D平面図 CAD/QGISエンジンの描画・操作性高度化（スムーズパン/ズーム、正確なクロソイド・法線展開、主要点測点杭アノテーション）
- [ ] #19: feat(profile-view): 縦断プロファイルエンジンの刷新（GL地盤高vs計画高FH、VPIパラメトリック変形、凸凹型VCL縦断曲線、勾配・切盛面積HUD）
- [ ] #20: feat(cross-section): マルチアセンブリ横断スライサーの高度化（舗装・路盤層、片勾配カントすりつけ、法面1:1.5、排水工寸法線表示）
- [ ] #21: feat(ui-modernism): Technical Workstation Modernismに基づくUI刷新 ＆ 四眼（平面・縦断・横断・3D）完全同期レーザーシーク統合

---

### Issue 4-1: Vanilla Three.js 本格3Dコリドー＆実地形メッシュレンダラー実装（OrbitControls・車載POV・路面マテリアル） (#17)
**Title**: `feat(viewport-3d): Vanilla Three.js 本格3Dコリドー＆実地形メッシュレンダラー実装（OrbitControls・車載POV・路面マテリアル）`  
**Labels**: `type:ui-hud`, `domain:cad-bim`, `perf:rtx-3050ti`  
**Milestone**: `v5.3-Sprint2: QuadView-ThreeJS-ModernUI`

- **概要**: 道路コリドーが従来のフラットなSVG疑似3Dから本物の3Dポリゴンメッシュ（Three.js WebGL）として滑らかに押し出し描画され、マウスによる自由な回転・パン・ズーム（OrbitControls）や、ワンクリックでの走行視点（Driver POV）へ切り替え可能にする。
- **技術仕様**: `src/components/3d/RoadCorridorThreeView.tsx` 新規実装。プロシージャルメッシュ押出、DirectionalLight立体陰影、軽量PCFシャドウ、VRAM 15MB以下、60FPS維持。

---

### Issue 4-2: 2D平面図 CAD/QGISエンジンの描画・操作性高度化（スムーズパン/ズーム、正確なクロソイド・法線展開、主要点測点杭アノテーション） (#18)
**Title**: `feat(cad-plan): 2D平面図 CAD/QGISエンジンの描画・操作性高度化（スムーズパン/ズーム、正確なクロソイド・法線展開、主要点測点杭アノテーション）`  
**Labels**: `type:ui-hud`, `domain:cad-bim`, `compliance:mlit`  
**Milestone**: `v5.3-Sprint2: QuadView-ThreeJS-ModernUI`

- **概要**: 2D平面図上でマウスホイールによる直感的なズームや中ボタンドラッグによるパンに対応。緩和曲線（クロソイド KA/KE杭）や円弧（BC/MC/EC杭）の寸法・測点杭がCAD製図基準に準拠して精緻に描画される。
- **技術仕様**: Matrix Transformによる自由パン・ズーム、法線引き出し線アノテーション、幅員構成線および切土法肩・盛土法尻の正確な展開。

---

### Issue 4-3: 縦断プロファイルエンジンの刷新（GL地盤高vs計画高FH、VPIパラメトリック変形、凸凹型VCL縦断曲線、勾配・切盛面積HUD） (#19)
**Title**: `feat(profile-view): 縦断プロファイルエンジンの刷新（GL地盤高vs計画高FH、VPIパラメトリック変形、凸凹型VCL縦断曲線、勾配・切盛面積HUD）`  
**Labels**: `type:engine`, `domain:cad-bim`, `compliance:mlit`  
**Milestone**: `v5.3-Sprint2: QuadView-ThreeJS-ModernUI`

- **概要**: 地形断面（地盤線 GL）と計画路面線（FH）の切土盛土関係が明瞭にハッチング表示され、変勾配点（VPI）のインタラクティブな昇降操作によって縦断曲線（VCL）および勾配（%表示）がリアルタイムに再計算される。
- **技術仕様**: 道路構造令第20条準拠の凸型縦断曲線半径（$R_v \ge 3,000\text{m}$）/ 凹型（$R_v \ge 2,000\text{m}$）の放物線描画、最急勾配（$i \le 5.0\%$）警告、下部帯図（DLバンド）リアルタイム更新。

---

### Issue 4-4: マルチアセンブリ横断スライサーの高度化（舗装・路盤層、片勾配カントすりつけ、法面1:1.5、排水工寸法線表示） (#20)
**Title**: `feat(cross-section): マルチアセンブリ横断スライサーの高度化（舗装・路盤層、片勾配カントすりつけ、法面1:1.5、排水工寸法線表示）`  
**Labels**: `type:ui-hud`, `domain:cad-bim`, `compliance:mlit`  
**Milestone**: `v5.3-Sprint2: QuadView-ThreeJS-ModernUI`

- **概要**: 任意の測点を選択した瞬間に、車道カント片勾配（$i=2.0\% \sim 5.0\%$）、路床・路盤・表層のマルチレイヤー舗装、切土盛土のり面、U型側溝が設計寸法線付きで明瞭に展開される。
- **技術仕様**: 片勾配すりつけの動的回転、盛土（1:1.8）/切土（1:1.2）小段自動生成、断面積リアルタイム求積表示。

---

### Issue 4-5: Technical Workstation Modernismに基づくUI刷新 ＆ 四眼（平面・縦断・横断・3D）完全同期レーザーシーク統合 (#21)
**Title**: `feat(ui-modernism): Technical Workstation Modernismに基づくUI刷新 ＆ 四眼（平面・縦断・横断・3D）完全同期レーザーシーク統合`  
**Labels**: `type:ui-hud`, `domain:cad-bim`, `perf:rtx-3050ti`  
**Milestone**: `v5.3-Sprint2: QuadView-ThreeJS-ModernUI`

- **概要**: 暗色高密度ワークステーション（#090d13ベース、JetBrains Mono × Inter）の洗練されたUI環境で、Quad-View（2×2グリッド）、Split、単一フルスクリーンの切り替えが瞬時に行え、どのビューをクリックしても全画面がレーザーのように完全同期する。
- **技術仕様**: 2×2 Quad-View グリッドレイアウト最適化、クイックアクションツールバー、四眼同期レーザーシークニードル、折りたたみ式左右インテリジェントドック。

---

## 🛠️ GitHub CLI / 手動登録コマンドリファレンス

本仕様書の内容を GitHub リポジトリ（`yamatotakeru616/Nova3D-Civil-Platform-v5.2`）へ登録する際は、以下のコマンドまたはGitHub Web UIの「New Issue」より直接転記して作成可能です。

```bash
# 例: Epic 1 の作成
gh issue create \
  --repo yamatotakeru616/Nova3D-Civil-Platform-v5.2 \
  --title "[EPIC] リアルタイム豪雨・土砂崩れ崩壊シミュレーション ＆ 斜面安定工AI設計基盤" \
  --label "type:epic,domain:geotech,compliance:mlit" \
  --body-file - << 'EOF'
（仕様書のEpic 1本文を貼り付け）
EOF
```
