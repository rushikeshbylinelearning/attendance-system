require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const corsOptions = {
  origin: [ , "http://localhost:5173", "http://localhost:5174", 'https://itmanagement.bylinelms.com'],
  // origin: [ 'https://itmanagement.bylinelms.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


const server = http.createServer(app);

 const io = new Server(server, {
    cors: {
        origin: [ "http://localhost:5173","http://localhost:5174", 'https://itmanagement.bylinelms.com'],
      // origin: ['https://itmanagement.bylinelms.com' ,
        methods: ["GET", "POST"]
    }
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/api/upload', require('./routes/upload'));


app.use((req, res, next) => {
    req.io = io;
    next();
});


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected successfully.'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // exit if DB fails
  });

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/assets',    require('./routes/assets'));
app.use('/api/tickets',   require('./routes/tickets'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/allocations', require('./routes/allocations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/component-types', require('./routes/componentTypes'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/hr-inventory', require('./routes/hrInventory'));
app.use('/uploads', express.static('uploads'));



io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port 5001`));