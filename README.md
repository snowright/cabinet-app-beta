# cabinet.

## Before uploading to GitHub, do this one thing:

Open `src/components/FounderFollowSuggestion.jsx` in any text editor.

Find this section near the top:

```js
export const FOUNDER_PROFILE = {
  name:           "Your Name",                   // ← your real name
  handle:         "@cabinet",                    // ← your handle
  avatarInitials: "YN",                          // ← your initials
  userId:         "REPLACE_WITH_YOUR_USER_UUID", // ← your Supabase user ID
  ...
}
```

Fill in your real name, handle, and initials. Leave `userId` for now — you'll get it from Supabase after you've set up auth.

---

## Files in this project

```
cabinet-app/
├── index.html                          ← the page shell (don't edit)
├── package.json                        ← project dependencies
├── vite.config.js                      ← build config (don't edit)
├── vercel.json                         ← Vercel deploy config (don't edit)
├── .gitignore                          ← tells Git what NOT to upload
├── public/
│   ├── manifest.json                   ← PWA config
│   ├── sw.js                           ← service worker (offline support)
│   └── icons/                          ← add your app icons here
└── src/
    ├── main.jsx                        ← React entry (don't edit)
    ├── App.jsx                         ← the entire app
    ├── lib/
    │   └── supabase.js                 ← database connection (don't edit)
    └── components/
        └── FounderFollowSuggestion.jsx ← ✏️  edit FOUNDER_PROFILE here
```

## Deploying

Follow the interactive guide at the-cabinet.app (or use the deploy guide in this chat).

The short version:
1. Upload this folder to GitHub
2. Import the GitHub repo on vercel.com
3. Add your two Supabase keys in Vercel's environment variables
4. Deploy — takes 90 seconds
5. Add your domain in Vercel settings
6. Add DNS records in Cloudflare
7. Update Supabase auth URLs

## Icons

The `public/icons/` folder needs these files before deploying as a PWA:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px  
- `icon-180.png` — 180×180px (iOS)
- `favicon-32.png` — 32×32px
- `favicon-16.png` — 16×16px

You can generate all of these from one square image using:
https://realfavicongenerator.net
