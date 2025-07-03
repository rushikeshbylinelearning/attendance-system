const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const InventoryItem = require('../models/InventoryItem'); // <-- Already here, good.
const User = require('../models/User'); // <-- MUST import User model
const auth = require('../middleware/auth');

router.use(auth);

const adminOrTechOnly = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'technician') {
        return res.status(403).json({ msg: 'Access denied. Admins or Technicians only.' });
    }
    next();
};

const getSerialNumbers = (doc) => {
    const serialFields = ['Monitor Serial No', 'KB Serial No', 'Mouse Serial No', 'UPS Serial No', 'CPU Serial No', 'Serial No', 'Headphone S/N'];
    const serials = [];
    for (const field of serialFields) {
        if (doc[field] && typeof doc[field] === 'string' && doc[field].trim() !== 'N/A' && doc[field].trim() !== '') {
            doc[field].split(/[,&]/).forEach(sn => {
                const trimmedSn = sn.trim();
                if (trimmedSn) serials.push(trimmedSn);
            });
        }
    }
    return serials;
};

// GET all allocations - NO CHANGE
router.get('/', async (req, res) => {
    try {
        if (req.user.role === 'user') return res.json([]);
        const allocationRecords = await Allocation.find().sort({ 'Employee Name': 1 });
        return res.json(allocationRecords);
    } catch (err) {
        console.error('--- 🚨 API ERROR in GET /api/allocations: ---', err);
        return res.status(500).send('Server Error');
    }
});

// POST a new allocation
router.post('/', adminOrTechOnly, async (req, res) => {
    try {
        const user = await User.findOne({ name: req.body['Employee Name'] });
        const serialsToAssign = getSerialNumbers(req.body);

        if (serialsToAssign.length > 0) {
            await InventoryItem.updateMany(
                { serialNumber: { $in: serialsToAssign } },
                { $set: { status: 'Assigned', assignedTo: user ? user._id : null } }
            );
        }

        const newAllocation = new Allocation(req.body);
        await newAllocation.save();
        res.status(201).json(newAllocation);
    } catch (err) {
        console.error('--- 🚨 API ERROR in POST /api/allocations: ---', err);
        res.status(500).send('Server Error');
    }
});

// PUT (Update) an existing allocation
router.put('/:id', adminOrTechOnly, async (req, res) => {
    try {
        const [oldAllocation, user] = await Promise.all([
            Allocation.findById(req.params.id),
            User.findOne({ name: req.body['Employee Name'] })
        ]);

        if (!oldAllocation) {
            return res.status(404).json({ msg: 'Allocation not found' });
        }

        const oldSerials = new Set(getSerialNumbers(oldAllocation.toObject()));
        const newSerials = new Set(getSerialNumbers(req.body));

        const serialsToAssign = [...newSerials].filter(sn => !oldSerials.has(sn));
        const serialsToUnassign = [...oldSerials].filter(sn => !newSerials.has(sn));

        if (serialsToAssign.length > 0) {
            await InventoryItem.updateMany(
                { serialNumber: { $in: serialsToAssign } },
                { $set: { status: 'Assigned', assignedTo: user ? user._id : null } }
            );
        }
        if (serialsToUnassign.length > 0) {
            await InventoryItem.updateMany(
                { serialNumber: { $in: serialsToUnassign } },
                { $set: { status: 'Unassigned', assignedTo: null } }
            );
        }

        const updatedAllocation = await Allocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedAllocation);
    } catch (err) {
        console.error('--- 🚨 API ERROR in PUT /api/allocations/:id: ---', err);
        res.status(500).send('Server Error');
    }
});

// DELETE an allocation (Employee Offboarding)
router.delete('/:id', adminOrTechOnly, async (req, res) => {
    try {
        const allocation = await Allocation.findById(req.params.id);
        if (!allocation) {
            return res.status(404).json({ msg: 'Allocation not found' });
        }

        const serialsToUnassign = getSerialNumbers(allocation.toObject());
        if (serialsToUnassign.length > 0) {
            await InventoryItem.updateMany(
                { serialNumber: { $in: serialsToUnassign } },
                { $set: { status: 'Unassigned', assignedTo: null } } // Clear both status and user link
            );
        }

        await Allocation.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Allocation deleted and assets returned to inventory.' });
    } catch (err) {
        console.error('--- 🚨 API ERROR in DELETE /api/allocations/:id: ---', err);
        res.status(500).send('Server Error');
    }
});

// GET my-assets - NO CHANGE
router.get('/my-assets', async (req, res) => {
    try {
        const loggedInName = req.user.name?.trim().toLowerCase();
        if (!loggedInName) return res.status(400).json({ msg: 'User name not available' });
        
        const allocations = await Allocation.find({ 'Employee Name': { $regex: new RegExp(`^${loggedInName}$`, 'i') } });
        if (!allocations.length) return res.status(404).json({ msg: 'No allocations found for this user.' });

        const enriched = allocations.map(a => ({ ...a.toObject(), 'Employee Email': req.user.email }));
        res.json(enriched);
    } catch (err) {
        console.error('Error fetching allocations for user:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;