import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

    const response = {
      company,
      rep,
      deal: {
        industry: deal.offer_industry || company.industry || 'OTHER',
        pains,
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
