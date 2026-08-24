export interface MovieProps {
  id: string;
  title: string;
  director: string | null;
  year: number | null;
  genre: string | null;
}

export type MovieInput = Omit<MovieProps, 'id'>;
export type MovieUpdateInput = Partial<MovieInput>;

export default class Movie {
  readonly id: string;
  readonly title: string;
  readonly director: string | null;
  readonly year: number | null;
  readonly genre: string | null;

  constructor({ id, title, director, year, genre }: MovieProps) {
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required');
    }

    this.id = id;
    this.title = title;
    this.director = director || null;
    this.year = year || null;
    this.genre = genre || null;
  }
}