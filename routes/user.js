// routes/user.js
const express = require('express');
const User = require('../models/user');
const Task = require('../models/task');
const buildQueryParams = require('../utils/queryHandler');
const router = express.Router();

// GET all users with query support
router.get('/', async (req, res) => {
    try {
        const { query, options } = buildQueryParams(req);

        if (options.count) {
            const count = await User.countDocuments(query || {});
            return res.status(200).json({ message: 'User count retrieved', data: count });
        }

        const users = await User.find(query || {}, options.select)
            .sort(options.sort)
            .skip(options.skip || 0)
            .limit(options.limit || 0);

        res.status(200).json({ message: 'OK', data: users });
    } catch (err) {
        res.status(400).json({ message: 'Error retrieving users', error: err.message });
    }
});

// GET a user by ID with optional select
router.get('/:id', async (req, res) => {
    try {
        const { query, options } = buildQueryParams(req);
        const user = await User.findById(req.params.id, options.select);
        if (!user) return res.status(404).json({ message: 'User not found', data: null });
        res.status(200).json({ message: 'OK', data: user });
    } catch (err) {
        res.status(400).json({ message: 'Invalid user ID', error: err.message });
    }
});

// POST a new user
router.post("/", async (req, res) => {
    try {
        const { name, email, pendingTasks = [] } = req.body;
        if (!name || !email) throw new Error("Name and email are required");

        const existing = await User.findOne({ email });
        if (existing) throw new Error("Email already exists");

        const newUser = new User({
            name,
            email,
            pendingTasks,
            dateCreated: new Date()
        });

        const savedUser = await newUser.save();
        res.status(201).json({ message: "User created", data: savedUser });
    } catch (error) {
        res.status(400).json({ message: "Error creating user", error: error.message });
    }
});

// PUT (replace) user by ID
router.put("/:id", async (req, res) => {
    try {
        const { name, email, pendingTasks = [] } = req.body;
        if (!name || !email) throw new Error("Name and email are required");

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, pendingTasks },
            { new: true, runValidators: true }
        );

        if (!updatedUser) return res.status(404).json({ message: 'User not found', data: null });

        // Ensure pending tasks are linked
        await Task.updateMany(
            { assignedUser: req.params.id },
            { assignedUserName: name }
        );

        res.status(200).json({ message: 'User updated', data: updatedUser });
    } catch (err) {
        res.status(400).json({ message: 'Error updating user', error: err.message });
    }
});

// DELETE a user and unassign their tasks
router.delete("/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found', data: null });

        await Task.updateMany(
            { assignedUser: req.params.id },
            { assignedUser: '', assignedUserName: 'unassigned' }
        );

        res.status(200).json({ message: 'User deleted and tasks unassigned', data: deletedUser });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting user', error: err.message });
    }
});

module.exports = router;