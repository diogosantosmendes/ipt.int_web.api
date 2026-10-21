import GenericUseCases from './GenericUseCases';
import Repositories from '../ports';

export default interface UseCases {
  generic: GenericUseCases;
}

export function initUseCases(repositories: Repositories): UseCases {
  return {
    generic: new GenericUseCases(repositories.generic),
  };
}