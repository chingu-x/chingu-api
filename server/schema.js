const { gql } = require("apollo-server-express");

const schema = gql`
  """
  Defines a directive which authenticates users.

  It checks that the user is:
  1. Authenticated: Has a valid access token
  2. Authorized: Has the correct access rights based on the role in the token
  """
  directive @auth(requires: Role = USER) on OBJECT | FIELD_DEFINITION

  """
  Defines a DateTime value.

  Parses & validates date fields.

  Returns an integer representing the milliseconds since epoch.
  """
  scalar Date

  """
  Defines an email.

  Parses & validates emails.

  Returns a string.
  """
  scalar Email

  """
  Defines the valid roles within the system.
  """
  enum Role {
    """
    A Chingu administrator
    """
    ADMIN

    """
    A regular Chingu user
    """
    USER
  }

  """
  Defines a Chingu user.

  This could be a user of any Role.
  """
  type User {
    id: ID!
    email: Email!
    name: String!

    """
    The user's role within the system
    """
    role: Role!

    createdAt: Date!
    updatedAt: Date!
  }

  type PreRegisteredUser {
    id: ID!
    email: Email!
    name: String!
    createdAt: Date!
    updatedAt: Date!
  }

  type UserTokens {
    refreshToken: String!
    accessToken: String!
  }

  type LogInPayload {
    user: User!
    tokens: UserTokens!
  }

  type SignUpPayload {
    user: User!
    tokens: UserTokens!
  }

  input NewUserInput {
    email: Email!
    password: String!
    name: String!
  }

  input PreRegisteredUserInput {
    email: Email!
    name: String!
  }

  type Mutation {
    logIn(email: String!, password: String!): LogInPayload!
    logOut: Boolean! @auth
    refreshAccessToken(refreshToken: String!): UserTokens!
    signUp(newUserInput: NewUserInput!): SignUpPayload!
    addPreRegisteredUser(preRegisteredUser: PreRegisteredUserInput!): PreRegisteredUser! @auth(requires: ADMIN)
    changeUserRole(id: ID!, role: Role!): User! @auth(requires: ADMIN)
    emailUser(userId: ID!, subject: String!, text: String!): Boolean! @auth(requires: ADMIN)
    emailPreRegisteredUser(userId: ID!, subject: String!, text: String!): Boolean! @auth(requires: ADMIN)
  }

  type Query {
    me: User! @auth
    user(userID: ID!): User! @auth
    userList: [User!]! @auth(requires: ADMIN)
    preRegisteredUserList: [PreRegisteredUser!]! @auth(requires: ADMIN)
  }
`;

module.exports = schema;