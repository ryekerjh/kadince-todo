import express from 'express';
import { Todo } from '../types/todo';
import { todoService } from '../services/todoService';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get all todos
router.get('/todos', async (req, res) => {
  try {
    const todos = await todoService.getTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Get a single todo
router.get('/todos/:id', async (req, res) => {
  try {
    const todo = await todoService.getTodo(req.params.id);
    res.json(todo);
  } catch (error) {
    res.status(404).json({ error: 'Todo not found' });
  }
});

// Create a new todo
router.post('/todos', async (req, res) => {
  try {
    const { title, completed } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const todo = await todoService.createTodo(title, completed);
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update a todo
router.put('/todos/:id', async (req, res) => {
  try {
    const todo = await todoService.updateTodo(req.params.id, req.body);
    res.json(todo);
  } catch (error) {
    res.status(404).json({ error: 'Todo not found' });
  }
});

// Delete a todo
router.delete('/todos/:id', async (req, res) => {
  try {
    await todoService.deleteTodo(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Todo not found' });
  }
});

export default router; 