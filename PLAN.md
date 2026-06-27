# Architecture Motion Atlas Plan

## 対象

システムアーキテクチャとソフトウェアアーキテクチャを分けて扱い、各ページでは反対側カテゴリで相性の良いスタイルを理由、成立条件、注意点とともに示す。

### システムアーキテクチャ

- Client-Server
- 3-Tier / N-Tier
- Monolithic System
- Microservices
- SOA
- Event-Driven System
- Serverless / FaaS
- Edge / CDN-Oriented
- Data Pipeline / Analytics Platform
- Hybrid / Distributed System

### ソフトウェアアーキテクチャ

- Layered Architecture
- Clean Architecture
- Hexagonal Architecture
- MVC
- MVVM
- Modular Monolith
- Domain-Driven Design
- CQRS
- Event Sourcing
- Pipeline Architecture
- Plugin Architecture
- Microkernel Architecture

## ページ構造

- `#/`: 全体インデックスと共通理解ポイント
- `#/system`: システムアーキテクチャ一覧
- `#/software`: ソフトウェアアーキテクチャ一覧
- `#/system/:id`: 1システムアーキテクチャの詳細ページ
- `#/software/:id`: 1ソフトウェアアーキテクチャの詳細ページ

各詳細ページは次の構造にする。

- Essence
- Primary question
- Not this
- Normal behavior diagram
- Strong case diagram
- Weak / trade-off case diagram
- 利点
- トレードオフ
- 品質特性
- 判断圧
- 相性の良い反対側カテゴリのアーキテクチャ
- 一緒に理解すべき問い

## 共に理解すべきこと

- 境界が runtime boundary か code dependency boundary か
- 通常時に要求、依存、データ、イベントのどれが流れるか
- 利用急増時に増やせる単位と詰まる単位
- 変更時に影響を止める契約
- 障害時に伝播する経路と隔離範囲
- 整合性、観測、テスト、運用負荷がどこへ移るか
- 反対側カテゴリのどのスタイルと境界が揃うか
- 似た名前のスタイルと何が違うか

## Goal prompt

次の条件を満たすまで検証と修正を繰り返す。

- 対象スタイルは合計20以上、システム10以上、ソフトウェア10以上。
- 各スタイルに3個以上の独立シナリオ図を持つ。
- 各図のアニメーション始点と終点は対象ノードのアンカーと一致する。
- 各スタイルに利点2個以上、トレードオフ2個以上、適用条件2個以上、弱い条件2個以上を持つ。
- 各スタイルに共通理解用の問い10個以上を持つ。
- 各システムページには相性の良いソフトウェアアーキテクチャを1個以上、各ソフトウェアページには相性の良いシステムアーキテクチャを1個以上記載する。
- 理由、成立条件、注意点が空でない。
- 320px、390px、768px、1366px の幅で主要テキスト、図、ナビゲーションが重ならない。
- `npm run check` と `nix flake check` が通る。
- 独立検証ラウンド4回で P0/P1/P2 指摘ゼロ。
- その後の安定化ラウンド2回で新規 P0/P1/P2/P3 指摘ゼロ。
- 最大12ラウンドで終了する。12ラウンド目に残る P3 が過去指摘と完全同一なら終了してよい。

## 実装方針

- React、TypeScript、Vite を使う。
- SVGでノード、エッジ、境界、アニメーション粒子を描画する。
- `src/data/architectures.ts` にスタイル定義を集約する。
- `scripts/check-*.ts` で内容、図の幾何、ルート、レスポンシブ前提を定量検証する。
- Nix flake でビルドと検証を定義する。
- JavaScript依存は `package-lock.json` に一本化し、devenv はローカル開発用の入口として定義する。
