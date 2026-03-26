// Vercel Serverless Function — HubSpot Deal Data Proxy
// GET /api/deal?id=DEAL_ID

export default async function handler(req, res) {
  // CORS
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
    // 1. Fetch Deal with properties
    const dealProperties = [
      'dealname',
      'industry',          // custom: ecommerce industry
      'client_pains',      // custom: multi-select pains
      'client_usps',       // custom: multi-select USPs
      'meeting_date',      // custom: meeting date string
      'meeting_link',      // custom: Google Meet link
      'whatsapp_link',     // custom: WhatsApp link
      'database_size',     // custom: client database size
      'offer_expiry_date', // custom: offer validity
      'hubspot_owner_id'
    ].join(',');

    const dealRes = await hubspotGet(
      `/crm/v3/objects/deals/${id}?properties=${dealProperties}&associations=companies,contacts`,
      HUBSPOT_TOKEN
    );

    const deal = dealRes.properties;

    // 2. Fetch associated Company
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

    // 3. Fetch Deal Owner (sales rep)
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

    // 4. Fetch Line Items
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

    // 5. Parse multi-select fields
    const pains = parseMultiSelect(deal.client_pains);
    const usps = parseMultiSelect(deal.client_usps);

    // 6. Build response
    const response = {
      company,
      rep,
      deal: {
        industry: deal.industry || company.industry || 'OTHER',
        pains,
        usps: usps.length > 0 ? usps : [
          'szybka_konfiguracja', 'nieograniczony_dostep', '5_kanalow',
          'transparentny_cennik', 'wsparcie', 'szybki_roi'
        ],
        meeting_date: deal.meeting_date || '',
        meeting_link: deal.meeting_link || '',
        whatsapp_link: deal.whatsapp_link || '',
        expiry_date: deal.offer_expiry_date || '',
        database_size: parseInt(deal.database_size) || 0
      },
      line_items: lineItems
    };

    return res.status(200).json(response);

  } catch (err) {
    console.error('HubSpot API error:', err);
    return res.status(500).json({ error: 'Failed to fetch deal data', details: err.message });
  }
}

// === HELPERS ===

async function hubspotGet(path, token) {
  const url = `https://api.hubapi.com${path}`;
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
