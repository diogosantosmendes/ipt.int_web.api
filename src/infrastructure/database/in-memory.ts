import Repositories from "../../application/ports";
import InMemoryMovieRepository from "../repositories/InMemoryMovieRepository";

export default async function createInMemoryRepository(): Promise<{
    repositories: Repositories;
    close: () => Promise<void>;
}> {
    return {
        repositories: { movies: new InMemoryMovieRepository() },
        close: async () => { }
    }
}