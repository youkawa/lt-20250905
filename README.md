# Notebook Report Weaver

モノレポ構成の「ノートブック解析・レポート生成」システムです。task.md / design.md / requirements.md を元に初期実装されています。

構成:
- apps/frontend: Next.js 14（レポート編集・実行UI）
- apps/api: NestJS（Projects/Reports/Templates/Exports/Proxy/Metrics）
- apps/notebook-service: FastAPI（.ipynb解析とPPTX/PDFエクスポート）

ツールの機能概要:
- ノートブック解析: `.ipynb` を解析し、Markdown/コード出力（PNG/SVG/Plotly）を抽出
- レポート生成: PPTX/PDF にエクスポート（目次・ブックマーク・日本語フォント・段組対応）
- テンプレート管理: .pptx のアップロード/バージョン管理/既定テンプレートのルール適用
- 非同期実行: メモリ/Redis（BullMQ）ベースのジョブキュー、進捗確認と再試行
- 認証/権限: JWT または開発用 `X-User-Id`、管理ガード（ADMIN のみ許可）
- メトリクス/監視: `/metrics`（Prometheus）、Grafana ダッシュボード

クイックスタート（Docker Compose）:
1. `docker-compose build`
2. `docker-compose up`
   - Frontend: `http://localhost:3000`
   - API: `http://localhost:3001/health`
   - Notebook: `http://localhost:8000/health`
   - Prometheus: `http://localhost:9090`
   - Grafana: `http://localhost:3002`（ダッシュボードは monitoring/grafana 配下でプロビジョニング）

メモ（ボリューム）:
- `./uploads` はAPIのテンプレート格納先にマウントされます。
- `./exports` はNotebookサービスの出力先にマウントされます（PPTX/PDFが生成）。

APIコンテナ起動時の挙動:
- 起動スクリプトで `prisma generate` → `prisma migrate deploy` 実行後、`npm run prisma:seed` を試行します（失敗しても続行）。
  - ログに `Seeded user: alice@example.com id=<...>` が出力されます（ADMIN）。管理APIの動作確認に利用可能。

クイックスタート（E2E フロー例）
1) スタック起動: 上記の Docker Compose を起動
2) プロジェクト作成（任意: API経由）
   ```bash
   curl -sS -X POST http://localhost:3001/projects \
     -H 'Content-Type: application/json' \
     -H 'X-User-Id: u1' \
     -d '{"name":"Demo Project"}'
   ```
   戻り値の `id` を `PROJECT_ID` として控えます。
3) エクスポートを開始（テンプレート未設定でも可）
   ```bash
   curl -sS -X POST http://localhost:3001/exports \
     -H 'Content-Type: application/json' \
     -H 'X-User-Id: u1' \
     -d '{
       "title":"Hello Report",
       "content":[{"type":"notebook_markdown","source":"# Heading\nBody"}],
       "metadata": {"projectId": "'$PROJECT_ID'"}
     }'
   ```
   `downloadUrl` から Notebook Service の生成物を取得できます。
4) フロントエンドを開く: `http://localhost:3000`（環境変数は docker-compose に設定済み）。
   - プロジェクト/レポート一覧やノートブック解析フローのUIを確認できます。

---

開発（ローカル実行）

Frontend（apps/frontend）:
- 必要: Node.js 20系
- コマンド:
  - `npm install`
  - `npm run dev`（ポート3000）
- 主な環境変数:
  - `NEXT_PUBLIC_API_BASE_URL`（例: `http://localhost:3001`）
  - `NEXT_PUBLIC_NOTEBOOK_BASE_URL`（例: `http://localhost:8000`）
  - `NEXT_PUBLIC_USER_ID`（開発用。APIへ `X-User-Id` ヘッダを付与）
  - `NEXT_PUBLIC_JWT`（任意。付与時は `Authorization: Bearer` を利用）

API（apps/api）:
- 必要: Node.js 20系 / PostgreSQL
- セットアップ:
  - `npm install`
  - `npx prisma generate`
  - `npx prisma migrate dev --name init`
  - `npm run prisma:seed`
