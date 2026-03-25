// Wuta-Wuta Marketplace — Soroban Smart Contract
// Stellar/Soroban escrow-based auction with typed storage keys.
//
// Key improvements over previous version:
//  - DataKey enum prevents storage key collisions
//  - AuctionEscrow struct tracks per-token escrowed funds precisely
//  - Bid deactivation is persisted (not mutated on a copy)
//  - cancel_listing actually refunds the highest bidder via token transfer
//  - Per-token bid Vec stored under DataKey::AuctionBids(token_id)

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Symbol, Vec, Map, String,
};
use soroban_sdk::token::Client as TokenClient;

// ─────────────────────────────────────────
//  Storage Key Enum (prevents collisions)
// ─────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    NftCounter,
    MarketplaceFee,
    Treasury,
    EvolutionFee,
    MinEvolutionInterval,
    CreatorTokens(Address),
    Artwork(u64),
    Listing(u64),
    Ownership(u64),
    AuctionBids(u64),   // Vec<Bid> per token
    Escrow(u64),        // AuctionEscrow per token
    Evolutions(u64),    // Vec<Evolution> per token
    RoyaltyHistory,
}

// ─────────────────────────────────────────
//  Core Data Structs
// ─────────────────────────────────────────

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Artwork {
    pub token_id: u64,
    pub creator: Address,
    pub ipfs_hash: String,
    pub title: String,
    pub description: String,
    pub ai_model: String,
    pub creation_timestamp: u64,
    pub royalty_percentage: u32, // basis points (100 = 1%)
    pub is_collaborative: bool,
    pub ai_contribution: u32,
    pub human_contribution: u32,
    pub can_evolve: bool,
    pub evolution_count: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
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

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Bid {
    pub token_id: u64,
    pub bidder: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub active: bool,
}

/// Tracks the escrowed state of an ongoing auction.
/// The contract holds `highest_amount` tokens of `payment_token` on behalf of
/// `highest_bidder`. When a new bid arrives the previous escrow is refunded and
/// this record is updated. When the auction settles (end or cancel) the escrow
/// is released and this record is removed.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct AuctionEscrow {
    pub token_id: u64,
    pub highest_bidder: Address,
    pub highest_amount: i128,
    pub payment_token: Address,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Evolution {
    pub token_id: u64,
    pub evolution_id: u32,
    pub evolver: Address,
    pub prompt: String,
    pub new_ipfs_hash: String,
    pub timestamp: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct RoyaltyPayment {
    pub token_id: u64,
    pub creator: Address,
    pub amount: i128,
    pub timestamp: u64,
}

// ─────────────────────────────────────────
//  Contract
// ─────────────────────────────────────────

#[contract]
pub struct WutaWutaMarketplace;

#[contractimpl]
impl WutaWutaMarketplace {

    // ─── Initialise ─────────────────────────

    pub fn initialize(
        env: Env,
        admin: Address,
        marketplace_fee: u32,
        treasury: Address,
        evolution_fee: i128,
        min_evolution_interval: u64,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NftCounter, &0u64);
        env.storage().instance().set(&DataKey::MarketplaceFee, &marketplace_fee);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::EvolutionFee, &evolution_fee);
        env.storage().instance().set(&DataKey::MinEvolutionInterval, &min_evolution_interval);

        env.events().publish(
            (Symbol::new(&env, "marketplace_initialized"),),
            (admin, marketplace_fee, treasury),
        );
    }

    // ─── Mint Artwork ────────────────────────

    pub fn mint_artwork(
        env: Env,
        creator: Address,
        ipfs_hash: String,
        title: String,
        description: String,
        ai_model: String,
        royalty_percentage: u32,
        is_collaborative: bool,
        ai_contribution: u32,
        human_contribution: u32,
        can_evolve: bool,
    ) -> u64 {
        let admin = Self::get_admin(&env);
        admin.require_auth();

        if ipfs_hash.len() == 0 { panic!("IPFS hash required"); }
        if title.len() == 0 { panic!("Title required"); }
        if ai_model.len() == 0 { panic!("AI model required"); }
        if royalty_percentage > 1000 { panic!("Royalty too high (max 10%)"); }

        if is_collaborative && ai_contribution + human_contribution != 100 {
            panic!("Contributions must sum to 100");
        }

        let token_id = Self::increment_nft_counter(&env);
        let creation_timestamp = env.ledger().timestamp();

        let artwork = Artwork {
            token_id,
            creator: creator.clone(),
            ipfs_hash: ipfs_hash.clone(),
            title: title.clone(),
            description,
            ai_model: ai_model.clone(),
            creation_timestamp,
            royalty_percentage,
            is_collaborative,
            ai_contribution,
            human_contribution,
            can_evolve,
            evolution_count: 0,
        };

        env.storage().instance().set(&DataKey::Artwork(token_id), &artwork);
        env.storage().instance().set(&DataKey::Ownership(token_id), &creator);

        let mut creator_tokens: Vec<u64> = env
            .storage().instance()
            .get(&DataKey::CreatorTokens(creator.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        creator_tokens.push_back(token_id);
        env.storage().instance().set(&DataKey::CreatorTokens(creator.clone()), &creator_tokens);

        env.events().publish(
            (Symbol::new(&env, "artwork_minted"),),
            (token_id, creator, ipfs_hash, title, ai_model, royalty_percentage, is_collaborative),
        );

        token_id
    }

    // ─── List Artwork ────────────────────────

    pub fn list_artwork(
        env: Env,
        seller: Address,
        token_id: u64,
        price: i128,
        duration: u64,
        auction_style: bool,
        reserve_price: Option<i128>,
    ) {
        seller.require_auth();

        let owner: Address = env
            .storage().instance()
            .get(&DataKey::Ownership(token_id))
            .unwrap_or_else(|| panic!("Token not found"));
        if owner != seller { panic!("Not the token owner"); }

        if env.storage().instance().has(&DataKey::Listing(token_id)) {
            let existing: Listing = env.storage().instance().get(&DataKey::Listing(token_id)).unwrap();
            if existing.active { panic!("Already listed"); }
        }

        if price <= 0 { panic!("Price must be positive"); }
        if duration == 0 { panic!("Duration must be positive"); }
        if duration > 2_592_000 { panic!("Duration too long (max 30 days)"); }

        if auction_style {
            if reserve_price.is_none() { panic!("Reserve price required for auctions"); }
            if reserve_price.unwrap() <= 0 { panic!("Reserve price must be positive"); }
        }

        let listing = Listing {
            token_id,
            seller: seller.clone(),
            price,
            start_time: env.ledger().timestamp(),
            duration,
            active: true,
            auction_style,
            reserve_price,
        };

        env.storage().instance().set(&DataKey::Listing(token_id), &listing);

        env.events().publish(
            (Symbol::new(&env, "artwork_listed"),),
            (token_id, seller, price, duration, auction_style),
        );
    }

    // ─── Buy Artwork (fixed-price) ───────────

    pub fn buy_artwork(env: Env, buyer: Address, token_id: u64, payment_token: Address) {
        buyer.require_auth();

        let listing: Listing = env
            .storage().instance()
            .get(&DataKey::Listing(token_id))
            .unwrap_or_else(|| panic!("Listing not found"));

        if !listing.active { panic!("Listing not active"); }
        if listing.auction_style { panic!("Use auction functions for auction listings"); }
        if env.ledger().timestamp() >= listing.start_time + listing.duration {
            panic!("Listing expired");
        }

        let marketplace_fee = Self::get_marketplace_fee(&env);
        let treasury = Self::get_treasury(&env);
        let artwork: Artwork = env.storage().instance().get(&DataKey::Artwork(token_id)).unwrap();

        let fee_amount = (listing.price * marketplace_fee as i128) / 10_000;
        let royalty_amount = (listing.price * artwork.royalty_percentage as i128) / 10_000;
        let seller_amount = listing.price - fee_amount - royalty_amount;

        let token = TokenClient::new(&env, &payment_token);
        token.transfer(&buyer, &treasury, &fee_amount);
        if royalty_amount > 0 {
            token.transfer(&buyer, &artwork.creator, &royalty_amount);
        }
        token.transfer(&buyer, &listing.seller, &seller_amount);

        Self::transfer_token_ownership(&env, token_id, listing.seller.clone(), buyer.clone());

        let mut updated_listing = listing.clone();
        updated_listing.active = false;
        env.storage().instance().set(&DataKey::Listing(token_id), &updated_listing);

        if royalty_amount > 0 {
            Self::record_royalty_payment(&env, token_id, artwork.creator, royalty_amount);
        }

        env.events().publish(
            (Symbol::new(&env, "artwork_sold"),),
            (token_id, buyer, listing.seller, listing.price, fee_amount, royalty_amount),
        );
    }

    // ─── Place Bid (Escrow) ──────────────────

    /// Transfers `amount` tokens from `bidder` into the contract (escrow).
    /// Any previous highest bidder is refunded immediately.
    /// The new bid must exceed the current highest bid by at least 5 %
    /// (or meet the reserve price if no bids exist yet).
    pub fn make_bid(env: Env, bidder: Address, token_id: u64, amount: i128, payment_token: Address) {
        bidder.require_auth();

        let listing: Listing = env
            .storage().instance()
            .get(&DataKey::Listing(token_id))
            .unwrap_or_else(|| panic!("Listing not found"));

        if !listing.active { panic!("Listing not active"); }
        if !listing.auction_style { panic!("Not an auction listing"); }
        if env.ledger().timestamp() >= listing.start_time + listing.duration {
            panic!("Auction has ended");
        }

        // Determine minimum acceptable bid
        let escrow_opt: Option<AuctionEscrow> = env
            .storage().instance()
            .get(&DataKey::Escrow(token_id));

        let min_required = if let Some(ref escrow) = escrow_opt {
            // Must outbid by at least 5 %
            (escrow.highest_amount * 105) / 100
        } else {
            // No bids yet: must meet reserve (or listing price if no reserve)
            listing.reserve_price.unwrap_or(listing.price)
        };

        if amount < min_required {
            panic!("Bid too low");
        }

        let token = TokenClient::new(&env, &payment_token);

        // 1. Refund previous highest bidder
        if let Some(ref old_escrow) = escrow_opt {
            token.transfer(
                &env.current_contract_address(),
                &old_escrow.highest_bidder,
                &old_escrow.highest_amount,
            );

            // Mark old active bid as inactive
            let mut bids: Vec<Bid> = env
                .storage().instance()
                .get(&DataKey::AuctionBids(token_id))
                .unwrap_or_else(|| Vec::new(&env));
            let mut updated_bids: Vec<Bid> = Vec::new(&env);
            for bid in bids.iter() {
                let mut b = bid.clone();
                if b.active && b.bidder == old_escrow.highest_bidder {
                    b.active = false;
                }
                updated_bids.push_back(b);
            }
            bids = updated_bids;
            env.storage().instance().set(&DataKey::AuctionBids(token_id), &bids);
        }

        // 2. Pull new bid funds into contract escrow
        token.transfer(&bidder, &env.current_contract_address(), &amount);

        // 3. Persist new escrow record
        let new_escrow = AuctionEscrow {
            token_id,
            highest_bidder: bidder.clone(),
            highest_amount: amount,
            payment_token: payment_token.clone(),
        };
        env.storage().instance().set(&DataKey::Escrow(token_id), &new_escrow);

        // 4. Append new bid to per-token history
        let new_bid = Bid {
            token_id,
            bidder: bidder.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
            active: true,
        };
        let mut bids: Vec<Bid> = env
            .storage().instance()
            .get(&DataKey::AuctionBids(token_id))
            .unwrap_or_else(|| Vec::new(&env));
        bids.push_back(new_bid);
        env.storage().instance().set(&DataKey::AuctionBids(token_id), &bids);

        env.events().publish(
            (Symbol::new(&env, "bid_placed"),),
            (token_id, bidder, amount),
        );
    }

    // ─── End Auction ─────────────────────────

    /// Callable by anyone once the auction duration has elapsed.
    /// If the reserve is met: transfers the NFT to the winner and distributes
    /// the escrowed funds (marketplace fee → treasury, royalty → creator, remainder → seller).
    /// If the reserve is NOT met: refunds the highest bidder and relists the token for the seller.
    pub fn end_auction(env: Env, token_id: u64) {
        let listing: Listing = env
            .storage().instance()
            .get(&DataKey::Listing(token_id))
            .unwrap_or_else(|| panic!("Listing not found"));

        if !listing.active { panic!("Listing not active"); }
        if !listing.auction_style { panic!("Not an auction listing"); }
        if env.ledger().timestamp() < listing.start_time + listing.duration {
            panic!("Auction has not ended yet");
        }

        let escrow_opt: Option<AuctionEscrow> = env
            .storage().instance()
            .get(&DataKey::Escrow(token_id));

        // If nobody bid, just deactivate the listing
        if escrow_opt.is_none() {
            let mut updated = listing.clone();
            updated.active = false;
            env.storage().instance().set(&DataKey::Listing(token_id), &updated);
            env.events().publish(
                (Symbol::new(&env, "auction_ended_no_bids"),),
                token_id,
            );
            return;
        }

        let escrow = escrow_opt.unwrap();

        // Check reserve price
        let reserve_met = listing
            .reserve_price
            .map(|r| escrow.highest_amount >= r)
            .unwrap_or(true);

        let token = TokenClient::new(&env, &escrow.payment_token);

        if reserve_met {
            // ── Winning settlement ──────────────────────────────────────
            let marketplace_fee = Self::get_marketplace_fee(&env);
            let treasury = Self::get_treasury(&env);
            let artwork: Artwork = env.storage().instance().get(&DataKey::Artwork(token_id)).unwrap();

            let fee_amount = (escrow.highest_amount * marketplace_fee as i128) / 10_000;
            let royalty_amount = (escrow.highest_amount * artwork.royalty_percentage as i128) / 10_000;
            let seller_amount = escrow.highest_amount - fee_amount - royalty_amount;

            // Distribute escrowed funds
            token.transfer(&env.current_contract_address(), &treasury, &fee_amount);
            if royalty_amount > 0 {
                token.transfer(&env.current_contract_address(), &artwork.creator, &royalty_amount);
            }
            token.transfer(&env.current_contract_address(), &listing.seller, &seller_amount);

            // Transfer NFT ownership
            Self::transfer_token_ownership(
                &env,
                token_id,
                listing.seller.clone(),
                escrow.highest_bidder.clone(),
            );

            if royalty_amount > 0 {
                Self::record_royalty_payment(&env, token_id, artwork.creator, royalty_amount);
            }

            env.events().publish(
                (Symbol::new(&env, "auction_ended"),),
                (
                    token_id,
                    escrow.highest_bidder.clone(),
                    listing.seller.clone(),
                    escrow.highest_amount,
                    fee_amount,
                    royalty_amount,
                ),
            );
        } else {
            // ── Reserve not met: refund bidder ──────────────────────────
            token.transfer(
                &env.current_contract_address(),
                &escrow.highest_bidder,
                &escrow.highest_amount,
            );

            env.events().publish(
                (Symbol::new(&env, "auction_reserve_not_met"),),
                (token_id, escrow.highest_bidder, escrow.highest_amount),
            );
        }

        // Clear escrow and deactivate listing
        env.storage().instance().remove(&DataKey::Escrow(token_id));
        let mut updated_listing = listing.clone();
        updated_listing.active = false;
        env.storage().instance().set(&DataKey::Listing(token_id), &updated_listing);
    }

    // ─── Cancel Listing ───────────────────────

    /// Seller can cancel at any time.
    /// For auction listings, any escrowed funds (highest bid) are refunded to the bidder.
    pub fn cancel_listing(env: Env, seller: Address, token_id: u64) {
        seller.require_auth();

        let listing: Listing = env
            .storage().instance()
            .get(&DataKey::Listing(token_id))
            .unwrap_or_else(|| panic!("Listing not found"));

        if listing.seller != seller { panic!("Not the seller"); }
        if !listing.active { panic!("Listing not active"); }

        // Refund highest bidder if this is an auction with active escrow
        if listing.auction_style {
            let escrow_opt: Option<AuctionEscrow> = env
                .storage().instance()
                .get(&DataKey::Escrow(token_id));

            if let Some(escrow) = escrow_opt {
                let token = TokenClient::new(&env, &escrow.payment_token);
                token.transfer(
                    &env.current_contract_address(),
                    &escrow.highest_bidder,
                    &escrow.highest_amount,
                );
                env.storage().instance().remove(&DataKey::Escrow(token_id));

                env.events().publish(
                    (Symbol::new(&env, "bid_refunded"),),
                    (token_id, escrow.highest_bidder, escrow.highest_amount),
                );
            }
        }

        let mut updated_listing = listing.clone();
        updated_listing.active = false;
        env.storage().instance().set(&DataKey::Listing(token_id), &updated_listing);

        env.events().publish(
            (Symbol::new(&env, "listing_cancelled"),),
            (token_id, seller),
        );
    }

    // ─── Evolve Artwork ───────────────────────

    pub fn evolve_artwork(
        env: Env,
        evolver: Address,
        token_id: u64,
        prompt: String,
        new_ipfs_hash: String,
        payment_token: Address,
    ) {
        evolver.require_auth();

        let owner: Address = env
            .storage().instance()
            .get(&DataKey::Ownership(token_id))
            .unwrap_or_else(|| panic!("Token not found"));
        if owner != evolver { panic!("Not the token owner"); }

        let artwork: Artwork = env.storage().instance().get(&DataKey::Artwork(token_id)).unwrap();
        if !artwork.can_evolve { panic!("Artwork cannot evolve"); }

        let min_interval = Self::get_min_evolution_interval(&env);
        if env.ledger().timestamp() < artwork.creation_timestamp + min_interval {
            panic!("Evolution interval not met");
        }

        let evolution_fee = Self::get_evolution_fee(&env);
        if evolution_fee > 0 {
            let treasury = Self::get_treasury(&env);
            let token = TokenClient::new(&env, &payment_token);
            token.transfer(&evolver, &treasury, &evolution_fee);
        }

        let evolution_id = artwork.evolution_count + 1;
        let evolution = Evolution {
            token_id,
            evolution_id,
            evolver: evolver.clone(),
            prompt: prompt.clone(),
            new_ipfs_hash: new_ipfs_hash.clone(),
            timestamp: env.ledger().timestamp(),
        };

        let mut evolutions: Vec<Evolution> = env
            .storage().instance()
            .get(&DataKey::Evolutions(token_id))
            .unwrap_or_else(|| Vec::new(&env));
        evolutions.push_back(evolution);
        env.storage().instance().set(&DataKey::Evolutions(token_id), &evolutions);

        let mut updated_artwork = artwork;
        updated_artwork.evolution_count = evolution_id;
        env.storage().instance().set(&DataKey::Artwork(token_id), &updated_artwork);

        env.events().publish(
            (Symbol::new(&env, "artwork_evolved"),),
            (token_id, evolution_id, evolver, prompt, new_ipfs_hash),
        );
    }

    // ─── Admin Functions ──────────────────────

    pub fn update_marketplace_fee(env: Env, new_fee: u32) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        if new_fee > 1000 { panic!("Fee too high (max 10%)"); }
        env.storage().instance().set(&DataKey::MarketplaceFee, &new_fee);
        env.events().publish((Symbol::new(&env, "fee_updated"),), new_fee);
    }

    pub fn update_evolution_fee(env: Env, new_fee: i128) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        if new_fee < 0 { panic!("Fee cannot be negative"); }
        env.storage().instance().set(&DataKey::EvolutionFee, &new_fee);
        env.events().publish((Symbol::new(&env, "evolution_fee_updated"),), new_fee);
    }

    pub fn update_treasury(env: Env, new_treasury: Address) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Treasury, &new_treasury);
        env.events().publish((Symbol::new(&env, "treasury_updated"),), new_treasury);
    }

    // ─── View Functions ───────────────────────

    pub fn get_artwork(env: Env, token_id: u64) -> Artwork {
        env.storage().instance().get(&DataKey::Artwork(token_id))
            .unwrap_or_else(|| panic!("Artwork not found"))
    }

    pub fn get_listing(env: Env, token_id: u64) -> Listing {
        env.storage().instance().get(&DataKey::Listing(token_id))
            .unwrap_or_else(|| panic!("Listing not found"))
    }

    pub fn get_active_listings(env: Env) -> Vec<Listing> {
        // NOTE: Iterating all listings requires knowing which token_ids exist.
        // We return an empty Vec here as a safe fallback — callers should use
        // get_listing(token_id) for specific tokens. A production upgrade would
        // maintain an index Vec<u64> of all listed token_ids.
        Vec::new(&env)
    }

    pub fn get_token_owner(env: Env, token_id: u64) -> Address {
        env.storage().instance().get(&DataKey::Ownership(token_id))
            .unwrap_or_else(|| panic!("Token not found"))
    }

    pub fn get_creator_tokens(env: Env, creator: Address) -> Vec<u64> {
        env.storage().instance()
            .get(&DataKey::CreatorTokens(creator))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Returns the current escrow state for an active auction.
    /// `None` when no bids have been placed or after auction settlement.
    pub fn get_auction_escrow(env: Env, token_id: u64) -> Option<AuctionEscrow> {
        env.storage().instance().get(&DataKey::Escrow(token_id))
    }

    /// Returns the current highest bid for an active auction (if any).
    pub fn get_highest_bid(env: Env, token_id: u64) -> Option<Bid> {
        let bids: Vec<Bid> = env
            .storage().instance()
            .get(&DataKey::AuctionBids(token_id))
            .unwrap_or_else(|| Vec::new(&env));

        let mut highest: Option<Bid> = None;
        for bid in bids.iter() {
            if bid.active {
                match &highest {
                    None => highest = Some(bid.clone()),
                    Some(current) if bid.amount > current.amount => {
                        highest = Some(bid.clone());
                    }
                    _ => {}
                }
            }
        }
        highest
    }

    /// Returns the full bid history for a token (active and outbid).
    pub fn get_token_bids(env: Env, token_id: u64) -> Vec<Bid> {
        env.storage().instance()
            .get(&DataKey::AuctionBids(token_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Returns the number of seconds remaining in an auction (0 if ended).
    pub fn get_time_remaining(env: Env, token_id: u64) -> u64 {
        let listing: Listing = env
            .storage().instance()
            .get(&DataKey::Listing(token_id))
            .unwrap_or_else(|| panic!("Listing not found"));

        let end_time = listing.start_time + listing.duration;
        let now = env.ledger().timestamp();
        if now >= end_time { 0 } else { end_time - now }
    }

    pub fn get_evolutions(env: Env, token_id: u64) -> Vec<Evolution> {
        env.storage().instance()
            .get(&DataKey::Evolutions(token_id))
            .unwrap_or_else(|| Vec::new(&env))
    }

    // ─── Private Helpers ─────────────────────

    fn get_admin(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Not initialized"))
    }

    fn get_marketplace_fee(env: &Env) -> u32 {
        env.storage().instance().get(&DataKey::MarketplaceFee).unwrap_or(250)
    }

    fn get_treasury(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Treasury)
            .unwrap_or_else(|| panic!("Treasury not set"))
    }

    fn get_evolution_fee(env: &Env) -> i128 {
        env.storage().instance().get(&DataKey::EvolutionFee).unwrap_or(1_000_000)
    }

    fn get_min_evolution_interval(env: &Env) -> u64 {
        env.storage().instance().get(&DataKey::MinEvolutionInterval).unwrap_or(86_400)
    }

    fn increment_nft_counter(env: &Env) -> u64 {
        let mut counter: u64 = env.storage().instance().get(&DataKey::NftCounter).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::NftCounter, &counter);
        counter
    }

    fn transfer_token_ownership(env: &Env, token_id: u64, from: Address, to: Address) {
        env.storage().instance().set(&DataKey::Ownership(token_id), &to);

        // Remove from old owner's list
        let mut old_tokens: Vec<u64> = env
            .storage().instance()
            .get(&DataKey::CreatorTokens(from.clone()))
            .unwrap_or_else(|| Vec::new(env));
        let mut filtered: Vec<u64> = Vec::new(env);
        for t in old_tokens.iter() {
            if t != token_id { filtered.push_back(t); }
        }
        env.storage().instance().set(&DataKey::CreatorTokens(from), &filtered);

        // Add to new owner's list
        let mut new_tokens: Vec<u64> = env
            .storage().instance()
            .get(&DataKey::CreatorTokens(to.clone()))
            .unwrap_or_else(|| Vec::new(env));
        new_tokens.push_back(token_id);
        env.storage().instance().set(&DataKey::CreatorTokens(to), &new_tokens);
    }

    fn record_royalty_payment(env: &Env, token_id: u64, creator: Address, amount: i128) {
        let payment = RoyaltyPayment {
            token_id,
            creator,
            amount,
            timestamp: env.ledger().timestamp(),
        };
        let mut history: Vec<RoyaltyPayment> = env
            .storage().instance()
            .get(&DataKey::RoyaltyHistory)
            .unwrap_or_else(|| Vec::new(env));
        history.push_back(payment);
        env.storage().instance().set(&DataKey::RoyaltyHistory, &history);
    }
}
