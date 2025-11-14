const { v4: uuidv4 } = require('uuid');

class User {
    constructor(email, passwordHash, name, roles = ['viewer']) {
        this.id = uuidv4();
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.roles = Array.isArray(roles) ? roles : [roles];
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }
}

module.exports = User;