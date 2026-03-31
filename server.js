import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// === AUTO-DETECTION: Industry mapping from HubSpot standard values ===
const INDUSTRY_MAP = {
  // HubSpot standard industry → edrone offer industry key
  'RETAIL': 'FASHION', 'APPAREL': 'FASHION', 'CONSUMER_GOODS': 'FASHION',
  'LUXURY_GOODS_JEWELRY': 'FASHION', 'TEXTILES': 'FASHION',
  'FOOD_PRODUCTION': 'FOOD', 'FOOD_BEVERAGES': 'FOOD',
  'RESTAURANTS': 'FOOD', 'HOSPITALITY': 'FOOD',
  'CONSUMER_ELECTRONICS': 'ELECTRONICS', 'COMPUTER_HARDWARE': 'ELECTRONICS',
  'COMPUTER_SOFTWARE': 'ELECTRONICS', 'INFORMATION_TECHNOLOGY_AND_SERVICES': 'ELECTRONICS',
  'HEALTH_WELLNESS_AND_FITNESS': 'HEALTH_BEAUTY', 'COSMETICS': 'HEALTH_BEAUTY',
  'PHARMACEUTICALS': 'HEALTH_BEAUTY', 'MEDICAL_DEVICES': 'HEALTH_BEAUTY',
  'FURNITURE': 'HOME_GARDEN', 'BUILDING_MATERIALS': 'HOME_GARDEN',
  'DESIGN': 'HOME_GARDEN', 'ARCHITECTURE_PLANNING': 'HOME_GARDEN',
};

// === AUTO-DETECTION: Default pains per industry (when not manually set) ===
const DEFAULT_PAINS = {
  'FASHION': ['porzucone_koszyki', 'brak_segmentacji', 'retencja'],
  'ELECTRONICS': ['porzucone_koszyki', 'niska_konwersja', 'niski_koszyk'],
  'FOOD': ['retencja', 'cykl_produktu', 'brak_segmentacji'],
  'HEALTH_BEAUTY': ['retencja', 'cykl_produktu', 'brak_segmentacji'],
  'HOME_GARDEN': ['porzucone_koszyki', 'dlugi_proces', 'niska_konwersja'],
  'OTHER': ['porzucone_koszyki', 'brak_segmentacji', 'retencja'],
};

