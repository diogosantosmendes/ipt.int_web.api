const fs = require('node:fs/promises');
const path = require('node:path');
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function loadSeedFiles(seedDirectory) {
    const entries = await fs.readdir(seedDirectory, { withFileTypes: true });
    const jsonFiles = entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
        .sort((left, right) => {
            const priority = (name) => name === 'station.json' ? 0 : name === 'charge.json' ? 1 : 2;
            return priority(left.name) - priority(right.name) || left.name.localeCompare(right.name);
        });

    if (jsonFiles.length === 0) {
        throw new Error(`No JSON seed files found in ${seedDirectory}`);
    }

    return Promise.all(jsonFiles.map(async (file) => {
        const filePath = path.join(seedDirectory, file.name);
        const documents = JSON.parse(await fs.readFile(filePath, 'utf8'));
        if (!Array.isArray(documents) || documents.some((document) => (
            typeof document !== 'object' || document === null || Array.isArray(document)
        ))) {
            throw new Error(`${file.name} must contain a JSON array of objects`);
        }

        return {
            collectionName: "classes_" + path.basename(file.name, path.extname(file.name)),
            documents,
        };
    }));
}

(async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is required');

    const seedFiles = await loadSeedFiles(__dirname);
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db(process.env.MONGODB_DATABASE || 'generic_api');

        for (const { collectionName, documents } of seedFiles) {
            const collection = database.collection(collectionName);
            let documentsToInsert = documents;

            if (collectionName === 'charge') {
                const stations = await database.collection('station').find({}, {
                    projection: { _id: 1, pricePerKWh: 1 },
                }).toArray();
                if (stations.length === 0) {
                    throw new Error('Cannot seed charges: the station collection is empty');
                }
                documentsToInsert = documents.map((charge) => {
                    const timestamp = new Date(charge.timestamp);
                    if (Number.isNaN(timestamp.getTime())) {
                        throw new Error(`Invalid charge timestamp: ${charge.timestamp}`);
                    }
                    const station = stations[Math.floor(Math.random() * stations.length)];
                    if (typeof station.pricePerKWh !== 'number') {
                        throw new Error(`Station ${station._id} is missing a numeric pricePerKWh`);
                    }

                    return {
                        ...charge,
                        timestamp,
                        cost: Math.round(charge.kWh * station.pricePerKWh * 100) / 100,
                        stationId: station._id,
                    };
                });
            }

            await collection.deleteMany({});
            if (documentsToInsert.length > 0) {
                await collection.insertMany(documentsToInsert);
            }
            console.log(`Seeded ${collectionName}: ${documentsToInsert.length} documents`);
        }
    } finally {
        await client.close();
    }
})().catch((error) => {
    console.error('Failed to seed MongoDB:', error instanceof Error ? error.message : error);
    process.exit(1);
});
