const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const InventoryItem = require('../models/InventoryItem');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes in this file
router.use(auth);

// Middleware to restrict access to Admins and Technicians
const adminOrTechOnly = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'technician') {
        return res.status(403).json({ msg: 'Access denied. Admins or Technicians only.' });
    }
    next();
};

// Helper function to extract all non-empty serial numbers from an allocation document
const getSerialNumbers = (doc) => {
    const serialFields = [
        'monitorSerialNo', 'kbSerialNo', 'mouseSerialNo', 'upsSerialNo',
        'cpuSerialNo', 'penTabSn', 'headphoneSn', 'laptopSerialNo'
    ];
    const serials = new Set();
    for (const field of serialFields) {
        if (doc[field] && typeof doc[field] === 'string' && doc[field].trim()) {
            serials.add(doc[field].trim());
        }
    }
    return Array.from(serials);
};


// @route   GET /api/allocations
// @desc    Get all allocation records
// @access  Private (Admin/Technician)
router.get('/', async (req, res) => {
    try {
        // Regular users should not see all allocations
        if (req.user.role === 'employee') return res.json([]);
        
        const allocationRecords = await Allocation.find().sort({ employeeName: 1 });
        return res.json(allocationRecords);
    } catch (err) {
        console.error('--- 🚨 API ERROR in GET /api/allocations: ---', err);
        return res.status(500).send('Server Error');
    }
});


// @route   POST /api/allocations
// @desc    Create a new allocation record
// @access  Private (Admin/Technician)
router.post('/', adminOrTechOnly, async (req, res) => {
    try {
        const { employeeId } = req.body;
        const user = await User.findOne({ employeeId });

        if (!user) {
            return res.status(404).json({ message: 'User with given Employee ID not found.' });
        }

        req.body.employeeName = user.name;
        req.body.user = user._id; // Ensure the user ObjectId is linked

        // Clean up the body to remove empty fields before creating the document
        const cleanBody = { ...req.body };
        Object.keys(cleanBody).forEach(key => {
            if (cleanBody[key] === null || cleanBody[key] === '') {
                delete cleanBody[key];
            }
        });
        
        const serialsToAssign = getSerialNumbers(cleanBody);

        if (serialsToAssign.length > 0) {
            await InventoryItem.updateMany(
                { serialNumber: { $in: serialsToAssign } },
                { $set: { status: 'Assigned', assignedTo: user._id } }
            );
        }

        const newAllocation = new Allocation(cleanBody);
        await newAllocation.save();
        res.status(201).json(newAllocation);
    } catch (err) {
        console.error('--- 🚨 API ERROR in POST /api/allocations: ---', err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'An allocation for this employee already exists.' });
        }
        res.status(500).json({ message: 'Server Error creating allocation.', error: err.message });
    }
});


// @route   PUT /api/allocations/:id
// @desc    Update an existing allocation record
// @access  Private (Admin/Technician)
router.put('/:id', adminOrTechOnly, async (req, res) => {
    try {
        const { employeeId } = req.body;
        const [oldAllocation, user] = await Promise.all([
            Allocation.findById(req.params.id).lean(),
            User.findOne({ employeeId })
        ]);

        if (!oldAllocation) {
            return res.status(404).json({ msg: 'Allocation not found' });
        }
        if (!user) {
            return res.status(404).json({ msg: 'User not found for given Employee ID' });
        }

        const oldSerials = new Set(getSerialNumbers(oldAllocation));
        const newSerials = new Set(getSerialNumbers(req.body));

        const serialsToAssign = [...newSerials].filter(sn => !oldSerials.has(sn));
        const serialsToUnassign = [...oldSerials].filter(sn => !newSerials.has(sn));

        if (serialsToAssign.length > 0) {
            await InventoryItem.updateMany(
                { serialNumber: { $in: serialsToAssign } },
                { $set: { status: 'Assigned', assignedTo: user._id } }
            );
        }
        if (serialsToUnassign.length > 0) {
            await InventoryItem.updateMany(
                { serialNumber: { $in: serialsToUnassign } },
                { $set: { status: 'Unassigned' }, $unset: { assignedTo: "" } }
            );
        }

        const updatePayload = { $set: {}, $unset: {} };
        req.body.employeeName = user.name;

        // Create a set of all possible keys from both old and new data
        const allKeys = new Set([...Object.keys(oldAllocation), ...Object.keys(req.body)]);

        for (const key of allKeys) {
            // Skip internal MongoDB fields
            if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt') continue;
            
            const newValue = req.body[key];
            if (newValue !== null && newValue !== '' && newValue !== undefined) {
                updatePayload.$set[key] = newValue;
            } else {
                // If the field exists in the schema and is now empty, unset it
                if (Allocation.schema.path(key)) {
                    updatePayload.$unset[key] = "";
                }
            }
        }
        
        if (Object.keys(updatePayload.$set).length === 0) delete updatePayload.$set;
        if (Object.keys(updatePayload.$unset).length === 0) delete updatePayload.$unset;

        const updatedAllocation = await Allocation.findByIdAndUpdate(
            req.params.id, 
            updatePayload, 
            { new: true, runValidators: true }
        );
        
        res.json(updatedAllocation);
    } catch (err) {
        console.error('--- 🚨 API ERROR in PUT /api/allocations/:id: ---', err);
        res.status(500).json({ message: 'Server Error updating allocation.', error: err.message });
    }
});


