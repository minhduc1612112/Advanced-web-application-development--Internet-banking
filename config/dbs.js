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

module.exports = {
    initdb: initdb,
    detail: async (COLLECTION, id) => {
        const results = await db.collection(COLLECTION).find({
                _id: ObjectId(id)
            })
            .toArray();
        if (results.length === 0) {
            return null;
        }
        return results[0];
    },
    all: async (COLLECTION) => {
        return await db.collection(COLLECTION).find({})
            .toArray();
    },
    list: async (COLLECTION, condition) => {
        return db.collection(COLLECTION).find(condition).toArray();
    },
    get: async (COLLECTION, condition) => {
        return db.collection(COLLECTION).findOne(condition);
    },
    add: async (COLLECTION, item) => {
        try {
            await db.collection(COLLECTION).insertOne(item);
            return true;
        } catch (error) {
            console.log("Error in adding item: " + error.message);
            return false;
        }
    },
    delete: async (COLLECTION, id) => {
        try {
            await db.collection(COLLECTION).deleteOne({
                _id: ObjectId(id)
            });
            return true;
        } catch (error) {
            console.log("Error in deleting item: " + error.message);
            return false;
        }
    },
    update: async (COLLECTION, id, item) => {
        try {
            await db.collection(COLLECTION).updateOne({
                _id: ObjectId(id)
            }, {
                $set: item
            });
            return true;
        } catch (error) {
            console.log("Error in updating item: " + error.message);
            return false;
        }
    }
}