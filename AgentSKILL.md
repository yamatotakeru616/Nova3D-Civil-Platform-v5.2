# Nova3D Civil Platform v5.2 - AgentSKILL.md
## 自律型土木AIエージェント スキル定義仕様書

本ドキュメントは、自律型土木AIエージェント（Autonomous Civil Agent）がシステム内で実行可能なAPIツール、プロンプトテンプレート、および実行規約を定義するものである。

---

## 1. エージェントスキル一覧（Civil Skill Registry）

| スキルID | スキル名 | カテゴリ | 機能概要 | 入力パラメータ | 出力 |
|:---|:---|:---|:---|:---|:---|
| `SKILL_ALIGNMENT_IP_SHIFT` | 平面線形IP微調整 | 道路設計 | 交点(IP)座標のシフトとクロソイドパラメータ再計算 | `ipIndex, deltaX, deltaY, radius` | 新線形ジオメトリ, 法規チェック結果 |
| `SKILL_PROFILE_GRADE_OPTIMIZE` | 縦断勾配自動最適化 | 道路設計 | 土量マスバランスと道路構造令第20条を満たす縦断最適化 | `maxGrade, minGrade, earthworkWeight` | VPIリスト, 切盛土量比 |
| `SKILL_STRUCT_SPAN_ALLOCATE` | 橋梁径間割最適計算 | 橋梁工学 | 渡河水理離隔・地質支持層に基づく橋脚配置と支間割 | `riverWidth, pierMinClearance` | 径間割アレイ, 支承仕様 |
| `SKILL_TUNNEL_SUPPORT_ADAPT` | 掘削支保パターン選定 | トンネル | 切羽地山評価点・弾性波速度に基づくNATM支保選定 | `stationM, rockMassRating` | 支保パターン(CI/CII/DI/DII) |
| `SKILL_EARTHWORK_LP_SOLVE` | 土量配分線形計画法 | 土工計画 | ダンプ運搬距離・燃料消費を最小化する最適配分解 | `cutBlocks, fillBlocks, dumpCap` | 運搬マトリクス, CO2排出量 |
| `SKILL_MLIT_LEGAL_AUDIT` | 道路構造令全線一括監査 | 法規認証 | 第11条〜第21条の全6大技術基準のリアルタイム判定 | `projectData` | PASS/WARN/FAILマトリクス |
| `SKILL_EXPORT_DELIVERABLES` | 国交省全成果物一括生成 | 納品 | LandXML, IFC, OpenDRIVE, i-Con CSV等の一括生成 | `packageFormat, targetPath` | 生成ファイル一覧, チェックサム |
| `SKILL_MARKOV_LCC_PREDICT` | マルコフ50年LCC予測 | 維持管理 | 確率推移行列による予防保全 vs 事後保全の生涯費用算出 | `transitionMatrix, unitCost` | 50年劣化推移, 費用削減率 |

---

## 2. 各スキルの詳細入出力スキーマとプロンプト

### 2.1 `SKILL_ALIGNMENT_IP_SHIFT` (平面線形IP微調整)
```typescript
interface IpShiftInput {
  ipIndex: number;          // 変更対象のIP番号 (0-indexed)
  deltaEastM: number;       // 東方向変位 (m)
  deltaNorthM: number;      // 北方向変位 (m)
  targetRadiusM?: number;   // 変更後曲線半径 (m)
  transitionLengthM?: number; // 緩和曲線長 Aパラメータ (m)
}

interface IpShiftOutput {
  status: 'SUCCESS' | 'VIOLATION_DETECTED';
  stationLengthM: number;
  curveData: {
    iaDeg: number;          // 交角 (度)
    tangentLengthM: number; // 切線長 TL (m)
    curveLengthM: number;   // 曲線長 CL (m)
  };
  legalCompliance: {
    radiusCheck: boolean;   // 第15条 R >= 280m
    clothoidCheck: boolean; // 第16条 Aパラメータ拘束
  };
}
```
**エージェント思考プロンプト**:
> 「第1種第3級道路（$V=80\text{km/h}$）におけるIP3の変更要求を受信。最小曲線半径 $R=280\text{m}$ を下回らないよう拘束し、前後の切線長が重複しない範囲で最適シフト量を逆算せよ。」

---

### 2.2 `SKILL_MLIT_LEGAL_AUDIT` (道路構造令全線一括監査)
```typescript
interface LegalAuditOutput {
  overallStatus: 'COMPLIANT' | 'CRITICAL_VIOLATION';
  clauses: {
    article11_stoppingSightDistance: { requiredM: 110; actualM: 145; pass: true };
    article12_clearanceEnvelope: { requiredH: 4.5; actualH: 5.1; pass: true };
    article15_minCurveRadius: { requiredM: 280; actualM: 450; pass: true };
    article16_clothoidParameter: { requiredA: 120; actualA: 180; pass: true };
    article20_maxLongitudinalGrade: { maxAllowedPct: 4.0; actualMaxPct: 3.8; pass: true };
    article21_compositeGrade: { maxAllowedPct: 10.5; actualMaxPct: 4.9; pass: true };
  };
  auditTimestamp: string;
  inspectorId: string;
}
```

---

### 2.3 `SKILL_EXPORT_DELIVERABLES` (国交省全成果物一括生成)
```typescript
interface DeliverablesExportResult {
  exportedFiles: Array<{
    fileName: string;
    fileFormat: 'LandXML' | 'IFC' | 'OpenDRIVE' | 'GeoJSON' | 'CSV';
    standardSpec: string;
    sizeKb: number;
  }>;
  totalItems: 10;
  hashDigestSha256: string;
}
```
**自動化マクロコマンド**:
```bash
nova3d-agent run --skill=SKILL_EXPORT_DELIVERABLES --format=ALL --out=./dist/delivery_package
```
