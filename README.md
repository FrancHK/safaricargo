# SafiriCargo

> Mfumo wa usimamizi wa mizigo, magari, na ufuatiliaji wa wateja kwa kampuni za usafirishaji Afrika ya Mashariki.

SafiriCargo ni mfumo kamili wa wavuti (full-stack) unaowezesha kampuni za logistics ku-sajili mizigo, kuipitisha kwenye hatua za uchakataji → usafirishaji → utoaji, kusimamia magari na wateja, na kuwapa wateja njia ya kufuatilia mzigo wao **moja kwa moja** kwa kutumia *tracking ID*.

---

## Vipengele (Features)

- **Ukurasa wa ufuatiliaji** — mteja anaingiza tracking ID na anaona hali ya sasa pamoja na historia ya hali zote.
- **Booking ya mtandaoni** — mteja anaweza kuomba kusafirisha mzigo kupitia website.
- **Portal ya Admin / Manager** — dashboard, wateja, wafanyakazi, magari, matawi (branches), settings, kuprint label.
- **Portal ya Mapokezi** — kupokea, ku-sajili, na kupanga mizigo kwenye magari.
- **Portal ya Wafanyakazi wa Skani** — Mpakiaji, Usafirishaji, na Utoaji wanaupdate hali ya mzigo kwa kuscan QR code.
- **Auth kulingana na role** — JWT tofauti kwa admin, mapokezi, na staff wa kawaida.
- **Label zenye QR code** — zinazoprintika, scan moja inaupdate status ya mzigo.

---

## Teknolojia (Tech Stack)

**Frontend**
- React 19 + TypeScript
- Vite (`@vitejs/plugin-react-oxc`)
- React Router 6
- Tailwind CSS
- Axios, Lucide icons, `qrcode.react`, `html5-qrcode`

**Backend**
- Node.js + Express
- Supabase (PostgreSQL) kupitia `@supabase/supabase-js`
- JWT auth (`jsonwebtoken`) + bcrypt kwa password
- Helmet + CORS

---

## Muundo wa Project (Project Structure)

```
safiricargo/
├── src/                      # React app (frontend)
│   ├── pages/                # Home, Track, Booking, Admin*, StaffPortal, MapokeziPortal, PrintLabel
│   ├── components/           # Navbar, Footer, ShipmentLabel, TrackingTimeline, ProtectedRoute, ...
│   ├── api/                  # Axios API clients
│   ├── contexts/             # AuthContext
│   ├── types/                # Aina za TypeScript (shared types)
│   └── App.tsx, main.tsx, index.css
│
├── backend/                  # Express API
│   ├── server.js             # Mwanzo wa app, route wiring
│   ├── src/
│   │   ├── routes/           # shipments, auth, customers, staff, vehicles, settings, branches
│   │   ├── middleware/       # auth, staffAuth, eitherAuth
│   │   ├── services/         # shipmentService, ...
│   │   ├── config/           # Supabase client
│   │   ├── seed.js           # Data ya awali
│   │   └── migrate-departments.js
│   └── sql/                  # SQL migrations (mfano: 2026-06-16-add-cargo-items.sql)
│
├── public/                   # Static assets (logo, picha)
├── vite.config.ts            # Dev server + proxy ya /api → http://localhost:5000
├── tailwind.config.js
└── tsconfig.json
```

---

## Mahitaji ya Awali (Prerequisites)

- **Node.js 20+**
- **npm** (huja na Node)
- Project ya **Supabase** (free tier inafaa) yenye tables za `sc_*` — angalia `backend/sql/` kwa migrations.

---

## Mpangilio (Setup)

Clone repo na install dependencies za frontend na backend:

```bash
git clone git@github.com:FrancHK/safaricargo.git
cd safaricargo

# Dependencies za frontend
npm install

# Dependencies za backend
cd backend
npm install
cd ..
```

### Variables za Mazingira (`.env`)

Tengeneza file `backend/.env` ukiiga `backend/.env.example`:

