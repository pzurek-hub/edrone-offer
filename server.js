import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// === AUTO-DETECTION: Industry mapping from HubSpot standard values ===
// Maps HubSpot's standard company.industry to our 25 edrone industry keys
const INDUSTRY_MAP = {
  // Direct matches (our keys)
  'CLOTHES_AND_ACCESSORIES': 'CLOTHES_AND_ACCESSORIES',
  'HEALTH_AND_BEAUTY': 'HEALTH_AND_BEAUTY',
  'ELECTRONICS': 'ELECTRONICS',
  'HOME_AND_GARDEN': 'HOME_AND_GARDEN',
  'FOOD_DRINK_AND_TOBACCO': 'FOOD_DRINK_AND_TOBACCO',
  'HEALTH_AND_WELLNESS': 'HEALTH_AND_WELLNESS',
  'ANIMALS_AND_PET_SUPPLIES': 'ANIMALS_AND_PET_SUPPLIES',
  'KIDS_AND_BABIES': 'KIDS_AND_BABIES',
  'FURNITURE': 'FURNITURE',
  'JEWELRY': 'JEWELRY',
  'SPORT_EQUIPMENT': 'SPORT_EQUIPMENT',
  'GAMES_AND_TOYS': 'GAMES_AND_TOYS',
  'GADGETS_AND_ADVERTISING': 'GADGETS_AND_ADVERTISING',
  'ART_AND_ENTERTAINMENT': 'ART_AND_ENTERTAINMENT',
  'TRAVEL_ACCESSORIES': 'TRAVEL_ACCESSORIES',
  'VEHICLES_AND_PARTS': 'VEHICLES_AND_PARTS',
  'EQUIPMENT': 'EQUIPMENT',
  'MEDIA': 'MEDIA',
  'OFFICE_SUPPLIES': 'OFFICE_SUPPLIES',
  'BUSINESS_AND_INDUSTRIAL': 'BUSINESS_AND_INDUSTRIAL',
  'EVENTS': 'EVENTS',
  'SOFTWARE': 'SOFTWARE',
  'ARTICLES_FOR_ADULTS': 'ARTICLES_FOR_ADULTS',
  'RELIGIOUS_AND_DEVOTIONAL_ARTICLES': 'RELIGIOUS_AND_DEVOTIONAL_ARTICLES',
  // HubSpot standard → our key
  'RETAIL': 'CLOTHES_AND_ACCESSORIES',
  'APPAREL': 'CLOTHES_AND_ACCESSORIES',
  'CONSUMER_GOODS': 'CLOTHES_AND_ACCESSORIES',
  'LUXURY_GOODS_JEWELRY': 'JEWELRY',
  'TEXTILES': 'CLOTHES_AND_ACCESSORIES',
  'FOOD_PRODUCTION': 'FOOD_DRINK_AND_TOBACCO',
  'FOOD_BEVERAGES': 'FOOD_DRINK_AND_TOBACCO',
  'RESTAURANTS': 'FOOD_DRINK_AND_TOBACCO',
  'HOSPITALITY': 'EVENTS',
  'CONSUMER_ELECTRONICS': 'ELECTRONICS',
  'COMPUTER_HARDWARE': 'ELECTRONICS',
  'COMPUTER_SOFTWARE': 'SOFTWARE',
  'INFORMATION_TECHNOLOGY_AND_SERVICES': 'SOFTWARE',
  'HEALTH_WELLNESS_AND_FITNESS': 'HEALTH_AND_WELLNESS',
  'COSMETICS': 'HEALTH_AND_BEAUTY',
  'PHARMACEUTICALS': 'HEALTH_AND_WELLNESS',
  'MEDICAL_DEVICES': 'HEALTH_AND_WELLNESS',
  'BUILDING_MATERIALS': 'HOME_AND_GARDEN',
  'DESIGN': 'HOME_AND_GARDEN',
  'ARCHITECTURE_PLANNING': 'HOME_AND_GARDEN',
  'AUTOMOTIVE': 'VEHICLES_AND_PARTS',
  'SPORTING_GOODS': 'SPORT_EQUIPMENT',
  'ENTERTAINMENT': 'ART_AND_ENTERTAINMENT',
  'PUBLISHING': 'MEDIA',
  'EDUCATION': 'MEDIA',
};

