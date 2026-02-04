import { Response } from "express";
import mongoose from "mongoose";
import { Task } from "../models/Task";
import { AuthRequest } from "../middleware/auth.middleware";

function requireUserId(req: AuthRequest, res: Response): string | null {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized (missing userId)" });
    return null;
  }
  return userId;
}

function requireTaskId(req: AuthRequest, res: Response): mongoose.Types.ObjectId | null {
  const id = req.params?.id;

  if (!id || typeof id !== "string") {
    res.status(400).json({ message: "Task id is required" });
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid task id" });
    return null;
  }

  return new mongoose.Types.ObjectId(id);
}

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { title, description, dueDate, priority } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "Title required" });
    }

    const task = await Task.create({
      user: new mongoose.Types.ObjectId(userId),
      title: title.trim(),
      description,
      dueDate,
      priority,
    });

    return res.status(201).json({ message: "Task created", task });
  } catch (err) {
    return res.status(500).json({ message: "Create task failed", error: err });
  }
}

export async function getTasks(req: AuthRequest, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ message: "Get tasks failed", error: err });
  }
}

export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const taskId = requireTaskId(req, res);
    if (!taskId) return;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: userId },
      { $set: req.body },
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });

    return res.status(200).json({ message: "Task updated", task });
  } catch (err) {
    return res.status(500).json({ message: "Update task failed", error: err });
  }
}

export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const taskId = requireTaskId(req, res);
    if (!taskId) return;

    const task = await Task.findOneAndDelete({ _id: taskId, user: userId });

    if (!task) return res.status(404).json({ message: "Task not found" });

    return res.status(200).json({ message: "Task deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Delete task failed", error: err });
  }
}
