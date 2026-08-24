import { Request, Response } from 'express';
import UseCases from '../../../application/use-cases';
import { MovieInput, MovieUpdateInput } from '../../../domain/entities/Movie';

/**
 * @openapi
 * components:
 *   parameters:
 *     MovieId:
 *       name: id
 *       in: path
 *       required: true
 *       description: Movie identifier
 *       schema:
 *         type: string
 *   responses:
 *     BadRequest:
 *       description: Invalid request
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     NotFound:
 *       description: Movie not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *   schemas:
 *     Movie:
 *       type: object
 *       required: [id, title]
 *       properties:
 *         id: { type: string, example: movie-1 }
 *         title: { type: string, example: The Matrix }
 *         director: { type: string, nullable: true, example: The Wachowskis }
 *         year: { type: integer, nullable: true, example: 1999 }
 *         genre: { type: string, nullable: true, example: Science fiction }
 *     MovieInput:
 *       type: object
 *       required: [title]
 *       properties:
 *         title: { type: string, example: The Matrix }
 *         director: { type: string, nullable: true, example: The Wachowskis }
 *         year: { type: integer, nullable: true, example: 1999 }
 *         genre: { type: string, nullable: true, example: Science fiction }
 *     MovieUpdateInput:
 *       type: object
 *       properties:
 *         title: { type: string, example: The Matrix Reloaded }
 *         director: { type: string, nullable: true }
 *         year: { type: integer, nullable: true }
 *         genre: { type: string, nullable: true }
 *     Error:
 *       type: object
 *       required: [error]
 *       properties:
 *         error: { type: string, example: Movie not found }
 *     HealthResponse:
 *       type: object
 *       required: [status]
 *       properties:
 *         status: { type: string, example: ok }
 */
export default class MovieController {
  constructor(private readonly useCases: UseCases) {}

  /**
   * @openapi
   * /movies:
   *   get:
   *     tags: [Movies]
   *     summary: List movies
   *     responses:
   *       200:
   *         description: Movies found
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Movie'
   */
  list = async (_request: Request, response: Response): Promise<void> => {
    response.json(await this.useCases.movies.listMovies());
  };

  /**
   * @openapi
   * /movies/{id}:
   *   get:
   *     tags: [Movies]
   *     summary: Get a movie
   *     parameters:
   *       - $ref: '#/components/parameters/MovieId'
   *     responses:
   *       200:
   *         description: Movie found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Movie'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  get = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const movie = await this.useCases.movies.getMovie(request.params.id);
    if (!movie) {
      response.status(404).json({ error: 'Movie not found' });
      return;
    }

    response.json(movie);
  };

  /**
   * @openapi
   * /movies:
   *   post:
   *     tags: [Movies]
   *     summary: Create a movie
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MovieInput'
   *     responses:
   *       201:
   *         description: Movie created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Movie'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   */
  create = async (request: Request, response: Response): Promise<void> => {
    const movie = await this.useCases.movies.createMovie(request.body as MovieInput);
    response.status(201).json(movie);
  };

  /**
   * @openapi
   * /movies/{id}:
   *   put:
   *     tags: [Movies]
   *     summary: Update a movie
   *     parameters:
   *       - $ref: '#/components/parameters/MovieId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MovieUpdateInput'
   *     responses:
   *       200:
   *         description: Movie updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Movie'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  update = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const movie = await this.useCases.movies.updateMovie(
      request.params.id,
      request.body as MovieUpdateInput,
    );
    if (!movie) {
      response.status(404).json({ error: 'Movie not found' });
      return;
    }

    response.json(movie);
  };

  /**
   * @openapi
   * /movies/{id}:
   *   delete:
   *     tags: [Movies]
   *     summary: Delete a movie
   *     parameters:
   *       - $ref: '#/components/parameters/MovieId'
   *     responses:
   *       204:
   *         description: Movie deleted
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  delete = async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const deleted = await this.useCases.movies.deleteMovie(request.params.id);
    if (!deleted) {
      response.status(404).json({ error: 'Movie not found' });
      return;
    }

    response.status(204).send();
  };
}