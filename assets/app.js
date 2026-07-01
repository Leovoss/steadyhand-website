/* SteadyHand site behaviour. Loaded with defer, so the DOM is ready. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // current year in footer
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // reveal on scroll
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // count-up numbers
  var countEls = document.querySelectorAll('.countup');
  if (countEls.length) {
    var countUp = function (el) {
      var to = parseFloat(el.getAttribute('data-countup'));
      var suf = el.getAttribute('data-suffix') || '';
      if (isNaN(to)) return;
      if (reduce) { el.textContent = to + suf; return; }
      var dur = 1100, t0 = null;
      var step = function (ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e) + suf;
        if (p < 1) requestAnimationFrame(step); else el.textContent = to + suf;
      };
      requestAnimationFrame(step);
    };
    var cObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cObs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    countEls.forEach(function (el) { cObs.observe(el); });
  }

  // self-drawing chart lines
  if (!reduce) {
    document.querySelectorAll('.draw-line').forEach(function (line) {
      try {
        var len = line.getTotalLength();
        line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
        var lObs = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { line.style.transition = 'stroke-dashoffset 1.4s ease'; line.style.strokeDashoffset = '0'; lObs.unobserve(e.target); } });
        }, { threshold: 0.4 });
        lObs.observe(line);
      } catch (err) {}
    });
  }

  // ROI calculator
  var ftd = document.getElementById('ftd');
  var cac = document.getElementById('cac');
  var uplift = document.getElementById('uplift');
  if (ftd && cac && uplift) {
    var EARLY_CHURN = 0.40; // assumed share of first deposits that blow up before covering CAC
    var upliftVal = document.getElementById('upliftVal');
    var savedEl = document.getElementById('saved');
    var recoveredEl = document.getElementById('recovered');
    var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    var calc = function () {
      var n = Math.max(0, parseFloat(ftd.value) || 0);
      var c = Math.max(0, parseFloat(cac.value) || 0);
      var u = (parseFloat(uplift.value) || 0) / 100;
      if (upliftVal) upliftVal.textContent = Math.round(u * 100) + '%';
      var savedPerMonth = n * EARLY_CHURN * u;
      var recoveredPerYear = savedPerMonth * c * 12;
      if (savedEl) savedEl.textContent = Math.round(savedPerMonth).toLocaleString('en-US');
      if (recoveredEl) recoveredEl.textContent = money.format(Math.round(recoveredPerYear));
    };
    [ftd, cac, uplift].forEach(function (el) { el.addEventListener('input', calc); });
    calc();
  }

  // cookie consent + consent-gated analytics
  function loadAnalytics() {
    if (window.__shAnalytics) return; window.__shAnalytics = true;
    // Plausible: cookieless, privacy-friendly. Needs a Plausible account with domain 'steadyhand.app'.
    var s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain', 'steadyhand.app');
    s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
  }
  var KEY = 'sh-consent';
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'accepted') loadAnalytics();

  var banner = document.getElementById('cookie-banner');
  if (banner) {
    var savePref = function (v) {
      try { localStorage.setItem(KEY, v); } catch (e) {}
      banner.classList.add('hidden');
      if (v === 'accepted') loadAnalytics();
    };
    if (saved !== 'accepted' && saved !== 'rejected') banner.classList.remove('hidden');
    var acc = document.getElementById('cookie-accept');
    var rej = document.getElementById('cookie-reject');
    if (acc) acc.addEventListener('click', function () { savePref('accepted'); });
    if (rej) rej.addEventListener('click', function () { savePref('rejected'); });
  }
  document.querySelectorAll('[data-cookie-settings]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); if (banner) banner.classList.remove('hidden'); });
  });
})();
