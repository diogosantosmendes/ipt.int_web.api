import Repositories from "../../application/ports";
import InMemoryGenericRepository from '../repositories/InMemoryGenericRepository';

export default async function createInMemoryRepository(): Promise<{
    repositories: Repositories;
    close: () => Promise<void>;
}> {
    return {
        repositories: { generic: new InMemoryGenericRepository() },
        close: async () => { }
    }
}