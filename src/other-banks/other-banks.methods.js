const openpgp = require('openpgp');

const key = require('../../variables/keys');
const keyAnotherBank = require('../../variables/another-bank-keys');

exports.encrypted = async (data) => {
    try {
        await openpgp.initWorker();

        const publicKeyArmored = key.pgp.public;

        const {
            data: encrypted
        } = await openpgp.encrypt({
            message: openpgp.message.fromText(data), // input as Message object
            publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for encryption
        });

        openpgp.destroyWorker();

        return encrypted;
    } catch (error) {
        console.log('Error in encrypt data: ' + error.message);
        return null;
    }
}

exports.decrypted = async (encrypted) => {
    try {
        await openpgp.initWorker();

        const privateKeyArmored = key.pgp.private; // encrypted private key
        const passphrase = key.pgp.secretPhrase; // what the private key is encrypted with

        const {
            keys: [privateKey]
        } = await openpgp.key.readArmored(privateKeyArmored);
        await privateKey.decrypt(passphrase);

        const {
            data: decrypted
        } = await openpgp.decrypt({
            message: await openpgp.message.readArmored(encrypted), // parse armored message
            privateKeys: [privateKey], // for decryption
        });

        openpgp.destroyWorker();

        return decrypted
    } catch (error) {
        console.log("Error in decrypt data: " + error.message);
        return null;
    }
}

exports.signed = async (data) => {
    try {
        await openpgp.initWorker();

        const privateKeyArmored = key.pgp.private; // encrypted private key
        const passphrase = key.pgp.secretPhrase; // what the private key is encrypted with

        const {
            keys: [privateKey]
        } = await openpgp.key.readArmored(privateKeyArmored);
        await privateKey.decrypt(passphrase);

        const {
            data: cleartext
        } = await openpgp.sign({
            message: openpgp.cleartext.fromText(data), // CleartextMessage or Message object
            privateKeys: [privateKey] // for signing
        });

        openpgp.destroyWorker();

        return cleartext; // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'

    } catch (error) {
        console.log("Error in sign data: " + error.message);
        return null;
    }
}

exports.verified = async (signedData) => {
    try {
        await openpgp.initWorker();

        const publicKeyArmored = keyAnotherBank.pgp.public;

        const verified = await openpgp.verify({
            message: await openpgp.cleartext.readArmored(signedData), // parse armored message
            publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys // for verification
        });

        const {
            valid
        } = verified.signatures[0];
        if (!valid) {
            console.log('Error in verify data: signature could not be verified');
            return null;
        }

        openpgp.destroyWorker();

        return verified.signatures[0].keyid.toHex();

    } catch (error) {
        console.log('Error in verify data: ' + error.message);
        return null;
    }
}