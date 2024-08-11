const redis = require('redis');
const redisData = require('./data.json');

const client = redis.createClient({
    socket: {
        host: "partner-cache",
        port: 6379,
        tls: false,
    }
});
client.on('error', (err) => console.log('Redis Client Error', err));

async function initializeRedisFromJson() {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
        for (const email in redisData) {
            await client.set(email, JSON.stringify(redisData[email]));
        }
    } catch (err) {
        console.log(`Error initializaing redis data: ${err}`);
    }
}

async function getUserDetails(email) {
    try {
        if (!email) {
            throw new Error("Invalid email");
        } 
        if (!client.isOpen) {
            await client.connect();
        }
        return await client.get(email);
    } catch (err) {
        console.log(`Error while fetching the data: ${err}`);
    }
}

module.exports = {
    initializeRedisFromJson,
    getUserDetails,
};


