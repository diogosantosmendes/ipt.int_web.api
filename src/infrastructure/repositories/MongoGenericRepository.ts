import { Collection, Db, Document, ObjectId } from 'mongodb';
import GenericRepository, { GenericPageOptions, GenericRecord } from '../../application/ports/GenericRepository';

export default class MongoGenericRepository implements GenericRepository {
  constructor(private readonly database: Db) { }

  async getPage(collectionName: string, options: GenericPageOptions): Promise<GenericRecord[]> {
    if (options.size > 100) throw new Error('size cannot exceed 100');

    const documents = await this.collection(collectionName)
      .find(this.parseFilters(options.filters))
      .sort(this.parseSort(options.sort))
      .skip((options.page - 1) * options.size)
      .limit(options.size)
      .toArray();
    return documents.map((document) => this.toRecord(document));
  }

  count(collectionName: string, filters: Record<string, unknown>): Promise<number> {
    return this.collection(collectionName).countDocuments(this.parseFilters(filters));
  }

  async getById(collectionName: string, id: string): Promise<GenericRecord | null> {
    const document = await this.collection(collectionName).findOne({ _id: new ObjectId(id) });
    return document ? this.toRecord(document) : null;
  }

  async create(collectionName: string, value: Record<string, unknown>): Promise<GenericRecord> {
    const result = await this.collection(collectionName).insertOne(value);
    value._id = result.insertedId;
    return this.toRecord(value);
  }

  async update(collectionName: string, id: string, value: Record<string, unknown>): Promise<GenericRecord | null> {
    const { id: _ignoredId, ...changes } = value;
    const document = await this.collection(collectionName).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: changes },
      { returnDocument: 'after' },
    );
    return document ? this.toRecord(document) : null;
  }

  async delete(collectionName: string, id: string): Promise<boolean> {
    const result = await this.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  private collection(collectionName: string): Collection<Document> {
    return this.database.collection(collectionName);
  }

  private toRecord(document: Document): GenericRecord {
    const { _id: id, ...record } = document;

    return { ...record, id: id.toString() } as GenericRecord;
  }

  private parseFilters(query: Record<string, unknown>): Record<string, unknown> {
    const filters: Record<string, unknown> = {};

    for (const [rawField, rawValue] of Object.entries(query)) {
      if (rawField === 'filter' && this.isQueryObject(rawValue)) {
        this.appendFilters(filters, rawValue);
      } else {
        this.appendFilter(filters, rawField, rawValue);
      }
    }

    return filters;
  }

  private appendFilters(filters: Record<string, unknown>, values: Record<string, unknown>, prefix = ''): void {
    for (const [field, value] of Object.entries(values)) {
      const path = prefix ? `${prefix}.${field}` : field;
      this.appendFilter(filters, path, value);
    }
  }

  private appendFilter(filters: Record<string, unknown>, field: string, value: unknown): void {
    if (!/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*$/.test(field) || value === undefined) return;
    if (Array.isArray(value)) {
      filters[field] = { $in: value.map((item) => this.filterValue(String(item))) };
    } else if (this.isQueryObject(value)) {
      if (Object.keys(value).some((key) => key.startsWith('$'))) {
        filters[field] = this.operatorFilter(value);
      } else {
        this.appendFilters(filters, value, field);
      }
    } else if (typeof value !== 'object') {
      filters[field] = this.filterValue(String(value));
    }
  }

  private operatorFilter(value: Record<string, unknown>): Record<string, unknown> {
    const supportedOperators = new Set([
      '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$exists', "$regex",
    ]);
    const filter: Record<string, unknown> = {};

    for (const [operator, rawValue] of Object.entries(value)) {
      if (!supportedOperators.has(operator)) {
        throw new Error(`Unsupported filter operator: ${operator}`);
      }
      if (operator === '$exists') {
        const parsed = typeof rawValue === 'boolean' ? rawValue : this.filterValue(String(rawValue));
        if (typeof parsed !== 'boolean') throw new Error('$exists must be true or false');
        filter[operator] = parsed;
      } else if (operator === '$regex') {
        if (typeof rawValue !== 'string') throw new Error('$regex must receive a string');
        filter[operator] = new RegExp(rawValue, 'i');
      } else if (operator === '$in' || operator === '$nin') {
        if (!Array.isArray(rawValue)) throw new Error(`${operator} must receive an array`);
        filter[operator] = rawValue.map((item) => this.filterValue(String(item)));
      } else {
        filter[operator] = this.filterValue(String(rawValue));
      }
    }

    return filter;
  }

  private isQueryObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private filterValue(value: string): string | number | boolean | null | Date {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime()) && date.toISOString().startsWith(value.slice(0, 10))) {
        return date;
      }
    }
    if (/^-?(?:\d+|\d*\.\d+)$/.test(value)) return Number(value);
    return value;
  }

  private parseSort(value: unknown): Record<string, 1 | -1> {
    if (!value || typeof value !== 'string') return {};

    const sort: Record<string, 1 | -1> = {};

    for (const item of value.split(',')) {
      const [field, direction, extra] = item.split(':');
      if (extra !== undefined || !/^[A-Za-z][A-Za-z0-9_]*$/.test(field)) {
        throw new Error(`Invalid sort field: ${field}`);
      }
      if(direction !== 'asc' && direction !== 'desc'){
        throw new Error(`Invalid sort direction: ${direction}`);
      }
      sort[field] = direction === 'asc' ? 1 : -1;
    }

    return sort;
  }
}