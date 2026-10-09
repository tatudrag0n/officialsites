# MCT 公式ポータル

MCTのメインサイトです。Mifron・CREWMATE・TEXROOT・開発者ページ（tatudragon）は、それぞれ独立したCloudflare Pagesサイトとして公開します。

## URL構成

- `https://mct-official.com/` MCT公式ポータル
- `https://mifron.mct-official.com/` Mifron
- `https://crewmate.mct-official.com/` CREWMATE
- `https://texroot.mct-official.com/` TEXROOT
- `https://tatudragon.mct-official.com/` 開発者ページ（tatudragon）

旧URLの `/mifron/`、`/crewmate/`、`/texroot/` は各独立サイトへ301リダイレクトします。

## 開発者ページ（tatudragon）

運営者の個人チャンネルの紹介ページで、`tatudragon/` 配下で完結しています。3つのブランド（Mifron / CREWMATE / TEXROOT）とは別枠で、ポータルのナビゲーションとフッターからのみリンクします。

- 対応ホスト: `tatudragon.mct-official.com`
- 公開ページは `tatudragon/index.html` のみ。チャンネルURLは `tatudragon/index.html` の `<!-- チャンネルURLはここを編集してください -->` の直下にあるリンクカードで管理します。
- 配色はMCTポータルの白ベースを継承しつつ、アクセントのみ開発者ページ専用のローズ（`--dragon: #c02b6b`）にしています。Mifron（インディゴ）/ CREWMATE（グリーン）/ TEXROOT（オレンジ）と識別色として衝突しません。
- `_headers` でMifronサイトと同じCSPとHSTSを適用しています。`style-src 'self'` のためインラインスタイルは使えず、フォントも `assets/fonts/` に自前ホストしています。
- JavaScriptは使用していません。チャンネルリンクはHTMLに直書きなので、JSが失敗してもリンクとSEOは維持されます。

ホスト名とディレクトリの対応は `src/index.js` の `SITE_ROOTS` に集約しています。可変サイト（Mifronと開発者ページ）は `serveSite()` が共通処理します。

`tatudragon.mct-official.com` の Custom Domain はWranglerではなくダッシュボードで管理してください（`wrangler.toml` のコメントの通り、ルート設定の上書きを避けるためです）。

## Discordリンク

`assets/config.js` でDiscord招待URLを管理しています。

## ヒーロー背景動画（自前ホストのループ映像）

各サイトのヒーローには、装飾目的のミュート・ループ動画（8秒・音声なし）を自前ホストで埋め込んでいます。CSP は `default-src 'self'` のため、外部の動画サービスには埋め込まず、すべてリポジトリ内のファイルを使います。`prefers-reduced-motion` 設定時やデータ節約モードでは再生せず、ポスター画像のみを表示します。

- `assets/hero-loop.{mp4,webm}` … MCTポータルのヒーロー（白ベース）
- `mifron/assets/hero-loop.{mp4,webm}` … MifronスタジオとMinecraftページのヒーロー（濃紺）
- `mifron/assets/minecraft-loop.{mp4,webm}` … Minecraftページの紹介動画セクション（緑）
- `tatudragon/assets/hero-loop.{mp4,webm}` … tatudragonのヒーロー（白ベース＋ローズ）
- いずれも `*-poster.webp` をポスターとして併置し、動画の読み込み前と省モーション設定時に表示します。

映像は `tools/render_hero_videos.py` で再生成できます（Pillow / numpy / imageio-ffmpeg が必要）。`tools/` は `.assetsignore` で公開対象から外しています。`tatudragon` は従来通りJavaScriptを使わず、CSSのみでポスター表示に切り替えます。

## クエストの評価と運営レビュー

クエストの詳細（ボードのカード / `quests/detail.html`）を開くと「高評価 / 低評価」で評価でき、同じ場所の「削除を提案」から削除提案を送信します。表示するのは高評価数だけで、低評価数は運営レビュー画面にのみ表示します。

レビュー画面は `https://mifron.mct-official.com/admin/` です。サイト内のナビゲーションからはリンクせず、`noindex` と `robots.txt` の `Disallow: /admin/` で検索対象から外しています。認証はないため、表示する内容は公開API（`/api/quests`、`/api/proposals` とそれぞれの `votes`）が返す範囲に限定しています。

