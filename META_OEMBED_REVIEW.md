# Meta oEmbed API Review - Context & History

## What We're Requesting
- **API**: Meta oEmbed Read (Instagram oEmbed)
- **Purpose**: Allow Trainichi users to import workout videos from Instagram by pasting URLs
- **Use case**: Read-only embedding - no posting, modifying, or accessing private content

## Test Page
- **URL**: https://www.trainichi.app/oembed-test
- **Section 1**: Working Instagram embed demo (client-side using embed.js)
- **Section 2**: oEmbed API integration (returns error until approved)

## API Endpoint
- **Route**: `/api/meta/oembed?url=[instagram_url]`
- **File**: `app/api/meta/oembed/route.ts`
- **Calls**: `https://graph.facebook.com/v18.0/instagram_oembed`

## Review History

### Attempt 1 - Rejected (Feb 2026)
**Rejection reason**: "Unable to verify oEmbed Use Case Experience in App"
- "URL provided is not working properly"
- "Send us the test link where embedded Instagram/Facebook content can be found"

**Possible causes**:
1. Meta's crawler may not execute JavaScript - the page uses client-side rendering
2. Instagram embed.js might have failed to load during their test
3. They may want to see the actual mobile app, not just a test page

### Attempt 2 - Pending
**Changes made**:
- Added static screenshot fallback (`public/instagram-embed-screenshot.png`) that shows without JavaScript
- Added `<noscript>` fallback for no-JS environments
- Added page-specific metadata in `app/oembed-test/layout.tsx` with og:image

**To verify the fix works**:
1. Visit https://www.trainichi.app/oembed-test
2. Disable JavaScript in browser (DevTools > Settings > Disable JavaScript)
3. The screenshot should be visible in Section 1

## Files Structure
```
trainichi-web/
├── app/
│   ├── oembed-test/
│   │   ├── page.tsx          # Test page with embed demo
│   │   └── layout.tsx        # Page metadata with og:image
│   └── api/
│       └── meta/
│           └── oembed/
│               └── route.ts  # API endpoint proxying to Meta
├── public/
│   └── instagram-embed-screenshot.png  # Static fallback image
└── .env.local                # Contains INSTAGRAM_ACCESS_TOKEN
```

## Access Token
- Format: `APP_ID|APP_SECRET` (App Access Token)
- Stored in: `.env.local` as `INSTAGRAM_ACCESS_TOKEN`

## Useful Links
- Meta Sharing Debugger: https://developers.facebook.com/tools/debug/?q=https://www.trainichi.app/oembed-test
- oEmbed docs: https://developers.facebook.com/docs/plugins/oembed
- App Review guide: https://developers.facebook.com/docs/apps/review

## Notes for Future Submissions
- Meta reviewers may not execute JavaScript - always have static fallbacks
- Consider providing a video demo of the mobile app's import feature
- Be explicit in submission notes about where to find the Instagram content
- The Instagram reel used for demo: https://www.instagram.com/reel/DM6ogB5R7xG/