```env
PORT=5000
JWT_SECRET=badilisha_hii_iwe_string_ndefu_ya_random
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> ⚠️ **Usicommit kamwe** file ya `.env` au yoyote inayoitwa `*firebase*adminsdk*.json` / `*service-account*.json`. `.gitignore` tayari inazi-block — iache hivyo.

### Database

Run SQL files zilizopo `backend/sql/` kwenye project yako ya Supabase (kwa kutumia SQL editor au `psql`). Tables zinazohitajika ni `sc_staff`, `sc_shipments`, `sc_scan_logs`, `sc_customers`, `sc_vehicles`, `sc_branches`, na `sc_settings`.

Seed ya awali (inatengeneza admin user na sample data) — optional:

```bash
cd backend
npm run seed
```

---

## Kurun Kwenye Mazingira ya Ndani (Local)

Fungua terminals **mbili**.

**Terminal 1 — backend (port 5000):**

```bash
cd backend
npm run dev      # nodemon, inai-reload yenyewe ukibadilisha code
# au: npm start
```

Utaona:

```
🚀 SafiriCargo API running on http://localhost:5000
📦 Database: Supabase — https://...supabase.co
```

**Terminal 2 — frontend (port 5173):**

```bash
npm run dev
```

Vite inai-proxy kila request ya `/api/*` kwenda `http://localhost:5000`, kwa hivyo frontend inakuwa connected na local backend moja kwa moja.

Tembelea:
- Tovuti ya umma: http://localhost:5173/
- Ufuatiliaji: http://localhost:5173/track
- Booking: http://localhost:5173/book
- Login ya Admin / Mapokezi: http://localhost:5173/admin/login
- Portal ya kuskani (staff): http://localhost:5173/staff

---

## Roles na Portals

| Role | URL ya kuingia | Maelezo |
|---|---|---|
| **Admin / Manager** | `/admin/login` → tab ya *Manager* | Anaona kila kitu: dashboard, wateja, staff, magari, matawi, settings. |
| **Mapokezi (Reception)** | `/admin/login` → tab ya *Mapokezi* | Akaunti yenye `sc_staff.department = 'Mapokezi'` tu. Inapokea/inasajili mizigo. |
| **Wafanyakazi wa Skani** | `/staff` | Kwa wafanyakazi wa `Mpakiaji`, `Usafirishaji`, au `Utoaji`. Kila scan inai-advance mzigo kwenda status inayofuata. |

Hatua za status zinazoendeshwa na scan (`backend/src/routes/staff.js`):

```
Mpakiaji      → "Processing"
Usafirishaji  → "In Transit"
Utoaji        → "Out for Delivery"
```

---

## API (Muhtasari)

Endpoints zote ziko chini ya `/api` na zinalindwa na JWT (isipokuwa zile za umma kama tracking lookup).

| Prefix | Inafanya nini |
|---|---|
| `/api/auth` | Login ya admin + session |
| `/api/staff` | Login, scan, na CRUD ya staff (admin only kwa CRUD) |
| `/api/shipments` | Create, list, update, na tafuta kwa tracking ID (lookup ni ya umma) |
| `/api/customers` | CRUD ya wateja |
| `/api/vehicles` | CRUD ya magari + assignment |
| `/api/branches` | CRUD ya matawi |
| `/api/settings` | Settings za kampuni |
| `/api/health` | Health check |

---

## Kujenga kwa Production (Build)

```bash
# Bundle ya frontend → dist/
npm run build

# Backend kwa production
cd backend
NODE_ENV=production npm start
```

Host `dist/` kwenye host yoyote ya static (Vercel, Netlify, Nginx, Cloudflare Pages). Hakikisha `/api/*` ya frontend inai-point kwenye backend URL ya uliko-deploy.

---

## Amri Muhimu (Scripts)

| Amri | Mahali | Inafanya nini |
|---|---|---|
| `npm run dev` | root | Anzisha Vite dev server (port 5173) |
| `npm run build` | root | Type-check + build ya frontend |
| `npm run preview` | root | Preview ya production build |
| `npm run dev` | `backend/` | Anzisha Express na nodemon (port 5000) |
| `npm start` | `backend/` | Anzisha Express (bila auto-reload) |
| `npm run seed` | `backend/` | Weka data ya awali kwenye Supabase |

---

## Kuchangia (Contributing)

1. Tengeneza branch mpya kutoka `main`.
2. Run frontend + backend kwenye local, kisha thibitisha mabadiliko yako kwenye UI.
3. Fungua PR ukieleza umebadilisha nini na kwa nini.

Usiweke secrets (passwords, API keys, service accounts) kwenye commits. Tumia Tailwind classes zilizopo / design tokens za `index.css` ili UI ibaki na muonekano mmoja.

---

## Leseni

Proprietary — © SafiriCargo. Haki zote zimehifadhiwa.
