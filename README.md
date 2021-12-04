# gmap_get
Google MAPに[日本の都道府県]と[キーワード]を指定して、表示されたGoogleマイビジネス一覧を取得する動的スクレイピングコードです。
'URL一覧情報'と'各URLの詳細情報'を取得してCSV化します。
Node.jsとpuppeteerライブラリなどを使用しております。
<br/>

## environment,Library
* OS: macOS Catalina v10.15.7
* Node.js: v16.13.0
* npm: v8.1.4
* puppeteer: v12.0.1
* csv-parse: v4.16.3
* csv-stringify: v5.6.5
* iconv-lite: v0.6.3

## Batch command（cd gmap_get）
* URL list get command
* csv folder： ./csv/url/url_2XXX_XX_XX_XX_XX_XX.csv
* argument：　[都道府県] [keyword] [Number of pagination]
```bash
node get_url.js 東京都 ラーメン屋 2
```

* URL detail get command
* csv folder： ./csv/data/data_2XXX_XX_XX_XX_XX_XX.csv
* argument：　[url_2XXX_XX_XX_XX_XX_XX.csv]
```bash
node get_data.js url_2XXX_XX_XX_XX_XX_XX.csv
```

## Environment creation（cd gmap_get）
1. "Node environment" is required in advance.
```bash
node -v
npm -v
```
2. puppeteer installation.
```bash
npm install --save puppeteer
```
3. Specify the version in "package.json"
```bash
{
  "dependencies": {
    "puppeteer": "^12.0.1"
    "csv-parse": "^4.16.3",
    "csv-stringify": "^5.6.5",
    "iconv-lite": "^0.6.3",
  }
}
```
4. Install other libraries
```bash
npm install csv-parse
npm install csv-stringify
npm install iconv-lite
```
