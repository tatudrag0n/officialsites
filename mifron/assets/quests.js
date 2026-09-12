/* Mifron Quest System
   Minecraft advancement-style progress UI + quest proposal templates.
   Externalised so it works under the site CSP (script-src 'self'). */
(function () {
  'use strict';

  var TYPE_LABELS = { daily: 'デイリー', weekly: 'ウィークリー', single: '単発', hidden: '隠し' };
  var DIFFICULTY_LABELS = {
    easy: '★☆☆☆☆',
    normal: '★★☆☆☆',
    hard: '★★★☆☆',
    very_hard: '★★★★☆',
    extreme: '★★★★★'
  };
  var DIFFICULTY_NAMES = {
    easy: '易しい',
    normal: '普通',
    hard: '難しい',
    very_hard: '非常に難しい',
    extreme: '極難'
  };
  var STATE_LABELS = { completed: '達成済み', available: '挑戦可能', locked: '未解放' };
  var CONDITION_LABELS = {
    item_obtain: 'アイテム入手',
    mob_kill: 'モブ退治',
    block_break: 'ブロック破壊',
    move: '移動',
    mp_gain: 'MP獲得',
    advancement: '進捗達成',
    login: '累計ログイン'
  };
  var REWARD_LABELS = { mp: 'MP', item: 'アイテム', title: '称号', exp: '経験値' };
  var TYPE_TAB_ICONS = { daily: '🌅', weekly: '📅', single: '⭐', hidden: '👁️' };

  var KEYWORD_ICONS = [
    [/採掘|掘|鉱石|ダイヤ|鉄|石/, '⛏️'],
    [/建築|建て|設置|家/, '🧱'],
    [/討伐|倒|モブ|キル|戦/, '⚔️'],
    [/取引|ショップ|売買|購入|売却|オークション/, '💰'],
    [/探索|座標|バイオーム|発見|冒険/, '🧭'],
    [/農業|収穫|作物|畑|植/, '🌾'],
    [/釣り|魚/, '🎣'],
    [/アスレ|走|ジャンプ|移動/, '🏃'],
    [/ミニゲーム|ゲーム|対戦|FFA/, '🎮'],
    [/ログイン|参加|認証/, '🚪'],
    [/称号|実績/, '🏅'],
    [/クラフト|作成|作成する/, '🛠️'],
    [/回復|ポーション|食料/, '🍖']
  ];

  var NODE = 72;
  var COL_STEP = 104;
  var ROW_STEP = 128;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function iconFor(quest) {
    if (quest.icon) return quest.icon;
    var text = [quest.name, quest.description, quest.condition].join(' ');
    for (var i = 0; i < KEYWORD_ICONS.length; i += 1) {
      if (KEYWORD_ICONS[i][0].test(text)) return KEYWORD_ICONS[i][1];
    }
    return TYPE_TAB_ICONS[quest.type] || '❔';
  }

  function normalize(quest) {
    var clone = Object.assign({}, quest);
    clone.dependencies = Array.isArray(quest.dependencies) ? quest.dependencies.slice() : [];
    clone.icon = quest.icon || iconFor(quest);
    clone.state = quest.state || 'available';
    return clone;
  }

  function typeLabel(type) {
    return TYPE_LABELS[type] || type || 'クエスト';
  }

  function difficultyLabel(difficulty) {
    return DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS.normal;
  }

  function difficultyName(difficulty) {
    return DIFFICULTY_NAMES[difficulty] || difficulty || '普通';
  }

  function stateLabel(state) {
    return STATE_LABELS[state] || '挑戦可能';
  }

  function formatDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '不明';
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function demoQuests() {
    return [
      // ---- Daily tree ----
      { id: 'daily_login', name: '今日のログイン', description: 'Mifronへログインして、今日の活動を始めよう。', condition: 'サーバーにログインする', reward: 'MP: 50', type: 'daily', difficulty: 'easy', dependencies: [], state: 'completed', icon: '🚪' },
      { id: 'daily_mine', name: '石を128個採掘', description: '採掘の基本。石を128個集めて資源を確保しよう。', condition: '石を128個採掘する', reward: 'MP: 120', type: 'daily', difficulty: 'normal', dependencies: ['daily_login'], state: 'completed', icon: '⛏️' },
      { id: 'daily_mob', name: 'モブを15体討伐', description: '夜になる前に周囲のモブを討伐して安全を確保する。', condition: 'モブを15体倒す', reward: 'MP: 120', type: 'daily', difficulty: 'normal', dependencies: ['daily_login'], state: 'available', icon: '⚔️' },
      { id: 'daily_trade', name: 'ショップで取引', description: '棚ショップで1回売買して経済を回そう。', condition: 'ショップで1回売買する', reward: 'MP: 80', type: 'daily', difficulty: 'easy', dependencies: ['daily_login'], state: 'available', icon: '💰' },
      { id: 'daily_build', name: 'ブロックを64個設置', description: '建築の第一歩。ブロックを64個設置しよう。', condition: 'ブロックを64個設置する', reward: 'MP: 100', type: 'daily', difficulty: 'easy', dependencies: ['daily_login'], state: 'locked', icon: '🧱' },
      { id: 'daily_fish', name: '魚を10匹釣る', description: 'のんびり釣りをして食料とMPを確保。', condition: '魚を10匹釣る', reward: 'MP: 90', type: 'daily', difficulty: 'easy', dependencies: ['daily_trade'], state: 'locked', icon: '🎣' },

      // ---- Weekly tree ----
      { id: 'weekly_start', name: '週間チャレンジ開始', description: '今週の目標を立てて挑戦を始めよう。', condition: 'デイリークエストを3件クリア', reward: 'MP: 300', type: 'weekly', difficulty: 'normal', dependencies: [], state: 'completed', icon: '📅' },
      { id: 'weekly_mine', name: '鉱石を512個採掘', description: '一週間かけて大量の鉱石を掘り進める。', condition: '鉱石を512個採掘する', reward: 'MP: 800', type: 'weekly', difficulty: 'hard', dependencies: ['weekly_start'], state: 'available', icon: '💎' },
      { id: 'weekly_build', name: '10x10の建築', description: '10x10以上の拠点を建てて完成させる。', condition: '10x10以上の建築を完成させる', reward: 'MP: 700', type: 'weekly', difficulty: 'hard', dependencies: ['weekly_start'], state: 'locked', icon: '🏗️' },
      { id: 'weekly_ffa', name: 'FFAで10キル', description: 'FFAアリーナで10回勝利を重ねる。', condition: 'FFAで10キルする', reward: 'MP: 650', type: 'weekly', difficulty: 'hard', dependencies: ['weekly_start'], state: 'locked', icon: '🎮' },
      { id: 'weekly_master', name: 'ウィークリーマスター', description: '今週の主要目標をすべて達成する。', condition: '採掘・建築・FFAの週間目標を達成', reward: '称号: 週間の覇者 / MP: 1500', type: 'weekly', difficulty: 'very_hard', dependencies: ['weekly_mine', 'weekly_build', 'weekly_ffa'], state: 'locked', icon: '👑' },

      // ---- Single tree ----
      { id: 'single_welcome', name: '初心者の挑戦', description: 'はじめてMifronへ参加しよう。', condition: 'サーバーに初めてログインする', reward: 'MP: 100', type: 'single', difficulty: 'easy', dependencies: [], state: 'completed', icon: '🌱' },
      { id: 'single_home', name: 'はじめての拠点', description: '自分だけの拠点を建築ワールドに建てる。', condition: '拠点となる建築を1つ完成させる', reward: 'MP: 250', type: 'single', difficulty: 'normal', dependencies: ['single_welcome'], state: 'available', icon: '🏠' },
      { id: 'single_shop', name: '初めての取引', description: 'ショップで初めてアイテムを購入する。', condition: 'ショップでアイテムを購入する', reward: 'MP: 150', type: 'single', difficulty: 'easy', dependencies: ['single_welcome'], state: 'available', icon: '🛒' },

      // ---- Hidden tree ----
      { id: 'hidden_secret', name: '秘密の場所', description: '誰も知らない場所へたどり着く。', condition: '特定の座標に到達する', reward: 'MP: 500', type: 'hidden', difficulty: 'hard', dependencies: [], state: 'available', icon: '🗺️' },
      { id: 'hidden_adventurer', name: '真の冒険者', description: '隠された試練をすべて乗り越える。', condition: '隠しクエストを3件クリア', reward: '称号: 真の冒険者', type: 'hidden', difficulty: 'very_hard', dependencies: ['hidden_secret'], state: 'locked', icon: '🏅' }
    ];
  }

  var QUEST_TEMPLATES = [
    {
      key: 'mining', icon: '⛏️', label: '採掘',
      hint: '決まった数のブロックを掘る定番クエスト',
      data: {
        name: 'デイリー：採掘チャレンジ',
        description: '石や鉱石を決められた数だけ採掘するデイリークエストです。毎日の資源集めを習慣にできます。',
        type: 'daily', difficulty: 'normal',
        condition: '石を128個採掘する', conditionTypes: ['block_break'],
        reward: 'MP: 120', rewardTypes: ['mp']
      }
    },
    {
      key: 'combat', icon: '⚔️', label: '討伐',
      hint: 'モブや敵を倒す戦闘系クエスト',
      data: {
        name: 'デイリー：モブ討伐',
        description: '夜になる前に周囲のモブを討伐して、ワールドの安全を守ります。',
        type: 'daily', difficulty: 'normal',
        condition: 'モブを15体倒す', conditionTypes: ['mob_kill'],
        reward: 'MP: 120', rewardTypes: ['mp']
      }
    },
    {
      key: 'build', icon: '🧱', label: '建築',
      hint: '拠点や構造物を建てるクリエイティブ系',
      data: {
        name: 'ウィークリー：建築家',
        description: '10x10以上の拠点を建築ワールドに建てて完成させます。クリエイティビティを発揮しましょう。',
        type: 'weekly', difficulty: 'hard',
        condition: '10x10以上の建築を完成させる', conditionTypes: ['block_break'],
        reward: 'MP: 700', rewardTypes: ['mp', 'item']
      }
    },
    {
      key: 'trade', icon: '💰', label: '取引',
      hint: 'ショップやオークションで経済を動かす',
      data: {
        name: 'デイリー：マーケット活動',
        description: 'ショップで売買を行い、Mifronの経済を活性化させます。',
        type: 'daily', difficulty: 'easy',
        condition: 'ショップで3回売買する', conditionTypes: ['mp_gain'],
        reward: 'MP: 100', rewardTypes: ['mp']
      }
    },
    {
      key: 'explore', icon: '🧭', label: '探索',
      hint: 'バイオームや座標を目指して冒険する',
      data: {
        name: 'スペシャル：未知への旅',
        description: '遠くのバイオームや指定座標を目指して探索し、新しい発見を集めます。',
        type: 'single', difficulty: 'normal',
        condition: '特定のバイオームを3種類発見する', conditionTypes: ['move', 'advancement'],
        reward: 'MP: 300', rewardTypes: ['mp']
      }
    },
    {
      key: 'fishing', icon: '🎣', label: '釣り',
      hint: '釣りでアイテムや食料を集める',
      data: {
        name: 'デイリー：釣り名人',
        description: '釣りをして魚やレアアイテムを集める、のんびり系クエストです。',
        type: 'daily', difficulty: 'easy',
        condition: '魚を10匹釣る', conditionTypes: ['item_obtain'],
        reward: 'MP: 90', rewardTypes: ['mp', 'item']
      }
    },
    {
      key: 'title', icon: '🏅', label: '称号チャレンジ',
      hint: '条件を満たして特別な称号を獲得する',
      data: {
        name: 'チャレンジ：〇〇の達人',
        description: '難しい条件を達成して、特別な称号を手に入れるチャレンジクエストです。',
        type: 'hidden', difficulty: 'very_hard',
        condition: '特定の条件を達成する', conditionTypes: ['advancement'],
        reward: '称号: 新しい称号', rewardTypes: ['title'],
        proposedTitle: '新しい称号'
      }
    }
  ];

  function getDemoQuests() {
    return demoQuests().map(normalize);
  }

  async function fetchQuests() {
    try {
      var response = await fetch('/api/quests', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var data = await response.json();
      if (!Array.isArray(data)) throw new Error('Unexpected payload');
      if (data.length === 0) return getDemoQuests();
      return data.map(normalize);
    } catch (error) {
      return getDemoQuests();
    }
  }

  /* ---------------------------------------------------------------
     Advancement tree layout
  --------------------------------------------------------------- */
  function computeLayout(list) {
    var byId = new Map();
    var children = new Map();
    var parents = new Map();
    var indeg = new Map();

    list.forEach(function (quest) {
      byId.set(quest.id, quest);
      children.set(quest.id, []);
      parents.set(quest.id, []);
      indeg.set(quest.id, 0);
    });

    list.forEach(function (quest) {
      (quest.dependencies || []).forEach(function (dep) {
        if (!byId.has(dep) || dep === quest.id) return;
        children.get(dep).push(quest.id);
        parents.get(quest.id).push(dep);
        indeg.set(quest.id, indeg.get(quest.id) + 1);
      });
    });

    var level = new Map();
    var queue = [];
    list.forEach(function (quest) {
      if (indeg.get(quest.id) === 0) {
        level.set(quest.id, 0);
        queue.push(quest.id);
      }
    });

    var guard = 0;
    while (queue.length && guard < 5000) {
      guard += 1;
      var id = queue.shift();
      var currentLevel = level.get(id) || 0;
      children.get(id).forEach(function (child) {
        var next = currentLevel + 1;
        if (!level.has(child) || next > level.get(child)) level.set(child, next);
        indeg.set(child, indeg.get(child) - 1);
        if (indeg.get(child) === 0) queue.push(child);
      });
    }

    list.forEach(function (quest) {
      if (!level.has(quest.id)) level.set(quest.id, 0);
    });

    var groups = new Map();
    list.forEach(function (quest) {
      var lv = level.get(quest.id);
      if (!groups.has(lv)) groups.set(lv, []);
      groups.get(lv).push(quest);
    });

    groups.forEach(function (arr) {
      arr.sort(function (a, b) {
        return String(a.name).localeCompare(String(b.name), 'ja');
      });
    });

    var maxCount = 0;
    groups.forEach(function (arr) { maxCount = Math.max(maxCount, arr.length); });
    var maxLevel = 0;
    groups.forEach(function (_arr, lv) { maxLevel = Math.max(maxLevel, lv); });

    var width = Math.max(maxCount * COL_STEP - (COL_STEP - NODE), NODE);
    var height = maxLevel * ROW_STEP + NODE;
    var positions = new Map();

    groups.forEach(function (arr, lv) {
      var rowWidth = arr.length * COL_STEP - (COL_STEP - NODE);
      var offset = (width - rowWidth) / 2;
      arr.forEach(function (quest, index) {
        positions.set(quest.id, { x: offset + index * COL_STEP, y: lv * ROW_STEP });
      });
    });

    return { byId: byId, children: children, parents: parents, positions: positions, width: width, height: height };
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    return el;
  }

  function buildLines(layout, stateOf) {
    var svg = svgEl('svg', {
      class: 'mc-lines',
      width: layout.width,
      height: layout.height,
      viewBox: '0 0 ' + layout.width + ' ' + layout.height,
      'aria-hidden': 'true'
    });

    layout.positions.forEach(function (childPos, childId) {
      layout.parents.get(childId).forEach(function (parentId) {
        var parentPos = layout.positions.get(parentId);
        if (!parentPos) return;
        var x1 = parentPos.x + NODE / 2;
        var y1 = parentPos.y + NODE;
        var x2 = childPos.x + NODE / 2;
        var y2 = childPos.y;
        var midY = (y1 + y2) / 2;
        var state = stateOf(childId);
        var path = svgEl('path', {
          d: 'M' + x1 + ' ' + y1 + ' V' + midY + ' H' + x2 + ' V' + y2,
          class: 'mc-line state-' + state
        });
        svg.appendChild(path);
      });
    });

    return svg;
  }

  /* ---------------------------------------------------------------
     Quest index page
  --------------------------------------------------------------- */
  function initQuestIndex() {
    var windowEl = document.getElementById('mcWindow');
    var tabsEl = document.getElementById('mcTabs');
    var treeView = document.getElementById('mcTreeView');
    var treeEl = document.getElementById('mcTree');
    var emptyEl = document.getElementById('mcEmpty');
    var proposeView = document.getElementById('mcProposeView');
    var titleEl = document.getElementById('mcTitle');
    var progressEl = document.getElementById('mcProgress');
    var tooltip = document.getElementById('mcTooltip');
    var dialog = document.getElementById('questDialog');
    var dialogBody = document.getElementById('questDialogBody');

    if (!windowEl || !tabsEl || !treeEl) return;

    var TABS = [
      { key: 'all', label: 'すべて', icon: '🗺️' },
      { key: 'daily', label: 'デイリー', icon: '🌅' },
      { key: 'weekly', label: 'ウィークリー', icon: '📅' },
      { key: 'single', label: '単発', icon: '⭐' },
      { key: 'hidden', label: '隠し', icon: '👁️' },
      { key: 'propose', label: '＋ 提案', icon: '✍️' }
    ];

    var quests = [];
    var active = 'all';

    function stateOf(id) {
      var quest = quests.find(function (item) { return item.id === id; });
      return quest ? quest.state : 'available';
    }

    function filtered() {
      if (active === 'all') return quests.slice();
      return quests.filter(function (quest) { return quest.type === active; });
    }

    function hideTooltip() {
      if (tooltip) tooltip.classList.remove('is-visible');
    }

    function positionTooltip(target) {
      if (!tooltip) return;
      var wrapRect = windowEl.getBoundingClientRect();
      var rect = target.getBoundingClientRect();
      var left = rect.left - wrapRect.left + rect.width / 2;
      var top = rect.top - wrapRect.top - 10;
      tooltip.style.left = Math.max(12, left) + 'px';
      tooltip.style.top = Math.max(12, top) + 'px';
    }

    function showTooltip(quest, target) {
      if (!tooltip) return;
      tooltip.innerHTML =
        '<span class="mc-tooltip-type type-' + esc(quest.type) + '">' + esc(typeLabel(quest.type)) + '</span>' +
        '<strong class="mc-tooltip-title">' + esc(quest.name) + '</strong>' +
        '<span class="mc-tooltip-desc">' + esc(quest.description) + '</span>' +
        '<span class="mc-tooltip-row"><b>条件</b>' + esc(quest.condition) + '</span>' +
        '<span class="mc-tooltip-row"><b>報酬</b>' + esc(quest.reward) + '</span>' +
        '<span class="mc-tooltip-state state-' + esc(quest.state) + '">' + esc(stateLabel(quest.state)) + ' / ' + esc(difficultyName(quest.difficulty)) + '</span>';
      positionTooltip(target);
      tooltip.classList.add('is-visible');
    }

    function openDialog(quest) {
      if (!dialog || !dialogBody) return;
      var deps = (quest.dependencies || []).map(function (dep) {
        var found = quests.find(function (item) { return item.id === dep; });
        return found ? found.name : dep;
      });
      dialogBody.innerHTML =
        '<div class="mc-dialog-head">' +
          '<span class="mc-dialog-icon">' + esc(quest.icon) + '</span>' +
          '<div>' +
            '<span class="mc-dialog-type type-' + esc(quest.type) + '">' + esc(typeLabel(quest.type)) + ' · ' + esc(difficultyLabel(quest.difficulty)) + '</span>' +
            '<h2>' + esc(quest.name) + '</h2>' +
            '<span class="mc-dialog-state state-' + esc(quest.state) + '">' + esc(stateLabel(quest.state)) + '</span>' +
          '</div>' +
        '</div>' +
        '<p class="mc-dialog-desc">' + esc(quest.description) + '</p>' +
        '<dl class="mc-dialog-facts">' +
          '<div><dt>成功条件</dt><dd>' + esc(quest.condition) + '</dd></div>' +
          '<div><dt>報酬</dt><dd>' + esc(quest.reward) + '</dd></div>' +
          '<div><dt>解放条件</dt><dd>' + (deps.length ? '前提: ' + esc(deps.join('、')) : esc(quest.unlockCondition || 'なし')) + '</dd></div>' +
        '</dl>' +
        '<div class="mc-dialog-actions">' +
          '<button type="button" class="btn primary" data-close-dialog>閉じる</button>' +
          '<a class="btn" href="./propose.html">このクエストを提案する</a>' +
        '</div>';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }

    function createNode(quest, position) {
      var node = document.createElement('button');
      node.type = 'button';
      node.className = 'mc-node type-' + quest.type + ' state-' + quest.state;
      node.style.left = position.x + 'px';
      node.style.top = position.y + 'px';
      node.dataset.id = quest.id;
      node.setAttribute('aria-label', quest.name + '（' + stateLabel(quest.state) + '）');
      node.innerHTML =
        '<span class="mc-node-frame">' +
          '<span class="mc-node-icon">' + esc(quest.icon) + '</span>' +
        '</span>' +
        '<span class="mc-node-label">' + esc(quest.name) + '</span>' +
        (quest.state === 'completed' ? '<span class="mc-node-check" aria-hidden="true">✔</span>' : '') +
        (quest.state === 'locked' ? '<span class="mc-node-lock" aria-hidden="true">🔒</span>' : '');
      node.addEventListener('mouseenter', function () { showTooltip(quest, node); });
      node.addEventListener('focus', function () { showTooltip(quest, node); });
      node.addEventListener('mouseleave', hideTooltip);
      node.addEventListener('blur', hideTooltip);
      node.addEventListener('click', function () { hideTooltip(); openDialog(quest); });
      return node;
    }

    function renderTree() {
      var list = filtered();
      treeEl.innerHTML = '';
      treeEl.classList.remove('is-empty');

      if (!list.length) {
        treeEl.classList.add('is-empty');
        if (emptyEl) emptyEl.hidden = false;
        if (progressEl) progressEl.textContent = '';
        return;
      }
      if (emptyEl) emptyEl.hidden = true;

      var layout = computeLayout(list);
      treeEl.style.width = layout.width + 'px';
      treeEl.style.height = layout.height + 'px';
      treeEl.appendChild(buildLines(layout, stateOf));

      list.forEach(function (quest) {
        var position = layout.positions.get(quest.id);
        if (position) treeEl.appendChild(createNode(quest, position));
      });

      var completed = list.filter(function (quest) { return quest.state === 'completed'; }).length;
      if (progressEl) progressEl.textContent = completed + ' / ' + list.length + ' 達成';
    }

    function updateTabs() {
      tabsEl.querySelectorAll('.mc-tab').forEach(function (tab) {
        tab.classList.toggle('is-active', tab.dataset.tab === active);
        tab.setAttribute('aria-selected', String(tab.dataset.tab === active));
      });
    }

    function selectTab(key) {
      active = key;
      hideTooltip();
      updateTabs();

      var isPropose = key === 'propose';
      if (treeView) treeView.hidden = isPropose;
      if (proposeView) proposeView.hidden = !isPropose;

      if (isPropose) {
        if (titleEl) titleEl.textContent = 'クエストを提案';
        if (progressEl) progressEl.textContent = '';
        return;
      }

      if (titleEl) titleEl.textContent = key === 'all' ? 'すべてのクエスト' : typeLabel(key) + 'クエスト';
      renderTree();
    }

    TABS.forEach(function (tab) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'mc-tab';
      button.dataset.tab = tab.key;
      button.setAttribute('role', 'tab');
      button.innerHTML = '<span class="mc-tab-icon" aria-hidden="true">' + tab.icon + '</span><span>' + esc(tab.label) + '</span>';
      button.addEventListener('click', function () { selectTab(tab.key); });
      tabsEl.appendChild(button);
    });

    if (dialog) {
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog || event.target.closest('[data-close-dialog]')) {
          if (typeof dialog.close === 'function') dialog.close();
          else dialog.removeAttribute('open');
        }
      });
    }

    fetchQuests().then(function (data) {
      quests = data;
      var requested = new URLSearchParams(window.location.search).get('tab');
      var valid = TABS.some(function (tab) { return tab.key === requested; });
      selectTab(valid ? requested : 'all');
      setupQuestProposalForm();
    });
  }

  /* ---------------------------------------------------------------
     Quest proposal form (index tab + standalone page)
  --------------------------------------------------------------- */
  function setupQuestProposalForm() {
    var form = document.getElementById('questProposalForm');
    if (!form) return;

    var templateGrid = document.getElementById('questTemplateGrid');
    var message = document.getElementById('questFormMessage');
    var titleGroup = document.getElementById('questTitleGroup');

    function setField(name, value) {
      var field = form.elements[name];
      if (field) field.value = value == null ? '' : value;
    }

    function setChecks(name, values) {
      var list = values || [];
      form.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
        input.checked = list.indexOf(input.value) !== -1;
      });
    }

    function syncTitleGroup() {
      if (!titleGroup) return;
      var hasTitle = Array.prototype.some.call(
        form.querySelectorAll('input[name="rewardTypes"]'),
        function (input) { return input.checked && input.value === 'title'; }
      );
      titleGroup.hidden = !hasTitle;
    }

    function applyTemplate(template) {
      var data = template.data;
      setField('name', data.name);
      setField('description', data.description);
      setField('type', data.type);
      setField('difficulty', data.difficulty);
      setField('condition', data.condition);
      setField('reward', data.reward);
      setField('proposedTitle', data.proposedTitle || '');
      setChecks('conditionTypes', data.conditionTypes);
      setChecks('rewardTypes', data.rewardTypes);
      syncTitleGroup();
      if (templateGrid) {
        templateGrid.querySelectorAll('.quest-template').forEach(function (card) {
          card.classList.toggle('is-active', card.dataset.template === template.key);
        });
      }
      var first = form.querySelector('input[name="name"]');
      if (first) first.focus();
    }

    if (templateGrid) {
      QUEST_TEMPLATES.forEach(function (template) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'quest-template';
        card.dataset.template = template.key;
        card.innerHTML =
          '<span class="quest-template-icon" aria-hidden="true">' + template.icon + '</span>' +
          '<strong>' + esc(template.label) + '</strong>' +
          '<small>' + esc(template.hint) + '</small>';
        card.addEventListener('click', function () { applyTemplate(template); });
        templateGrid.appendChild(card);
      });
    }

    form.querySelectorAll('input[name="rewardTypes"]').forEach(function (input) {
      input.addEventListener('change', syncTitleGroup);
    });
    syncTitleGroup();

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var data = {
        name: form.elements.name ? form.elements.name.value.trim() : '',
        description: form.elements.description ? form.elements.description.value.trim() : '',
        type: form.elements.type ? form.elements.type.value : 'single',
        difficulty: form.elements.difficulty ? form.elements.difficulty.value : 'normal',
        condition: form.elements.condition ? form.elements.condition.value.trim() : '',
        reward: form.elements.reward ? form.elements.reward.value.trim() : '',
        proposedTitle: form.elements.proposedTitle ? form.elements.proposedTitle.value.trim() : '',
        dependencies: form.elements.dependencies && form.elements.dependencies.value
          ? form.elements.dependencies.value.split(',').map(function (id) { return id.trim(); }).filter(Boolean)
          : [],
        unlockCondition: form.elements.unlockCondition ? form.elements.unlockCondition.value.trim() : '',
        author: form.elements.author ? form.elements.author.value.trim() : '',
        notes: form.elements.notes ? form.elements.notes.value.trim() : '',
        conditionTypes: [],
        rewardTypes: []
      };
      form.querySelectorAll('input[name="conditionTypes"]:checked').forEach(function (input) {
        data.conditionTypes.push(input.value);
      });
      form.querySelectorAll('input[name="rewardTypes"]:checked').forEach(function (input) {
        data.rewardTypes.push(input.value);
      });

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
        var response = await fetch('/api/quests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        var result = await response.json().catch(function () { return {}; });
        if (response.ok) {
          feedback('提案を受け付けました。審査後に公開されます。', true);
          form.reset();
          syncTitleGroup();
          if (templateGrid) {
            templateGrid.querySelectorAll('.quest-template').forEach(function (card) {
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

  /* ---------------------------------------------------------------
     Quest detail page
  --------------------------------------------------------------- */
  function initQuestDetail() {
    var container = document.getElementById('questDetail');
    var titleEl = document.getElementById('questTitle');
    if (!container) return;

    var questId = new URLSearchParams(window.location.search).get('id');

    function render(quest) {
      if (!quest) {
        container.innerHTML =
          '<div class="mc-empty-state">' +
            '<h2>クエストが見つかりません</h2>' +
            '<p>指定されたクエストは存在しないか、削除されました。</p>' +
            '<a class="btn primary" href="./">クエスト一覧に戻る</a>' +
          '</div>';
        return;
      }
      if (titleEl) titleEl.textContent = quest.name;

      var deps = (quest.dependencies || []).map(function (dep) {
        return '<li>' + esc(dep) + '</li>';
      }).join('');

      container.innerHTML =
        '<article class="mc-detail type-' + esc(quest.type) + '">' +
          '<header class="mc-detail-head">' +
            '<span class="mc-detail-icon">' + esc(quest.icon) + '</span>' +
            '<div>' +
              '<span class="mc-detail-badge type-' + esc(quest.type) + '">' + esc(typeLabel(quest.type)) + '</span>' +
              '<h2>' + esc(quest.name) + '</h2>' +
              '<span class="mc-detail-state state-' + esc(quest.state) + '">' + esc(stateLabel(quest.state)) + ' · ' + esc(difficultyLabel(quest.difficulty)) + ' ' + esc(difficultyName(quest.difficulty)) + '</span>' +
            '</div>' +
          '</header>' +
          '<p class="mc-detail-desc">' + esc(quest.description) + '</p>' +
          '<div class="mc-detail-grid">' +
            '<section><h3>成功条件</h3><p>' + esc(quest.condition) + '</p></section>' +
            '<section><h3>報酬</h3><p>' + esc(quest.reward) + '</p></section>' +
          '</div>' +
          (deps ? '<section class="mc-detail-section"><h3>前提クエスト</h3><ul class="mc-detail-deps">' + deps + '</ul></section>' : '') +
          (quest.unlockCondition ? '<section class="mc-detail-section"><h3>解放条件</h3><p>' + esc(quest.unlockCondition) + '</p></section>' : '') +
          '<footer class="mc-detail-foot">' +
            '<a class="btn primary" href="./">クエスト一覧へ</a>' +
            '<a class="btn" href="./propose.html">改善を提案する</a>' +
          '</footer>' +
        '</article>';
    }

    if (!questId) {
      render(null);
      return;
    }

    fetchQuests().then(function (quests) {
      var quest = quests.find(function (item) { return item.id === questId; });
      render(quest || null);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('mcWindow')) initQuestIndex();
    if (document.getElementById('questDetail')) initQuestDetail();
    if (document.getElementById('questProposalForm') && !document.getElementById('mcWindow')) {
      setupQuestProposalForm();
    }
  });
})();
