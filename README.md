# AfterUse MVP

Citarum川流域向けの廃棄物回収アプリ MVP 実装です。Expo + React Native + TypeScript ベースで、将来Firebase本番接続できる構成にしています。

## 実装済み（Phase 1 MVP）

- 認証フロー（電話番号 + OTPのMVP版）
- プロフィール作成
- 持ち込み記録（タイプ、重量、QR値入力、画像URL任意）
- ポイント計算、CO2削減量表示
- ダッシュボード（今月統計、活動履歴、簡易グラフ）
- 履歴フィルタ
- 村内/全体ランキング表示
- バッジ判定ロジック
- ログアウト
- ユニットテスト（計算・バッジ）

## 技術スタック

- React Native (Expo)
- TypeScript
- React Navigation v6
- React Native Paper
- Firebase SDK（設定済み、MVPはモックデータ併用）

## セットアップ

```bash
cd RiverGuard
npm install
npm start
```

Expo Go でQRコードを読み取り、実機確認してください。

スマホからWebアクセスする場合は、以下を使ってください（同一URLのQRを `assets/qr/afteruse-web-local.png` とターミナルの両方に出力します）。

```bash
npm run web:mobile
```

同一Wi-Fi外から一時公開したい場合（テスト用）は以下を使ってください。

```bash
npm run web:public
```

公開URLとQR（`assets/qr/afteruse-web-public.png`）が出力されます。コマンド実行中のみ有効です。
`loca.lt` の tunnel password 入力画面が表示される場合があります（仕様）。

このスクリプトは分かりやすさのために以下も生成します:
- パスワード確認用QR: `assets/qr/afteruse-tunnel-password-help.png`（`https://loca.lt/mytunnelpassword` を開く）
- 案内テキスト: `assets/qr/afteruse-public-access-guide.txt`

使い方（配布時）:
1. まず `afteruse-web-public.png` を読んでもらう
2. tunnel password 画面が出たら、`afteruse-tunnel-password-help.png` を同じ端末で開いて値を確認
3. 値を入力して進む

## 固定URL用QRを作る（任意）

固定URLがある場合だけ、事前配布用の固定QRを生成できます（起動なし）。

```bash
npm run gen:qr:fixed -- https://example.com/afteruse
```

出力先（デフォルト）:
- `assets/qr/afteruse-web-fixed.png`

## Firebase設定

`.env` に以下を設定してください。

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=riverguard-mvp.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=riverguard-mvp
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=riverguard-mvp.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## テスト

```bash
npm test
```

## Firestoreルール

`firestore.rules` をFirebase CLIで適用してください。

## Seedデータ

```bash
node scripts/seed-data.js
```

`serviceAccountKey.json` は `scripts/` 配下へ配置し、Git管理対象外にしてください。

## プロジェクト構成

- `src/components`: UI部品
- `src/screens`: 画面
- `src/services`: ビジネスロジック
- `src/context`: グローバル状態
- `src/utils`: 計算/検証
- `tests`: ユニットテスト
