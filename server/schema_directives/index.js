const { defaultFieldResolver } = require("graphql");
const {
  SchemaDirectiveVisitor,
  ForbiddenError,
} = require("apollo-server-express");

/**
 * Defines the "@auth" schema directive
 */
class AuthDirective extends SchemaDirectiveVisitor {
  /**
   * Defines what should happen when the directive is applied on an object
   * @param {Object} type - The schema object
   */
  visitObject(type) {
    this.ensureFieldsWrapped(type);
    type._requiredAuthRole = this.args.requires;
  }

  /**
   * Defines what should happen when the directive is applied on a field
   * @param {Object} field - The schema field
   * @param {Object} details - An object that contains details about the fields parent
   * @param {Object} details.objectType - The field's parent object
   */
  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredAuthRole = this.args.requires;
  }

  /**
   * Validates that an access token has the necessary role
   * @param {Object} decodedToken - The decoded access token
   * @param {string} role - The role to check for
   * @return {Promise} resolves to a boolean indicating whether or not
   * the desired role was found
   */
  verifyRole(decodedToken, role) {
    switch (role) {
      case "ADMIN":
        return decodedToken.role === "ADMIN";
      default:
        return true;
    }
  }

  /**
   * Wraps a GraphQLObjectType to require authorization
   * @param {Object} objectType - A schema object type
   */
  ensureFieldsWrapped(objectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;

    const fields = objectType.getFields();

    Object.keys(fields).forEach(fieldName => {
      const directive = this;
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;
      field.resolve = async function(...args) {
        // Get the required Role from the field first, falling back
        // to the objectType if no Role is required by the field:
        const requiredRole =
          field._requiredAuthRole || objectType._requiredAuthRole;

        if (!requiredRole) {
          return resolve.apply(this, args);
        }

        const context = args[2];
        const { token, dataSources } = context;
        const { User } = dataSources.models;
        const decodedToken = await User.verifyAccessToken(token);
        if (!directive.verifyRole(decodedToken, requiredRole)) {
          throw new ForbiddenError("You do not have permission");
        }

        // Enrich the context with the decoded token
        context.decodedToken = decodedToken;

        // Add a helper method for getting the current user
        context.getCurrentUser = () => User.getUserFromToken(token);

        return resolve.apply(this, args);
      };
    });
  }
}

module.exports = {
  auth: AuthDirective,
};