function resolveIndustry(offerIndustry, companyIndustry) {
  if (offerIndustry) return offerIndustry;
  if (!companyIndustry) return 'OTHER';
  const upper = companyIndustry.toUpperCase().replace(/[^A-Z_]/g, '_');
  return INDUSTRY_MAP[upper] || 'OTHER';
}

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// API: HubSpot Deal Data Proxy
app.get('/api/deal', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing deal ID. Use ?id=DEAL_ID' });
  }

  const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY;
  if (!HUBSPOT_TOKEN) {
    return res.status(500).json({ error: 'HubSpot API key not configured' });
  }

  try {
    const dealProperties = [
      'dealname', 'offer_industry', 'offer_client_pains', 'client_usps',
      'offer_meeting_date', 'offer_meeting_link', 'whatsapp_link',
      'offer_database_size', 'offer_expiry_date', 'hubspot_owner_id'
    ].join(',');

    const dealRes = await hubspotGet(
      `/crm/v3/objects/deals/${id}?properties=${dealProperties}&associations=companies,contacts`,
      HUBSPOT_TOKEN
    );

    const deal = dealRes.properties;

    // Fetch associated Company
    let company = { name: deal.dealname || '[Company]' };
    const companyAssoc = dealRes.associations?.companies?.results?.[0];
    if (companyAssoc) {
      const companyRes = await hubspotGet(
        `/crm/v3/objects/companies/${companyAssoc.id}?properties=name,industry`,
        HUBSPOT_TOKEN
      );
      company = {
        name: companyRes.properties.name || deal.dealname,
        industry: companyRes.properties.industry
      };
    }

    // Fetch Deal Owner (sales rep)
    let rep = { name: '', email: '', phone: '', photo: '' };
    if (deal.hubspot_owner_id) {
      try {
        const ownerRes = await hubspotGet(
          `/crm/v3/owners/${deal.hubspot_owner_id}`,
          HUBSPOT_TOKEN
        );
        rep = {
          name: `${ownerRes.firstName || ''} ${ownerRes.lastName || ''}`.trim(),
          email: ownerRes.email || '',
          phone: ownerRes.phone || '',
          photo: ownerRes.avatar || ''
        };
      } catch (e) {
        console.warn('Could not fetch owner:', e.message);
      }
    }

    // Fetch Line Items
    let lineItems = [];
    try {
      const lineItemsRes = await hubspotGet(
        `/crm/v3/objects/deals/${id}/associations/line_items`,
        HUBSPOT_TOKEN
      );
      if (lineItemsRes.results) {
        const itemPromises = lineItemsRes.results.map(li =>
          hubspotGet(
            `/crm/v3/objects/line_items/${li.id}?properties=name,price,quantity,amount`,
            HUBSPOT_TOKEN
          )
        );
        const items = await Promise.all(itemPromises);
        lineItems = items.map(i => i.properties);
      }
    } catch (e) {
      console.warn('Could not fetch line items:', e.message);
    }

    // Parse multi-select fields
    const pains = parseMultiSelect(deal.offer_client_pains);
    const usps = parseMultiSelect(deal.client_usps);

    // Auto-detect industry from company record if not manually set
    const industry = resolveIndustry(deal.offer_industry, company.industry);

    // Auto-assign default pains if none selected
    const resolvedPains = pains.length > 0 ? pains : (DEFAULT_PAINS[industry] || DEFAULT_PAINS['OTHER']);

    const response = {
      company,
      rep,
      deal: {
        industry,
        pains: resolvedPains,
        usps: usps.length > 0 ? usps : [
          'szybka_konfiguracja', 'nieograniczony_dostep', '5_kanalow',
          'transparentny_cennik', 'wsparcie', 'szybki_roi'
        ],
        meeting_date: deal.offer_meeting_date || '',
        meeting_link: deal.offer_meeting_link || '',
        whatsapp_link: deal.whatsapp_link || '',
        expiry_date: deal.offer_expiry_date || '',
        database_size: parseInt(deal.offer_database_size) || 0
      },
      line_items: lineItems
    };

    return res.status(200).json(response);

  } catch (err) {
    console.error('HubSpot API error:', err);
    return res.status(500).json({ error: 'Failed to fetch deal data', details: err.message });
  }
});

// API: Auto-generate offer URL and save to deal + create note
app.post('/api/generate-offer', express.json(), async (req, res) => {
  const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY;
  if (!HUBSPOT_TOKEN) return res.status(500).json({ error: 'HubSpot API key not configured' });

  const dealId = req.body?.dealId || req.body?.object?.objectId;
  if (!dealId) return res.status(400).json({ error: 'Missing dealId' });

  const OFFER_BASE_URL = process.env.OFFER_BASE_URL || 'https://offer.edrone.me';
  const offerUrl = `${OFFER_BASE_URL}/?deal=${dealId}`;

  try {
    // 1. Save offer_url to deal
    await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: { offer_url: offerUrl } })
    });

    // 2. Create note on deal with the link
    const noteBody = `<p><strong>Oferta wygenerowana automatycznie:</strong></p><p><a href="${offerUrl}" target="_blank">${offerUrl}</a></p>`;
    const noteRes = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { hs_note_body: noteBody, hs_timestamp: new Date().toISOString() },
        associations: [{ to: { id: dealId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }] }]
      })
    });

    console.log(`Offer generated for deal ${dealId}: ${offerUrl}`);
    return res.status(200).json({ success: true, offer_url: offerUrl });
  } catch (err) {
    console.error('Generate offer error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Fallback — serve index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`edrone-offer running on port ${PORT}`);
});

// === HELPERS ===
async function hubspotGet(pathStr, token) {
  const url = `https://api.hubapi.com${pathStr}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HubSpot ${response.status}: ${text}`);
  }
  return response.json();
}

function parseMultiSelect(value) {
  if (!value) return [];
  return value.split(';').map(v => v.trim()).filter(Boolean);
}
