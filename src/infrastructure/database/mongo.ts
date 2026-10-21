import { MongoClient } from 'mongodb';
import Repositories from '../../application/ports';
import MongoGenericRepository from '../repositories/MongoGenericRepository';

export default async function createMongoRepository(uri: string): Promise<{
    repositories: Repositories;
    close: () => Promise<void>;
}> {
    if (!uri) throw new Error('MONGODB_URI is required');

    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db(process.env.MONGODB_DATABASE || 'generic_api');

    return {
        repositories: { generic: new MongoGenericRepository(database) },
        close: () => client.close(),
    };
}