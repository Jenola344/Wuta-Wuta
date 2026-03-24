const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { 
  deployMuseNFT, 
  registerTestModels, 
  createTestArtwork, 
  getFutureTime, 
  mineBlocks 
} = require("./helpers/contracts");
const { 
  generateRandomHash, 
  expectRevert, 
  getEvent, 
  generateMockIPFSUri 
} = require("./helpers/utils");

describe("MuseNFT", function () {
  let museNFT;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
    const MuseNFT = await ethers.getContractFactory("MuseNFT");
    museNFT = await MuseNFT.deploy();
    await museNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await museNFT.owner()).to.equal(owner.address);
    });

const { expect }      = require("chai");
const { ethers }      = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ─── Fixture ──────────────────────────────────────────────────────────────────

async function deployMuseNFTFixture() {
  const [owner, artist, buyer] = await ethers.getSigners();
  const MuseNFT = await ethers.getContractFactory("MuseNFT");
  const contract = await MuseNFT.deploy();
  return { contract, owner, artist, buyer };
}

    it("Should not register duplicate model", async function () {
      await museNFT.registerAIModel("stable-diffusion");
      
      await expectRevert(
        museNFT.registerAIModel("stable-diffusion"),
        "Model already registered"
      );
    });

    it("Should not register empty model name", async function () {
      await expectRevert(
        museNFT.registerAIModel(""),
        "Model name required"
      );
    });

    it("Should allow multiple model registrations", async function () {
      const models = ["stable-diffusion", "dall-e-3", "midjourney"];
      
      for (const model of models) {
        await expect(museNFT.registerAIModel(model))
          .to.emit(museNFT, "AIModelRegistered")
          .withArgs(model, owner.address);
        
        expect(await museNFT.registeredModels(model)).to.be.true;
      }
    });
  });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MuseNFT — Issue #6: IPFS Metadata Security", function () {

  // ── Minting with valid IPFS URI ──────────────────────────────────────────

  describe("mintArtwork — valid IPFS URI", function () {
    it("mints successfully with an ipfs:// tokenURI", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await expect(
        contract.mintArtwork(
          artist.address,
          VALID_TOKEN_URI,
          VALID_IMAGE_CID,
          AI_MODEL,
          ROYALTY_BPS
        )
      ).to.emit(contract, "ArtworkMinted");
    });

    it("assigns the correct tokenURI on-chain", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await contract.mintArtwork(
        artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
      );

      expect(await contract.tokenURI(1)).to.equal(VALID_TOKEN_URI);
    });

    it("stores the artwork image CID", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await contract.mintArtwork(
        artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
      );

      expect(await contract.artworkImageCID(1)).to.equal(VALID_IMAGE_CID);
    });

    it("stores the AI model used", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await contract.mintArtwork(
        artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
      );

      expect(await contract.artworkAIModel(1)).to.equal(AI_MODEL);
    });

    it("stores the artist address", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await contract.mintArtwork(
        artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
      );

      expect(await contract.artworkArtist(1)).to.equal(artist.address);
    });

    it("sets royalty correctly", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await contract.mintArtwork(
        artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
      );

      const [receiver, amount] = await contract.royaltyInfo(1, 10000);
      expect(receiver).to.equal(artist.address);
      expect(amount).to.equal(500); // 5% of 10000
    });

    it("increments totalMinted", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await contract.mintArtwork(
        artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
      );
      await contract.mintArtwork(
        artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
      );

      expect(await contract.totalMinted()).to.equal(2);
    });
  });

  // ── IPFS URI Enforcement (Issue #6 core security) ────────────────────────

  describe("mintArtwork — IPFS URI enforcement", function () {
    it("REVERTS when tokenURI uses http://", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await expect(
        contract.mintArtwork(
          artist.address,
          "http://example.com/metadata.json",
          VALID_IMAGE_CID,
          AI_MODEL,
          ROYALTY_BPS
        )
      ).to.be.revertedWith("MuseNFT: tokenURI must be an IPFS URI (ipfs://...)");
    });

    it("REVERTS when tokenURI uses https://", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await expect(
        contract.mintArtwork(
          artist.address,
          "https://api.example.com/token/1",
          VALID_IMAGE_CID,
          AI_MODEL,
          ROYALTY_BPS
        )
      ).to.be.revertedWith("MuseNFT: tokenURI must be an IPFS URI (ipfs://...)");
    });

    it("REVERTS when tokenURI is an empty string", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await expect(
        contract.mintArtwork(
          artist.address, "", VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
        )
      ).to.be.revertedWith("MuseNFT: tokenURI must be an IPFS URI (ipfs://...)");
    });

    it("REVERTS when imageCID is empty", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await expect(
        contract.mintArtwork(
          artist.address, VALID_TOKEN_URI, "", AI_MODEL, ROYALTY_BPS
        )
      ).to.be.revertedWith("MuseNFT: imageCID cannot be empty");
    });

    it("REVERTS when royalty exceeds 10%", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await expect(
        contract.mintArtwork(
          artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, 1001
        )
      ).to.be.revertedWith("MuseNFT: royalty cannot exceed 10%");
    });
  });

  // ── Gateway URL helper ────────────────────────────────────────────────────

  describe("artworkGatewayURL", function () {
    it("returns the Pinata gateway URL for the image", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await contract.mintArtwork(
        artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
      );

      const url = await contract.artworkGatewayURL(1);
      expect(url).to.equal(
        `https://gateway.pinata.cloud/ipfs/${VALID_IMAGE_CID}`
      );
    });

    it("reverts for a non-existent token", async function () {
      const { contract } = await loadFixture(deployMuseNFTFixture);
      await expect(contract.artworkGatewayURL(999)).to.be.revertedWith(
        "MuseNFT: token does not exist"
      );
    });
  });

  // ── Event emission ────────────────────────────────────────────────────────

  describe("ArtworkMinted event", function () {
    it("emits with correct args", async function () {
      const { contract, artist } = await loadFixture(deployMuseNFTFixture);

      await expect(
        contract.mintArtwork(
          artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL, ROYALTY_BPS
        )
      )
        .to.emit(contract, "ArtworkMinted")
        .withArgs(1, artist.address, VALID_TOKEN_URI, VALID_IMAGE_CID, AI_MODEL);
    });
  });
});