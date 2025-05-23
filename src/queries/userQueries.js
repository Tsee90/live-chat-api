const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.createUser = async function ({
  username,
  email,
  password,
  role = 'user',
  banned = false,
  emailVerified = false,
  verificationCode = null,
}) {
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required');
  }

  try {
    return await prisma.user.create({
      data: {
        username,
        email,
        password,
        role,
        banned,
        emailVerified,
        verificationCode,
      },
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
    return await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
      include: {
        croom: true,
        messages: true,
      },
    });
  } catch (error) {
    throw new Error(`Failed to find user: ${error.message}`);
  }
};

module.exports.getUserByEmail = async function (email) {
  if (!email) throw new Error('Username is required');
  try {
    return await prisma.user.findUnique({
      where: { email },
      include: { croom: true, messages: true },
    });
  } catch (error) {
    throw new Error(`Failed to find user ${error.message}`);
  }
};

module.exports.updateUser = async function ({
  id,
  username,
  email,
  password,
  role,
  banned,
  emailVerified,
  verificationCode,
  resetCode,
}) {
  if (!id) throw new Error('User ID is required');

  try {
    return await prisma.user.update({
      where: { id },
      data: {
        username,
        email,
        password,
        role,
        banned,
        emailVerified,
        verificationCode,
        resetCode,
      },
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

module.exports.verifyUser = async function (userId) {
  if (!userId) throw new Error('User ID is required');
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationCode: null,
      },
    });
  } catch (error) {
    throw new Error(`Failed to verify user: ${error.message}`);
  }
};

module.exports.userOnline = async function ({ userId, isOnline }) {
  if (!userId) throw new Error('User ID is required');
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { online: isOnline },
    });
  } catch (error) {
    throw new Error(`Failed to update user online: ${error.message}`);
  }
};
