/* Service worker: faz o site funcionar como app.
   Página, estilos e scripts: busca sempre a versão nova na internet e guarda uma cópia;
   sem sinal, abre a cópia guardada.
   Imagens e fontes: mostra a cópia guardada na hora e atualiza por trás.
   Só precisa mexer aqui se mudar a lista ESSENCIAIS: aí aumente o número do CACHE
   (giovanna-v1 para giovanna-v2) para todo mundo baixar de novo.

   Em caso de invasão: depois de recuperar a conta do GitHub, troque TODO este arquivo por
     self.addEventListener('install', function () { self.skipWaiting(); });
     self.addEventListener('activate', function (e) {
       e.waitUntil(caches.keys().then(function (n) {
         return Promise.all(n.filter(function (k) { return k.indexOf('giovanna-') === 0; }).map(function (k) { return caches.delete(k); }));
       }).then(function () { return self.registration.unregister(); }));
     });
   Em até 24 h todo celular que abrir o site apaga as cópias guardadas. */
'use strict';

// O endereço erikfrvr.github.io é dividido com outros sites (Genival etc.), e o espaço de cópias
// também: este service worker só mexe nas cópias que começam com este prefixo.
var PREFIXO = 'giovanna-';
var CACHE = PREFIXO + 'v1';

// Baixados já na instalação, para o app abrir completo mesmo sem internet
var ESSENCIAIS = [
  './',
  'site.webmanifest',
  'assets/css/style.css',
  'assets/js/boot.js',
  'assets/js/main.js',
  'assets/js/app.js',
  'assets/fonts/nunito-latin.woff2',
  'assets/fonts/satisfy-latin.woff2',
  'assets/img/favicon.svg',
  'assets/img/apple-touch-icon.png',
  'assets/img/giovanna-pet.webp'
];

var INICIO = new URL('./', self.location).href;
var ESPERA_REDE = 3500; // em internet muito lenta, abre a cópia guardada depois disso (ms)

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(ESSENCIAIS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (nomes) {
        return Promise.all(nomes
          .filter(function (nome) { return nome.indexOf(PREFIXO) === 0 && nome !== CACHE; })
          .map(function (nome) { return caches.delete(nome); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  var url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // WhatsApp, mapa etc. seguem direto

  // Uma cópia por arquivo; a página (com ou sem "#servicos", "?utm=..." etc.) fica guardada como o início
  var ehPagina = req.mode === 'navigate' && /\/(index\.html)?$/.test(url.pathname);
  var chave = ehPagina ? INICIO : url.origin + url.pathname;

  if (req.destination === 'image' || req.destination === 'font') {
    e.respondWith(guardadoPrimeiro(e, req, chave));
  } else {
    e.respondWith(redePrimeiro(e, req, chave));
  }
});

function buscarEGuardar(cache, req, chave) {
  return fetch(req).then(function (res) {
    // só guarda resposta completa e do próprio site (nada de redirecionamento ou resposta opaca)
    if (res.ok && res.type === 'basic' && !res.redirected) cache.put(chave, res.clone());
    return res;
  });
}

function redePrimeiro(e, req, chave) {
  return caches.open(CACHE).then(function (cache) {
    var rede = buscarEGuardar(cache, req, chave);
    e.waitUntil(rede.catch(function () {}));

    function guardado() {
      return cache.match(chave).then(function (salvo) { return salvo || rede; });
    }
    if (req.mode !== 'navigate') return rede.catch(guardado);

    // Página: se a internet demorar demais, abre a cópia guardada (a nova fica para a próxima)
    var lenta = new Promise(function (resolve, reject) {
      setTimeout(function () {
        cache.match(chave).then(function (salvo) {
          if (salvo) resolve(salvo);
          else rede.then(resolve, reject);
        });
      }, ESPERA_REDE);
    });
    return Promise.race([rede, lenta]).catch(guardado);
  });
}

function guardadoPrimeiro(e, req, chave) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(chave).then(function (salvo) {
      var rede = buscarEGuardar(cache, req, chave);
      if (!salvo) return rede;
      e.waitUntil(rede.catch(function () {}));
      return salvo;
    });
  });
}
