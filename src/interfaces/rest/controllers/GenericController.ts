import { Request, Response } from 'express';
import UseCases from '../../../application/use-cases';
import { GenericListOptions } from '../../../application/ports/GenericRepository';

type GenericParams = { entity: string; id?: string; studentNumber?: string };

/**
 * @openapi
 * components:
 *   schemas:
 *     GenericRecord:
 *       type: object
 *       description: An arbitrary JSON object with a server-generated id.
 *       properties:
 *         id: { type: string, example: 7be4d098-c514-4d44-b0ba-72d3b4769367 }
 *       additionalProperties: true
 *     Error:
 *       type: object
 *       required: [error]
 *       properties:
 *         error: { type: string, example: Record not found }
 */
export default class GenericController {
  constructor(private readonly useCases: UseCases) { }

  /**
   * @openapi
   * /classes/{entity}/page:
   *   get:
   *     summary: List records in a collection
   *     tags: [Generic]
   *     parameters:
   *       - name: entity
   *         in: path
   *         required: true
   *         schema: { type: string, pattern: '^[A-Za-z][A-Za-z0-9_-]{0,62}$' }
   *       - name: page
   *         in: query
   *         schema: { type: integer, minimum: 1, default: 1 }
   *       - name: size
   *         in: query
   *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
   *       - name: sort
   *         in: query
   *         description: Comma-separated field:asc or field:desc values.
   *         schema: { type: string, example: 'timestamp:desc,location:asc' }
   *       - name: filter
   *         in: query
   *         style: deepObject
   *         explode: true
   *         description: >-
   *           Mongo-style filters support scalar equality, repeated values as arrays, nested fields, and
   *           $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, and $exists. Examples:
   *           filter[status]=1; filter[status]=1&filter[status]=2;
   *           filter[coord][lat]=38.7; filter[location][$exists]=true;
   *           filter[timestamp][$gt]=2026-01-02. URL-encode brackets and dollar signs as needed.
   *         schema: { type: object, additionalProperties: true }
   *     responses:
   *       200:
   *         description: Records found
   *         content:
   *           application/json:
   *             schema:
  *               type: object
  *               properties:
  *                 data:
  *                   type: array
  *                   items:
  *                     $ref: '#/components/schemas/GenericRecord'
  *                 page:
  *                   type: integer
  *                 size:
  *                   type: integer
   */
  list = async (request: Request<GenericParams>, response: Response): Promise<void> => {
    const options = this.pageOptions(request.query as Record<string, unknown>);
    const data = await this.useCases.generic.list(this.collectionName(request.params), options);
    response.json({ data, page: options.page, size: options.size });
  };

  /**
   * @openapi
   * /classes/{entity}/count:
   *   get:
   *     summary: Count records in a collection
   *     tags: [Generic]
   *     parameters:
   *       - { name: entity, in: path, required: true, schema: { type: string, pattern: '^[A-Za-z][A-Za-z0-9_-]{0,62}$' } }
   *       - { name: 'filter[status]', in: query, description: Exact-match field filter; repeat for additional fields, schema: { type: string } }
   *     responses:
   *       200:
   *         description: Records found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *                   example: 42
   */
  count = async (request: Request<GenericParams>, response: Response): Promise<void> => {
    const filters = this.filters(request.query as Record<string, unknown>);
    const count = await this.useCases.generic.count(this.collectionName(request.params), filters);
    response.json({ count });
  };

  /**
   * @openapi
   * /classes/{entity}/{id}:
   *   get:
   *     summary: Get a record by id
   *     tags: [Generic]
   *     parameters:
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *       - { name: id, in: path, required: true, schema: { type: string } }
   *     responses:
   *       200:
   *         description: Record found
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/GenericRecord' }
   *       404: { description: Record not found }
   */
  get = async (request: Request<GenericParams>, response: Response): Promise<void> => {
    const record = await this.useCases.generic.get(this.collectionName(request.params), request.params.id!);
    if (!record) {
      response.status(404).json({ error: 'Record not found' });
      return;
    }
    response.json(record);
  };

  /**
   * @openapi
   * /classes/{entity}:
   *   post:
   *     summary: Create a record in a collection
   *     tags: [Generic]
   *     parameters:
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { type: object, additionalProperties: true }
   *     responses:
   *       201:
   *         description: Record created
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/GenericRecord' }
   *       400: { description: Invalid entity or request body }
   */
  create = async (request: Request<GenericParams>, response: Response): Promise<void> => {
    response.status(201).json(
      await this.useCases.generic.create(this.collectionName(request.params), this.requestBody(request.body)),
    );
  };

  /**
   * @openapi
   * /classes/{entity}/{id}:
   *   put:
   *     summary: Update a record
   *     tags: [Generic]
   *     parameters:
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *       - { name: id, in: path, required: true, schema: { type: string } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { type: object, additionalProperties: true }
   *     responses:
   *       200: { description: Record updated }
   *       404: { description: Record not found }
   */
  update = async (request: Request<GenericParams>, response: Response): Promise<void> => {
    const record = await this.useCases.generic.update(
      this.collectionName(request.params),
      request.params.id!,
      this.requestBody(request.body),
    );
    if (!record) {
      response.status(404).json({ error: 'Record not found' });
      return;
    }
    response.json(record);
  };

