# 🌟 WutaWuta Marketplace - Comprehensive Soroban Smart Contract

> Advanced AI-generated art marketplace on Stellar blockchain with full trading functionality, artwork evolution, and royalty management

## 🚀 Overview

The WutaWuta Marketplace is a comprehensive Soroban smart contract that powers the AI-generated art trading platform. It provides complete functionality for minting, listing, purchasing, and evolving AI-collaborative artworks on the Stellar network.

## ✨ Key Features

### 🎨 **Artwork Management**
- **AI-Human Collaboration**: Track AI model and human contribution percentages
- **Metadata Storage**: IPFS-based artwork metadata with content hashing
- **Royalty System**: Configurable royalty percentages for creators
- **Evolution Support**: Allow artworks to evolve over time with community input

### 🏪 **Marketplace Functionality**
- **Fixed Price Sales**: Direct purchase at set prices
- **Auction System**: Competitive bidding with reserve prices
- **Offer Management**: Make and accept offers on artworks
- **Fee Collection**: Automated marketplace fee distribution

### 🔐 **Security & Ownership**
- **Access Control**: Admin-only functions for platform management
- **Ownership Tracking**: Clear ownership records and transfer history
- **Reentrancy Protection**: Secure transaction handling
- **Input Validation**: Comprehensive parameter checking

### 📊 **Event System**
- **Transparent Operations**: All major actions emit events
- **History Tracking**: Complete audit trail of marketplace activities
- **Royalty Payments**: Track and distribute creator royalties

## 📋 Contract Structure

### Core Data Types

```rust
pub struct Artwork {
    pub token_id: u64,
    pub creator: Address,
    pub ipfs_hash: String,
    pub title: String,
    pub description: String,
    pub ai_model: String,
    pub creation_timestamp: u64,
    pub content_hash: [u8; 32],
    pub royalty_percentage: u32,
    pub is_collaborative: bool,
    pub ai_contribution: u32,
    pub human_contribution: u32,
    pub can_evolve: bool,
    pub evolution_count: u32,
}

pub struct Listing {
    pub token_id: u64,
    pub seller: Address,
    pub price: i128,
    pub start_time: u64,
    pub duration: u64,
    pub active: bool,
    pub auction_style: bool,
    pub reserve_price: Option<i128>,
}

pub struct Bid {
    pub token_id: u64,
    pub bidder: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub active: bool,
}

pub struct Evolution {
    pub token_id: u64,
    pub evolution_id: u32,
    pub evolver: Address,
    pub prompt: String,
    pub new_ipfs_hash: String,
    pub timestamp: u64,
    pub content_hash: [u8; 32],
}
```

### Main Functions

#### 🎨 **Artwork Creation**
```rust
fn mint_artwork(
    creator: Address,
    ipfs_hash: String,
    title: String,
    description: String,
    ai_model: String,
    content_hash: [u8; 32],
    royalty_percentage: u32,
    is_collaborative: bool,
    ai_contribution: u32,
    human_contribution: u32,
    can_evolve: bool,
) -> u64
```

#### 📋 **Marketplace Operations**
```rust
fn list_artwork(
    seller: Address,
    token_id: u64,
    price: i128,
    duration: u64,
    auction_style: bool,
    reserve_price: Option<i128>,
)

fn buy_artwork(
    buyer: Address,
    token_id: u64,
    payment_token: Address,
)

fn make_bid(
    bidder: Address,
    token_id: u64,
    amount: i128,
    payment_token: Address,
)

fn end_auction(
    token_id: u64,
    payment_token: Address,
)
```

#### 🧬 **Artwork Evolution**
```rust
fn evolve_artwork(
    evolver: Address,
    token_id: u64,
    prompt: String,
    new_ipfs_hash: String,
    content_hash: [u8; 32],
    payment_token: Address,
)
```

#### ⚙️ **Admin Functions**
```rust
fn update_marketplace_fee(new_fee: u32)
fn update_evolution_fee(new_fee: i128)
fn update_treasury(new_treasury: Address)
```

## 🛠️ Development Setup

### Prerequisites
- **Rust** 1.60+
- **Soroban CLI** `cargo install soroban-cli`
- **Stellar SDK** for JavaScript integration

### Installation

```bash
# Clone the repository
git clone https://github.com/olaleyeolajide81-sketch/Wuta-Wuta.git
cd Wuta-Wuta/stellar-contracts

# Install dependencies
npm install

# Install Rust target
rustup target add wasm32-unknown-unknown

# Build the contract
npm run build:wutawuta
```

## 🚀 Deployment

### Testnet Deployment

```bash
# Set environment variables
export PRIVATE_KEY="your_secret_key_here"

# Deploy to testnet
npm run deploy:testnet

# Mint test artwork
npm run mint:test <contract_address>

# List artwork for sale
npm run list:test <contract_address> <token_id> <price>

# Make bid on auction
npm run bid:test <contract_address> <token_id> <bid_amount>

# Evolve artwork
npm run evolve:test <contract_address> <token_id>
```

### Mainnet Deployment

```bash
# Deploy to mainnet
npm run deploy:mainnet

# Verify deployment
npm run info:test <contract_address>
```

## 📊 Configuration

