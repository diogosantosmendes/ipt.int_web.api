import { Collection } from 'mongodb';
import { randomUUID } from 'node:crypto';
import Movie, { MovieInput, MovieUpdateInput, MovieProps } from '../../domain/entities/Movie';
import MovieRepository from '../../application/ports/MovieRepository';

export default class MongoMovieRepository implements MovieRepository {
  constructor(private readonly collection: Collection<MovieProps>) {}

  async findAll(): Promise<Movie[]> {
    const documents = await this.collection.find().toArray();
    return documents.map((document) => this.toMovie(document));
  }

  async findById(id: string): Promise<Movie | null> {
    const document = await this.collection.findOne({ id });
    return document ? this.toMovie(document) : null;
  }

  async create(movieData: MovieInput): Promise<Movie> {
    const movie = new Movie({ id: randomUUID(), ...movieData });
    await this.collection.insertOne(movie);
    return movie;
  }

  async update(id: string, movieData: MovieUpdateInput): Promise<Movie | null> {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: movieData },
      { returnDocument: 'after' },
    );

    return result ? this.toMovie(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount === 1;
  }

  private toMovie(document: MovieProps): Movie {
    return new Movie(document);
  }
}