- 起動: `npm start`（ポート既定 3001）
- 主な環境変数:
  - `DATABASE_URL`（例: `postgresql://app:app@localhost:5432/app`）
  - `PORT`（デフォルト 3001）
  - `NOTEBOOK_SERVICE_URL`（デフォルト `http://localhost:8000`）
  - `TEMPLATES_DIR`（デフォルト `/app/uploads/templates`）
  - `JWT_SECRET`（JWT検証の秘密鍵。未設定時は開発用デフォルト）
  - 非同期エクスポート関連:
    - `EXPORT_ASYNC`: `true` で非同期（`POST /exports` は `{ jobId, status:'queued' }` を返却）
    - `EXPORT_QUEUE`: `bull` で BullMQ（Redis）を使用。未指定はインメモリ簡易キュー
    - `REDIS_URL` または `REDIS_HOST`/`REDIS_PORT`
    - `EXPORT_WORKER_CONCURRENCY` / `EXPORT_JOB_ATTEMPTS` / `EXPORT_JOB_BACKOFF_MS`
  - エクスポート連携:
    - `EXPORT_HTTP_TIMEOUT_MS`（NotebookサービスへのHTTPタイムアウトms。既定15000）

Notebook Service（apps/notebook-service）:
- 必要: Python 3.11
- セットアップ/起動:
  - `pip install -r requirements.txt`
  - `uvicorn app.main:app --reload --port 8000`
- 主な環境変数:
  - `APP_VERSION`（表示用）
  - `EXPORT_OUT_DIR`（出力先ディレクトリ）
  - PDFフォント（日本語対応など）:
    - `PDF_FONT_REGULAR` / `PDF_FONT_BOLD`（TTF/OTF/ttcパス）。未指定時はNoto系を自動探索、なければHelvetica系

---

API/エンドポイント概要

- 認証/ユーザ解決:
  - 優先: `Authorization: Bearer <JWT>` の `sub`/`userId`/`id`
  - 代替（開発時のみ）: `X-User-Id` ヘッダ
- `GET /metrics`: Prometheusメトリクス
- Projects（`/projects`）:
  - `GET /projects`（自分のプロジェクト一覧）
  - `POST /projects`（作成）
  - `GET /projects/:id` / `DELETE /projects/:id`
  - `GET /projects/:id/reports`（ページング `take`/`cursor`）
- Reports（`/reports`）:
  - `POST /reports`（作成）
  - `GET /reports/:id` / `PATCH /reports/:id`
  - `GET /reports/projects/:projectId/reports`（ページング）
- Templates（`/templates`）:
  - `GET /templates` / `GET /templates/:id`
  - `POST /templates` / `PATCH /templates/:id` / `DELETE /templates/:id`（管理者のみ）
  - `POST /templates/upload`（管理者）FormData: `file`=.pptx, `title`, `version`
  - `POST /templates/:id/default`（管理者）Body: `{ projectId?, titlePattern? }`
- Exports/Proxy:
  - `POST /exports`（同期/非同期。Notebookサービスの `/export` を呼び出し）
  - `GET /export-jobs/:jobId`（Notebookサービス `/export-jobs/:id` のプロキシ）

エクスポート（Notebook Service）

- `POST /parse`（multipart/form-data）
  - 入力: `file`（.ipynb）
  - 出力: `{ name, cells: ParsedCell[] }`
- `POST /export`（application/json）
  - 入力: `{ title, content, metadata?, templatePath?, format?('pptx'|'pdf') }`
  - 出力: `{ jobId, status, downloadUrl? }`（本実装は同期的に完了まで待機）
- `GET /exports/:jobId.pptx` / `GET /exports/:jobId.pdf`
  - 生成物をダウンロード。ファイル名は `title`/`projectId|projectName`/生成時刻から自動生成

PDFレンダリングの仕様（抜粋）
- 見出し/目次/ブックマーク:
  - `text_box` の `<h1>/<h2>`、`notebook_markdown` の `#`～`######` を見出しとして検出し、目次とアウトラインに反映
- 段組/余白/フォントサイズ:
  - `metadata.pdfStyle` で調整可能（例）
    - `columns`: 1|2|… / `columnGap`: 数値
    - `marginLeft|Right|Top|Bottom`: 数値（pt）
    - `titleFontSize|headingFontSize|bodyFontSize`、`bodyLeading`
- 画像出力:
  - `image/png` / `image/svg+xml` / `application/vnd.plotly.v1+json` を優先してスライド/紙面に埋め込み

テンプレートの自動適用ロジック（API側）
- 指定なし（`templateId`/`templatePath` 未指定）の場合、`Template.content.rules` と `content.isDefault` に基づいて選択。
- 優先度: `projectId & titlePattern` > `projectId` のみ > `titlePattern` のみ > グローバル既定。
- 同スコア内での並び替え: `version` 降順 → `updatedAt` 降順 → `createdAt` 降順。

---

テスト/品質管理

- Frontend:
  - 単体: `npm test`（Vitest）
  - E2E: `npm run test:e2e`（Playwright。API/Notebook起動と環境変数設定が必要）
  - Lint: `npm run lint`
