import { Router, type IRouter } from "express";
import healthRouter from "./health";
import billsRouter from "./bills";
import webhooksRouter from "./webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(billsRouter);
router.use(webhooksRouter);

export default router;
