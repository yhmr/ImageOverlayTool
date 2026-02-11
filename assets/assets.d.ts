// assetsディレクトリ内のファイルの型宣言
// tsc --noEmit で @assets/icon.png などのインポートを解決するために必要
declare module "*.png" {
    const value: string;
    export default value;
}

declare module "*.ico" {
    const value: string;
    export default value;
}

declare module "*.icns" {
    const value: string;
    export default value;
}
