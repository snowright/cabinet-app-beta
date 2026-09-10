// cabinet. service worker
// Strategy:
//   - App shell (same-origin GET): network-first, cache as offline fallback only.
//   - Everything else (Supabase, other origins, non-http schemes): never intercept.
//   - Never cache non-OK responses. Never cache non-GET. Never cache API/auth calls.
// Bump CACHE on every meaningful change so old clients auto-update.
const CACHE = "cabinet-v2";
const PRECACHE = ["/", "/index.html"];

// Hosts we must NEVER intercept or cache — always hit the live network.
const BYPASS_HOSTS = [
  "supabase.co",
  "supabase.in",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;

  // 1. Only handle GET. Let POST/PUT/etc. (incl. all auth mutations) pass through.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 2. Only ever touch http/https. Skip chrome-extension:, data:, etc.
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // 3. Never intercept Supabase (auth + data must always be live and fresh).
  if (BYPASS_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith("." + h))) {
    return;
  }

  // 4. Never intercept cross-origin requests (fonts, CDNs, analytics, etc.).
  //    Let the browser handle its own caching for those.
  if (url.origin !== self.location.origin) return;

  // 5. Same-origin app shell: network-first, fall back to cache only if offline.
  e.respondWith(
    fetch(req)
      .then((res) => {
        // Only cache genuine successes. Never cache errors/opaque/partial responses.
        if (res && res.ok && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      })
      .catch(async () => {
        // Offline fallback. If the exact request isn't cached, serve the app shell
        // so navigations still render instead of a browser error page.
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          const shell = await caches.match("/index.html");
          if (shell) return shell;
        }
        // Nothing cached — let the failure surface to the app's own error handling.
        return Response.error();
      })
  );
});
