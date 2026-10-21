import { Collection, Db, Document } from 'mongodb';
import { randomUUID } from 'node:crypto';
import GenericRepository, { GenericListOptions, GenericRecord } from '../../application/ports/GenericRepository';

export default class MongoGenericRepository implements GenericRepository {
  constructor(private readonly database: Db) { }

  async getPage(collectionName: string, options: GenericListOptions): Promise<GenericRecord[]> {
    const documents = await this.collection(collectionName)
      .find(options.filters)
      .sort(options.sort)
      .skip((options.page - 1) * options.size)
      .limit(options.size)
      .toArray();
    return documents.map((document) => this.toRecord(document));
  }

  count(collectionName: string, filters: Record<string, unknown>): Promise<number> {
    return this.collection(collectionName).countDocuments(filters);
  }

  async getById(collectionName: string, id: string): Promise<GenericRecord | null> {
    const document = await this.collection(collectionName).findOne({ id });
    return document ? this.toRecord(document) : null;
  }

  async create(collectionName: string, value: Record<string, unknown>): Promise<GenericRecord> {
    const record: GenericRecord = { ...value, id: randomUUID() };
    await this.collection(collectionName).insertOne(record);
    return record;
  }

  async update(collectionName: string, id: string, value: Record<string, unknown>): Promise<GenericRecord | null> {
    const { id: _ignoredId, ...changes } = value;
    const document = await this.collection(collectionName).findOneAndUpdate(
      { id },
      { $set: changes },
      { returnDocument: 'after' },
    );
    return document ? this.toRecord(document) : null;
  }

  async delete(collectionName: string, id: string): Promise<boolean> {
    const result = await this.collection(collectionName).deleteOne({ id });
    return result.deletedCount === 1;
  }

  private collection(collectionName: string): Collection<Document> {
    return this.database.collection(collectionName);
  }

  private toRecord(document: Document): GenericRecord {
    const { _id: _ignoredMongoId, ...record } = document;
    return record as GenericRecord;
  }
}