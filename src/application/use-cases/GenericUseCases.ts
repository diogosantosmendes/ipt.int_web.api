import GenericRepository, { GenericPageOptions, GenericRecord } from '../ports/GenericRepository';

export default class GenericUseCases {
  constructor(private readonly repository: GenericRepository) {}

  list(entity: string, options: GenericPageOptions): Promise<GenericRecord[]> {
    return this.repository.getPage(entity, options);
  }

  count(entity: string, filters: Record<string, any>): Promise<number> {
    return this.repository.count(entity, filters);
  }

  get(entity: string, id: string): Promise<GenericRecord | null> {
    return this.repository.getById(entity, id);
  }

  create(entity: string, value: Record<string, unknown>): Promise<GenericRecord> {
    return this.repository.create(entity, value);
  }

  update(entity: string, id: string, value: Record<string, unknown>): Promise<GenericRecord | null> {
    return this.repository.update(entity, id, value);
  }

  delete(entity: string, id: string): Promise<boolean> {
    return this.repository.delete(entity, id);
  }
}