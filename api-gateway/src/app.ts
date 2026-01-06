import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import morgan from 'morgan';

import { envs } from './config/envs.adapter';
import { RequestExt } from './interfaces/req.interfaces';
import { checkJwt } from './middlewares/token.middleware';
import { checkRole } from './middlewares/role.middleware';

/* ======================================================
   SERVICE URLS
====================================================== */
const services = {
  user: envs.USER_SERVICE_URL,
  productCatalog: envs.PRODUCT_CATALOG_SERVICE_URL,
  shoppingCart: envs.SHOPPING_CART_SERVICE_URL,
  order: envs.ORDER_SERVICE_URL,
  payment: envs.PAYMENT_SERVICE_URL,
};

const app = express();
const port = envs.PORT;

/* ======================================================
   GLOBAL MIDDLEWARES
====================================================== */
app.use(morgan('dev'));
app.use(express.json());

/* ======================================================
   HELPERS
====================================================== */

// Generic proxy creator
const createProxy = (
  target: string,
  router?: (req: RequestExt) => string,
) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    router,
  });

// Auth + Role check
// GET → public
// Others → protected
const addAuthAndRoleChecks =
  (role: 'admin' | 'user') =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') return next();

    checkJwt(req, res, () =>
      checkRole(role)(req as RequestExt, res, next),
    );
  };

/* ======================================================
   AUTH ROUTES
====================================================== */
app.use(
  '/auth/login',
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: () => '/login',
  }),
);

app.use(
  '/auth/register',
  createProxyMiddleware({
    target: services.user,
    changeOrigin: true,
    pathRewrite: () => '/register',
  }),
);

/* ======================================================
   USER ROUTES
====================================================== */
app.use(
  '/user',
  checkJwt,
  createProxy(
    services.user,
    (req: RequestExt) => `${services.user}/user/${req.user?.id}`,
  ),
);

/* ======================================================
   PRODUCT CATALOG
====================================================== */
app.use(
  '/category',
  addAuthAndRoleChecks('admin'),
  createProxy(`${services.productCatalog}/category`),
);

app.use(
  '/product',
  addAuthAndRoleChecks('admin'),
  createProxy(`${services.productCatalog}/product`),
);

/* ======================================================
   SHOPPING CART
====================================================== */
app.use(
  '/cart',
  checkJwt,
  createProxy(
    services.shoppingCart,
    (req: RequestExt) =>
      `${services.shoppingCart}/cart/${req.user?.id}`,
  ),
);

/* ======================================================
   ORDER
====================================================== */
app.use(
  '/order',
  checkJwt,
  createProxy(
    services.order,
    (req: RequestExt) =>
      `${services.order}/order/${req.user?.id}`,
  ),
);

/* ======================================================
   PAYMENT
====================================================== */
app.use(
  '/payment',
  checkJwt,
  createProxy(`${services.payment}/payment`),
);

/* ======================================================
   ROOT
====================================================== */
app.get('/', (_req: Request, res: Response) => {
  res.send('API Gateway is running 🚀');
});

/* ======================================================
   HEALTH CHECK
====================================================== */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

/* ======================================================
   ERROR HANDLER
====================================================== */
app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Gateway Error:', err);
    res.status(500).json({ message: 'Gateway error' });
  },
);

/* ======================================================
   START SERVER
====================================================== */
app.listen(port, '0.0.0.0', () => {
  console.log(`API Gateway running on http://0.0.0.0:${port}`);
});
