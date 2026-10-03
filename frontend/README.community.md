# Community frontend demo

Open `/community` in the existing EatVibing app. This page works with local mock data without requiring the community backend or a signed-in user.

```powershell
cd D:\AISC\EatVibing-https\frontend
npm run dev -- --host 127.0.0.1
```

Use the URL printed by Vite, followed by `/community`.

The English demo includes four sample posts, three community groups, topic filters, text search, newest/popular sorting, likes, saved posts, comments, a post composer with optional sample images, and a weekly challenge. The page follows the existing Guideline design: white background, black/gray typography, uppercase sidebar navigation, thin borders, and a two-column post grid. The shared Navbar and application frame are unchanged. Mobile stacks the navigation above the content.

Interactions persist under `eatvibing-community-demo-en-v2` in localStorage. The **Reset sample data** button below the feed restores the sample posts and clears this version's interactions. The earlier Vietnamese sample data is retained under its previous storage key and is not loaded by this English version. Other EatVibing browser data is unaffected. Counts, users, activity timestamps, and groups are illustrative. Images come from TheMealDB image URLs already present in the project's catalog; a placeholder appears if a photo cannot load.

Source files:

- `src/_components/pages/Community.jsx`: interface and local interactions.
- `src/_components/pages/communityData.js`: editable sample posts, groups, and topics.
- `src/_components/pages/community.css`: styles scoped to the community page.

Verification:

```powershell
npx eslint src/_components/pages/Community.jsx src/_components/pages/communityData.js
npm run build
```
