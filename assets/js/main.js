(function () {
  'use strict';

  var WHATSAPP = '5511982535656';
  var body = document.body;
  var header = document.querySelector('.header');
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('menu');

  /* Ano no rodapé */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* Links de WhatsApp com mensagem pronta para cada serviço */
  document.querySelectorAll('[data-service]').forEach(function (link) {
    var msg = 'Olá, Giovanna! Gostaria de agendar *' + link.dataset.service + '* para o meu pet 🐾';
    link.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    link.setAttribute('aria-label', 'Agendar ' + link.dataset.service + ' pelo WhatsApp');
  });

  /* Cabeçalho com fundo ao rolar */
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Barra de contato do celular: aparece quando os botões do topo saem da tela */
  var bar = document.querySelector('.action-bar');
  var heroActions = document.querySelector('.hero__actions');
  if (bar && heroActions && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-hidden', entries[0].isIntersecting);
    }).observe(heroActions);
  }

  /* Menu do celular */
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  toggle.addEventListener('click', function () {
    setMenu(!body.classList.contains('menu-open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  /* Revelar elementos ao rolar */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');
        io.unobserve(el);
        // depois da entrada, devolve as transições normais (hover) ao elemento
        setTimeout(function () { el.removeAttribute('data-reveal'); }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Destaca no menu a seção visível */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        links.forEach(function (a) {
          var active = a.getAttribute('href') === id;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }
})();
