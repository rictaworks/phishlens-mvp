// jsdomのcryptoにはrandomUUIDが実装されていない場合があるため、
// Node標準のcrypto.randomUUIDをテスト環境にのみ補う(本番のChrome拡張環境ではWeb Crypto APIが使われる)。
const nodeCrypto = require('node:crypto');

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = nodeCrypto.webcrypto;
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () => nodeCrypto.randomUUID();
}
