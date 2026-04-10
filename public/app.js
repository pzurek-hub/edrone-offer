// === MAIN APP ===

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const dealId = params.get('deal');

  // If no deal ID, show demo with default data
  if (!dealId) {
    showDemo();
    return;
  }

  try {
    const response = await fetch(`/api/deal?id=${dealId}`);
    if (!response.ok) throw new Error('Could not load deal data');
    const data = await response.json();
    renderOffer(data);
  } catch (err) {
    showError(err.message);
  }
});

// === DEMO MODE (no HubSpot connection) ===
function showDemo() {
  const demoData = {
    company: { name: '[Your Company]' },
    rep: {
      name: 'Marta Kowalska',
      email: 'marta@edrone.me',
      phone: '+48 123 456 789',
      photo: ''
    },
    deal: {
      industry: 'CLOTHES_AND_ACCESSORIES',
      pains: ['porzucone_koszyki', 'brak_segmentacji', 'rentownosc_kolejne_zakupy'],
      usps: ['szybka_konfiguracja', 'nieograniczony_dostep', '5_kanalow', 'transparentny_cennik', 'wsparcie', 'szybki_roi'],
      meeting_date: '12 kwietnia 2026, online',
      meeting_link: '#',
      whatsapp_link: '#',
      expiry_date: '',
      database_size: 50000
    },
    line_items: []
  };
  renderOffer(demoData);
}

function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'flex';
  document.getElementById('error-message').textContent = message;
}

// === RENDER ===
async function renderOffer(data) {
  // Load industry metrics
  let metrics = {};
  try {
    const res = await fetch('/data/industry-metrics.json');
    const allMetrics = await res.json();
    metrics = allMetrics[data.deal.industry] || allMetrics['OTHER'] || {};
  } catch (e) {
    console.warn('Could not load industry metrics', e);
  }

  // --- SLIDE 1: Cover ---
  setText('cover-company', data.company.name);
  setText('cover-rep-name', data.rep.name);
  setText('cover-rep-phone', data.rep.phone);
  setText('cover-rep-email', data.rep.email);

  // --- SLIDE 2: Diagnosis (Pains) ---
  renderPains(data.deal.pains);

  // --- COI Metrics ---
  renderCOI(metrics);

  // --- SLIDE 3: Solution + USPs ---
  renderUSPs(data.deal.usps);
  renderPricing(data.line_items, data.deal.database_size);

  // --- PMI Cards ---
  renderPMI(data.deal.pains);

  // --- SLIDE 6: Case Study ---
  renderCaseStudy(data.deal.industry, metrics);

  // --- SLIDE 6: Trusted By ---
  renderTrustedBy();

  // --- SLIDE 8: CTA ---
  setText('cta-rep-name', data.rep.name);
  setText('cta-rep-email', data.rep.email);
  setText('cta-rep-phone', data.rep.phone);
  setText('cta-meeting-company', data.company.name);
  setText('cta-meeting-date', data.deal.meeting_date);

  if (data.rep.photo) {
    document.getElementById('cta-rep-photo').style.backgroundImage = `url(${data.rep.photo})`;
  }

  const whatsappEl = document.getElementById('cta-whatsapp');
  if (data.deal.whatsapp_link) whatsappEl.href = data.deal.whatsapp_link;

  const meetingEl = document.getElementById('cta-meeting-link');
  if (data.deal.meeting_link) meetingEl.href = data.deal.meeting_link;

  // Show content, hide loading
  document.getElementById('loading').style.display = 'none';
  document.getElementById('offer').style.display = 'block';

  // Init scroll animations
  requestAnimationFrame(() => initAnimations());
}

// === RENDER PAINS ===
function renderPains(painKeys) {
  const container = document.getElementById('pains-grid');
  if (!painKeys || painKeys.length === 0) return;

  container.innerHTML = painKeys.map(key => {
    const pain = window.PAIN_LIBRARY[key];
    if (!pain) return '';
    return `
      <div class="pain-card">
        <div class="pain-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h4>${pain.title}</h4>
        <p>${pain.description}</p>
      </div>
    `;
  }).join('');
}

// === RENDER COI ===
function renderCOI(metrics) {
  // Use industry data to show meaningful COI numbers
  if (metrics.monthly_revenue_per_1000) {
    const rev = metrics.monthly_revenue_per_1000;
    document.getElementById('coi-revenue-loss').textContent = rev;
  }
  if (metrics.repeat_rate_change_12m) {
    document.getElementById('coi-repeat').textContent = metrics.repeat_rate_change_12m;
  }
  if (metrics.conversion_rate_change_12m) {
    document.getElementById('coi-abandoned').textContent = metrics.conversion_rate_change_12m || '10';
  }
  if (metrics.aov_change_12m) {
    document.getElementById('coi-clv').textContent = metrics.aov_change_12m;
  }
}