- API:
  - 単体/E2E: `npm test`（Jest）
  - Lint: `npm run lint`
  - Prisma: `npx prisma migrate dev` / `npm run prisma:seed`
- Notebook Service:
  - テスト: `pytest -q`
  - 形式/静的解析: `black --check .` / `ruff check .`

---

サンプル cURL

前提:
- API: `http://localhost:3001`
- Notebook Service: `http://localhost:8000`
- 開発時の認証: `X-User-Id` ヘッダ（JWTでも可）。管理APIはADMIN権限が必要です。

1) テンプレートのアップロード（ADMINのみ）

開発時（X-User-Id に管理者のユーザーIDを指定）:

```bash
curl -X POST http://localhost:3001/templates/upload \
  -H 'X-User-Id: <ADMIN_USER_ID>' \
  -F file=@template.pptx \
  -F title='Quarterly Template' \
  -F version=1
```

JWT を使う場合:

```bash
curl -X POST http://localhost:3001/templates/upload \
  -H 'Authorization: Bearer <JWT>' \
  -F file=@template.pptx \
  -F title='Quarterly Template' \
  -F version=1
```

2) 既定テンプレートの設定（ADMINのみ）

```bash
curl -X POST http://localhost:3001/templates/<TEMPLATE_ID>/default \
  -H 'X-User-Id: <ADMIN_USER_ID>' \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"p1","titlePattern":"^Demo"}'
```

3) 同期エクスポート（PPTX/PDF 即時生成）

PPTX（テンプレート自動適用）:

```bash
curl -sS -X POST http://localhost:3001/exports \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -d '{
    "title":"Demo Report",
    "content":[
      {"type":"text_box","content":"<h1>Executive Summary</h1>..."},
      {"type":"notebook_markdown","source":"## Section\nDetails"}
    ]
  }'
```

PDF（段組などを指定）→ ダウンロードまで:

```bash
JOB=$(curl -sS -X POST http://localhost:3001/exports \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -d '{
    "title":"PDF Report",
    "format":"pdf",
    "metadata":{"pdfStyle":{"columns":2,"columnGap":16}},
    "content":[{"type":"text_box","content":"<h1>Executive Summary</h1>..."}]
  }')
JOB_ID=$(echo "$JOB" | sed -n 's/.*"jobId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
curl -fL -o report.pdf "http://localhost:8000/exports/${JOB_ID}.pdf"
```

4) 非同期エクスポート（BullMQ使用時など）

`EXPORT_ASYNC=true` かつ（任意で）`EXPORT_QUEUE=bull` の場合、`POST /exports` はキューに投入されたレコードを返します。ジョブの状態はAPIのプロキシ経由で確認できます。

```bash
REC=$(curl -sS -X POST http://localhost:3001/exports \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -d '{"title":"Async Report","content":[]}')
JOB_ID=$(echo "$REC" | sed -n 's/.*"jobId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
curl http://localhost:3001/export-jobs/${JOB_ID}
# 完了後に Notebook Service からダウンロード
curl -fL -o out.pptx "http://localhost:8000/exports/${JOB_ID}.pptx"
```

5) Notebook の parse（セル抽出）

```bash
curl -X POST http://localhost:8000/parse -F file=@sample.ipynb
```

6) テンプレートIDを指定してエクスポート

```bash
curl -sS -X POST http://localhost:3001/exports \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -d '{
    "title":"Template Based Report",
    "templateId":"<TEMPLATE_ID>",
    "content":[{"type":"notebook_markdown","source":"# Title"}]
  }'
```

注:
- `X-User-Id` は開発時のみ有効です。本番は JWT を使用してください。
- 管理系APIは ADMIN 権限を要求します（seed では `alice@example.com` が ADMIN）。

---

よくある質問（FAQ）
- 管理者API（テンプレートアップロード等）が403になる
  - 開発時は `X-User-Id` を ADMINユーザのIDに設定してください（seedで `alice@example.com` がADMINとして作成されます）。本番はJWTで認証してください。
- フロントエンドからAPIに接続できない
  - `NEXT_PUBLIC_API_BASE_URL` が正しいポート（開発なら 3001）を指しているか確認してください。
- PDFの日本語が豆腐になる
  - `PDF_FONT_REGULAR`/`PDF_FONT_BOLD` に NotoSansCJK 等のフォントパスを指定してください（Dockerでは自動検出も試みます）。

---

CI
- `.github/workflows/ci.yml` にフロント/バック/ノートブックの lint/test、BullMQ向けの簡易E2E が定義されています（実運用向けに適宜拡充してください）。
