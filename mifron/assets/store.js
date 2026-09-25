/* Mifron Store
   商品カタログの表示と購入導線の制御。
   決済ページは assets/config.js で有効化され、未設定の間は購入ボタンを表示しない。
   CSP(script-src 'self')に適合させるため外部ロジックを持たない。 */
(function () {
  'use strict';

  var COLORS = [
    { id: 'black', hex: '#000000', label: '黒' },
    { id: 'dark_blue', hex: '#0000AA', label: '濃い青' },
    { id: 'dark_green', hex: '#00AA00', label: '濃い緑' },
    { id: 'dark_aqua', hex: '#00AAAA', label: '濃い水色' },
    { id: 'dark_red', hex: '#AA0000', label: '濃い赤' },
    { id: 'dark_purple', hex: '#AA00AA', label: '濃い紫' },
    { id: 'gold', hex: '#FFAA00', label: '金' },
    { id: 'gray', hex: '#AAAAAA', label: '灰色' },
    { id: 'dark_gray', hex: '#555555', label: '濃い灰色' },
    { id: 'blue', hex: '#5555FF', label: '青' },
    { id: 'green', hex: '#55FF55', label: '緑' },
    { id: 'aqua', hex: '#55FFFF', label: '水色' },
    { id: 'red', hex: '#FF5555', label: '赤' },
    { id: 'light_purple', hex: '#FF55FF', label: '桃色' },
    { id: 'yellow', hex: '#FFFF55', label: '黄色' },
    { id: 'white', hex: '#FFFFFF', label: '白' }
  ];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function renderPalette() {
    var grid = document.getElementById('colorPalette');
    if (!grid) return;
    grid.innerHTML = COLORS.map(function (color) {
      return '<div class="palette-chip">' +
        '<span class="swatch swatch-' + esc(color.id) + '" aria-hidden="true"></span>' +
        '<b>' + esc(color.label) + '</b>' +
        '<small>' + esc(color.id) + '</small>' +
        '</div>';
    }).join('');
  }

  function isEnabled(links) {
    var url = links.mifronStorePage || links.mifronSupportPage;
    return typeof url === 'string' && /^https:\/\//i.test(url) ? url : '';
  }

  function checkoutUrl(base, product, products) {
    if (products && typeof products[product] === 'string' && /^https:\/\//i.test(products[product])) {
      return products[product];
    }
    var separator = base.indexOf('?') === -1 ? '?' : '&';
    return base + separator + 'product=' + encodeURIComponent(product);
  }

  function initStore() {
    renderPalette();

    var links = window.SITE_LINKS || {};
    var enabled = isEnabled(links);
    var products = links.mifronStoreProducts;

    document.querySelectorAll('[data-buy]').forEach(function (button) {
      if (!enabled) {
        button.hidden = true;
        return;
      }
      button.hidden = false;
      button.href = checkoutUrl(enabled, button.dataset.buy, products);
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
      button.removeAttribute('aria-disabled');
    });

    document.querySelectorAll('[data-store-pending]').forEach(function (node) {
      node.hidden = !!enabled;
    });
  }

  document.addEventListener('DOMContentLoaded', initStore);
})();