import { Router } from 'express';
import Controllers from './controllers';

export default function createRoutes(controller: Controllers): Router {
  const router = Router();

  router.get('/classes/:entity/page', controller.generic.list);
  router.get('/classes/:entity/count', controller.generic.count);
  router.get('/classes/:entity/:id', controller.generic.get);
  router.post('/classes/:entity', controller.generic.create);
  router.put('/classes/:entity/:id', controller.generic.update);
  router.delete('/classes/:entity/:id', controller.generic.delete);

  router.get('/:studentNumber/:entity/page', controller.generic.list);
  router.get('/:studentNumber/:entity/count', controller.generic.count);
  router.get('/:studentNumber/:entity/:id', controller.generic.get);
  router.post('/:studentNumber/:entity', controller.generic.create);
  router.put('/:studentNumber/:entity/:id', controller.generic.update);
  router.delete('/:studentNumber/:entity/:id', controller.generic.delete);

  return router;
}