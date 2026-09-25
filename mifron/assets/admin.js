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
