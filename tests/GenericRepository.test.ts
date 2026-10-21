import InMemoryGenericRepository from '../src/infrastructure/repositories/InMemoryGenericRepository';
import { Db } from 'mongodb';
import MongoGenericRepository from '../src/infrastructure/repositories/MongoGenericRepository';

describe('InMemoryGenericRepository', () => {
  it('performs CRUD independently for each entity collection', async () => {
    const repository = new InMemoryGenericRepository();
    const artist = await repository.create('artist', { name: 'Nina Simone' });
    const music = await repository.create('music', { title: 'Feeling Good' });

    expect(artist.id).toBeTruthy();
    await expect(repository.getPage('artist', { filters: {}, sort: {}, page: 1, size: 10 })).resolves.toEqual([artist]);
    await expect(repository.getPage('music', { filters: {}, sort: {}, page: 1, size: 10 })).resolves.toEqual([music]);
    await expect(repository.getById('artist', artist.id)).resolves.toEqual(artist);
    await expect(repository.update('artist', artist.id, { genre: 'Jazz' })).resolves.toEqual({
      ...artist,
      genre: 'Jazz',
    });
    await expect(repository.delete('artist', artist.id)).resolves.toBe(true);
    await expect(repository.getById('artist', artist.id)).resolves.toBeNull();
    await expect(repository.getPage('music', { filters: {}, sort: {}, page: 1, size: 10 })).resolves.toEqual([music]);
  });

  it('filters, sorts, paginates, and counts the same matching records', async () => {
    const repository = new InMemoryGenericRepository();
    await repository.create('station', { city: 'Lisboa', status: 1 });
    await repository.create('station', { city: 'Porto', status: 1 });
    await repository.create('station', { city: 'Lisboa', status: 0 });

    const options = { filters: { status: 1 }, sort: { city: 1 as const }, page: 2, size: 1 };
    const page = await repository.getPage('station', options);

    expect(page).toHaveLength(1);
    expect(page[0].city).toBe('Porto');
    await expect(repository.count('station', options.filters)).resolves.toBe(2);
  });

  it('matches array filters and nested fields', async () => {
    const repository = new InMemoryGenericRepository();
    await repository.create('station', { status: 1, coord: { lat: 38.7 } });
    await repository.create('station', { status: 2, coord: { lat: 41.1 } });
    await repository.create('station', { status: 3, coord: { lat: 38.7 } });
    const filters = { status: { $in: [1, 2] }, 'coord.lat': 38.7 };

    await expect(repository.getPage('station', {
      filters, sort: {}, page: 1, size: 20,
    })).resolves.toHaveLength(1);
    await expect(repository.count('station', filters)).resolves.toBe(1);
  });

  it('supports existence and comparison operators in memory mode', async () => {
    const repository = new InMemoryGenericRepository();
    await repository.create('charge', { timestamp: new Date('2026-02-01T00:00:00Z'), cost: 4 });
    await repository.create('charge', { timestamp: new Date('2025-12-01T00:00:00Z') });

    await expect(repository.count('charge', {
      cost: { $exists: true },
      timestamp: { $gt: new Date('2026-01-02T00:00:00Z') },
    })).resolves.toBe(1);
    await expect(repository.count('charge', { cost: { $exists: false } })).resolves.toBe(1);
  });
});

describe('MongoGenericRepository', () => {
  it('prefixes collection names with classes_', async () => {
    const cursor = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    };
    const collection = { find: jest.fn().mockReturnValue(cursor) };
    const database = {
      collection: jest.fn().mockReturnValue(collection),
    } as unknown as Db;
    const repository = new MongoGenericRepository(database);

    await repository.getPage('classes_music', { filters: {}, sort: {}, page: 1, size: 10 });

    expect(database.collection).toHaveBeenCalledWith('classes_music');

    await repository.getPage('20178_car', { filters: {}, sort: {}, page: 1, size: 10 });

    expect(database.collection).toHaveBeenCalledWith('20178_car');
  });
});
