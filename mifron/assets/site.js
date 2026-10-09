document.addEventListener('DOMContentLoaded',()=>{
  const menu=document.querySelector('.menu');
  const nav=document.querySelector('.nav-links');
  if(menu&&nav){
    menu.addEventListener('click',()=>{
      const open=nav.classList.toggle('open');
      menu.setAttribute('aria-expanded',String(open));
    });
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded','false');
    }));
  }


  const links=window.SITE_LINKS||{};
  document.querySelectorAll('[data-discord]').forEach(a=>{
    const key=a.dataset.discord==='crewmate'?'crewmateDiscord':'mifronDiscord';
    const discordUrl=links[key]||'#';
    a.href=discordUrl;
    a.target='_blank';
    a.rel='noopener noreferrer';
    if(discordUrl==='#'){
      a.addEventListener('click',e=>{
        e.preventDefault();
        alert('Discord招待URLは assets/config.js に設定してください。');
      });
    }
  });

  const supportUrl=links.mifronSupportPage;
  document.querySelectorAll('[data-support-link]').forEach(a=>{
    if(typeof supportUrl==='string' && /^https:\/\//i.test(supportUrl)){
      a.href=supportUrl;
      a.target='_blank';
      a.rel='noopener noreferrer';
      a.hidden=false;
    }else{
      a.hidden=true;
    }
  });
  document.querySelectorAll('[data-support-pending]').forEach(node=>{
    node.hidden=typeof supportUrl==='string' && /^https:\/\//i.test(supportUrl);
  });

  const joinValues={
    java: links.mifronJavaAddress,
    bedrock: links.mifronBedrockAddress,
    port: links.mifronBedrockPort
  };
  document.querySelectorAll('[data-join-value]').forEach(node=>{
    const value=joinValues[node.dataset.joinValue];
    if(value) node.textContent=value;
  });
  document.querySelectorAll('[data-copy-join]').forEach(button=>{
    button.addEventListener('click',async()=>{
      const value=joinValues[button.dataset.copyJoin];
      if(!value || !navigator.clipboard) return;
      try{
        await navigator.clipboard.writeText(value);
        const original=button.textContent;
        button.textContent='コピーしました';
        window.setTimeout(()=>{button.textContent=original;},1600);
      }catch(_error){
        button.textContent='手動でコピーしてください';
      }
    });
  });

});

// UX改善: ヘッダーのスクロール影、セクション追従、背景動画の賢い再生制御
document.addEventListener('DOMContentLoaded', () => {
  // ヘッダー: スクロール位置で影を切り替える
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ナビゲーション: 表示中セクションのリンクをハイライト
  const navLinks = Array.from(
    document.querySelectorAll('.nav-links a[href^="#"], .project-toc a[href^="#"]')
  );
  const linksBySection = new Map();
  navLinks.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const section = id ? document.getElementById(id) : null;
    if (!section) return;
    if (!linksBySection.has(section)) linksBySection.set(section, []);
    linksBySection.get(section).push(link);
  });
  if (linksBySection.size && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove('is-active'));
        (linksBySection.get(entry.target) || []).forEach((link) => link.classList.add('is-active'));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    linksBySection.forEach((_links, section) => observer.observe(section));
  }

  // 背景動画: 画面外では一時停止し、省モーション設定・データ節約モードでは再生しない
  const videos = document.querySelectorAll('video[data-smart-video]');
  if (!videos.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(
    connection && (connection.saveData || /^(2g|3g)$/.test(connection.effectiveType || ''))
  );
  const canPlay = () => !reduceMotion.matches && !saveData;
  videos.forEach((video) => {
    if (!canPlay()) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      }, { rootMargin: '80px' });
      observer.observe(video);
    }
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener('change', (event) => {
        if (event.matches) video.pause();
        else video.play().catch(() => {});
      });
    }
  });
});
