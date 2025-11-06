const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, 'fakeDb.json');

async function loadData() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveData(users) {
  await fs.writeFile(DB_FILE, JSON.stringify(users, null, 2));
}

async function addUser(user) {
  const users = await loadData();
  users[user.id] = user;
  await saveData(users);
  return user;
}

async function getUserByEmail(email) {
  const users = await loadData();
  return Object.values(users).find(user => user.email === email);
}

async function getAllUsers() {
  return await loadData();
}

module.exports = {
  addUser,
  getUserByEmail,
  getAllUsers
};