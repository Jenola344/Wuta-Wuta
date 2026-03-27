// Soroban tests for escrow-based auction lifecycle.
// Run with: cargo test -- --nocapture

#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as TestAddress, Ledger},
    Address, Env,
};

// Inline the contract module (Soroban test convention)
mod wutawuta_marketplace;
use wutawuta_marketplace::{WutaWutaMarketplace, WutaWutaMarketplaceClient};

// ─── Shared test helpers ─────────────────────────────────────────────────────

fn setup_env<'a>() -> (Env, WutaWutaMarketplaceClient<'a>, Address, Address, Address) {
    // NOTE: We return owned values; caller is responsible for lifetime.
    // In practice, Soroban test envs live for the entire test.
    panic!("use setup() directly in each test")
}

struct Setup {
    env: Env,
    admin: Address,
    creator: Address,
    treasury: Address,
    contract_id: Address,
}

impl Setup {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();

        let admin    = Address::generate(&env);
        let creator  = Address::generate(&env);
        let treasury = Address::generate(&env);

        let contract_id = env.register_contract(None, WutaWutaMarketplace {});
        let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

        client.initialize(
            &admin,
            &250,       // 2.5 % marketplace fee
            &treasury,
            &1_000_000, // 0.1 XLM evolution fee
            &86_400,    // 1 day min evolution interval
        );

        Setup { env, admin, creator, treasury, contract_id }
    }

    fn client(&self) -> WutaWutaMarketplaceClient<'_> {
        WutaWutaMarketplaceClient::new(&self.env, &self.contract_id)
    }

    /// Mint a basic artwork and return its token_id.
    fn mint_one(&self) -> u64 {
        self.client().mint_artwork(
            &self.creator,
            &"QmTestHash".into_val(&self.env),
            &"Test Art".into_val(&self.env),
            &"A description".into_val(&self.env),
            &"Stable Diffusion".into_val(&self.env),
            &500u32,  // 5 % royalty
            &true,
            &60u32,
            &40u32,
            &true,
        )
    }

    /// List the token as an auction (reserve = 1_000_000, duration = 3_600).
    fn list_auction(&self, token_id: u64) {
        self.client().list_artwork(
            &self.creator,
            &token_id,
            &500_000i128,        // starting price: 0.5 XLM
            &3_600u64,           // 1 hour
            &true,
            &Some(1_000_000i128), // reserve: 1 XLM
        );
    }
}

// ─── Initialization ───────────────────────────────────────────────────────────

#[test]
fn test_initialization() {
    let s = Setup::new();
    // Verify the initialization event was emitted
    let events = s.env.events().all();
    assert_eq!(events.len(), 1);
}

// ─── Mint + Ownership ─────────────────────────────────────────────────────────

#[test]
fn test_mint_and_ownership() {
    let s = Setup::new();
    let token_id = s.mint_one();

    assert_eq!(token_id, 1);

    let owner = s.client().get_token_owner(&token_id);
    assert_eq!(owner, s.creator);

    let tokens = s.client().get_creator_tokens(&s.creator);
    assert_eq!(tokens.len(), 1);
    assert_eq!(tokens.get(0).unwrap(), token_id);
}

// ─── Auction Listing ─────────────────────────────────────────────────────────

#[test]
fn test_auction_listing_created() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id);

    let listing = s.client().get_listing(&token_id);
    assert_eq!(listing.active, true);
    assert_eq!(listing.auction_style, true);
    assert_eq!(listing.reserve_price, Some(1_000_000i128));
}

// ─── AuctionEscrow: funds held on bid ────────────────────────────────────────

#[test]
fn test_bid_escrow_created() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id);

    let bidder        = Address::generate(&s.env);
    let payment_token = Address::generate(&s.env);

    // Place a bid above the reserve price
    s.client().make_bid(&bidder, &token_id, &1_500_000i128, &payment_token);

    // Escrow should be recorded
    let escrow = s.client().get_auction_escrow(&token_id);
    assert!(escrow.is_some(), "Escrow should exist after first bid");

    let escrow = escrow.unwrap();
    assert_eq!(escrow.highest_bidder, bidder);
    assert_eq!(escrow.highest_amount, 1_500_000i128);
    assert_eq!(escrow.payment_token, payment_token);
}

// ─── AuctionEscrow: highest bid updated, old bidder refunded ─────────────────

#[test]
fn test_outbid_refund_and_escrow_update() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id);

    let bidder1       = Address::generate(&s.env);
    let bidder2       = Address::generate(&s.env);
    let payment_token = Address::generate(&s.env);

    // First bid
    s.client().make_bid(&bidder1, &token_id, &1_000_000i128, &payment_token);

    // Second bid (must be ≥ 5 % over first)
    let second_bid = (1_000_000i128 * 105) / 100; // 1_050_000
    s.client().make_bid(&bidder2, &token_id, &second_bid, &payment_token);

    let escrow = s.client().get_auction_escrow(&token_id).unwrap();
    assert_eq!(escrow.highest_bidder, bidder2);
    assert_eq!(escrow.highest_amount, second_bid);

    // Previous bidder's bid should be marked inactive
    let bids = s.client().get_token_bids(&token_id);
    let bid1 = bids.iter().find(|b| b.bidder == bidder1).expect("bid1 in history");
    let bid2 = bids.iter().find(|b| b.bidder == bidder2).expect("bid2 in history");
    assert!(!bid1.active, "First bid should be deactivated");
    assert!(bid2.active,  "Second bid should be active");
}

// ─── Bid too low rejected ────────────────────────────────────────────────────

