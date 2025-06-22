const crypto = require('crypto');

const encryptionKey = crypto.randomBytes(32).toString('hex'); // 64 chars
const encryptionSalt = crypto.randomBytes(32).toString('hex');
const searchHashSalt = crypto.randomBytes(32).toString('hex');

console.log('Add these to your .env file:');
console.log('ENCRYPTION_KEY=' + encryptionKey);
console.log('ENCRYPTION_SALT=' + encryptionSalt);
console.log('SEARCH_HASH_SALT=' + searchHashSalt);
