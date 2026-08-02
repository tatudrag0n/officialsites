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

  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting) entry.target.classList.add('visible');
  }),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  const links=window.SITE_LINKS||{};
  const fallback=links.mifronDiscord||'#';
  document.querySelectorAll('[data-discord]').forEach(a=>{
    const target=a.dataset.discord;
    const discordUrl=target==='crewmate'
      ? (links.crewmateDiscord||'#')
      : (links.mifronDiscord||fallback);

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
});
