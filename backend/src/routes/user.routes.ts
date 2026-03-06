import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';
import { validate, idParamSchema, paginationSchema, updateProfileSchema } from '../middlewares/validate.middleware';
import { auditReadLog } from '../middlewares/audit-read.middleware';
import { cacheRoute } from '../middlewares/cache.middleware';

const userRepo = new UserRepository();
const userSvc = new UserService(userRepo);
const userCtrl = new UserController(userSvc);

const router = Router();

router.get('/', authenticate, authorize(...Roles.FINANCE_ACCESS), auditReadLog('users'), cacheRoute('users', 60), validate(paginationSchema, 'query'), userCtrl.list);

router.get('/:id', authenticate, authorize(...Roles.FINANCE_ACCESS), auditReadLog('users'), validate(idParamSchema, 'params'), userCtrl.getById);

router.patch('/:id',
    authenticate,
    authorize(...Roles.ADMIN_ONLY),
    validate(idParamSchema, 'params'),
    validate(updateProfileSchema, 'body'),
    userCtrl.update
);

router.delete('/:id', authenticate, authorize(...Roles.ADMIN_ONLY), validate(idParamSchema, 'params'), userCtrl.deactivate);

router.post('/:id/activate', authenticate, authorize(...Roles.ADMIN_ONLY), validate(idParamSchema, 'params'), userCtrl.activate);

export default router;
