# Mifron 本番運用手順

この手順は、Mifronの本番公開・支援導線・安全確認を行うための運用メモです。秘密値はこのファイル、チャット、Gitへ記録しません。

## 公開サイトの反映

1. `Settings` → `Environments` → `production` を開く。
2. 必須レビュアーが設定されていることを確認する。
3. 「管理者が保護ルールをバイパスできる」を無効にする。
4. `production` のデプロイブランチ制限が `main` のみであることを確認する。
5. `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` をGitHubの `production` 環境Secretsへ登録する。チャットやリポジトリへ貼り付けない。
6. Repository variable `MIFRON_PAGES_PROJECT=mct-mifron` を確認する（既存の本番Pagesプロジェクト）。
7. `Deploy Mifron Pages` を手動実行し、確認欄へ `DEPLOY_MIFRON` を入力する。
8. `production` の承認を行い、最後のCanary確認が成功するまで完了扱いにしない。

Workflowは手動実行、確認語、環境承認、`main` 制限をすべて要求します。失敗した場合は再実行前にログとCloudflare側の状態を確認します。

現在のリポジトリは所有者本人のみが共同編集者のため、`main` の必須PRレビューを有効にするとマージ不能になる可能性があります。別の信頼できるレビュアーを追加できる状態になった時点で、`main` に必須PRレビュー1件・管理者にも適用・強制push禁止・削除禁止を設定してください。設定完了までは、手動公開Workflowと `production` 承認を必須の公開ゲートとして扱います。

## 支援導線の有効化

支援販売は初期状態で無効です。提供内容・価格・返金処理・Minecraft Usage Guidelinesへの適合を運営で確認してから、決済事業者側の商品を作成します。

有効化前に、必ず[Minecraft Usage Guidelines](https://www.minecraft.net/usage-guidelines)の最新版を確認してください。特に、支援特典が他プレイヤーへの競争上の優位やゲームプレイ上の不公平を生まないことを確認します。

VM側の `/home/tatudragon0327/minoru-bot/.env` に、運営で確定した値だけを設定します。

```env
SUPPORT_PAGE_URL=https://mifron.mct-official.com/#support
SUPPORT_PROVIDER=tebex
SUPPORT_SALES_ENABLED=true
# SUPPORT_CATALOG_JSON は SUPPORT_FULFILLMENT.md の形式で、承認済みの商品値を設定する
SUPPORT_WEBHOOK_ENABLED=true
SUPPORT_WEBHOOK_HOST=127.0.0.1
SUPPORT_WEBHOOK_PORT=8125
SUPPORT_WEBHOOK_SECRET=<provider-webhook-secret>
SUPPORTER_ROLE_ID=<discord-role-id>
```

`<...>` は実値の投入例ではなく、VM管理者が安全な経路で置き換える項目です。設定後はBotを再起動し、購入ボタン・署名検証・重複イベント・返金・Supporterロール剥奪をテストします。販売設定が不完全な場合、Botは購入ボタンを表示しません。

## リリース前チェック

- `systemctl is-active minecraft.service minoru-bot.service` が両方 `active`
- `mifronplugin-deploy.timer`、`minoru-deploy.timer`、`mifron-backup.timer` が `enabled` かつ `active`
- 最新バックアップのSHA-256検証が成功
- AIは `AI_ENABLED=false`、OpenAIキー未設定のまま
- GitHub token、Webhook、決済秘密値がログへ出ていない
- 支援販売を有効化する場合だけ、決済事業者とWebhookを疎通確認
- 公開URLで新しいHTML、CSP、HSTS、Canary要素を確認

## してはいけない操作

- 秘密値をGit、Issue、Discord、ログへ保存する
- AI/Codexに本番秘密・VM shell・mainへの直接変更権限を与える
- 支援特典にPvP性能、MP倍率、ショップ優遇を付ける
- GitHubのIssueやPRだけを根拠に本番完了と判断する
- Workflow失敗時にSecretsをログへ出力して調査する
