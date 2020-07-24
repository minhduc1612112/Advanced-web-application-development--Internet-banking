const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

// Note: A production application should not expose database credentials in plain text.
// For strategies on handling credentials, visit 12factor: https://12factor.net/config.
const PROD_URI = process.env.DB_URL;
// const MKTG_URI = "mongodb://<dbuser>:<dbpassword>@<host1>:<port1>,<host2>:<port2>/<dbname>?replicaSet=<replicaSetName>"

async function connect(url) {
    return await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then((client) => {
            {
                console.log("Connected successfully to server");
                return client.db();
            }
        })
        .catch((err) => {
            console.log(err);
            process.exit(1);
        });
}

var db = {};

async function initdb() {
    const database = await connect(PROD_URI);
    db = database;
}

exports.initdb = initdb;

module.exports.collection = (COLLECTION) => {
    return {
        detail: async (_id) => {
            const results = await db.collection(COLLECTION).find({
                    _id: ObjectId(_id)
                })
                .toArray();
            if (results.length === 0) {
                return null;
            }
            return results[0];
        },
        all: async () => {
            return await db.collection(COLLECTION).find({})
                .toArray();
        },
        list: async (query) => {
            return db.collection(COLLECTION).find(query).toArray();
        },
        someLatest: async (limit) => {
            return db.collection(COLLECTION).find({
                '_id': -1
            }).limit(limit).toArray();
        },
        get: async (query) => {
            return db.collection(COLLECTION).findOne(query);
        },
        add: async (item) => {
            try {
                await db.collection(COLLECTION).insertOne(item);
                return true;
            } catch (error) {
                console.log("Error in adding item: " + error.message);
                return false;
            }
        },
        addMany: async (items) => {
            try {
                await db.collection(COLLECTION).insertMany(items);
                return true;
            } catch (error) {
                console.log("Error in adding item: " + error.message);
                return false;
            }
        },
        delete: async (query) => {
            try {
                await db.collection(COLLECTION).deleteMany(query);
                return true;
            } catch (error) {
                console.log("Error in deleting item: " + error.message);
                return false;
            }
        },
        update: async (query, value) => {
            try {
                await db.collection(COLLECTION).updateMany(query, value);
                return true;
            } catch (error) {
                console.log("Error in updating item: " + error.message);
                return false;
            }
        }
    }
}