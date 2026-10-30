(function () {
  var TYPE_TAGS = {
    deploy: 'アップデート反映', build: 'ビルド', backup: 'バックアップ',
    geyser: 'Geyser', pipeline: 'インフラ', other: 'その他'
  };
  function esc(value) {
    return String(value || '').replace(/[&<>]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch];
    });
  }
  fetch('updates.json', { cache: 'no-store' })
    .then(function (response) { return response.json(); })
    .then(function (events) {
      var target = document.getElementById('events');
      if (!Array.isArray(events) || events.length === 0) {
        target.innerHTML = '<p class="empty">更新はまだありません。</p>';
        return;
      }
      events.forEach(function (event) {
        if (!event || !event.title) return;
        var box = document.createElement('article');
        box.className = 'event';
        var rawDate = (event.date || '').slice(0, 10);
        var tag = esc(TYPE_TAGS[event.type] || 'その他');
        var lines = '';
        (event.body || []).forEach(function (line) {
          if (!line) return;
          lines += '<li>' + esc(line) + '</li>';
        });
        box.innerHTML =
          '<div class="meta"><span class="tag">' + tag + '</span><span>' + esc(rawDate) + '</span>' +
          (event.version ? '<span>version ' + esc(event.version) + '</span>' : '') +
          (event.commit ? '<span>commit ' + esc(event.commit) + '</span>' : '') + '</div>' +
          '<h2>' + esc(event.title) + '</h2>' +
          (lines ? '<ul>' + lines + '</ul>' : '');
        target.appendChild(box);
      });
    })
    .catch(function () {
      var target = document.getElementById('events');
      if (target) target.innerHTML = '<p class="empty">フィードの取得に失敗しました。</p>';
    });
})();