// === AUTO-DETECTION: Default pains per industry (when not manually set) ===
const DEFAULT_PAINS = {
  'CLOTHES_AND_ACCESSORIES': ['porzucone_koszyki', 'brak_segmentacji', 'retencja'],
  'HEALTH_AND_BEAUTY': ['retencja', 'cykl_produktu', 'brak_segmentacji'],
  'ELECTRONICS': ['porzucone_koszyki', 'niska_konwersja', 'niski_koszyk'],
  'HOME_AND_GARDEN': ['porzucone_koszyki', 'dlugi_proces', 'niska_konwersja'],
  'FOOD_DRINK_AND_TOBACCO': ['retencja', 'cykl_produktu', 'brak_segmentacji'],
  'HEALTH_AND_WELLNESS': ['retencja', 'cykl_produktu', 'brak_segmentacji'],
  'ANIMALS_AND_PET_SUPPLIES': ['retencja', 'cykl_produktu', 'brak_segmentacji'],
  'KIDS_AND_BABIES': ['retencja', 'porzucone_koszyki', 'cykl_produktu'],
  'FURNITURE': ['porzucone_koszyki', 'dlugi_proces', 'niski_koszyk'],
  'JEWELRY': ['porzucone_koszyki', 'brak_segmentacji', 'niski_koszyk'],
  'SPORT_EQUIPMENT': ['porzucone_koszyki', 'retencja', 'niska_konwersja'],
  'GAMES_AND_TOYS': ['retencja', 'cykl_produktu', 'porzucone_koszyki'],
  'GADGETS_AND_ADVERTISING': ['porzucone_koszyki', 'niska_konwersja', 'brak_segmentacji'],
  'ART_AND_ENTERTAINMENT': ['niska_konwersja', 'brak_segmentacji', 'retencja'],
  'TRAVEL_ACCESSORIES': ['porzucone_koszyki', 'retencja', 'niska_konwersja'],
  'VEHICLES_AND_PARTS': ['porzucone_koszyki', 'dlugi_proces', 'niski_koszyk'],
  'EQUIPMENT': ['porzucone_koszyki', 'dlugi_proces', 'niska_konwersja'],
  'MEDIA': ['retencja', 'brak_segmentacji', 'niska_konwersja'],
  'OFFICE_SUPPLIES': ['retencja', 'cykl_produktu', 'brak_segmentacji'],
  'BUSINESS_AND_INDUSTRIAL': ['porzucone_koszyki', 'dlugi_proces', 'niska_konwersja'],
  'EVENTS': ['niska_konwersja', 'brak_segmentacji', 'retencja'],
  'SOFTWARE': ['niska_konwersja', 'dlugi_proces', 'brak_segmentacji'],
  'ARTICLES_FOR_ADULTS': ['porzucone_koszyki', 'retencja', 'brak_segmentacji'],
  'RELIGIOUS_AND_DEVOTIONAL_ARTICLES': ['retencja', 'niska_konwersja', 'brak_segmentacji'],
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
      'offer_database_size', 'offer_expiry_date', 'hubspot_owner_id', 'offer_url'
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

    // Auto-save offer_url to deal + create note (only once, if not already set)
    const OFFER_BASE_URL = process.env.OFFER_BASE_URL || 'https://offer.edrone.me';
    const offerUrl = `${OFFER_BASE_URL}/?deal=${id}`;
    if (!deal.offer_url) {
      try {
        // Save offer_url property
        await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: { offer_url: offerUrl } })
        });
        // Create note on deal
        const noteBody = `<p><strong>Oferta wygenerowana:</strong></p><p><a href="${offerUrl}" target="_blank">${offerUrl}</a></p>`;
        await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            properties: { hs_note_body: noteBody, hs_timestamp: new Date().toISOString() },
            associations: [{ to: { id: id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }] }]
          })
        });
        console.log(`Auto-saved offer link for deal ${id}`);
      } catch (e) {
        console.warn('Could not auto-save offer link:', e.message);
      }
    }

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
