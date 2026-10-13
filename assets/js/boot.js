/* Roda antes da página aparecer (carregado sem defer no <head>). */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  /* Anti-clickjacking: o GitHub Pages não permite enviar X-Frame-Options nem
     "frame-ancestors", então se o site for aberto dentro de um <iframe> de
     outro domínio, a página fica oculta e tentamos abrir o site de verdade. */
  if (window.self !== window.top) {
    root.classList.add('is-framed');
    try { window.top.location.replace(window.self.location.href); } catch (e) { /* bloqueado pelo sandbox: segue oculta */ }
  }
})();
