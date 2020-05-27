const MongoClient = require('mongodb').MongoClient

// Note: A production application should not expose database credentials in plain text.
// For strategies on handling credentials, visit 12factor: https://12factor.net/config.
const PROD_URI = process.env.DB_URL;
// const MKTG_URI = "mongodb://<dbuser>:<dbpassword>@<host1>:<port1>,<host2>:<port2>/<dbname>?replicaSet=<replicaSetName>"

let dbs = {
    production: {}
};

async function connect(url) {
    const client = await MongoClient.connect(url, {
        useNewUrlParser: true
    });
    return client.db();
}

exports.initdb = async function () {
    const database = await connect(PROD_URI);
    dbs.production = database;
}

exports.dbs = dbs;