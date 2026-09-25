# MCT 公式ポータル

MCTのメインサイトです。Mifron・CREWMATE・TEXROOTは、それぞれ独立したCloudflare Pagesサイトとして公開します。

## URL構成

- `https://mct-official.com/` MCT公式ポータル
- `https://mifron.mct-official.com/` Mifron
- `https://crewmate.mct-official.com/` CREWMATE
- `https://texroot.mct-official.com/` TEXROOT

旧URLの `/mifron/`、`/crewmate/`、`/texroot/` は各独立サイトへ301リダイレクトします。

## Discordリンク

`assets/config.js` でDiscord招待URLを管理しています。

## クエストの評価と運営レビュー

クエストの詳細（ボードのカード / `quests/detail.html`）を開くと「高評価 / 低評価」で評価でき、同じ場所の「削除を提案」から削除提案を送信します。表示するのは高評価数だけで、低評価数は運営レビュー画面にのみ表示します。

レビュー画面は `https://mifron.mct-official.com/admin/` です。サイト内のナビゲーションからはリンクせず、`noindex` と `robots.txt` の `Disallow: /admin/` で検索対象から外しています。認証はないため、表示する内容は公開API（`/api/quests`、`/api/proposals` とそれぞれの `votes`）が返す範囲に限定しています。

- 強調表示: 高評価比率 70% 以上（3票以上）
- 要注意: 高評価比率 30% 以下（3票以上）
- 削除提案の優先比率: 提案への高評価 ÷（提案への高評価 ＋ 対象クエストの低評価）

## スタイルシートの構成

Mifronの各ページは、共通デザインシステムを統合した `mifron/assets/styles.css` と、ページ固有の `quests.css` / `proposals.css` / `admin.css` を読み込みます。MCTポータルはルートの `assets/styles.css` を使うため、共通デザインを変更するときは両方のファイルへ反映してください（Mifronサイトは独立して公開できるよう、`mifron/` 配下で完結させています）。

## Mifronサイトの公開

Mifronの本番公開は、GitHub Actionsの `Deploy Mifron Pages` を手動実行します。誤公開防止のため、入力欄へ `DEPLOY_MIFRON` と入力した場合だけ実行されます。

過去の `MCTsites.zip` 自動展開Workflowは、リポジトリ全体を削除して上書きする危険があり、現在の独立サイト公開方式と競合するため廃止しています。

リポジトリ設定には、次の非秘密Variableを登録します。

```text
MIFRON_PAGES_PROJECT=mct-mifron
```

次の秘密情報だけをCloudflareのアカウント管理者がGitHub Secretsへ登録してください。チャットやリポジトリへ書き込まないでください。

```text
CLOUDFLARE_API_TOKEN
```

アカウントIDは秘密ではないため、GitHub Repository Variable `CLOUDFLARE_ACCOUNT_ID` に保存します。Pagesプロジェクト名も同じくRepository Variable `MIFRON_PAGES_PROJECT` に保存します。

Cloudflare Pages側のプロジェクト名は既存の `mct-mifron` と一致させます。Secrets未設定時はWorkflowが公開処理を停止します。

現在の本番サイトは既存の `mct-mifron` へ反映済みで、CSP/HSTSとMifron固有404を実測済みです。GitHub Actionsによる再公開は、`CLOUDFLARE_API_TOKEN` を登録した後に、確認語とproduction環境承認を通して実行します。

本番環境 `production` には、所有者の承認と `main` ブランチ制限を設定しています。Secretsを登録しても、GitHub Actionsの環境承認を通過するまで公開処理は開始されません。

なお、GitHubの管理者バイパス設定は公開REST APIの環境更新項目ではないため、APIからは変更していません。GitHubの `Settings` → `Environments` → `production` で「管理者が保護ルールをバイパスできる」設定を無効にしてください。設定変更後も、Workflowは手動実行・確認語・`production` 承認・`main` 制限を要求します。
