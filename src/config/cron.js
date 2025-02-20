const cron = require('node-cron');
const db = require('../queries/roomQueries');

const scheduleRoomExpirationCheck = () => {
  cron.schedule('* * * * *', async () => {
    const result = await db.updateExpiredRooms();
    console.log(`Deactivated ${result.count} expired rooms.`);
  });
};

module.exports = { scheduleRoomExpirationCheck };
