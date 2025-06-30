// URL正規化ユーティリティ
export function normalizeUrl(url: string): string {
  try {
    let u = new URL(url);
    // プロトコルはhttpsに統一
    u.protocol = 'https:';
    // クエリ・フラグメント除去
    u.search = '';
    u.hash = '';
    // 末尾スラッシュ除去（ただしルートは除く）
    let pathname = u.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    u.pathname = pathname;
    return u.toString();
  } catch (e) {
    // URLパース失敗時は元の文字列を返す
    return url;
  }
} 