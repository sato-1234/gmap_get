"use strict";

// -- URL一覧CSVを読みこんでGoogleマイビジネスの情報取得 -- //
// -- コマンド[node get_data.js urlフォルダのにあるCSV名.csv] -- //

// CSVファイル名取得
const csvName = process.argv[2];
if( csvName == null || csvName == '' ) {
		console.log('CSV名を設定してください');
		return false;
} else if( !csvName.match(/^[a-zA-Z0-9\-\_]*\.csv$/) ){
		console.log('CSVファイルではありません。CSV名は半角英数字と「-」「_」のみ使用可能です');
		return false;
}

// CSVファイル読み込み
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const urlData = fs.readFileSync('./csv/url/' + csvName);
const urlRecords = parse(urlData, {
		columns: false,
});
const urls = urlRecords.reduce((pre,current) => {pre.push(...current);return pre},[]);
const countUrl = urls.length;//ループ回転用

// 貼り付けデータ用
let getData = [];

const puppeteer = require('puppeteer');
// -- 別次元処理（ブラウザ内処理） -- //
(async () => {

		//  -- 動作確認モード設定（本番はコメントか削除) -- //
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

		//  -- 取得処理 -- //
		// 格納URL数回転 countUrl
		for(let i = 0; i < countUrl; i++){

				//URL指定（タイムアウト1分）
				try {
						await page.goto(urls[i], {waitUntil:'load',timeout:60000});

						// DOMContentLoadedが発火するまで待機
						await page.waitForNavigation({waituntil: 'domcontentloaded'});
						await page.waitForTimeout(1000);

						//店舗名(状況によってはオブジェクト代入が良いかも)
						let tenpo = await page.$('head > title');
						if(tenpo == '' || tenpo == undefined || tenpo == null ){
								tenpo = '要素なし';
						}
						tenpo = await (await tenpo.getProperty('textContent')).jsonValue();
						tenpo = tenpo.replace( "- Google マップ" , "" );

						let datas = await page.evaluate(() => {

								if( document.querySelector("body button.CsEnBe[aria-label]") ){
										// 回転用:残り「addrss」「tel」「hpUrl」取得用配列
										buttonDatas = document.querySelectorAll("body button.CsEnBe[aria-label]");
								} else {
										return null;
								}

								// 取得変数定義
								let addrssNum = '';
								let addrss = '';
								let tel = '';
								let hpUrl = '';

								buttonDatas.forEach((buttonData) => {

										//if( a.hasAttribute('aria-label') ){
										let aL = buttonData.getAttribute('aria-label');

										if ( aL.match(/^住所:/) ) {
												let tmp = aL.match(/(〒\d{1,3}\-\d{1,4})(.+)$/);
												addrssNum = tmp[1].trim();
												addrss = tmp[2].trim();
										}

										if ( aL.match(/^電話番号:/) ) {
												tel = aL.replace( "電話番号:" , "" );
												tel = tel.trim();
										}

										if ( aL.match(/^ウェブサイト:/) ) {
												hpUrl = aL.replace( "ウェブサイト:" , "" );
												hpUrl = "http://" + hpUrl.trim();
										}

										// } else {
										// 		addrssNum = '属性なし';
										// 		addrss = '属性なし';
										// 		tel = '属性なし';
										// 		hpUrl = '属性なし';
										// }
								});

								// 項目がなかった場合
								if(addrssNum == ''){addrssNum = 'なし'; addrss = 'なし';}
								if(tel == ''){tel = 'なし';}
								if(hpUrl == ''){hpUrl = 'なし';}

								return [addrssNum,addrss,tel,hpUrl,location.href];

						});

						if( datas == null ){
								getData.push({
										zero: tenpo,
										one: '要素なし',
										two: '要素なし',
										three: '要素なし',
										four: '要素なし',
										five: urls[i]
								});
								continue;
						}
						datas.unshift(tenpo);
						//console.log(datas);//各URL情報確認用
						getData.push(datas);
						// 現在の取得番目をコマンド画面表示
						console.log(i + 1);

				} catch (e) {
						console.log("\x1b[31m" + (i + 1),e.message);
						getData.push({
								zero: 'タイムアウトまたは「datas変数エラー」',
								one: 'タイムアウトまたは「datas変数エラー」',
								two: 'タイムアウトまたは「datas変数エラー」',
								three: 'タイムアウトまたは「datas変数エラー」',
								four: 'タイムアウトまたは「datas変数エラー」',
								five: urls[i]
						});
						continue;
				}

		}
		//console.log(getData);//最終取得データ確認用

		// -- CSV作成処理スタート-- //
		// 保存パス設定
		const dateTime = new Date();
		const pathTime = dateTime.getFullYear() + "_" +
					(dateTime.getMonth() + 1)  + "_" +
					dateTime.getDate() + "_" +
					dateTime.getHours() + "_" +
					dateTime.getMinutes() + "_" +
					dateTime.getSeconds();
		const file_path = './csv/data/data_' + pathTime + '.csv';

		// CSV書き込み処理
		//const fs = require('fs');
		const stringifySync = require("csv-stringify/lib/sync");
		const iconv = require('iconv-lite');//shift_js保存の場合必須
		const csvString = stringifySync(getData, {
				header: false,
		});
		const csvStringSjis = iconv.encode(csvString, 'Shift_JIS');//shift_js保存の場合必須
		fs.writeFileSync(file_path, csvStringSjis);

		console.log('店舗情報のCSV作成が完了しました');
		await browser.close();
})();
