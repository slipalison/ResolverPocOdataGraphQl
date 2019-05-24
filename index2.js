const { makeExecutableSchema } = require('graphql-tools');
const fetch = require("node-fetch");
const { ApolloServer, gql } = require('apollo-server');

const typeDefs = gql`
  type Author {
    id: Int!
    firstName: String
    lastName: String
    posts: [Post] # the list of Posts by this author
  }

  type Post {
    id: Int!
    title: String
    author: Author
    votes: Int
  }

  type QuarentineValidation {
    id: Int!
    documentType: String
    document: String
    companyKey: String
    createDate: String
    deleted: Boolean
  }

  type Historic {
    id: Int!
    validationStatus: String
    documentStatus: String
    correlationId: String
    createDate: String
    quarentineValidationId: Int
    userId: String
    quarentineValidation: QuarentineValidation
  }

  # the schema allows the following query:
  type Query {
    posts: [Post]
    author(id: Int!): Author
    authors: [Author]
    Historics: [Historic]
  }

  # this schema allows the following mutation:
  type Mutation {
    upvotePost (
      postId: Int!
    ): Post
  }

`;


var Historics = [
  {
    id: 1,
    validationStatus: "Refused",
    documentStatus: "Regular",
    correlationId: "",
    createDate: "2019-04-29T15:08:26.445027-03:00",
    quarentineValidationId: 1,
    userId: "00000000-0000-0000-0000-000000000000",
    quarentineValidation: {
      id: 1,
      documentType: "Cpf",
      document: "38400344855",
      companyKey: "e",
      createDate: "2019-04-29T15:07:36-03:00",
      deleted: false
    }
  },
  {
    id: 2,
    validationStatus: "Refused",
    documentStatus: "Regular",
    correlationId: "",
    createDate: "2019-05-10T18:25:28.838155-03:00",
    quarentineValidationId: 1,
    userId: "00000000-0000-0000-0000-000000000000",
    quarentineValidation: {
      id: 1,
      documentType: "Cpf",
      document: "38400344855",
      companyKey: "e",
      createDate: "2019-04-29T15:07:36-03:00",
      deleted: false
    }
  }
]


const quarantineHistory = "http://prdva-core-quarantine-76bac1b390fcfb7f.elb.us-east-1.amazonaws.com:5004/v1/QuarantineHistory"

const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
  { id: 3, firstName: 'Mikhail', lastName: 'Novikov' },
];

const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
  { id: 3, authorId: 2, title: 'Advanced GraphQL', votes: 1 },
  { id: 4, authorId: 3, title: 'Launchpad is Cool', votes: 7 },
];
// const posts = [
//   { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2, author: { id: 1, firstName: 'Tom', lastName: 'Coleman' } },
//   { id: 2, authorId: 2, title: 'Welcome to Apollo', votes: 3, author: { id: 2, firstName: 'Sashko', lastName: 'Stubailo' } },
//   { id: 3, authorId: 2, title: 'Advanced GraphQL', votes: 1, author: { id: 2, firstName: 'Sashko', lastName: 'Stubailo' } },
//   { id: 4, authorId: 3, title: 'Launchpad is Cool', votes: 7, author: { id: 3, firstName: 'Mikhail', lastName: 'Novikov' } },
// ];


const select = "$select=", expand = "$expand=", $filter = "$filter=";

const  resolveAe = async (parent, args, context, info) => {
  if (!info)
    return [];
  if (info.fieldName == "Historics") {
    var json =  await getHistoric(info)
    return json.value
  }
  return posts
}

const getHistoric = async (info) => {

  if (info.fieldName == "Historics") {
    const queryString = resolverOData(info);
    const uri = quarantineHistory + "?" + queryString
    const res = await fetch(uri);
    const json = await res.json();
    return json;
  }
  return []
}

function resolverOData(info) {
  var resolvido = rs(0, info.fieldNodes[0].selectionSet.selections, info.fieldNodes[0].name.value);
  return resolveQueryString(0, resolvido)
}

function resolveQueryString(nivel, lista) {
  var hasChildren = lista.some(x => x.children)
  var uri = `${select}${lista.filter(x => !x.children).map(x => x.value)}`
  if (hasChildren) {
    var hasChildrens = lista.filter(x => x.children)
    for (let i = 0; i < hasChildrens.length; i++) {
      const element = hasChildrens[i];
      var child = `${nivel > 0 ? ';': '&' }${expand}${element.value}(${resolveQueryString(nivel+1, element.children)})`;
      uri += child
    }
  }
  return uri;
}

function rs(nivel, listKind, parent) {
  let arr = []
  for (let index = 0; index < listKind.length; index++) {
    const element = listKind[index];
    arr = arr.concat([{ nivel: nivel, value: element.name.value, parent: parent, children: !element.selectionSet ? null : rs(nivel + 1, element.selectionSet.selections, element.name.value) }]);
  }
  return arr;
}


const resolvers = {
  Query: {
    posts: resolveAe,
    authors: resolveAe,
    author: resolveAe,//(_, { id }) => find(authors, { id }),
    Historics: resolveAe
  },

  Mutation: {
    upvotePost: (_, { postId }) => {
      const post = posts.find(x => x.id == postId);
      if (!post) {
        throw new Error(`Couldn't find post with id ${postId}`);
      }
      post.votes += 1;
      return post;
    },
  },

  Author: {
    posts: author => posts.filter(p => p.authorId == author.id),
  },

  Post: {
    author: post => authors.find(x => x.id == post.authorId),
  },
};



const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const server = new ApolloServer({
  schema, context: (ctx) => {
    const { req } = ctx;

    const token = req.headers.authorization || '';
    if (!token)
      console.log("vazio");
  }
});

server.listen({ port: 5000 }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});