/**
 * 指定されたCSSセレクタの要素がDOM上に作成されるまで待機する関数
 * @param {string} selector - 待ちたい要素のCSSセレクタ (例: '#list-container', '.list-item')
 * @param {Element} [parentNode=document] - 監視を開始する親ノード（デフォルトはdocument全体）
 * @returns {Promise<Element>} 要素が見つかったらその要素を返すPromise
 */
function waitForElement(selector, parentNode = document) {
  return new Promise((resolve) => {
    // 1. 既に要素がDOM上に存在している場合は、即座にresolveする
    const existingElement = parentNode.querySelector(selector);
    if (existingElement) {
      return resolve(existingElement);
    }

    // 2. 存在していない場合は MutationObserver で監視を開始
    const observer = new MutationObserver((mutationsList, obs) => {
      // 変化があったノードの中に、目的のセレクタに一致するものがあるか確認
      const element = parentNode.querySelector(selector);
      
      if (element) {
        // 要素が見つかったら監視を終了（これ以上の負荷をかけない）
        obs.disconnect();
        // 要素を返してPromiseを完了
        resolve(element);
      }
    });

    // 監視オプション（子要素と子孫要素の追加を監視）
    observer.observe(parentNode, {
      childList: true,
      subtree: true
    });
  });
}
