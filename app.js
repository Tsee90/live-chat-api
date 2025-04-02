const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {
  scheduleRoomExpirationCheck,
  scheduleEmptyRoomCleanup,
} = require('./src/config/cron');
const app = express();

const dotenv = require('dotenv');
const environment = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${environment}` });

const socketHandlers = require('./src/sockets');
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
socketHandlers(io);

app.use(cors({ origin: ['https://chizmiz.live', 'http://localhost:5173'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userRoutes = require('./src/routes/userRoutes');
const roomRoutes = require('./src/routes/roomRoutes');

app.use('/users', userRoutes);
app.use('/rooms', roomRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  scheduleRoomExpirationCheck();
  scheduleEmptyRoomCleanup();
});
