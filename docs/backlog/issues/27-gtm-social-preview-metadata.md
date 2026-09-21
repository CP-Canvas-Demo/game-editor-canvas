# 27. Add social preview metadata (Open Graph tags) to index.html

**Type:** gtm  
**Priority:** p3  
**Area:** ui  
**Labels:** gtm, priority: p3, area: ui

## Summary

`index.html` currently only sets `<title>`, a `theme-color` meta tag, and a favicon. There are no Open Graph or Twitter Card meta tags, so a shared link currently renders as a bare title with no image or description in Slack/Discord/social previews.

## Suggested next step

Add `og:title`, `og:description`, `og:image` (using one of the captured screenshots or a dedicated banner), and matching `twitter:card` tags to `index.html` so shared links render an attractive preview.
