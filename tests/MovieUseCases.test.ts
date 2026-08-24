import InMemoryMovieRepository from '../src/infrastructure/repositories/InMemoryMovieRepository';
import { initRepositories } from '../src/application/ports';
import MovieUseCases from '../src/application/use-cases/MovieUseCases';

describe('MovieUseCases', () => {
  const createUseCases = (): MovieUseCases => {
    const repository = new InMemoryMovieRepository();
    return new MovieUseCases(initRepositories(repository));
  };

  it('creates and lists movies', async () => {
    const useCases = createUseCases();

    const createdMovie = await useCases.createMovie({
      title: 'The Matrix',
      director: 'The Wachowskis',
      year: 1999,
      genre: 'Science fiction',
    });

    await expect(useCases.listMovies()).resolves.toEqual([createdMovie]);
  });

  it('gets a movie by id and returns null when it does not exist', async () => {
    const useCases = createUseCases();
    const createdMovie = await useCases.createMovie({
      title: 'The Matrix',
      director: null,
      year: null,
      genre: null,
    });

    await expect(useCases.getMovie(createdMovie.id)).resolves.toEqual(createdMovie);
    await expect(useCases.getMovie('missing-id')).resolves.toBeNull();
  });

  it('updates an existing movie and returns null for an unknown id', async () => {
    const useCases = createUseCases();
    const createdMovie = await useCases.createMovie({
      title: 'The Matrix',
      director: null,
      year: 1999,
      genre: null,
    });

    const updatedMovie = await useCases.updateMovie(createdMovie.id, {
      title: 'The Matrix Reloaded',
    });

    expect(updatedMovie).toMatchObject({
      id: createdMovie.id,
      title: 'The Matrix Reloaded',
      year: 1999,
    });
    await expect(useCases.updateMovie('missing-id', { title: 'Unknown' })).resolves.toBeNull();
  });

  it('deletes an existing movie and returns false for an unknown id', async () => {
    const useCases = createUseCases();
    const createdMovie = await useCases.createMovie({
      title: 'The Matrix',
      director: null,
      year: null,
      genre: null,
    });

    await expect(useCases.deleteMovie(createdMovie.id)).resolves.toBe(true);
    await expect(useCases.getMovie(createdMovie.id)).resolves.toBeNull();
    await expect(useCases.deleteMovie('missing-id')).resolves.toBe(false);
  });
});