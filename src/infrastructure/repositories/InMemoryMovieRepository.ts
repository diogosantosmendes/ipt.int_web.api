import { randomUUID } from 'node:crypto';
import Movie, { MovieInput, MovieUpdateInput } from '../../domain/entities/Movie';
import MovieRepository from '../../application/ports/MovieRepository';

export default class InMemoryMovieRepository implements MovieRepository {
  private movies: Movie[] = [];

  findAll(): Promise<Movie[]> {
    return Promise.resolve(this.movies);
  }

  findById(id: string): Promise<Movie | null> {
    return Promise.resolve(this.movies.find((movie) => movie.id === id) || null);
  }

  create(movieData: MovieInput): Promise<Movie> {
    const movie = new Movie({ id: randomUUID(), ...movieData });
    this.movies.push(movie);
    return Promise.resolve(movie);
  }

  async update(id: string, movieData: MovieUpdateInput): Promise<Movie | null> {
    const index = this.movies.findIndex((movie) => movie.id === id);
    if (index === -1) return null;

    const movie = new Movie({ ...this.movies[index], ...movieData, id });
    this.movies[index] = movie;
    return movie;
  }

  delete(id: string): Promise<boolean> {
    const index = this.movies.findIndex((movie) => movie.id === id);
    if (index === -1) return Promise.resolve(false);

    this.movies.splice(index, 1);
    return Promise.resolve(true);
  }
}