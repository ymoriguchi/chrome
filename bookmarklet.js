javascript:(() => {
  if (document.querySelector('.wiki-preview') == null) return;
  if (document.querySelector('#rt-preview')) return;
  if (document.querySelector('#resize-css')) return;

  const style = document.createElement('style');
  style.id = 'rt-preview';
  style.innerHTML = `
    #preview-panel { display: none; }
    body.preview #preview-panel { display: block; }
    body.preview { min-width: inherit; padding-right: calc(attr(data-width px)); }
    #right-panel.updating { background-color: #fff9c4; }
  `;
  document.head.appendChild(style);

  /* プレビュー更新のメイン処理 */
  const previewUrl = document.querySelector('.tab-preview').getAttribute("data-url");
  const updatePreview = async () => {
    const textarea = document.querySelector('textarea:focus');
    const activePreview = document.querySelector('#right-panel');
    if (!textarea || !activePreview) return;

    const token = document.querySelector('input[name="authenticity_token"]').value;
    const params = new URLSearchParams({ text: textarea.value });

    activePreview.classList.add('updating'); /* 更新開始の視覚フィードバック */
    try {
      const response = await fetch(previewUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'x-csrf-token': token,
        },
        body: params
      });
      const data = await response.text();
      activePreview.innerHTML = data;
      syncScroll({ target: textarea }); /* 更新後に位置を合わせる */
    } finally {
      setTimeout(() => activePreview.classList.remove('updating'), 300);
    }
  };

  /* スクロール同期処理 */
  const syncScroll = (e) => {
    const edit = e.target;
    const preview = document.querySelector('#right-panel');
    if (!preview) return;
    const ratio = edit.scrollTop / (edit.scrollHeight - edit.clientHeight);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  };

  /* 編集モード検知 & 初期化 */
  const init = () => {
    document.querySelectorAll('textarea.wiki-edit').forEach(el => {
      el.addEventListener('focus', (e) => {
      	updatePreview();
      });
      el.addEventListener('scroll', syncScroll);
      el.addEventListener('input', debounce(updatePreview, 800)); /* 少し長めに待つ */
      document.querySelector('#right-panel').classList.add('wiki');
    });
  };

  /* デバウンス関数 */
  function debounce(fn, interval) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), interval);
    };
  }
  
  const createResizableSidePanel = (options = {}) => {
	  const panelColor = options.backgroundColor || '#ddffff';
	  const style = document.createElement('style');
	  style.id = 'resize-css';
	  style.textContent = `
	    #preview-panel {
	      position: fixed; top: 0; right: 0;
	      padding: 10px 10px 10px 15px; box-sizing: border-box;
	    	width: 50%; height: 100vh; min-width: 50px; overflow: hidden; 
	    }
	    #right-panel { width: 100%; height: 100%; overflow: auto; padding: 10px; 
	    	background-color: ${panelColor}; border: 1px solid lightgray; box-sizing: border-box;
	    }
	    #resizer {
	      width: 5px; height: 100vh; cursor: col-resize;
	      position: absolute; top: 0; left: 0;
	      background: #ddd; flex-shrink: 0; z-index: 9999; }
	    #resizer:hover { background: #bbb; }
	  `;
	  document.head.appendChild(style);

	  const previewPanel = document.createElement('div');
	  previewPanel.id = 'preview-panel';
	  const resizer = document.createElement('div');
	  resizer.id = 'resizer';
	  const rightDiv = document.createElement('div');
	  rightDiv.id = 'right-panel';

	  previewPanel.appendChild(resizer);
	  previewPanel.appendChild(rightDiv);
	  document.body.appendChild(previewPanel);
	  document.body.setAttribute('data-width', 'value')

	  let isResizing = false;
	  let startX;      /* クリックした時のマウスX座標 */
	  let startWidth;  /* クリックした時のパネルの幅 */
	
	  resizer.addEventListener('mousedown', (e) => {
	    isResizing = true;
	    startX = e.clientX;
	    startWidth = previewPanel.offsetWidth; /* 現在の幅を記録 */
	
	    document.body.style.cursor = 'col-resize';
	    document.body.style.userSelect = 'none';
	    /* マウスを速く動かしてもイベントが外れないようにガード */
	    window.addEventListener('mousemove', handleMouseMove);
	    window.addEventListener('mouseup', stopResizing);
	  });
	  function handleMouseMove(e) {
	    if (!isResizing) return;
	   
	    /* 「マウスがどれだけ動いたか」を計算 */
	    /* 右に動けば dx はプラス、左に動けばマイナス */
	    const dx = e.clientX - startX;
	   
	    /* 新しい幅 = 元の幅 - 動いた量 (右パネルなので左に動く＝dxマイナス＝幅増える) */
	    const newWidth = startWidth - dx;
	
	    if (newWidth > 50 && newWidth < window.innerWidth - 100) {
	      previewPanel.style.width = `${newWidth}px`;
	      document.body.setAttribute('data-width', `${newWidth}`);
	    }
	  }
	  function stopResizing() {
	    isResizing = false;
	    document.body.style.cursor = 'default';
	    document.body.style.userSelect = 'auto';
	    window.removeEventListener('mousemove', handleMouseMove);
	    window.removeEventListener('mouseup', stopResizing);
	  }
  }
  
  const onEdit = (callback) => {
		const targetNode = document.querySelector('#update');
		const observer = new MutationObserver(callback);
		observer.observe(targetNode, {
		    attributes: true,
		    // attributeOldValue: true,
		    attributeFilter: ['style']
		});  	
  }

	onEdit((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'attributes') {
				document.body.classList.toggle('preview');
				document.body.setAttribute('data-width', document.querySelector('#preview-panel').offsetWidth);
      }
    }
	});
  createResizableSidePanel();
  init();
  console.log("Redmine Live Preview Loaded.");
})();
