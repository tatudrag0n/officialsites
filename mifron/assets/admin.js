/* Mifron 運用レビュー（/admin/）
   クエスト審査の表示のみを担当する。
   - 審査中の提案・実装済みクエストを高評価比率で並べ、比率が高いものを強調する
   - 削除提案は「提案への高評価」と「対象クエストの低評価」の比率で強調する
   外部ライブラリは使わない（CSP: script-src 'self'）。 */
(function () {
  'use strict';

  var HIGHLIGHT_RATIO = 0.7; // 高評価比率がこれ以上なら強調
  var WATCH_RATIO = 0.3;     // これ以下なら要注意
  var MIN_VOTES = 3;         // 強調に必要な最低票数
  var REASON_LIMIT = 140;

  var TYPE_LABELS = {
    daily: 'デイリー', weekly: 'ウィークリー', monthly: 'マンスリー',
    special: 'スペシャル', single: '単発', hidden: '隠し'
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function fetchJson(url, fallback) {
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .catch(function () { return fallback; });
  }

  function tallyOf(counts, id) {
    var tally = counts && id ? counts[id] : null;
    return { up: (tally && tally.up) || 0, down: (tally && tally.down) || 0 };
  }

  // 高評価 ÷（高評価 ＋ 低評価）。票がない場合は0。
  function ratioOf(up, down) {
    var total = up + down;
    return total > 0 ? up / total : 0;
  }

  function percentOf(ratio) { return Math.round(ratio * 100); }

  function flagOf(up, down) {
    if (up + down < MIN_VOTES) return '';
    var ratio = ratioOf(up, down);
    if (ratio >= HIGHLIGHT_RATIO) return 'hot';
    if (ratio <= WATCH_RATIO) return 'watch';
    return '';
  }

  // 強調を最優先、次に比率、最後に票数の多い順。
  function sortByRatio(list) {
    return list.slice().sort(function (a, b) {
      var fa = a.flag ? 1 : 0;
      var fb = b.flag ? 1 : 0;
      if (fa !== fb) return fb - fa;
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      return (b.up + b.down) - (a.up + a.down);
    });
  }

  function truncate(text, limit) {
    var value = String(text || '').replace(/\s+/g, ' ').trim();
    return value.length > limit ? value.slice(0, limit) + '…' : value;
  }

  function normalizeKvQuest(raw) {
    var type = String(raw.type || '').toLowerCase();
    var status = String(raw.status || '').toLowerCase();
    return {
      id: String(raw.id || raw.name || '').slice(0, 60),
      name: String(raw.name || '').slice(0, 120),
      type: TYPE_LABELS[type] ? type : 'special',
      pending: status === '' || status === 'pending'
    };
  }

  function flagLabel(flag, pending) {
    if (flag === 'hot') return pending ? '高評価' : '高評価';
    if (flag === 'watch') return '要注意';
    return '';
  }

  function questCard(entry) {
    var ratio = percentOf(entry.ratio);
    return '<article class="review-card' + (entry.flag ? ' is-' + entry.flag : '') + '" data-ratio="' + ratio + '">' +
      '<div class="review-card-head">' +
        '<span class="badge type-' + esc(entry.type) + '">' + esc(TYPE_LABELS[entry.type] || entry.type) + '</span>' +
        '<span class="review-state">' + (entry.pending ? '審査中' : '実装済み') + '</span>' +
        (entry.flag ? '<span class="review-flag">' + flagLabel(entry.flag, entry.pending) + '</span>' : '') +
      '</div>' +
      '<h3>' + esc(entry.name) + '</h3>' +
      '<p class="review-id">ID: ' + esc(entry.id) + '</p>' +
      '<dl class="review-stats">' +
        '<div><dt>高評価</dt><dd>' + entry.up + '</dd></div>' +
        '<div><dt>低評価</dt><dd>' + entry.down + '</dd></div>' +
        '<div><dt>高評価比率</dt><dd>' + ratio + '%</dd></div>' +
      '</dl>' +
      '<div class="review-bar"><span></span></div>' +
      '<p class="review-actions">' +
        '<a class="btn" href="../quests/detail.html?id=' + encodeURIComponent(entry.id) + '">クエストを見る</a>' +
      '</p>' +
    '</article>';
  }

  function deletionCard(entry) {
    var ratio = percentOf(entry.ratio);
    return '<article class="review-card review-deletion' + (entry.flag ? ' is-' + entry.flag : '') + '" data-ratio="' + ratio + '">' +
      '<div class="review-card-head">' +
        '<span class="badge type-deletion">削除提案</span>' +
        '<span class="review-state">審査中</span>' +
        (entry.flag ? '<span class="review-flag">' + (entry.flag === 'hot' ? '優先' : '様子見') + '</span>' : '') +
      '</div>' +
      '<h3>' + esc(entry.title) + '</h3>' +
      '<p class="review-id">対象: ' + esc(entry.targetName || entry.targetId || '不明') + '</p>' +
      '<dl class="review-stats">' +
        '<div><dt>提案への高評価</dt><dd>' + entry.up + '</dd></div>' +
        '<div><dt>対象の低評価</dt><dd>' + entry.targetDown + '</dd></div>' +
        '<div><dt>優先比率</dt><dd>' + ratio + '%</dd></div>' +
      '</dl>' +
      '<div class="review-bar"><span></span></div>' +
      (entry.reason ? '<p class="review-reason">' + esc(truncate(entry.reason, REASON_LIMIT)) + '</p>' : '') +
      '<p class="review-actions">' +
        (entry.targetId
          ? '<a class="btn" href="../quests/detail.html?id=' + encodeURIComponent(entry.targetId) + '">対象クエスト</a>'
          : '') +
        '<a class="btn primary" href="../proposals/detail.html?id=' + encodeURIComponent(entry.id) + '">提案の詳細</a>' +
      '</p>' +
    '</article>';
  }

  // 比率バーの幅はCSSOMで設定する（CSP: style-src 'self' でも動作する）。
  function paintBars(container) {
    container.querySelectorAll('.review-card').forEach(function (card) {
      var bar = card.querySelector('.review-bar span');
      if (!bar) return;
      var value = Number(card.dataset.ratio || '0');
      bar.style.width = Math.max(2, Math.min(100, value)) + '%';
    });
  }

  function statChip(kind, value, label) {
    return '<span class="review-stat' + (kind ? ' is-' + kind : '') + '">' +
      '<b>' + value + '</b><small>' + esc(label) + '</small></span>';
  }

  function renderInto(container, html, emptyText) {
    if (!container) return;
    container.innerHTML = html || '<p class="review-empty">' + esc(emptyText) + '</p>';
    paintBars(container);
  }

  function init() {
    var deletionList = document.getElementById('deletionList');
    var pendingList = document.getElementById('pendingList');
    var implementedList = document.getElementById('implementedList');
    if (!deletionList && !pendingList && !implementedList) return;

    var summary = document.getElementById('reviewSummary');

    Promise.all([
      fetchJson('/api/quests', []),
      fetchJson('/api/quests/votes', { counts: {} }),
      fetchJson('/api/proposals', []),
      fetchJson('/api/proposals/votes', { counts: {} })
    ]).then(function (results) {
      var kvQuests = Array.isArray(results[0]) ? results[0] : [];
      var questVotes = (results[1] && results[1].counts) || {};
      var proposals = Array.isArray(results[2]) ? results[2] : [];
      var proposalVotes = (results[3] && results[3].counts) || {};

      var mapped = kvQuests
        .filter(function (q) { return q && (q.id || q.name); })
        .map(normalizeKvQuest);
      var pendingQuests = mapped.filter(function (q) { return q.pending; });
      var approvedQuests = mapped.filter(function (q) { return !q.pending; });

      var builtIn = (window.MIFRON_QUESTS || []).map(function (q) {
        return { id: String(q.id), name: String(q.name), type: q.type, pending: false };
      });

      // 内蔵クエストとKVの承認済みクエストをIDで重複なくまとめる。
      var seen = {};
      var implementedQuests = [];
      builtIn.concat(approvedQuests).forEach(function (quest) {
        if (!quest.id || seen[quest.id]) return;
        seen[quest.id] = true;
        implementedQuests.push(quest);
      });

      function withVotes(entry) {
        var tally = tallyOf(questVotes, entry.id);
        return {
          id: entry.id,
          name: entry.name,
          type: entry.type,
          pending: entry.pending,
          up: tally.up,
          down: tally.down,
          ratio: ratioOf(tally.up, tally.down),
          flag: flagOf(tally.up, tally.down)
        };
      }

      var pendingRows = sortByRatio(pendingQuests.map(withVotes));
      var implementedRows = sortByRatio(implementedQuests.map(withVotes))
        .filter(function (row) { return row.up + row.down > 0; });

      var deletionRows = sortByRatio(
        proposals
          .filter(function (p) { return p && p.type === 'deletion'; })
          .map(function (p) {
            var proposalUp = tallyOf(proposalVotes, p.id).up || (Number(p.upvotes) || 0);
            var targetDown = tallyOf(questVotes, p.targetId).down;
            return {
              id: String(p.id || ''),
              title: String(p.title || '削除提案'),
              targetId: String(p.targetId || ''),
              targetName: String(p.targetName || ''),
              reason: String(p.description || ''),
              up: proposalUp,
              targetDown: targetDown,
              ratio: ratioOf(proposalUp, targetDown),
              flag: flagOf(proposalUp, targetDown)
            };
          })
      );

      renderInto(deletionList, deletionRows.map(deletionCard).join(''), '削除提案はまだありません。');
      renderInto(pendingList, pendingRows.map(questCard).join(''), '審査中のクエスト提案はありません。');
      renderInto(implementedList, implementedRows.map(questCard).join(''), 'まだ評価が集まっていません。');

      if (summary) {
        var hot = deletionRows.concat(pendingRows, implementedRows).filter(function (row) {
          return row.flag === 'hot';
        }).length;
        var watch = implementedRows.filter(function (row) { return row.flag === 'watch'; }).length;
        summary.innerHTML = [
          statChip('hot', hot, '強調表示'),
          statChip('watch', watch, '要注意'),
          statChip('', pendingRows.length, '審査中の提案'),
          statChip('', deletionRows.length, '削除提案')
        ].join('');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* 提案の承認・強制承認（管理者トークン認証）
   - トークンは sessionStorage に保持し、URL や DOM には残さない
   - 一覧は GET /api/admin/proposals、判断は POST /api/admin/proposals/<id>/decision
   外部ライブラリは使わない（CSP: script-src 'self'）。 */
(function () {
  'use strict';

  var STORAGE_KEY = 'mifron-admin-token';
  var listEl = document.getElementById('proposalList');
  if (!listEl) return;

  var tokenInput = document.getElementById('adminToken');
  var connectBtn = document.getElementById('adminConnect');
  var disconnectBtn = document.getElementById('adminDisconnect');
  var statusEl = document.getElementById('adminStatus');
  var auditEl = document.getElementById('auditList');
  var thresholds = { minUp: 5, minRatio: 0.6 };
  var proposals = [];

  var STATUS_LABELS = { open: '審査中', approved: '承認済み', rejected: '却下' };
  var ACTION_LABELS = { approve: '承認', forceapprove: '強制承認', reject: '却下', reopen: '差し戻し' };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setStatus(text, isError) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.classList.toggle('is-error', !!isError);
  }

  function currentToken() {
    return (sessionStorage.getItem(STORAGE_KEY) || '').trim();
  }

  function headers() {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + currentToken()
    };
  }

  function ratioText(item) {
    var total = (Number(item.upvotes) || 0) + (Number(item.downvotes) || 0);
    if (!total) return '0%';
    return Math.round(((Number(item.upvotes) || 0) / total) * 100) + '%';
  }

  function render() {
    if (!proposals.length) {
      listEl.innerHTML = '<p class="review-loading">提案はまだありません。</p>';
      return;
    }
    listEl.innerHTML = proposals
      .map(function (item) {
        var up = Number(item.upvotes) || 0;
        var down = Number(item.downvotes) || 0;
        var total = up + down;
        var reachable = up >= thresholds.minUp && (total ? up / total : 0) >= thresholds.minRatio;
        var status = item.status || 'open';
        return (
          '<article class="proposal-admin-card" data-id="' + esc(item.id) + '">' +
            '<div class="proposal-admin-meta">' +
              '<span class="proposal-admin-badge is-' + esc(status) + '">' + esc(STATUS_LABELS[status] || status) + '</span>' +
              '<span>賛成 ' + up + ' / 反対 ' + down + '（' + ratioText(item) + '）</span>' +
              '<span>承認条件 ' + (reachable ? '充足' : '未達') + '</span>' +
              '<span>' + esc(item.type || 'feature') + ' / ' + esc(item.priority || 'medium') + '</span>' +
            '</div>' +
            '<h3>' + esc(item.title) + '</h3>' +
            '<p class="proposal-admin-meta">' + esc((item.description || '').slice(0, 240)) + '</p>' +
            '<p class="proposal-admin-meta"><a href="../proposals/detail.html?id=' + encodeURIComponent(item.id) + '">提案ページを開く</a></p>' +
            '<div class="proposal-admin-actions">' +
              '<input class="proposal-note" data-note placeholder="理由（任意）" maxlength="500">' +
              '<input data-actor placeholder="判断者（任意）" maxlength="64" value="管理者">' +
              '<button type="button" class="btn primary" data-action="approve">承認</button>' +
              '<button type="button" class="btn" data-action="forceapprove">強制承認</button>' +
              '<button type="button" class="btn" data-action="reject">却下</button>' +
              '<button type="button" class="btn" data-action="reopen">差し戻し</button>' +
            '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderAudit(audit) {
    if (!auditEl) return;
    if (!audit || !audit.length) {
      auditEl.innerHTML = '<li class="review-loading">まだ判断の記録はありません。</li>';
      return;
    }
    auditEl.innerHTML = audit
      .map(function (entry) {
        return (
          '<li><strong>' + esc(ACTION_LABELS[entry.action] || entry.action) + '</strong> ' +
            esc(entry.title || entry.id) +
            '（賛成 ' + (entry.up || 0) + ' / 反対 ' + (entry.down || 0) + '）' +
            ' / ' + esc(entry.actor || '管理者') +
            (entry.note ? ' — ' + esc(entry.note) : '') +
            '<time>' + esc(entry.at || '') + '</time></li>'
        );
      })
      .join('');
  }

  function load() {
    if (!currentToken()) {
      setStatus('トークンを入力してください。', true);
      return;
    }
    setStatus('読み込み中…', false);
    fetch('/api/admin/proposals', { headers: headers() })
      .then(function (response) {
        if (response.status === 401) throw new Error('トークンが違います。');
        if (response.status === 503) throw new Error('管理者機能が未有効です（ADMIN_TOKEN が未設定）。');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        proposals = Array.isArray(data.proposals) ? data.proposals : [];
        if (data.thresholds) thresholds = data.thresholds;
        render();
        renderAudit(data.audit);
        setStatus(proposals.length + '件の提案を読み込みました。', false);
        if (disconnectBtn) disconnectBtn.hidden = false;
      })
      .catch(function (error) {
        setStatus(error.message || '読み込みに失敗しました。', true);
      });
  }

  function decide(card, action) {
    var id = card.getAttribute('data-id');
    var noteField = card.querySelector('[data-note]');
    var actorField = card.querySelector('[data-actor]');
    var buttons = card.querySelectorAll('[data-action]');
    Array.prototype.forEach.call(buttons, function (button) { button.disabled = true; });
    setStatus('送信中…', false);
    fetch('/api/admin/proposals/' + encodeURIComponent(id) + '/decision', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        action: action,
        note: noteField ? noteField.value : '',
        actor: actorField ? actorField.value : '管理者'
      })
    })
      .then(function (response) {
        return response.json().then(function (body) { return { status: response.status, body: body }; });
      })
      .then(function (result) {
        var body = result.body || {};
        if (result.status === 409) {
          var required = body.required || thresholds;
          setStatus(
            '承認条件を満たしていません（賛成 ' + (body.up || 0) + ' / 必要 ' + (required.minUp || 5) +
              '、賛成率 ' + Math.round((body.ratio || 0) * 100) + '%）。強制承認を使えます。',
            true
          );
        } else if (result.status >= 400) {
          setStatus(body.error || 'HTTP ' + result.status, true);
        } else {
          setStatus((ACTION_LABELS[action] || action) + 'しました。', false);
          if (body.audit) renderAudit(body.audit);
        }
        return load();
      })
      .catch(function () { setStatus('送信に失敗しました。', true); })
      .then(function () {
        Array.prototype.forEach.call(buttons, function (button) { button.disabled = false; });
      });
  }

  if (connectBtn) {
    connectBtn.addEventListener('click', function () {
      var value = tokenInput ? tokenInput.value.trim() : '';
      if (!value) { setStatus('トークンを入力してください。', true); return; }
      sessionStorage.setItem(STORAGE_KEY, value);
      if (tokenInput) tokenInput.value = '';
      load();
    });
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', function () {
      sessionStorage.removeItem(STORAGE_KEY);
      proposals = [];
      listEl.innerHTML = '<p class="review-loading">トークンを入力して接続してください。</p>';
      if (auditEl) auditEl.innerHTML = '';
      disconnectBtn.hidden = true;
      setStatus('切断しました。', false);
    });
  }

  listEl.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var button = target.closest('[data-action]');
    if (!button) return;
    var card = button.closest('.proposal-admin-card');
    if (!card) return;
    decide(card, button.getAttribute('data-action'));
  });

  if (tokenInput) {
    tokenInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (connectBtn) connectBtn.click();
      }
    });
  }

  if (currentToken()) load();
})();

