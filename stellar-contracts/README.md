# 🌟 Muse AI Art Marketplace - Stellar Smart Contracts

> Advanced NFT marketplace and asset tokenization on Stellar blockchain for AI-human collaborative art

## 🚀 Overview

This repository contains the Stellar smart contracts for the Muse AI Art Marketplace, enabling:
- **Asset Tokenization** - Create and manage digital art assets on Stellar
- **NFT Marketplace** - Buy, sell, and trade AI-generated art
- **Low-Fee Trading** - Efficient marketplace with minimal fees
- **Cross-Chain Compatibility** - Bridge to other blockchain networks

## 📋 Contracts

### 1. **ArtAssetToken.rs**
**Purpose**: Core asset token contract for digital art
**Features**:
- Asset creation and management
- Metadata handling
- Transfer functionality
- Admin controls

**Key Functions**:
```rust
initialize(admin, asset_code, metadata_url) // Initialize contract
mint(to, amount, token_uri, content_hash) // Mint new art asset
transfer(from, to, amount) // Transfer assets
set_metadata(metadata_url) // Update metadata
```

### 2. **NFTMarketplace.rs**
**Purpose**: Decentralized marketplace for trading art assets
**Features**:
- Listing management
- Bidding system
- Automated fee collection
- Treasury management

**Key Functions**:
```rust
list_nft(seller, token_id, price, duration) // List artwork
buy_nft(buyer, token_id, amount) // Purchase artwork
make_offer(buyer, token_id, amount, duration) // Make bid
accept_offer(seller, token_id, offer_index) // Accept bid
cancel_listing(seller, token_id) // Cancel listing
```

## 🛠️ Development Setup

### Prerequisites
- **Rust** 1.60+
- **Stellar CLI** `soroban-cli`
- **Node.js** 16+
- **Stellar SDK** for JavaScript integration

### Installation
```bash
# Clone repository
git clone https://github.com/Muse-AI-Generated-Art-Marketplace/stellar-contracts
cd stellar-contracts

# Install dependencies
npm install

# Install Stellar CLI
cargo install soroban-cli

# Install Rust target
rustup target add wasm32-unknown-unknown
```

## 🚀 Deployment

### 1. **Testnet Deployment**
```bash
# Deploy to testnet
node scripts/deploy.js deploy

# Mint test NFT
node scripts/deploy.js mint

# List test NFT
node scripts/deploy.js list
```

### 2. **Mainnet Deployment**
```bash
# Set mainnet RPC
export STELLAR_RPC_URL=https://rpc.stellar.org

# Deploy contracts
node scripts/deploy.js deploy
```

## 🔧 Configuration

### Environment Variables
```env
STELLAR_RPC_URL=https://rpc-futurenet.stellar.org
PRIVATE_KEY=your_secret_key_here
NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
```

### Marketplace Parameters
- **Marketplace Fee**: 2.5% (250 basis points)
- **Minimum Listing Duration**: 1 hour
- **Maximum Listing Duration**: 30 days
- **Treasury Address**: Configurable by admin

## 📊 Architecture

### Contract Interaction Flow
```
1. Artist mints NFT (ArtAssetToken)
2. Artist lists NFT (NFTMarketplace)
3. Buyer makes offer/purchase
4. Smart contract handles transfer
5. Fees distributed to treasury
6. NFT transferred to buyer
```

### Security Features
- **Access Control**: Admin-only functions
- **Reentrancy Protection**: Secure transfers
- **Input Validation**: Parameter checks
- **Event Logging**: Transparent operations

## 🧪 Testing

### Run Tests
```bash
# Run contract tests
npm test

# Run specific test
npm test -- --grep "mint"
```

### Test Coverage
- ✅ Asset minting
- ✅ Transfer operations
- ✅ Marketplace listings
- ✅ Offer system
- ✅ Fee calculations

## 📈 Integration

