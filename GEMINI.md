# Nova3D Civil Platform v5.2 - プロジェクト運用規範 & 開発ガイドライン (GEMINI.md)

## 1. 基本方針 & コア原則
- **言語設定**: 全ての対話・UI表示・設計ドキュメントは「日本語」を基本とする。
- **Planモードファースト**: 機能追加や大幅変更時は、必ず「Planモード」で計画・影響範囲を提示し、ユーザー確認・合意を得てから実装に進む。
- **Grill me 原則**: 曖昧な仕様やトレードオフ、土木工学的な制約（土量バランス、道路構造令、河川法等）については、妥協せず深掘り質問を行い、精緻な要件定義を実施する。
- **継続的改善ループ**: `今後の開発予定.md` を常に最新化し、改善・機能追加のPDCAサイクルを回す。

## 2. アーキテクチャ & 設計規準
- **UIデザイン**: 「Technical Workstation Modernism」
  - 暗色高密度ワークステーション（`#090d13` ベース、JetBrains Mono × Inter）
  - 航空測量・3Dデジタルツイン（PyVista風/Cesium風ビューポート）、QGIS 2D平面線形、地形縦横断プロファイル、土量マスカーブ
  - HUDカード（土量収支、勾配センサー、構造物スペック、クロソイド諸元）
  - 道路設計専用ワークスペース（2D QGIS PLAN × 3D PyVista CORRIDOR スプリット、道路構造令リアルタイム監査マトリクス、LandXML 1.2 出力）
- **操作のスキル化 (Skill-based Action Architecture)**:
  - 線形微調整（IPドラッグ平行シフト）、AI設計コンペ案切り替え（案A/B/C）、標準横断アセンブリ変更、土量自動再計算、法規技術基準チェック、HITL承認、プロファイル測点シーク、LandXMLエクスポートなど、UI操作をすべて独立したモジュール化された「アクションスキル」として定義・実行可能にする。
  - 将来的なAIエージェントによる自律実行やマクロ実行に耐えうる設計とする。
- **Hooks駆動 & 自動テスト (Automated Verification with Hooks)**:
  - ビジネスロジック・土木計算・制約判定はカスタムフック群（`useCivilPlatform`, `useRoadDesign`, `useEarthworkCalculation` 等）に完全分離。
  - フック内に自己整合性チェック（Self-verification/Invariant assertion）を内蔵し、各操作時に法規・数値整合性（道路構造令第15条 曲線半径、第20条 縦断勾配、第16条 緩和曲線長、第21条 合成勾配、第11条 停止視距、第12条 建築限界クリアランス）を自動テスト・検証する。

## 3. カラーパレット・デザイン仕様
- `surface-canvas`: `#090d13`
- `surface-layer-1`: `#0d1117`
- `surface-layer-2`: `#161b22`
- `surface-layer-3`: `#21262d`
- `primary`: `#38bdf8` (Cyan)
- `secondary`: `#a855f7` (AI purple)
- `status-success` / `data-fill`: `#10b981` (Green)
- `data-cut` / `status-danger`: `#f43f5e` (Rose red)
- `status-warning`: `#f59e0b` (Amber)
- `text-primary`: `#f0f6fc`
- `text-secondary`: `#8b949e`