// === RENDER USPs ===
function renderUSPs(uspKeys) {
  const container = document.getElementById('usp-extra-items');
  if (!uspKeys) return;

  // First 3 USPs are already in HTML, render extras
  const extraKeys = uspKeys.slice(3);
  container.innerHTML = extraKeys.map(key => {
    const usp = window.USP_LIBRARY[key];
    if (!usp) return '';
    return `
      <div class="feature-item">
        <div class="feature-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div>
          <h4>${usp.title}</h4>
          <p>${usp.subtitle}</p>
        </div>
      </div>
    `;
  }).join('');
}

// === RENDER PRICING ===
// === PRICING CALCULATOR based on database size (EDF0226HQ) ===
function calculatePrice(dbSize) {
  const tiers = [
    { max: 250, price: 100 }, { max: 300, price: 120 }, { max: 350, price: 140 },
    { max: 400, price: 160 }, { max: 450, price: 180 }, { max: 500, price: 195 },
    { max: 550, price: 215 }, { max: 600, price: 235 }, { max: 650, price: 255 },
    { max: 700, price: 275 }, { max: 750, price: 295 }, { max: 800, price: 315 },
    { max: 850, price: 335 }, { max: 900, price: 355 }, { max: 950, price: 375 },
    { max: 1000, price: 390 }, { max: 1150, price: 410 }, { max: 1300, price: 440 },
    { max: 1450, price: 465 }, { max: 1600, price: 490 }, { max: 1750, price: 515 },
    { max: 2000, price: 540 }, { max: 2250, price: 570 }, { max: 2500, price: 595 },
    { max: 2750, price: 620 }, { max: 3000, price: 645 }, { max: 3250, price: 705 },
    { max: 3500, price: 750 }, { max: 3750, price: 800 }, { max: 4000, price: 845 },
    { max: 4500, price: 900 }, { max: 5000, price: 945 }, { max: 5500, price: 995 },
    { max: 6000, price: 1040 }, { max: 6500, price: 1095 }, { max: 7000, price: 1140 },
    { max: 7500, price: 1190 }, { max: 8000, price: 1235 }, { max: 8500, price: 1290 },
    { max: 9000, price: 1335 }, { max: 9500, price: 1385 }, { max: 10000, price: 1430 },
    { max: 11000, price: 1485 }, { max: 12000, price: 1530 }, { max: 13000, price: 1580 },
    { max: 14000, price: 1625 }, { max: 15000, price: 1680 }, { max: 16000, price: 1725 },
    { max: 17000, price: 1775 }, { max: 18000, price: 1820 }, { max: 19000, price: 1875 },
    { max: 20000, price: 1920 }, { max: 22000, price: 1970 }, { max: 24000, price: 2015 },
    { max: 26000, price: 2070 }, { max: 28000, price: 2115 }, { max: 30000, price: 2165 },
    { max: 32000, price: 2210 }, { max: 34000, price: 2265 }, { max: 36000, price: 2310 },
    { max: 38000, price: 2360 }, { max: 40000, price: 2405 }, { max: 42000, price: 2460 },
    { max: 44000, price: 2505 }, { max: 46000, price: 2555 }, { max: 48000, price: 2600 },
    { max: 50000, price: 2680 }, { max: 52500, price: 2745 }, { max: 55000, price: 2810 },
    { max: 57500, price: 2875 }, { max: 60000, price: 2940 }, { max: 62500, price: 3005 },
    { max: 65000, price: 3070 }, { max: 67500, price: 3135 }, { max: 70000, price: 3200 },
    { max: 72500, price: 3265 }, { max: 75000, price: 3330 }, { max: 77500, price: 3395 },
    { max: 80000, price: 3460 }, { max: 82500, price: 3525 }, { max: 85000, price: 3590 },
    { max: 87500, price: 3655 }, { max: 90000, price: 3720 }, { max: 92500, price: 3785 },
    { max: 95000, price: 3850 }, { max: 97500, price: 3915 }, { max: 100000, price: 3980 },
    { max: 105000, price: 4045 }, { max: 110000, price: 4110 }, { max: 115000, price: 4175 },
    { max: 120000, price: 4240 }, { max: 125000, price: 4305 }, { max: 130000, price: 4370 },
    { max: 135000, price: 4435 }, { max: 140000, price: 4500 }, { max: 145000, price: 4565 },
    { max: 150000, price: 4630 }, { max: 200000, price: 5280 }, { max: 250000, price: 5605 },
    { max: 300000, price: 5930 }, { max: 350000, price: 6255 }, { max: 400000, price: 6580 },
    { max: 450000, price: 6905 }, { max: 500000, price: 7230 }, { max: 600000, price: 7555 },
    { max: 700000, price: 7880 }, { max: 800000, price: 8205 }, { max: 900000, price: 8530 },
    { max: 1000000, price: 8855 }, { max: 1200000, price: 9505 }
  ];
  for (const tier of tiers) {
    if (dbSize <= tier.max) return { price: tier.price, enterprise: false };
  }
  return { price: null, enterprise: true };
}

