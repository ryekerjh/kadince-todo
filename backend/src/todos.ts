import express, { Request, Response } from 'express';

const router = express.Router();

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for development
let todos: Todo[] = [];

// Get all todos
router.get('/', (req: Request, res: Response) => {
  res.json(todos);
});

// Get todo by id
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const todo = todos.find(t => t.id === req.params.id);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.json(todo);
});

// Create todo
router.post('/', (req: Request<{}, {}, { title: string }>, res: Response) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTodo: Todo = {
    id: Date.now().toString(),
    title,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// Update todo
router.put('/:id', (req: Request<{ id: string }, {}, Partial<Todo>>, res: Response) => {
  const { title, completed } = req.body;
  const todoIndex = todos.findIndex(t => t.id === req.params.id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const updatedTodo = {
    ...todos[todoIndex],
    title: title ?? todos[todoIndex].title,
    completed: completed ?? todos[todoIndex].completed,
    updatedAt: new Date()
  };

  todos[todoIndex] = updatedTodo;
  res.json(updatedTodo);
});

// Delete todo
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  const todoIndex = todos.findIndex(t => t.id === req.params.id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(todoIndex, 1);
  res.status(204).send();
});

export default router;
