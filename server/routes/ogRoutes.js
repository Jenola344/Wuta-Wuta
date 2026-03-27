const express = require('express');
const satori = require('satori').default;
const sharp = require('sharp');
const path = require('path');

const router = express.Router();

/**
 * GET /api/og/artwork/:id
 * Generate OpenGraph image for an artwork
 * 
 * Query params:
 * - title: Artwork title
 * - price: Current price
 * - creator: Creator name/address
 * - image: Artwork image URL (optional, will use placeholder if not provided)
 */
router.get('/artwork/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, creator, image } = req.query;

    // Validate required parameters
    if (!title || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: title and price are required'
      });
    }

    // Load logo
    const logoPath = path.join(__dirname, '../../public/logo.png');
    let logoSvg = '';
    
    // Create Wuta-Wuta logo SVG inline
    const wutaLogo = `
      <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" />
        <text x="50" y="65" font-size="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">W</text>
      </svg>
    `;

    // Create artwork image element if URL provided
    const artworkImage = image 
      ? `<img src="${image}" style="width: 300px; height: 300px; object-fit: cover; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);" />`
      : `<div style="width: 300px; height: 300px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
           <span style="font-size: 80px;">🎨</span>
         </div>`;

    // Define the OG image layout using JSX-like syntax
    const ogImage = (
      <div style={{
        width: '1200px',
        height: '630px',
        padding: '60px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Header with Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div dangerouslyHTML={wutaLogo} />
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '0'
            }}>Wuta-Wuta</h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>AI-Human Art Marketplace</p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '60px',
          flex: 1
        }}>
          {/* Artwork Image */}
          <div dangerouslyHTML={artworkImage} />

          {/* Artwork Details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '24px',
            flex: 1
          }}>
            <div>
              <h2 style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 16px 0',
                lineHeight: 1.2
              }}>{title}</h2>
              
              {creator && (
                <p style={{
                  fontSize: '24px',
                  color: '#6b7280',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>👨‍🎨</span> by {creator.length > 30 ? `${creator.slice(0, 6)}...${creator.slice(-4)}` : creator}
                </p>
              )}
            </div>

            {/* Price Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#8b5cf6',
              padding: '20px 40px',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
              marginTop: '20px'
            }}>
              <span style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginRight: '12px'
              }}>{price}</span>
              <span style={{
                fontSize: '24px',
                color: '#e9d5ff',
                fontWeight: '600'
              }}>ETH</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingTop: '40px',
          borderTop: '2px solid #e5e7eb'
        }}>
          <p style={{
            fontSize: '18px',
            color: '#9ca3af',
            margin: '0'
          }}>muse-art-marketplace.com</p>
          <p style={{
            fontSize: '18px',
            color: '#9ca3af',
            margin: '0'
          }}>ID: {id}</p>
        </div>
      </div>
    );

    // Convert React element to string for satori
    const svg = await satori(ogImage, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: await loadFont(),
          weight: 400,
        },
        {
          name: 'Inter',
          data: await loadFont(true),
          weight: 700,
        },
      ],
    });

    // Convert SVG to PNG using sharp
    const png = await sharp(Buffer.from(svg)).png().toBuffer();

    // Set proper headers and send response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
    res.send(png);

  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OpenGraph image',
      message: error.message
    });
  }
});

// Helper function to load Inter font
async function loadFont(bold = false) {
  try {
    const fs = require('fs').promises;
    const fontPath = bold 
      ? path.join(__dirname, '../../fonts/Inter-Bold.ttf')
      : path.join(__dirname, '../../fonts/Inter-Regular.ttf');
    
    const fontData = await fs.readFile(fontPath);
    return fontData;
  } catch (error) {
    // Fallback to system fonts or use default
    console.warn('Custom font not found, using default fonts');
    const fs = require('fs').promises;
    // Try to load a basic font
    try {
      const fontPath = path.join(__dirname, '../../fonts/Arial.ttf');
      return await fs.readFile(fontPath);
    } catch (e) {
      // If no fonts available, satori will use default
      return null;
    }
  }
}

module.exports = router;
