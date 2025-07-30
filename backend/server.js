require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./middleware/auth'); // ✅ FIX 1: Import the authentication middleware

const app = express();
const server = http.createServer(app);

// --- CORS Configuration ---
// ✅ FIX 2: Corrected the origin array (removed leading comma) and consolidated calls.
const corsOptions = {
  // origin: ["http://localhost:5173", "http://localhost:5174", 'https://itmanagement.bylinelms.com'],
  origin: ['https://itmanagement.bylinelms.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// --- Socket.io Setup ---
const io = new Server(server, {
    cors: corsOptions // You can reuse the same CORS options
});

// --- Middleware ---
app.use(express.json());
app.use((req, res, next) => {
    req.io = io; // Make socket.io available to routes
    next();
});

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected successfully.'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// =================================================================
// ✅ FIX 3: RESTRUCTURED ROUTES FOR PROPER AUTHENTICATION
// =================================================================

// --- PUBLIC ROUTES ---
// These routes are accessible to anyone and do not require a token.
app.use('/api/auth', require('./routes/auth'));
app.use('/uploads', express.static('uploads'));
app.use('/api/upload', require('./routes/upload')); // Assuming upload might be needed publicly

// --- APPLY AUTHENTICATION MIDDLEWARE ---
// Any route defined BELOW this line will be protected and will require a valid token.
app.use(auth);

// --- PROTECTED ROUTES ---
// These routes can only be accessed by authenticated users.
app.use('/api/assets',    require('./routes/assets'));
app.use('/api/tickets',   require('./routes/tickets'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/allocations', require('./routes/allocations'));
app.use('/api/component-types', require('./routes/componentTypes'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/hr-inventory', require('./routes/hrInventory'));
app.use('/api/robotics-inventory', require('./routes/roboticsInventory'));

// =================================================================

// --- Socket.io Connection Logic ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// --- Start Server ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));