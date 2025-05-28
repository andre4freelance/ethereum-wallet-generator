const ethers = require("ethers");

// Example: Create a random wallet (for learning)
const wallet = ethers.Wallet.createRandom();

console.log("Address:", wallet.address);
console.log("Private Key (Keep Safe!):", wallet.privateKey);
console.log("Mnemonic Phrase (Keep Safe!):", wallet.mnemonic.phrase);