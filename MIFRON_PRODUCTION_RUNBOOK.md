# Mifron 本番運用手順

この手順は、Mifronの本番公開・支援導線・安全確認を行うための運用メモです。秘密値はこのファイル、チャット、Gitへ記録しません。

## 公開サイトの反映

本番への反映は **Cloudflare Workers Builds**（Cloudflare の GitHub 連携）が `main` へ merge された時点で自動実行します。デプロイ用のGitHub Actionsワークフローは置きません（二重デプロイ防止）。

1. `wrangler.toml` が現行のWorkers Static Assets構成（Worker名 `officialsites`、`main = "src/index.js"`）と一致することを確認する。
2. PRを `main` へ merge する。`Validate Mifron Pages` が通っていることを確認する。
3. Workers Builds がデプロイを完了させる（マージ後 1〜3 分）。
4. `Verify production sites` ワークフローを手動実行し、全5ホスト（`mct-official.com` / `mifron` / `crewmate` / `texroot` / `tatudragon`）が成功するまで完了扱いにしない。
5. 反映に時間がかかり、`Verify production sites` のリトライ（既定 12 x 10 秒）が尽きる場合は時間を置いて再実行する。

現行の公開基盤はCloudflare PagesではなくWorkers Static Assetsです。`MIFRON_PAGES_PROJECT` の設定やPages専用のデプロイ手順は使用しません。`CLOUDFLARE_API_TOKEN` を使った `Deploy officialsites Worker` は、`officialsites` Worker への `Workers Scripts: Edit` 権限がなく `No access to the specified service.` で失敗するため、2026-09-26 に削除しました（PR #81参照）。不要再になった `production` 環境のsecretと承認ルールは `Settings` → `Environments` から削除できます。

現在のリポジトリは所有者本人のみが共同編集者のため、`main` の必須PRレビューを有効にするとマージ不能になる可能性があります。また、GitHub FreeではPrivateリポジトリに必要なブランチ保護／Ruleset機能を利用できない場合があるため、Privateのままレビュー必須化する場合は、利用中のGitHubプランで利用可能な保護機能と信頼できるレビュアーを先に確認してください。

## 支援導線の有効化

支援販売は初期状態で無効です。提供内容・価格・返金処理・Minecraft Usage Guidelinesへの適合を運営で確認してから、決済事業者側の商品を作成します。ストアページは `mifron/store/` にあり、`assets/config.js` の `mifronStorePage`(必要なら `mifronStoreProducts`)に決済ページURLを設定した時だけ購入ボタンが有効になります。未設定の間は「販売準備中」を表示します。

有効化前に、必ず[Minecraft Usage Guidelines](https://www.minecraft.net/usage-guidelines)の最新版を確認してください。特に、支援特典が他プレイヤーへの競争上の優位やゲームプレイ上の不公平を生まないことを確認します。

VM側の `/home/tatudragon0327/minoru-bot/.env` に、運営で確定した値だけを設定します。

```env
SUPPORT_PAGE_URL=https://mifron.mct-official.com/#support
# 初期状態は販売OFF。決済事業者・規約・返金・sandbox検証の確定後にだけ運営判断で変更する
SUPPORT_PROVIDER=
SUPPORT_SALES_ENABLED=false
# SUPPORT_CATALOG_JSON は承認済みの商品値を設定する（販売開始前は空欄のまま）
SUPPORT_WEBHOOK_ENABLED=false
SUPPORT_WEBHOOK_HOST=127.0.0.1
SUPPORT_WEBHOOK_PORT=8125
# SUPPORT_WEBHOOK_SECRET=<provider-webhook-secret>
# SUPPORTER_ROLE_ID=<discord-role-id>
```

`<...>` は実値の投入例ではなく、VM管理者が安全な経路で置き換える項目です。販売開始前に`SUPPORT_SALES_ENABLED=false`と`SUPPORT_WEBHOOK_ENABLED=false`を維持します。販売を有効化する場合は、決済事業者・規約・返金・未成年者対応・Minecraft Usage Guidelinesの確認、sandbox検証、明示承認を先に完了し、その後にBotを再起動して購入ボタン・署名検証・重複イベント・返金・Supporterロール剥奪をテストします。販売設定が不完全な場合、Botは購入ボタンを表示しません。

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
- GitHubのIssueやPRだけを根拠に本番完了と判断する（必ず `Verify production sites` の実測で判断する）
- Workflow失敗時にSecretsをログへ出力して調査する
