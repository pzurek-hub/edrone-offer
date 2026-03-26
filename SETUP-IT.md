# edrone Offer Page — Instrukcja wdrozenia dla IT

## 1. HubSpot Private App

Stworz Private App w HubSpocie:
- Idz do: Settings > Integrations > Private Apps > Create a Private App
- Nazwa: `edrone-offer-page`
- Scopes (read only):
  - `crm.objects.deals.read`
  - `crm.objects.contacts.read`
  - `crm.objects.companies.read`
  - `crm.objects.line_items.read`
  - `crm.objects.owners.read`
- Po stworzeniu skopiuj **Access Token** (zaczyna sie od `pat-...`)

## 2. Custom Deal Properties

Upewnij sie ze w HubSpocie istnieja nastepujace Deal Properties.
Jesli nie istnieja — stworz je recznie lub przez API.

| Property name    | Label                  | Type         | Opis                                                        |
|------------------|------------------------|--------------|-------------------------------------------------------------|
| `industry`       | Branza e-commerce      | Dropdown     | Wartosci: CLOTHES_AND_ACCESSORIES, ELECTRONICS, HEALTH_AND_BEAUTY, FOOD_DRINK_AND_TOBACCO, HOME_AND_GARDEN, KIDS_AND_BABIES, SPORT_EQUIPMENT, JEWELRY, FURNITURE, ANIMALS_AND_PET_SUPPLIES, GAMES_AND_TOYS, HEALTH_AND_WELLNESS, BUSINESS_AND_INDUSTRY, VEHICLES_AND_PARTS, EQUIPMENT, OFFICE_SUPPLIES, MEDIA, ART_AND_ENTERTAINMENT, EVENTS, TRAVEL_ACCESSORIES, GADGETS_AND_ADVERTISING, OTHER |
| `client_pains`   | Bole klienta           | Multi-select | Wartosci: porzucone_koszyki, brak_segmentacji, brak_powracalnosci, niski_koszyk, niewykorzystany_ruch, cykl_produktu, dlugi_proces, rentownosc_kolejne_zakupy, brak_mierzalnosci, nieaktywni_klienci |
| `client_usps`    | USP dla klienta        | Multi-select | Wartosci: szybka_konfiguracja, nieograniczony_dostep, 5_kanalow, transparentny_cennik, wsparcie, szybki_roi |
| `meeting_date`   | Data spotkania         | Single-line text | Np. "12 kwietnia 2026, online"                          |
| `meeting_link`   | Link do spotkania      | Single-line text | Link Google Meet                                        |
| `whatsapp_link`  | WhatsApp handlowca     | Single-line text | Link wa.me/48...                                        |
| `database_size`  | Wielkosc bazy klienta  | Number       | Liczba klientow w bazie (wplywa na dobor logo Trusted By)   |

## 3. Deploy na Vercel

### Wymagania
- Konto na vercel.com
- Node.js (do instalacji Vercel CLI)

### Kroki

```bash
# 1. Zainstaluj Vercel CLI
npm i -g vercel

# 2. Wejdz do folderu projektu
cd /Users/paulinazurek/edrone-offer

# 3. Zaloguj sie
vercel login

# 4. Deploy
vercel deploy --prod

# 5. Dodaj env variable
vercel env add HUBSPOT_API_KEY
# Wklej Access Token z kroku 1 (pat-...)
```

### Custom Domain (opcjonalnie)
1. W Vercel Dashboard > Project Settings > Domains
2. Dodaj `offer.edrone.me`
3. W DNS edrone.me dodaj CNAME: `offer.edrone.me` -> `cname.vercel-dns.com`

## 4. Jak to dziala

### Workflow handlowca:
1. Handlowiec tworzy/edytuje Deal w HubSpocie
2. Wypelnia properties: branza, bole klienta, USP, data spotkania, linki
3. Dodaje Line Items (licencja, SMS, AI Recommendations itp.)
4. Kopiuje link: `https://offer.edrone.me/?deal=DEAL_ID`
5. Wysyla link klientowi

### Skad wziac Deal ID:
- W HubSpocie otworz Deal
- Deal ID jest w URL: `https://app.hubspot.com/contacts/.../deal/DEAL_ID`

### Co strona robi automatycznie:
- Pobiera dane deala, firmy, kontaktu, handlowca z HubSpot API
- Dopasowuje metryki branżowe (z wbudowanej bazy 24 branz)
- Wyswietla wybrane bole klienta z opisami Problem/Mechanism/Impact
- Wyswietla pricing z Line Items
- Wyswietla dane handlowca i linki do spotkania/WhatsApp

## 5. Struktura projektu

```
edrone-offer/
├── public/               # Frontend (statyczne pliki)
│   ├── index.html        # Glowna strona oferty
│   ├── styles.css        # Style
│   ├── app.js            # Logika JS
│   ├── assets/
│   │   ├── edrone-logo.svg
│   │   ├── offer-video.mov
│   │   ├── fonts/        # HelveticaNeueLTPro (Bold, Roman, Outline, Medium)
│   │   └── icons/        # Ikony edrone z brandbooka
│   └── data/
│       ├── content-library.js   # Biblioteki tresci (bole, USP, PMI)
│       └── industry-metrics.json # Metryki 24 branz
├── api/
│   └── deal.js           # Vercel Serverless — proxy do HubSpot API
├── vercel.json
└── package.json
```

## 6. Uwagi

- Video `offer-video.mov` (47MB) — na produkcji warto skonwertowac do MP4/WebM i skompresowac
- Fonty HelveticaNeueLTPro sa licencjonowane — upewnij sie ze macie licencje na web use
- HubSpot API key NIE jest eksponowany klientowi (przechodzi przez serverless proxy)
- Strona dziala bez JS po stronie serwera — caly rendering jest po stronie klienta
