// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WutaAuction
 * @notice Escrow-based, time-bound auction house for Wuta-Wuta NFTs.
 *
 * Flow:
 *  1. Seller calls `createAuction` — the NFT is transferred into this contract.
 *  2. Bidders call `placeBid{ value: ... }` — their ETH is held in escrow.
 *     Any previously-highest bidder is refunded immediately.
 *  3. After `endTime` anyone calls `endAuction`:
 *     - Reserve met  → NFT to winner, ETH (minus market fee) to seller.
 *     - Reserve unmet → NFT returned to seller, ETH refunded to bidder.
 *  4. Seller may call `cancelAuction` before the first bid is placed; NFT is
 *     returned and no refunds are needed.
 *
 * Security:
 *  - ReentrancyGuard on all state-changing fund flows.
 *  - Pull-pattern for accumulated marketplace fees (`withdraw`).
 */
contract WutaAuction is ReentrancyGuard, Ownable {

    // ─────────────────────────────────────────────────────────
    //  Constants
    // ─────────────────────────────────────────────────────────

    /// Marketplace fee in basis points (250 = 2.5 %).
    uint256 public marketplaceFee = 250;

    /// Minimum bid increment over the current highest bid (5 %).
    uint256 public constant MIN_BID_INCREMENT_BPS = 500;

    /// Maximum auction duration: 30 days.
    uint256 public constant MAX_DURATION = 30 days;

    /// Minimum auction duration: 1 minute (for testing convenience).
    uint256 public constant MIN_DURATION = 1 minutes;

    // ─────────────────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────────────────

    uint256 private _auctionIdCounter;

    /// Accumulated marketplace fees available for `withdraw`.
    uint256 public accumulatedFees;

    struct Auction {
        uint256 auctionId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startingPrice;   // Minimum starting bid (wei)
        uint256 reservePrice;    // Minimum price to complete the sale (wei)
        uint256 highestBid;      // Current highest bid in escrow (wei)
        address highestBidder;   // Address holding the current highest bid
        uint256 startTime;       // Block timestamp when auction was created
        uint256 endTime;         // Block timestamp when auction closes
        bool ended;              // True once endAuction has been called
        bool cancelled;          // True once cancelAuction has been called
    }

    /// auctionId → Auction
    mapping(uint256 => Auction) public auctions;

    // ─────────────────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────────────────

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event BidRefunded(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        address indexed seller,
        uint256 winningBid,
        uint256 sellerProceeds,
        uint256 marketplaceFeeCollected,
        bool reserveMet
    );

    event AuctionCancelled(
        uint256 indexed auctionId,
        address indexed seller
    );

    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);

    // ─────────────────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────────────────

    modifier auctionExists(uint256 auctionId) {
        require(auctions[auctionId].seller != address(0), "WutaAuction: auction does not exist");
        _;
    }

    modifier auctionActive(uint256 auctionId) {
        Auction storage a = auctions[auctionId];
        require(!a.ended, "WutaAuction: auction already ended");
        require(!a.cancelled, "WutaAuction: auction cancelled");
        require(block.timestamp < a.endTime, "WutaAuction: auction time expired");
        _;
    }

    // ─────────────────────────────────────────────────────────
    //  Core Functions
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Create a new time-bound escrow auction.
     * @dev The caller must have approved this contract to transfer `tokenId`
     *      from `nftContract` before calling this function.
     *
     * @param nftContract    Address of the ERC-721 contract.
     * @param tokenId        Token ID being auctioned.
     * @param startingPrice  Minimum opening bid (wei). Must be > 0.
     * @param reservePrice   Minimum sale price (wei). Must be >= startingPrice.
     * @param duration       Auction length in seconds. Clamped to [MIN_DURATION, MAX_DURATION].
     * @return auctionId     Unique ID for this auction.
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 duration
    ) external nonReentrant returns (uint256 auctionId) {
        require(nftContract != address(0), "WutaAuction: invalid NFT contract");
        require(startingPrice > 0,          "WutaAuction: starting price must be > 0");
        require(reservePrice >= startingPrice, "WutaAuction: reserve must be >= starting price");
        require(duration >= MIN_DURATION,   "WutaAuction: duration too short");
        require(duration <= MAX_DURATION,   "WutaAuction: duration too long");

        // Ensure the caller owns the token
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "WutaAuction: caller is not token owner"
        );

        // Pull the NFT into escrow
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        auctionId = ++_auctionIdCounter;

        auctions[auctionId] = Auction({
            auctionId:     auctionId,
            seller:        msg.sender,
            nftContract:   nftContract,
            tokenId:       tokenId,
            startingPrice: startingPrice,
            reservePrice:  reservePrice,
            highestBid:    0,
            highestBidder: address(0),
            startTime:     block.timestamp,
            endTime:       block.timestamp + duration,
            ended:         false,
            cancelled:     false
        });

        emit AuctionCreated(
            auctionId,
            msg.sender,
            nftContract,
            tokenId,
            startingPrice,
            reservePrice,
            block.timestamp + duration
        );
    }

    /**
     * @notice Place a bid on an active auction.
     * @dev    The entire `msg.value` is held in escrow.  Any previously-highest
     *         bidder is refunded immediately (pull pattern is used for fees only).
     *
     * Requirements:
     *  - Auction must be active (not ended, not cancelled, not past endTime).
     *  - `msg.value` must meet the minimum: if no bids yet → startingPrice;
     *    otherwise → currentHighest * (10000 + MIN_BID_INCREMENT_BPS) / 10000.
     *
     * @param auctionId  ID of the auction to bid on.
     */
    function placeBid(uint256 auctionId)
        external
        payable
        nonReentrant
        auctionExists(auctionId)
        auctionActive(auctionId)
    {
        Auction storage a = auctions[auctionId];
        require(msg.sender != a.seller, "WutaAuction: seller cannot bid");

        uint256 minimumBid = a.highestBid == 0
            ? a.startingPrice
            : (a.highestBid * (10_000 + MIN_BID_INCREMENT_BPS)) / 10_000;

        require(msg.value >= minimumBid, "WutaAuction: bid below minimum");

        // Refund the previous highest bidder
        if (a.highestBidder != address(0)) {
            address prevBidder = a.highestBidder;
            uint256 prevAmount = a.highestBid;

            // Update state BEFORE external call (CEI pattern)
            a.highestBid    = msg.value;
            a.highestBidder = msg.sender;

            _safeTransferEth(prevBidder, prevAmount);
            emit BidRefunded(auctionId, prevBidder, prevAmount);
        } else {
            a.highestBid    = msg.value;
            a.highestBidder = msg.sender;
        }

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    /**
     * @notice Settle the auction after its end time has passed.
     * @dev    Callable by anyone (seller, winner, or third party).
     *
     *  If reserve met:
     *   - Marketplace fee deducted and added to `accumulatedFees`.
     *   - Remaining ETH transferred to seller.
     *   - NFT transferred to highest bidder.
     *
     *  If reserve NOT met (or no bids):
     *   - All escrowed ETH refunded to the highest bidder (if any).
     *   - NFT returned to seller.
     *
     * @param auctionId  ID of the auction to settle.
     */
    function endAuction(uint256 auctionId)
        external
        nonReentrant
        auctionExists(auctionId)
    {
        Auction storage a = auctions[auctionId];
        require(!a.ended,     "WutaAuction: already ended");
        require(!a.cancelled, "WutaAuction: auction cancelled");
        require(block.timestamp >= a.endTime, "WutaAuction: auction still running");

        a.ended = true;

        bool reserveMet = (a.highestBidder != address(0)) && (a.highestBid >= a.reservePrice);

        if (reserveMet) {
            uint256 feeAmount    = (a.highestBid * marketplaceFee) / 10_000;
            uint256 sellerAmount = a.highestBid - feeAmount;

            accumulatedFees += feeAmount;

            address winner = a.highestBidder;
            address seller = a.seller;

            // Transfer NFT to winner
            IERC721(a.nftContract).transferFrom(address(this), winner, a.tokenId);

            // Transfer ETH to seller
            _safeTransferEth(seller, sellerAmount);

            emit AuctionEnded(
                auctionId,
                winner,
                seller,
                a.highestBid,
                sellerAmount,
                feeAmount,
                true
            );
        } else {
            // Return NFT to seller
            IERC721(a.nftContract).transferFrom(address(this), a.seller, a.tokenId);

            // Refund bidder (if any)
            if (a.highestBidder != address(0)) {
                address prevBidder = a.highestBidder;
                uint256 prevAmount = a.highestBid;
                _safeTransferEth(prevBidder, prevAmount);
                emit BidRefunded(auctionId, prevBidder, prevAmount);
            }

            emit AuctionEnded(
                auctionId,
                address(0),
                a.seller,
                a.highestBid,
                0,
                0,
                false
            );
        }
    }

    /**
     * @notice Cancel an auction before any bid is placed.
     * @dev    Only the seller may cancel. Once a bid exists the auction must
     *         run to completion (call `endAuction` after `endTime`).
     *
     * @param auctionId  ID of the auction to cancel.
     */
    function cancelAuction(uint256 auctionId)
        external
        nonReentrant
        auctionExists(auctionId)
    {
        Auction storage a = auctions[auctionId];
        require(msg.sender == a.seller, "WutaAuction: not the seller");
        require(!a.ended,     "WutaAuction: already ended");
        require(!a.cancelled, "WutaAuction: already cancelled");
        require(a.highestBidder == address(0), "WutaAuction: bids already placed; wait for endTime");

        a.cancelled = true;

        // Return NFT to seller
        IERC721(a.nftContract).transferFrom(address(this), a.seller, a.tokenId);

        emit AuctionCancelled(auctionId, a.seller);
    }

    // ─────────────────────────────────────────────────────────
    //  Admin Functions
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Update the marketplace fee (owner only).
     * @param newFee  New fee in basis points. Max 1000 (10 %).
     */
    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "WutaAuction: fee cannot exceed 10%");
        emit MarketplaceFeeUpdated(marketplaceFee, newFee);
        marketplaceFee = newFee;
    }

    /**
     * @notice Withdraw accumulated marketplace fees to the owner.
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "WutaAuction: no fees to withdraw");
        accumulatedFees = 0;
        _safeTransferEth(owner(), amount);
    }

    // ─────────────────────────────────────────────────────────
    //  View Helpers
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Returns full auction details.
     */
    function getAuction(uint256 auctionId)
        external
        view
        auctionExists(auctionId)
        returns (Auction memory)
    {
        return auctions[auctionId];
    }

    /**
     * @notice Seconds remaining until auction ends (0 if already past endTime).
     */
    function timeRemaining(uint256 auctionId)
        external
        view
        auctionExists(auctionId)
        returns (uint256)
    {
        uint256 end = auctions[auctionId].endTime;
        if (block.timestamp >= end) return 0;
        return end - block.timestamp;
    }

    /**
     * @notice Minimum ETH required for the next valid bid.
     * @return 0 if the auction has no bids (caller should use startingPrice).
     */
    function minimumBid(uint256 auctionId)
        external
        view
        auctionExists(auctionId)
        returns (uint256)
    {
        Auction storage a = auctions[auctionId];
        if (a.highestBid == 0) return a.startingPrice;
        return (a.highestBid * (10_000 + MIN_BID_INCREMENT_BPS)) / 10_000;
    }

    /**
     * @notice Total number of auctions ever created.
     */
    function totalAuctions() external view returns (uint256) {
        return _auctionIdCounter;
    }

    // ─────────────────────────────────────────────────────────
    //  Internal Helpers
    // ─────────────────────────────────────────────────────────

    /**
     * @dev Sends `amount` wei to `recipient`. Reverts on failure.
     *      Uses a low-level call to support contracts as recipients.
     */
    function _safeTransferEth(address recipient, uint256 amount) internal {
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "WutaAuction: ETH transfer failed");
    }

    /// Fallback — reject plain ETH sends to keep accounting clean.
    receive() external payable {
        revert("WutaAuction: use placeBid");
    }
}
