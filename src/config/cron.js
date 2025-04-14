const cron = require('node-cron');
const db = require('../queries/roomQueries');

const scheduleRoomExpirationCheck = () => {
  cron.schedule('* * * * *', async () => {
    const result = await db.updateExpiredRooms();
  });
};
const scheduleEmptyRoomCleanup = () => {
  cron.schedule('*/5 * * * *', async () => {
    const result = await db.deleteEmptyRooms();
  });
};

module.exports = { scheduleRoomExpirationCheck, scheduleEmptyRoomCleanup };
