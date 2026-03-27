# OpenGraph Image Generation with Satori

This document explains how to use the OpenGraph image generation feature for social media sharing.

## Overview

The Wuta-Wuta marketplace now supports dynamic OpenGraph (OG) image generation using [Satori](https://github.com/vercel/satori). When artworks are shared on social media platforms like Twitter/X, Facebook, or LinkedIn, they will display beautiful preview cards with:

- Artwork image
- Title and creator information
- Price information
- Wuta-Wuta branding

## Components

### 1. Backend API Endpoint

**Location:** `/server/routes/ogRoutes.js`

Generates PNG images on-the-fly from React-like JSX components.

#### Endpoint

```
GET /api/og/artwork/:id
```

#### Query Parameters

| Parameter | Type     | Required | Description                          |
|-----------|----------|----------|--------------------------------------|
| `title`   | string   | Yes      | Artwork title                        |
| `price`   | string   | Yes      | Current price of the artwork         |
| `creator` | string   | No       | Creator name or wallet address       |
| `image`   | string   | No       | URL to the artwork image             |

#### Example Request

```bash
curl http://localhost:3001/api/og/artwork/123 \
  ?title=Cosmic%20Dreams \
  &price=0.5 \
  &creator=0x1234...5678 \
  &image=https://example.com/artwork.jpg
```

### 2. Frontend Meta Component

**Location:** `/src/components/OpenGraphMeta.js`

React component that injects OpenGraph and Twitter Card meta tags into the page head.

#### Usage

```jsx
import OpenGraphMeta from './OpenGraphMeta';

function ArtworkPage({ artwork }) {
  return (
    <>
      <OpenGraphMeta
        title={`${artwork.title} | Wuta-Wuta`}
        description={`Discover "${artwork.title}" - A unique AI-generated artwork`}
        artworkData={{
          id: artwork.id,
          title: artwork.title,
          price: artwork.price,
          creator: artwork.creator,
          image: artwork.imageUrl
        }}
        type="article"
      />
      
      {/* Your page content */}
    </>
  );
}
```

#### Props

| Prop           | Type   | Default                    | Description                              |
|----------------|--------|----------------------------|------------------------------------------|
| `title`        | string | 'Wuta-Wuta - ...'          | Page title                               |
| `description`  | string | Default marketplace desc   | Page description                         |
| `image`        | string | '/og-default.png'          | Static image URL (fallback)              |
| `url`          | string | Current page URL           | Canonical URL of the page                |
| `type`         | string | 'website'                  | OG type (website, article, etc.)         |
| `siteName`     | string | 'Wuta-Wuta'                | Site name                                |
| `twitterCard`  | string | 'summary_large_image'      | Twitter card type                        |
| `artworkData`  | object | null                       | If provided, generates dynamic OG image  |

## How It Works

1. **Dynamic Generation**: When a page with `artworkData` is loaded, the `OpenGraphMeta` component constructs a URL to the backend OG endpoint with the artwork's details.

2. **Image Creation**: The backend receives the request and uses Satori to convert a React-like component into an SVG.

3. **PNG Conversion**: The SVG is then converted to a PNG using Sharp for better browser compatibility.

4. **Social Media Crawlers**: When social media platforms crawl the page, they fetch the dynamically generated OG image, which displays as a rich preview card.

## Testing

### Test the OG Image Endpoint Directly

```bash
# Start the backend server
cd server
npm start

# In another terminal, test the endpoint
curl "http://localhost:3001/api/og/artwork/test-123?title=Test%20Artwork&price=1.5&creator=Artist%20Name" --output test-og.png

# Open the generated image
open test-og.png
```

### Test Social Media Previews

Use these tools to preview how your pages will appear when shared:

- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

## Customization

### Modifying the OG Image Design

Edit the JSX template in `/server/routes/ogRoutes.js`. The layout uses inline styles compatible with Satori's CSS subset.

```jsx
<div style={{
  width: '1200px',
  height: '630px',
  // ... your styles
}}>
  {/* Your custom layout */}
</div>
```

**Note:** Satori supports a subset of CSS. Check the [Satori documentation](https://github.com/vercel/satori) for supported properties.

### Changing Default Meta Tags

Edit `/public/index.html` to modify the default OpenGraph tags that load before the React app initializes.

## Font Support

The OG generator attempts to load custom fonts from `/fonts/`. If not found, it falls back to system fonts.

To add custom fonts:

1. Place `.ttf` font files in `/fonts/` directory
2. Update the `loadFont()` function in `ogRoutes.js`

## Performance Considerations

- **Caching**: OG images are cached with `Cache-Control: public, max-age=3600` headers
- **On-Demand Generation**: Images are generated only when requested by social media crawlers
- **CDN**: For production, consider serving OG images through a CDN for better performance

## Troubleshooting

### Issue: OG images not showing

**Solution:** Ensure the backend server is running and accessible from the internet. Social media crawlers need to be able to reach the image URL.

### Issue: Font not loading

**Solution:** Check that font files exist in `/fonts/` directory and the path in `loadFont()` is correct.

### Issue: Image appears distorted

**Solution:** Verify the OG image dimensions are 1200x630 pixels (standard OG size).

## Examples

### Basic Usage (Minimal)

```jsx
<OpenGraphMeta 
  title="My Artwork"
  description="Amazing AI art"
  artworkData={{
    id: '1',
    title: 'My Artwork',
    price: '0.5'
  }}
/>
```

### Advanced Usage (Full Customization)

```jsx
<OpenGraphMeta
  title="Cosmic Dreams | Featured Artwork"
  description="A stunning exploration of space and consciousness created through AI-human collaboration"
  image="/custom-og-image.jpg"
  url="https://muse-art-marketplace.com/artwork/cosmic-dreams"
  type="article"
  siteName="Wuta-Wuta Marketplace"
  twitterCard="summary_large_image"
  artworkData={{
    id: 'cosmic-dreams-001',
    title: 'Cosmic Dreams',
    price: '2.5',
    creator: '0xArtist123...',
    image: 'https://cdn.muse.art/cosmic-dreams.jpg'
  }}
/>
```

## Future Enhancements

- [ ] Add QR code to OG images linking directly to the artwork
- [ ] Support for multiple artwork images in carousel format
- [ ] Animated OG images for platforms that support it
- [ ] A/B testing different OG designs
- [ ] Analytics on OG image shares and click-through rates

## Resources

- [Satori Documentation](https://github.com/vercel/satori)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [OpenGraph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
