/* MCT motion — 調査（imozuru: game-gadget-animation）で確認した定番の実装
   出典: Codrops「Magnetic Buttons」/ NN/g「100–500ms・ease-out」/ MDN prefers-reduced-motion
   - キネティック見出し: h1 を行（1語の英字なら文字）単位に分割してライズ入場
   - 磁力ボタン: translate プロパティ（既存の transform ホバーと合成）でポインタへ追従
   - スポットライト: カード上の --mx / --my を更新（描画は CSS 側）
   - カウントアップ: 統計リボンの数値を可視時に数え上げ
   すべて prefers-reduced-motion: reduce では無効（MDN / A List Apart） */
(() => {
  const CONFIG = {
    magnetic: '.hero .btn, .contact-panel .btn',
    spotlight: '.feature, .system-panel, .project-card, .summary-card, .news-item, .about-card',
    countUp: '.stat-ribbon b, .summary-card b',
    heroTitle: '.hero h1'
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const $ = (s) => Array.from(document.querySelectorAll(s));

  // 1) キネティック見出し
  const title = document.querySelector(CONFIG.heroTitle);
  if (title && !reduce.matches) {
    const html = title.innerHTML;
    const lines = html.split(/<br\s*\/?>/i);
    const plain = title.textContent.trim();
    const charMode = lines.length === 1 && !/<em/i.test(html) &&
      plain.length > 0 && plain.length <= 14 && /^[\x20-\x7E]+$/.test(plain);

    if (charMode) {
      title.innerHTML = '<span class="m-line"><span class="m-line-inner">' +
        plain.split('').map((c) => `<span class="m-char">${c === ' ' ? '&nbsp;' : c}</span>`).join('') +
        '</span></span>';
      title.querySelectorAll('.m-char').forEach((el, i) => {
        el.style.animationDelay = (0.05 + i * 0.045).toFixed(3) + 's';
        el.classList.add('is-in');
      });
    } else if (lines.length > 1) {
      title.innerHTML = lines.map((line) =>
        `<span class="m-line"><span class="m-line-inner">${line}</span></span>`).join('');
      title.querySelectorAll('.m-line-inner').forEach((el, i) => {
        el.style.animationDelay = (0.08 + i * 0.12).toFixed(2) + 's';
        el.classList.add('is-in');
      });
    }
  }

  // 2) 磁力ボタン
  if (!reduce.matches && fine.matches) {
    for (const el of $(CONFIG.magnetic)) {
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      const loop = () => {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        el.style.translate = cx.toFixed(2) + 'px ' + cy.toFixed(2) + 'px';
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
          raf = requestAnimationFrame(loop);
        } else {
          el.style.translate = '0px 0px';
          raf = 0;
        }
      };
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 14;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 10;
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
      el.addEventListener('pointerleave', () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    }
  }

  // 3) スポットライト
  if (!reduce.matches && fine.matches) {
    for (const el of $(CONFIG.spotlight)) {
      el.classList.add('m-spot');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    }
  }

  // 4) カウントアップ
  if (CONFIG.countUp && !reduce.matches) {
    const items = $(CONFIG.countUp).map((el) => {
      const m = /^(\d+)(.*)$/.exec(el.textContent.trim());
      return m ? { el, n: Number(m[1]), suffix: m[2] } : null;
    }).filter(Boolean);
    if (items.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          const item = items.find((it) => it.el === entry.target);
          if (!item) continue;
          const t0 = performance.now();
          const dur = Math.min(1100, 420 + item.n * 14);
          const tick = (t) => {
            const p = Math.min(1, (t - t0) / dur);
            const e = 1 - Math.pow(1 - p, 3);
            item.el.textContent = Math.round(item.n * e) + item.suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }, { threshold: 0.45 });
      for (const it of items) io.observe(it.el);
    }
  }
})();
