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

## Mifronサイトの公開

Mifronの本番公開は、GitHub Actionsの `Deploy Mifron Pages` を手動実行します。誤公開防止のため、入力欄へ `DEPLOY_MIFRON` と入力した場合だけ実行されます。

過去の `MCTsites.zip` 自動展開Workflowは、リポジトリ全体を削除して上書きする危険があり、現在の独立サイト公開方式と競合するため廃止しています。

リポジトリ設定には、次の非秘密Variableを登録します。

```text
MIFRON_PAGES_PROJECT=mct-mifron
```

次の秘密情報はCloudflareのアカウント管理者がGitHub Secretsへ登録してください。チャットやリポジトリへ書き込まないでください。

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Cloudflare Pages側のプロジェクト名は既存の `mct-mifron` と一致させます。Secrets未設定時はWorkflowが公開処理を停止します。

本番環境 `production` には、所有者の承認と `main` ブランチ制限を設定しています。Secretsを登録しても、GitHub Actionsの環境承認を通過するまで公開処理は開始されません。

なお、GitHubの管理者バイパス設定は公開REST APIの環境更新項目ではないため、APIからは変更していません。GitHubの `Settings` → `Environments` → `production` で「管理者が保護ルールをバイパスできる」設定を無効にしてください。設定変更後も、Workflowは手動実行・確認語・`production` 承認・`main` 制限を要求します。