function renderPricing(lineItems, databaseSize) {
  const linesContainer = document.getElementById('pricing-lines');
  const totalEl = document.getElementById('pricing-total');

  // If line items exist, use them
  if (lineItems && lineItems.length > 0) {
    let total = 0;
    linesContainer.innerHTML = '';
    lineItems.forEach(item => {
      const amount = parseFloat(item.amount || item.price || 0);
      total += amount;
      const line = document.createElement('div');
      line.className = 'pricing-line';
      line.innerHTML = `<span>${item.name || 'Item'}</span><span>${Math.round(amount)} PLN/mo</span>`;
      linesContainer.appendChild(line);
    });
    totalEl.textContent = Math.round(total) + ' PLN';
    return;
  }

  // Otherwise calculate from database size
  if (!databaseSize || databaseSize <= 0) {
    // Fallback: show "contact us" pricing
    linesContainer.innerHTML = '<div class="pricing-line"><span>Cena ustalana indywidualnie</span></div>';
    totalEl.textContent = 'Zapytaj';
    return;
  }

  const result = calculatePrice(databaseSize);
  linesContainer.innerHTML = '';

  if (result.enterprise) {
    const line = document.createElement('div');
    line.className = 'pricing-line';
    line.innerHTML = `<span>Baza: ${databaseSize.toLocaleString('pl-PL')} kontaktów</span><span>Indywidualnie</span>`;
    linesContainer.appendChild(line);
    totalEl.textContent = 'Enterprise';
  } else {
    const line = document.createElement('div');
    line.className = 'pricing-line';
    line.innerHTML = `<span>Licencja edrone (do ${databaseSize.toLocaleString('pl-PL')} kontaktów)</span><span>${result.price} PLN/mo</span>`;
    linesContainer.appendChild(line);
    totalEl.textContent = result.price + ' PLN';
  }

  // Update the /mo label
  const moLabel = document.querySelector('.pricing-mo');
  if (moLabel) moLabel.textContent = '/ mo';
}

// === RENDER PMI ===
function renderPMI(painKeys) {
  const container = document.getElementById('pmi-cards');
  if (!painKeys || painKeys.length === 0) return;

  container.innerHTML = painKeys.map(key => {
    const pmi = window.PMI_LIBRARY[key];
    if (!pmi) return '';
    return `
      <div class="pmi-row">
        <div class="pmi-cell pmi-cell-problem">
          <div class="pmi-icon">
            <img src="/assets/icons/arrow.png" alt="" width="20" height="20">
          </div>
          <span class="pmi-label">Problem</span>
          <h4>${pmi.problem}</h4>
        </div>
        <div class="pmi-cell pmi-cell-mechanism">
          <div class="pmi-icon">
            <img src="/assets/icons/arrow.png" alt="" width="20" height="20">
          </div>
          <span class="pmi-label">Mechanism</span>
          <p>${pmi.mechanism}</p>
        </div>
        <div class="pmi-cell pmi-cell-impact">
          <div class="pmi-icon">
            <img src="/assets/icons/arrow.png" alt="" width="20" height="20">
          </div>
          <span class="pmi-label">financial Impact</span>
          <h4>${pmi.impact}</h4>
        </div>
      </div>
    `;
  }).join('');
}

