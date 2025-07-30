// src/routes/ticketRoutes.js

const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User'); // Import the User model to filter by user name
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

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
router.get('/user-stats/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the user exists first (optional but good practice)
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }

    // Use Promise.all to run counting queries in parallel for better performance
    const [total, open, closed] = await Promise.all([
      Ticket.countDocuments({ createdBy: userId }),
      Ticket.countDocuments({ createdBy: userId, status: 'Open' }),
      Ticket.countDocuments({ createdBy: userId, status: 'Closed' })
    ]);

    res.json({ total, open, closed });

  } catch (err) {
    console.error("Error fetching user ticket stats:", err.message); // Log the specific error
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server Error' }); // Send a JSON response for errors
  }
});
router.post('/batch-delete', admin, async (req, res) => {
  try {
    const { ids } = req.body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Ticket IDs must be provided as a non-empty array.' });
    }

    // Use Mongoose deleteMany to remove all documents matching the IDs
    const result = await Ticket.deleteMany({
      _id: { $in: ids }, // The $in operator matches any of the values specified in an array
    });

    if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'No matching tickets found to delete.' });
    }

    res.status(200).json({
      message: `${result.deletedCount} ticket(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error during batch deletion:', error);
    res.status(500).json({ message: 'Server error during batch deletion.' });
  }
});


module.exports = router;