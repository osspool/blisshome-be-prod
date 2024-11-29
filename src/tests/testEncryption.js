// testEncryption.js

import { encryptTokens, decryptTokens } from "../utils/encryption.js";
import dotenv from "dotenv";

dotenv.config();

// Sample token data
const sampleTokens = {
  access_token: 'eyJpFgl....CA',
  refresh_token: '1260...CA',
  expires_in: 86400,
  scope: 'read identity'
};

// Encrypt the tokens
const encryptedData = encryptTokens(sampleTokens);
console.log("Encrypted Data:", encryptedData);

// Decrypt the tokens
const decryptedData = decryptTokens(encryptedData);
console.log("Decrypted Data:", decryptedData);

// Verify if decrypted data matches the original
console.log("Encryption and Decryption successful:", JSON.stringify(sampleTokens) === JSON.stringify(decryptedData));
