import Movie from '../src/domain/entities/Movie';

describe('Movie', () => {
  it('creates a movie with optional fields set to null', () => {
    const movie = new Movie({
      id: 'movie-1',
      title: 'The Matrix',
      director: null,
      year: null,
      genre: null,
    });

    expect(movie).toEqual({
      id: 'movie-1',
      title: 'The Matrix',
      director: null,
      year: null,
      genre: null,
    });
  });

  it('rejects a movie without a title', () => {
    expect(
      () => new Movie({ id: 'movie-1', title: '', director: null, year: null, genre: null }),
    ).toThrow('Title is required');
  });
});