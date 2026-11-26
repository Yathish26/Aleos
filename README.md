# ALEOS Rewards — Frontend

The website for [ALEOS Rewards](https://www.aleos.co.in), a local rewards network. Members earn reward points when they shop at partner stores, and merchants use ALEOS to bring customers back.

This is a React single-page app built with Vite and Tailwind CSS. It gets all its data from the **AleosSR** backend API.

## Who uses it

| Role | What they do | Pages |
| --- | --- | --- |
| **Member** | Sign up with a referral code, see reward points and referrals | `/join/member`, `/login`, `/dashboard` |
| **Merchant** | List a business, give reward points, recharge the wallet, track customers | `/join/merchant`, `/merchant/login`, `/merchant/dashboard` |
| **Admin** | Review and manage members and merchants | `/admin`, `/admin/dashboard`, `/admin/members/:id`, `/admin/merchants/:id` |

Public pages: `/` (home), `/about`, `/terms/member`, `/terms/merchant`. Any other URL shows the 404 page.

## Tech stack

- React 19 + React Router 7
- Vite 8
- Tailwind CSS 4 (through `@tailwindcss/vite`)
- ESLint 10
- Hosted on Vercel

## Getting started

You need Node.js and a running AleosSR backend.

```bash
npm install
```

Create `.env` in this folder:

```env
# AleosSR backend URL, without /api
VITE_API_URL=http://localhost:5000
```

Then start the dev server:

```bash
npm run dev
```

## Environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base URL of the AleosSR backend. If it is missing, an error is logged in the browser console. |
| `VITE_SITE_URL` | No | Public site address used for canonical and link-preview URLs. Defaults to `https://www.aleos.co.in`. |

In production, set these in the Vercel project settings.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server with hot reload |
| `npm run build` | Builds the production site into `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run lint` | Runs ESLint |

## Project structure

```
src/
  main.jsx          App entry point
  App.jsx           All routes
  api.js            fetch wrapper for the backend, plus IST date and time formatting
  config.js         Site-wide contact details (support email)
  version.js        Version number shown in the footer
  store/            Login state for members, merchants and admins (kept in localStorage)
  components/       Shared UI: layout, SEO tags, pagination, points ledger, share buttons, etc.
  pages/            One file per route
public/             Favicon, images, robots.txt, sitemap.xml
vercel.json         Sends every URL to index.html so client-side routes work
```

## Things to know

- **Version number:** the footer shows `v<APP_VERSION>` from [src/version.js](src/version.js). Bump it by hand before each release.
- **Support email:** change it in [src/config.js](src/config.js) and every page that shows it updates.
- **SEO:** [src/components/Seo.jsx](src/components/Seo.jsx) sets the title, description and link-preview tags for each public page. Dashboards, admin pages and unknown URLs get `noindex`. When you add a public page, add it there and to `public/sitemap.xml`.
- **Dates and times** are always shown in Indian Standard Time, whatever the viewer's time zone.
- **Login expiry:** API errors carry the HTTP status, and a `401` means the login has expired.

## Deployment

The site deploys to Vercel. Set `VITE_API_URL` (and optionally `VITE_SITE_URL`) in the Vercel project settings. Vercel runs `npm run build` and serves `dist/`.
