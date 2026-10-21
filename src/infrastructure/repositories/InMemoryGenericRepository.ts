import { randomUUID } from 'node:crypto';
import GenericRepository, { GenericListOptions, GenericRecord } from '../../application/ports/GenericRepository';

export default class InMemoryGenericRepository implements GenericRepository {
  private readonly collections = new Map<string, Map<string, GenericRecord>>();

  async getPage(entity: string, options: GenericListOptions): Promise<GenericRecord[]> {
    const records = [...this.collection(entity).values()]
      .filter((record) => this.matches(record, options.filters));

    records.sort((left, right) => {
      for (const [field, direction] of Object.entries(options.sort)) {
        const leftValue = left[field];
        const rightValue = right[field];
        if (leftValue === rightValue) continue;
        if (leftValue === undefined || leftValue === null) return -1 * direction;
        if (rightValue === undefined || rightValue === null) return 1 * direction;
        if (leftValue < rightValue) return -1 * direction;
        if (leftValue > rightValue) return 1 * direction;
      }
      return 0;
    });

    return records.slice((options.page - 1) * options.size, (options.page) * options.size);
  }

  async count(entity: string, filters: Record<string, unknown>): Promise<number> {
    return [...this.collection(entity).values()].filter((record) => this.matches(record, filters)).length;
  }

  async getById(entity: string, id: string): Promise<GenericRecord | null> {
    return this.collection(entity).get(id) ?? null;
  }

  async create(entity: string, value: Record<string, unknown>): Promise<GenericRecord> {
    const record: GenericRecord = { ...value, id: randomUUID() };
    this.collection(entity).set(record.id, record);
    return record;
  }

  async update(entity: string, id: string, value: Record<string, unknown>): Promise<GenericRecord | null> {
    const records = this.collection(entity);
    const existing = records.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...value, id };
    records.set(id, updated);
    return updated;
  }

  async delete(entity: string, id: string): Promise<boolean> {
    return this.collection(entity).delete(id);
  }

  private collection(entity: string): Map<string, GenericRecord> {
    let records = this.collections.get(entity);
    if (!records) {
      records = new Map();
      this.collections.set(entity, records);
    }
    return records;
  }

  private matches(record: GenericRecord, filters: Record<string, unknown>): boolean {
    return Object.entries(filters).every(([field, expected]) => {
      const actual = field.split('.').reduce<unknown>((value, key) => {
        if (typeof value !== 'object' || value === null) return undefined;
        return (value as Record<string, unknown>)[key];
      }, record);

      if (typeof expected === 'object' && expected !== null && !Array.isArray(expected)) {
        const operators = expected as Record<string, unknown>;
        if ('$exists' in operators && (actual !== undefined) !== operators.$exists) return false;
        if ('$eq' in operators && actual !== operators.$eq) return false;
        if ('$ne' in operators && actual === operators.$ne) return false;
        if ('$gt' in operators && !(actual! > operators.$gt!)) return false;
        if ('$gte' in operators && !(actual! >= operators.$gte!)) return false;
        if ('$lt' in operators && !(actual! < operators.$lt!)) return false;
        if ('$lte' in operators && !(actual! <= operators.$lte!)) return false;
        if ('$in' in operators && !this.inChoices(actual, operators.$in as unknown[])) return false;
        if ('$nin' in operators && this.inChoices(actual, operators.$nin as unknown[])) return false;
        return true;
      }

      return actual === expected;
    });
  }

  private inChoices(actual: unknown, choices: unknown[]): boolean {
    return Array.isArray(actual)
      ? actual.some((item) => choices.includes(item))
      : choices.includes(actual);
  }
}