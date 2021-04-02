

const { ApolloServer, gql } = require('apollo-server')

let authors = [
    {
        name: 'Robert Martin',
        id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
        born: 1952,
    },
    {
        name: 'Martin Fowler',
        id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
        born: 1963
    },
    {
        name: 'Fyodor Dostoevsky',
        id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
        born: 1821
    },
    {
        name: 'Joshua Kerievsky', // birthyear not known
        id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
        born: 1234
    },
    {
        name: 'Sandi Metz', // birthyear not known
        id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
        born: 1
    },
]

/*
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
*/

let books = [
    {
        title: 'Clean Code',
        published: 2008,
        author: 'Robert Martin',
        id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    },
    {
        title: 'Agile software development',
        published: 2002,
        author: 'Robert Martin',
        id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
        genres: ['agile', 'patterns', 'design']
    },
    {
        title: 'Refactoring, edition 2',
        published: 2018,
        author: 'Martin Fowler',
        id: "afa5de00-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    },
    {
        title: 'Refactoring to patterns',
        published: 2008,
        author: 'Joshua Kerievsky',
        id: "afa5de01-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'patterns']
    },
    {
        title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
        published: 2012,
        author: 'Sandi Metz',
        id: "afa5de02-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'design']
    },
    {
        title: 'Crime and punishment',
        published: 1866,
        author: 'Fyodor Dostoevsky',
        id: "afa5de03-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'crime']
    },
    {
        title: 'The Demon ',
        published: 1872,
        author: 'Fyodor Dostoevsky',
        id: "afa5de04-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'revolution']
    },
]

const typeDefs = gql`
type Author {
    name: String!
    born: Int!
    bookCount: Int!
    id: ID!
}

  type Book {
    title: String!
    published: Int!
    author: String!
    genres: [String]
    id: ID!
  }

  type Query {
      authorCount: Int!
      bookCount: Int!
      allBooks(author: String!): [Book!]!
      allAuthors: [Author!]!
}
`
console.log('ALL BOOKS BY Author', books.filter(b => b.author === 'Robert Martin'))
const resolvers = {
    Query: {
        authorCount: () => authors.length,
        bookCount: () => books.length,
        //Argumenttia hyödynnetään eli http://localhost:4000/graphql käyttöliittymässä
        //voidaan hakea halutulla authorin nimellä authorin kaikki kirjat. 
        //ks.yllä " allBooks(author: String!): [Book!]!"
        //HUOM! Haku tehdään näin http://localhost:4000/graphql käyttöliittymässä
            /*
            query {
                allBooks(author: "Robert Martin") {
                title
                }
            }
            */
        allBooks: (root, args) => books.filter(b => b.author === args.author),
        allAuthors: () => authors
    },
    //Koska Authorilla ei ole omassa alkuperäisessä taulukossa kenttää bookCount
    //Niin luodaan oma kenttä resolverissa ja ei tyydytä by default resolveriin, joka ottaa
    //mukaan pelkästään author-taulukon kentät
    //HUOM! Tässä filteröidään pois ne kirjat, jotka eivät Authorile kuulu
    Author: {
        bookCount: (root) => {
            return (
                books.filter(b => b.author === root.name)
                    .length)


        }
    }
}
//"typeDefs" sisältää sovelluksen käyttämän GraphQL-skeeman
//"resolvers" määrittelee miten GraphQL-kyselyihin vastataan
const server = new ApolloServer({
    typeDefs,
    resolvers,
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})
