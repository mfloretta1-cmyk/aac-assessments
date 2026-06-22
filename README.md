# AAC Math Assessments v2.0

Adaptive math placement assessments for Academic Achievement Center, Eugene OR.
Includes Supabase database integration and admin dashboard.

## First-time Setup

### 1. Create the database table (one-time only)
1. Go to your Supabase project → SQL Editor → New Query
2. Paste the contents of `supabase_schema.sql`
3. Click Run

### 2. Deploy to Netlify
- Push to GitHub → connect to Netlify (auto-detected from netlify.toml)
- Or: run `npm run build` → drag `dist/` to app.netlify.com/drop

### 3. Password protect in Netlify
Site settings → Access control → Password protection

### 4. Embed in Wix
1. In Wix editor: Add element → Embed & Social → HTML iframe
2. Set the iframe source to your Netlify URL
3. Recommended size: 100% width, 900px height

### Admin Dashboard
Access via the "Admin" button on the landing page, or go to:
`https://your-netlify-url.netlify.app/?admin`

Default password: `aac2026` (change in AdminDashboard.jsx line 6)

## Local Development
```bash
npm install
npm run dev
```
