import crypto from 'crypto';

// Define your encryption key and algorithm
const algorithm = 'aes-256-cbc'; // Encryption algorithm
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Fixed encryption key from environment variable
const ivLength = 16; // AES block size (128-bit)

// Encrypt function
export const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`; // Store as a single string
};


// Decrypt function
export const decrypt = (encryptedText) => {
    const [ivHex, encryptedData] = encryptedText.split(':');

    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
        Buffer.from(ivHex, 'hex')
    );

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};

