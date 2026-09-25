# Mifron 独自販売ページ仕様書

この文書は、Tebexを廃止してMifron公式サイト上に独自の販売ページ(ストア)を設けるための仕様です。販売の有効化・価格確定・返金条件・Minecraft Usage Guidelines適合の最終判断は運営が行い、初期状態では販売を有効化しません。

対象リポジトリ: `tatudrag0n/officialsites`
対象ホスト: `https://mifron.mct-official.com/`
実装配置: `mifron/store/`(ページ)、`mifron/assets/store.css` / `store.js`、`src/index.js`(API)、`assets/config.js`(有効化フラグ)

---

## 1. 目的と方針

- Tebex(外部ストア)をやめ、Mifronサイト内の販売ページから購入できるようにする。
- 販売対象は **装飾・称号・Discordロール・支援特典** に限定し、PvP性能・MP倍率・ショップ優遇などゲームバランスに影響する特典は付けない(既存方針を維持)。
- 販売は初期OFF。`assets/config.js` の `mifronSupportPage` に決済ページURLが設定された時だけ購入ボタンを表示する。
- 決済事業者(Stripe等)の契約・規約・返金・未成年者対応・sandbox検証が完了するまで `SUPPORT_SALES_ENABLED=false` を維持する。

## 2. 商品ラインナップ

### 2.1 月額購読(サブスクリプション)

| ID | 名称 | 価格 | 主な特典 |
| --- | --- | --- | --- |
| `supporter` | Mifronサポーターパス | 月300円 | 特別ロール「サポーター」/称号「MSP」/Discord #会議 閲覧権/提案が目立つ/特別エフェクト/名前カラー(月ごとに変更可) |
| `supporter_plus` | Mifronサポーターパス+ | 月1,000円 | 特別ロール「サポーター+」/称号「MSP+」/#会議 発言権(1時間1チャット)/提案がさらに目立つ/サイトへの名前掲載(希望者のみ)/特別エフェクト/名前・チャットカラーとタブアイテム(月ごとに変更可) |

- 購読は毎月自動更新。解約後は次回更新日まで有効。
- `supporter_plus` は `supporter` の上位互換(特典は包含)。

### 2.2 カスタムスキン・エフェクト

| ID | 名称 | 価格 | 例 |
| --- | --- | --- | --- |
| `custom_cosmetic` | カスタムスキン・エフェクト | free〜10,000円 | 各ブロックを模したスキン、足元から炎が出るエフェクト、目の前のプレイヤーに変身するモーション など |

- 価格は制作難度に応じて運営が個別見積もり。`free`(無料)枠も受け付ける。
- 制作には提案フォーム(`mifron/proposals/`)から申請し、審査後に見積もり・制作・納品とする。

### 2.3 装飾アイテム(単品)

| ID | 名称 | 価格 | 内容 |
| --- | --- | --- | --- |
| `name_color` | ネームカラー | 各色100円 | ネームタグに色を設定 |
| `chat_color` | チャットカラー | 各色100円 | チャットに色を設定 |
| `tab_item` | タブアイテム | 各100円 | ネームタグ横にアイテムを表示 |

### 2.4 装飾パック

| ID | 名称 | 価格 | 内容 |
| --- | --- | --- | --- |
| `decor_pack` | 装飾パック | 500円 | ネームカラー2x・チャットカラー2x・タブアイテム2x(各2つまで選択可) |

## 3. 購入対象の色・アイテム一覧

- ネームカラー/チャットカラー: 16色(Minecraftのチャットカラー相当: black, dark_blue, dark_green, dark_aqua, dark_red, dark_purple, gold, gray, dark_gray, blue, green, aqua, red, light_purple, yellow, white)。
- タブアイテム: サーバーで許可したMaterialの許可リストに限定する(運営が `tab-items` として管理。既定はダイヤ・エメラルド・金リンゴ等の装飾向けアイテムのみ)。
- カスタム系はすべて見た目のみで、当たり判定・性能・ドロップには影響させない。

## 4. 有効化フローと表示制御

1. `assets/config.js` の `mifronSupportPage` は既定で空文字。空の間は購入ボタンを `hidden` にし、「現在は支援受付を行っていません」を表示する。
2. 決済ページURLが `https://` で設定された時のみ購入導線を表示する(既存 `data-support-link` / `data-support-pending` と同じ方式)。
3. ストアページの商品カードの「購入」は、`data-buy` 要素として同じフラグで制御する。
4. 販売開始の最終判断は運営が行い、サイト側はフラグのみでON/OFFできるようにする。

## 5. 購入手続きと購入反映

### 5.1 全体フロー

```
プレイヤー → ストアページ(商品選択)
          → 決済事業者(Checkout / サブスクリプション)
          → 決済事業者 Webhook
          → Minoru Bot の支援Webhook受信(SUPPORT_WEBHOOK_*)
          → Minoru Bot が購入者をMinecraft UUIDへ紐付け
          → Discordロール付与(SUPPORTER_ROLE_ID 等)
          → Minecraft側へ特典反映(プラグイン連携)
```

- サイト(`officialsites`)は商品表示と決済ページへの遷移のみを担当する。決済の秘密値・Webhook検証・ロール付与はBot側で扱い、サイトに秘密値を置かない。
- 購入者とMinecraft UUIDの紐付けは、既存のDiscord認証(6桁コード)で確立済みの対応を使う。未認証者には購入前に認証を案内する。
- ロール/称号/カラー付与はオフラインでも保持され、次回ログイン時に反映する。
- 失敗時は購入IDをキーに冪等に再試行する(重複付与を防止)。

