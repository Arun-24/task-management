import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createTask, deleteTask, getTasks, updateTask } from "../controllers/task.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createTask);
router.get("/", getTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
