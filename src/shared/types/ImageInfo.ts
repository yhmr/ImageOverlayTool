/**
 * 画像パスから取得したファイル情報
 * exists=false の場合はサイズ情報を持たない
 */
export type ImageInfoResult =
    | {
          exists: false;
      }
    | {
          exists: true;
          width?: number;
          height?: number;
      };
