import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Todo } from '../types/todo';
import { todoService } from '../services/todoService';

const router = express.Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Get all todos
router.get('/todos', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const todos = await todoService.getTodos();
  res.json(todos);
}));

// Get a single todo
router.get('/todos/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const todo = await todoService.getTodo(req.params.id as string);
  res.json(todo);
}));

// Create a new todo
router.post('/todos', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { title, completed } = req.body as { title: string; completed?: boolean };
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  const todo = await todoService.createTodo(title, completed);
  res.status(201).json(todo);
}));

// Update a todo
router.put('/todos/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const todo = await todoService.updateTodo(req.params.id as string, req.body as Partial<Todo>);
  res.json(todo);
}));

// Delete a todo
router.delete('/todos/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await todoService.deleteTodo(req.params.id as string);
  res.status(204).send();
}));

export default router; 