### 5.2 購入レコード(最小項目)

| 項目 | 内容 |
| --- | --- |
| `orderId` | 決済事業者のオーダー/サブスクリプションID |
| `productId` | 2章のID |
| `minecraftUuid` | 認証で紐付いたUUID |
| `discordId` | 付与先Discordユーザー |
| `selection` | 色/タブアイテム/カスタム内容 |
| `status` | pending / active / cancelled / refunded / expired |
| `periodEnd` | 月額の次回更新日時 |
| `grantedAt` | 反映日時 |
| `idempotencyKey` | 重複付与防止キー |

### 5.3 解約・返金

- 月額は決済事業者側の解約で `status=cancelled` とし、`periodEnd` まで特典を維持、以降は剥奪する。
- 返金は `status=refunded` とし、付与済みロール/称号/カラーを剥奪する。
- 返金条件・期間は運営が販売ページに明記する。

## 6. プラグイン側特典の対応(MifronPlugin)

ストアで付与する特典は、MifronPlugin側の以下に対応させる(別リポジトリ `tatudrag0n/MifronPlugin`)。サイトは付与結果を表示するのみ。

| 特典 | MifronPlugin側の扱い |
| --- | --- |
| 称号「MSP」「MSP+」 | `selectedTitle` / `unlocked-titles` 相当の称号に登録し、`[MSP]` プレフィックス表示 |
| 名前カラー | `refreshPlayerName` の表示名/タブ名へ色を適用 |
| チャットカラー | チャットメッセージへ色を適用 |
| タブアイテム | `playerListName` 末尾にアイテム名を付与 |
| 特別エフェクト | 既存の`SpecialItemsFeature`とは別の、見た目のみのパーティクル |
| 提案が目立つ | サイト/ゲーム内の提案一覧でサポーターをハイライト |
| カスタムスキン/モーション | 既存スキン機構(`skins`)の拡張枠として登録 |

- すべて表示・装飾専用。PvP・MP・ショップ・報酬には影響させない。
- 反映用の連携はMinorU Bridgeと同じBearer認証のローカルAPI方式、またはBot経由のデータ同期を用いる。秘密値はサイトへ置かない。

## 7. 特殊アイテム(ゲーム内)の紹介

ストアページには掲載せず、ホームページに既存のゲーム内「特殊アイテム」の説明と、提案で追加できる旨を掲載する。

低確率で通常アイテムが特殊アイテムへ変化する(取得・クラフト時)。名称はプラグインの表示名、元アイテムはモチーフのバニラアイテムを日本語表記で示す。以下は現行実装(`SpecialItemsFeature`)。

| ID | 特殊アイテム | 元アイテム(モチーフ) | 抽選率 | 効果 |
| --- | --- | --- | --- | --- |
| `hookshot` | フックショット | 釣り竿 | 0.05% | ウキを引っ掛けた所へ急接近 |
| `scratch` | スクラッチ | 紙 | 1% | 右クリックで運試し、MP獲得 |
| `jetpack` | ジェットパック | チェーンのチェストプレート | 1% | ブレイズパウダーを燃料に飛行 |
| `resonance` | 残響の結晶 | 残響の欠片 | 2% | ソニックビーム(使い捨て) |
| `fireball` | ファイアーボール | ファイアチャージ | 0.1% | ガストの火の玉(使い捨て) |
| `skates` | ローラースケート | 鉄のブーツ | 0.01% | 走行時に高速滑走 |
| `decayed_sword` | 朽ちた剣 | ネザライトの剣 | 0.001% | 全エンチャントMAXで真価 |

- 特殊アイテムは売買不可・不可壊。見た目や性能の調整案は提案フォームから受け付け、審査後に実装する。
- 抽選率・効果は運営が調整できる設定値として扱う。

## 8. 実装ファイル

| ファイル | 役割 |
| --- | --- |
| `mifron/store/index.html` | ストアページ本体(商品一覧・購入導線) |
| `mifron/assets/store.css` | ストア専用スタイル(既存デザインシステムを継承) |
| `mifron/assets/store.js` | カテゴリ絞り込み・購入ボタン制御 |
| `mifron/assets/config.js` | 販売の有効化フラグ |
| `mifron/_redirects` | `/store` の導線 |
| `mifron/sitemap.xml` | ストアページの登録 |

注記: 注文の受け取り・決済Webhook・購入反映は秘密値を扱うため、サイト(`officialsites`)には実装しない。既存の支援Webhook方式(`SUPPORT_WEBHOOK_*`、Minoru Bot)を`MIFRON_PRODUCTION_RUNBOOK.md`に従って運営側で設定する。

## 9. セキュリティ・コンプライアンス

- ページはCSP(`script-src 'self'` / `connect-src 'self'`)に適合させ、インラインstyle・外部scriptを禁止する。
- サイトに決済秘密値・Webhook秘密値・APIキーを置かない(`validate-mifron-pages.yml` の検査対象)。
- 外部iframe/外部フォームactionはDiscordウィジェット以外を追加しない。
- 特典はMinecraft Usage Guidelinesに適合させる。未成年者の購入・返金・問い合わせ導線を明記する。
- 「支援は任意であり、ゲーム内の有利不利に影響しない」旨をストアページとホームページに明記する。

## 10. 未確定・運営判断

- 決済事業者の選定(Stripe等)と契約。
- 各商品の最終価格・税表示・返金条件。
- カスタム制作の受付枠・納期・見積もり基準。
- `supporter_plus` の「1時間1チャット」の具体的な実装(Bot側レート制限)。
- 販売開始日と告知。
