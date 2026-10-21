import { Request, Response } from 'express';
import UseCases from '../src/application/use-cases';
import GenericController from '../src/interfaces/rest/controllers/GenericController';

describe('GenericController collection ownership', () => {
  it('maps class and student endpoints to separately prefixed collections', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const json = jest.fn();
    const useCases = { generic: { list, count: jest.fn() } } as unknown as UseCases;
    const controller = new GenericController(useCases);
    const response = { json } as unknown as Response;

    await controller.list(
      { params: { entity: 'music' }, query: {} } as Request<{ entity: string; studentNumber?: string }>,
      response,
    );
    await controller.list(
      {
        params: { studentNumber: '20178', entity: 'car' },
        query: {},
      } as Request<{ entity: string; studentNumber?: string }>,
      response,
    );

    expect(list).toHaveBeenNthCalledWith(1, 'classes_music', {
      filters: {}, sort: {}, page: 1, size: 20,
    });
    expect(list).toHaveBeenNthCalledWith(2, '20178_car', {
      filters: {}, sort: {}, page: 1, size: 20,
    });
  });

  it('passes pagination, scalar filters, and sort to the list use case', async () => {
    const list = jest.fn().mockResolvedValue([{ id: 'station-1' }]);
    const json = jest.fn();
    const controller = new GenericController({ generic: { list } } as unknown as UseCases);

    await controller.list(
      {
        params: { entity: 'station' },
        query: { page: '2', size: '5', status: '1', sort: 'location:asc' },
      } as unknown as Request<{ entity: string }>,
      { json } as unknown as Response,
    );

    expect(list).toHaveBeenCalledWith('classes_station', {
      filters: { status: 1 },
      sort: { location: 1 },
      page: 2,
      size: 5,
    });
    expect(json).toHaveBeenCalledWith({ data: [{ id: 'station-1' }], page: 2, size: 5 });
  });

  it('counts records using the same filters and ignores pagination and sort', async () => {
    const count = jest.fn().mockResolvedValue(7);
    const json = jest.fn();
    const controller = new GenericController({ generic: { count } } as unknown as UseCases);

    await controller.count(
      {
        params: { studentNumber: '20178', entity: 'car' },
        query: { page: '3', size: '10', sort: 'cost:desc', status: '1' },
      } as unknown as Request<{ entity: string; studentNumber: string }>,
      { json } as unknown as Response,
    );

    expect(count).toHaveBeenCalledWith('20178_car', { status: 1 });
    expect(json).toHaveBeenCalledWith({ count: 7 });
  });

  it('passes array and nested-object filters through as Mongo-compatible predicates', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const controller = new GenericController({ generic: { list } } as unknown as UseCases);

    await controller.list(
      {
        params: { entity: 'station' },
        query: { status: ['1', '2'], coord: { lat: '38.7' } },
      } as unknown as Request<{ entity: string }>,
      { json: jest.fn() } as unknown as Response,
    );

    expect(list).toHaveBeenCalledWith('classes_station', expect.objectContaining({
      filters: { status: { $in: [1, 2] }, 'coord.lat': 38.7 },
    }));
  });

  it('preserves allowlisted Mongo operators and parses ISO dates for comparisons', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const controller = new GenericController({ generic: { list } } as unknown as UseCases);

    await controller.list(
      {
        params: { entity: 'charge' },
        query: {
          filter: {
            location: { $exists: 'true' },
            timestamp: { $gt: '2026-01-02' },
          },
        },
      } as unknown as Request<{ entity: string }>,
      { json: jest.fn() } as unknown as Response,
    );

    const passedOptions = list.mock.calls[0][1];
    expect(passedOptions.filters).toEqual({
      location: { $exists: true },
      timestamp: { $gt: new Date('2026-01-02') },
    });
  });

  it('converts ISO date filter values to Date objects', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const controller = new GenericController({ generic: { list } } as unknown as UseCases);

    await controller.list(
      {
        params: { entity: 'charge' },
        query: {
          filter: {
            timestamp: '2026-01-02T12:30:00.000Z',
            createdOn: '2026-01-02',
            label: '2026-01-02-not-a-date',
          },
        },
      } as unknown as Request<{ entity: string }>,
      { json: jest.fn() } as unknown as Response,
    );

    expect(list).toHaveBeenCalledWith('classes_charge', expect.objectContaining({
      filters: {
        timestamp: new Date('2026-01-02T12:30:00.000Z'),
        createdOn: new Date('2026-01-02'),
        label: '2026-01-02-not-a-date',
      },
    }));
  });

  it('rejects unsupported Mongo operators', async () => {
    const controller = new GenericController({ generic: { list: jest.fn() } } as unknown as UseCases);
    await expect(controller.list(
      {
        params: { entity: 'station' },
        query: { filter: { status: { $where: 'true' } } },
      } as unknown as Request<{ entity: string }>,
      { json: jest.fn() } as unknown as Response,
    )).rejects.toThrow('Unsupported filter operator: $where');
  });
});