# Notebook Report Weaver

Jupyter Notebookからスライド形式のレポートを生成するためのモノレポ構成アプリケーションです。

## ✨ 概要

`apps/frontend` (Next.js), `apps/api` (NestJS), `apps/notebook-service` (FastAPI) の3つのサービスが連携して動作します。

- **ノートブック解析**: `.ipynb` を解析し、Markdown/コード/グラフ出力を抽出します。
- **レポート生成**: PPTX/PDF形式で、目次やブックマーク付きのレポートをエクスポートします。
- **テンプレート管理**: `.pptx` テンプレートのアップロードとバージョン管理が可能です。
- **非同期処理**: Redis (BullMQ) を利用したジョブキューイングに対応しています。
- **モニタリング**: Prometheus と Grafana による監視ダッシュボードを備えています。

---

## 🚀 クイックスタート (Docker Compose)

すぐにアプリケーション全体を試したい場合は、Docker Composeを使用するのが最も簡単です。

1.  **ビルド**:
    ```bash
    docker-compose build
    ```

2.  **起動**:
    ```bash
    docker-compose up
    ```

以上で、すべてのサービスが起動します。

- **Frontend**: `http://localhost:3000`
- **API**: `http://localhost:3001/health`
- **Notebook Service**: `http://localhost:8000/health`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3002`

---

## 🔧 ローカル開発環境の構築

各サービスをローカルマシンで直接起動し、開発を行うための手順です。

### 1. 前提条件

以下のツールがインストールされていることを確認してください。

- **Node.js**: `v20`系 (nvmでの管理を推奨)
- **Python**: `v3.11`系 (`.python-version` ファイルあり。pyenvでの管理を推奨)
- **Docker** と **Docker Compose**

### 2. データベースの起動

APIサーバーはPostgreSQLデータベースとRedisを必要とします。`docker-compose.yml`に定義済みのサービスを起動します。

```bash
# データベースとRedisをバックグラウンドで起動
docker-compose up -d db redis
```

### 3. 依存関係のインストール

本プロジェクトは `npm workspaces` を利用したモノレポ構成です。

```bash
# プロジェクトルートで実行
# frontend と api の依存関係をまとめてインストールします
npm install

# Notebook Service の依存関係をインストール
cd apps/notebook-service
pip install -r requirements.txt
cd ../..
```

### 4. データベースのセットアップ (API)

APIが使用するデータベースのテーブル作成と、初期データの投入を行います。

```bash
# apps/api ディレクトリ内で実行
cd apps/api

# Prisma Client を生成
npx prisma generate

# データベースのマイグレーションを実行
DATABASE_URL="postgresql://app:app@localhost:5432/app" npx prisma migrate dev --name init

# 初期データ（テストユーザー等）を投入
DATABASE_URL="postgresql://app:app@localhost:5432/app" npm run prisma:seed

cd ../..
```

### 5. サービスの起動

各サービスを個別のターミナルで起動します。

- **Frontend**:
  ```bash
  # ポート3000で起動
  cd apps/frontend
  npm run dev
  ```

- **API**:
  ```bash
  # ポート3001で起動
  cd apps/api
  npm start
  ```

- **Notebook Service**:
  ```bash
  # ポート8000で起動
  cd apps/notebook-service
  uvicorn app.main:app --reload --port 8000
  ```

---

## 📚 APIエンドポイント概要

- **認証**: `Authorization: Bearer <JWT>` または開発用の `X-User-Id` ヘッダを使用します。
- **メトリクス**: `GET /metrics`
- **Projects**: `GET, POST /projects`, `GET, DELETE /projects/:id`
- **Reports**: `POST /reports`, `GET, PATCH /reports/:id`
- **Templates**: `GET, POST, PATCH, DELETE /templates` (管理者のみ)
- **Exports**: `POST /exports`, `GET /export-jobs/:jobId`

詳細な仕様やリクエスト/レスポンス形式は、ソースコードまたは `design.md` を参照してください。

---

## 🧪 テスト

各ワークスペースでテストを実行できます。

- **Frontend**:
  ```bash
  cd apps/frontend
  npm test          # Unit/Component (Vitest)
  npm run test:e2e  # E2E (Playwright)
  ```

- **API**:
  ```bash
  cd apps/api
  npm test          # Unit/E2E (Jest)
  ```

- **Notebook Service**:
  ```bash
  cd apps/notebook-service
  pytest -q
  ```

---

## 🚦 CI（GitHub Actions）

- ワークフロー: `.github/workflows/ci.yml`
- ジョブ構成:
  - Lint (ESLint): `apps/frontend/src` に加え、API `apps/api/src` も対象（stage 2）。現状は警告（import/order）は許容し、エラーはゼロを維持。
  - Frontend Unit: Next.js 本番ビルド（型チェック有効）→ Vitest 実行。
  - Frontend E2E: Playwright ブラウザをセットアップし、E2E を実行。レポートをアーティファクトに保存。
  - API (Jest): API を `npm run build` で型チェック後、Jest 実行。
  - Notebook (pytest): FastAPI サービスのpytestを実行。

補足方針:
- E2Eは「ページ内 fetch スタブ」を使用し、Next.js の静的アセット/SSRを妨げない形でAPI応答をモックします。
- Lintは厳格運用（警告ゼロ）。`npm run lint:fix` での自動整形を推奨します。

### ローカルでCI相当を一括実行

```bash
# ルートで実行
npm run ci:local
```
（Frontendのbuild+Vitest+Playwright、APIのbuild+Jest、Notebookのpytest、Lint(frontend/api) を順番に実行します）

---

## ❓ FAQ

- **管理者APIが403エラーになる**
  - 開発時は `X-User-Id` ヘッダにADMIN権限を持つユーザーIDを指定してください。`prisma:seed`で作成される `alice@example.com` がADMINです。

- **フロントエンドからAPIに接続できない**
  - `apps/frontend` の `.env.local` ファイルなどで、`NEXT_PUBLIC_API_BASE_URL` が正しいAPIのポート（例: `http://localhost:3001`）を指しているか確認してください。

- **PDFの日本語が文字化けする（豆腐になる）**
  - `apps/notebook-service` を実行する環境で、環境変数 `PDF_FONT_REGULAR` / `PDF_FONT_BOLD` に `NotoSansCJK` などの日本語フォントへのパスを指定してください。
