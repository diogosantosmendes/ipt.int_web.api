import GenericRepository from './GenericRepository';

export default interface Repositories {
  generic: GenericRepository;
}

export function initRepositories(genericRepository: GenericRepository): Repositories {
  return {
    generic: genericRepository,
  };
}