- 強調表示: 高評価比率 70% 以上（3票以上）
- 要注意: 高評価比率 30% 以下（3票以上）
- 削除提案の優先比率: 提案への高評価 ÷（提案への高評価 ＋ 対象クエストの低評価）

## MifronのブランドとMinecraftプロジェクトページ

Mifronは「ゲームやデジタルサービスを開発するインディーゲームスタジオ」です（Games & Digital Experiences）。Minecraftサーバーは最初のプロジェクトとして整理されています。

- `mifron/index.html` はスタジオのブランドサイト（Hero / Featured Projects / News / Community / Store / About）です。
- `mifron/minecraft.html` は代表プロジェクト「Mifron Minecraft」のページです。参加方法、ワールド、MP経済、アイテム、特殊アイテム、クエスト、提案システム、FFAの説明はここに集約しています。
- Minecraft の説明文は MifronPlugin の実装に合わせて更新されます。変更するときは `minecraft.html` を正本とし、トップページへ説明を書き戻さないでください。
- 旧トップページのアンカー（`/join`, `/worlds`, `/ffa`, `/economy`, `/shop` など）は `_redirects` で `minecraft.html` の該当セクションへ転送します。

## スタイルシートの構成

Mifronの各ページは、共通デザインシステムを統合した `mifron/assets/styles.css` と、ページ固有の `quests.css` / `proposals.css` / `admin.css` / `store.css` を読み込みます。MCTポータルはルートの `assets/styles.css` を使うため、共通デザインを変更するときは両方のファイルへ反映してください（Mifronサイトは独立して公開できるよう、`mifron/` 配下で完結させています）。

`mifron/assets/styles.css` 末尾の「スタジオサイト」節は、`body.studio-page` を付けたページ（トップページ、`minecraft.html`、`tutorial.html`）だけが対象のダークテーマです。トークン（`--paper` / `--card` / `--ink` / `--mifron` など）を差し替えて既存コンポーネントを転用しているため、プロジェクトを増やしたページにも同じクラスを付ければ同じ見た目になります。クエスト・提案・管理画面は操作性を優先して明るい配色のまま維持しています。

## 本番への公開

本番への反映は **Cloudflare Workers Builds**（Cloudflare の GitHub 連携）が `main` へ push された時点で自動実行します。これが本番デプロイの唯一の経路です。

GitHub Actions にはデプロイ用ワークフローを置きません。同一のデプロイを2経路で持つと、片方だけ失敗して二重反映や取りこぼしが起きるためです。過去に `CLOUDFLARE_API_TOKEN` を使う `Deploy officialsites Worker` があり、`officialsites` Worker への `Workers Scripts: Edit` 権限がないため `No access to the specified service.` で失敗していました（2026-09-26 確認）。権限のない経路を1本なくすため、ワークフローを削除しています。

反映の確認は GitHub Actions の `Verify production sites` を手動実行してください。トークンは不要で、以下を実測します。

- 全5ホスト（`mct-official.com` / `mifron` / `crewmate` / `texroot` / `tatudragon`）が 200 を返し、期待するビルド内容を含んでいること
- 存在しないパスが 404 を返すこと（200 のまま返ると、検索エンジンが存在しないURLをインデックスする）
- CSP / HSTS / `X-Content-Type-Options` が返っていること

このワークフローを push で自動起動しないのは、Workers Builds のチェックランがデプロイ完了の信号にならないためです（マージ直後に完了する起動 acknowledgment で、反映完了の保証がない）。自動判定にしたい場合は Workers Builds 側のデプロイ完了通知にトリガーを移してください。

### リポジトリ設定

- Repository Variable `CLOUDFLARE_ACCOUNT_ID` … Cloudflare アカウントID（秘密ではない）
- Repository Variable `MIFRON_PAGES_PROJECT` … 現行デプロイ経路では参照していません

環境 secret `production` / `CLOUDFLARE_API_TOKEN` は、デプロイ経路が無くなったため現在未使用です。必要なら削除してください（古い認証情報は放置しない方が安全です）。

`production` 環境に設定してある所有者の承認と `main` ブランチ制限は、参照するワークフローが無くなったため現在発生しません。`Verify production sites` は `workflow_dispatch` のみで、承認を要求しません。

