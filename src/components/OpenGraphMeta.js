import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';

/**
 * OpenGraphMeta Component
 * Adds OpenGraph and Twitter Card meta tags for social sharing
 * 
 * Usage: Include in your page component to enable rich previews when shared on social media
 */
const OpenGraphMeta = ({
  title = 'Wuta-Wuta - AI-Human Art Marketplace',
  description = 'Discover and collect unique AI-generated artworks. Where artificial creativity meets human imagination.',
  image,
  url,
  type = 'website',
  siteName = 'Wuta-Wuta',
  twitterCard = 'summary_large_image',
  artworkData = null
}) => {
  // Generate OG image URL if artwork data is provided
  const ogImageUrl = artworkData 
    ? `/api/og/artwork/${artworkData.id}?title=${encodeURIComponent(artworkData.title)}&price=${encodeURIComponent(artworkData.price)}&creator=${encodeURIComponent(artworkData.creator || '')}&image=${encodeURIComponent(artworkData.image || '')}`
    : image || '/og-default.png';

  const pageUrl = url || typeof window !== 'undefined' ? window.location.href : 'https://muse-art-marketplace.com';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={pageUrl} />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#8b5cf6" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="application-name" content={siteName} />
    </Helmet>
  );
};

export default OpenGraphMeta;
