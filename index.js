


const { ApolloServer, gql } = require('apollo-server');

const typeDefs = gql`
  type Test {
    a: Int
    b: String
    c: Int
  }

  type Book {
    title: String
    author: String
    year: Int
    """
    the list of Posts by this author
    """
    tests: [Test]
  }

  type Query {
    books: [Book]
  }
`;

/*
prdva-core-customer-d6e18d6954a539a9.elb.us-east-1.amazonaws.com:5002
*/

const books = [
  {
    title: 'Harry Potter and the Chamber of Secrets',
    author: 'J.K. Rowling',
    year: 2012,
    tests: [{ a: 1, b: "2", c: 3 }, { a: 4, b: "5", c: 6 }]
  },
  {
    title: 'Jurassic Park',
    author: 'Michael Crichton',
    year: 2001,
    tests: [{ a: 1, b: "2", c: 3 }, { a: 4, b: "5", c: 6 }]
  },
];

const resolvers = {
  Query: {
    books: () => books,
  },
};

const server = new ApolloServer({
  typeDefs, resolvers, context: ({ req }) => {
    const token = req.headers.authorization || '';
    if (!token)
      console.log("vazio");
  }
});


app.get('/', function (req, res) {
  res.send('Hello World!');
});

server.listen({ port: 5000 }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

// app.listen(3000, function () {
//   console.log('Example app listening on port 3000!');
// });
