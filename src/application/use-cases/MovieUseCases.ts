import Movie, { MovieInput, MovieUpdateInput } from '../../domain/entities/Movie';
import Repositories from '../ports';

export default class MovieUseCases {
  constructor(private readonly repositories: Repositories) {}

  listMovies(): Promise<Movie[]> {
    return this.repositories.movies.findAll();
  }

  getMovie(id: string): Promise<Movie | null> {
    return this.repositories.movies.findById(id);
  }

  createMovie(movieData: MovieInput): Promise<Movie> {
    return this.repositories.movies.create(movieData);
  }

  updateMovie(id: string, movieData: MovieUpdateInput): Promise<Movie | null> {
    return this.repositories.movies.update(id, movieData);
  }

  deleteMovie(id: string): Promise<boolean> {
    return this.repositories.movies.delete(id);
  }
}