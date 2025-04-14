const cron = require('node-cron');
const db = require('../queries/roomQueries');

const scheduleRoomExpirationCheck = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const result = await db.updateExpiredRooms();
    } catch (error) {
      console.log(error);
    }
  });
};
const scheduleEmptyRoomCleanup = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await db.deleteEmptyRooms();
    } catch (error) {
      console.log(error);
    }
  });
};

module.exports = { scheduleRoomExpirationCheck, scheduleEmptyRoomCleanup };
