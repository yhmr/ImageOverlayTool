/**
 * ライセンス情報を生成するスクリプト
 * license-checkerを使用して依存パッケージのライセンス情報をJSON形式で出力
 */

const licenseChecker = require('license-checker');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'licenses.json');

licenseChecker.init({
    start: path.join(__dirname, '..'),
    production: true, // 本番依存のみ
    json: true,
}, (err, packages) => {
    if (err) {
        console.error('Error generating license information:', err);
        process.exit(1);
    }

    // ライセンス情報を整形
    const licenses = Object.entries(packages).map(([name, info]) => ({
        name: name,
        licenses: info.licenses || 'Unknown',
        repository: info.repository || '',
        publisher: info.publisher || '',
        url: info.url || '',
    }));

    // JSONファイルとして出力
    fs.writeFileSync(outputPath, JSON.stringify(licenses, null, 2), 'utf-8');
    console.log(`License information generated: ${outputPath}`);
    console.log(`Total packages: ${licenses.length}`);
});
