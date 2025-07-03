// src/routes/ticketRoutes.js

const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User'); // Import the User model to filter by user name
const auth = require('../middleware/auth');

router.use(auth);

// --- MODIFIED ROUTE ---
// GET /api/tickets - Now handles dynamic filtering from query parameters
router.get('/', async (req, res) => {
    try {
        // 1. Start with a base query to enforce security rules
        const query = (req.user.role === 'admin' || req.user.role === 'technician') 
            ? {} 
            : { createdBy: req.user.id };

        // 2. Dynamically add filters to the query object based on request parameters
        const { status, search, user, date } = req.query;

        // Filter by Status
        if (status && status !== 'all') {
            // Use case-insensitive regex for robust matching
            query.status = { $regex: new RegExp(`^${status}$`, 'i') };
        }

        // Filter by Search Text (in component or issue)
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' }; // Case-insensitive search
            query.$or = [
                { component: searchRegex },
                { issue: searchRegex }
            ];
        }

        // Filter by Creating User's Name (for Admins/Techs)
        if (user && (req.user.role === 'admin' || req.user.role === 'technician')) {
            // First, find user IDs that match the name search
            const users = await User.find({ name: { $regex: user, $options: 'i' } }).select('_id');
            const userIds = users.map(u => u._id);
            
            // Then, filter tickets where createdBy is one of those IDs
            if (userIds.length > 0) {
                query.createdBy = { $in: userIds };
            } else {
                // If no user is found, return no tickets
                return res.json([]);
            }
        }
        
        // Filter by Creation Date
        if (date) {
            const startDate = new Date(date);
            startDate.setUTCHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setUTCHours(23, 59, 59, 999);

            query.createdAt = {
                $gte: startDate,
                $lt: endDate
            };
        }

        // 3. Execute the final, combined query
        const tickets = await Ticket.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });
            
        res.json(tickets);
    } catch (err) {
        console.error("Error fetching tickets:", err);
        res.status(500).send('Server Error');
    }
});


// POST /api/tickets
router.post('/', async (req, res) => {
  try {
    const ticketData = {
      ...req.body,
      createdBy: req.user.id // enforce who created it
    };
    const newTicket = new Ticket(ticketData);
    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (err) {
    console.error("Ticket creation error:", err.message);
    res.status(500).json({ message: err.message }); // return error message to frontend
  }
});


// PUT /api/tickets/:id
router.put('/:id', async (req, res) => {
    if (req.user.role === 'employee' && !req.body.status) { // Allow employees to only update specific fields if needed
        const ticket = await Ticket.findById(req.params.id);
        if (ticket.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
    }

    if (req.user.role === 'employee' && req.body.status) {
        // Prevent employees from changing status unless you allow it
        // For now, we block it.
        return res.status(403).json({ msg: 'Not authorized to change status' });
    }

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