#[test]
#[should_panic(expected = "Bid too low")]
fn test_bid_below_minimum_rejected() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id);

    let bidder        = Address::generate(&s.env);
    let payment_token = Address::generate(&s.env);

    // Bid below reserve price: should panic
    s.client().make_bid(&bidder, &token_id, &100_000i128, &payment_token);
}

// ─── Bid after expiry rejected ───────────────────────────────────────────────

#[test]
#[should_panic(expected = "Auction has ended")]
fn test_bid_after_expiry_rejected() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id); // duration = 3_600 s

    // Fast-forward past expiry
    s.env.ledger().set_timestamp(s.env.ledger().timestamp() + 3_601);

    let bidder        = Address::generate(&s.env);
    let payment_token = Address::generate(&s.env);

    s.client().make_bid(&bidder, &token_id, &1_500_000i128, &payment_token);
}

// ─── end_auction: reserve met → NFT transferred, funds distributed ───────────

#[test]
fn test_end_auction_reserve_met() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id);

    let bidder        = Address::generate(&s.env);
    let payment_token = Address::generate(&s.env);

    // Bid above reserve
    let bid_amount = 2_000_000i128;
    s.client().make_bid(&bidder, &token_id, &bid_amount, &payment_token);

    // Fast-forward past auction end
    s.env.ledger().set_timestamp(s.env.ledger().timestamp() + 3_601);

    s.client().end_auction(&token_id);

    // NFT ownership should have transferred
    let new_owner = s.client().get_token_owner(&token_id);
    assert_eq!(new_owner, bidder, "Winner should own the NFT");

    // Listing should be inactive
    let listing = s.client().get_listing(&token_id);
    assert!(!listing.active, "Listing should be deactivated");

    // Escrow should be cleared
    let escrow = s.client().get_auction_escrow(&token_id);
    assert!(escrow.is_none(), "Escrow should be cleared after settlement");
}

// ─── end_auction: reserve NOT met → bidder refunded, listing deactivated ─────

#[test]
fn test_end_auction_reserve_not_met() {
    let s = Setup::new();
    let token_id = s.mint_one();

    // List with high reserve of 5 XLM; bid only 1 XLM
    s.client().list_artwork(
        &s.creator,
        &token_id,
        &500_000i128,
        &3_600u64,
        &true,
        &Some(5_000_000i128), // 5 XLM reserve
    );

    let bidder        = Address::generate(&s.env);
    let payment_token = Address::generate(&s.env);
    s.client().make_bid(&bidder, &token_id, &1_000_000i128, &payment_token);

    s.env.ledger().set_timestamp(s.env.ledger().timestamp() + 3_601);
    s.client().end_auction(&token_id);

    // Listing deactivated
    let listing = s.client().get_listing(&token_id);
    assert!(!listing.active);

    // NFT stays with seller
    let owner = s.client().get_token_owner(&token_id);
    assert_eq!(owner, s.creator, "NFT should return to seller");

    // Escrow cleared
    assert!(s.client().get_auction_escrow(&token_id).is_none());
}

// ─── end_auction: no bids → listing deactivated cleanly ─────────────────────

#[test]
fn test_end_auction_no_bids() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id);

    s.env.ledger().set_timestamp(s.env.ledger().timestamp() + 3_601);
    s.client().end_auction(&token_id);

    let listing = s.client().get_listing(&token_id);
    assert!(!listing.active);
    assert!(s.client().get_auction_escrow(&token_id).is_none());
}

// ─── end_auction before time: rejected ───────────────────────────────────────

#[test]
#[should_panic(expected = "Auction has not ended yet")]
fn test_end_auction_too_early_rejected() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id);
    s.client().end_auction(&token_id); // should panic
}

// ─── cancel_listing: refunds highest bidder ───────────────────────────────────

#[test]
fn test_cancel_auction_refunds_bidder() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id);

    let bidder        = Address::generate(&s.env);
    let payment_token = Address::generate(&s.env);
    s.client().make_bid(&bidder, &token_id, &1_500_000i128, &payment_token);

    // Seller cancels
    s.client().cancel_listing(&s.creator, &token_id);

    // Listing deactivated
    let listing = s.client().get_listing(&token_id);
    assert!(!listing.active);

    // Escrow cleared (refund was issued)
    assert!(
        s.client().get_auction_escrow(&token_id).is_none(),
        "Escrow should be cleared after cancel"
    );
}

// ─── cancel_listing: fixed-price (no escrow) ─────────────────────────────────

#[test]
fn test_cancel_fixed_price_listing() {
    let s = Setup::new();
    let token_id = s.mint_one();

    s.client().list_artwork(
        &s.creator,
        &token_id,
        &1_000_000i128,
        &86_400u64,
        &false,
        &None,
    );

    s.client().cancel_listing(&s.creator, &token_id);
    let listing = s.client().get_listing(&token_id);
    assert!(!listing.active);
}

// ─── time_remaining helper ────────────────────────────────────────────────────

#[test]
fn test_time_remaining() {
    let s = Setup::new();
    let token_id = s.mint_one();
    s.list_auction(token_id); // duration = 3_600

    let remaining = s.client().get_time_remaining(&token_id);
    assert!(remaining > 0 && remaining <= 3_600, "Time remaining should be within duration");

    // Fast-forward
    s.env.ledger().set_timestamp(s.env.ledger().timestamp() + 3_601);
    let remaining_after = s.client().get_time_remaining(&token_id);
    assert_eq!(remaining_after, 0, "Should return 0 after auction ends");
}

// ─── Admin: fee update ────────────────────────────────────────────────────────

#[test]
#[should_panic(expected = "Fee too high")]
fn test_marketplace_fee_too_high() {
    let s = Setup::new();
    s.client().update_marketplace_fee(&1001u32); // max is 1000 (10 %)
}
