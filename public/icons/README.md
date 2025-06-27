# PWA Icons

Untuk PWA yang lengkap, Anda perlu menambahkan icon dengan ukuran berikut:

## Required Icon Sizes:
- icon-72x72.png
- icon-96x96.png  
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Tools untuk Generate Icons:
1. **PWA Builder**: https://www.pwabuilder.com/imageGenerator
2. **Favicon Generator**: https://realfavicongenerator.net/
3. **PWA Manifest Generator**: https://app-manifest.firebaseapp.com/

## Design Guidelines:
- Use solid background colors
- Ensure icon works on both light and dark backgrounds
- Make it recognizable at small sizes
- Follow platform-specific guidelines

## Temporary Solution:
Untuk sementara, Anda bisa menggunakan emoji atau text-based icon, atau download icon placeholder dari internet.

## Generate Command (jika ada source icon):
```bash
# Using ImageMagick
convert source-icon.png -resize 72x72 icon-72x72.png
convert source-icon.png -resize 96x96 icon-96x96.png
# ... dst untuk ukuran lainnya
```
