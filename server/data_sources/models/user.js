const Sequelize = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const logger = require("../../utilities/logger");
const { UserInputError } = require("apollo-server-express");
const {
  SECRET_KEY,
  SALT_ROUNDS,
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
} = require("../../utilities/auth");

/**
 * Signs a token
 * @param {Object} payload the token payload
 * @param {Object=} options signing options
 * @return {Promise<string>} signed JWT
 */
function signToken({ payload, options = {} }) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      SECRET_KEY,
      {
        algorithm: "HS256",
        ...options,
      },
      (err, token) => {
        if (err) {
          reject(err);
        }
        resolve(token);
      },
    );
  });
}

/**
 * Defines the User model
 */
class User extends Sequelize.Model {
  /**
   * Authenticates a set of credentials and returns the matching user.
   * @param {Object} credentials The users credentials
   * @return {Promise<User>} The authenticated user
   */
  static async authenticate(credentials) {
    const { email, password } = credentials;
    const user = await this.findOne({ where: { email } });
    if (user && user.checkPassword(password)) {
      return user;
    }
    throw new UserInputError("Email or password incorrect");
  }

  /**
   * Hash a password
   * @param {string} password A plain-text password
   * @return {Promise<string>} A password hash
   */
  static _hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a password meets requirements
   * @param {string} password A plain-text password
   */
  static _verifyPassword(password) {
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
  }

  /**
   * Verifies & Hashes
   * @param {string} password A plain-text password
   * @return {Promise<string>} A password hash
   */
  static verifyAndHashPassword(password) {
    this._verifyPassword(password);
    return this._hashPassword(password);
  }

  /**
   * Verifies tokens
   * @param {string} token - The token to verify
   * @param {Object} options - verification options
   * @return {Promise} Resolves to a decoded token
   */
  static async _verifyToken({ token, options = {} }) {
    if (!token) {
      throw new Error("Authentication required.");
    }

    let decodedToken;
    try {
      decodedToken = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          SECRET_KEY,
          {
            algorithms: ["HS256"],
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE,
            ...options,
          },
          (err, decoded) => {
            if (err) reject(err);
            resolve(decoded);
          },
        );
      });
    } catch (err) {
      const verificationErrors = [
        "TokenExpiredError",
        "JsonWebTokenError",
        "NotBeforeError",
      ];

      // Log the error if it wasn't one of the standard verification errors
      if (!verificationErrors.includes(err.name)) {
        logger.error(err);
      }

      throw err;
    }

    if (!decodedToken || !decodedToken.sub) {
      throw new Error("Invalid token.");
    }

    return decodedToken;
  }

  /**
   * Verifies user refresh tokens
   * @param {string} token The refresh token
   * @return {Promise<Object>} The decoded token
   */
  static async verifyRefreshToken(token) {
    return this._verifyToken({ token }).then(async decodedToken => {
      const { Session } = this.sequelize.models;
      const session = await Session.findByPk(decodedToken.jti);
      if (!session) {
        throw Error("Invalid token.");
      }
      return decodedToken;
    });
  }

  /**
   * Verifies user access tokens
   * @param {string} token The access token
   * @return {Promise<Object>} The decoded token
   */
  static async verifyAccessToken(token) {
    return this._verifyToken({ token });
  }

  /**
   * Returns a user from a valid token
   * @param {string} token - The token to use to get the user
   * @return {Promise} Resolves to a user instance
   */
  static async getUserFromToken(token) {
    const decodedToken = await this._verifyToken({ token });

    const user = await this.findByPk(decodedToken.sub);
    if (!user) {
      throw new Error("Failed to get user tk.");
    }

    return user;
  }

  /**
   * Revoke an issued refresh token
   * @param {string} token - The refresh token to revoke
   */
  static async revokeRefreshToken(token) {
    const { Session } = this.sequelize.models;
    const decodedToken = await this.verifyRefreshToken(token);

    const destroyedSessionCount = await Session.destroy({
      where: { id: decodedToken.jti },
    });
    if (!destroyedSessionCount) {
      throw new Error("Failed to delete session.");
    }
  }

  /**
   * Registers a new user
   * @param {Object} newUser - User registration input
   * @param {string} newUser.name - The users name
   * @param {string} newUser.email - A unique email
   * @param {string} newUser.password - The users password
   * @return {Promise} Resolves to a new user instance
   */
  static async register(newUser) {
    const { name, email, password } = newUser;
    const existingUser = await this.count({ where: { email } });
    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }

    let hashedPassword;
    try {
      hashedPassword = await this.verifyAndHashPassword(password);
    } catch (passwordError) {
      throw new UserInputError(passwordError.message);
    }

    return this.create({
      name,
      email,
      password: hashedPassword,
    });
  }

  /**
   * Check a password to see if it matches
   * @param {string} password A plain text password
   * @return {Promise<boolean>} Whether or not the passwords match
   */
  checkPassword(password) {
    return bcrypt.compare(password, this.password);
  }

  /**
   * Furnishes a new set of refresh & access tokens
   * @return {Promise<Object>} The set of furnished tokens
   */
  async furnishTokens() {
    const { Session } = this.sequelize.models;

    const session = await Session.create({
      userId: this.id,
    });

    if (!session || !session.id) {
      throw new Error("Failed to create session.");
    }

    const refreshTokenPayload = {
      sub: this.id,
      jti: session.id,
      iss: TOKEN_ISSUER,
      aud: TOKEN_AUDIENCE,
    };

    return {
      refreshToken: await signToken({ payload: refreshTokenPayload }),
      accessToken: await this.furnishAccessToken(session.id),
    };
  }

  /**
   * Furnishes a new access token
   * @param {number} sessionId The ID of the session
   * @return {Promise<string>} The access token
   */
  furnishAccessToken(sessionId) {
    const accessTokenPayload = {
      sub: this.id,
      name: this.name,
      jti: sessionId,
      role: this.role,
      iss: TOKEN_ISSUER,
      aud: TOKEN_AUDIENCE,
    };

    return signToken({ payload: accessTokenPayload, options: { expiresIn: '1h' } });
  }

  /**
   * Check whether or not a user has a required role
   * @param {string} role - The role to check for
   * @return {boolean} Whether or not the user has the role
   */
  hasRole(role) {
    switch (role) {
      case "ADMIN":
        return this.role === "ADMIN";
      default:
        return false;
    }
  }
}

module.exports = sequelize => {
  User.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        validate: {
          isEmail: true,
        },
        unique: true,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING,
        validate: {
          notEmpty: true,
          isIn: ["USER", "ADMIN"],
        },
        set(val) {
          this.setDataValue("role", val.toUpperCase());
        },
        defaultValue: "USER",
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: Sequelize.literal("EXTRACT(EPOCH from now())"),
      },
      updatedAt: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: Sequelize.literal("EXTRACT(EPOCH from now())"),
        onUpdate: "SET DEFAULT",
      },
    },
    {
      sequelize,
      tableName: "users",
    },
  );
  return User;
};
