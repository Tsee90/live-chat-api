const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.createUser = async function ({
  username,
  email,
  password,
  role = 'guest',
  banned = false,
}) {
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required');
  }

  try {
    return await prisma.user.create({
      data: { username, email, password, role, banned },
    });
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

module.exports.getUserById = async function (userId) {
  if (!userId) throw new Error('User ID is required');

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: { croom: true, messages: true },
    });
  } catch (error) {
    throw new Error(`Failed to retrieve user: ${error.message}`);
  }
};

module.exports.getUserByName = async function (username) {
  if (!username) throw new Error('Username is required');
  try {
    return await prisma.user.findUnique({
      where: { username },
      include: { croom: true, messages: true },
    });
  } catch (error) {
    console.log('throwing error', error);
    throw new Error(`Failed to find user ${error.message}`);
  }
};

module.exports.updateUser = async function ({
  userId,
  username,
  email,
  password,
  role,
  banned,
}) {
  if (!userId) throw new Error('User ID is required');

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { username, email, password, role, banned },
    });
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

module.exports.deleteUser = async function (userId) {
  if (!userId) throw new Error('User ID is required');

  try {
    return await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

module.exports.getAllUsers = async function () {
  try {
    return await prisma.user.findMany();
  } catch (error) {
    throw new Error(`Failed to retrieve users: ${error.message}`);
  }
};
