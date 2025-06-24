const express = require('express');
const Asset = require('../models/Asset');
const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/assets
router.get('/', async (req, res) => {
    try {
        const assets = await Asset.find().populate('assignedTo', 'name email');
        res.json(assets);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// POST /api/assets
router.post('/', async (req, res) => {
    try {
        const newAsset = new Asset({ ...req.body });
        const asset = await newAsset.save();
        res.status(201).json(asset);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PUT /api/assets/:id
router.put('/:id', async (req, res) => {
    try {
        const asset = await Asset.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!asset) return res.status(404).json({ msg: 'Asset not found' });
        res.json(asset);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// DELETE /api/assets/:id
router.delete('/:id', async (req, res) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);
        if (!asset) return res.status(404).json({ msg: 'Asset not found' });
        res.json({ msg: 'Asset removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/my', async (req, res) => {
    try {
        // req.user.id comes from our auth middleware
        const myAssets = await Asset.find({ assignedTo: req.user.id });
        res.json(myAssets);
    } catch (err) {
        console.error('Error fetching my assets:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;