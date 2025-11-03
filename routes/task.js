// routes/task.js

const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const User = require('../models/user');
const buildQueryParams = require('../utils/queryHandler');

// GET all tasks with query support
router.get('/', async (req, res) => {
    try {
        console.log("🔍 Incoming request to GET /api/tasks", req.query);

        const { query, options } = buildQueryParams(req);
        console.log("🧠 Parsed query:", query, "Options:", options);

        if (options.count) {
            const count = await Task.countDocuments(query.filter || {});
            return res.status(200).json({ message: 'Task count retrieved', data: count });
        }

        const tasks = await Task.find(query.filter || {}, options.select)
            .sort(options.sort)
            .skip(options.skip || 0)
            .limit(options.limit || 100);

        console.log("✅ Fetched tasks:", tasks.length);
        res.status(200).json({ message: 'OK', data: tasks });
    } catch (err) {
        console.error("❌ Error in GET /api/tasks:", err);
        res.status(400).json({ message: 'Error retrieving tasks', error: err.message });
    }
});

// GET task by ID with optional select
router.get('/:id', async (req, res) => {
    try {
        const { query, options } = buildQueryParams(req);
        const task = await Task.findById(req.params.id, options.select);
        if (!task) return res.status(404).json({ message: 'Task not found', data: null });
        res.status(200).json({ message: 'OK', data: task });
    } catch (err) {
        res.status(400).json({ message: 'Invalid task ID', error: err.message });
    }
});

// POST a new task
router.post('/', async (req, res) => {
    try {
        const { name, description = '', deadline, completed = false, assignedUser = '', assignedUserName = 'unassigned' } = req.body;
        if (!name || !deadline) throw new Error("Name and deadline are required");

        const newTask = new Task({
            name,
            description,
            deadline,
            completed,
            assignedUser,
            assignedUserName,
            dateCreated: new Date()
        });

        const savedTask = await newTask.save();

        // Add to user's pendingTasks if not completed
        if (assignedUser && !completed) {
            await User.findByIdAndUpdate(
                assignedUser,
                { $addToSet: { pendingTasks: savedTask._id } }
            );
        }

        res.status(201).json({ message: 'Task created', data: savedTask });
    } catch (err) {
        res.status(400).json({ message: 'Error creating task', error: err.message });
    }
});

// PUT (update) a task
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found', data: null });

        const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;
        if (!name || !deadline) throw new Error("Name and deadline are required");

        // Remove from previous user's pendingTasks if applicable
        if (task.assignedUser && task.assignedUser !== assignedUser) {
            await User.findByIdAndUpdate(
                task.assignedUser,
                { $pull: { pendingTasks: task._id } }
            );
        }

        // Update task
        task.name = name;
        task.description = description;
        task.deadline = deadline;
        task.completed = completed;
        task.assignedUser = assignedUser || '';
        task.assignedUserName = assignedUserName || 'unassigned';
        await task.save();

        // Add to new user's pendingTasks if not completed
        if (assignedUser && !completed) {
            await User.findByIdAndUpdate(
                assignedUser,
                { $addToSet: { pendingTasks: task._id } }
            );
        }

        res.status(200).json({ message: 'Task updated', data: task });
    } catch (err) {
        res.status(400).json({ message: 'Error updating task', error: err.message });
    }
});

// DELETE task and update user’s pendingTasks
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found', data: null });

        // Remove task from user's pendingTasks
        if (task.assignedUser) {
            await User.findByIdAndUpdate(
                task.assignedUser,
                { $pull: { pendingTasks: task._id } }
            );
        }

        res.status(200).json({ message: 'Task deleted and user updated', data: task });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting task', error: err.message });
    }
});

module.exports = () => router;
