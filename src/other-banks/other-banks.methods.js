const openpgp = require('openpgp');

const key = require('../../variables/keys');

exports.encrypted = async (data) => {
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
}

exports.decrypted = async (encrypted) => {
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
}