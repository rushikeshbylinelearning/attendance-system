const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const InventoryItem = require('../models/InventoryItem');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.use(auth);

const adminOrTechOnly = (req, res, next) => {
    // Allowing technician as well, assuming they can manage allocations
    if (req.user.role !== 'admin' && req.user.role !== 'technician') {
        return res.status(403).json({ msg: 'Access denied. Admins or Technicians only.' });
    }
    next();
};

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

// GET all allocations
router.get('/', async (req, res) => {
    try {
        if (req.user.role === 'user') return res.json([]);
        const allocationRecords = await Allocation.find().sort({ employeeName: 1 });
        return res.json(allocationRecords);
    } catch (err) {
        console.error('--- 🚨 API ERROR in GET /api/allocations: ---', err);
        return res.status(500).send('Server Error');
    }
});

// ✅ CORRECTED: POST a new allocation
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
        // Handle unique key violation gracefully
        if (err.code === 11000) {
            return res.status(409).json({ message: 'An allocation for this employee already exists.' });
        }
        res.status(500).json({ message: 'Server Error creating allocation.', error: err.message });
    }
});

// ✅ CORRECTED: PUT (Update) an existing allocation
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

        // The logic for updating inventory status remains the same and is correct.
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
                { $set: { status: 'Unassigned' }, $unset: { assignedTo: "" } } // More robust unassignment
            );
        }

        // --- THIS IS THE FIX ---
        // Instead of passing the whole body, we build a precise update payload.
        // This uses $set for fields with values and $unset for fields that are now empty.
        const updatePayload = { $set: {}, $unset: {} };
        req.body.employeeName = user.name; // ensure name is updated

        for (const key in req.body) {
            if (req.body[key] !== null && req.body[key] !== '') {
                updatePayload.$set[key] = req.body[key];
            } else {
                // If the field exists in the old allocation, unset it
                if (oldAllocation[key] !== undefined) {
                    updatePayload.$unset[key] = "";
                }
            }
        }
        
        // Don't send empty operators to MongoDB
        if (Object.keys(updatePayload.$set).length === 0) delete updatePayload.$set;
        if (Object.keys(updatePayload.$unset).length === 0) delete updatePayload.$unset;


        const updatedAllocation = await Allocation.findByIdAndUpdate(
            req.params.id, 
            updatePayload, 
            { new: true }
        );
        
        res.json(updatedAllocation);
    } catch (err) {
        console.error('--- 🚨 API ERROR in PUT /api/allocations/:id: ---', err);
        res.status(500).json({ message: 'Server Error updating allocation.', error: err.message });
    }
});


// DELETE an allocation
// DELETE Allocation and reset inventory items to 'Unassigned'
router.delete('/:id', async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ msg: 'Allocation not found' });
    }

    const serialFields = [
      { field: 'monitorSerialNo', type: 'Monitor' },
      { field: 'laptopSerialNo', type: 'Laptop' },
      { field: 'cpuSerialNo', type: 'CPU' },
      { field: 'kbSerialNo', type: 'Keyboard' },
      { field: 'mouseSerialNo', type: 'Mouse' },
      { field: 'upsSerialNo', type: 'UPS' },
      { field: 'penTabSn', type: 'Pen Tab' },
      { field: 'headphoneSn', type: 'Headphone' }
    ];

    for (const { field, type } of serialFields) {
      const serial = allocation[field];
      if (serial) {
        const updated = await InventoryItem.findOneAndUpdate(
          { serialNumber: serial, componentType: type },
          { status: 'Unassigned', assignedTo: null },
          { new: true }
        );
        if (!updated) {
          console.warn(`Inventory item not found or not updated for ${type} with S/N ${serial}`);
        }
      }
    }

    await Allocation.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Allocation and associated inventory unlinked' });
  } catch (err) {
    console.error('Error deleting allocation and resetting inventory:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// GET logged-in user's assets
router.get('/my-assets', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const allocation = await Allocation.findOne({ employeeId: user.employeeId });
        if (!allocation) {
            // It's not an error if a user has no assets, just return an empty object
            return res.json({}); 
        }

        res.json(allocation);
    } catch (err) {
        console.error('Error fetching allocations for user:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;