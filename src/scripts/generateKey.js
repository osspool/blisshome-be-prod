import crypto from 'crypto';

// Generate a 32-byte (256-bit) random key
const key = crypto.randomBytes(32).toString('hex');

console.log(`Generated ENCRYPTION_KEY: ${key}`);

// openssl rand -hex 32