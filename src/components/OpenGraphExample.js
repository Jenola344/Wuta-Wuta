import React from 'react';
import OpenGraphMeta from './OpenGraphMeta';

/**
 * Example usage of OpenGraphMeta component
 * This shows how to add OpenGraph tags to any page/component
 */

// Example 1: Default page with standard meta tags
export function HomePage() {
  return (
    <>
      <OpenGraphMeta />
      <div>
        <h1>Welcome to Wuta-Wuta</h1>
        <p>AI-Human Art Marketplace</p>
      </div>
    </>
  );
}

// Example 2: Artwork detail page with custom meta tags
export function ArtworkPage({ artwork }) {
  const artworkData = {
    id: artwork?.id || '1',
    title: artwork?.title || 'Untitled',
    price: artwork?.price || '0.5',
    creator: artwork?.creator || 'Unknown',
    image: artwork?.imageUrl || ''
  };

  return (
    <>
      <OpenGraphMeta
        title={`${artwork.title} | Wuta-Wuta`}
        description={`Discover "${artwork.title}" - ${artwork.description || 'A unique AI-generated artwork'}`}
        artworkData={artworkData}
        type="article"
      />
      <div>
        <h1>{artwork.title}</h1>
        <p>By {artwork.creator}</p>
        <p>Price: {artwork.price} ETH</p>
      </div>
    </>
  );
}

// Example 3: Collection page
export function CollectionPage() {
  return (
    <>
      <OpenGraphMeta
        title="My Collection | Wuta-Wuta"
        description="Explore my curated collection of AI-human collaborative artworks"
        type="website"
      />
      <div>
        <h1>My Art Collection</h1>
      </div>
    </>
  );
}

export default { HomePage, ArtworkPage, CollectionPage };
