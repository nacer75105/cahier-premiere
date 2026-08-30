/* =====================================================================
   Service worker — permet de travailler sans connexion.
   ---------------------------------------------------------------------
   Stratégie volontairement simple, adaptée au contenu :
   - la page et les polices sont mises en cache et servies depuis le cache
     dès qu'elles y sont (le cours ne change qu'à un redéploiement) ;
   - tout ce qui commence par /api/ n'est JAMAIS mis en cache : ce sont
     des appels à Claude et la progression, qui doivent rester frais.
   ===================================================================== */

const VERSION = "cahier-v1";
const ESSENTIELS = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(ESSENTIELS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((noms) =>
        Promise.all(noms.filter((n) => n !== VERSION).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Les appels au serveur ne passent jamais par le cache.
  if (url.pathname.startsWith("/api/")) return;
  if (e.request.method !== "GET") return;

  // La page elle-même : on tente le réseau d'abord pour avoir la dernière
  // version, et on retombe sur le cache si la connexion manque.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copie = r.clone();
          caches.open(VERSION).then((c) => c.put("./index.html", copie));
          return r;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }

  // Le reste (polices, styles) : cache d'abord, réseau en secours.
  e.respondWith(
    caches.match(e.request).then(
      (enCache) =>
        enCache ||
        fetch(e.request).then((r) => {
          if (r && r.status === 200 && r.type === "basic") {
            const copie = r.clone();
            caches.open(VERSION).then((c) => c.put(e.request, copie));
          }
          return r;
        }),
    ),
  );
});
