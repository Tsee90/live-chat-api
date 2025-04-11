const friendsDb = require('../queries/friendshipQueries');
const activeUsers = require('./activeUsers');
async function updateFriends({ userId, io }) {
  try {
    const friendsList = await friendsDb.getUserFriends(userId);
    const onlyFriendsList = friendsList.map((friendship) => {
      if (friendship.senderId === userId) {
        return {
          id: friendship.receiver.id,
        };
      } else {
        return {
          id: friendship.sender.id,
        };
      }
    });

    onlyFriendsList.forEach((friend) => {
      const target = activeUsers.get(friend.id);
      if (target) {
        io.to(target.socketId).emit('friend_updated');
      }
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = { updateFriends };
