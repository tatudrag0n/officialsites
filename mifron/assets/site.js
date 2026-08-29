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

  // 旧表記EMを正式名称MPへ統一する。
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    if(node.nodeValue&&node.nodeValue.includes('EM')){
      node.nodeValue=node.nodeValue.replaceAll('EM','MP');
    }
  });
  const description=document.querySelector('meta[name="description"]');
  if(description&&description.content.includes('EM')){
    description.content=description.content.replaceAll('EM','MP');
  }
});
