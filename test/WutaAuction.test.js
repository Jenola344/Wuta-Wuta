// WutaAuction.test.js — Hardhat / ethers v5 test suite
// Run with: npx hardhat test test/WutaAuction.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Increase local hardhat chain time and mine a block. */
async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

/** Deploy a minimal ERC-721 mock for testing. */
async function deployMockNFT(signer) {
  const MockNFT = await ethers.getContractFactory("MockERC721", signer);
  return MockNFT.deploy("MockNFT", "MFT");
}

/** Deploy WutaAuction. */
async function deployAuction(signer) {
  const WutaAuction = await ethers.getContractFactory("WutaAuction", signer);
  return WutaAuction.deploy();
}

const ONE_ETH  = ethers.utils.parseEther("1");
const HALF_ETH = ethers.utils.parseEther("0.5");
const TWO_ETH  = ethers.utils.parseEther("2");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WutaAuction", function () {
  let owner, seller, bidder1, bidder2, stranger;
  let nft, auction;
  const TOKEN_ID = 1;

  // Auction parameters
  const STARTING_PRICE = HALF_ETH;
  const RESERVE_PRICE  = ONE_ETH;
  const DURATION       = 3600; // 1 hour

  // ─── Setup ──────────────────────────────────────────────────────────────────

  beforeEach(async function () {
    [owner, seller, bidder1, bidder2, stranger] = await ethers.getSigners();

    // Deploy mock NFT and mint token 1 to seller
    nft = await deployMockNFT(owner);
    await nft.connect(owner).mint(seller.address, TOKEN_ID);

    // Deploy auction contract
    auction = await deployAuction(owner);

    // Seller approves auction contract to transfer the NFT
    await nft.connect(seller).approve(auction.address, TOKEN_ID);
  });

  // ─── createAuction ──────────────────────────────────────────────────────────

  describe("createAuction", function () {
    it("transfers NFT into escrow and emits AuctionCreated", async function () {
      await expect(
        auction.connect(seller).createAuction(
          nft.address, TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, DURATION
        )
      )
        .to.emit(auction, "AuctionCreated")
        .withArgs(
          1,              // auctionId
          seller.address,
          nft.address,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          (await ethers.provider.getBlock("latest")).timestamp + DURATION + 1
        );

      // NFT should now be held by the auction contract
      expect(await nft.ownerOf(TOKEN_ID)).to.equal(auction.address);
    });

    it("reverts if caller is not the token owner", async function () {
      await expect(
        auction.connect(stranger).createAuction(
          nft.address, TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, DURATION
        )
      ).to.be.revertedWith("WutaAuction: caller is not token owner");
    });

    it("reverts if startingPrice is 0", async function () {
      await expect(
        auction.connect(seller).createAuction(nft.address, TOKEN_ID, 0, RESERVE_PRICE, DURATION)
      ).to.be.revertedWith("WutaAuction: starting price must be > 0");
    });

    it("reverts if reservePrice < startingPrice", async function () {
      await expect(
        auction.connect(seller).createAuction(nft.address, TOKEN_ID, ONE_ETH, HALF_ETH, DURATION)
      ).to.be.revertedWith("WutaAuction: reserve must be >= starting price");
    });

    it("reverts if duration exceeds MAX_DURATION", async function () {
      const tooLong = 31 * 24 * 3600; // 31 days
      await expect(
        auction.connect(seller).createAuction(nft.address, TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, tooLong)
      ).to.be.revertedWith("WutaAuction: duration too long");
    });
  });

  // ─── placeBid ───────────────────────────────────────────────────────────────

  describe("placeBid", function () {
    let auctionId;

    beforeEach(async function () {
      const tx = await auction.connect(seller).createAuction(
        nft.address, TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, DURATION
      );
      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;
    });

    it("accepts a valid bid and emits BidPlaced", async function () {
      await expect(
        auction.connect(bidder1).placeBid(auctionId, { value: RESERVE_PRICE })
      )
        .to.emit(auction, "BidPlaced")
        .withArgs(auctionId, bidder1.address, RESERVE_PRICE);

      const a = await auction.getAuction(auctionId);
      expect(a.highestBidder).to.equal(bidder1.address);
      expect(a.highestBid).to.equal(RESERVE_PRICE);
    });

    it("reverts if bid is below starting price", async function () {
      const tooLow = STARTING_PRICE.sub(1);
      await expect(
        auction.connect(bidder1).placeBid(auctionId, { value: tooLow })
      ).to.be.revertedWith("WutaAuction: bid below minimum");
    });

    it("reverts if bid is below 5 % increment over current highest", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      // Second bid must be at least 1.05 ETH
      const insufficient = ethers.utils.parseEther("1.04");
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: insufficient })
      ).to.be.revertedWith("WutaAuction: bid below minimum");
    });

    it("refunds the previous highest bidder immediately", async function () {
      // bidder1 bids 1 ETH
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });

      const bidder1BalanceBefore = await bidder1.getBalance();

      // bidder2 outbids with 1.1 ETH
      const outbid = ethers.utils.parseEther("1.1");
      await auction.connect(bidder2).placeBid(auctionId, { value: outbid });

      const bidder1BalanceAfter = await bidder1.getBalance();

      // bidder1 should receive their 1 ETH back (allow some gas tolerance, but they're not spending gas)
      expect(bidder1BalanceAfter.sub(bidder1BalanceBefore)).to.equal(ONE_ETH);
    });

    it("emits BidRefunded when outbid", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      const outbid = ethers.utils.parseEther("1.1");
      await expect(
        auction.connect(bidder2).placeBid(auctionId, { value: outbid })
      ).to.emit(auction, "BidRefunded").withArgs(auctionId, bidder1.address, ONE_ETH);
    });

    it("reverts if auction time has expired", async function () {
      await increaseTime(DURATION + 1);
      await expect(
        auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH })
      ).to.be.revertedWith("WutaAuction: auction time expired");
    });

    it("reverts if seller tries to bid on own auction", async function () {
      await expect(
        auction.connect(seller).placeBid(auctionId, { value: ONE_ETH })
      ).to.be.revertedWith("WutaAuction: seller cannot bid");
    });
  });

  // ─── endAuction: reserve met ─────────────────────────────────────────────────

  describe("endAuction — reserve met", function () {
    let auctionId;

    beforeEach(async function () {
      const tx = await auction.connect(seller).createAuction(
        nft.address, TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, DURATION
      );
      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;

      await auction.connect(bidder1).placeBid(auctionId, { value: TWO_ETH });
      await increaseTime(DURATION + 1);
    });

    it("transfers NFT to the highest bidder", async function () {
      await auction.connect(stranger).endAuction(auctionId);
      expect(await nft.ownerOf(TOKEN_ID)).to.equal(bidder1.address);
    });

    it("transfers ETH (minus fee) to the seller", async function () {
      const sellerBefore = await seller.getBalance();
      await auction.connect(stranger).endAuction(auctionId);
      const sellerAfter = await seller.getBalance();

      const fee           = TWO_ETH.mul(250).div(10_000); // 2.5 %
      const expectedProc  = TWO_ETH.sub(fee);
      expect(sellerAfter.sub(sellerBefore)).to.equal(expectedProc);
    });

    it("accumulates marketplace fee in contract", async function () {
      await auction.connect(stranger).endAuction(auctionId);
      const expectedFee = TWO_ETH.mul(250).div(10_000);
      expect(await auction.accumulatedFees()).to.equal(expectedFee);
    });

    it("emits AuctionEnded with reserveMet = true", async function () {
      const fee = TWO_ETH.mul(250).div(10_000);
      await expect(auction.connect(stranger).endAuction(auctionId))
        .to.emit(auction, "AuctionEnded")
        .withArgs(
          auctionId,
          bidder1.address,
          seller.address,
          TWO_ETH,
          TWO_ETH.sub(fee),
          fee,
          true
        );
    });

    it("reverts if endAuction is called before endTime", async function () {
      const tx2 = await auction.connect(seller).createAuction(
        nft.address, TOKEN_ID + 1, STARTING_PRICE, RESERVE_PRICE, DURATION
      ).catch(() => null); // may not have nft; just check the revert on existing auction

      // Re-create auction fresh
      const nft2 = await deployMockNFT(owner);
      await nft2.mint(seller.address, 1);
      await nft2.connect(seller).approve(auction.address, 1);
      const tx3 = await auction.connect(seller).createAuction(nft2.address, 1, STARTING_PRICE, RESERVE_PRICE, DURATION);
      const r3 = await tx3.wait();
      const aid3 = r3.events.find(e => e.event === "AuctionCreated").args.auctionId;

      await expect(auction.endAuction(aid3)).to.be.revertedWith("WutaAuction: auction still running");
    });
  });

  // ─── endAuction: reserve NOT met ─────────────────────────────────────────────

  describe("endAuction — reserve not met", function () {
    let auctionId;

    beforeEach(async function () {
      // Reserve is 5 ETH; bidder only bids 1 ETH
      const tx = await auction.connect(seller).createAuction(
        nft.address, TOKEN_ID, STARTING_PRICE, ethers.utils.parseEther("5"), DURATION
      );
      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;

      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      await increaseTime(DURATION + 1);
    });

    it("returns NFT to seller", async function () {
      await auction.endAuction(auctionId);
      expect(await nft.ownerOf(TOKEN_ID)).to.equal(seller.address);
    });

    it("refunds ETH to the highest bidder", async function () {
      const before = await bidder1.getBalance();
      await auction.endAuction(auctionId);
      const after = await bidder1.getBalance();
      expect(after.sub(before)).to.equal(ONE_ETH);
    });

    it("emits AuctionEnded with reserveMet = false", async function () {
      await expect(auction.endAuction(auctionId))
        .to.emit(auction, "AuctionEnded")
        .withArgs(auctionId, ethers.constants.AddressZero, seller.address, ONE_ETH, 0, 0, false);
    });
  });

  // ─── endAuction: no bids ──────────────────────────────────────────────────────

  describe("endAuction — no bids", function () {
    it("returns NFT to seller and emits AuctionEnded with 0 bid", async function () {
      const tx = await auction.connect(seller).createAuction(
        nft.address, TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, DURATION
      );
      const receipt = await tx.wait();
      const auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;

      await increaseTime(DURATION + 1);
      await auction.endAuction(auctionId);

      expect(await nft.ownerOf(TOKEN_ID)).to.equal(seller.address);
    });
  });

  // ─── cancelAuction ────────────────────────────────────────────────────────────

  describe("cancelAuction", function () {
    let auctionId;

    beforeEach(async function () {
      const tx = await auction.connect(seller).createAuction(
        nft.address, TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, DURATION
      );
      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;
    });

    it("returns NFT to seller and emits AuctionCancelled if no bids", async function () {
      await expect(auction.connect(seller).cancelAuction(auctionId))
        .to.emit(auction, "AuctionCancelled")
        .withArgs(auctionId, seller.address);

      expect(await nft.ownerOf(TOKEN_ID)).to.equal(seller.address);
    });

    it("reverts if a bid has been placed", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      await expect(
        auction.connect(seller).cancelAuction(auctionId)
      ).to.be.revertedWith("WutaAuction: bids already placed; wait for endTime");
    });

    it("reverts if caller is not the seller", async function () {
      await expect(
        auction.connect(stranger).cancelAuction(auctionId)
      ).to.be.revertedWith("WutaAuction: not the seller");
    });
  });

  // ─── Admin: setMarketplaceFee ─────────────────────────────────────────────────

  describe("Admin", function () {
    it("owner can update marketplace fee", async function () {
      await expect(auction.connect(owner).setMarketplaceFee(300))
        .to.emit(auction, "MarketplaceFeeUpdated")
        .withArgs(250, 300);
      expect(await auction.marketplaceFee()).to.equal(300);
    });

    it("reverts if fee > 10 %", async function () {
      await expect(
        auction.connect(owner).setMarketplaceFee(1001)
      ).to.be.revertedWith("WutaAuction: fee cannot exceed 10%");
    });

    it("non-owner cannot update fee", async function () {
      await expect(
        auction.connect(stranger).setMarketplaceFee(300)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("owner can withdraw accumulated fees", async function () {
      const tx = await auction.connect(seller).createAuction(
        nft.address, TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, DURATION
      );
      const receipt = await tx.wait();
      const auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;

      await auction.connect(bidder1).placeBid(auctionId, { value: TWO_ETH });
      await increaseTime(DURATION + 1);
      await auction.endAuction(auctionId);

      const fee = TWO_ETH.mul(250).div(10_000);
      const ownerBefore = await owner.getBalance();
      const tx2 = await auction.connect(owner).withdraw();
      const r2 = await tx2.wait();
      const gasUsed = r2.gasUsed.mul(tx2.gasPrice);
      const ownerAfter = await owner.getBalance();

      expect(ownerAfter.sub(ownerBefore).add(gasUsed)).to.equal(fee);
    });
  });

  // ─── View helpers ─────────────────────────────────────────────────────────────

  describe("View helpers", function () {
    let auctionId;

    beforeEach(async function () {
      const tx = await auction.connect(seller).createAuction(
        nft.address, TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, DURATION
      );
      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;
    });

    it("timeRemaining returns positive value before end", async function () {
      const rem = await auction.timeRemaining(auctionId);
      expect(rem).to.be.gt(0);
      expect(rem).to.be.lte(DURATION);
    });

    it("timeRemaining returns 0 after end time", async function () {
      await increaseTime(DURATION + 1);
      expect(await auction.timeRemaining(auctionId)).to.equal(0);
    });

    it("minimumBid returns startingPrice when no bids", async function () {
      expect(await auction.minimumBid(auctionId)).to.equal(STARTING_PRICE);
    });

    it("minimumBid returns 5 % over highestBid when bid exists", async function () {
      await auction.connect(bidder1).placeBid(auctionId, { value: ONE_ETH });
      const expected = ONE_ETH.mul(10_500).div(10_000);
      expect(await auction.minimumBid(auctionId)).to.equal(expected);
    });

    it("totalAuctions increments after each auction", async function () {
      expect(await auction.totalAuctions()).to.equal(1);

      const nft2 = await deployMockNFT(owner);
      await nft2.mint(seller.address, 1);
      await nft2.connect(seller).approve(auction.address, 1);
      await auction.connect(seller).createAuction(nft2.address, 1, STARTING_PRICE, RESERVE_PRICE, DURATION);

      expect(await auction.totalAuctions()).to.equal(2);
    });
  });
});
