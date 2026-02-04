javascript: (() => {
  /* 組み込み済み判定 */
  if (document.querySelector('#extend-preview')) return;
  /* CSS */
  (() => {
    const css = `
      body.preview-wiki {
        padding-right: 50vw !important;
      }
      .jstElements.hidden {
        display: inline-block !important;
      }
      .wiki-preview {
        position: fixed !important;
        border: 1px solid #d0d7de;
        top: 0;
        right: 0;
        z-index: 10000;
        margin: 44px 16px 10px !important;
        box-sizing: border-box;
        width: calc(50vw - 32px) !important;
        padding: 8px;
        display: none;
        height: calc(100vh - 54px) !important;
        overflow: auto;
        background: ghostwhite;
      }
      .wiki-edit.hidden, .wiki-preview.active {
        display: inline-block !important;
      }
      `;
    const style = document.createElement('style');
    style.id = 'extend-preview';
    style.innerHTML = css;
    document.head.appendChild(style);
  })();
  /* 編集モードON,OFFの処理 */
  new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
        const isVisible = window.getComputedStyle(mutation.target).display !== 'none';
        if (isVisible) {
          document.body.classList.add("preview-wiki");
        } else {
          document.body.classList.remove("preview-wiki");
        }
      }
    });
  }).observe(document.querySelector("#update"), { attributes: true });
  /* アクティブなプレビューウィンドウの切り替え */
  const activatePreview = (e) => {
    const activeView = `preview_${e.target.id}`;
    document.querySelectorAll('.wiki-preview').forEach((v) => {
      v.id == activeView ? v.classList.add("active") : v.classList.remove("active");
    });
  };
  document.querySelectorAll('textarea.wiki-edit').forEach((wiki) => {
    wiki.removeEventListener('focus', activatePreview);
    wiki.addEventListener('focus', activatePreview);
  });
  /* プレビュー更新処理 */
  const previewUrl = document.querySelector('.tab-preview').getAttribute("data-url");
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));
  const updatePreview = async () => {
    const content = document.querySelector('textarea:focus').value;
    const token = document.querySelector('input[name="authenticity_token"]').value;
    const params = new URLSearchParams();
    params.append('text', content);
    try {
      const response = await fetch(previewUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'x-csrf-token': token,
        },
        body: params
      });
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
      const data = await response.text();
      document.querySelector('.wiki-preview.active').innerHTML = data;
    } catch (error) {
      console.error('送信失敗:', error);
    }
  };
  /* プレビュー自動更新処理 */
  let idleId, timeoutId;
  const debouncePreview = () => {
    clearTimeout(timeoutId);
    if (idleId) cancelIdleCallback(idleId);
    timeoutId = setTimeout(() => {
      idleId = requestIdleCallback(updatePreview);
    }, 500);
  };
  document.querySelectorAll(".wiki-edit").forEach((textarea) => {
    textarea.removeEventListener('input', debouncePreview);
    textarea.addEventListener('input', debouncePreview);
  });
})();
