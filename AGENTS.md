# Shopify Hydrogen development

This storefront is scaffolded from Shopify's Hydrogen skeleton template. See the README for framework-specific details.

## Product photography

- Primary colour photos must show a complete single shoe, toe pointing left; never mirror readable branding.
- Centre the actual shoe both vertically and horizontally, with balanced empty space and consistent visual scale across products.
- Use a flat white (#FFFFFF) studio background for every colour and gallery view. Preserve the actual shoe colours and branding, with only a subtle neutral contact shadow. Check thumbnails and editorial photos as well as cards and galleries. Avoid gray, blue, warm, gradient or black backdrops and blanket filters that bleach the product.
- Generated studio references: clean neutral background, shoe bounding-box centre at 50% / 50%, about 84% canvas width, no clipped toe or heel. Inspect the result rather than relying on the prompt alone.
- Cards and galleries use ProductPhoto and measured subject bounds in app/lib/productPhotoFrames.json. Add measurements when adding or replacing images; preserve source files and alternate views.

Use the [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) for all Shopify API and platform work. If missing, install it in the agent host per that page (or `npx skills add Shopify/shopify-ai-toolkit --list` for skill-compatible hosts).
