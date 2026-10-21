export type GenericRecord = Record<string, unknown> & { id: string };
export type GenericSort = Record<string, 1 | -1>;

export interface GenericListOptions {
  filters: Record<string, unknown>;
  sort: GenericSort;
  page: number;
  size: number;
}

export default interface GenericRepository {
  getPage(entity: string, options: GenericListOptions): Promise<GenericRecord[]>;
  count(entity: string, filters: Record<string, unknown>): Promise<number>;
  getById(entity: string, id: string): Promise<GenericRecord | null>;
  create(entity: string, value: Record<string, unknown>): Promise<GenericRecord>;
  update(entity: string, id: string, value: Record<string, unknown>): Promise<GenericRecord | null>;
  delete(entity: string, id: string): Promise<boolean>;
}