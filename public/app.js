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
  renderTrustedBy(data.deal.database_size);

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
// === PRICING CALCULATOR based on database size ===
function calculatePrice(dbSize) {
  const tiers = [
    { max: 200, price: 0 },
    { max: 300, price: 120 },
    { max: 550, price: 215 },
    { max: 750, price: 295 },
    { max: 1000, price: 355 },
    { max: 1150, price: 410 },
    { max: 1500, price: 450 },
    { max: 2000, price: 510 },
    { max: 2250, price: 570 },
    { max: 3000, price: 680 },
    { max: 4000, price: 810 },
    { max: 5000, price: 910 },
    { max: 5500, price: 995 },
    { max: 6500, price: 1095 },
    { max: 7500, price: 1195 },
    { max: 8500, price: 1295 },
    { max: 9500, price: 1385 },
    { max: 10000, price: 1485 }
  ];
  if (dbSize > 10000) return { price: null, enterprise: true };
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
  if (!databaseSize || databaseSize <= 0) return;

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
}

// === RENDER TRUSTED BY ===
function renderTrustedBy(databaseSize) {
  const container = document.getElementById('trusted-logos');
  // Placeholder — in production, replace with actual logo URLs
  const brands = databaseSize > 100000
    ? ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'Brand E']
    : ['Industry Brand 1', 'Industry Brand 2', 'Industry Brand 3', 'Industry Brand 4'];

  container.innerHTML = brands.map(b =>
    `<span style="font-weight:700;font-size:18px;color:#999">${b}</span>`
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
