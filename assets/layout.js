/* Quali House — shared layout module
   Loaded by every page. Exposes window.QH with:
   - injectChrome()  → injects fonts, favicon, tailwind config, global styles, header, footer
   - renderService(id) → renders a full service page from a config
   - init() → wires up scroll-reveal + mobile menu (called automatically)
   Each page sets:
     <html data-active="..."> ex: "accueil" | "prestations" | "aides" | "demarche" | "contact"
     <body data-page="..."> for optional page identifier
     Place an empty <div id="qh-header"></div> and <div id="qh-footer"></div> as anchors,
     or call QH.injectChrome() which inserts them automatically at top/bottom of body.
*/

(function () {
  'use strict';

  /* Logo SVG with explicit width/height attributes baked in — never flashes huge */
  function logoSvg(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true" style="display:block;">
      <circle cx="50" cy="50" r="49" fill="#FFFFFF"/>
      <path d="M30 28 L50 14 L70 28" fill="none" stroke="#2E9444" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>
      <rect x="38.5" y="28" width="23" height="20" fill="none" stroke="#1B3A5C" stroke-width="3.5"/>
      <path d="M50 28 L50 48 M38.5 38 L61.5 38" stroke="#1B3A5C" stroke-width="2.5"/>
      <text x="50" y="63" text-anchor="middle" fill="#1B3A5C" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11.5" letter-spacing="1">QUALI</text>
      <text x="50" y="79" text-anchor="middle" fill="#1B3A5C" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11.5" letter-spacing="1">HOUSE</text>
    </svg>`;
  }
  const LOGO_SVG = logoSvg(48); // back-compat for favicon

  /* ─── Resolve site root from this script's own src (robust for file:// and http://) ─── */
  function siteRoot() {
    // currentScript is null for `defer`d scripts at execution time → fallback to scanning
    const script = document.currentScript
      || Array.from(document.getElementsByTagName('script')).find(s => /assets\/layout\.js/.test(s.getAttribute('src') || ''));
    const src = (script && script.getAttribute('src')) || '';
    // Strip the trailing "assets/layout.js" → what remains is the root prefix ("", "../", "../../"…)
    return src.replace(/assets\/layout\.js(?:\?.*)?$/, '');
  }
  const R = (typeof window.QH_ROOT === 'string') ? window.QH_ROOT : siteRoot();

  /* ─── Reveal the page once styles are ready (critical.css hides body until then) ─── */
  let revealed = false;
  function revealPage() {
    if (revealed) return;
    revealed = true;
    document.body.classList.add('qh-ready');
  }

  /* ─── Inject <head> assets (fonts, tailwind config, styles, favicon) ─── */
  function injectHead() {
    // Fonts
    const fonts = document.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(fonts);

    // Favicon (inline SVG)
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = "data:image/svg+xml;utf8," + encodeURIComponent(LOGO_SVG.replace(/\n\s*/g, ''));
    document.head.appendChild(favicon);

    // Tailwind config (must be set BEFORE the tailwind script runs).
    // We inject the config first, then the script.
    if (!window.tailwind) {
      const cfg = document.createElement('script');
      cfg.textContent = `window.tailwind = { config: { theme: { extend: {
        fontFamily: {
          sans: ['"Plus Jakarta Sans"','system-ui','-apple-system','Segoe UI','sans-serif'],
          mono: ['"JetBrains Mono"','ui-monospace','monospace'],
        },
        colors: {
          canvas:'#0F1115', surface:'#14171C', line:'#1E222A',
          ink:'#F5F6F7', muted:'#8B9099',
          sage:'#A8C0A6', 'sage-deep':'#7B9A7A', frost:'#C5CDD5',
          'brand-green':'#2E9444', 'brand-navy':'#1B3A5C',
        },
        letterSpacing:{ micro:'-0.015em', tightest:'-0.045em' },
      } } } };`;
      document.head.appendChild(cfg);

      const tw = document.createElement('script');
      tw.src = 'https://cdn.tailwindcss.com';
      // Reveal the page (critical.css keeps body hidden) once Tailwind has loaded.
      tw.onload = () => { setTimeout(revealPage, 60); };
      document.head.appendChild(tw);
    }
    // Failsafe: reveal anyway after 1.4 s even if Tailwind never loads (offline, blocked CDN…)
    setTimeout(revealPage, 1400);

    // Global styles
    const style = document.createElement('style');
    style.textContent = `
      :root { color-scheme: dark; }
      html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
      body { background:#0F1115; color:#F5F6F7; font-family:'Plus Jakarta Sans', system-ui, sans-serif; }
      /* Logo sizing — applied synchronously so the SVG never flashes huge before Tailwind loads */
      .qh-logo-nav    { width:44px; height:44px; flex-shrink:0; display:inline-block; }
      .qh-logo-footer { width:52px; height:52px; flex-shrink:0; display:inline-block; }
      .qh-logo-nav svg, .qh-logo-footer svg { width:100%; height:100%; display:block; }
      .grain::before {
        content:""; position:fixed; inset:0; pointer-events:none; z-index:50;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
        opacity:.5; mix-blend-mode:overlay;
      }
      .ambient-glow {
        position:absolute; inset:-10%; pointer-events:none; z-index:0;
        background:
          radial-gradient(40% 35% at 78% 38%, rgba(168,192,166,0.10), transparent 60%),
          radial-gradient(35% 30% at 18% 70%, rgba(168,192,166,0.06), transparent 60%);
        filter:blur(10px); animation:drift 22s ease-in-out infinite alternate;
      }
      @keyframes drift { 0%{transform:translate3d(0,0,0) scale(1)} 100%{transform:translate3d(-2%,1.5%,0) scale(1.05)} }
      [data-reveal] { opacity:0; transform:translate3d(0,14px,0);
        transition:opacity 800ms cubic-bezier(0.16,1,0.3,1), transform 800ms cubic-bezier(0.16,1,0.3,1);
        will-change:transform,opacity; }
      [data-reveal].is-visible { opacity:1; transform:translate3d(0,0,0); }
      [data-reveal][style*="--i"] { transition-delay: calc(var(--i) * 90ms); }
      .cta-glass {
        background:linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        backdrop-filter:blur(14px) saturate(1.1);
        -webkit-backdrop-filter:blur(14px) saturate(1.1);
        border:1px solid rgba(255,255,255,0.10);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.25), 0 1px 0 rgba(0,0,0,0.5), 0 14px 40px -16px rgba(168,192,166,0.28);
        transition: transform 260ms cubic-bezier(0.16,1,0.3,1), box-shadow 260ms ease;
      }
      .cta-glass:hover {
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.25), 0 1px 0 rgba(0,0,0,0.5), 0 18px 56px -14px rgba(168,192,166,0.42);
      }
      .cta-glass:active { transform: translateY(1px) scale(0.992); }
      .marquee-track { animation: marquee 42s linear infinite; }
      @keyframes marquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
      .field { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); transition: border-color 200ms ease, background 200ms ease; }
      .field:focus { outline: none; border-color: rgba(168,192,166,0.55); background: rgba(168,192,166,0.04); box-shadow: 0 0 0 4px rgba(168,192,166,0.08); }
      .photo-treat { filter: saturate(0.85) contrast(1.04) brightness(0.92); }
      .has-mega { position: relative; }
      .has-mega .mega {
        position: absolute; top: calc(100% + 14px); left: 50%; transform: translate(-50%, 6px);
        opacity: 0; visibility: hidden;
        transition: opacity 220ms ease, transform 260ms cubic-bezier(0.16,1,0.3,1);
        width: min(980px, 92vw); z-index: 60;
        /* Opaque dark surface — not glass — so menu reads cleanly over any background */
        background:#16191F;
        border:1px solid rgba(255,255,255,0.08);
        border-radius:20px;
        box-shadow: 0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.3);
      }
      .has-mega:hover .mega, .has-mega:focus-within .mega { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
      .has-mega::after { content:""; position:absolute; left:0; right:0; top:100%; height:22px; }
      #qh-mobile-menu { transform: translateY(-12px); opacity: 0; pointer-events: none;
        transition: transform 280ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease; }
      #qh-mobile-menu.is-open { transform: translateY(0); opacity: 1; pointer-events: auto; }
      .nav-link[aria-current="page"] { color:#A8C0A6; }
      ::selection { background: rgba(168,192,166,0.35); color:#fff; }
    `;
    document.head.appendChild(style);
  }

  /* ─── HEADER ─── */
  function headerHTML(active) {
    const linkClass = (key) => `nav-link px-3 py-2 rounded-lg text-muted hover:text-ink transition-colors` + (active === key ? '' : '');
    const aria = (key) => active === key ? 'aria-current="page"' : '';
    return `
    <div class="mx-auto max-w-[1400px] px-4 md:px-10 mt-4">
      <nav class="cta-glass rounded-2xl px-3 md:px-5 h-16 flex items-center justify-between" aria-label="Navigation principale">

        <a href="${R}index.html" class="flex items-center gap-3 shrink-0" aria-label="Accueil Quali House" style="line-height:0;">
          ${logoSvg(44)}
        </a>

        <ul class="hidden lg:flex items-center gap-1 text-[13.5px]">
          <li><a class="${linkClass('accueil')}" ${aria('accueil')} href="${R}index.html">Accueil</a></li>

          <li class="has-mega">
            <a class="nav-link px-3 py-2 rounded-lg text-muted hover:text-ink transition-colors inline-flex items-center gap-1.5 ${active==='prestations'?'text-ink':''}" ${aria('prestations')} href="${R}prestations/index.html">
              Nos prestations
              <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </a>
            <div class="mega cta-glass rounded-2xl p-6" role="menu">
              <div class="grid grid-cols-2 md:grid-cols-5 gap-5">
                ${megaCol('Pompe à chaleur', 'M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4', [
                  ['PAC air-eau','prestations/pompe-a-chaleur/air-eau.html'],
                  ['PAC air-air','prestations/pompe-a-chaleur/air-air.html'],
                  ['PAC eau-eau','prestations/pompe-a-chaleur/eau-eau.html'],
                ])}
                ${megaCol('Chaudière', 'M5 4h14v16H5z M9 9h6M9 13h6M9 17h3', [
                  ['À granulés','prestations/chaudiere/granules.html'],
                  ['Bois','prestations/chaudiere/bois.html'],
                  ['Fioul','prestations/chaudiere/fioul.html'],
                ])}
                ${megaCol('Eau chaude', 'M12 3c-3 5-6 8-6 12a6 6 0 0 0 12 0c0-4-3-7-6-12z', [
                  ['Ballon thermodynamique','prestations/eau-chaude/ballon-thermodynamique.html'],
                  ['Ballon solaire','prestations/eau-chaude/ballon-solaire.html'],
                  ['Système solaire combiné','prestations/eau-chaude/systeme-solaire-combine.html'],
                  ['Ballon électrique','prestations/eau-chaude/ballon-electrique.html'],
                ])}
                ${megaCol('Isolation & rénovation', 'M3 21V8l9-5 9 5v13 M9 21v-8h6v8', [
                  ['Isolation intérieure','prestations/isolation-renovation/isolation-interieure.html'],
                  ['Isolation extérieure','prestations/isolation-renovation/isolation-exterieure.html'],
                  ['Rénovation — maison','prestations/isolation-renovation/renovation-maison.html'],
                  ['Rénovation — appartement','prestations/isolation-renovation/renovation-appartement.html'],
                ])}
                ${megaCol('VMC', 'circle:12,12,8 M12 4v16M4 12h16', [
                  ['VMC simple flux','prestations/vmc/simple-flux.html'],
                  ['VMC double flux','prestations/vmc/double-flux.html'],
                ])}
              </div>
              <div class="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                <p class="text-[12.5px] text-muted">Toutes nos prestations sont éligibles aux aides de l'État.</p>
                <a href="${R}contact.html" class="text-[12.5px] text-sage hover:text-ink transition-colors inline-flex items-center gap-1.5">
                  Calculer mes aides
                  <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
              </div>
            </div>
          </li>

          <li><a class="${linkClass('aides')}" ${aria('aides')} href="${R}aides.html">Aides financières</a></li>
          <li><a class="${linkClass('demarche')}" ${aria('demarche')} href="${R}demarche.html">Notre démarche</a></li>
          <li><a class="${linkClass('contact')}" ${aria('contact')} href="${R}contact.html">Contact</a></li>
        </ul>

        <div class="flex items-center gap-2">
          <a href="${R}contact.html#eligibilite" class="hidden md:inline-flex text-[13px] tracking-micro items-center gap-2 px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-sage/40 hover:text-sage transition-colors">
            <span class="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"></span>
            Calculer mes aides
          </a>
          <button id="qh-menu-toggle" class="lg:hidden grid place-items-center w-10 h-10 rounded-lg border border-white/10" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="qh-mobile-menu">
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.6"><path id="qh-icon-bars" d="M4 7h16M4 12h16M4 17h16"/><path id="qh-icon-x" class="hidden" d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
      </nav>

      <div id="qh-mobile-menu" class="lg:hidden mt-3 cta-glass rounded-2xl p-5">
        <ul class="space-y-1 text-[14.5px]">
          <li><a class="block py-2 text-muted hover:text-ink" href="${R}index.html">Accueil</a></li>
          <li>
            <details class="group">
              <summary class="flex items-center justify-between py-2 cursor-pointer list-none">
                <span class="text-muted group-open:text-ink">Nos prestations</span>
                <svg viewBox="0 0 24 24" class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 9l6 6 6-6"/></svg>
              </summary>
              <div class="mt-2 pl-3 border-l border-white/[0.06] space-y-3 text-[13.5px]">
                ${mobileCat('Pompe à chaleur', [
                  ['PAC air-eau','prestations/pompe-a-chaleur/air-eau.html'],
                  ['PAC air-air','prestations/pompe-a-chaleur/air-air.html'],
                  ['PAC eau-eau','prestations/pompe-a-chaleur/eau-eau.html'],
                ])}
                ${mobileCat('Chaudière', [
                  ['Granulés','prestations/chaudiere/granules.html'],
                  ['Bois','prestations/chaudiere/bois.html'],
                  ['Fioul','prestations/chaudiere/fioul.html'],
                ])}
                ${mobileCat('Eau chaude', [
                  ['Ballon thermodynamique','prestations/eau-chaude/ballon-thermodynamique.html'],
                  ['Ballon solaire','prestations/eau-chaude/ballon-solaire.html'],
                  ['Système solaire combiné','prestations/eau-chaude/systeme-solaire-combine.html'],
                  ['Ballon électrique','prestations/eau-chaude/ballon-electrique.html'],
                ])}
                ${mobileCat('Isolation & rénovation', [
                  ['Isolation intérieure','prestations/isolation-renovation/isolation-interieure.html'],
                  ['Isolation extérieure','prestations/isolation-renovation/isolation-exterieure.html'],
                  ['Rénovation — maison','prestations/isolation-renovation/renovation-maison.html'],
                  ['Rénovation — appartement','prestations/isolation-renovation/renovation-appartement.html'],
                ])}
                ${mobileCat('VMC', [
                  ['Simple flux','prestations/vmc/simple-flux.html'],
                  ['Double flux','prestations/vmc/double-flux.html'],
                ])}
              </div>
            </details>
          </li>
          <li><a class="block py-2 text-muted hover:text-ink" href="${R}aides.html">Aides financières</a></li>
          <li><a class="block py-2 text-muted hover:text-ink" href="${R}demarche.html">Notre démarche</a></li>
          <li><a class="block py-2 text-muted hover:text-ink" href="${R}contact.html">Contact</a></li>
        </ul>
        <a href="${R}contact.html#eligibilite" class="mt-4 inline-flex w-full justify-center items-center gap-2 px-4 py-3 rounded-xl bg-sage/15 border border-sage/30 text-sage text-[14px]">
          Calculer mes aides
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
      </div>
    </div>`;
  }

  function megaCol(label, iconPath, items) {
    const iconSvg = iconPath.startsWith('circle:')
      ? (() => {
          const rest = iconPath.split(' ');
          const [cx,cy,r] = rest[0].replace('circle:','').split(',');
          const tail = rest.slice(1).join(' ');
          return `<svg viewBox="0 0 24 24" class="w-4 h-4 text-sage" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="${cx}" cy="${cy}" r="${r}"/><path d="${tail}"/></svg>`;
        })()
      : `<svg viewBox="0 0 24 24" class="w-4 h-4 text-sage" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="${iconPath}"/></svg>`;
    return `<div>
      <div class="flex items-center gap-2 mb-3">${iconSvg}<span class="text-[12px] uppercase tracking-[0.14em] text-sage">${label}</span></div>
      <ul class="space-y-2 text-[13.5px]">
        ${items.map(([t,h]) => `<li><a href="${R}${h}" class="text-muted hover:text-ink transition-colors">${t}</a></li>`).join('')}
      </ul>
    </div>`;
  }
  function mobileCat(label, items) {
    return `<div>
      <div class="text-[11px] uppercase tracking-[0.14em] text-sage mb-1.5">${label}</div>
      <ul class="space-y-1 text-muted">
        ${items.map(([t,h]) => `<li><a href="${R}${h}">${t}</a></li>`).join('')}
      </ul>
    </div>`;
  }

  /* ─── FOOTER ─── */
  function footerHTML() {
    return `
    <div class="mx-auto max-w-[1400px] px-6 md:px-10 py-14 grid grid-cols-2 md:grid-cols-12 gap-10">
      <div class="col-span-2 md:col-span-5">
        <div class="flex items-center gap-3" style="line-height:0;">
          ${logoSvg(52)}
        </div>
        <p class="mt-5 text-[14px] text-muted leading-relaxed max-w-md">
          Solutions énergétiques performantes, accompagnées et financées grâce aux aides de l'État.<br/>
          Pompes à chaleur, chaudières, eau chaude, isolation, VMC — partout en France.
        </p>
        <ul class="mt-6 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] text-muted font-mono max-w-md">
          <li>RGE QualiPAC</li><li>Qualibat</li>
          <li>Garantie décennale</li><li>Partenaire ANAH</li>
          <li>Mandataire MaPrimeRénov'</li><li>France Rénov' agréé</li>
        </ul>
      </div>
      <div class="md:col-span-3">
        <div class="text-[11.5px] uppercase tracking-[0.16em] text-muted mb-4">Nos prestations</div>
        <ul class="space-y-2.5 text-[14px]">
          <li><a href="${R}prestations/pompe-a-chaleur/index.html" class="text-muted hover:text-sage transition-colors">Pompes à chaleur</a></li>
          <li><a href="${R}prestations/chaudiere/index.html" class="text-muted hover:text-sage transition-colors">Chaudières</a></li>
          <li><a href="${R}prestations/eau-chaude/index.html" class="text-muted hover:text-sage transition-colors">Eau chaude sanitaire</a></li>
          <li><a href="${R}prestations/isolation-renovation/index.html" class="text-muted hover:text-sage transition-colors">Isolation &amp; rénovation</a></li>
          <li><a href="${R}prestations/vmc/index.html" class="text-muted hover:text-sage transition-colors">VMC simple &amp; double flux</a></li>
        </ul>
      </div>
      <div class="md:col-span-2">
        <div class="text-[11.5px] uppercase tracking-[0.16em] text-muted mb-4">Maison</div>
        <ul class="space-y-2.5 text-[14px]">
          <li><a href="${R}index.html" class="text-muted hover:text-sage transition-colors">Accueil</a></li>
          <li><a href="${R}aides.html" class="text-muted hover:text-sage transition-colors">Aides financières</a></li>
          <li><a href="${R}demarche.html" class="text-muted hover:text-sage transition-colors">Notre démarche</a></li>
          <li><a href="${R}contact.html" class="text-muted hover:text-sage transition-colors">Contact</a></li>
        </ul>
      </div>
      <div class="md:col-span-2">
        <div class="text-[11.5px] uppercase tracking-[0.16em] text-muted mb-4">Contact</div>
        <ul class="space-y-2.5 text-[14px]">
          <li><a href="mailto:contact@qualihouse.fr" class="font-mono text-frost hover:text-sage transition-colors">contact@qualihouse.fr</a></li>
          <li class="text-muted">Toute la France</li>
          <li class="text-muted text-[12.5px] mt-3">Lun—Ven · 8h30—19h00</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/[0.05]">
      <div class="mx-auto max-w-[1400px] px-6 md:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[12px] text-muted">
        <div>© 2026 Quali House &middot; Tous droits réservés</div>
        <div class="flex items-center gap-5">
          <a href="${R}mentions-legales.html" class="hover:text-ink transition-colors">Mentions légales</a>
          <a href="${R}cgv.html" class="hover:text-ink transition-colors">CGV</a>
          <a href="${R}confidentialite.html" class="hover:text-ink transition-colors">Confidentialité</a>
        </div>
      </div>
    </div>`;
  }

  /* ─── Re-usable CTA strip ─── */
  function ctaStrip() {
    return `
    <section class="relative py-20 md:py-24 border-t border-white/[0.05]">
      <div class="mx-auto max-w-[1100px] px-6 md:px-10">
        <div class="rounded-3xl border border-sage/20 bg-gradient-to-br from-sage/[0.06] to-transparent p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8" data-reveal>
          <div>
            <div class="text-[11.5px] uppercase tracking-[0.18em] text-sage/80 flex items-center gap-3">
              <span class="w-6 h-px bg-sage/60"></span>Test d'éligibilité
            </div>
            <h3 class="mt-4 text-[28px] md:text-[34px] font-light leading-[1.1] tracking-tightest max-w-[20ch]">
              Calculer mes aides <span class="text-sage italic font-extralight">gratuitement.</span>
            </h3>
            <p class="mt-3 text-[14.5px] text-muted max-w-[50ch]">Cinq questions, un montant chiffré, aucun engagement. Réponse sous 48&thinsp;h ouvrées.</p>
          </div>
          <a href="${R}contact.html#eligibilite" class="cta-glass inline-flex items-center gap-3 pl-6 pr-3 py-3.5 rounded-xl text-[14.5px] tracking-micro font-medium self-start md:self-auto whitespace-nowrap">
            Lancer la simulation
            <span class="grid place-items-center w-9 h-9 rounded-lg bg-sage/15 border border-sage/25">
              <svg viewBox="0 0 24 24" class="w-4 h-4 text-sage" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </a>
        </div>
      </div>
    </section>`;
  }

  /* ─── Skip link ─── */
  function skipLink() {
    return `<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:bg-sage focus:text-canvas focus:rounded-md">Aller au contenu</a>`;
  }

  /* ─── Init: wiring (scroll-reveal + mobile menu + img fallback) ─── */
  function init() {
    // Image error fallback: if any image fails (broken Unsplash etc.), swap to a picsum seed
    document.addEventListener('error', (e) => {
      const el = e.target;
      if (el && el.tagName === 'IMG' && !el.dataset.qhFallback) {
        el.dataset.qhFallback = '1';
        const seed = (el.alt || 'qh').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 50) || 'qh';
        el.src = `https://picsum.photos/seed/${seed}/1600/1200`;
      }
    }, true);

    const els = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && els.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      els.forEach(el => io.observe(el));
    } else {
      els.forEach(el => el.classList.add('is-visible'));
    }

    const btn = document.getElementById('qh-menu-toggle');
    const menu = document.getElementById('qh-mobile-menu');
    const bars = document.getElementById('qh-icon-bars');
    const x = document.getElementById('qh-icon-x');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        bars.classList.toggle('hidden', open);
        x.classList.toggle('hidden', !open);
      });
      menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        menu.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
        bars.classList.remove('hidden'); x.classList.add('hidden');
      }));
    }
  }

  /* ─── Public ─── */
  window.QH = {
    LOGO_SVG,
    R,
    injectChrome(active) {
      injectHead();
      // Insert skip link, header, then keep page content, then footer
      const skip = document.createElement('div'); skip.innerHTML = skipLink();
      document.body.prepend(skip.firstElementChild);
      const header = document.createElement('header');
      header.className = 'fixed top-0 inset-x-0 z-40';
      header.innerHTML = headerHTML(active || (document.documentElement.dataset.active || ''));
      document.body.appendChild(header);
      // Move header to top (after skip link)
      document.body.insertBefore(header, document.body.children[1]);
      const footer = document.createElement('footer');
      footer.className = 'relative border-t border-white/[0.05]';
      footer.innerHTML = footerHTML();
      document.body.appendChild(footer);
      document.body.classList.add('grain', 'antialiased');
    },
    ctaStrip,
    init,
    /* Inject a re-usable certifications marquee */
    certsMarquee() {
      const items = `
        <li class="flex items-center gap-2.5"><span class="w-1.5 h-1.5 rounded-full bg-sage/70"></span><span class="text-frost">RGE QualiPAC</span> <span>— pompes à chaleur</span></li>
        <li class="flex items-center gap-2.5"><span class="w-1.5 h-1.5 rounded-full bg-sage/70"></span><span class="text-frost">Qualibat</span> <span>— isolation</span></li>
        <li class="flex items-center gap-2.5"><span class="w-1.5 h-1.5 rounded-full bg-sage/70"></span><span class="text-frost">Garantie décennale</span></li>
        <li class="flex items-center gap-2.5"><span class="w-1.5 h-1.5 rounded-full bg-sage/70"></span><span class="text-frost">Partenaire ANAH</span></li>
        <li class="flex items-center gap-2.5"><span class="w-1.5 h-1.5 rounded-full bg-sage/70"></span><span class="text-frost">MaPrimeRénov'</span> <span>— mandataire</span></li>
        <li class="flex items-center gap-2.5"><span class="w-1.5 h-1.5 rounded-full bg-sage/70"></span><span class="text-frost">France Rénov'</span> <span>— conseiller agréé</span></li>`;
      return `
      <section class="relative border-y border-white/[0.05] py-7 overflow-hidden" data-reveal>
        <div class="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-canvas to-transparent z-10 pointer-events-none"></div>
        <div class="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none"></div>
        <div class="flex marquee-track w-max">
          <ul class="flex items-center gap-12 px-8 text-[13.5px] tracking-micro text-muted whitespace-nowrap">${items}</ul>
          <ul aria-hidden="true" class="flex items-center gap-12 px-8 text-[13.5px] tracking-micro text-muted whitespace-nowrap">${items}</ul>
        </div>
      </section>`;
    },

    /* ─── Service page renderer ─── */
    services: null,    // populated below
    renderService(id) {
      const cfg = window.QH.services[id];
      if (!cfg) { document.body.innerHTML = '<p style="color:#fff;padding:40px">Service introuvable.</p>'; return; }
      document.title = `${cfg.title} — Quali House`;
      const plainLede = cfg.lede.replace(/<[^>]+>/g, '');
      // Update the existing <meta name="description"> rather than adding a duplicate
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = plainLede;

      // Per-service JSON-LD: Service + BreadcrumbList
      const ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Service",
            "name": cfg.title,
            "serviceType": cfg.categoryLabel,
            "description": plainLede,
            "provider": { "@type": "HVACBusiness", "name": "Quali House", "url": "https://qualihouse.fr" },
            "areaServed": { "@type": "Country", "name": "France" }
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://qualihouse.fr/" },
              { "@type": "ListItem", "position": 2, "name": "Prestations", "item": "https://qualihouse.fr/prestations/index.html" },
              { "@type": "ListItem", "position": 3, "name": cfg.categoryLabel, "item": `https://qualihouse.fr/prestations/${cfg.categorySlug}/index.html` },
              { "@type": "ListItem", "position": 4, "name": cfg.title }
            ]
          }
        ]
      });
      document.head.appendChild(ld);

      const mainEl = document.getElementById('main');
      if (!mainEl) return;

      mainEl.innerHTML = `
        <!-- Hero -->
        <section class="relative min-h-[100dvh] overflow-hidden pt-36 lg:pt-32 pb-20">
          <div class="ambient-glow"></div>
          <div class="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            <div class="lg:col-span-5">
              <nav class="text-[12px] text-muted mb-7 flex items-center gap-2 flex-wrap" data-reveal style="--i:0" aria-label="Fil d'Ariane">
                <a href="${R}index.html" class="hover:text-ink transition-colors">Accueil</a>
                <span class="text-muted/50">/</span>
                <a href="${R}prestations/index.html" class="hover:text-ink transition-colors">Prestations</a>
                <span class="text-muted/50">/</span>
                <a href="${R}prestations/${cfg.categorySlug}/index.html" class="hover:text-ink transition-colors">${cfg.categoryLabel}</a>
                <span class="text-muted/50">/</span>
                <span class="text-frost">${cfg.title}</span>
              </nav>
              <div class="flex items-center gap-3 text-[11.5px] uppercase tracking-[0.18em] text-sage/80" data-reveal style="--i:1">
                <span class="w-6 h-px bg-sage/60"></span>${cfg.categoryLabel}
              </div>
              <h1 class="mt-5 font-light text-[42px] sm:text-[54px] lg:text-[62px] leading-[0.98] tracking-tightest" data-reveal style="--i:2">
                ${cfg.heroTitle}
              </h1>
              <p class="mt-7 text-[16px] md:text-[17px] leading-relaxed text-muted max-w-[52ch]" data-reveal style="--i:3">${cfg.lede}</p>
              <div class="mt-9 flex flex-wrap items-center gap-4" data-reveal style="--i:4">
                <a href="${R}contact.html#eligibilite" class="cta-glass inline-flex items-center gap-3 pl-5 pr-3 py-3 rounded-xl text-[14.5px] tracking-micro font-medium">
                  <span>Calculer mes aides</span>
                  <span class="grid place-items-center w-8 h-8 rounded-lg bg-sage/15 border border-sage/25">
                    <svg viewBox="0 0 24 24" class="w-4 h-4 text-sage" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
                  </span>
                </a>
                <a href="${R}prestations/${cfg.categorySlug}/index.html" class="text-[14px] text-muted hover:text-ink transition-colors inline-flex items-center gap-2 py-3">
                  Voir les autres ${cfg.categoryLabel.toLowerCase()}
                  <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 17L17 7M9 7h8v8"/></svg>
                </a>
              </div>
            </div>
            <div class="lg:col-span-7 relative" data-reveal style="--i:2">
              <div class="relative aspect-[4/5] lg:aspect-[4/5] rounded-[28px] overflow-hidden border border-white/[0.06]">
                <img src="${R}${cfg.image}" alt="${cfg.imageAlt}" class="absolute inset-0 w-full h-full object-cover photo-treat" loading="eager" />
                <div class="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/10 to-transparent"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-canvas/40 via-transparent to-transparent"></div>
                <div class="absolute left-5 bottom-5 md:left-7 md:bottom-7 cta-glass rounded-2xl p-4 md:p-5 max-w-[320px]">
                  <div class="flex items-center gap-2.5">
                    <span class="w-2 h-2 rounded-full bg-sage animate-pulse"></span>
                    <span class="text-[11px] uppercase tracking-[0.14em] text-muted">${cfg.title}</span>
                  </div>
                  <div class="mt-3 grid grid-cols-${cfg.specs.length} gap-3 text-[11px]">
                    ${cfg.specs.map(s => `<div><div class="text-muted uppercase tracking-[0.12em]">${s.label}</div><div class="font-mono ${s.accent?'text-sage':'text-frost'} mt-0.5">${s.value}</div></div>`).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Comment ça fonctionne -->
        <section class="relative py-24 md:py-28 border-t border-white/[0.05]">
          <div class="mx-auto max-w-[1400px] px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div class="lg:col-span-4" data-reveal>
              <div class="text-[11.5px] uppercase tracking-[0.18em] text-sage/80 flex items-center gap-3"><span class="font-mono">01</span><span class="w-6 h-px bg-sage/60"></span>Comment ça fonctionne</div>
              <h2 class="mt-5 font-light text-[30px] md:text-[40px] leading-[1.04] tracking-tightest max-w-[16ch]">${cfg.principleTitle}</h2>
            </div>
            <div class="lg:col-span-8 space-y-7" data-reveal style="--i:1">
              ${cfg.principle.map((p,i) => `
                <div class="grid grid-cols-[auto_1fr] gap-5">
                  <div class="font-mono text-[12px] text-sage/80 pt-1">0${i+1}</div>
                  <div>
                    <h3 class="text-[18px] font-medium tracking-micro">${p.title}</h3>
                    <p class="mt-2 text-[15px] text-muted leading-relaxed max-w-[58ch]">${p.body}</p>
                  </div>
                </div>
              `).join('<div class="rule-sage h-px"></div>')}
            </div>
          </div>
        </section>

        <!-- Avantages -->
        <section class="relative py-24 md:py-28 border-t border-white/[0.05]">
          <div class="mx-auto max-w-[1400px] px-6 md:px-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-14">
              <div class="lg:col-span-4" data-reveal><div class="text-[11.5px] uppercase tracking-[0.18em] text-sage/80 flex items-center gap-3"><span class="font-mono">02</span><span class="w-6 h-px bg-sage/60"></span>Points forts</div></div>
              <div class="lg:col-span-8" data-reveal style="--i:1">
                <h2 class="font-light text-[30px] md:text-[40px] leading-[1.04] tracking-tightest max-w-[22ch]">${cfg.benefitsTitle}</h2>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cfg.benefits.length} gap-px bg-line rounded-2xl overflow-hidden border border-line">
              ${cfg.benefits.map((b,i) => `
                <article class="bg-canvas p-7 md:p-8" data-reveal style="--i:${i}">
                  <div class="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">${String(i+1).padStart(2,'0')}</div>
                  <h3 class="mt-7 text-[20px] font-medium tracking-micro leading-snug">${b.title}</h3>
                  <p class="mt-3 text-[14px] text-muted leading-relaxed">${b.body}</p>
                </article>`).join('')}
            </div>
          </div>
        </section>

        <!-- Specs -->
        ${cfg.specsTable ? `
        <section class="relative py-24 md:py-28 border-t border-white/[0.05]">
          <div class="mx-auto max-w-[1400px] px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div class="lg:col-span-4" data-reveal>
              <div class="text-[11.5px] uppercase tracking-[0.18em] text-sage/80 flex items-center gap-3"><span class="font-mono">03</span><span class="w-6 h-px bg-sage/60"></span>Caractéristiques</div>
              <h2 class="mt-5 font-light text-[30px] md:text-[40px] leading-[1.04] tracking-tightest">${cfg.specsTitle || 'Données techniques.'}</h2>
            </div>
            <div class="lg:col-span-8" data-reveal style="--i:1">
              <dl class="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                ${cfg.specsTable.map(s => `
                  <div class="grid grid-cols-2 gap-8 py-5">
                    <dt class="text-[14.5px] text-muted">${s.label}</dt>
                    <dd class="text-[14.5px] font-mono text-frost text-right md:text-left">${s.value}</dd>
                  </div>
                `).join('')}
              </dl>
            </div>
          </div>
        </section>` : ''}

        <!-- Aides applicables -->
        <section class="relative py-24 md:py-28 border-t border-white/[0.05]">
          <div class="mx-auto max-w-[1400px] px-6 md:px-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
              <div class="lg:col-span-4" data-reveal>
                <div class="text-[11.5px] uppercase tracking-[0.18em] text-sage/80 flex items-center gap-3"><span class="font-mono">04</span><span class="w-6 h-px bg-sage/60"></span>Aides applicables</div>
              </div>
              <div class="lg:col-span-8" data-reveal style="--i:1">
                <h2 class="font-light text-[30px] md:text-[40px] leading-[1.04] tracking-tightest max-w-[22ch]">${cfg.aidesTitle || 'Vos aides cumulables.'}</h2>
                <p class="mt-4 text-[15px] text-muted leading-relaxed max-w-[58ch]">${cfg.aidesIntro || 'Nous montons et déposons le dossier complet pour vous. Vous touchez les aides directement.'}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line rounded-2xl overflow-hidden border border-line">
              ${cfg.aides.map((a,i) => `
                <a href="${R}aides.html" class="bg-canvas p-6 md:p-7 hover:bg-surface/60 transition-colors group" data-reveal style="--i:${i}">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] uppercase tracking-[0.14em] text-sage/80 font-mono">${String(i+1).padStart(2,'0')}</span>
                    ${a.eligible ? '<span class="text-[10.5px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-sage/15 text-sage border border-sage/25">Éligible</span>' : '<span class="text-[10.5px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted border border-white/[0.06]">Non éligible</span>'}
                  </div>
                  <h3 class="mt-6 text-[17px] font-medium tracking-micro group-hover:text-sage transition-colors">${a.name}</h3>
                  <p class="mt-2 text-[13px] text-muted leading-relaxed">${a.note}</p>
                </a>`).join('')}
            </div>
          </div>
        </section>

        ${QH.ctaStrip()}
      `;
    }
  };

  /* ─── Service configs (17 services) ─── */
  // shared aide entries
  const aideAll = {
    mpr: { name: "MaPrimeRénov'", note: 'Versée par l\'État via l\'ANAH. Cumulable, modulée selon vos revenus.', eligible: true },
    cee: { name: 'CEE — Coup de pouce', note: 'Prime énergie des fournisseurs. Cumulable avec MaPrimeRénov\'.', eligible: true },
    tva: { name: 'TVA 5,5 %', note: 'Taux réduit appliqué directement sur le devis (résidence principale).', eligible: true },
    eco: { name: 'Éco-PTZ', note: 'Prêt à taux zéro, jusqu\'à 50 000 € sur 20 ans.', eligible: true },
  };
  const aideAllArray = [aideAll.mpr, aideAll.cee, aideAll.tva, aideAll.eco];

  /* ===========================================================================
     POUR CHANGER LES IMAGES DES PRESTATIONS — c'est ici, et nulle part ailleurs.
     Chaque service ci-dessous a un champ  image: '...'  et  imageAlt: '...'.
     Remplacez l'URL du champ `image` par celle de votre choix (photo réelle de
     vos chantiers idéalement). L'image est automatiquement réutilisée partout :
     page Prestations, hub de catégorie, et fiche détaillée du service.
     Le champ `imageAlt` est la description (accessibilité + SEO).
     Images d'accueil : voir index.html (cartes) — cherchez `images.unsplash`.
     =========================================================================== */
  window.QH.services = {

    'air-eau': {
      categorySlug: 'pompe-a-chaleur', categoryLabel: 'Pompe à chaleur',
      title: 'PAC air-eau',
      heroTitle: `La <span class="text-sage italic font-extralight">PAC air-eau</span>,<br/>le standard du confort.`,
      lede: 'La pompe à chaleur air-eau capte les calories de l\'air extérieur et les transmet à votre circuit de chauffage central — radiateurs ou plancher chauffant — et à votre eau chaude sanitaire. Une seule machine, deux usages.',
      image: 'assets/images/air-eau.png',
      imageAlt: 'Unité extérieure de pompe à chaleur air-eau installée le long d\'un mur de maison contemporaine',
      specs: [{label:'COP moyen',value:'4,2'},{label:'dB(A)',value:'35'},{label:'Classe',value:'A++',accent:true}],
      principleTitle: 'Un cycle thermodynamique simple.',
      principle: [
        { title:'Captation des calories', body:'L\'unité extérieure aspire l\'air ambiant — même à -15 °C — et en extrait l\'énergie thermique via un fluide frigorigène (R32 nouvelle génération).' },
        { title:'Compression & élévation', body:'Le fluide est comprimé, sa température monte. Un échangeur transfère cette chaleur à l\'eau de votre circuit de chauffage.' },
        { title:'Distribution dans le logement', body:'L\'eau chaude alimente vos radiateurs basse température, votre plancher chauffant et votre ballon ECS. Le fluide retourne capter de nouvelles calories.' },
      ],
      benefitsTitle: 'Quatre raisons concrètes de choisir l\'air-eau.',
      benefits: [
        { title:'Jusqu\'à 60 % d\'économies', body:'Pour 1 kWh consommé, jusqu\'à 4,2 kWh restitués. Le rendement le plus élevé du marché grand public.' },
        { title:'Compatible existant', body:'S\'adapte sur la plupart des installations à eau chaude — pas besoin de tout casser.' },
        { title:'Chauffage + ECS', body:'Une seule machine remplace chaudière et chauffe-eau. Encombrement et entretien divisés par deux.' },
        { title:'100 % éligible aux aides', body:'MaPrimeRénov\', CEE, TVA 5,5 %, Éco-PTZ — toutes les aides s\'appliquent.' },
      ],
      specsTitle: 'Données techniques de référence.',
      specsTable: [
        {label:'Plage de fonctionnement',value:'-25 °C → +35 °C'},
        {label:'Coefficient de performance (COP)',value:'4,2 à 5,1 selon conditions'},
        {label:'SCOP (saisonnier)',value:'4,5 — Classe A+++'},
        {label:'Fluide frigorigène',value:'R32 (PRG 675)'},
        {label:'Niveau sonore extérieur',value:'35 à 42 dB(A)'},
        {label:'Puissance disponible',value:'4 à 16 kW'},
        {label:'Garantie pièces & main d\'œuvre',value:'5 ans + décennale'},
      ],
      aides: aideAllArray,
    },

    'air-air': {
      categorySlug: 'pompe-a-chaleur', categoryLabel: 'Pompe à chaleur',
      title: 'PAC air-air',
      heroTitle: `La <span class="text-sage italic font-extralight">PAC air-air</span>,<br/>chauffage &amp; climatisation.`,
      lede: 'La pompe à chaleur air-air diffuse directement de l\'air chaud ou froid dans vos pièces via des unités intérieures (splits). Réversible, elle remplace chauffage électrique et climatisation en une seule installation.',
      image: 'assets/images/air-air.png',
      imageAlt: 'Split mural de pompe à chaleur réversible discrètement intégré dans un séjour',
      specs: [{label:'COP moyen',value:'3,8'},{label:'dB(A) intérieur',value:'19'},{label:'Réversible',value:'Oui',accent:true}],
      principleTitle: 'L\'air, transformé directement.',
      principle: [
        { title:'Captation extérieure', body:'L\'unité extérieure capte les calories (ou les évacue en mode clim) de l\'air ambiant via un fluide frigorigène.' },
        { title:'Échange par split', body:'Chaque split intérieur souffle directement l\'air conditionné dans la pièce. Pas de circuit d\'eau, pas de radiateur.' },
        { title:'Pilotage pièce par pièce', body:'Chaque split est indépendant. Vous chauffez/climatisez exactement les pièces utilisées, depuis votre téléphone.' },
      ],
      benefitsTitle: 'Chauffage et climatisation, en un seul équipement.',
      benefits: [
        { title:'Mise en route immédiate', body:'L\'air souffle en moins de 60 secondes après allumage — idéal pour les résidences secondaires.' },
        { title:'Réversibilité été/hiver', body:'Chauffe l\'hiver, rafraîchit l\'été. Pas besoin d\'une clim séparée.' },
        { title:'Pose simple, sans gros œuvre', body:'Aucun circuit hydraulique à modifier. Installation en 1 journée pour un appartement.' },
        { title:'Pilotage individuel', body:'Chaque pièce a sa propre consigne. Confort sur mesure, économies à la clé.' },
      ],
      specsTable: [
        {label:'Plage de fonctionnement',value:'-15 °C → +43 °C'},
        {label:'COP / EER',value:'3,8 / 4,0'},
        {label:'SCOP (saisonnier)',value:'4,0 — Classe A++'},
        {label:'Fluide frigorigène',value:'R32'},
        {label:'Niveau sonore intérieur',value:'19 à 26 dB(A)'},
        {label:'Configuration',value:'Mono, bi, tri ou multi-splits'},
        {label:'Garantie',value:'5 ans pièces & main d\'œuvre'},
      ],
      aides: [
        { name:"MaPrimeRénov'", note:'Non éligible — la PAC air-air n\'est pas reconnue comme chauffage principal.', eligible:false },
        aideAll.cee,
        aideAll.tva,
        { name:'Éco-PTZ', note:'Non éligible seule. Possible dans un bouquet de travaux.', eligible:false },
      ],
    },

    'eau-eau': {
      categorySlug: 'pompe-a-chaleur', categoryLabel: 'Pompe à chaleur',
      title: 'PAC eau-eau (géothermie)',
      heroTitle: `La <span class="text-sage italic font-extralight">PAC eau-eau</span>,<br/>le rendement maximal.`,
      lede: 'La pompe à chaleur géothermique capte les calories dans la nappe phréatique ou le sous-sol. Stabilité thermique exceptionnelle, COP supérieur à 5, durée de vie record. La solution premium pour les terrains qui s\'y prêtent.',
      image: 'assets/images/eau-eau.png',
      imageAlt: 'Éoliennes au coucher du soleil, énergie renouvelable et géothermie',
      specs: [{label:'COP moyen',value:'5,2',accent:true},{label:'Stabilité',value:'10 °C'},{label:'Durée de vie',value:'+25 ans'}],
      principleTitle: 'L\'énergie stable du sous-sol.',
      principle: [
        { title:'Captage horizontal ou vertical', body:'Sondes enterrées à 0,8 m (horizontal) ou jusqu\'à 100 m (vertical) selon le terrain. La température du sol est stable toute l\'année.' },
        { title:'Échangeur thermique', body:'Un fluide caloporteur circule dans les sondes, récupère les calories du sol et les transmet à la PAC.' },
        { title:'Distribution & ECS', body:'L\'énergie alimente plancher chauffant, radiateurs basse température et eau chaude. Le rendement reste constant — même en hiver glacial.' },
      ],
      benefitsTitle: 'Le rendement le plus stable du marché.',
      benefits: [
        { title:'COP supérieur à 5', body:'Pour 1 kWh consommé, plus de 5 kWh restitués. Le sol ne gèle jamais.' },
        { title:'Indépendance climatique', body:'Performance constante quelle que soit la température extérieure, contrairement à l\'air-eau.' },
        { title:'Silence absolu', body:'Pas d\'unité extérieure bruyante. Tout est enterré ou intégré au bâti.' },
        { title:'Longévité record', body:'Sondes garanties 50 ans, compresseur 25+ ans. ROI sur le long terme.' },
      ],
      specsTable: [
        {label:'Captage',value:'Horizontal 0,8 m / Vertical 80-100 m'},
        {label:'COP',value:'5,0 à 5,5'},
        {label:'SCOP',value:'5,2 — Classe A+++'},
        {label:'Surface de capteur (horizontal)',value:'1,5 × surface habitable'},
        {label:'Puissance',value:'6 à 25 kW'},
        {label:'Étude de sol',value:'Indispensable — incluse'},
        {label:'Garantie',value:'5 ans matériel · 10 ans décennale · 50 ans sondes'},
      ],
      aides: aideAllArray,
    },

    'granules': {
      categorySlug: 'chaudiere', categoryLabel: 'Chaudière',
      title: 'Chaudière à granulés',
      heroTitle: `La <span class="text-sage italic font-extralight">chaudière à granulés</span>,<br/>biomasse haut rendement.`,
      lede: 'La chaudière à granulés de bois (pellets) brûle un combustible local et renouvelable avec un rendement supérieur à 90 %. Alimentation automatique, programmation hebdomadaire — le confort d\'une chaudière fioul, l\'empreinte d\'un mode de vie sobre.',
      image: 'assets/images/granule.png',
      imageAlt: 'Granulés de bois (pellets) prêts à alimenter une chaudière biomasse',
      specs: [{label:'Rendement',value:'94 %',accent:true},{label:'Autonomie',value:'7-15 j'},{label:'CO₂',value:'Neutre'}],
      principleTitle: 'Le bois, version automatique.',
      principle: [
        { title:'Stockage & alimentation', body:'Les pellets sont stockés dans un silo (sac, textile ou maçonné). Une vis sans fin ou un système pneumatique les achemine automatiquement à la chaudière.' },
        { title:'Combustion optimisée', body:'La chambre de combustion régule l\'arrivée d\'air et de pellets pour un rendement constant supérieur à 90 %, avec très peu de cendres.' },
        { title:'Distribution & régulation', body:'La chaleur alimente le circuit hydraulique existant. La chaudière modulée selon la demande — comme une chaudière gaz.' },
      ],
      benefitsTitle: 'Biomasse, sans la contrainte du bois bûches.',
      benefits: [
        { title:'Combustible 100 % renouvelable', body:'Pellets issus de résidus de scieries. Filière locale, bilan carbone neutre.' },
        { title:'Autonomie complète', body:'Programmation, allumage automatique, cendrier à vider 1 fois/mois. Pas de manipulation quotidienne.' },
        { title:'Aides maximales', body:'MaPrimeRénov\' bonifiée pour le remplacement d\'une chaudière fioul ou gaz.' },
        { title:'Compatible installation existante', body:'Se raccorde sur votre circuit de chauffage central actuel.' },
      ],
      specsTable: [
        {label:'Rendement saisonnier',value:'92 à 96 %'},
        {label:'Puissance',value:'8 à 40 kW'},
        {label:'Combustible',value:'Pellets DIN+ ou EN+A1'},
        {label:'Consommation moyenne',value:'2 à 4 t/an (maison 120 m²)'},
        {label:'Volume silo recommandé',value:'4 à 8 m³'},
        {label:'Évacuation des cendres',value:'1 à 2 fois/mois'},
        {label:'Garantie',value:'5 ans pièces & décennale'},
      ],
      aides: aideAllArray,
    },

    'bois': {
      categorySlug: 'chaudiere', categoryLabel: 'Chaudière',
      title: 'Chaudière bois bûches',
      heroTitle: `La <span class="text-sage italic font-extralight">chaudière à bûches</span>,<br/>l'authenticité du bois.`,
      lede: 'La chaudière bois bûches utilise du bois fendu traditionnel. Combustible le moins cher du marché, expérience artisanale, autonomie réelle. Pensée pour les foyers avec accès à du bois local.',
      image: 'assets/images/bois.png',
      imageAlt: 'Bûches de bois soigneusement empilées pour chaudière à bûches',
      specs: [{label:'Rendement',value:'88 %'},{label:'Autonomie',value:'12-48 h'},{label:'€/kWh',value:'~0,04',accent:true}],
      principleTitle: 'Combustion à double étage.',
      principle: [
        { title:'Chargement manuel', body:'Vous chargez le foyer en bûches (généralement 50 cm) une à deux fois par jour selon la saison.' },
        { title:'Gazéification', body:'Le bois est d\'abord pyrolysé. Les gaz produits sont brûlés dans un second foyer à très haute température — c\'est ce qui donne le rendement.' },
        { title:'Stockage tampon', body:'Un ballon tampon stocke la chaleur excédentaire pour la restituer pendant les périodes sans rechargement.' },
      ],
      benefitsTitle: 'Le combustible le plus économique.',
      benefits: [
        { title:'Énergie la moins chère', body:'Le bois bûche reste le combustible le moins cher au kWh, surtout si vous avez un accès local.' },
        { title:'Indépendance énergétique', body:'Aucune dépendance aux réseaux gaz, électricité ou aux livraisons.' },
        { title:'Renouvelable & local', body:'Filière française, bilan carbone neutre quand le bois provient d\'une forêt gérée.' },
        { title:'Aides cumulables', body:'MaPrimeRénov\' + CEE pour le remplacement d\'une chaudière fioul, gaz ou électrique.' },
      ],
      specsTable: [
        {label:'Rendement',value:'85 à 92 %'},
        {label:'Puissance',value:'15 à 50 kW'},
        {label:'Combustible',value:'Bûches 33, 50 ou 100 cm'},
        {label:'Ballon tampon requis',value:'500 à 2 000 L'},
        {label:'Rechargement',value:'1 à 3 fois/jour'},
        {label:'Espace stockage bois',value:'15 à 25 m³/an'},
        {label:'Garantie',value:'5 ans pièces & décennale'},
      ],
      aides: aideAllArray,
    },

    'fioul': {
      categorySlug: 'chaudiere', categoryLabel: 'Chaudière',
      title: 'Chaudière fioul — remplacement',
      heroTitle: `Sortez du <span class="text-sage italic font-extralight">fioul</span>,<br/>nous accompagnons la transition.`,
      lede: 'L\'installation neuve de chaudière fioul est interdite depuis juillet 2022. Quali House intervient pour le remplacement (par PAC ou chaudière biomasse), avec des aides bonifiées pour la sortie du fioul.',
      image: 'assets/images/fioul.png',
      imageAlt: 'Ancien local de chaufferie avec cuve fioul, candidate à un remplacement',
      specs: [{label:'Bonus sortie fioul',value:'+1 800 €',accent:true},{label:'Aides totales',value:'70 %'},{label:'Délai',value:'< 6 mois'}],
      principleTitle: 'Trois solutions de remplacement.',
      principle: [
        { title:'PAC air-eau — la plus courante', body:'Remplace directement la chaudière sur le circuit de chauffage existant. Aides maximales, ROI rapide.' },
        { title:'Chaudière biomasse', body:'Granulés ou bûches. Solution idéale si vous avez l\'espace de stockage et un usage important.' },
        { title:'Hybride PAC + chaudière condensation', body:'PAC en base, chaudière gaz/granulés en relève les jours les plus froids. Pour les maisons mal isolées.' },
      ],
      benefitsTitle: 'Sortir du fioul, pourquoi maintenant.',
      benefits: [
        { title:'Prime sortie de fioul', body:'Coup de pouce CEE bonifié + MaPrimeRénov\' renforcée. Jusqu\'à 70 % du chantier financé.' },
        { title:'Pollution divisée par 6', body:'Émissions CO₂ d\'une PAC : 6× inférieures à celles d\'une chaudière fioul équivalente.' },
        { title:'Facture allégée', body:'Le fioul coûte 2 à 3× plus cher au kWh qu\'une PAC. Économies immédiates.' },
        { title:'Dépose cuve incluse', body:'Nous nous occupons du dégazage, nettoyage et évacuation réglementaire de la cuve.' },
      ],
      aides: aideAllArray,
      aidesIntro: 'Le remplacement d\'une chaudière fioul bénéficie de bonus dédiés : Coup de pouce chauffage majoré, MaPrimeRénov\' Sortie passoire, prime régionale dans certains territoires.',
    },

    'ballon-thermodynamique': {
      categorySlug: 'eau-chaude', categoryLabel: 'Eau chaude',
      title: 'Ballon thermodynamique',
      heroTitle: `Le <span class="text-sage italic font-extralight">ballon thermodynamique</span>,<br/>3× moins de consommation.`,
      lede: 'Un ballon thermodynamique intègre une mini-pompe à chaleur qui capte les calories de l\'air ambiant pour chauffer votre eau sanitaire. Consommation divisée par trois par rapport à un cumulus électrique.',
      image: 'assets/images/ballon%20thermodynamique.png',
      imageAlt: 'Ballon thermodynamique vertical installé dans un cellier moderne',
      specs: [{label:'COP',value:'3,2',accent:true},{label:'Capacité',value:'200-300 L'},{label:'Confort',value:'A+'}],
      principleTitle: 'Une PAC dédiée à votre eau chaude.',
      principle: [
        { title:'Captation d\'air', body:'Une mini-PAC en partie haute du ballon aspire l\'air ambiant (garage, buanderie, cellier) et en extrait les calories.' },
        { title:'Transfert au ballon', body:'Les calories sont transférées au ballon d\'eau via un échangeur. L\'air refroidi est rejeté à l\'extérieur ou dans un autre volume.' },
        { title:'Appoint électrique', body:'Une résistance prend le relais en hiver ou en cas de forte demande — utilisée moins de 10 % du temps.' },
      ],
      benefitsTitle: 'L\'ECS qui ne pèse plus sur la facture.',
      benefits: [
        { title:'Économies × 3', body:'Pour 1 kWh consommé, 3 kWh restitués sous forme d\'eau chaude — contre 1 pour un cumulus classique.' },
        { title:'Installation simple', body:'Remplacement direct d\'un cumulus existant en 1/2 journée. Aucune modification du tableau électrique.' },
        { title:'Production fraîcheur', body:'L\'air rejeté est plus frais — bonus appréciable l\'été dans un cellier.' },
        { title:'Aides cumulables', body:'MaPrimeRénov\', CEE et TVA 5,5 % — couverture de 40 à 60 % du coût.' },
      ],
      specsTable: [
        {label:'COP normalisé',value:'3,0 à 3,5'},
        {label:'Capacité',value:'150, 200, 270 ou 300 L'},
        {label:'Volume local minimal',value:'10 à 20 m³ selon modèle'},
        {label:'Température air',value:'5 à 35 °C optimal'},
        {label:'Niveau sonore',value:'42 à 52 dB(A)'},
        {label:'Garantie cuve',value:'5 ans · résistance 2 ans'},
      ],
      aides: aideAllArray,
    },

    'ballon-solaire': {
      categorySlug: 'eau-chaude', categoryLabel: 'Eau chaude',
      title: 'Chauffe-eau solaire',
      heroTitle: `Le <span class="text-sage italic font-extralight">chauffe-eau solaire</span>,<br/>l'eau chaude gratuite.`,
      lede: 'Un chauffe-eau solaire individuel (CESI) couvre 50 à 80 % de vos besoins en eau chaude grâce à 2 à 5 m² de capteurs thermiques sur toiture. Énergie totalement gratuite, à vie.',
      image: 'assets/images/cesi.png',
      imageAlt: 'Capteurs solaires thermiques pour eau chaude sanitaire sur toiture résidentielle',
      specs: [{label:'Couverture',value:'70 %',accent:true},{label:'Capteurs',value:'2-5 m²'},{label:'Durée de vie',value:'+25 ans'}],
      principleTitle: 'Le soleil, capté directement.',
      principle: [
        { title:'Capteurs thermiques en toiture', body:'Des panneaux plans ou tubes sous vide absorbent le rayonnement solaire et chauffent un fluide caloporteur antigel.' },
        { title:'Échange dans le ballon', body:'Le fluide circule jusqu\'à un serpentin dans le ballon. Il y dépose ses calories, puis remonte capter de nouvelles.' },
        { title:'Appoint pour les jours gris', body:'Une résistance électrique, une PAC ou une chaudière prend le relais en hiver — uniquement les jours sans soleil suffisant.' },
      ],
      benefitsTitle: 'Une énergie gratuite, à vie.',
      benefits: [
        { title:'70 % d\'ECS gratuite', body:'En moyenne sur l\'année. Jusqu\'à 100 % en été.' },
        { title:'Énergie 100 % renouvelable', body:'Aucune émission, aucune dépendance énergétique pendant 25 ans.' },
        { title:'Installation polyvalente', body:'Compatible toiture inclinée, terrasse, façade. Orientation sud-est à sud-ouest.' },
        { title:'Aides spécifiques solaire', body:'MaPrimeRénov\' bonifiée pour les énergies renouvelables.' },
      ],
      specsTable: [
        {label:'Surface capteurs',value:'2 à 5 m² selon foyer'},
        {label:'Volume ballon',value:'200 à 400 L'},
        {label:'Couverture solaire annuelle',value:'50 à 80 % (selon région)'},
        {label:'Orientation idéale',value:'Sud ± 45°, inclinaison 30-60°'},
        {label:'Garantie capteurs',value:'10 ans'},
        {label:'Durée de vie',value:'25 à 30 ans'},
      ],
      aides: aideAllArray,
    },

    'systeme-solaire-combine': {
      categorySlug: 'eau-chaude', categoryLabel: 'Eau chaude',
      title: 'Système solaire combiné',
      heroTitle: `Le <span class="text-sage italic font-extralight">SSC</span>,<br/>chauffage + ECS au soleil.`,
      lede: 'Le système solaire combiné assure à la fois le chauffage de votre maison et la production d\'eau chaude sanitaire à partir du rayonnement solaire. Jusqu\'à 60 % des besoins thermiques annuels.',
      image: 'assets/images/ssc.png',
      imageAlt: 'Maison équipée d\'une grande surface de capteurs solaires combinés',
      specs: [{label:'Couverture',value:'60 %',accent:true},{label:'Capteurs',value:'10-20 m²'},{label:'Stockage',value:'+ tampon'}],
      principleTitle: 'Solaire thermique grande surface.',
      principle: [
        { title:'Captage en grande surface', body:'10 à 20 m² de capteurs thermiques fournissent la puissance nécessaire pour le chauffage en plus de l\'ECS.' },
        { title:'Stockage tampon', body:'Un ballon tampon (500 à 1 500 L) stocke la chaleur excédentaire pour la restituer le soir et la nuit.' },
        { title:'Appoint chaudière ou PAC', body:'Une chaudière biomasse ou une PAC complète les besoins en hiver. Le SSC reste pilote en mi-saison.' },
      ],
      benefitsTitle: 'Combine chauffage et ECS, en une installation.',
      benefits: [
        { title:'60 % des besoins thermiques', body:'Chauffage + ECS couverts par le solaire sur l\'année. Reste à charge énergétique divisé par 3.' },
        { title:'Excellente synergie biomasse', body:'Couplé à une chaudière granulés, vous tendez vers l\'autonomie complète en énergie renouvelable.' },
        { title:'Investissement durable', body:'Durée de vie supérieure à 25 ans, entretien minimal après installation.' },
        { title:'Aides combinées', body:'MaPrimeRénov\' + CEE bonifiés, Éco-PTZ jusqu\'à 50 000 €.' },
      ],
      specsTable: [
        {label:'Surface capteurs',value:'10 à 20 m²'},
        {label:'Ballon tampon',value:'500 à 1 500 L'},
        {label:'Couverture chauffage',value:'30 à 50 %'},
        {label:'Couverture ECS',value:'60 à 100 %'},
        {label:'Type capteurs',value:'Plans ou tubes sous vide'},
        {label:'Garantie système',value:'5 ans + décennale'},
      ],
      aides: aideAllArray,
    },

    'ballon-electrique': {
      categorySlug: 'eau-chaude', categoryLabel: 'Eau chaude',
      title: 'Cumulus électrique',
      heroTitle: `Le <span class="text-sage italic font-extralight">cumulus</span>,<br/>simple, fiable, économique à l'achat.`,
      lede: 'Le cumulus électrique reste la solution la plus simple et la moins chère à installer. Quali House intervient pour remplacement à l\'identique, dépannage, ou conseil sur la migration vers un ballon thermodynamique.',
      image: 'assets/images/electrique.png',
      imageAlt: 'Cumulus électrique installé dans un local technique impeccable',
      specs: [{label:'Capacité',value:'100-300 L'},{label:'COP',value:'1,0'},{label:'Coût installation',value:'Faible',accent:true}],
      principleTitle: 'Une résistance, un ballon, c\'est tout.',
      principle: [
        { title:'Résistance immergée', body:'Une résistance électrique chauffe directement l\'eau stockée. La nuit, en heures creuses, pour optimiser le coût.' },
        { title:'Régulation par thermostat', body:'Le thermostat coupe l\'alimentation à la température de consigne (généralement 55-60 °C). Reprend dès que ça baisse.' },
        { title:'Isolation du ballon', body:'Une mousse polyuréthane épaisse limite les déperditions. Le ballon tient la température 24-48 h en cas de coupure.' },
      ],
      benefitsTitle: 'La solution la plus simple.',
      benefits: [
        { title:'Investissement minimal', body:'Achat et installation 3 à 5× moins chers qu\'un thermodynamique. Adapté à un usage modéré.' },
        { title:'Aucune maintenance', body:'Détartrage tous les 5-7 ans, c\'est tout.' },
        { title:'Compatible heures creuses', body:'Programmation sur l\'abonnement HC pour réduire de 30 % la facture d\'ECS.' },
        { title:'Remplacement express', body:'Échange en demi-journée en cas de panne — pas de logement sans eau chaude.' },
      ],
      aides: [
        { name:"MaPrimeRénov'", note:'Non éligible — équipement électrique direct.', eligible:false },
        { name:'CEE', note:'Non éligible pour le cumulus seul.', eligible:false },
        aideAll.tva,
        { name:'Éco-PTZ', note:'Non éligible seul. Intégrable à un bouquet rénovation.', eligible:false },
      ],
      aidesIntro: 'Le cumulus électrique n\'est pas un équipement subventionné. Pour bénéficier d\'aides, nous vous orientons vers le ballon thermodynamique ou solaire.',
    },

    'isolation-interieure': {
      categorySlug: 'isolation-renovation', categoryLabel: 'Isolation & rénovation',
      title: 'Isolation intérieure (ITI)',
      heroTitle: `L'<span class="text-sage italic font-extralight">ITI</span>,<br/>économique et accessible.`,
      lede: 'L\'isolation thermique par l\'intérieur (ITI) consiste à doubler les murs intérieurs avec un isolant. Solution la plus courante en rénovation — adaptée à toutes les configurations, sans toucher à la façade.',
      image: 'assets/images/isolation%20interieur.png',
      imageAlt: 'Pose d\'isolant en laine minérale sur ossature intérieure pendant un chantier',
      specs: [{label:'R',value:'3,7 m²K/W',accent:true},{label:'Épaisseur',value:'12-16 cm'},{label:'Délai',value:'1-3 sem.'}],
      principleTitle: 'Doubler les murs, depuis l\'intérieur.',
      principle: [
        { title:'Diagnostic & calepinage', body:'Audit thermique pour identifier les ponts thermiques, points froids, humidité éventuelle. Choix de l\'isolant adapté.' },
        { title:'Pose sur ossature', body:'Ossature métallique fixée au mur, isolant en panneaux ou rouleaux (laine de roche, de bois, polyuréthane) glissé entre les montants.' },
        { title:'Pare-vapeur & finition', body:'Membrane pare-vapeur étanche à l\'air, puis plaque de plâtre pour finition. Reprises peinture et plinthes incluses.' },
      ],
      benefitsTitle: 'Pourquoi choisir l\'ITI.',
      benefits: [
        { title:'Coût optimisé', body:'30 à 40 % moins cher qu\'une ITE. Aides aidant, reste à charge souvent inférieur à 50 €/m².' },
        { title:'Travaux sans échafaudage', body:'Pas d\'autorisation d\'urbanisme, pas d\'intervention sur la façade — idéal en copro ou maison de caractère.' },
        { title:'Délais courts', body:'Une maison de 100 m² isolée en 2 à 3 semaines. Aménagement séquencé pièce par pièce possible.' },
        { title:'Multiples isolants disponibles', body:'Biosourcé (bois, chanvre, ouate), minéral (roche, verre) ou synthétique — selon performance et budget.' },
      ],
      specsTable: [
        {label:'Résistance R minimale (MaPrimeRénov\')',value:'3,7 m²K/W pour les murs'},
        {label:'Épaisseur typique',value:'12 à 18 cm selon isolant'},
        {label:'Perte de surface habitable',value:'~ 4 % par mur isolé'},
        {label:'Isolants disponibles',value:'Laine de roche, bois, chanvre, ouate, PU'},
        {label:'Garantie',value:'Décennale sur la pose'},
      ],
      aides: aideAllArray,
    },

    'isolation-exterieure': {
      categorySlug: 'isolation-renovation', categoryLabel: 'Isolation & rénovation',
      title: 'Isolation extérieure (ITE)',
      heroTitle: `L'<span class="text-sage italic font-extralight">ITE</span>,<br/>le top de la performance.`,
      lede: 'L\'isolation thermique par l\'extérieur enveloppe votre maison d\'un manteau isolant. Performance énergétique maximale, suppression de quasi tous les ponts thermiques, ravalement de façade inclus. La référence des rénovations ambitieuses.',
      image: 'assets/images/isolation%20exterieur.png',
      imageAlt: 'Échafaudage installé pour un chantier d\'isolation thermique par l\'extérieur',
      specs: [{label:'R',value:'4,4 m²K/W',accent:true},{label:'Ponts thermiques',value:'-95 %'},{label:'Durée',value:'25+ ans'}],
      principleTitle: 'Une enveloppe continue.',
      principle: [
        { title:'Échafaudage & préparation', body:'Mise en place des protections et de l\'échafaudage. Diagnostic des supports, traitement des fissures, dépose des éléments à protéger.' },
        { title:'Pose de l\'isolant', body:'Panneaux fixés par collage et chevillage (polystyrène, laine de roche, fibre de bois). Enveloppe continue sans rupture.' },
        { title:'Sous-enduit, treillis, finition', body:'Application d\'un sous-enduit, treillis de verre, puis enduit de finition décoratif. Bardages possibles pour un rendu architectural.' },
      ],
      benefitsTitle: 'L\'investissement maximal.',
      benefits: [
        { title:'Suppression des ponts thermiques', body:'L\'enveloppe est continue. Plus de murs froids, plus de moisissures aux angles.' },
        { title:'Surface habitable conservée', body:'Contrairement à l\'ITI, l\'isolant est à l\'extérieur. Vous ne perdez aucun mètre carré.' },
        { title:'Ravalement & isolation en une fois', body:'Si votre façade nécessite un ravalement, l\'ITE est l\'occasion idéale — coût mutualisé.' },
        { title:'Plus-value immobilière', body:'Une façade rénovée + une étiquette DPE améliorée peuvent valoriser le bien de 10 à 20 %.' },
      ],
      specsTable: [
        {label:'Résistance R minimale (MaPrimeRénov\')',value:'4,4 m²K/W pour les murs'},
        {label:'Épaisseur typique',value:'14 à 22 cm'},
        {label:'Isolants',value:'Polystyrène, laine de roche, fibre de bois'},
        {label:'Finitions',value:'Enduit minéral, organique, ou bardage'},
        {label:'Autorisation requise',value:'Déclaration préalable de travaux'},
        {label:'Durée chantier (maison 120 m²)',value:'4 à 6 semaines'},
        {label:'Garantie',value:'Décennale système complet'},
      ],
      aides: aideAllArray,
    },

    'renovation-maison': {
      categorySlug: 'isolation-renovation', categoryLabel: 'Isolation & rénovation',
      title: 'Rénovation globale — maison',
      heroTitle: `<span class="text-sage italic font-extralight">Rénovation globale.</span><br/>Une maison transformée.`,
      lede: 'La rénovation globale (parcours MaPrimeRénov\' accompagné) traite plusieurs lots de travaux en une opération coordonnée — isolation, chauffage, ventilation, ECS — pour un saut de 2 classes DPE minimum. Aides maximales, accompagnement obligatoire Mon Accompagnateur Rénov\'.',
      image: 'assets/images/renovation maison.png',
      imageAlt: 'Chantier de rénovation globale d\'une maison individuelle',
      specs: [{label:'Gain DPE',value:'2 classes',accent:true},{label:'Aides',value:'jusqu\'à 70 %'},{label:'Durée',value:'3-6 mois'}],
      principleTitle: 'Un projet, un chef d\'orchestre.',
      principle: [
        { title:'Audit énergétique', body:'État des lieux complet : isolation, chauffage, ventilation, étanchéité. Simulation thermique et plusieurs scénarios chiffrés.' },
        { title:'Plan de travaux coordonné', body:'Sélection des lots prioritaires pour maximiser le gain DPE. Planification des corps d\'état pour limiter la gêne.' },
        { title:'Pilotage Mon Accompagnateur Rénov\'', body:'Quali House intervient en tant qu\'AMOR agréé. Suivi administratif, technique et financier de A à Z.' },
      ],
      benefitsTitle: 'Pourquoi raisonner global.',
      benefits: [
        { title:'Aides bonifiées', body:'MaPrimeRénov\' Parcours accompagné : jusqu\'à 70 % du chantier financé pour les ménages très modestes.' },
        { title:'Performance réelle garantie', body:'Engagement contractuel sur le gain énergétique. Audit avant/après pour valider le résultat.' },
        { title:'Confort transformé', body:'Une rénovation globale change littéralement la sensation d\'habiter. Thermique, acoustique, lumière.' },
        { title:'Plus-value durable', body:'Une maison classe B ou A se vend +15 à +25 % plus cher qu\'une équivalente classée E ou F.' },
      ],
      aides: aideAllArray,
      aidesIntro: 'La rénovation globale ouvre droit au parcours MaPrimeRénov\' Accompagné — le dispositif le plus généreux. Quali House est agréé Mon Accompagnateur Rénov\'.',
    },

    'renovation-appartement': {
      categorySlug: 'isolation-renovation', categoryLabel: 'Isolation & rénovation',
      title: 'Rénovation globale — appartement',
      heroTitle: `<span class="text-sage italic font-extralight">Rénovation appartement.</span><br/>Dans le cadre d'une copro.`,
      lede: 'Rénover un appartement implique de composer avec la copropriété, les parties communes et les règlements d\'urbanisme. Quali House intervient sur les lots privatifs et accompagne les copropriétés sur les opérations collectives.',
      image: 'assets/images/renovation appart.png',
      imageAlt: 'Appartement contemporain entièrement rénové, finitions modernes',
      specs: [{label:'Gain DPE',value:'1-2 classes'},{label:'Délai',value:'4-10 sem.'},{label:'Copro',value:'Acceptée',accent:true}],
      principleTitle: 'Privatif & collectif coordonnés.',
      principle: [
        { title:'Diagnostic privatif', body:'Audit du lot privatif : menuiseries, isolation possible (murs sur cour ou pignon), VMC, équipements ECS/chauffage individuels.' },
        { title:'Coordination syndic', body:'Pour les opérations communes (façade, toiture, VMC collective), nous accompagnons la copropriété — assemblée générale, vote, MOE.' },
        { title:'Travaux séquencés', body:'Pose en chantier propre, dépoussiérage, plages horaires respectueuses du voisinage. Bâche, protections couloir et ascenseur fournies.' },
      ],
      benefitsTitle: 'Spécificités appartement.',
      benefits: [
        { title:'MaPrimeRénov\' Copropriété', body:'Aide collective spécifique aux copros, distincte de la prime individuelle. Cumulable avec votre MPR personnelle.' },
        { title:'Solutions adaptées', body:'PAC air-air discrète, VMC compacte, isolation intérieure des murs donnant sur extérieur ou cage froide.' },
        { title:'Respect du règlement', body:'Toutes les pièces réglementaires (déclaration, autorisation copro) gérées par notre équipe administrative.' },
        { title:'Chantier respectueux', body:'Horaires, propreté, communication voisins — chartes de chantier appliquées à la lettre.' },
      ],
      aides: aideAllArray,
    },

    'simple-flux': {
      categorySlug: 'vmc', categoryLabel: 'VMC',
      title: 'VMC simple flux',
      heroTitle: `La <span class="text-sage italic font-extralight">VMC simple flux</span>,<br/>l'essentiel de la ventilation.`,
      lede: 'La VMC simple flux extrait l\'air vicié des pièces humides (cuisine, salle de bain, WC) et fait entrer l\'air neuf par des entrées d\'air dans les pièces de vie. Solution efficace, économique et silencieuse.',
      image: 'assets/images/un%20flux.png',
      imageAlt: 'Bouche d\'extraction de VMC simple flux discrètement intégrée au plafond',
      specs: [{label:'Hygro',value:'Auto-réglable',accent:true},{label:'dB(A)',value:'< 25'},{label:'Conso',value:'< 30 kWh/an'}],
      principleTitle: 'Extraire pour renouveler.',
      principle: [
        { title:'Extraction permanente', body:'Un caisson en combles aspire l\'air des pièces humides via des bouches discrètes. Débit modulé selon l\'humidité (hygro) ou fixe (auto-réglable).' },
        { title:'Entrée d\'air neuf', body:'Des entrées d\'air placées dans les menuiseries des pièces sèches (salon, chambres) compensent automatiquement.' },
        { title:'Renouvellement complet', body:'L\'air de toute la maison se renouvelle naturellement, sans courant d\'air et sans déperdition énergétique excessive.' },
      ],
      benefitsTitle: 'Pourquoi la VMC simple flux.',
      benefits: [
        { title:'Investissement minimal', body:'2 à 4× moins chère qu\'une VMC double flux. Installation en une journée.' },
        { title:'Air sain, sans humidité', body:'Élimine condensation, moisissures, odeurs. Indispensable dans toute maison étanche moderne.' },
        { title:'Version hygroréglable', body:'Le débit s\'adapte automatiquement à l\'humidité — économies d\'énergie réelles.' },
        { title:'Maintenance simple', body:'Nettoyage des bouches 2 fois/an, remplacement du caisson tous les 15-20 ans.' },
      ],
      specsTable: [
        {label:'Type',value:'Auto-réglable ou hygro-réglable (A/B)'},
        {label:'Consommation moteur',value:'15 à 50 W'},
        {label:'Niveau sonore',value:'< 25 dB(A) en pièce de vie'},
        {label:'Débits extraction',value:'15 à 135 m³/h selon pièce'},
        {label:'Entrées d\'air',value:'Hygro-réglables sur menuiseries'},
        {label:'Garantie',value:'2 à 5 ans selon marque'},
      ],
      aides: [
        { name:"MaPrimeRénov'", note:'Non éligible seule — la simple flux ne l\'est pas, contrairement à la double flux.', eligible:false },
        aideAll.cee,
        aideAll.tva,
        { name:'Éco-PTZ', note:'Éligible dans un bouquet de travaux.', eligible:true },
      ],
    },

    'double-flux': {
      categorySlug: 'vmc', categoryLabel: 'VMC',
      title: 'VMC double flux',
      heroTitle: `La <span class="text-sage italic font-extralight">VMC double flux</span>,<br/>récupération de chaleur.`,
      lede: 'La VMC double flux récupère 70 à 90 % de la chaleur de l\'air extrait pour préchauffer l\'air neuf entrant. Indispensable dans une maison bien isolée — c\'est ce qui transforme une simple isolation en vraie performance énergétique.',
      image: 'assets/images/double%20flux.png',
      imageAlt: 'Caisson de VMC double flux avec gaines isolées installé en combles',
      specs: [{label:'Récup. chaleur',value:'88 %',accent:true},{label:'Filtration',value:'F7+'},{label:'Conso',value:'80-120 kWh/an'}],
      principleTitle: 'Échanger la chaleur, pas l\'humidité.',
      principle: [
        { title:'Double réseau de gaines', body:'Un réseau extrait l\'air vicié, un autre amène l\'air neuf filtré. Les deux flux ne se mélangent jamais.' },
        { title:'Échangeur thermique', body:'Au cœur du caisson, un échangeur à haut rendement transfère 70 à 90 % de la chaleur de l\'air extrait vers l\'air neuf entrant.' },
        { title:'Filtration & confort', body:'Filtres F7 (pollens, particules fines) sur l\'air neuf. Possibilité de filtres charbon actif pour les zones urbaines.' },
      ],
      benefitsTitle: 'Le ticket d\'entrée d\'une maison passive.',
      benefits: [
        { title:'Économies de chauffage', body:'En récupérant 88 % de la chaleur de l\'air extrait, on économise jusqu\'à 20 % sur le poste chauffage.' },
        { title:'Air filtré F7', body:'Pollens, particules fines, pollution urbaine — bloqués avant d\'entrer chez vous.' },
        { title:'Confort été (option bypass)', body:'En été, l\'échangeur peut être contourné pour rafraîchir naturellement la maison la nuit.' },
        { title:'Acoustique', body:'Plus d\'entrées d\'air dans les menuiseries — bruit extérieur fortement atténué.' },
      ],
      specsTable: [
        {label:'Rendement échangeur',value:'70 à 92 %'},
        {label:'Type d\'échangeur',value:'À plaques contre-courant ou rotatif'},
        {label:'Filtres',value:'G4 sur reprise + F7 sur soufflage'},
        {label:'Consommation moteurs',value:'60 à 150 W'},
        {label:'Bypass été',value:'Automatique sur la plupart des modèles'},
        {label:'Maintenance',value:'Changement filtres tous les 6-12 mois'},
        {label:'Garantie',value:'5 ans pièces + décennale'},
      ],
      aides: aideAllArray,
    },

  };

  /* ─── Category hubs (lists a family's sub-services) ─── */
  const CATEGORIES = {
    'pompe-a-chaleur': {
      label: 'Pompe à chaleur',
      title: 'Pompe à chaleur',
      tagline: 'Le rendement thermodynamique, dans toutes ses déclinaisons.',
      lede: 'Capter les calories de l\'air ou du sol pour chauffer votre logement et votre eau, en consommant 3 à 5 fois moins qu\'un chauffage électrique. Le standard moderne de la rénovation énergétique haute performance.',
      services: ['air-eau','air-air','eau-eau'],
    },
    'chaudiere': {
      label: 'Chaudière',
      title: 'Chaudière',
      tagline: 'Quatre énergies, un seul interlocuteur.',
      lede: 'Biomasse haut rendement — granulés et bois bûches — et accompagnement à la sortie du fioul. Toutes les chaudières installées, mises en service et entretenues par nos chauffagistes certifiés.',
      services: ['granules','bois','fioul'],
    },
    'eau-chaude': {
      label: 'Eau chaude sanitaire',
      title: 'Eau chaude',
      tagline: 'Quatre technologies pour l\'eau chaude sanitaire.',
      lede: 'Ballon thermodynamique, chauffe-eau solaire, système solaire combiné, cumulus électrique. Du remplacement express en demi-journée à la production renouvelable durable, nous installons toutes les solutions ECS.',
      services: ['ballon-thermodynamique','ballon-solaire','systeme-solaire-combine','ballon-electrique'],
    },
    'isolation-renovation': {
      label: 'Isolation & rénovation',
      title: 'Isolation & rénovation',
      tagline: 'De la paroi isolée à la rénovation globale.',
      lede: 'Isolation thermique par l\'intérieur, par l\'extérieur, rénovation globale en maison individuelle ou en copropriété. Qualifications Qualibat, décennale système, Mon Accompagnateur Rénov\' agréé.',
      services: ['isolation-interieure','isolation-exterieure','renovation-maison','renovation-appartement'],
    },
    'vmc': {
      label: 'VMC',
      title: 'Ventilation mécanique contrôlée',
      tagline: 'Air sain, sans déperdition.',
      lede: 'La VMC, c\'est ce qui transforme une maison isolée en maison performante. Simple flux pour l\'essentiel, double flux pour récupérer jusqu\'à 90 % de la chaleur de l\'air extrait.',
      services: ['simple-flux','double-flux'],
    },
  };

  QH.renderCategory = function(slug) {
    const cat = CATEGORIES[slug];
    if (!cat) return;
    document.title = `${cat.title} — Quali House`;
    const mainEl = document.getElementById('main');
    if (!mainEl) return;

    const cards = cat.services.map((sid, i) => {
      const s = QH.services[sid];
      if (!s) return '';
      return `
        <a href="${sid}.html" class="group flex flex-col bg-canvas hover:bg-surface/60 transition-all" data-reveal style="--i:${i}">
          <div class="relative aspect-[4/3] overflow-hidden">
            <img src="${R}${s.image}" alt="${s.imageAlt}" loading="lazy"
                 class="absolute inset-0 w-full h-full object-cover photo-treat transition-transform duration-[600ms] group-hover:scale-[1.04]" />
            <div class="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent"></div>
            <div class="absolute top-4 left-4 font-mono text-[11px] uppercase tracking-[0.16em] text-sage/90 bg-canvas/70 backdrop-blur px-2.5 py-1 rounded-md border border-white/[0.06]">${String(i+1).padStart(2,'0')}</div>
          </div>
          <div class="flex-1 p-7 md:p-8 flex flex-col">
            <h3 class="text-[22px] md:text-[26px] font-light leading-[1.1] tracking-tightest group-hover:text-sage transition-colors">${s.title}</h3>
            <p class="mt-3 text-[14.5px] text-muted leading-relaxed">${s.lede.replace(/<[^>]+>/g,'').substring(0,140)}…</p>
            <div class="mt-5 flex items-center gap-3 text-[12px] flex-wrap">
              ${s.specs.slice(0,2).map(sp => `<span class="text-muted"><span class="font-mono text-frost">${sp.value}</span> ${sp.label}</span>`).join('<span class="text-muted/40">·</span>')}
            </div>
            <span class="mt-auto inline-flex items-center gap-2 text-[13.5px] text-sage font-medium pt-7 border-t border-white/[0.06] mt-7">
              Découvrir
              <svg viewBox="0 0 24 24" class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </div>
        </a>`;
    }).join('');

    mainEl.innerHTML = `
      <section class="relative pt-36 lg:pt-32 pb-12 md:pb-16 overflow-hidden">
        <div class="ambient-glow"></div>
        <div class="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10">
          <nav class="text-[12px] text-muted mb-8 flex items-center gap-2" data-reveal>
            <a href="${R}index.html" class="hover:text-ink transition-colors">Accueil</a>
            <span class="text-muted/50">/</span>
            <a href="${R}prestations/index.html" class="hover:text-ink transition-colors">Prestations</a>
            <span class="text-muted/50">/</span>
            <span class="text-frost">${cat.label}</span>
          </nav>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div class="lg:col-span-5">
              <div class="text-[11.5px] uppercase tracking-[0.18em] text-sage/80 flex items-center gap-3" data-reveal>
                <span class="w-6 h-px bg-sage/60"></span>${cat.label}
              </div>
              <h1 class="mt-5 font-light text-[44px] sm:text-[54px] lg:text-[62px] leading-[0.98] tracking-tightest" data-reveal style="--i:1">${cat.tagline}</h1>
            </div>
            <div class="lg:col-span-7 flex items-end" data-reveal style="--i:2">
              <p class="text-[16px] md:text-[17px] leading-relaxed text-muted max-w-[60ch]">${cat.lede}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="relative py-14 md:py-20">
        <div class="mx-auto max-w-[1400px] px-6 md:px-10">
          <div class="grid grid-cols-1 md:grid-cols-2 ${cat.services.length>=3?'lg:grid-cols-'+Math.min(cat.services.length,4):'lg:grid-cols-2'} gap-px bg-line rounded-3xl overflow-hidden border border-line">
            ${cards}
          </div>
        </div>
      </section>

      ${QH.ctaStrip()}
    `;
  };

  /* ─── Prestations hub: ALL 17 services, grouped by family, each clickable with image ─── */
  QH.renderPrestationsHub = function () {
    document.title = 'Nos prestations — Quali House';
    const mainEl = document.getElementById('main');
    if (!mainEl) return;

    const order = ['pompe-a-chaleur','chaudiere','eau-chaude','isolation-renovation','vmc'];

    const serviceCard = (sid, i) => {
      const s = QH.services[sid];
      if (!s) return '';
      return `
        <a href="${R}prestations/${s.categorySlug}/${sid}.html" class="group flex flex-col bg-canvas hover:bg-surface/60 transition-all" data-reveal style="--i:${i}">
          <div class="relative aspect-[16/11] overflow-hidden">
            <img src="${R}${s.image}" alt="${s.imageAlt}" loading="lazy"
                 class="absolute inset-0 w-full h-full object-cover photo-treat transition-transform duration-[600ms] group-hover:scale-[1.05]" />
            <div class="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/25 to-transparent"></div>
          </div>
          <div class="flex-1 p-6 md:p-7 flex flex-col">
            <h3 class="text-[20px] md:text-[23px] font-light leading-[1.12] tracking-tightest group-hover:text-sage transition-colors">${s.title}</h3>
            <p class="mt-3 text-[14px] text-muted leading-relaxed">${s.lede.replace(/<[^>]+>/g,'').substring(0,120)}…</p>
            <div class="mt-5 flex items-center gap-3 text-[12px] flex-wrap">
              ${s.specs.slice(0,2).map(sp => `<span class="text-muted"><span class="font-mono text-frost">${sp.value}</span> ${sp.label}</span>`).join('<span class="text-muted/40">·</span>')}
            </div>
            <span class="mt-auto inline-flex items-center gap-2 text-[13px] text-sage font-medium pt-6 mt-6 border-t border-white/[0.06]">
              Découvrir
              <svg viewBox="0 0 24 24" class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </div>
        </a>`;
    };

    const sections = order.map((slug, idx) => {
      const cat = CATEGORIES[slug];
      const cols = cat.services.length >= 4 ? 'lg:grid-cols-4' : (cat.services.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2');
      return `
        <section class="relative py-16 md:py-20 ${idx>0 ? 'border-t border-white/[0.05]' : ''}">
          <div class="mx-auto max-w-[1400px] px-6 md:px-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 mb-9 md:mb-11 items-end">
              <div class="lg:col-span-7" data-reveal>
                <div class="text-[11.5px] uppercase tracking-[0.18em] text-sage/80 flex items-center gap-3">
                  <span class="font-mono">${String(idx+1).padStart(2,'0')}</span>
                  <span class="w-6 h-px bg-sage/60"></span>${cat.label}
                </div>
                <h2 class="mt-4 font-light text-[30px] md:text-[40px] leading-[1.05] tracking-tightest">${cat.tagline}</h2>
              </div>
              <div class="lg:col-span-5 flex lg:justify-end" data-reveal style="--i:1">
                <a href="${R}prestations/${slug}/index.html" class="inline-flex items-center gap-2 text-[13.5px] text-sage hover:text-frost transition-colors">
                  Tout voir — ${cat.label.toLowerCase()}
                  <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 ${cols} gap-px bg-line rounded-3xl overflow-hidden border border-line">
              ${cat.services.map((sid,i) => serviceCard(sid,i)).join('')}
            </div>
          </div>
        </section>`;
    }).join('');

    mainEl.innerHTML = `
      <section class="relative pt-36 lg:pt-32 pb-10 md:pb-14 overflow-hidden">
        <div class="ambient-glow"></div>
        <div class="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10">
          <nav class="text-[12px] text-muted mb-8 flex items-center gap-2" data-reveal>
            <a href="${R}index.html" class="hover:text-ink transition-colors">Accueil</a>
            <span class="text-muted/50">/</span>
            <span class="text-frost">Nos prestations</span>
          </nav>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div class="lg:col-span-6">
              <div class="text-[11.5px] uppercase tracking-[0.18em] text-sage/80 flex items-center gap-3" data-reveal>
                <span class="w-6 h-px bg-sage/60"></span>Nos prestations
              </div>
              <h1 class="mt-5 font-light text-[44px] sm:text-[54px] lg:text-[62px] leading-[0.98] tracking-tightest" data-reveal style="--i:1">
                Tout pour votre <span class="text-sage italic font-extralight">confort énergétique.</span>
              </h1>
            </div>
            <div class="lg:col-span-6 flex items-end" data-reveal style="--i:2">
              <p class="text-[16px] md:text-[17px] leading-relaxed text-muted max-w-[58ch]">
                Cinq familles, dix-sept solutions. Cliquez sur n'importe quel équipement ci-dessous pour
                accéder à sa fiche détaillée — caractéristiques, fonctionnement, aides applicables.
              </p>
            </div>
          </div>
        </div>
      </section>
      ${sections}
      ${QH.ctaStrip()}
    `;
  };

  /* ─── Auto-init when DOM ready ─── */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(() => {
    if (!document.body.dataset.qhSkipChrome) {
      QH.injectChrome(document.documentElement.dataset.active || '');
    }
    if (document.body.dataset.qhService && QH.services[document.body.dataset.qhService]) {
      QH.renderService(document.body.dataset.qhService);
    }
    if (document.body.dataset.qhCategory && CATEGORIES[document.body.dataset.qhCategory]) {
      QH.renderCategory(document.body.dataset.qhCategory);
    }
    if (document.body.dataset.qhPrestations === 'hub') {
      QH.renderPrestationsHub();
    }
    // Fill <div data-qh-insert="ctaStrip"> placeholders
    document.querySelectorAll('[data-qh-insert]').forEach(el => {
      const fn = el.getAttribute('data-qh-insert');
      if (typeof QH[fn] === 'function') el.outerHTML = QH[fn]();
    });
    // Defer wiring slightly to allow injected DOM to settle
    setTimeout(QH.init, 30);
  });
})();