  /**
   * @openapi
   * /classes/{entity}/{id}:
   *   delete:
   *     summary: Delete a record
   *     tags: [Generic]
   *     parameters:
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *       - { name: id, in: path, required: true, schema: { type: string } }
   *     responses:
   *       204: { description: Record deleted }
   *       404: { description: Record not found }
   */
  delete = async (request: Request<GenericParams>, response: Response): Promise<void> => {
    const deleted = await this.useCases.generic.delete(this.collectionName(request.params), request.params.id!);
    if (!deleted) {
      response.status(404).json({ error: 'Record not found' });
      return;
    }
    response.status(204).send();
  };

  /**
   * @openapi
   * /{studentNumber}/{entity}/page:
   *   get:
   *     summary: List records owned by a student
   *     tags: [Generic]
   *     parameters:
   *       - { name: studentNumber, in: path, required: true, schema: { type: string, pattern: '^\\d{1,20}$' } }
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *       - name: page
   *         in: query
   *         schema: { type: integer, minimum: 1, default: 1 }
   *       - name: size
   *         in: query
   *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
   *       - name: sort
   *         in: query
   *         description: Comma-separated field:asc or field:desc values.
   *         schema: { type: string, example: 'timestamp:desc,location:asc' }
   *       - name: filter
   *         in: query
   *         style: deepObject
   *         explode: true
   *         description: >-
   *           Supports scalar equality, repeated-value arrays, nested fields, and $eq, $ne, $gt,
   *           $gte, $lt, $lte, $in, $nin, and $exists. For example:
   *           filter[status]=1&filter[status]=2 or filter[timestamp][$gt]=2026-01-02.
   *         schema: { type: object, additionalProperties: true }
   *     responses:
   *       200: { description: Student records found }
   * /{studentNumber}/{entity}/count:
   *   get:
   *     summary: Count student-owned records matching filters
   *     tags: [Generic]
   *     parameters:
   *       - { name: studentNumber, in: path, required: true, schema: { type: string, pattern: '^\\d{1,20}$' } }
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *       - { name: 'filter[status]', in: query, description: Exact-match field filter, schema: { type: string } }
   *     responses:
   *       200: { description: Matching student records counted }
   * /{studentNumber}/{entity}:
   *   post:
   *     summary: Create a student-owned record
   *     tags: [Generic]
   *     parameters:
   *       - { name: studentNumber, in: path, required: true, schema: { type: string } }
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { type: object, additionalProperties: true }
   *     responses:
   *       201: { description: Student record created }
   * /{studentNumber}/{entity}/{id}:
   *   get:
   *     summary: Get a student-owned record
   *     tags: [Generic]
   *     parameters:
   *       - { name: studentNumber, in: path, required: true, schema: { type: string } }
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *       - { name: id, in: path, required: true, schema: { type: string } }
   *     responses:
   *       200: { description: Student record found }
   *       404: { description: Record not found }
   *   put:
   *     summary: Update a student-owned record
   *     tags: [Generic]
   *     parameters:
   *       - { name: studentNumber, in: path, required: true, schema: { type: string } }
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *       - { name: id, in: path, required: true, schema: { type: string } }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema: { type: object, additionalProperties: true }
   *     responses:
   *       200: { description: Student record updated }
   *       404: { description: Record not found }
   *   delete:
   *     summary: Delete a student-owned record
   *     tags: [Generic]
   *     parameters:
   *       - { name: studentNumber, in: path, required: true, schema: { type: string } }
   *       - { name: entity, in: path, required: true, schema: { type: string } }
   *       - { name: id, in: path, required: true, schema: { type: string } }
   *     responses:
   *       204: { description: Student record deleted }
   *       404: { description: Record not found }
   */

  private requestBody(body: unknown): Record<string, unknown> {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new Error('Request body must be a JSON object');
    }
    const { id: _ignoredId, _id: _ignoredMongoId, ...value } = body as Record<string, unknown>;
    return value;
  }

  private pageOptions(query: Record<string, unknown>): GenericListOptions {
    const page = this.positiveInteger(query.page, 1, 'page');
    const size = this.positiveInteger(query.size, 20, 'size');
    if (size > 100) throw new Error('size cannot exceed 100');

    return {
      filters: this.filters(query),
      sort: this.sort(query.sort),
      page,
      size,
    };
  }

  private positiveInteger(value: unknown, fallback: number, name: string): number {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      throw new Error(`${name} must be a positive integer`);
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new Error(`${name} must be a positive integer`);
    }
    return parsed;
  }

  private filters(query: Record<string, unknown>): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    const reserved = new Set(['page', 'size', 'sort']);

    for (const [rawField, rawValue] of Object.entries(query)) {
      if (reserved.has(rawField)) continue;
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
      '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$exists',
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

  private sort(value: unknown): Record<string, 1 | -1> {
    if (value === undefined || typeof value !== 'string') return {};

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

  private entity(entity: string): string {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(entity)) {
      throw new Error('Entity must start with a letter and contain only letters, numbers, underscores, or hyphens');
    }
    return entity;
  }

  private collectionName(params: GenericParams): string {
    const entity = this.entity(params.entity);
    if (params.studentNumber === undefined) return `classes_${entity}`;
    if (!/^\d{1,20}$/.test(params.studentNumber)) {
      throw new Error('Student number must contain only digits');
    }
    return `${params.studentNumber}_${entity}`;
  }
}