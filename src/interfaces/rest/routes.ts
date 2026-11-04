import { RequestHandler, Router } from 'express';
import Controllers from './controllers';

export default function createRoutes(controller: Controllers, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);

  router.get('/classes/:entity/page', controller.generic.list);
  router.get('/classes/:entity/count', controller.generic.count);
  router.get('/classes/:entity/:id', controller.generic.get);
  router.post('/classes/:entity', controller.generic.create);
  router.put('/classes/:entity/:id', controller.generic.update);
  router.delete('/classes/:entity/:id', controller.generic.delete);

  router.get('/:entity/page', controller.generic.listStudent);
  router.get('/:entity/count', controller.generic.countStudent);
  router.get('/:entity/:id', controller.generic.getStudent);
  router.post('/:entity', controller.generic.createStudent);
  router.put('/:entity/:id', controller.generic.updateStudent);
  router.delete('/:entity/:id', controller.generic.deleteStudent);

  return router;
}