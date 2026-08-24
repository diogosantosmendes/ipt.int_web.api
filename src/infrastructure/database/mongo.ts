import { MongoClient } from 'mongodb';
import Repositories from '../../application/ports';
import MongoMovieRepository from '../repositories/MongoMovieRepository';

export default async function createMongoRepository(uri: string): Promise<{
    repositories: Repositories;
    close: () => Promise<void>;
}> {
    if (!uri) throw new Error('MONGODB_URI is required');

    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db(process.env.MONGODB_DATABASE || 'movies_api');

    return {
        repositories: {
            movies: new MongoMovieRepository(database.collection('movies'))
        },
        close: () => client.close(),
    };
}