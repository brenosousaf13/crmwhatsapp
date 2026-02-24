import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

const getEncryptionKey = (): Buffer => {
    const keyString = process.env.WHATSAPP_ENCRYPTION_KEY
    if (!keyString) {
        throw new Error('WHATSAPP_ENCRYPTION_KEY is not set in environment variables')
    }

    // Key must be 32 bytes for aes-256-gcm
    // Since we generate a 64-character hex string (32 bytes), we convert it to a Buffer
    const key = Buffer.from(keyString, 'hex')
    if (key.length !== 32) {
        throw new Error('WHATSAPP_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)')
    }

    return key
}

export function encrypt(text: string): string {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: iv:authTag:encryptedText
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData: string): string {
    const key = getEncryptionKey()

    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
    }

    const [ivHex, authTagHex, encryptedText] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}
