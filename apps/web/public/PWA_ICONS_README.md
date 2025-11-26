# PWA Icons Required

To complete the PWA setup, you need to create the following icon files in the `public/` directory:

## Required Icons

1. **pwa-192x192.png** (192x192 pixels)
   - Used for Android home screen and app launcher
   - Should be a square icon with your Pinegate Village logo

2. **pwa-512x512.png** (512x512 pixels)
   - Used for Android splash screen and high-res displays
   - Should be a square icon with your Pinegate Village logo

3. **apple-touch-icon.png** (180x180 pixels)
   - Used for iOS home screen when adding to home screen
   - Should be a square icon with your Pinegate Village logo

## Creating Icons

You can:
1. Use a design tool (Figma, Photoshop, etc.) to create icons matching your 8-bit theme
2. Use an online PWA icon generator
3. Export from your existing logo/branding

## Icon Design Tips

- Use your app's theme colors (#242424 background)
- Keep it simple and recognizable at small sizes
- Consider your 8-bit aesthetic and Pinegate Village theme
- Ensure icons work on both light and dark backgrounds
- Test icons at actual size to ensure readability

## Quick Test

After adding icons, run:
```bash
pnpm build
pnpm preview
```

Then check:
- Chrome DevTools → Application → Manifest (should show icons)
- Try "Add to Home Screen" on mobile device

