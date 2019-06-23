const { ApolloError, UserInputError } = require("apollo-server-express");
const { GraphQLScalarType, Kind } = require("graphql");
const logger = require("../utilities/logger");

module.exports = {
  Date: new GraphQLScalarType({
    name: "Date",
    description: "Returns and expects a Unix timestamp in ** milliseconds **",
    serialize: value => {
      const date = new Date(value);
      return date.getTime();
    },
    parseValue: value => {
      const date = new Date(value);
      return date.getTime();
    },
    parseLiteral: ast => {
      let date;
      const value = Number(ast.value);
      switch (ast.kind) {
        case Kind.INT:
        case Kind.STRING:
          date = new Date(value);
          return date.getTime();
        default:
          return null;
      }
    },
  }),
  Mutation: {
    logIn: async (_, args, context) => {
      const { User } = context.dataSources.models;
      const { email, password } = args;

      return User.authenticate({ email, password })
        .then(async user => {
          const tokens = await user.furnishTokens();
          return { user, tokens };
        })
        .catch(err => {
          throw new ApolloError(err.message, "INVALID_CREDENTIALS");
        });
    },
    logOut: async (_, __, context) => {
      const {
        decodedToken,
        dataSources: {
          models: { Session },
        },
      } = context;

      await Session.destroy({ where: { id: decodedToken.jti } });

      return true;
    },
    refreshAccessToken: async (_, args, context) => {
      const { User } = context.dataSources.models;
      const { refreshToken } = args;

      const user = await User.getUserFromToken(refreshToken);
      return User.verifyRefreshToken(refreshToken).then(
        async decodedRefreshToken => {
          const newAccessToken = await user.furnishAccessToken(
            decodedRefreshToken.jti,
          );
          return {
            refreshToken,
            accessToken: newAccessToken,
          };
        },
      );
    },
    signUp: async (_, args, context) => {
      const { User } = context.dataSources.models;
      const { newUserInput } = args;

      return User.register(newUserInput)
        .then(async user => {
          const tokens = await user.furnishTokens();
          return { user, tokens };
        })
        .catch(err => {
          throw new ApolloError(err.message, "INVALID_USER_INPUT");
        });
    },
    addPreRegisteredUser: async (_, args, context) => {
      const { PreRegisteredUser } = context.dataSources.models;
      const { preRegisteredUser } = args;
      
      return PreRegisteredUser.create(preRegisteredUser);
    },
    changeUserRole: async (_, args, context) => {
      const { User } = context.dataSources.models;
      const { id, role } = args;

      const user = await User.findByPk(id);
      if (!user) {
        throw new UserInputError("Invalid user ID");
      }

      return user
        .update({ role })
        .then(updatedUser => updatedUser)
        .catch(err => {
          logger.error(err);
          throw new ApolloError(
            "INTERNAL SERVER ERROR",
            "INTERNAL_SERVER_ERROR",
          );
        });
    },
  },
  Query: {
    me: async (_, __, context) => {
      return context.getCurrentUser();
    },
    user: async (_, args, context) => {
      const { User } = context.dataSources.models;

      const currentUser = await context.getCurrentUser();

      if (args.userID === currentUser.id) {
        // If user requesting profile is requesting their own profile
        return await User.getUser(args.userID);
      } else if (currentUser.role === "ADMIN") {
        // If user requesting profile is an admin
        return await User.getUser(args.userID);
      } else {
        throw new ForbiddenError(
          "You do not have permission to view this profile",
        );
      }
    },
    userList: async (_, __, context) => {
      const { User } = context.dataSources.models;
      return User.findAll({ raw: true });
    },
    preRegisteredUserList: async (_, __, context) => {
      const { PreRegisteredUser } = context.dataSources.models;
      return PreRegisteredUser.findAll({ raw: true });
    }
  },
};
