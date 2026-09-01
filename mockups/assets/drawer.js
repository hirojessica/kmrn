// モバイルドロワーメニュー開閉（全ページ共通）
// Shopify実装時は header セクションの JS として移植する
(function () {
  var drawer = document.getElementById('drawer');
  var burger = document.querySelector('[data-drawer-open]');
  if (!drawer || !burger) return;

  function setOpen(open) {
    drawer.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', function () { setOpen(true); });
  drawer.querySelectorAll('[data-drawer-close]').forEach(function (el) {
    el.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();
