import MovieRepository from './MovieRepository';

export default interface Repositories {
  movies: MovieRepository;
}

export function initRepositories(moviesRepository: MovieRepository): Repositories {
  return {
    movies: moviesRepository,
  };
}