### Frontend Integration
```javascript
import { SorobanRpc } from '@sorobanrpc';

// Initialize RPC
const rpc = new SorobanRpc('https://rpc-futurenet.stellar.org');

// Mint NFT
const mintTx = await rpc.sendTransaction(
  new SorobanRpc.TransactionBuilder(publicKey, { fee: 100 })
    .addOperation(
      new SorobanRpc.Operation.invokeHostFunction({
        contract: new SorobanRpc.Contract('art_asset_token'),
        functionName: 'mint',
        args: [address, amount, tokenUri, contentHash]
      })
    )
    .build()
);
```

### API Integration
```javascript
// Get marketplace listings
const listings = await rpc.getContractData(
  'nft_marketplace',
  'get_active_listings',
  []
);

// Get NFT metadata
const metadata = await rpc.getContractData(
  'art_asset_token',
  'get_metadata',
  []
);
```

## 🌐 Network Support

### Supported Networks
- **Testnet**: https://rpc-futurenet.stellar.org
- **Mainnet**: https://rpc.stellar.org
- **Futurenet**: https://rpc-futurenet.stellar.org

### Asset Details
- **Asset Code**: MUSEART
- **Asset Type**: Non-fungible token
- **Metadata**: IPFS-based
- **Bridge Support**: Ethereum, Polygon (planned)

## 🔒 Security Considerations

### Smart Contract Security
- **Audit Status**: Pending professional audit
- **Security Measures**:
  - Input validation
  - Access controls
  - Reentrancy protection
  - Overflow checks

### Best Practices
- Use **environment variables** for sensitive data
- Implement **rate limiting** for API calls
- Regular **security audits**
- **Multi-sig** for admin operations

## 📝 Development Roadmap

### Phase 1: Core Marketplace ✅
- [x] Asset tokenization
- [x] Basic marketplace
- [x] Fee system

### Phase 2: Advanced Features 🚧
- [ ] Auction system
- [ ] Royalty distribution
- [ ] Cross-chain bridge
- [ ] AI integration

### Phase 3: Ecosystem Growth 📋
- [ ] DAO governance
- [ ] Staking rewards
- [ ] Mobile wallet
- [ ] Gallery features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Areas for Contribution
- **Smart Contract Development** - Rust/Soroban expertise
- **Frontend Integration** - JavaScript/TypeScript
- **Security Auditing** - Smart contract security
- **Documentation** - Technical writing
- **Testing** - Quality assurance

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stellar Development Foundation** - For the amazing Soroban platform
- **Stellar Community** - For excellent documentation and support
- **Muse Organization** - For vision and direction

## 🛠️ CI/CD Pipeline

The project now includes automated CI/CD for Soroban contracts with **mainnet fork testing and gas prediction**:

### Local Testing
```bash
cd stellar-contracts

# Build
npm run build:wutawuta

# Gas prediction on mainnet fork
npm run test:gas

# View report
npm run gas:report
open gas-report.html  # macOS
# or xdg-open gas-report.html (Linux)
```

### GitHub Actions Workflow
- **CI**: Build, test, mainnet fork simulation, gas analysis
- **CD**: Deploy testnet (on main merge), mainnet (on release)
- Triggers: PRs/push to `stellar-contracts/**`

**Secrets needed**:
```
STELLAR_DEPLOY_KEY_TESTNET
STELLAR_DEPLOY_KEY_MAINNET  # For CD
SLACK_WEBHOOK  # Optional notifications
```

### Gas Thresholds
Configured in `.gas-thresholds.json`. Adjust as needed:
- `mint_artwork`: 8M CPU insns
- `buy_artwork`: 12M
- `global_max`: 20M

### Reports
- `gas-report.json`: Raw data
- `gas-report.html`: Visual table (CI artifacts)

## 📞 Support

- **Discord**: [Muse Community](https://discord.gg/muse)
- **GitHub Issues**: [Create Issue](https://github.com/olaleyeolajide81-sketch/Wuta-Wuta/issues)
- **Email**: stellar@muse.art

---

**Built with ❤️ for the Stellar ecosystem**
