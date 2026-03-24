const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {
  deployMuseNFT,
  deployProjectManager,
  registerTestModels,
  createTestArtwork,
  createTestProject,
  createTestIssue
} = require("../helpers/contracts");
const { generateRandomHash, toEther, expectRevert } = require("../helpers/utils");

describe("Marketplace Integration Tests", function () {
  let museNFT;
  let projectManager;
  let owner, creator, collector, maintainer, aiModelRegistrar;
  let tokenId, projectId, issueId;

  beforeEach(async function () {
    [owner, creator, collector, maintainer, aiModelRegistrar] = await ethers.getSigners();
    
    // Deploy contracts
    museNFT = await deployMuseNFT();
    projectManager = await deployProjectManager();
    
    // Register AI models
    await registerTestModels(museNFT, [aiModelRegistrar]);
  });

  describe("Artwork Creation and Project Management Flow", function () {
    it("Should create artwork and manage related projects", async function () {
      // Step 1: Create a project for the artwork
      projectId = await createTestProject(projectManager, maintainer, {
        name: "AI Art Collection",
        description: "A collection of AI-generated artworks",
        repositoryUrl: "https://github.com/ai-art/collection"
      });

      // Step 2: Create an issue in the project
      issueId = await createTestIssue(projectManager, creator, projectId, {
        title: "Create landscape artwork",
        description: "Generate a beautiful landscape using AI",
        bounty: toEther(0.5)
      });

      // Step 3: Create collaborative artwork
      const tx = await createTestArtwork(museNFT, creator, {
        aiModel: "stable-diffusion",
        humanContribution: 60,
        aiContribution: 40,
        prompt: "Beautiful landscape with mountains and lake",
        tokenURI: "https://api.example.com/metadata/1",
        contentHash: generateRandomHash()
      });

      const receipt = await tx.wait();
      tokenId = receipt.logs[0].args[0];

      // Verify all components are linked correctly
      const artwork = await museNFT.getCollaboration(tokenId);
      expect(artwork.humanCreator).to.equal(creator.address);
      expect(artwork.aiModel).to.equal("stable-diffusion");

      const project = await projectManager.getProject(projectId);
      expect(project.maintainer).to.equal(maintainer.address);

      const issue = await projectManager.getIssue(issueId);
      expect(issue.creator).to.equal(creator.address);
      expect(issue.bounty).to.equal(toEther(0.5));
    });

    it("Should handle artwork evolution with project tracking", async function () {
      // Create initial artwork
      const tx = await createTestArtwork(museNFT, creator, {
        prompt: "Original artwork",
        canEvolve: true
      });

      const receipt = await tx.wait();
      tokenId = receipt.logs[0].args[0];

      // Create project to track evolution
      projectId = await createTestProject(projectManager, maintainer, {
        name: "Artwork Evolution Project",
        description: "Tracking artwork evolution process"
      });

      // Wait for evolution interval
      await time.increase(86400); // 1 day

      // Evolve artwork
      const evolutionTx = await museNFT.connect(collector).evolveArtwork(
        tokenId,
        "Evolved artwork with new style",
        "https://api.example.com/metadata/1-evolved",
        generateRandomHash(),
        { value: await museNFT.evolutionFee() }
      );

      const evolutionReceipt = await evolutionTx.wait();
      
      // Verify evolution was recorded
      const evolutionHistory = await museNFT.getEvolutionHistory(tokenId);
      expect(evolutionHistory.length).to.equal(1);
      expect(evolutionHistory[0].evolver).to.equal(collector.address);

      // Create issue for evolution tracking
      issueId = await createTestIssue(projectManager, maintainer, projectId, {
        title: "Track artwork evolution",
        description: `Evolution ${tokenId} completed successfully`,
        bounty: toEther(0.1)
      });

      // Update issue status to completed
      await projectManager.connect(maintainer).updateIssueStatus(issueId, 2); // Completed

      const updatedIssue = await projectManager.getIssue(issueId);
      expect(updatedIssue.status).to.equal(2); // Completed
    });
  });

  describe("Multi-User Collaboration Flow", function () {
    it("Should handle multiple creators and maintainers", async function () {
      // Create projects by different maintainers
      const project1 = await createTestProject(projectManager, maintainer, {
        name: "Digital Art Project"
      });

      const project2 = await createTestProject(projectManager, owner, {
        name: "AI Research Project"
      });

      // Create artworks by different creators
      const artwork1Tx = await createTestArtwork(museNFT, creator, {
        prompt: "Creator 1 artwork",
        humanContribution: 80,
        aiContribution: 20
      });

      const artwork2Tx = await createTestArtwork(museNFT, collector, {
        prompt: "Collector artwork",
        humanContribution: 50,
        aiContribution: 50
      });

      const receipt1 = await artwork1Tx.wait();
      const receipt2 = await artwork2Tx.wait();

      const tokenId1 = receipt1.logs[0].args[0];
      const tokenId2 = receipt2.logs[0].args[0];

      // Verify ownership and creator relationships
      expect(await museNFT.ownerOf(tokenId1)).to.equal(creator.address);
      expect(await museNFT.ownerOf(tokenId2)).to.equal(collector.address);

      // Create issues in different projects
      await createTestIssue(projectManager, creator, project1, {
        title: "Review artwork 1",
        bounty: toEther(0.2)
      });

      await createTestIssue(projectManager, collector, project2, {
        title: "Review artwork 2", 
        bounty: toEther(0.3)
      });

      // Verify project assignments
      const maintainerProjects = await projectManager.getMaintainerProjects(maintainer.address);
      expect(maintainerProjects.length).to.equal(1);
      expect(maintainerProjects[0]).to.equal(project1);

      const ownerProjects = await projectManager.getMaintainerProjects(owner.address);
      expect(ownerProjects.length).to.equal(1);
      expect(ownerProjects[0]).to.equal(project2);
    });
  });

  describe("Royalty and Fee Integration", function () {
    it("Should handle royalties and evolution fees correctly", async function () {
      // Create artwork
      const tx = await createTestArtwork(museNFT, creator, {
        prompt: "Premium artwork",
        canEvolve: true
      });

      const receipt = await tx.wait();
      tokenId = receipt.logs[0].args[0];

      // Set royalty
      await museNFT.connect(creator).setRoyalty(tokenId, 500); // 5%

      // Verify royalty calculation
      const salePrice = toEther(1);
      const [royaltyRecipient, royaltyAmount] = await museNFT.royaltyInfo(tokenId, salePrice);
      
      expect(royaltyRecipient).to.equal(creator.address);
      expect(royaltyAmount).to.equal(toEther(0.05)); // 5% of 1 ETH

      // Track evolution fee collection
      const evolutionTreasury = await museNFT.evolutionTreasury();
      const initialBalance = await ethers.provider.getBalance(evolutionTreasury);

      await time.increase(86400); // 1 day

      // Evolve artwork and pay fee
      const evolutionFee = await museNFT.evolutionFee();
      await museNFT.connect(collector).evolveArtwork(
        tokenId,
        "Evolved premium artwork",
        "https://api.example.com/metadata/evolved",
        generateRandomHash(),
        { value: evolutionFee }
      );

      const finalBalance = await ethers.provider.getBalance(evolutionTreasury);
      expect(finalBalance - initialBalance).to.equal(evolutionFee);
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("Should handle invalid operations gracefully", async function () {
      // Try to create artwork with unregistered model
      await expectRevert(
        createTestArtwork(museNFT, creator, {
          aiModel: "unregistered-model"
        }),
        "AI model not registered"
      );

      // Try to create artwork with invalid contribution percentages
      await expectRevert(
        createTestArtwork(museNFT, creator, {
          humanContribution: 60,
          aiContribution: 60 // Sum > 100
        }),
        "Contributions must sum to 100"
      );

      // Create valid artwork
      const tx = await createTestArtwork(museNFT, creator);
      const receipt = await tx.wait();
      tokenId = receipt.logs[0].args[0];

      // Try to evolve before interval
      await expectRevert(
        museNFT.connect(collector).evolveArtwork(
          tokenId,
          "Early evolution",
          "https://api.example.com/metadata/early",
          generateRandomHash(),
          { value: await museNFT.evolutionFee() }
        ),
        "Evolution interval not met"
      );

      // Try to access non-existent token
      await expectRevert(
        museNFT.getCollaboration(999),
        "Token does not exist"
      );
    });
  });
});
