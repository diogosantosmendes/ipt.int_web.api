import { Router } from 'express';
import Controllers from './controllers';

export default function createRoutes(controller: Controllers): Router {
  const router = Router();

  router.get('/movies', controller.movies.list);
  router.get('/movies/:id', controller.movies.get);
  router.post('/movies', controller.movies.create);
  router.put('/movies/:id', controller.movies.update);
  router.delete('/movies/:id', controller.movies.delete);

  return router;
}