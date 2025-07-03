// src/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Allocation = require('../models/Allocation');
const auth = require('../middleware/auth');

router.use(auth);

// Enhanced dashboard stats with more comprehensive data
router.get('/stats', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'technician';

    const [openTickets, totalAssets, usersByRole, totalAllocations] = await Promise.all([
      Ticket.countDocuments({ status: { $regex: /^Open$/i } }),
      Asset.countDocuments(),
      User.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$role", "unknown"] },
            count: { $sum: 1 }
          }
        }
      ]),
      Allocation.countDocuments()
    ]);

    let additionalStats = {};
    if (isAdmin) {
      const [
        closedTickets,
        pendingTickets,
        totalTickets,
        assetCategories,
        recentActivity
      ] = await Promise.all([
        Ticket.countDocuments({ status: { $regex: /^Closed$/i } }),
        Ticket.countDocuments({ status: { $regex: /^In Progress$/i } }),
        Ticket.countDocuments(),
        Asset.aggregate([
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ]),
        Ticket.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name')
      ]);

      additionalStats = {
        closedTickets,
        pendingTickets,
        totalTickets,
        assetCategories: assetCategories.reduce((acc, cat) => {
          acc[cat._id] = cat.count;
          return acc;
        }, {}),
        recentActivity,
        systemHealth: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date()
        }
      };
    }

    let userStats = {};
    if (!isAdmin) {
      const employeeName = req.user.name?.trim();

      const [myAllocations, myTickets, myCompletedTickets] = await Promise.all([
        Allocation.find({ 'Employee Name': { $regex: new RegExp(`^${employeeName}$`, 'i') } }),
        Ticket.find({ createdBy: req.user.id }),
        Ticket.countDocuments({ createdBy: req.user.id, status: { $regex: /^Closed$/i } })
      ]);

      userStats = {
        myAssets: myAllocations.length,
        myTickets: myTickets.length,
        myCompletedTickets,
        myOpenTickets: myTickets.length - myCompletedTickets
      };
    }

    const rolesCount = usersByRole.reduce((acc, role) => {
      acc[role._id] = role.count;
      return acc;
    }, {});

    res.json({
      openTickets,
      totalAssets,
      usersByRole: rolesCount,
      totalAllocations,
      totalUsers: Object.values(rolesCount).reduce((a, b) => a + b, 0),
      ...additionalStats,
      ...userStats,
      lastUpdated: new Date(),
      userRole: req.user.role
    });
  } catch (err) {
    console.error('❌ Dashboard stats error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Live updates for dashboard
router.get('/live-updates', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'technician';

    const [openTickets, closedTickets, pendingTickets, totalAssets, totalAllocations] = await Promise.all([
      Ticket.countDocuments({ status: { $regex: /^Open$/i } }),
      Ticket.countDocuments({ status: { $regex: /^Closed$/i } }),
      Ticket.countDocuments({ status: { $regex: /^In Progress$/i } }),
      Asset.countDocuments(),
      Allocation.countDocuments()
    ]);

    const totalTickets = openTickets + closedTickets + pendingTickets;

    let userSpecificData = {};
    if (!isAdmin) {
      const employeeName = req.user.name?.trim();

      const myAllocations = await Allocation.find({ 'Employee Name': { $regex: new RegExp(`^${employeeName}$`, 'i') } });
      const myTickets = await Ticket.find({ createdBy: req.user.id });

      userSpecificData = {
        myAssets: myAllocations.length,
        myTickets: myTickets.length
      };
    }

    res.json({
      openTickets,
      closedTickets,
      pendingTickets,
      totalTickets,
      totalAssets,
      totalAllocations,
      ...userSpecificData,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('❌ Live updates error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// My Dashboard data for employee view
router.get('/my-dashboard', async (req, res) => {
  try {
    const employeeName = req.user.name?.trim();

    const [myAllocations, myTickets, myCompletedTickets, myOpenTickets] = await Promise.all([
      Allocation.find({ 'Employee Name': { $regex: new RegExp(`^${employeeName}$`, 'i') } }),
      Ticket.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).limit(10),
      Ticket.countDocuments({ createdBy: req.user.id, status: { $regex: /^Closed$/i } }),
      Ticket.countDocuments({ createdBy: req.user.id, status: { $regex: /^Open$/i } })
    ]);

    res.json({
      myAssets: myAllocations.length,
      myTickets: myTickets.length,
      myCompletedTickets,
      myOpenTickets,
      recentTickets: myTickets,
      lastUpdated: new Date()
    });
  } catch (err) {
    console.error('❌ My dashboard error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// ===================================================================
// === THIS IS THE NEW, REQUIRED ROUTE THAT FIXES THE 404 ERROR ===
// ===================================================================
// @route   GET /api/dashboard/summary
// @desc    Get total asset count and counts for each component type efficiently
// @access  Private (uses auth middleware from above)
router.get('/summary', async (req, res) => {
    try {
      // 1. Get total asset count (this is extremely fast)
      const totalAssets = await Asset.countDocuments();
  
      // 2. Get component breakdown using an efficient database aggregation.
      // This is also very fast as it's a single operation on the database.
      const componentCountsResult = await Asset.aggregate([
        {
          // NOTE: Using 'category' as seen in your /stats route. Change to 'componentType' if that is the correct field name in your Asset model.
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            component: '$_id',
            count: 1
          }
        }
      ]);
  
      // 3. Convert the result array to the { componentName: count } format for the frontend
      const componentCounts = componentCountsResult.reduce((acc, item) => {
        if (item.component) {
          acc[item.component] = item.count;
        }
        return acc;
      }, {});
  
      // 4. Send the optimized data back to the frontend in one go.
      res.json({
        totalAssets,
        componentCounts
      });
  
    } catch (err) {
      console.error('❌ Dashboard summary error:', err.message);
      res.status(500).send('Server Error');
    }
  });


module.exports = router;