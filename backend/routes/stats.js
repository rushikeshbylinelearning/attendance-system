const express = require('express');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');

const router = express.Router();

// Get admin dashboard statistics
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Get all tickets and users
    const [tickets, users] = await Promise.all([
      Ticket.find({}),
      User.find({ isActive: true })
    ]);

    // Calculate basic stats
    const totalTickets = tickets.length;
    const totalUsers = users.filter(u => u.role === 'user').length;
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
    const closedTickets = tickets.filter(t => t.status === 'Closed').length;
    const criticalTickets = tickets.filter(t => t.priority === 'Critical').length;

    // Calculate resolution rate
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

    // Component breakdown
    const componentStats = tickets.reduce((acc, ticket) => {
      acc[ticket.component] = (acc[ticket.component] || 0) + 1;
      return acc;
    }, {});

    // Priority breakdown
    const priorityStats = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    // Status breakdown
    const statusStats = {
      'Open': openTickets,
      'In Progress': inProgressTickets,
      'Resolved': resolvedTickets,
      'Closed': closedTickets
    };

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentTickets = tickets.filter(ticket => 
      new Date(ticket.createdAt) >= weekAgo
    ).length;

    // Average resolution time
    const resolvedTicketsWithTime = tickets.filter(t => t.resolvedAt);
    const avgResolutionTime = calculateAvgResolutionTime(resolvedTicketsWithTime);

    // Top users by ticket count
    const userTicketCounts = tickets.reduce((acc, ticket) => {
      const userId = ticket.createdBy._id.toString();
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {});

    const topUsers = Object.entries(userTicketCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => {
        const user = users.find(u => u._id.toString() === userId);
        return {
          user: user ? { name: user.name, email: user.email, employeeId: user.employeeId } : null,
          ticketCount: count
        };
      });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTickets = tickets.filter(ticket => {
        const ticketDate = new Date(ticket.createdAt);
        return ticketDate >= monthStart && ticketDate <= monthEnd;
      });

      monthlyTrend.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        tickets: monthTickets.length,
        resolved: monthTickets.filter(t => t.status === 'Resolved').length
      });
    }

    const stats = {
      totalTickets,
      totalUsers,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      componentStats,
      priorityStats,
      statusStats,
      recentTickets,
      avgResolutionTime,
      topUsers,
      monthlyTrend,
      userSatisfaction: 94, // Mock data - implement survey system
      avgResponseTime: '2.3 hours' // Mock data - calculate from actual data
    };

    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Get user dashboard statistics
router.get('/user/:id?', auth, async (req, res) => {
  try {
    const userId = req.params.id || req.user.userId;

    // Check permissions
    if (req.user.role !== 'admin' && userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's tickets
    const tickets = await Ticket.find({ createdBy: userId });

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
    const closedTickets = tickets.filter(t => t.status === 'Closed').length;

    // Resolution rate
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

    // Priority breakdown
    const priorityStats = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    // Component breakdown
    const componentStats = tickets.reduce((acc, ticket) => {
      acc[ticket.component] = (acc[ticket.component] || 0) + 1;
      return acc;
    }, {});

    // Average resolution time
    const resolvedTicketsWithTime = tickets.filter(t => t.resolvedAt);
    const avgResolutionTime = calculateAvgResolutionTime(resolvedTicketsWithTime);

    // Last activity
    const lastActivity = tickets.length > 0 
      ? Math.max(...tickets.map(t => new Date(t.updatedAt)))
      : new Date(user.createdAt);

    const stats = {
      userId: user._id,
      userName: user.name,
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      priorityStats,
      componentStats,
      avgResolutionTime,
      lastActivity: new Date(lastActivity).toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
});

// Helper function to calculate average resolution time
function calculateAvgResolutionTime(resolvedTickets) {
  if (resolvedTickets.length === 0) return '0 hours';
  
  const totalTime = resolvedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.createdAt);
    const resolved = new Date(ticket.resolvedAt);
    return sum + (resolved - created);
  }, 0);
  
  const avgTimeMs = totalTime / resolvedTickets.length;
  const avgTimeHours = Math.round(avgTimeMs / (1000 * 60 * 60) * 10) / 10;
  
  return `${avgTimeHours} hours`;
}

module.exports = router;