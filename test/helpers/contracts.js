const { ethers } = require("hardhat");

/**
 * Helper utilities for smart contract testing
 */

// Deploy MuseNFT contract with default configuration
async function deployMuseNFT() {
  const MuseNFT = await ethers.getContractFactory("MuseNFT");
  const museNFT = await MuseNFT.deploy();
  await museNFT.waitForDeployment();
  return museNFT;
}

// Deploy ProjectManager contract
async function deployProjectManager() {
  const ProjectManager = await ethers.getContractFactory("ProjectManager");
  const projectManager = await ProjectManager.deploy();
  await projectManager.waitForDeployment();
  return projectManager;
}

// Register multiple AI models for testing
async function registerTestModels(contract, signers) {
  const models = [
    "stable-diffusion",
    "dall-e-3", 
    "midjourney",
    "gpt-4"
  ];
  
  for (let i = 0; i < models.length && i < signers.length; i++) {
    await contract.connect(signers[i]).registerAIModel(models[i]);
  }
  
  return models;
}

// Create test collaborative artwork
async function createTestArtwork(contract, signer, options = {}) {
  const defaults = {
    aiModel: "stable-diffusion",
    humanContribution: 70,
    aiContribution: 30,
    prompt: "A beautiful digital artwork",
    tokenURI: "https://example.com/token/1",
    contentHash: ethers.keccak256(ethers.toUtf8Bytes("test content")),
    canEvolve: true,
    value: 0
  };
  
  const params = { ...defaults, ...options };
  
  return await contract.connect(signer).createCollaborativeArtwork(
    params.aiModel,
    params.humanContribution,
    params.aiContribution,
    params.prompt,
    params.tokenURI,
    params.contentHash,
    params.canEvolve,
    { value: params.value }
  );
}

// Create test project
async function createTestProject(contract, signer, options = {}) {
  const defaults = {
    name: "Test Project",
    description: "A test project for testing",
    repositoryUrl: "https://github.com/test/project"
  };
  
  const params = { ...defaults, ...options };
  
  return await contract.connect(signer).createProject(
    params.name,
    params.description,
    params.repositoryUrl
  );
}

// Create test issue
async function createTestIssue(contract, signer, projectId, options = {}) {
  const defaults = {
    title: "Test Issue",
    description: "A test issue for testing",
    bounty: ethers.parseEther("0.1")
  };
  
  const params = { ...defaults, ...options };
  
  return await contract.connect(signer).createIssue(
    projectId,
    params.title,
    params.description,
    params.bounty
  );
}

// Get current timestamp and add specified seconds
async function getFutureTime(seconds) {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp + seconds;
}

// Mine blocks to advance time
async function mineBlocks(count) {
  for (let i = 0; i < count; i++) {
    await ethers.provider.send("evm_mine", []);
  }
}

// Calculate gas cost
function calculateGasCost(gasUsed, gasPrice) {
  return ethers.formatEther(BigInt(gasUsed) * BigInt(gasPrice));
}

module.exports = {
  deployMuseNFT,
  deployProjectManager,
  registerTestModels,
  createTestArtwork,
  createTestProject,
  createTestIssue,
  getFutureTime,
  mineBlocks,
  calculateGasCost
};
