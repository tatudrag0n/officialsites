document.addEventListener('DOMContentLoaded', () => {
  // モバイルメニュー
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.nav-links');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
    }));
  }

  // 外部リンク設定（assets/config.js）
  const links = window.SITE_LINKS || {};
  document.querySelectorAll('[data-discord]').forEach((a) => {
    const key = a.dataset.discord === 'crewmate' ? 'crewmateDiscord' : 'mifronDiscord';
    const discordUrl = links[key] || '#';
    if (discordUrl === '#') {
      a.removeAttribute('href');
      a.setAttribute('role', 'link');
      a.setAttribute('aria-disabled', 'true');
      a.classList.add('is-disabled');
      a.title = 'Discord招待URLは準備中です';
    } else {
      a.href = discordUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });

  // 支援リンク（有効化されたら表示）
  const supportUrl = links.mifronSupportPage;
  document.querySelectorAll('[data-support-link]').forEach((a) => {
    if (typeof supportUrl === 'string' && /^https:\/\//i.test(supportUrl)) {
      a.href = supportUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.hidden = false;
    } else {
      a.hidden = true;
    }
  });
  document.querySelectorAll('[data-support-pending]').forEach((node) => {
    node.hidden = typeof supportUrl === 'string' && /^https:\/\//i.test(supportUrl);
  });

  // 接続情報の上書き
  const joinValues = {
    java: links.mifronJavaAddress,
    port: links.mifronBedrockPort
  };
  document.querySelectorAll('[data-join-value]').forEach((node) => {
    const value = joinValues[node.dataset.joinValue];
    if (value) node.textContent = value;
  });

  // アドレスコピー
  document.querySelectorAll('[data-copy-join]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = joinValues[button.dataset.copyJoin] || 'play.mct-official.com';
      let ok = false;
      if (navigator.clipboard) {
        try { await navigator.clipboard.writeText(value); ok = true; } catch (_) { /* fallthrough */ }
      }
      const original = button.textContent;
      button.textContent = ok ? 'コピーしました' : 'コピーできません';
      window.setTimeout(() => { button.textContent = original; }, 1600);
    });
  });
});
