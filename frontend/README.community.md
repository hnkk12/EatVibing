# Community frontend demo

Open `/community` in the existing EatVibing app. This page works with local mock data without requiring the community backend or a signed-in user.

```powershell
cd D:\AISC\EatVibing-https\frontend
npm run dev -- --host 127.0.0.1
```

Use the URL printed by Vite, followed by `/community`.

The English demo includes four sample posts, three community groups, topic filters, text search, newest/popular sorting, likes, saved posts, replies, local repost toggles, copy-link sharing, a post composer with optional sample images, and a weekly challenge. The Community uses a Threads-inspired single-column conversation feed: avatar and author first, inline content/photos, compact interaction icons and an inline “What's cooking?” composer. It keeps EatVibing's white/black/zinc palette and shared Navbar. Mobile uses compact Feed/Saved/Groups navigation and wrapping topic filters.

New threads require only story text; titles are optional. Existing posts and browser interactions remain under the same storage key. Reposts and newly authored posts are local-only. Copying a link does not publish local content or make it available to other devices; sample-post links identify an article in the feed. No network social backend or real account profile is introduced.

Interactions persist under `eatvibing-community-demo-en-v2` in localStorage. The **Restore starting posts** button below the feed restores the sample posts and clears this version's interactions. The earlier Vietnamese sample data is retained under its previous storage key and is not loaded by this English version. Other EatVibing browser data is unaffected. Counts, users, activity timestamps, and groups are illustrative. Images come from TheMealDB image URLs already present in the project's catalog; a placeholder appears if a photo cannot load.

Source files:

- `src/_components/pages/Community.jsx`: interface and local interactions.
- `src/_components/pages/communityData.js`: editable sample posts, groups, and topics.
- `src/_components/pages/community.css`: styles scoped to the community page.

Verification:

```powershell
npx eslint src/_components/pages/Community.jsx src/_components/pages/communityData.js
npm run build
```
