export type GenericRecord = Record<string, unknown>;

export interface GenericPageOptions {
  filters: Record<string, unknown>;
  sort?: string;
  page: number;
  size: number;
}

export default interface GenericRepository {
  getPage(entity: string, options: GenericPageOptions): Promise<GenericRecord[]>;
  count(entity: string, filters: Record<string, unknown>): Promise<number>;
  getById(entity: string, id: string): Promise<GenericRecord | null>;
  create(entity: string, value: Record<string, unknown>): Promise<GenericRecord>;
  update(entity: string, id: string, value: Record<string, unknown>): Promise<GenericRecord | null>;
  delete(entity: string, id: string): Promise<boolean>;
}