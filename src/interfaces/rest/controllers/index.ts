import UseCases from "../../../application/use-cases";
import MovieController from "./MovieController";

export default interface Controllers {
  movies: MovieController;
}

export function initControllers(useCases: UseCases): Controllers {
  return {
    movies: new MovieController(useCases),
  };
}