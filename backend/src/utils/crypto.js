import crypto from 'crypto';

// Define your encryption key and algorithm
const algorithm = 'aes-256-cbc'; // Encryption algorithm
const key = crypto.randomBytes(32); // Generate a random key (32 bytes for AES-256)
const iv = crypto.randomBytes(16); // Initialization vector (16 bytes)

// Encrypt function
export const encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'), // Store the IV with the encrypted data
        encryptedData: encrypted
    };
};

// Decrypt function
export const decrypt = (encryptedData, iv) => {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};