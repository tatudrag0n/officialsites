/* Mifron Quest Board
   無限キャンバス（ホワイトボード型）クエストUI。
   クエストデータは mifronplugin の quests.yml（実装）に準拠。
   API (/api/quests) から実データが取れる場合はそれを優先する。
   CSP: script-src 'self' のため外部ライブラリは使わない。 */
(function () {
  'use strict';

  /* ============================================================
     実クエストデータ（mifronplugin: src/main/resources/quests.yml）
     D01–D10 / W01–W10 / M01–M10 / S02–S30 の59件。
     デイリー・ウィークリーは「10候補から5件抽選」、
     マンスリーは「9件固定表示＋完全達成」、
     スペシャルは「条件発生・1回限り」。
     ============================================================ */
  var QUESTS = [
    // ---- デイリー（10候補から5件抽選） ----
    { id: 'D01', type: 'daily', name: '今日の採掘', condition: '石系/鉱石系ブロックを合計300個採掘', reward: '300 MP', cycle: '毎日リセット / 1日1回', candidate: '10候補から5件抽選' },
    { id: 'D02', type: 'daily', name: '今日の建築', condition: '任意の建材ブロックを200個設置', reward: '250 MP', cycle: '毎日リセット / 1日1回', candidate: '10候補から5件抽選' },
    { id: 'D03', type: 'daily', name: '小規模討伐', condition: '敵対Mobを30体、直接討伐', reward: '350 MP', cycle: '毎日リセット / 1日1回', candidate: '10候補から5件抽選' },
    { id: 'D04', type: 'daily', name: '農作業日和', condition: '生活ポイントを150獲得（採集1 / 釣り17 / 繁殖8）', reward: '250 MP', cycle: '毎日リセット / 1日1回', candidate: '10候補から5件抽選' },
    { id: 'D05', type: 'daily', name: '商売の一歩', condition: 'ショップまたは商人で3回取引', reward: '300 MP', cycle: '毎日リセット / 1日1回', candidate: '10候補から5件抽選' },
    { id: 'D06', type: 'daily', name: '軽い探索', condition: '初めて入るチャンクを20チャンク訪問', reward: '300 MP', cycle: '毎日リセット / 1日1回', candidate: '10候補から5件抽選' },
    { id: 'D07', type: 'daily', name: '今日のアスレ', condition: '任意難易度のアスレを2回クリア', reward: '350 MP', cycle: '毎日リセット / 1日1回', candidate: '10候補から5件抽選' },
    { id: 'D08', type: 'daily', name: 'ミニゲーム参加', condition: 'ミニゲームの参加または勝利処理を合計3回', reward: '350 MP', cycle: '毎日リセット / 1日1回', candidate: '10候補から5件抽選' },
    { id: 'D09', type: 'daily', name: '釣りと収集', condition: '釣り成功または採集を合計20回', reward: '250 MP', cycle: '毎日リセット / 1日1回', candidate: '10候補から5件抽選' },
    { id: 'D10', type: 'daily', name: 'デイリー完全達成', condition: 'その日に表示されたデイリー5件を全達成', reward: '500 MP', cycle: '毎日リセット', candidate: '表示分の全達成で発生' },

    // ---- ウィークリー（10候補から5件抽選） ----
    { id: 'W01', type: 'weekly', name: '週間採掘計画', condition: '石系/鉱石系ブロックを合計3,000個採掘', reward: '1,800 MP', cycle: '毎週リセット', candidate: '10候補から5件抽選' },
    { id: 'W02', type: 'weekly', name: '週間建築計画', condition: '建材ブロックを2,000個設置', reward: '1,600 MP', cycle: '毎週リセット', candidate: '10候補から5件抽選' },
    { id: 'W03', type: 'weekly', name: '討伐遠征', condition: '敵対Mobを300体、直接討伐', reward: '2,200 MP', cycle: '毎週リセット', candidate: '10候補から5件抽選' },
    { id: 'W04', type: 'weekly', name: '交易週間', condition: 'ショップ/商人で20回取引', reward: '1,600 MP', cycle: '毎週リセット', candidate: '10候補から5件抽選' },
    { id: 'W05', type: 'weekly', name: 'アスレ週間', condition: 'アスレを合計10回クリア', reward: '2,000 MP', cycle: '毎週リセット', candidate: '10候補から5件抽選' },
    { id: 'W06', type: 'weekly', name: 'ミニゲーム週間', condition: 'ミニゲームの参加または勝利処理を合計15回', reward: '2,000 MP', cycle: '毎週リセット', candidate: '10候補から5件抽選' },
    { id: 'W07', type: 'weekly', name: '探索遠征', condition: '初めて入るチャンクを150チャンク訪問', reward: '1,800 MP', cycle: '毎週リセット', candidate: '10候補から5件抽選' },
    { id: 'W08', type: 'weekly', name: '進捗挑戦', condition: '任意の進捗を3個達成', reward: '2,500 MP', cycle: '毎週リセット', candidate: '10候補から5件抽選' },
    { id: 'W09', type: 'weekly', name: '共同納品', condition: 'ミニゲーム解放へ合計1,000MPを納品', reward: '1,800 MP', cycle: '毎週リセット', candidate: '10候補から5件抽選' },
    { id: 'W10', type: 'weekly', name: 'ウィークリー完全達成', condition: 'その週に表示されたウィークリー5件を全達成', reward: '3,500 MP', cycle: '毎週リセット', candidate: '表示分の全達成で発生' },

    // ---- マンスリー（固定表示） ----
    { id: 'M01', type: 'monthly', name: '月間採掘王', condition: '石系/鉱石系ブロックを30,000個採掘', reward: '9,000 MP', cycle: '毎月リセット' },
    { id: 'M02', type: 'monthly', name: '月間建築家', condition: '建材ブロックを20,000個設置', reward: '9,000 MP', cycle: '毎月リセット' },
    { id: 'M03', type: 'monthly', name: '月間討伐者', condition: '敵対Mobを2,000体、直接討伐', reward: '9,000 MP', cycle: '毎月リセット' },
    { id: 'M04', type: 'monthly', name: '月間商人', condition: 'ショップまたは商人で合計100回取引', reward: '8,000 MP', cycle: '毎月リセット' },
    { id: 'M05', type: 'monthly', name: '月間冒険者', condition: '初めて入るチャンクを1,000チャンク訪問', reward: '8,000 MP', cycle: '毎月リセット' },
    { id: 'M06', type: 'monthly', name: '月間挑戦者', condition: 'アスレ・ミニゲーム・勝利処理を合計60回', reward: '8,500 MP', cycle: '毎月リセット' },
    { id: 'M07', type: 'monthly', name: '進捗探究者', condition: '任意の進捗を10個達成', reward: '10,000 MP', cycle: '毎月リセット' },
    { id: 'M08', type: 'monthly', name: '生活基盤整備', condition: '生活ポイントを5,000獲得', reward: '7,000 MP', cycle: '毎月リセット' },
    { id: 'M09', type: 'monthly', name: '共同開拓', condition: 'ミニゲーム解放へ1MP以上を納品', reward: '8,000 MP', cycle: '毎月リセット' },
    { id: 'M10', type: 'monthly', name: 'マンスリー完全達成', condition: '月間クエスト9件を全達成', reward: '12,000 MP', cycle: '毎月リセット' },

    // ---- スペシャル（条件発生・1回限り） ----
    { id: 'S02', type: 'special', name: '村の救世主', condition: 'ゾンビ村人を治療し、進捗を達成', reward: '7,000 MP' },
    { id: 'S03', type: 'special', name: '初ドラゴン討伐', condition: '討伐前30秒以内に最大体力の20%以上を与えるか、とどめを刺してエンダードラゴン討伐に参加', reward: '20,000 MP' },
    { id: 'S04', type: 'special', name: '初ウィザー討伐', condition: '討伐前30秒以内に最大体力の20%以上を与えるか、とどめを刺してウィザー討伐に参加', reward: '18,000 MP' },
    { id: 'S05', type: 'special', name: '古代都市調査', condition: 'スカルクの振動を回避する進捗を達成', reward: '12,000 MP' },
    { id: 'S06', type: 'special', name: '海底神殿制圧', condition: 'エルダーガーディアンを3体討伐（各討伐に参加）', reward: '10,000 MP' },
    { id: 'S07', type: 'special', name: '砦の略奪者', condition: 'ピグリン要塞を発見する進捗を達成', reward: '10,000 MP' },
    { id: 'S08', type: 'special', name: 'エンドシティ到達', condition: 'エンドシティ発見またはエリトラ関連の進捗を達成', reward: '15,000 MP' },
    { id: 'S09', type: 'special', name: 'バベルの挑戦者', condition: 'babel_towerワールドへ到達', reward: '12,000 MP' },
    { id: 'S10', type: 'special', name: '深淵到達', condition: 'ginnungagapワールドへ到達', reward: '12,000 MP' },
    { id: 'S11', type: 'special', name: '地下帝国の客人', condition: 'agarthaワールドへ到達', reward: '15,000 MP' },
    { id: 'S12', type: 'special', name: 'エリシオン巡礼', condition: 'elysionワールドへ到達', reward: '12,000 MP' },
    { id: 'S13', type: 'special', name: '全進捗への一歩', condition: '累計進捗25個達成', reward: '8,000 MP' },
    { id: 'S14', type: 'special', name: '進捗蒐集家', condition: '累計進捗50個達成', reward: '15,000 MP' },
    { id: 'S15', type: 'special', name: '全能への道', condition: '累計進捗75個達成', reward: '25,000 MP' },
    { id: 'S16', type: 'special', name: '初めての転生', condition: '初回転生を実行', reward: '30,000 MP' },
    { id: 'S17', type: 'special', name: '二度目の覚醒', condition: '2回目の転生を実行', reward: '40,000 MP' },
    { id: 'S18', type: 'special', name: '商人の常連', condition: '累計取引500回達成', reward: '12,000 MP' },
    { id: 'S19', type: 'special', name: 'オークション参加者', condition: 'オークション額縁を1回作成', reward: '7,000 MP' },
    { id: 'S20', type: 'special', name: '国家の礎', condition: 'nationまたはnationsワールドへ到達', reward: '10,000 MP' },
    { id: 'S21', type: 'special', name: '建築コンテスト参加', condition: 'Buildワールドからschematicを1件提出', reward: '15,000 MP' },
    { id: 'S22', type: 'special', name: 'ミニゲーム王者', condition: 'ミニゲームで1回勝利', reward: '20,000 MP' },
    { id: 'S23', type: 'special', name: 'アスレ覇者', condition: 'hardcore設定のアスレチックを1回完走', reward: '25,000 MP' },
    { id: 'S24', type: 'special', name: '釣り名人', condition: '釣りで弓・エンチャント本・釣竿・名札・オウムガイ・鞍のいずれかを獲得', reward: '8,000 MP' },
    { id: 'S25', type: 'special', name: '農業王', condition: '棚ショップまたは商人へ農作物を1回売却', reward: '10,000 MP' },
    { id: 'S26', type: 'special', name: '鍛冶の探究者', condition: '鍛冶型を1個拾得', reward: '15,000 MP' },
    { id: 'S27', type: 'special', name: '全モブ観察', condition: '報酬対象Mobを1種類以上、直接攻撃で討伐', reward: '20,000 MP' },
    { id: 'S28', type: 'special', name: '共同解放の功労者', condition: 'ミニゲーム解放へ1MP以上を納品', reward: '25,000 MP' },
    { id: 'S29', type: 'special', name: 'クリエイターの第一歩', condition: '提出したschematicが1件承認される', reward: '15,000 MP' },
    { id: 'S30', type: 'special', name: 'Mifronの伝説', condition: '転生2回・進捗75個・Mob討伐2,000体・ブロック設置20,000個・取引500回をすべて達成', reward: '50,000 MP' }
  ];

  // 管理者レビュー（/admin/）でも同じクエスト定義を参照できるようにする。
  window.MIFRON_QUESTS = QUESTS;

  /* ---- クエスト間の接続（実装上の関係） ----
     完全達成クエストは、同期間の通常クエストすべてを前提とする。
     S30は長期総合目標。 */
  var TYPE_GROUPS = { daily: 'D01', weekly: 'W01', monthly: 'M01' };
  function connectionsOf(list) {
    var edges = [];
    var byType = {};
    list.forEach(function (q) {
      (byType[q.type] = byType[q.type] || []).push(q);
    });
    ['daily', 'weekly', 'monthly'].forEach(function (type) {
      var group = byType[type] || [];
      var goal = group.find(function (q) { return q.id.slice(-2) === '10'; });
      if (!goal) return;
      group.forEach(function (q) {
        if (q !== goal && q.id !== 'D10' && q.id !== 'W10' && q.id !== 'M09') edges.push([q.id, goal.id]);
      });
    });
    return edges;
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  var TYPE_LABELS = { daily: 'デイリー', weekly: 'ウィークリー', monthly: 'マンスリー', special: 'スペシャル' };

  function rewardValue(reward) {
    var m = String(reward || '').replace(/,/g, '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  /* ============================================================
     APIから実データを取得（本番のKV投入データを優先表示）
     - status が pending / 未設定のレコード = 提案（審査待ち）。
       ボードへは既定で表示せず「審査待ちの提案も表示」で見せる。
     - それ以外のレコード = 運営が承認投入した公式データ。
       ある場合は内蔵データ（QUESTS）より優先する。
     ============================================================ */
  function fetchApiQuests() {
    return fetch('/api/quests', { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) throw new Error('empty');
        return data
          .filter(function (q) { return q && (q.id || q.name); })
          .map(function (q) {
            var type = ['daily', 'weekly', 'monthly', 'special'].indexOf(String(q.type || '').toLowerCase()) !== -1
              ? String(q.type).toLowerCase()
              : 'special';
            var status = String(q.status || '').toLowerCase();
            var isPending = status === '' || status === 'pending';
            return {
              id: String(q.id || q.name).slice(0, 40),
              type: type,
              name: String(q.name || '').slice(0, 120),
              condition: String(q.condition || '').slice(0, 500),
              reward: String(q.reward || '').slice(0, 300),
              cycle: isPending ? 'プレイヤー提案 / 審査待ち' : String(q.cycle || q.candidate || '運営公式').slice(0, 120),
              proposed: isPending
            };
          });
      })
      .catch(function () { return null; });
  }

  /* ============================================================
     評価（高評価 / 低評価）
     実装済み・審査中のどちらのクエストでも同じ操作で評価する。
     表示するのは高評価数だけで、低評価数は一般向けUIに出さない。
     ============================================================ */
  var voteStore = { counts: {}, mine: {} };

  function voterId() {
    try {
      var key = 'mifron-voter-id';
      var id = window.localStorage.getItem(key);
      if (!id) {
        id = 'v' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        window.localStorage.setItem(key, id);
      }
      return id;
    } catch (_) {
      return '';
    }
  }

  function voteCounts(questId) {
    return voteStore.counts[questId] || { up: 0, down: 0 };
  }

  function myVote(questId) {
    return voteStore.mine[questId] || null;
  }

  function fetchVotes() {
    var voter = voterId();
    var url = '/api/quests/votes' + (voter ? '?voter=' + encodeURIComponent(voter) : '');
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        voteStore.counts = (data && data.counts) || {};
        voteStore.mine = (data && data.mine) || {};
      })
      .catch(function () {
        // 評価APIが使えない環境では0件として表示する。
        voteStore.counts = {};
        voteStore.mine = {};
      });
  }

  // 同じボタンをもう一度押すと投票を取り消す。
  function sendVote(questId, vote) {
    var next = myVote(questId) === vote ? 'none' : vote;
    return fetch('/api/quests/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId: questId, vote: next, voter: voterId() })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        voteStore.counts[questId] = (data && data.count) || { up: 0, down: 0 };
        if (data && data.myVote) voteStore.mine[questId] = data.myVote;
        else delete voteStore.mine[questId];
      });
  }

  function ratingHtml(questId) {
    var up = voteCounts(questId).up;
    var mine = myVote(questId);
    return '<section class="quest-rating" data-rating>' +
      '<h3 class="quest-rating-title">このクエストの評価</h3>' +
      '<div class="quest-rating-actions">' +
        '<button type="button" class="rate-btn rate-up' + (mine === 'up' ? ' is-active' : '') + '" data-vote="up" aria-pressed="' + (mine === 'up' ? 'true' : 'false') + '">' +
          '<span class="rate-icon" aria-hidden="true">▲</span><span>高評価</span><span class="rate-count" data-rate-count>' + up + '</span>' +
        '</button>' +
        '<button type="button" class="rate-btn rate-down' + (mine === 'down' ? ' is-active' : '') + '" data-vote="down" aria-pressed="' + (mine === 'down' ? 'true' : 'false') + '">' +
          '<span class="rate-icon" aria-hidden="true">▼</span><span>低評価</span>' +
        '</button>' +
      '</div>' +
      '<p class="rate-note" data-rate-note hidden role="status" aria-live="polite"></p>' +
    '</section>';
  }

  function bindRating(scope, questId, onChange) {
    var section = scope.querySelector('[data-rating]');
    if (!section) return;
    var note = section.querySelector('[data-rate-note]');
    var countEl = section.querySelector('[data-rate-count]');
    var buttons = Array.prototype.slice.call(section.querySelectorAll('.rate-btn'));

    function paint() {
      var mine = myVote(questId);
      if (countEl) countEl.textContent = String(voteCounts(questId).up);
      buttons.forEach(function (button) {
        var active = button.dataset.vote === mine;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (b) { b.disabled = true; });
        if (note) {
          note.hidden = false;
          note.classList.remove('is-error');
          note.textContent = '送信中…';
        }
        sendVote(questId, button.dataset.vote)
          .then(function () {
            paint();
            if (onChange) onChange(questId);
            if (note) note.textContent = '評価を記録しました。';
          })
          .catch(function () {
            if (note) {
              note.hidden = false;
              note.classList.add('is-error');
              note.textContent = '評価を送信できませんでした。時間をおいて再試行してください。';
            }
          })
          .then(function () {
            buttons.forEach(function (b) { b.disabled = false; });
          });
      });
    });

    paint();
  }

  /* ---------- 削除提案 ----------
     クエストを選んだときの「削除を提案」から送信する。
     審査の優先度は、提案への高評価と対象クエストの低評価の比率で決まる。 */
  var deletionDialog = null;

  function deletionFeedback(dialogEl, text, ok) {
    var message = dialogEl.querySelector('[data-deletion-message]');
    if (!message) return;
    message.textContent = text;
    message.hidden = false;
    message.classList.toggle('is-error', !ok);
    message.classList.toggle('is-ok', ok);
  }

  function closeDeletionDialog() {
    if (!deletionDialog) return;
    if (typeof deletionDialog.close === 'function') deletionDialog.close();
    else deletionDialog.removeAttribute('open');
  }

  function ensureDeletionDialog() {
    if (deletionDialog) return deletionDialog;

    var dialogEl = document.createElement('dialog');
    dialogEl.className = 'deletion-dialog';
    dialogEl.setAttribute('aria-label', 'クエストの削除提案');
    dialogEl.innerHTML =
      '<form class="deletion-form" data-deletion-form novalidate>' +
        '<h2>削除を提案</h2>' +
        '<p class="deletion-target">対象クエスト: <strong data-deletion-target></strong></p>' +
        '<div class="deletion-field">' +
          '<label for="deletion-reason">削除すべき理由 <span class="req" aria-hidden="true">必須</span></label>' +
          '<textarea id="deletion-reason" name="reason" required maxlength="1000" rows="4" enterkeyhint="done" placeholder="重複している / 報酬バランスが不適切 / 条件が達成できない など"></textarea>' +
          '<span class="field-count"><span data-count-for="deletion-reason">0</span> / 1000</span>' +
        '</div>' +
        '<div class="deletion-field">' +
          '<label for="deletion-author">提案者名（任意）</label>' +
          '<input id="deletion-author" name="author" type="text" maxlength="60" autocomplete="off" enterkeyhint="done" placeholder="ゲーム内ニックネームなど">' +
        '</div>' +
        '<div class="deletion-actions">' +
          '<button type="submit" class="btn primary">削除提案を送信</button>' +
          '<button type="button" class="btn" data-deletion-cancel>キャンセル</button>' +
        '</div>' +
        '<p class="deletion-note">削除提案は運営が審査します。提案への高評価と対象クエストの低評価の比率が高いものから優先して確認されます。</p>' +
        '<div class="deletion-message" data-deletion-message hidden role="status" aria-live="polite"></div>' +
      '</form>';

    var form = dialogEl.querySelector('[data-deletion-form]');
    var reason = dialogEl.querySelector('#deletion-reason');
    var counter = dialogEl.querySelector('[data-count-for="deletion-reason"]');
    if (reason && counter) {
      reason.addEventListener('input', function () { counter.textContent = String(reason.value.length); });
    }

    dialogEl.addEventListener('click', function (event) {
      if (event.target === dialogEl || event.target.closest('[data-deletion-cancel]')) {
        closeDeletionDialog();
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) {
        deletionFeedback(dialogEl, '削除すべき理由を入力してください。', false);
        return;
      }
      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      deletionFeedback(dialogEl, '送信中…', true);

      var author = dialogEl.querySelector('#deletion-author');
      var payload = {
        title: '「' + (dialogEl.dataset.questName || '') + '」の削除提案',
        description: reason ? reason.value.trim() : '',
        type: 'deletion',
        priority: 'medium',
        targetId: dialogEl.dataset.questId || '',
        targetName: dialogEl.dataset.questName || '',
        author: author ? author.value.trim() : '',
        tags: ['削除提案']
      };

      fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (result) {
            if (response.ok) {
              deletionFeedback(dialogEl, '削除提案を受け付けました。運営が審査します。', true);
              form.reset();
              if (counter) counter.textContent = '0';
            } else if (response.status === 429) {
              deletionFeedback(dialogEl, '送信が集中しています。10分ほど待ってから再度お試しください。', false);
            } else {
              deletionFeedback(dialogEl, '送信に失敗しました: ' + (result.error || '不明なエラー'), false);
            }
          });
        })
        .catch(function () {
          deletionFeedback(dialogEl, 'サーバーに接続できませんでした。時間をおいて再試行してください。', false);
        })
        .then(function () {
          if (submit) submit.disabled = false;
        });
    });

    document.body.appendChild(dialogEl);
    deletionDialog = dialogEl;
    return dialogEl;
  }

  function openDeletionDialog(quest) {
    var dialogEl = ensureDeletionDialog();
    dialogEl.dataset.questId = quest.id;
    dialogEl.dataset.questName = quest.name;

    var target = dialogEl.querySelector('[data-deletion-target]');
    if (target) target.textContent = quest.name;

    var form = dialogEl.querySelector('[data-deletion-form]');
    if (form) form.reset();
    var counter = dialogEl.querySelector('[data-count-for="deletion-reason"]');
    if (counter) counter.textContent = '0';
    var message = dialogEl.querySelector('[data-deletion-message]');
    if (message) {
      message.hidden = true;
      message.textContent = '';
      message.classList.remove('is-error', 'is-ok');
    }

    if (typeof dialogEl.showModal === 'function') dialogEl.showModal();
    else dialogEl.setAttribute('open', '');

    var reason = dialogEl.querySelector('#deletion-reason');
    if (reason) reason.focus();
  }

  /* ============================================================
     ボード（無限キャンバス）
     ============================================================ */
  function initBoard() {
    var board = document.getElementById('questBoard');
    var canvas = document.getElementById('boardCanvas');
    var svg = document.getElementById('boardLines');
    var countEl = document.getElementById('questCount');
    var searchEl = document.getElementById('questSearch');
    var typeFilter = document.getElementById('questTypeFilter');
    var stateFilter = document.getElementById('questStateFilter');
    var dialog = document.getElementById('questDialog');
    var dialogBody = document.getElementById('questDialogBody');
    var hint = document.getElementById('boardHint');
    var emptyEl = document.getElementById('boardEmpty');
    if (!board || !canvas) return;

    var quests = QUESTS.slice();
    var query = '';
    var activeType = 'all';
    var activeState = 'all';
    var showProposed = false;

    var scale = 1;
    var tx = 0;
    var ty = 0;
    var CARD_W = 216;
    var CARD_GAP = 28;
    var COL_H = 118;
    var groupX = { daily: 0, weekly: 1, monthly: 2, special: 3 };

    function filtered() {
      var q = query.toLowerCase();
      return quests.filter(function (quest) {
        // 提案データ（審査待ち）は明示的にオンにしたときだけ表示
        if (quest.proposed && !showProposed) return false;
        if (activeType !== 'all' && quest.type !== activeType) return false;
        if (activeState === 'cycle' && !(quest.cycle && quest.cycle.indexOf('リセット') !== -1)) return false;
        if (activeState === 'repeatable' && !(quest.candidate || (quest.cycle && quest.cycle.indexOf('1日') !== -1))) return false;
        if (activeState === 'once' && quest.type !== 'special') return false;
        if (activeState === 'daily_open' && quest.type !== 'daily') return false;
        if (q) {
          var hay = (quest.name + ' ' + quest.condition + ' ' + quest.reward).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
    }

    function applyTransform() {
      canvas.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    }

    function layout(list) {
      // 種類ごとに縦1列（値で降順）、列は daily→weekly→monthly→special
      var columns = {};
      list.forEach(function (q) {
        (columns[q.type] = columns[q.type] || []).push(q);
      });
      Object.keys(columns).forEach(function (type) {
        columns[type].sort(function (a, b) { return rewardValue(b.reward) - rewardValue(a.reward); });
      });
      var positions = new Map();
      Object.keys(columns).forEach(function (type) {
        var col = groupX[type] || 0;
        columns[type].forEach(function (q, i) {
          positions.set(q.id, { x: col * (CARD_W + CARD_GAP * 2.2), y: 60 + i * COL_H });
        });
      });
      return positions;
    }

    function drawLines(list, positions) {
      if (!svg) return;
      var parts = [];
      connectionsOf(list).forEach(function (edge) {
        var a = positions.get(edge[0]);
        var b = positions.get(edge[1]);
        if (!a || !b) return;
        var x1 = a.x + CARD_W / 2, y1 = a.y + 84;
        var x2 = b.x + CARD_W / 2, y2 = b.y;
        var my = (y1 + y2) / 2;
        parts.push('<path d="M' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + my + ', ' + x2 + ' ' + my + ', ' + x2 + ' ' + y2 + '" class="edge edge-' + edge[1].slice(0, 1).toLowerCase() + '"/>');
      });
      svg.style.width = '2400px';
      svg.style.height = '4000px';
      svg.setAttribute('viewBox', '0 0 2400 4000');
      svg.innerHTML = parts.join('');
    }

    function render() {
      var list = filtered();
      canvas.querySelectorAll('.quest-card').forEach(function (el) { el.remove(); });
      if (emptyEl) emptyEl.hidden = list.length > 0;
      if (!list.length) {
        if (countEl) countEl.textContent = '該当するクエストはありません';
        drawLines([], new Map());
        return;
      }
      var positions = layout(list);
      drawLines(list, positions);
      list.forEach(function (quest) {
        var pos = positions.get(quest.id) || { x: 0, y: 0 };
        var el = document.createElement('button');
        el.type = 'button';
        el.className = 'quest-card type-' + quest.type + (quest.proposed ? ' is-proposed' : '');
        el.style.left = pos.x + 'px';
        el.style.top = pos.y + 'px';
        el.dataset.id = quest.id;
        var up = voteCounts(quest.id).up;
        el.innerHTML =
          '<span class="quest-card-head">' +
            '<span class="quest-card-type">' + esc(TYPE_LABELS[quest.type] || quest.type) + '</span>' +
            (up > 0 ? '<span class="quest-card-up">▲ ' + up + '</span>' : '') +
          '</span>' +
          '<span class="quest-card-name">' + esc(quest.name) + '</span>' +
          '<span class="quest-card-reward">' + esc(quest.reward) + '</span>';
        el.addEventListener('click', function () { openDialog(quest); });
        canvas.appendChild(el);
      });
      if (countEl) countEl.textContent = list.length + ' 件を表示中';
    }

    function refreshCardCount(questId) {
      var up = voteCounts(questId).up;
      canvas.querySelectorAll('.quest-card').forEach(function (card) {
        if (card.dataset.id !== questId) return;
        var chip = card.querySelector('.quest-card-up');
        if (up > 0) {
          if (!chip) {
            chip = document.createElement('span');
            chip.className = 'quest-card-up';
            var head = card.querySelector('.quest-card-head');
            if (head) head.appendChild(chip);
          }
          chip.textContent = '▲ ' + up;
        } else if (chip) {
          chip.remove();
        }
      });
    }

    function openDialog(quest) {
      if (!dialog || !dialogBody) return;
      dialogBody.innerHTML =
        '<div class="quest-dialog-head">' +
          '<span class="badge type-' + esc(quest.type) + '">' + esc(TYPE_LABELS[quest.type] || quest.type) + '</span>' +
          '<h2>' + esc(quest.name) + '</h2>' +
        '</div>' +
        (quest.proposed ? '<p class="quest-state-note">審査中の提案です。承認されるとゲーム内へ反映されます。</p>' : '') +
        '<div class="quest-dialog-facts">' +
          '<div><dt>成功条件</dt><dd>' + esc(quest.condition) + '</dd></div>' +
          '<div><dt>報酬</dt><dd>' + esc(quest.reward) + '</dd></div>' +
          '<div><dt>サイクル</dt><dd>' + esc(quest.candidate || quest.cycle || '条件発生 / 1回限り') + '</dd></div>' +
        '</div>' +
        ratingHtml(quest.id) +
        '<div class="quest-dialog-actions">' +
          '<button type="button" class="btn primary" data-close-dialog>閉じる</button>' +
          '<button type="button" class="btn danger" data-propose-deletion>削除を提案</button>' +
        '</div>';
      bindRating(dialogBody, quest.id, refreshCardCount);
      var deletionButton = dialogBody.querySelector('[data-propose-deletion]');
      if (deletionButton) {
        deletionButton.addEventListener('click', function () { openDeletionDialog(quest); });
      }
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }

    // ---- パン（ドラッグ / タッチ1本） ----
    // パン開始点がカード上でも、動いた（6px超）らドラッグ優先。
    // 静止したまま指を離したときだけクリック（カード詳細）として扱う。
    var pointer = null;
    var panTarget = null;
    board.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button, input')) return;
      panTarget = e.target.closest('.quest-card');
      pointer = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, moved: false };
      board.setPointerCapture(e.pointerId);
      board.classList.add('is-grabbing');
    });
    board.addEventListener('pointermove', function (e) {
      if (!pointer) return;
      var dx = e.clientX - pointer.x;
      var dy = e.clientY - pointer.y;
      if (!pointer.moved && Math.abs(dx) + Math.abs(dy) > 6) pointer.moved = true;
      if (!pointer.moved) return;
      tx = pointer.tx + dx;
      ty = pointer.ty + dy;
      applyTransform();
    });
    function endPan(e) {
      if (!pointer) return;
      var wasStatic = !pointer.moved;
      var target = panTarget;
      pointer = null;
      panTarget = null;
      board.classList.remove('is-grabbing');
      if (wasStatic && target && e && e.type === 'pointerup') {
        // タップ（静止タッチ）: カード詳細を開く
        var quest = quests.find(function (q) { return q.id === target.dataset.id; });
        if (quest) openDialog(quest);
      }
    }
    board.addEventListener('pointerup', endPan);
    board.addEventListener('pointercancel', endPan);

    // ---- ズーム（ホイール / ピンチ / ボタン） ----
    function zoomTo(next, cx, cy) {
      var rect = board.getBoundingClientRect();
      cx = cx == null ? rect.width / 2 : cx - rect.left;
      cy = cy == null ? rect.height / 2 : cy - rect.top;
      var clamped = Math.min(2.2, Math.max(0.35, next));
      var ratio = clamped / scale;
      tx = cx - (cx - tx) * ratio;
      ty = cy - (cy - ty) * ratio;
      scale = clamped;
      applyTransform();
    }
    board.addEventListener('wheel', function (e) {
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomTo(scale * factor, e.clientX, e.clientY);
    }, { passive: false });

    var pinch = null;
    board.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        pinch = { dist: Math.hypot(dx, dy), scale: scale, tx: tx, ty: ty, mx: (e.touches[0].clientX + e.touches[1].clientX) / 2, my: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
        pointer = null;
      }
    }, { passive: true });
    board.addEventListener('touchmove', function (e) {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.hypot(dx, dy);
        var rect = board.getBoundingClientRect();
        var cx = pinch.mx - rect.left, cy = pinch.my - rect.top;
        var next = Math.min(2.2, Math.max(0.35, pinch.scale * (dist / pinch.dist)));
        var ratio = next / scale;
        tx = cx - (cx - tx) * ratio;
        ty = cy - (cy - ty) * ratio;
        scale = next;
        applyTransform();
        // ピンチ中の平行移動
        var mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        var my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        tx += mx - pinch.mx;
        ty += my - pinch.my;
        pinch.mx = mx; pinch.my = my;
        applyTransform();
      }
    }, { passive: false });
    board.addEventListener('touchend', function () { pinch = null; }, { passive: true });

    // ボタン
    var zoomIn = document.getElementById('zoomIn');
    var zoomOut = document.getElementById('zoomOut');
    var zoomReset = document.getElementById('zoomReset');
    if (zoomIn) zoomIn.addEventListener('click', function () { zoomTo(scale * 1.3); });
    if (zoomOut) zoomOut.addEventListener('click', function () { zoomTo(scale / 1.3); });
    if (zoomReset) zoomReset.addEventListener('click', function () { fitView(); });

    function fitView() {
      // 全体表示: フィルタ後のキャンバス範囲を実測して収める
      var cards = Array.prototype.slice.call(canvas.querySelectorAll('.quest-card'));
      if (!cards.length) { scale = 1; tx = 0; ty = 0; applyTransform(); return; }
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      cards.forEach(function (card) {
        var x = parseFloat(card.style.left) || 0;
        var y = parseFloat(card.style.top) || 0;
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + CARD_W); maxY = Math.max(maxY, y + 110);
      });
      var pad = 24;
      var w = Math.max(1, maxX - minX + pad * 2);
      var h = Math.max(1, maxY - minY + pad * 2);
      scale = Math.min(1.1, Math.max(0.35, Math.min(board.clientWidth / w, board.clientHeight / h)));
      tx = Math.round((board.clientWidth - w * scale) / 2 - (minX - pad) * scale);
      ty = Math.round((board.clientHeight - h * scale) / 2 - (minY - pad) * scale);
      applyTransform();
    }

    // 検索・フィルタ
    var searchTimer = null;
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          query = searchEl.value.trim();
          render();
        }, 180);
      });
    }
    function bindFilterBar(bar, attr, apply) {
      if (!bar) return;
      bar.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          bar.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          apply(btn.dataset[attr]);
          render();
        });
      });
    }
    bindFilterBar(typeFilter, 'type', function (v) { activeType = v; });
    bindFilterBar(stateFilter, 'state', function (v) { activeState = v; });

    // 提案データ（審査待ち）の表示切り替え。既定はオフ。
    var proposedToggle = document.getElementById('showProposed');
    if (proposedToggle) {
      proposedToggle.addEventListener('change', function () {
        showProposed = proposedToggle.checked;
        render();
      });
    }

    // ヒント
    if (hint) {
      var hintClose = document.getElementById('hintClose');
      if (hintClose) hintClose.addEventListener('click', function () { hint.hidden = true; });
      try {
        if (window.localStorage && window.localStorage.getItem('mifron-quest-hint') === 'seen') hint.hidden = true;
        hintClose && hintClose.addEventListener('click', function () {
          try { window.localStorage.setItem('mifron-quest-hint', 'seen'); } catch (_) { /* private mode */ }
        });
      } catch (_) { /* localStorage unavailable */ }
    }

    // ダイアログを閉じる
    if (dialog) {
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog || e.target.closest('[data-close-dialog]')) {
          if (typeof dialog.close === 'function') dialog.close();
          else dialog.removeAttribute('open');
        }
      });
    }

    Promise.all([fetchApiQuests(), fetchVotes()]).then(function (results) {
      var apiQuests = results[0];
      if (apiQuests && apiQuests.length) {
        var approved = apiQuests.filter(function (q) { return !q.proposed; });
        var pending = apiQuests.filter(function (q) { return q.proposed; });
        // 承認済みKVデータがあれば内蔵データより優先。提案は追加で保持（既定非表示）。
        quests = approved.length ? approved.concat(pending) : QUESTS.slice().concat(pending);
      }
      render();
      fitView();
    });
  }

  /* ============================================================
     提案フォーム（テンプレート・カウンタ・送信）
     ============================================================ */
  var QUEST_TEMPLATES = [
    {
      key: 'mining', icon: '⛏️', label: '採掘',
      hint: '決まった数のブロックを掘る定番クエスト',
      data: {
        name: 'デイリー：採掘チャレンジ', description: '石や鉱石を決められた数だけ採掘するデイリークエストです。',
        type: 'daily', difficulty: 'normal', condition: '石を128個採掘する', conditionTypes: ['block_break'],
        reward: 'MP: 120', rewardTypes: ['mp']
      }
    },
    {
      key: 'combat', icon: '⚔️', label: '討伐',
      hint: 'モブを倒す戦闘系クエスト',
      data: {
        name: 'デイリー：モブ討伐', description: '夜になる前に周囲のモブを討伐して、ワールドの安全を守ります。',
        type: 'daily', difficulty: 'normal', condition: 'モブを15体倒す', conditionTypes: ['mob_kill'],
        reward: 'MP: 120', rewardTypes: ['mp']
      }
    },
    {
      key: 'build', icon: '🧱', label: '建築',
      hint: '拠点や構造物を建てるクリエイティブ系',
      data: {
        name: 'ウィークリー：建築家', description: '10x10以上の拠点を建築ワールドに建てて完成させます。',
        type: 'weekly', difficulty: 'hard', condition: '10x10以上の建築を完成させる', conditionTypes: ['block_break'],
        reward: 'MP: 700', rewardTypes: ['mp', 'item']
      }
    },
    {
      key: 'trade', icon: '💰', label: '取引',
      hint: 'ショップやオークションで経済を動かす',
      data: {
        name: 'デイリー：マーケット活動', description: 'ショップで売買を行い、Mifronの経済を活性化させます。',
        type: 'daily', difficulty: 'easy', condition: 'ショップで3回売買する', conditionTypes: ['mp_gain'],
        reward: 'MP: 100', rewardTypes: ['mp']
      }
    },
    {
      key: 'explore', icon: '🧭', label: '探索',
      hint: 'ワールドや座標を目指して冒険する',
      data: {
        name: 'スペシャル：未知への旅', description: '遠くのワールドや指定座標を目指して探索し、新しい発見を集めます。',
        type: 'single', difficulty: 'normal', condition: '特定のワールドへ到達する', conditionTypes: ['move', 'advancement'],
        reward: 'MP: 300', rewardTypes: ['mp']
      }
    },
    {
      key: 'fishing', icon: '🎣', label: '釣り',
      hint: '釣りでアイテムや食料を集める',
      data: {
        name: 'デイリー：釣り名人', description: '釣りをして魚やレアアイテムを集める、のんびり系クエストです。',
        type: 'daily', difficulty: 'easy', condition: '魚を10匹釣る', conditionTypes: ['item_obtain'],
        reward: 'MP: 90', rewardTypes: ['mp', 'item']
      }
    },
    {
      key: 'title', icon: '🏅', label: '称号',
      hint: '条件を満たして特別な称号を獲得する',
      data: {
        name: 'チャレンジ：〇〇の達人', description: '難しい条件を達成して、特別な称号を手に入れるチャレンジクエストです。',
        type: 'hidden', difficulty: 'very_hard', condition: '特定の条件を達成する', conditionTypes: ['advancement'],
        reward: '称号: 新しい称号', rewardTypes: ['title'], proposedTitle: '新しい称号'
      }
    },
    {
      key: 'login', icon: '🚪', label: 'ログイン',
      hint: '続けて参加する習慣づけ系',
      data: {
        name: 'デイリー：今日のログイン', description: 'サーバーへ参加して、今日の活動を始めるきっかけのクエストです。',
        type: 'daily', difficulty: 'easy', condition: 'サーバーにログインする', conditionTypes: ['login'],
        reward: 'MP: 50', rewardTypes: ['mp']
      }
    }
  ];

  function setupQuestProposalForm() {
    var form = document.getElementById('questProposalForm');
    if (!form) return;

    var templateGrid = document.getElementById('questTemplateGrid');
    var message = document.getElementById('questFormMessage');
    var titleGroup = document.getElementById('questTitleGroup');

    function setField(name, value) {
      var field = form.elements[name];
      if (field) field.value = value == null ? '' : value;
      updateCount(field);
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

    // 文字数カウンタ
    function updateCount(field) {
      if (!field || !field.id) return;
      var counter = form.querySelector('[data-count-for="' + field.id + '"]');
      if (counter) counter.textContent = String(field.value.length);
    }
    form.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(function (field) {
      field.addEventListener('input', function () { updateCount(field); });
      updateCount(field);
    });

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

    // バリデーション: ネイティブメッセージの下に独自のサマリも出す
    function feedback(text, ok) {
      if (!message) return;
      message.textContent = text;
      message.hidden = false;
      message.classList.toggle('is-error', !ok);
      message.classList.toggle('is-ok', ok);
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) {
        feedback('未入力の必須項目があります。各項目の下のエラーを確認してください。', false);
        return;
      }

      var data = {
        name: form.elements.name ? form.elements.name.value.trim() : '',
        description: form.elements.description ? form.elements.description.value.trim() : '',
        type: form.elements.type ? form.elements.type.value : 'single',
        difficulty: form.elements.difficulty ? form.elements.difficulty.value : 'normal',
        condition: form.elements.condition ? form.elements.condition.value.trim() : '',
        reward: form.elements.reward ? form.elements.reward.value.trim() : '',
        proposedTitle: form.elements.proposedTitle ? form.elements.proposedTitle.value.trim() : '',
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

      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      feedback('送信中…', true);

      try {
        var response = await fetch('/api/quests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        var result = await response.json().catch(function () { return {}; });
        if (response.ok) {
          feedback('提案を受け付けました。運営へ通知しました。審査後にクエストボードへ反映されます。', true);
          form.reset();
          form.querySelectorAll('[data-count-for]').forEach(function (c) { c.textContent = '0'; });
          syncTitleGroup();
          if (templateGrid) {
            templateGrid.querySelectorAll('.quest-template').forEach(function (card) {
              card.classList.remove('is-active');
            });
          }
        } else if (response.status === 429) {
          feedback('送信が集中しています。10分ほど待ってから再度お試しください。', false);
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

  /* ---------- 詳細ページ（detail.html） ---------- */
  function initDetail() {
    var container = document.getElementById('questDetail');
    if (!container) return;
    var id = new URLSearchParams(window.location.search).get('id');

    function render(quest) {
      if (!quest) {
        container.innerHTML =
          '<div class="mc-empty-state"><h2>クエストが見つかりません</h2>' +
          '<p>指定されたクエストは存在しないか、削除されました。</p>' +
          '<a class="btn primary" href="./">クエストボードへ戻る</a></div>';
        return;
      }
      document.title = quest.name + ' | Mifron';
      container.innerHTML =
        '<article class="detail-card type-' + esc(quest.type) + '">' +
          '<header class="detail-head">' +
            '<span class="badge type-' + esc(quest.type) + '">' + esc(TYPE_LABELS[quest.type] || quest.type) + '</span>' +
            '<h2>' + esc(quest.name) + '</h2>' +
          '</header>' +
          (quest.proposed ? '<p class="quest-state-note">審査中の提案です。承認されるとゲーム内へ反映されます。</p>' : '') +
          '<div class="quest-dialog-facts">' +
            '<div><dt>成功条件</dt><dd>' + esc(quest.condition) + '</dd></div>' +
            '<div><dt>報酬</dt><dd>' + esc(quest.reward) + '</dd></div>' +
            '<div><dt>サイクル</dt><dd>' + esc(quest.candidate || quest.cycle || '条件発生 / 1回限り') + '</dd></div>' +
          '</div>' +
          ratingHtml(quest.id) +
          '<footer class="detail-footer">' +
            '<a class="btn primary" href="./">ボードへ戻る</a>' +
            '<button type="button" class="btn danger" data-propose-deletion>削除を提案</button>' +
          '</footer>' +
        '</article>';
      bindRating(container, quest.id);
      var deletionButton = container.querySelector('[data-propose-deletion]');
      if (deletionButton) {
        deletionButton.addEventListener('click', function () { openDeletionDialog(quest); });
      }
    }

    Promise.all([fetchApiQuests(), fetchVotes()]).then(function (results) {
      var list = results[0] || [];
      var approved = list.filter(function (q) { return !q.proposed; });
      var pending = list.filter(function (q) { return q.proposed; });
      var pool = approved.length ? approved.concat(pending) : QUESTS.concat(pending);
      render(pool.find(function (q) { return q.id === id; }) || null);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('questBoard')) initBoard();
    if (document.getElementById('questDetail')) initDetail();
    if (document.getElementById('questProposalForm') && !document.getElementById('questBoard')) {
      setupQuestProposalForm();
    }
  });
})();
