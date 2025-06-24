const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/tickets
router.get('/', async (req, res) => {
    try {
        const query = (req.user.role === 'admin' || req.user.role === 'technician') ? {} : { createdBy: req.user.id };
        const tickets = await Ticket.find(query).populate('createdBy', 'name email').populate('assignedTo', 'name email').sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// POST /api/tickets
router.post('/', async (req, res) => {
    const { title, description, priority } = req.body;
    try {
        const newTicket = new Ticket({ title, description, priority, createdBy: req.user.id });
        const ticket = await newTicket.save();
        res.status(201).json(ticket);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PUT /api/tickets/:id
router.put('/:id', async (req, res) => {
    if (req.user.role === 'employee') return res.status(403).json({ msg: 'Not authorized' });
    try {
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
        res.json(ticket);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// DELETE /api/tickets/:id
router.delete('/:id', async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
        res.json({ msg: 'Ticket removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;