### Default Parameters
- **Marketplace Fee**: 2.5% (250 basis points)
- **Evolution Fee**: 0.1 XLM
- **Min Evolution Interval**: 1 day (86400 seconds)
- **Max Royalty**: 10% (1000 basis points)

### Environment Variables
```env
PRIVATE_KEY=your_stellar_secret_key
STELLAR_RPC_URL=https://rpc-futurenet.stellar.org
NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
```

## 🧪 Testing

### Run Tests

```bash
# Run all contract tests
npm run test:wutawuta

# Run specific test
cargo test test_mint_artwork --manifest-path contracts/Cargo.toml

# Run tests with output
cargo test -- --nocapture
```

### Test Coverage

The contract includes comprehensive tests covering:
- ✅ Artwork minting and validation
- ✅ Fixed price sales and auctions
- ✅ Bid management and auction completion
- ✅ Artwork evolution functionality
- ✅ Royalty payment distribution
- ✅ Access control and permissions
- ✅ Error handling and edge cases

## 📈 Integration Examples

### Frontend Integration

```javascript
import { SorobanRpc } from '@sorobanrpc';
import { Contract, TransactionBuilder } from '@stellar/stellar-sdk';

// Initialize RPC
const rpc = new SorobanRpc('https://rpc-futurenet.stellar.org');
const contract = new Contract(contractAddress);

// Mint artwork
const mintTx = new TransactionBuilder(account, { fee: BASE_FEE })
  .addOperation(
    contract.call(
      'mint_artwork',
      creator,
      ipfsHash,
      title,
      description,
      aiModel,
      contentHash,
      royaltyPercentage,
      isCollaborative,
      aiContribution,
      humanContribution,
      canEvolve
    )
  )
  .build();

const result = await rpc.sendTransaction(mintTx);
```

### API Integration

```javascript
// Get active listings
const listings = await rpc.getContractData(
  contractAddress,
  'get_active_listings',
  []
);

// Get artwork details
const artwork = await rpc.getContractData(
  contractAddress,
  'get_artwork',
  [tokenId]
);
```

## 🔒 Security Features

### Smart Contract Security
- **Access Control**: Admin-only functions with proper authorization
- **Input Validation**: Comprehensive parameter checking and bounds validation
- **Reentrancy Protection**: Secure transfer patterns and state management
- **Overflow Protection**: Safe arithmetic operations throughout

### Best Practices
- **Event Logging**: Transparent operation tracking
- **Error Messages**: Clear error descriptions for debugging
- **Gas Optimization**: Efficient storage patterns and computation
- **Upgrade Safety**: Considerate contract upgrade patterns

## 📝 Usage Examples

### Complete Marketplace Flow

```bash
# 1. Deploy contract
npm run deploy:testnet 250 1000000 86400

# 2. Mint collaborative artwork
npm run mint:test <contract_address>

# 3. List as auction
npm run list:test <contract_address> 1 10000000 86400 true

# 4. Make bids
npm run bid:test <contract_address> 1 15000000
npm run bid:test <contract_address> 1 20000000

# 5. End auction (after duration)
node scripts/deploy.js end_auction <contract_address> 1

# 6. Evolve artwork
npm run evolve:test <contract_address> 1
```

## 🌐 Network Support

### Supported Networks
- **Testnet**: https://rpc-futurenet.stellar.org
- **Mainnet**: https://rpc.stellar.org
- **Futurenet**: https://rpc-futurenet.stellar.org

### Asset Details
- **Contract Type**: Soroban Smart Contract
- **Asset Storage**: IPFS-based metadata
- **Payment Tokens**: Any Stellar asset
- **Fee Currency**: XLM (native)

## 📊 Architecture

### Contract Interaction Flow
```
1. Artist mints artwork (mint_artwork)
2. Artist lists artwork (list_artwork)
3. Buyer purchases or bids (buy_artwork/make_bid)
4. Smart contract handles transfers and fees
5. Fees distributed to treasury and creators
6. Artwork transferred to new owner
7. Owner can evolve artwork (evolve_artwork)
```

### Storage Structure
- **Artworks**: Map<token_id, Artwork>
- **Listings**: Map<token_id, Listing>
- **Bids**: Vec<Bid> with active tracking
- **Ownership**: Map<token_id, Address>
- **Evolutions**: Map<token_id, Vec<Evolution>>

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Areas for Contribution
- **Smart Contract Development** - Rust/Soroban expertise
- **Security Auditing** - Smart contract security analysis
- **Frontend Integration** - JavaScript/TypeScript SDKs
- **Documentation** - Technical writing and examples
- **Testing** - Quality assurance and test coverage

## 📄 License

This project is licensed under the MIT License - see [LICENSE](../../LICENSE) file for details.

## 🙏 Acknowledgments

- **Stellar Development Foundation** - For the amazing Soroban platform
- **Stellar Community** - For excellent documentation and support
- **Muse Organization** - For vision and direction

## 📞 Support

- **Discord**: [Muse Community](https://discord.gg/muse)
- **GitHub Issues**: [Create Issue](https://github.com/olaleyeolajide81-sketch/Wuta-Wuta/issues)
- **Email**: stellar@muse.art

---

**Built with ❤️ for the Stellar ecosystem and AI art community**