// === RENDER CASE STUDY ===
function renderCaseStudy(industry, metrics) {
  const cs = window.CASE_STUDIES['default'];
  document.getElementById('case-study-text').textContent = cs.text;

  // Base values (before edrone)
  const baseCR = 1.8;
  const baseRepeat = 12;
  const baseAOV = 0;

  // Conversion Rate
  if (metrics.conversion_rate_change_12m) {
    const change = parseFloat(metrics.conversion_rate_change_12m);
    if (!isNaN(change)) {
      const afterVal = +(baseCR * (1 + change / 100)).toFixed(1);
      const afterHeight = Math.min(30 + change, 90);
      document.getElementById('chart-conversion').style.height = afterHeight + '%';
      document.getElementById('chart-conversion-before-val').textContent = baseCR + '%';
      document.getElementById('chart-conversion-after-val').textContent = afterVal + '%';
    }
  }

  // Repeat Rate
  if (metrics.repeat_rate_change_12m) {
    const change = parseFloat(metrics.repeat_rate_change_12m);
    if (!isNaN(change)) {
      const afterVal = Math.round(baseRepeat * (1 + change / 100));
      const afterHeight = Math.min(25 + change * 0.3, 90);
      document.getElementById('chart-repeat').style.height = afterHeight + '%';
      document.getElementById('chart-repeat-before-val').textContent = baseRepeat + '%';
      document.getElementById('chart-repeat-after-val').textContent = afterVal + '%';
    }
  }

  // AOV Change
  if (metrics.aov_change_12m) {
    const change = parseFloat(metrics.aov_change_12m);
    if (!isNaN(change)) {
      const afterHeight = Math.min(30 + change, 90);
      document.getElementById('chart-aov').style.height = afterHeight + '%';
      document.getElementById('chart-aov-before-val').textContent = '0%';
      document.getElementById('chart-aov-after-val').textContent = '+' + change + '%';
    }
  }

  // Top performing client
  if (metrics.top_client && metrics.top_client.name) {
    const topEl = document.getElementById('top-client');
    if (topEl) {
      topEl.innerHTML = `<span class="top-client-label">Najlepszy wynik w Twojej branży:</span> <a href="${metrics.top_client.domain}" target="_blank" class="top-client-link">${metrics.top_client.name}</a>`;
      topEl.style.display = 'block';
    }
  }
}

// === RENDER TRUSTED BY ===
function renderTrustedBy() {
  const container = document.getElementById('trusted-logos');
  const logos = [
    { name: 'Xiaomi', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/xiaomi.svg' },
    { name: 'Mosquito', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/mosquito.svg' },
    { name: 'Organique', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/organique.svg' },
    { name: 'O bag', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/o-bag.svg' },
    { name: 'Bielenda', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/logotypy-klienci_bielenda-1.png' },
    { name: 'Reporter', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/logotypy-klienci_reporter-1.png' },
    { name: 'Polar Sport', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/logotypy-klienci_polarsport-1.png' },
    { name: 'iSpot', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/logotypy-klienci_ispot-1.png' },
    { name: 'Prima Moda', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/logotypy-klienci_primamoda-1.png' },
    { name: 'Ryłko', url: 'https://wp.edrone.me/wp-content/uploads/2022/08/logotypy-klienci_rylko-1.png' }
  ];

  container.innerHTML = logos.map(l =>
    `<img src="${l.url}" alt="${l.name}" class="trusted-logo-img">`
  ).join('');
}

// === HELPERS ===
function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

// === SCROLL ANIMATIONS ===
function initAnimations() {
  // Add animation classes to elements
  const animateSelectors = [
    { sel: '.cover-title', cls: 'animate-on-scroll' },
    { sel: '.cover-rep', cls: 'animate-on-scroll' },
    { sel: '.btn-primary', cls: 'animate-on-scroll' },
    { sel: '.gradient-bg', cls: 'animate-scale' },
    { sel: '.section-diagnosis .section-title', cls: 'animate-on-scroll' },
    { sel: '.section-coi .section-title', cls: 'animate-on-scroll' },
    { sel: '.coi-bar', cls: 'animate-scale' },
    { sel: '.section-solution .section-title', cls: 'animate-on-scroll' },
    { sel: '.pricing-card', cls: 'animate-left' },
    { sel: '.section-pmi .section-title', cls: 'animate-on-scroll' },
    { sel: '.section-roadmap .section-title', cls: 'animate-on-scroll' },
    { sel: '.section-case-study .section-title', cls: 'animate-on-scroll' },
    { sel: '.case-study-description', cls: 'animate-on-scroll' },
    { sel: '.section-trusted .section-title', cls: 'animate-on-scroll' },
    { sel: '.section-platform .section-title', cls: 'animate-on-scroll' },
    { sel: '.hub-diagram', cls: 'animate-scale' },
    { sel: '.section-cta .section-title', cls: 'animate-on-scroll' },
    { sel: '.cta-card', cls: 'animate-on-scroll' },
    { sel: '.cta-meeting-card', cls: 'animate-on-scroll' },
  ];

  animateSelectors.forEach(({ sel, cls }) => {
    const el = document.querySelector(sel);
    if (el) el.classList.add(cls);
  });

  // Stagger grids
  document.querySelectorAll('.pains-grid, .charts-grid, .spokes-grid, .spokes-mobile').forEach(grid => {
    grid.classList.add('animate-stagger');
  });

  // Individual items in grids
  document.querySelectorAll('.pain-card, .chart-card, .spoke-card, .spoke-card-mobile, .pmi-card, .feature-item, .roadmap-step-card, .coi-item').forEach(el => {
    el.classList.add('animate-on-scroll');
  });

  // Setup Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.animate-on-scroll, .animate-scale, .animate-left, .animate-right, .animate-count').forEach(el => {
    observer.observe(el);
  });
}
