/* App: deixa o site ser instalado no celular como um aplicativo
   (ícone na tela inicial, abre em tela cheia e até sem internet). */
(function () {
  'use strict';
  if (window.top !== window.self) return;

  var root = document.documentElement;
  var ua = navigator.userAgent;
  var ehIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var ehAndroid = /android/i.test(ua);
  var ehRedeSocial = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok/i.test(ua); // navegador de dentro do app, não instala
  var ehApp = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  function ler(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) { /* modo anônimo: segue sem guardar */ }
  }

  /* Service worker: abre rápido e funciona sem internet.
     A CSP exige Trusted Types, então o endereço passa pela política "app", que só aceita o sw.js. */
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      try {
        var url = 'sw.js';
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
          url = window.trustedTypes.createPolicy('app', {
            createScriptURL: function (u) {
              if (u === 'sw.js') return u;
              throw new TypeError('Endereço não permitido: ' + u);
            }
          }).createScriptURL(url);
        }
        navigator.serviceWorker.register(url).catch(function () {});
      } catch (e) { /* sem service worker o site funciona igual, só não abre sem internet */ }
    });
  }

  // Aberto pelo ícone da tela inicial: já é app, não precisa convidar a instalar
  if (ehApp) {
    root.classList.add('is-app');
    return;
  }

  /* ---------- Instalar ---------- */
  var secao = document.getElementById('app');
  var dica = document.getElementById('app-dica');
  var ok = document.getElementById('app-ok');
  var sheet = document.getElementById('instalar');
  var toast = document.getElementById('toast-app');
  var plataforma = ehIOS ? (/CriOS/i.test(ua) ? 'ios-chrome' : 'ios') : ehAndroid ? 'android' : 'pc';
  // Chrome, Edge e Samsung têm botão de instalar automático, mas só o liberam depois que a pessoa
  // toca na página e fica uns 30 segundos nela (regra do navegador)
  var temBotaoAuto = 'onbeforeinstallprompt' in window;
  var abriuEm = Date.now();
  var convite = null; // evento "beforeinstallprompt": quando chega, o botão instala direto

  secao.hidden = false;

  var dicas = {
    pronto: 'Grátis · instala em segundos',
    ios: 'No iPhone: Compartilhar e depois Adicionar à Tela de Início',
    'ios-chrome': 'No Chrome do iPhone: Compartilhar e depois Adicionar à Tela de Início',
    android: 'No menu do navegador: Instalar app',
    pc: 'Funciona no celular e no computador',
    social: 'Abra no navegador (Chrome ou Safari) para instalar'
  };
  function atualizarDica() {
    dica.textContent = ehRedeSocial ? dicas.social : (convite || temBotaoAuto) ? dicas.pronto : dicas[plataforma];
  }
  atualizarDica();

  /* Espera do botão automático (dentro do passo a passo) */
  var auto = sheet.querySelector('[data-auto]');
  var espera = sheet.querySelector('[data-espera]');
  var esperaTitulo = sheet.querySelector('[data-espera-titulo]');
  var esperaTexto = sheet.querySelector('[data-espera-texto]');
  var esperaBarra = sheet.querySelector('[data-espera-barra]');
  var agora = sheet.querySelector('[data-instalar-agora]');
  var timerEspera;

  function esperarBotao() {
    agora.hidden = true;
    espera.hidden = false;
    espera.classList.remove('auto__espera--parou');
    esperaTitulo.textContent = 'Preparando a instalação…';
    esperaTexto.textContent = 'O navegador libera o botão em alguns segundos. Deixe esta tela aberta.';
    var falta = Math.max(4, 32 - (Date.now() - abriuEm) / 1000); // segundos até completar os ~30 s
    esperaBarra.style.animation = 'none';
    void esperaBarra.offsetWidth; // reinicia a barrinha
    esperaBarra.style.animation = 'encher ' + falta + 's linear forwards';
    clearTimeout(timerEspera);
    timerEspera = setTimeout(function () {
      espera.classList.add('auto__espera--parou');
      esperaTitulo.textContent = 'O botão não apareceu desta vez';
      esperaTexto.textContent = 'Se o app já estiver instalado, procure o ícone Giovanna Pet na tela inicial. Se não, siga o passo a passo abaixo.';
    }, (falta + 8) * 1000);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); // usamos o nosso botão no lugar da faixa padrão do navegador
    convite = e;
    atualizarDica();
    // se o passo a passo estiver aberto esperando, aparece o "Instalar agora"
    clearTimeout(timerEspera);
    espera.hidden = true;
    agora.hidden = false;
  });

  function instalado() {
    convite = null;
    secao.querySelector('[data-instalar]').hidden = true;
    dica.hidden = true;
    ok.hidden = false;
    fecharToast(false);
  }
  window.addEventListener('appinstalled', instalado);

  function mostrarPassos() {
    sheet.querySelectorAll('[data-passos]').forEach(function (ol) { ol.hidden = ol.dataset.passos !== plataforma; });
    sheet.querySelectorAll('[data-dica]').forEach(function (p) { p.hidden = p.dataset.dica !== plataforma; });
    sheet.querySelector('[data-social]').hidden = !ehRedeSocial;
    auto.hidden = !temBotaoAuto || ehRedeSocial;
    if (!auto.hidden) esperarBotao();
    sheet.showModal();
  }

  function instalar() {
    if (!convite) return mostrarPassos(); // botão automático ainda não liberado (ou não existe, como no iPhone)
    var e = convite;
    convite = null; // o navegador só deixa usar uma vez
    try {
      e.prompt();
      e.userChoice.then(function (escolha) {
        if (escolha.outcome === 'accepted') instalado();
        else atualizarDica();
      });
    } catch (erro) {
      atualizarDica(); // se o navegador recusar, segue para o passo a passo
      mostrarPassos();
    }
  }

  document.querySelectorAll('[data-instalar]').forEach(function (b) {
    b.addEventListener('click', function () {
      fecharToast(false);
      instalar();
    });
  });
  agora.addEventListener('click', function () {
    sheet.close();
    instalar(); // agora já tem o convite: abre a instalação do navegador
  });
  sheet.querySelectorAll('[data-fechar]').forEach(function (b) {
    b.addEventListener('click', function () { sheet.close(); });
  });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); }); // toque fora fecha
  sheet.addEventListener('close', function () { clearTimeout(timerEspera); });

  /* ---------- Convite (toast): só em boas horas e sem insistir ----------
     1) quando a pessoa volta do WhatsApp depois de chamar a Giovanna
     2) quando é alguém que já chamou a Giovanna numa visita anterior */
  var CHAVE_TOAST = 'giovanna:convite-app';
  var CHAVE_CHAMOU = 'giovanna:chamou';
  var DIAS_SEM_INSISTIR = 10;
  var timerToast;

  function podeConvidar() {
    var ultima = +ler(CHAVE_TOAST) || 0;
    return (convite || ehIOS) && !ehRedeSocial && Date.now() - ultima > DIAS_SEM_INSISTIR * 864e5;
  }
  function abrirToast(titulo) {
    if (!podeConvidar() || !toast.hidden || sheet.open) return;
    document.getElementById('toast-titulo').textContent = titulo;
    toast.hidden = false;
    gravar(CHAVE_TOAST, Date.now());
    clearTimeout(timerToast);
    timerToast = setTimeout(function () { fecharToast(false); }, 15000);
  }
  function fecharToast(animar) {
    clearTimeout(timerToast);
    if (toast.hidden) return;
    if (animar === false) {
      toast.hidden = true;
      return;
    }
    toast.classList.add('toast--saindo');
    setTimeout(function () {
      toast.hidden = true;
      toast.classList.remove('toast--saindo');
    }, 300);
  }
  toast.querySelector('[data-fechar-toast]').addEventListener('click', function () { fecharToast(); });

  // 2) Já chamou antes (lido antes de marcar a visita de hoje)
  var jaChamou = ler(CHAVE_CHAMOU);

  // 1) Tocou num link do WhatsApp e voltou para o site
  var foiAoWhatsApp = false;
  document.addEventListener('click', function (e) {
    if (!e.target.closest('a[href*="wa.me/"]')) return;
    foiAoWhatsApp = true;
    gravar(CHAVE_CHAMOU, Date.now());
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && foiAoWhatsApp) {
      foiAoWhatsApp = false;
      setTimeout(function () { abrirToast('Volte sempre! 🐾'); }, 700);
    }
  });

  if (jaChamou) setTimeout(function () { abrirToast('Oi de novo! 🐾'); }, 6000);
})();
