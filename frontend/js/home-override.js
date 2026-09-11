/* home-override.js
 * Overrides render() so that state.view==='home' shows the Digi+wo Storyline layout.
 * All other views fall back to the original app.js render().
 * Loaded after app.js; runs before DOMContentLoaded fires.
 */
(function () {
  'use strict';

  /* ─── Injected stylesheet ─────────────────────────────────────── */
  const STYLE_ID = 'home-override-css';
  const HOME_CSS = `
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      font-size: 1.5rem; line-height: 1; display: inline-block;
      letter-spacing: normal; text-transform: none; white-space: nowrap;
      word-wrap: normal; direction: ltr; -webkit-font-smoothing: antialiased;
    }
    .magical-gradient {
      background:
        radial-gradient(circle at 10% 20%, rgba(255,192,192,.5) 0%, transparent 40%),
        radial-gradient(circle at 90% 10%, rgba(128,176,232,.5) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(209,202,234,.4) 0%, transparent 50%),
        #fbfaee;
      background-attachment: fixed;
    }
    .bokeh {
      position: fixed; border-radius: 50%; filter: blur(60px);
      opacity: .3; z-index: -1; pointer-events: none;
    }
    .soft-float { animation: hfloat 8s ease-in-out infinite; }
    @keyframes hfloat {
      0%,100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-20px) rotate(3deg); }
    }
    .star-blink { animation: hblink 4s ease-in-out infinite; }
    @keyframes hblink {
      0%,100% { opacity: .2; transform: scale(.8); }
      50%      { opacity: .6; transform: scale(1.1); }
    }
    .sticker-card {
      background: rgba(255,255,255,.85);
      backdrop-filter: blur(12px);
      border: 3px solid #fff;
      box-shadow: 0 8px 0 0 rgba(0,0,0,.06);
      border-radius: 2rem;
      transition: all .3s cubic-bezier(.34,1.56,.64,1);
    }
    .sticker-card:hover { transform: translateY(-8px); box-shadow: 0 16px 0 0 rgba(0,0,0,.04); }
    .chunky-shadow-primary  { box-shadow: 4px 6px 0 0 #420080; }
    .chunky-shadow-secondary{ box-shadow: 4px 6px 0 0 #636100; }
    .icon-3d {
      filter: drop-shadow(2px 4px 4px rgba(0,0,0,.1));
      position: relative;
    }
    .icon-3d::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg,rgba(255,255,255,.4) 0%,transparent 50%);
      border-radius: inherit; pointer-events: none;
    }
    /* ── hide original shell chrome when home override is active ── */
    body.home-active .site-header,
    body.home-active .primary-nav { display: none !important; }
    body.home-active .page-shell  { display: block !important; }
    /* ── responsive ── */
    @media (max-width: 768px) {
      .home-hero-grid   { grid-template-columns: 1fr !important; }
      .home-quest-grid  { grid-template-columns: 1fr 1fr !important; }
      .home-quest-large { grid-column: span 2 !important; grid-row: span 1 !important; }
      .home-quest-wide  { grid-column: span 2 !important; }
      .home-why-row     { flex-direction: column !important; }
      .home-stats-row   { flex-direction: column !important; }
      .home-stats-div   { display: none !important; }
      .home-header-nav  { display: none !important; }
      #home-mobile-nav  { display: flex !important; }
      .home-hero-section{ padding: 48px 16px !important; }
      .home-section     { padding: 48px 16px !important; }
      .home-footer      { padding: 48px 16px !important; }
      .home-header-inner{ padding: 12px 16px !important; }
    }
  `;

  function injectStyles() {
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = HOME_CSS;
      document.head.appendChild(s);
    }
    document.body.classList.add('magical-gradient', 'home-active');
  }

  function removeStyles() {
    document.body.classList.remove('magical-gradient', 'home-active');
  }

  /* ─── Save original render ────────────────────────────────────── */
  const _origRender = window.render;

  /* ─── Override render ─────────────────────────────────────────── */
  window.render = function renderOverride() {
    if (typeof state !== 'undefined' && state.view === 'home') {
      injectStyles();
      root.innerHTML = buildHome();
      wireHomeEvents();
    } else {
      removeStyles();
      _origRender();
    }
  };

  /* ─── Build home HTML ─────────────────────────────────────────── */
  function buildHome() {
    return `
      <!-- Bokeh Background (fixed, behind everything) -->
      <div class="bokeh" style="width:500px;height:500px;background:#FFC0C0;top:-80px;left:-80px"></div>
      <div class="bokeh" style="width:600px;height:600px;background:#80B0E8;bottom:0;right:-80px"></div>
      <div class="bokeh" style="width:400px;height:400px;background:#D1CAEA;top:50%;left:33%"></div>
      <!-- Floating Stars -->
      <div class="star-blink" style="position:fixed;top:80px;left:40px;color:rgba(120,61,194,.2);z-index:-1;pointer-events:none">
        <span class="material-symbols-outlined" style="font-size:2.5rem">star</span>
      </div>
      <div class="star-blink" style="position:fixed;top:160px;right:80px;color:rgba(99,97,0,.2);z-index:-1;pointer-events:none;animation-delay:1s">
        <span class="material-symbols-outlined" style="font-size:1.5rem">star</span>
      </div>
      <div class="star-blink" style="position:fixed;bottom:200px;left:25%;color:rgba(130,81,82,.2);z-index:-1;pointer-events:none;animation-delay:2s">
        <span class="material-symbols-outlined" style="font-size:3rem">star</span>
      </div>
      <div class="star-blink" style="position:fixed;top:66%;right:33%;color:rgba(120,61,194,.1);z-index:-1;pointer-events:none;animation-delay:.5s">
        <span class="material-symbols-outlined" style="font-size:2rem">star</span>
      </div>

      <!-- ─── Header ─── -->
      <header style="position:sticky;top:0;z-index:50;background:rgba(255,255,255,.4);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.4)">
  <div class="home-header-inner" style="display:flex;justify-content:space-between;align-items:center;width:100%;padding:16px 40px;max-width:1280px;margin:0 auto;box-sizing:border-box">
    
    <a href="#" data-home-nav="home" style="text-decoration:none; display:flex; align-items:center;">
      
      <!-- PAKAI YANG 3D FLAT SHADOW DI SINI -->
      <div style="background: #ffffff; padding: 6px 14px; border: 2px solid #783dc2; border-radius: 12px; display: flex; align-items: center; justify-content: center; transform: translateY(-2px); box-shadow: 3px 3px 0px 0px #783dc2;">
        <img src="assets/logo.png" alt="Logo Digi+wo" style="height:50px; width:auto; display:block;">
      </div>
      
    </a>
          <nav class="home-header-nav" style="display:flex;align-items:center;gap:40px">
            <a href="#" data-home-nav="home"        style="font-size:.875rem;font-weight:700;color:#783dc2;border-bottom:3px solid #783dc2;padding-bottom:4px;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif">Home</a>
            <a href="#" data-home-scroll="about"    style="font-size:.875rem;font-weight:700;color:#4b4453;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif">About</a>
            <a href="#" data-home-nav="gradeSelect" style="font-size:.875rem;font-weight:700;color:#4b4453;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif">Study Zone</a>
          </nav>
          <div style="display:flex;align-items:center;gap:16px">
            <button data-home-nav="login" style="background:#783dc2;color:#fff;font-size:.875rem;font-weight:700;padding:12px 32px;border-radius:16px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:4px 6px 0 0 #420080;transition:transform .15s,box-shadow .15s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">Login</button>
          </div>
        </div>
      </header>

      <!-- ─── Main Content ─── -->
      <main style="max-width:1280px;margin:0 auto;position:relative">

        <!-- Hero Section -->
        <section class="home-hero-section" style="padding:96px 40px">
          <div class="home-hero-grid" style="display:grid;grid-template-columns:7fr 5fr;gap:64px;align-items:center">

            <!-- Left: text -->
            <div>
              <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.9);color:#783dc2;font-size:.875rem;font-weight:700;padding:8px 24px;border-radius:9999px;margin-bottom:32px;border:2px solid rgba(120,61,194,.1);box-shadow:0 2px 8px rgba(0,0,0,.06);font-family:'Plus Jakarta Sans',sans-serif">
                <span class="material-symbols-outlined" style="font-size:1.1rem">auto_awesome</span>
                Grades 1 to 6
              </div>
              <h1 style="font-size:clamp(2.25rem,5vw,3.5rem);font-weight:800;color:#1b1c15;margin:0 0 24px;line-height:1.1;font-family:'Plus Jakarta Sans',sans-serif">
                Learn Math the<br><span style="color:#783dc2;font-style:italic">Fun Way!</span>
              </h1>
              <p style="font-size:1.125rem;font-weight:500;color:#4b4453;margin:0 0 48px;max-width:580px;line-height:1.6;font-family:'Plus Jakarta Sans',sans-serif">
                Temukan keseruan dalam belajar Matematika lewat permainan yang seru! Kuasai materi penjumlahan, pecahan, aljabar, dan banyak lagi sekarang!
              </p>
              <div style="display:flex;gap:32px;align-items:center;flex-wrap:wrap">
                <button id="heroStart" style="background:#783dc2;color:#fff;font-size:1.25rem;font-weight:700;padding:24px 48px;border-radius:24px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:4px 6px 0 0 #420080;transition:transform .15s,box-shadow .15s" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''" onmousedown="this.style.transform='translateY(2px)';this.style.boxShadow='0 0 0 0 #420080'" onmouseup="this.style.transform='';this.style.boxShadow='4px 6px 0 0 #420080'">
                  Mulai Belajar
                </button>
              </div>
            </div>

            <!-- Right: owl card -->
            <div style="position:relative">
              <div class="soft-float" style="position:relative;width:100%;aspect-ratio:1/1;background:rgba(255,255,255,.5);border-radius:4rem;transform:rotate(3deg);overflow:hidden;border:8px solid #fff;box-shadow:0 25px 50px rgba(0,0,0,.1)">
                <img src="assets/owl.jpg" alt="Owl mascot" style="width:100%;height:100%;object-fit:cover;transform:rotate(-3deg) scale(1.05)">
              </div>
            </div>

          </div>
        </section>

        <!-- About Section -->
        <section id="section-about" class="home-section" style="padding:96px 40px;scroll-margin-top:80px">
          <div style="text-align:center;margin-bottom:64px">
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.9);color:#783dc2;font-size:.875rem;font-weight:700;padding:8px 24px;border-radius:9999px;margin-bottom:24px;border:2px solid rgba(120,61,194,.1);box-shadow:0 2px 8px rgba(0,0,0,.06);font-family:'Plus Jakarta Sans',sans-serif">
              <span class="material-symbols-outlined" style="font-size:1.1rem">favorite</span>
              Tentang Kami
            </div>
            <h2 style="font-size:2.5rem;font-weight:800;color:#1b1c15;margin:0 0 16px;font-family:'Plus Jakarta Sans',sans-serif">Apa itu Digi+wo?</h2>
            <p style="color:#4b4453;max-width:580px;margin:0 auto;font-size:1.1rem;line-height:1.7;font-family:'Plus Jakarta Sans',sans-serif">
              Digi+wo lahir dari satu keinginan sederhana: belajar itu harusnya menyenangkan, bukan membebani.
            </p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px">

            <!-- Card 1 -->
            <div class="sticker-card" style="padding:36px;border:2px solid rgba(120,61,194,.1)">
              <div class="icon-3d" style="width:72px;height:72px;background:#eddcff;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;transform:rotate(3deg);box-shadow:0 4px 8px rgba(0,0,0,.08)">
                <span class="material-symbols-outlined" style="color:#420080;font-size:2.5rem">auto_awesome</span>
              </div>
              <h3 style="font-size:1.35rem;font-weight:800;color:#1b1c15;margin:0 0 12px;font-family:'Plus Jakarta Sans',sans-serif">Awalnya Cuma Impian</h3>
              <p style="color:#4b4453;line-height:1.75;margin:0;font-family:'Plus Jakarta Sans',sans-serif">
                Kami percaya setiap anak punya cara belajarnya sendiri. Ada yang langsung paham lewat game, ada yang butuh coba berkali-kali sebelum akhirnya nyambung. Di sini, semua itu disambut dengan tangan terbuka.
              </p>
            </div>

            <!-- Card 2 -->
            <div class="sticker-card" style="padding:36px;border:2px solid rgba(99,97,0,.1)">
              <div class="icon-3d" style="width:72px;height:72px;background:#ebe871;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;transform:rotate(-4deg);box-shadow:0 4px 8px rgba(0,0,0,.08)">
                <span class="material-symbols-outlined" style="color:#636100;font-size:2.5rem">family_restroom</span>
              </div>
              <h3 style="font-size:1.35rem;font-weight:800;color:#1b1c15;margin:0 0 12px;font-family:'Plus Jakarta Sans',sans-serif">Orang Tua Ikut Jadi Bagian</h3>
              <p style="color:#4b4453;line-height:1.75;margin:0;font-family:'Plus Jakarta Sans',sans-serif">
                Orang tua bisa pantau kemajuan anak kapan saja. Laporan belajar bisa dikirim langsung ke email, supaya tidak ada momen tumbuh yang terlewat. Karena mendidik anak bukan urusan sekolah saja.
              </p>
            </div>

            <!-- Card 3 -->
            <div class="sticker-card" style="padding:36px;border:2px solid rgba(130,81,82,.1)">
              <div class="icon-3d" style="width:72px;height:72px;background:#ffdad9;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;transform:rotate(5deg);box-shadow:0 4px 8px rgba(0,0,0,.08)">
                <span class="material-symbols-outlined" style="color:#825152;font-size:2.5rem">school</span>
              </div>
              <h3 style="font-size:1.35rem;font-weight:800;color:#1b1c15;margin:0 0 12px;font-family:'Plus Jakarta Sans',sans-serif">Dari Angka Pertama Sampai Aljabar</h3>
              <p style="color:#4b4453;line-height:1.75;margin:0;font-family:'Plus Jakarta Sans',sans-serif">
                Mulai dari kelas 1 yang baru berkenalan dengan angka, sampai kelas 6 yang sudah main-main dengan variabel dan rumus lingkaran. Setiap topik dirancang pas di level yang tepat.
              </p>
            </div>

            <!-- Card 4 -->
            <div class="sticker-card" style="padding:36px;border:2px solid rgba(46,158,98,.15)">
              <div class="icon-3d" style="width:72px;height:72px;background:rgba(46,158,98,.12);border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;transform:rotate(-3deg);box-shadow:0 4px 8px rgba(0,0,0,.08)">
                <span class="material-symbols-outlined" style="color:#1e7a49;font-size:2.5rem">sports_esports</span>
              </div>
              <h3 style="font-size:1.35rem;font-weight:800;color:#1b1c15;margin:0 0 12px;font-family:'Plus Jakarta Sans',sans-serif">Belajar Sambil Main</h3>
              <p style="color:#4b4453;line-height:1.75;margin:0;font-family:'Plus Jakarta Sans',sans-serif">
                Soal bisa dikerjakan sambil drag &amp; drop, isi jawaban, cocokkan kartu, atau kejar-kejaran ala Dino Runner. Belajar tidak harus selalu duduk diam. Selama asyik, anak bakal minta lagi sendiri.
              </p>
            </div>

          </div>
        </section>

        <!-- Why Digi+wo? -->
        <section class="home-section" style="padding:96px 40px">
          <div class="home-why-row" style="display:flex;gap:80px;align-items:center">
            </div>
            <!-- Right: feature cards -->
            <div style="flex:1; min-width:280px; text-align:center; display:flex; flex-direction:column; align-items:center;">
  <h2 style="font-size:3rem; font-weight:700; color:#1b1c15; margin:0 0 48px; font-family:'Plus Jakarta Sans',sans-serif">
    Kenapa <span style="color:#783dc2; text-decoration:underline; text-decoration-color:rgba(120,61,194,.2); text-underline-offset:8px">Digi+wo?</span>
  </h2>
  <div style="display:flex; flex-direction:column; gap:32px; width:100%; align-items:center;">
                <div class="sticker-card" style="display:flex;gap:32px;padding:24px;border:2px solid rgba(255,255,255,.5);background:rgba(255,255,255,.6)">
                  <div class="icon-3d" style="flex-shrink:0;width:64px;height:64px;background:#eddcff;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#420080;box-shadow:0 4px 8px rgba(0,0,0,.1)">
                    <span class="material-symbols-outlined" style="font-size:2.5rem">verified_user</span>
                  </div>
                  <div>
                    <h4 style="font-size:1.5rem;font-weight:700;margin:0 0 8px;font-family:'Plus Jakarta Sans',sans-serif">Tampilan Seru & Ramah Anak</h4>
                    <p style="color:#4b4453;line-height:1.6;margin:0;font-family:'Plus Jakarta Sans',sans-serif">Tampilan berwarna-warni membuat belajar Matematika terasa menyenangkan dan tidak menakutkan.</p>
                  </div>
                </div>
                <div class="sticker-card" style="display:flex;gap:32px;padding:24px;border:2px solid rgba(255,255,255,.5);background:rgba(255,255,255,.6)">
                  <div class="icon-3d" style="flex-shrink:0;width:64px;height:64px;background:#ebe871;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#636100;box-shadow:0 4px 8px rgba(0,0,0,.1)">
                    <span class="material-symbols-outlined" style="font-size:2.5rem">psychology</span>
                  </div>
                  <div>
                    <h4 style="font-size:1.5rem;font-weight:700;margin:0 0 8px;font-family:'Plus Jakarta Sans',sans-serif">Metode Belajar yang Variatif</h4>
                    <p style="color:#4b4453;line-height:1.6;margin:0;font-family:'Plus Jakarta Sans',sans-serif">Lima metode pembelajaran interaktif membuat anak tetap semangat dan tidak mudah bosan di setiap sesi belajar.</p>                  </div>
                </div>
                <div class="sticker-card" style="display:flex;gap:32px;padding:24px;border:2px solid rgba(255,255,255,.5);background:rgba(255,255,255,.6)">
                  <div class="icon-3d" style="flex-shrink:0;width:64px;height:64px;background:#bf8787;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#492224;box-shadow:0 4px 8px rgba(0,0,0,.1)">
                    <span class="material-symbols-outlined" style="font-size:2.5rem">monitoring</span>
                  </div>
                  <div>
                    <h4 style="font-size:1.5rem;font-weight:700;margin:0 0 8px;font-family:'Plus Jakarta Sans',sans-serif">Pantau Perkembangan Anak</h4>
                    <p style="color:#4b4453;line-height:1.6;margin:0;font-family:'Plus Jakarta Sans',sans-serif">Dapatkan laporan belajar anak, langsung dikirimkan ke email orang tua untuk memudahkan pemantauan progress belajar anak.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        

      </main>

      <!-- ─── Footer ─── -->
      <footer class="home-footer" style="width:100%;padding:96px 40px;display:flex;flex-direction:column;align-items:center;gap:48px;text-align:center;background:rgba(255,255,255,.4);backdrop-filter:blur(24px);border-top:2px solid rgba(255,255,255,.5);margin-top:80px;box-sizing:border-box">
        <a href="#" data-home-nav="home" style="font-size:2.5rem;font-weight:800;color:#783dc2;text-decoration:none;display:flex;align-items:center;gap:16px;font-family:'Plus Jakarta Sans',sans-serif">
          <div style="width:56px;height:56px;background:#783dc2;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#fff;transform:rotate(6deg);box-shadow:0 8px 24px rgba(0,0,0,.15)">
            <span class="material-symbols-outlined" style="font-size:2rem">rocket_launch</span>
          </div>
          Digi+wo Academy
        </a>
        
        <p style="color:#4b4453;opacity:.7;max-width:500px;line-height:1.6;margin:0;font-family:'Plus Jakarta Sans',sans-serif">&#169; 2024 Digi+wo Academy. Empowering little explorers everywhere.</p>
      </footer>

      <!-- ─── Mobile Bottom Nav ─── -->
      <nav id="home-mobile-nav" style="display:none;position:fixed;bottom:0;left:0;width:100%;z-index:50;justify-content:space-around;align-items:center;padding:16px 16px 32px;background:rgba(255,255,255,.8);backdrop-filter:blur(24px);border-top:2px solid rgba(255,255,255,.5);border-radius:48px 48px 0 0;box-shadow:0 -15px 30px rgba(0,0,0,.05)">
        <a data-home-nav="home" href="#" style="display:flex;flex-direction:column;align-items:center;gap:6px;color:#783dc2;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif">
          <div style="width:48px;height:32px;background:rgba(120,61,194,.1);border-radius:9999px;display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="font-size:1.5rem">home</span>
          </div>
          <span style="font-size:.625rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Home</span>
        </a>
        <a data-home-nav="gradeSelect" href="#" style="display:flex;flex-direction:column;align-items:center;gap:6px;color:#4b4453;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif">
          <span class="material-symbols-outlined" style="font-size:1.5rem">map</span>
          <span style="font-size:.625rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Quests</span>
        </a>
        <a data-home-nav="gradeSelect" href="#" style="display:flex;flex-direction:column;align-items:center;gap:6px;color:#4b4453;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif">
          <span class="material-symbols-outlined" style="font-size:1.5rem">menu_book</span>
          <span style="font-size:.625rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Library</span>
        </a>
        <a data-home-nav="profile" href="#" style="display:flex;flex-direction:column;align-items:center;gap:6px;color:#4b4453;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif">
          <span class="material-symbols-outlined" style="font-size:1.5rem">account_circle</span>
          <span style="font-size:.625rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Profile</span>
        </a>
      </nav>

      
    `;
  }

  /* ─── Wire home-specific navigation events ────────────────────── */
  function wireHomeEvents() {
    // bindEvents() from app.js handles #heroStart → setView('login')
    if (typeof bindEvents === 'function') bindEvents();

    // Wire all [data-home-nav] elements
    document.querySelectorAll('[data-home-nav]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.dataset.homeNav;
        if (target === 'home') {
          setView('home');
        } else if (target === 'gradeSelect' && !state.currentUser) {
          setView('login');
        } else if (target === 'profile' && !state.currentUser) {
          setView('login');
        } else {
          setView(target);
        }
      });
    });

    // Smooth-scroll for About link
    document.querySelectorAll('[data-home-scroll]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = 'section-' + this.dataset.homeScroll;
        const section = document.getElementById(targetId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

})();
