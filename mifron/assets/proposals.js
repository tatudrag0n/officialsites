/* Mifron Proposal System
   Proposal list, detail and template-assisted submission.
   Externalised so it works under the site CSP (script-src 'self'). */
(function () {
  'use strict';

  var TYPE_LABELS = { feature: '機能提案', bug: 'バグ報告', quest: 'クエスト提案', other: 'その他' };
  var STATUS_LABELS = { open: '審査中', in_progress: '実装中', completed: '完了', rejected: '却下' };
  var PRIORITY_LABELS = { low: '低', medium: '中', high: '高', critical: '緊急' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function typeLabel(type) { return TYPE_LABELS[type] || type || '提案'; }
  function statusLabel(status) { return STATUS_LABELS[status] || status || '審査中'; }
  function priorityLabel(priority) { return PRIORITY_LABELS[priority] || priority || '中'; }

  function formatDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '不明';
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getDemoProposals() {
    return [
      { id: 'prop_001', title: '新しいFFAキットの追加', description: '新しいFFAキットを追加してほしいです。アーチャー、タンク、サポートなどのバリエーションを増やしてください。', type: 'feature', status: 'open', author: 'Player1', upvotes: 15, priority: 'medium', tags: ['FFA', 'キット'], createdAt: new Date().toISOString() },
      { id: 'prop_002', title: 'ショップUIの改善', description: 'ショップのUIをもっと使いやすくしてほしいです。アイテム検索やカテゴリー分けを追加してください。', type: 'feature', status: 'in_progress', author: 'Player2', upvotes: 23, priority: 'high', tags: ['ショップ', 'UI'], createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'prop_003', title: 'バグ: テレポートが動かない', description: '/tp コマンドを使ったときに「プレイヤーが見つかりません」というエラーが出ます。', type: 'bug', status: 'completed', author: 'Player3', upvotes: 8, priority: 'critical', tags: ['バグ'], createdAt: new Date(Date.now() - 172800000).toISOString() },
      { id: 'prop_004', title: '新しいクエスト: 鉱石コレクター', description: '全ての鉱石を集めるクエストを追加してほしいです。報酬はMPと特殊アイテムを考えています。', type: 'quest', status: 'open', author: 'Player4', upvotes: 12, priority: 'medium', tags: ['クエスト'], createdAt: new Date(Date.now() - 259200000).toISOString() },
      { id: 'prop_005', title: 'Discord連携の強化', description: 'サーバー内イベントをDiscordへ通知し、Discordロールに応じたゲーム内特典を検討してほしいです。', type: 'feature', status: 'rejected', author: 'Player5', upvotes: 5, priority: 'low', tags: ['Discord'], createdAt: new Date(Date.now() - 345600000).toISOString() }
    ];
  }

  async function fetchProposals() {
    try {
      var response = await fetch('/api/proposals', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var data = await response.json();
      if (!Array.isArray(data)) throw new Error('Unexpected payload');
      if (data.length === 0) return getDemoProposals();
      return data;
    } catch (error) {
      return getDemoProposals();
    }
  }

  var PROPOSAL_TEMPLATES = [
    {
      key: 'feature', icon: '✨', label: '機能追加', hint: '新しい機能やシステムの提案',
      data: {
        title: '', type: 'feature', priority: 'medium', tags: '機能',
        description: '【概要】\nどんな機能を追加したいか\n\n【期待する効果】\nそれがあると何が良くなるか\n\n【実装イメージ】\n具体的な動きや操作方法'
      }
    },
    {
      key: 'bug', icon: '🐛', label: 'バグ報告', hint: '不具合の再現手順と状況',
      data: {
        title: 'バグ: ', type: 'bug', priority: 'high', tags: 'バグ',
        description: '【発生している問題】\n\n【再現手順】\n1. \n2. \n3. \n\n【期待する動作】\n\n【発生環境】\nJava版 / Bedrock版、ワールド名など'
      }
    },
    {
      key: 'balance', icon: '⚖️', label: 'バランス調整', hint: 'キット・経済・報酬の調整',
      data: {
        title: '', type: 'feature', priority: 'medium', tags: 'バランス',
        description: '【調整したい対象】\n\n【現状の問題】\n\n【提案する数値・仕様】\n\n【想定される影響】'
      }
    },
    {
      key: 'event', icon: '🎉', label: 'イベント企画', hint: '季節イベントや企画の提案',
      data: {
        title: '', type: 'other', priority: 'medium', tags: 'イベント',
        description: '【イベント名】\n\n【内容・ルール】\n\n【開催時期と期間】\n\n【報酬案】\n\n【必要な準備】'
      }
    },
    {
      key: 'ui', icon: '🖥️', label: 'UI / UX改善', hint: '画面や操作の使いやすさ改善',
      data: {
        title: '', type: 'feature', priority: 'medium', tags: 'UI',
        description: '【使いにくいと感じる点】\n\n【改善案】\n\n【改善後のイメージ】'
      }
    },
    {
      key: 'quest', icon: '📜', label: 'クエスト提案', hint: 'クエスト追加のアイデア',
      data: {
        title: '', type: 'quest', priority: 'medium', tags: 'クエスト',
        description: '【クエスト名】\n\n【内容】\n\n【成功条件】\n\n【報酬案】'
      }
    }
  ];

  /* ---------------- Proposal list ---------------- */
  function initProposalIndex() {
    var grid = document.getElementById('proposalGrid');
    if (!grid) return;
    var filters = document.querySelectorAll('.proposal-filters .filter-btn');
    var all = [];

    function render() {
      var active = document.querySelector('.proposal-filters .filter-btn.active');
      var filter = active ? active.dataset.filter : 'all';
      var list = filter === 'all' ? all : all.filter(function (p) { return p.status === filter; });

      if (!list.length) {
        grid.innerHTML = '<p class="empty-state">該当する提案はありません。</p>';
        return;
      }

      grid.innerHTML = list.map(function (proposal) {
        return '<article class="proposal-card type-' + esc(proposal.type) + ' status-' + esc(proposal.status) + '">' +
          '<div class="proposal-header">' +
            '<span class="proposal-type-badge">' + esc(typeLabel(proposal.type)) + '</span>' +
            '<span class="proposal-status-badge status-' + esc(proposal.status) + '">' + esc(statusLabel(proposal.status)) + '</span>' +
          '</div>' +
          '<h3>' + esc(proposal.title) + '</h3>' +
          '<p class="proposal-description">' + esc(proposal.description) + '</p>' +
          '<div class="proposal-footer">' +
            '<span class="proposal-author">提案者: ' + esc(proposal.author || '匿名') + '</span>' +
            '<span class="proposal-votes">▲ ' + esc(proposal.upvotes || 0) + '</span>' +
            '<span class="proposal-date">' + esc(formatDate(proposal.createdAt)) + '</span>' +
          '</div>' +
          '<a class="proposal-link" href="./detail.html?id=' + encodeURIComponent(proposal.id) + '">詳細を確認</a>' +
        '</article>';
      }).join('');
    }

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        render();
      });
    });

    fetchProposals().then(function (data) { all = data; render(); });
  }

  /* ---------------- Proposal detail ---------------- */
  function initProposalDetail() {
    var container = document.getElementById('proposalDetail');
    if (!container) return;
    var titleEl = document.getElementById('proposalTitle');
    var id = new URLSearchParams(window.location.search).get('id');

    function render(proposal) {
      if (!proposal) {
        container.innerHTML =
          '<div class="empty-state">' +
            '<h2>提案が見つかりません</h2>' +
            '<p>指定された提案は存在しないか、削除されました。</p>' +
            '<a class="btn primary" href="./">提案一覧に戻る</a>' +
          '</div>';
        return;
      }
      if (titleEl) titleEl.textContent = proposal.title;

      var tags = (proposal.tags || []).map(function (tag) {
        return '<span class="tag-chip">' + esc(tag) + '</span>';
      }).join('');

      container.innerHTML =
        '<article class="proposal-detail-card">' +
          '<header class="proposal-detail-header">' +
            '<div class="proposal-badges">' +
              '<span class="proposal-type-badge">' + esc(typeLabel(proposal.type)) + '</span>' +
              '<span class="proposal-status-badge status-' + esc(proposal.status) + '">' + esc(statusLabel(proposal.status)) + '</span>' +
              '<span class="proposal-priority-badge priority-' + esc(proposal.priority || 'medium') + '">優先度: ' + esc(priorityLabel(proposal.priority)) + '</span>' +
            '</div>' +
            '<h2>' + esc(proposal.title) + '</h2>' +
            '<p class="proposal-meta">提案者: ' + esc(proposal.author || '匿名') + ' · ' + esc(formatDate(proposal.createdAt)) + '</p>' +
          '</header>' +
          '<section class="proposal-section"><h3>説明</h3><p class="proposal-body">' + esc(proposal.description).replace(/\n/g, '<br>') + '</p></section>' +
          (tags ? '<section class="proposal-section"><h3>タグ</h3><div class="tag-list">' + tags + '</div></section>' : '') +
          (proposal.notes ? '<section class="proposal-section"><h3>追加情報</h3><p class="proposal-body">' + esc(proposal.notes).replace(/\n/g, '<br>') + '</p></section>' : '') +
          '<section class="proposal-section proposal-vote">' +
            '<h3>支持する</h3>' +
            '<p>この提案を応援したい場合は投票してください。</p>' +
            '<button type="button" class="btn primary" data-vote>▲ 投票する（' + esc(proposal.upvotes || 0) + '）</button>' +
            '<p class="vote-note" data-vote-note hidden>投票機能は現在準備中です。Discordでも意見を募集しています。</p>' +
          '</section>' +
          '<footer class="proposal-detail-footer">' +
            '<a class="btn" href="./">提案一覧に戻る</a>' +
            '<a class="btn" href="../quests/">クエストを見る</a>' +
          '</footer>' +
        '</article>';

      var voteBtn = container.querySelector('[data-vote]');
      var note = container.querySelector('[data-vote-note]');
      if (voteBtn && note) {
        voteBtn.addEventListener('click', function () {
          note.hidden = false;
          voteBtn.disabled = true;
        });
      }
    }

    if (!id) { render(null); return; }
    fetchProposals().then(function (list) {
      render(list.find(function (p) { return p.id === id; }) || null);
    });
  }

  /* ---------------- Proposal create ---------------- */
  function initProposalForm() {
    var form = document.getElementById('proposalForm');
    if (!form) return;
    var templateGrid = document.getElementById('proposalTemplateGrid');
    var message = document.getElementById('formMessage');

    function setField(name, value) {
      var field = form.elements[name];
      if (field) field.value = value == null ? '' : value;
    }

    function applyTemplate(template) {
      setField('title', template.data.title);
      setField('description', template.data.description);
      setField('type', template.data.type);
      setField('priority', template.data.priority);
      setField('tags', template.data.tags);
      if (templateGrid) {
        templateGrid.querySelectorAll('.proposal-template').forEach(function (card) {
          card.classList.toggle('is-active', card.dataset.template === template.key);
        });
      }
      var title = form.elements.title;
      if (title) { title.focus(); title.setSelectionRange(title.value.length, title.value.length); }
    }

    if (templateGrid) {
      PROPOSAL_TEMPLATES.forEach(function (template) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'proposal-template';
        card.dataset.template = template.key;
        card.innerHTML =
          '<span class="proposal-template-icon" aria-hidden="true">' + template.icon + '</span>' +
          '<strong>' + esc(template.label) + '</strong>' +
          '<small>' + esc(template.hint) + '</small>';
        card.addEventListener('click', function () { applyTemplate(template); });
        templateGrid.appendChild(card);
      });
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var data = {
        title: form.elements.title ? form.elements.title.value.trim() : '',
        description: form.elements.description ? form.elements.description.value.trim() : '',
        type: form.elements.type ? form.elements.type.value : 'feature',
        priority: form.elements.priority ? form.elements.priority.value : 'medium',
        author: form.elements.author ? form.elements.author.value.trim() : '',
        notes: form.elements.notes ? form.elements.notes.value.trim() : '',
        tags: form.elements.tags && form.elements.tags.value
          ? form.elements.tags.value.split(',').map(function (tag) { return tag.trim(); }).filter(Boolean)
          : []
      };

      function feedback(text, ok) {
        if (!message) return;
        message.textContent = text;
        message.hidden = false;
        message.classList.toggle('is-error', !ok);
        message.classList.toggle('is-ok', ok);
      }

      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;

      try {
        var response = await fetch('/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        var result = await response.json().catch(function () { return {}; });
        if (response.ok) {
          feedback('提案を受け付けました。審査後に実装が検討されます。', true);
          form.reset();
          if (templateGrid) {
            templateGrid.querySelectorAll('.proposal-template').forEach(function (card) {
              card.classList.remove('is-active');
            });
          }
        } else {
          feedback('提案に失敗しました: ' + (result.error || '不明なエラー'), false);
        }
      } catch (error) {
        feedback('サーバーに接続できませんでした。時間をおいて再試行してください。', false);
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initProposalIndex();
    initProposalDetail();
    initProposalForm();
  });
})();
