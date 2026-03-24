const { ethers } = require("hardhat");

/**
 * General utility functions for testing
 */

// Generate random bytes32 hash
function generateRandomHash() {
  return ethers.keccak256(ethers.toUtf8Bytes(Math.random().toString()));
}

// Generate random string
function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Format ether to wei
function toEther(amount) {
  return ethers.parseEther(amount.toString());
}

// Format wei to ether
function fromEther(amount) {
  return ethers.formatEther(amount);
}

// Expect revert with specific message
async function expectRevert(promise, expectedError) {
  try {
    await promise;
    throw new Error("Expected transaction to revert");
  } catch (error) {
    if (error.message.includes("Expected transaction to revert")) {
      throw error;
    }
    if (!error.message.includes(expectedError)) {
      throw new Error(`Expected error "${expectedError}" but got "${error.message}"`);
    }
  }
}

// Check if two addresses are equal
function addressesEqual(addr1, addr2) {
  return addr1.toLowerCase() === addr2.toLowerCase();
}

// Get event from transaction receipt
function getEvent(receipt, eventName) {
  return receipt.logs.find(log => 
    log.fragment && log.fragment.name === eventName
  );
}

// Get all events of a specific type from transaction receipt
function getEvents(receipt, eventName) {
  return receipt.logs.filter(log => 
    log.fragment && log.fragment.name === eventName
  );
}

// Validate token URI format
function isValidTokenURI(uri) {
  try {
    new URL(uri);
    return uri.startsWith("https://") || uri.startsWith("ipfs://");
  } catch {
    return false;
  }
}

// Mock IPFS URI generator
function generateMockIPFSUri(content) {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(content));
  return `ipfs://Qm${hash.slice(2)}`;
}

// Generate test metadata
function generateTestMetadata(overrides = {}) {
  const defaults = {
    name: "Test Artwork",
    description: "A test artwork for testing purposes",
    image: "https://example.com/image.png",
    attributes: [
      {
        trait_type: "AI Model",
        value: "stable-diffusion"
      },
      {
        trait_type: "Human Contribution",
        value: 70
      }
    ]
  };
  
  return { ...defaults, ...overrides };
}

// Deep compare two objects
function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

module.exports = {
  generateRandomHash,
  generateRandomString,
  toEther,
  fromEther,
  expectRevert,
  addressesEqual,
  getEvent,
  getEvents,
  isValidTokenURI,
  generateMockIPFSUri,
  generateTestMetadata,
  deepEqual
};