// @route   DELETE /api/allocations/:id
// @desc    Delete an allocation and unassign associated inventory
// @access  Private (Admin/Technician)
router.delete('/:id', adminOrTechOnly, async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ msg: 'Allocation not found' });
    }

    const serialsToUnassign = getSerialNumbers(allocation);

    if (serialsToUnassign.length > 0) {
        await InventoryItem.updateMany(
            { serialNumber: { $in: serialsToUnassign } },
            { $set: { status: 'Unassigned' }, $unset: { assignedTo: "" } }
        );
    }
    
    await Allocation.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Allocation deleted and associated inventory unlinked' });
  } catch (err) {
    console.error('Error deleting allocation and resetting inventory:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// @route   GET /api/allocations/my-assets
// @desc    Get the logged-in user's allocated assets
// @access  Private (All authenticated users)
router.get('/my-assets', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const allocation = await Allocation.findOne({ user: user._id }); // Search by user ObjectId
        if (!allocation) {
            return res.json({}); // Not an error, just no assets allocated
        }
        res.json(allocation);
    } catch (err) {
        console.error('Error fetching my-assets:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});


// --- THIS IS THE CORRECTED ROUTE FOR THE USER SNAPSHOT MODAL ---
// @route   GET /api/allocations/user/:userId
// @desc    Get all assets for a specific user from their flat allocation document
// @access  Private (Admin/Technician)
router.get('/user/:userId', adminOrTechOnly, async (req, res) => {
    try {
        const allocation = await Allocation.findOne({ user: req.params.userId });

        // If no allocation document exists for the user, return an empty array.
        // This is expected and correct behavior.
        if (!allocation) {
            return res.json([]);
        }
        
        // The frontend expects an array of asset objects. We manually build this array
        // from the fields in the single, flat allocation document.
        const allocatedAssets = [];
        
        if (allocation.monitorMake) allocatedAssets.push({ _id: 'monitor', componentId: { name: allocation.monitorMake, serialNumber: allocation.monitorSerialNo } });
        if (allocation.keyboardMake) allocatedAssets.push({ _id: 'keyboard', componentId: { name: allocation.keyboardMake, serialNumber: allocation.kbSerialNo } });
        if (allocation.mouseMake) allocatedAssets.push({ _id: 'mouse', componentId: { name: allocation.mouseMake, serialNumber: allocation.mouseSerialNo } });
        if (allocation.cpuBox) allocatedAssets.push({ _id: 'cpu', componentId: { name: allocation.cpuBox, serialNumber: allocation.cpuSerialNo } });
        if (allocation.upsMake) allocatedAssets.push({ _id: 'ups', componentId: { name: allocation.upsMake, serialNumber: allocation.upsSerialNo } });
        if (allocation.penTabMake) allocatedAssets.push({ _id: 'pentab', componentId: { name: allocation.penTabMake, serialNumber: allocation.penTabSn } });
        if (allocation.headphoneMake) allocatedAssets.push({ _id: 'headphone', componentId: { name: allocation.headphoneMake, serialNumber: allocation.headphoneSn } });
        if (allocation.laptopMake) allocatedAssets.push({ _id: 'laptop', componentId: { name: allocation.laptopMake, serialNumber: allocation.laptopSerialNo } });

        res.json(allocatedAssets);

    } catch (err) {
        console.error("Error in GET /api/allocations/user/:userId :", err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;