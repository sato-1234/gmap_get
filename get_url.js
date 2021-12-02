"use strict";
// -- G_MAPからURL取得。 -- //
// -- コマンド[node get_url.js 東京都 ラーメン屋 2] -- //

// -- 引数取得「都道府県」「キーワード」「希望ページネーション数」 -- //
const prefectures = process.argv[2];
const keyword = process.argv[3];
let loopMax = process.argv[4];

if(
		prefectures == null || prefectures == '' ||
		keyword == null || keyword == '' ||
		loopMax == null || loopMax == ''
){
		console.log('引数を設定してください');
		return false;
}

loopMax = Number(loopMax);
if(isNaN(loopMax)){
		console.log('第3引数は数値を設定してください');
		return false;
}
loopMax = Math.trunc(loopMax);

// 東京都_ラーメン屋(ここで値変更「都道府県+キーワード」)
//let url = "https://www.google.co.jp/maps/search/東京都+ラーメン屋/";
let url = "https://www.google.co.jp/maps/search/" + prefectures + "+" + keyword + "/";

url = encodeURI(url); //エンコード（％表示）

// 貼り付けデータ用(CSVのとき)
let getData = [];

const puppeteer = require('puppeteer');
// 別次元処理（ブラウザ内処理）
(async () => {

		// -- 動作確認モード設定（本番はコメントか削除) -- //
		// const browser = await puppeteer.launch({
		// 		headless: false,  // 動作確認するためheadlessモードにしない
		// 		slowMo: 1  // 動作確認しやすいようにpuppeteerの操作を遅延させる
		// });

		//  -- 動作確認モード設定（本番用) -- //
		const browser = await puppeteer.launch();

		// 動作ブラウザインスタンス作成（表示サイズも作成）
		const page = await browser.newPage();
		await page.setViewport({
				width: 1920,
				height: 1080
		});

		//URL指定
		await page.goto(url);

		//　タイムアウト対策(必要な場合のみコメント解除）
		//await page.setDefaultNavigationTimeout(0);

		// 初期読み込み遅延させて読み込みまつ
		await page.waitForNavigation({waituntil: 'domcontentloaded'});
		await page.waitForTimeout(1000);

		// 「loopMax」回転（読み込みたいページネーション数）
		for(let i = 0; i < loopMax; i++){

				// 現在のページネーション位置をコマンド画面表示
				console.log('\u001b[32m' + (i + 1));

				// スクロールAPI
				await page._client.send(
						'Input.synthesizeScrollGesture',
						{
						x: 150,
						y: 300,
						xDistance: 0,
						yDistance: -800,
						repeatCount: 3,
						repeatDelayMs: 1000
						}
				);

				let items = await page.$$('#pane .section-scrollbox > div > div > div > a');
				// 1ページネーションのURL数表示
				console.log(items.length);

				/* -- オーブジェクト（連想配列）追加（CSV用） -- */
				for (let item of items) {
						let hrefValue = await item.getProperty('href');
						hrefValue = await hrefValue.jsonValue();
						getData.push(hrefValue);
				}

				// 次のページのボタン判断：disabled="true"と要素がない場合
				if( !( await page.$('#pane .punXpd > button') ) ){break;}
				if( await page.$('#pane .punXpd > button:last-of-type[disabled]') ){break;}

				// 次のページ処理
				let clickButton = await page.$$('#pane .punXpd > button');
				await Promise.all([
						page.waitForNavigation(),
						clickButton[1].click()
				]);
		}

		// 重複値処理(URLの重複：広告で発生)
		getData = [...new Set(getData)];
		// 二次元オブジェクトに変換
		let getDataUrl = getData.map(function(value){
				return { url: value };
		})
		console.log(getDataUrl.length);//URL取得合計数表示

		// -- CSV作成処理スタート-- //
		// 保存パス設定
		const dateTime = new Date();
		const pathTime = dateTime.getFullYear() + "_" +
					(dateTime.getMonth() + 1)  + "_" +
					dateTime.getDate() + "_" +
					dateTime.getHours() + "_" +
					dateTime.getMinutes() + "_" +
					dateTime.getSeconds();
		const file_path = './csv/url/url_' + pathTime + '.csv';

		// 書き込み処理
		const fs = require('fs');
		const stringifySync = require("csv-stringify/lib/sync");
		const iconv = require('iconv-lite');//shift_js保存の場合
		const csvString = stringifySync(getDataUrl, {
			header: false,
		});
		const csvStringSjis = iconv.encode(csvString, 'Shift_JIS');//shift_js保存の場合
		fs.writeFileSync(file_path, csvStringSjis);

		console.log('URL一覧用のCSV作成が完了しました');
		await browser.close();
})();
