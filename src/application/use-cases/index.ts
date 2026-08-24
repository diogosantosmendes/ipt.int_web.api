import MovieUseCases from './MovieUseCases';
import Repositories from '../ports';

export default interface UseCases {
  movies: MovieUseCases;
}

export function initUseCases(repositories: Repositories): UseCases {
  return {
    movies: new MovieUseCases(repositories),
  };
}