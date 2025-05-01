import express, { RequestHandler } from 'express';

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
const getAllTodos: RequestHandler = (req, res): void => {
  res.json(todos);
};

// Get todo by id
const getTodoById: RequestHandler = (req, res): void => {
  const todo = todos.find(t => t.id === req.params.id);
  if (!todo) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }
  res.json(todo);
};

// Create todo
const createTodo: RequestHandler = (req, res): void => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
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
};

// Update todo
const updateTodo: RequestHandler = (req, res): void => {
  const { title, completed } = req.body;
  const todoIndex = todos.findIndex(t => t.id === req.params.id);

  if (todoIndex === -1) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }

  const updatedTodo = {
    ...todos[todoIndex],
    title: title ?? todos[todoIndex].title,
    completed: completed ?? todos[todoIndex].completed,
    updatedAt: new Date()
  };

  todos[todoIndex] = updatedTodo;
  res.json(updatedTodo);
};

// Delete todo
const deleteTodo: RequestHandler = (req, res): void => {
  const todoIndex = todos.findIndex(t => t.id === req.params.id);
  
  if (todoIndex === -1) {
    res.status(404).json({ error: 'Todo not found' });
    return;
  }

  todos.splice(todoIndex, 1);
  res.status(204).send();
};

// Register routes
router.get('/', getAllTodos);
router.get('/:id', getTodoById);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

export default router;
