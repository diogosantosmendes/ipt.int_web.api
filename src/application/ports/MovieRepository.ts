import Movie, { MovieInput, MovieUpdateInput } from '../../domain/entities/Movie';

export default interface MovieRepository {
  findAll(): Promise<Movie[]>;
  findById(id: string): Promise<Movie | null>;
  create(movieData: MovieInput): Promise<Movie>;
  update(id: string, movieData: MovieUpdateInput): Promise<Movie | null>;
  delete(id: string): Promise<boolean>;
}