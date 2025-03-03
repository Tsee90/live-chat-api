const cron = require('node-cron');
const db = require('../queries/roomQueries');

const scheduleRoomExpirationCheck = () => {
  cron.schedule('* * * * *', async () => {
    const result = await db.updateExpiredRooms();
    const result2 = await db.updateEmptyRooms();
    console.log(`Deactivated ${result.count} expired rooms.`);
  });
};
const scheduleEmptyRoomCleanup = () => {
  cron.schedule('*/5 * * * *', async () => {
    const result = await db.updateEmptyRooms();
    console.log(`Removed ${result.count} empty rooms.`);
  });
};

module.exports = { scheduleRoomExpirationCheck, scheduleEmptyRoomCleanup };
