const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');

function generateSecretKey(length) {
    return crypto.randomBytes(length).toString('hex');
}

function storeSecretKeyToFile(secretKey) {
    const envFilePath = '.env';
    const keyValuePair = `JWT_SECRET=${secretKey}\n`;

    fs.writeFileSync(envFilePath, keyValuePair);
    console.log('Secret key has been stored in .env file.');
}

dotenv.config();

const existingSecretKey = process.env.JWT_SECRET;
if (!existingSecretKey) {
    const secretKey = generateSecretKey(32); // Generate a 32-character (256-bit) secret key
    storeSecretKeyToFile(secretKey);
} else {
    console.log('Existing JWT_SECRET found in .env file. Using it.');
}
