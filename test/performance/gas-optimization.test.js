const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMuseNFT, deployProjectManager, registerTestModels, createTestArtwork } = require("../helpers/contracts");
const { generateRandomHash } = require("../helpers/utils");

describe("Gas Optimization Tests", function () {
  let museNFT;
  let projectManager;
  let owner, creator, collector;
  let gasReports = {};

  beforeEach(async function () {
    [owner, creator, collector] = await ethers.getSigners();
    
    museNFT = await deployMuseNFT();
    projectManager = await deployProjectManager();
    
    await registerTestModels(museNFT, [owner]);
  });

  describe("MuseNFT Gas Usage", function () {
    it("Should report gas costs for artwork creation", async function () {
      const tx = await createTestArtwork(museNFT, creator);
      const receipt = await tx.wait();
      
      gasReports.artworkCreation = receipt.gasUsed.toString();
      console.log(`Artwork Creation Gas: ${gasReports.artworkCreation}`);
      
      // Gas should be reasonable (< 200k gas)
      expect(receipt.gasUsed).to.be.lessThan(200000);
    });

    it("Should report gas costs for artwork evolution", async function () {
      // Create artwork first
      const createTx = await createTestArtwork(museNFT, creator, { canEvolve: true });
      const createReceipt = await createTx.wait();
      const tokenId = createReceipt.logs[0].args[0];

      // Wait for evolution interval
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      // Evolve artwork
      const evolutionTx = await museNFT.connect(collector).evolveArtwork(
        tokenId,
        "Evolved artwork",
        "https://api.example.com/metadata/evolved",
        generateRandomHash(),
        { value: await museNFT.evolutionFee() }
      );
      
      const evolutionReceipt = await evolutionTx.wait();
      gasReports.artworkEvolution = evolutionReceipt.gasUsed.toString();
      console.log(`Artwork Evolution Gas: ${gasReports.artworkEvolution}`);
      
      // Gas should be reasonable (< 150k gas)
      expect(evolutionReceipt.gasUsed).to.be.lessThan(150000);
    });

    it("Should report gas costs for AI model registration", async function () {
      const tx = await museNFT.connect(creator).registerAIModel("test-model");
      const receipt = await tx.wait();
      
      gasReports.modelRegistration = receipt.gasUsed.toString();
      console.log(`AI Model Registration Gas: ${gasReports.modelRegistration}`);
      
      // Should be very cheap (< 50k gas)
      expect(receipt.gasUsed).to.be.lessThan(50000);
    });

    it("Should report gas costs for royalty setting", async function () {
      // Create artwork first
      const createTx = await createTestArtwork(museNFT, creator);
      const createReceipt = await createTx.wait();
      const tokenId = createReceipt.logs[0].args[0];

      // Set royalty
      const tx = await museNFT.connect(creator).setRoyalty(tokenId, 500);
      const receipt = await tx.wait();
      
      gasReports.royaltySetting = receipt.gasUsed.toString();
      console.log(`Royalty Setting Gas: ${gasReports.royaltySetting}`);
      
      // Should be cheap (< 30k gas)
      expect(receipt.gasUsed).to.be.lessThan(30000);
    });

    it("Should report gas costs for view functions", async function () {
      // Create artwork first
      const createTx = await createTestArtwork(museNFT, creator);
      const createReceipt = await createTx.wait();
      const tokenId = createReceipt.logs[0].args[0];

      // Test view function gas costs
      const collaborationTx = await museNFT.getCollaboration.call(tokenId);
      const collaborationGas = await ethers.provider.estimateGas({
        to: await museNFT.getAddress(),
        data: museNFT.interface.encodeFunctionData("getCollaboration", [tokenId])
      });
      
      gasReports.getCollaboration = collaborationGas.toString();
      console.log(`getCollaboration Gas: ${gasReports.getCollaboration}`);
      
      // View functions should be very cheap (< 10k gas)
      expect(collaborationGas).to.be.lessThan(10000);
    });
  });

  describe("ProjectManager Gas Usage", function () {
    it("Should report gas costs for project creation", async function () {
      const tx = await projectManager.connect(creator).createProject(
        "Test Project",
        "A test project for gas testing",
        "https://github.com/test/project"
      );
      const receipt = await tx.wait();
      
      gasReports.projectCreation = receipt.gasUsed.toString();
      console.log(`Project Creation Gas: ${gasReports.projectCreation}`);
      
      // Should be reasonable (< 100k gas)
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });

    it("Should report gas costs for issue creation", async function () {
      // Create project first
      const projectTx = await projectManager.connect(creator).createProject(
        "Test Project",
        "A test project for gas testing",
        "https://github.com/test/project"
      );
      const projectReceipt = await projectTx.wait();
      const projectId = projectReceipt.logs[0].args[0];

      // Create issue
      const issueTx = await projectManager.connect(creator).createIssue(
        projectId,
        "Test Issue",
        "A test issue for gas testing",
        ethers.parseEther("0.1")
      );
      const issueReceipt = await issueTx.wait();
      
      gasReports.issueCreation = issueReceipt.gasUsed.toString();
      console.log(`Issue Creation Gas: ${gasReports.issueCreation}`);
      
      // Should be reasonable (< 80k gas)
      expect(issueReceipt.gasUsed).to.be.lessThan(80000);
    });

    it("Should report gas costs for issue status updates", async function () {
      // Create project and issue first
      const projectTx = await projectManager.connect(creator).createProject(
        "Test Project",
        "A test project for gas testing",
        "https://github.com/test/project"
      );
      const projectReceipt = await projectTx.wait();
      const projectId = projectReceipt.logs[0].args[0];

      const issueTx = await projectManager.connect(creator).createIssue(
        projectId,
        "Test Issue",
        "A test issue for gas testing",
        ethers.parseEther("0.1")
      );
      const issueReceipt = await issueTx.wait();
      const issueId = issueReceipt.logs[0].args[0];

      // Update issue status
      const updateTx = await projectManager.connect(creator).updateIssueStatus(
        issueId,
        1 // InProgress
      );
      const updateReceipt = await updateTx.wait();
      
      gasReports.issueStatusUpdate = updateReceipt.gasUsed.toString();
      console.log(`Issue Status Update Gas: ${gasReports.issueStatusUpdate}`);
      
      // Should be cheap (< 40k gas)
      expect(updateReceipt.gasUsed).to.be.lessThan(40000);
    });
  });

  describe("Batch Operations Gas Analysis", function () {
    it("Should analyze gas costs for multiple artwork creations", async function () {
      const gasCosts = [];
      const numArtworks = 5;

      for (let i = 0; i < numArtworks; i++) {
        const tx = await createTestArtwork(museNFT, creator, {
          prompt: `Artwork ${i}`,
          tokenURI: `https://api.example.com/metadata/${i}`
        });
        const receipt = await tx.wait();
        gasCosts.push(receipt.gasUsed.toNumber());
      }

      const averageGas = gasCosts.reduce((sum, cost) => sum + cost, 0) / gasCosts.length;
      const maxGas = Math.max(...gasCosts);
      const minGas = Math.min(...gasCosts);

      console.log(`Batch Artwork Creation - Average: ${averageGas}, Max: ${maxGas}, Min: ${minGas}`);

      // Gas costs should be consistent (variance < 10%)
      const variance = (maxGas - minGas) / averageGas;
      expect(variance).to.be.lessThan(0.1); // Less than 10% variance
    });

    it("Should analyze gas costs for multiple evolutions", async function () {
      // Create multiple artworks
      const tokenIds = [];
      for (let i = 0; i < 3; i++) {
        const tx = await createTestArtwork(museNFT, creator, {
          prompt: `Artwork ${i}`,
          canEvolve: true,
          tokenURI: `https://api.example.com/metadata/${i}`
        });
        const receipt = await tx.wait();
        tokenIds.push(receipt.logs[0].args[0]);
      }

      // Wait for evolution interval
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");

      const gasCosts = [];
      for (const tokenId of tokenIds) {
        const tx = await museNFT.connect(collector).evolveArtwork(
          tokenId,
          `Evolved artwork ${tokenId}`,
          `https://api.example.com/metadata/${tokenId}-evolved`,
          generateRandomHash(),
          { value: await museNFT.evolutionFee() }
        );
        const receipt = await tx.wait();
        gasCosts.push(receipt.gasUsed.toNumber());
      }

      const averageGas = gasCosts.reduce((sum, cost) => sum + cost, 0) / gasCosts.length;
      console.log(`Batch Evolution Average Gas: ${averageGas}`);

      // Evolution should remain efficient even with history
      expect(averageGas).to.be.lessThan(160000);
    });
  });

  describe("Gas Optimization Recommendations", function () {
    it("Should provide gas optimization report", function () {
      console.log("\n=== GAS OPTIMIZATION REPORT ===");
      console.log("Artwork Creation:", gasReports.artworkCreation || "N/A");
      console.log("Artwork Evolution:", gasReports.artworkEvolution || "N/A");
      console.log("Model Registration:", gasReports.modelRegistration || "N/A");
      console.log("Royalty Setting:", gasReports.royaltySetting || "N/A");
      console.log("getCollaboration:", gasReports.getCollaboration || "N/A");
      console.log("Project Creation:", gasReports.projectCreation || "N/A");
      console.log("Issue Creation:", gasReports.issueCreation || "N/A");
      console.log("Issue Status Update:", gasReports.issueStatusUpdate || "N/A");
      console.log("================================\n");

      // Basic optimization checks
      if (gasReports.artworkCreation > 150000) {
        console.warn("⚠️  Artwork creation gas usage is high (>150k)");
      }
      if (gasReports.artworkEvolution > 120000) {
        console.warn("⚠️  Artwork evolution gas usage is high (>120k)");
      }
      if (gasReports.getCollaboration > 8000) {
        console.warn("⚠️  getCollaboration view function is expensive (>8k)");
      }
    });
  });
});
