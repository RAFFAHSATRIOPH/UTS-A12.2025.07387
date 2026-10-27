(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const fmt = n => n.toLocaleString('id-ID');

  /* Fallback gambar: logo & foto yang belum ada */
  $$('img').forEach(img => {
    const fix = () => {
      if (img.classList.contains('logo')) { if (!img.dataset.fb) { img.dataset.fb = 1; img.src = 'images/logo-fallback.svg'; } }
      else img.style.display = 'none';
    };
    img.addEventListener('error', fix);
    if (img.complete && img.naturalWidth === 0) fix();
  });

  /* Smooth scroll (Lenis) */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.4, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -70, duration: 1.8 });
    }));
  }

  /* Reveal */
  $$('.grid-4,.grid-2,.cards,.profil-grid,.btns').forEach(g =>
    $$('.reveal', g).forEach((el, i) => el.style.setProperty('--d', i * 0.14 + 's')));
  const revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); revealIO.unobserve(e.target);
  }), { threshold: 0.12 });
  $$('.reveal').forEach(el => revealIO.observe(el));

  /* Counter */
  function countUp(el) {
    const to = +el.dataset.to, plus = el.dataset.plus ? '+' : '';
    if (reduce) { el.textContent = fmt(to) + plus; return; }
    const dur = 2000, t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4)))) + plus;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    countUp(e.target); countIO.unobserve(e.target);
  }), { threshold: 0.6 });
  $$('.count').forEach(el => { el.textContent = '0' + (el.dataset.plus ? '+' : ''); countIO.observe(el); });

  /* Header, progress, parallax (dihaluskan dengan lerp) */
  const header = $('#header'), bar = $('#progress'), heroBg = $('#heroBg');
  let par = 0;
  function frame() {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('scrolled', y > 20);
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (!reduce) {
      par += (Math.min(y, innerHeight) * 0.22 - par) * 0.08;
      heroBg.style.transform = `translate3d(0,${par.toFixed(2)}px,0)`;
    }
    requestAnimationFrame(frame);
  }
  frame();

  /* Cahaya mengikuti kursor di hero */
  const hero = $('.hero'), spot = $('#spot');
  if (!reduce && matchMedia('(hover:hover)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
    });
    (function follow() {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      spot.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(follow);
    })();
  }

  /* Menu aktif */
  const links = $$('.menu a');
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => secIO.observe(s));

  /* Tilt halus */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('tilting');
        el.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-3px)`;
      });
      el.addEventListener('mouseleave', () => { el.classList.remove('tilting'); el.style.transform = ''; });
    });
  }

  /* Validasi & hasil form */
  const form = $('#genreForm'), hasil = $('#hasil');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const hobi = $$('input[name="hobi"]:checked', form).map(c => c.value);
      $('#hobiErr').classList.toggle('d-block', hobi.length === 0);
      form.classList.add('was-validated');
      if (!form.checkValidity() || hobi.length === 0) return;
      const rows = [['Nama', form.nama.value.trim()], ['Alamat', form.alamat.value.trim()], ['Kota', form.kota.value], ['Hobi', hobi.join(', ')]];
      hasil.replaceChildren();
      const h3 = document.createElement('h3'); h3.textContent = 'Data berhasil dikirim'; hasil.append(h3);
      const dl = document.createElement('dl');
      rows.forEach(([k, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; dl.append(dt, dd); });
      hasil.append(dl);
      hasil.classList.remove('d-none');
      form.reset(); form.classList.remove('was-validated');
    });
    form.addEventListener('reset', () => { form.classList.remove('was-validated'); $('#hobiErr').classList.remove('d-block'); hasil.classList.add('d-none'); });
  }

  /* Ripple */
  $$('.ripple').forEach(btn => btn.addEventListener('click', e => {
    const r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
    const d = document.createElement('span');
    d.className = 'dot';
    d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    btn.appendChild(d); setTimeout(() => d.remove(), 850);
  }));
})();
