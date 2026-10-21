import UseCases from "../../../application/use-cases";
import GenericController from './GenericController';

export default interface Controllers {
  generic: GenericController;
}

export function initControllers(useCases: UseCases): Controllers {
  return {
    generic: new GenericController(useCases),
  };
}