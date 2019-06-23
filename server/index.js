const express = require("express");
const cors = require("cors");
const { ApolloServer, ApolloError } = require("apollo-server-express");
const http = require("http");
const morgan = require("./utilities/morgan");
const logger = require("./utilities/logger");
const { initializeDatabase, initializeDataSources } = require("./data_sources");
const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const schemaDirectives = require("./schema_directives");

const {
  PORT = 3000,
  NODE_ENV = "development",
} = process.env;

/**
 * Entry point for the server
 */
async function startServer() {
  logger.info("Initializing server");
  const app = express();
  const corsOptions = {
    methods: ["GET", "PUT", "POST"],
    credentials: false,
    preflightContinue: false,
    origin: [],
  };
  app.use(cors(corsOptions));
  app.use(morgan());

  logger.info("Initializing database client");
  const sequelize = await initializeDatabase();

  logger.info("Initializing Apollo Server");
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives,
    dataSources: initializeDataSources,
    context: async ({ req }) => ({
      token: req.headers.authorization,
      logger,
    }),
    formatError: err => {
      const userErrors = ["UNAUTHENTICATED", "UNAUTHORIZED", "BAD_USER_INPUT"];
      if (!userErrors.includes(err.code)) {
        logger.error(err);

        // Mask errors in production
        if (NODE_ENV === "production") {
          return new ApolloError(
            "An error occurred. Please try again later.",
            "INTERNAL_SERVER_ERROR",
          );
        }
      }

      return err;
    },
    // Exposed on /.well-known/apollo/server-health
    onHealthCheck: () =>
      new Promise((resolve, reject) => {
        sequelize
          .authenticate()
          .then(resolve)
          .catch(reject);
      }),
  });
  apollo.applyMiddleware({ app, path: "/graphql", cors: corsOptions });

  const server = http.createServer(app);
  server.listen({ port: PORT }, () => {
    logger.info(`Server ready on :${PORT}/graphql`);
  });
}

startServer();
