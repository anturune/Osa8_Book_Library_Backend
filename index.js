

const { ApolloServer, gql } = require('apollo-server')
//Mongoa varten
const mongoose = require('mongoose')
//Importataan author.js ja book.js käyttöön
//HUOM! kun yhteys MongoDB onnistuu, niin samalla näiden avulla luodaan authors ja books collectionit
const Author = require('./models/author')
const Book = require('./models/book')
//MongoDB polku
const MONGODB_URI = 'mongodb+srv://fullstack:fullstack@cluster0.fch4z.mongodb.net/fullstack-library-app?retryWrites=true&w=majority'
//CMD:hen tulostus, että  yhteydenmuodostus aloitettu 
console.log('connecting to', MONGODB_URI)
//CMD:hen tulostus, miten yhteydenmuodostus onnistui
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
    .then(() => {
        console.log('connected to MongoDB')
    })
    .catch((error) => {
        console.log('error connection to MongoDB:', error.message)
    })

//Mutaatioita varten ID-generaattori, kun luodaan uusia objekteja 
const { v1: uuid } = require('uuid')


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
//"const typeDefs = gql`" --> sisältää sovelluksen käyttämän GraphQL-skeeman
//HUOM! Mongon vuoksi muutettu Book:a siten, että "author: String!" muutettu "author: Author!"
//jotta kirja sisältää pelkän kirjailijan nimen sijaan kirjailijan kaikki tiedot
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
    author: Author!
    genres: [String]
    id: ID!
  }

  type Query {
      authorCount: Int!
      bookCount: Int!
      allBooks(author: String ,genre: String): [Book!]!
      allAuthors: [Author!]!
      simplyAllBooks:[Book!]!
}
type Mutation{
    addBook(
        title: String!
        published: Int!
        author: String
        genres: [String]        
    ): Book
    editAuthor(
        name: String!
        setBornTo: Int!
      ): Author
}

`
/*
//tsekataan, että tulostuuko cmd:hen kirjat halutulla ehdolla
//console.log('ALL BOOKS BY Author', books.filter(b => b.genres.find(g => g === 'refactoring')))
//console.log('ALL BOOKS', books)

const bookYksi = {
    title: 'titteli',
    published: 2008,
    author: 'Atu Atunen',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']

}

console.log('ADD BOOK', books.concat(bookYksi))
*/
/*
ERILAISIA HAKUJA JOITA TÄLLÄ SKEEMALLA JA MÄÄRITTELYLLÄ VOIDAAN TEHDÄ:
        Kirjoita haut graphql käyttöliittymään http://localhost:4000/graphql:

        1) Kirjailijan kirjat:
            query {
                allBooks(author: "Martin Fowler") {
                title
                }
            }
        2) Kaikki kirjat ja kirjailijat:
            query {
                allBooks { 
                    title 
                    author
                    published 
                    genres
                }
            }

        3) Kaikki kirjailijat (HUOM! bookCount täytyy tehdä erikseen, koska ei ole Author olion attribuutti
            ks. "resolvereista" "Author"-kohta):
            query {
                allAuthors {
                    name
                    bookCount
                }
            }

        4) Genren kirjat:
            query {
                allBooks(genre: "refactoring") {
                    title
                    author
                }
            }

        5) Kirjan lisäys:
            mutation {
                addBook(
                    title: "NoSQL Distilled",
                    author: "Martin Fowler",
                    published: 2012,
                    genres: ["database", "nosql"]
                ) {
                    title,
                    author
                }
            }

        6) Kirjailijan syntymävuoden päivitys:
            mutation {
                editAuthor(name: "Reijo Mäki", setBornTo: 1958) {
                    name
                    born
                }
            }
*/

//"const resolvers = {" --> määrittelee miten GraphQL-kyselyihin vastataan
const resolvers = {
    Query: {
        //Ks. const typeDefs = gql` ja sieltä type Query
        authorCount: () => authors.length,
        bookCount: () => books.length,
        simplyAllBooks: () => books,
        /*Haetaan kaikki krijat-->kirjoita tämä graphql selaimeen ja paina "play"-nappia
        query {
            simplyAllBooks{ 
                title
            }
        }
        */
        //Argumenttia hyödynnetään eli http://localhost:4000/graphql käyttöliittymässä
        //voidaan hakea halutulla authorin nimellä authorin kaikki kirjat. 
        //ks.yllä " allBooks(author: String!): [Book!]!"
        //HUOM! Haku tehdään näin http://localhost:4000/graphql käyttöliittymässä
        /*
          Kirjailijan kirjat:
            query {
                allBooks(author: "Martin Fowler") {
                title
                }
            }

        */

        allBooks: (root, args) => {
            //console.log('TULEEKO KIRJAHAUSTA JOTAIN BACKENDISTÄ')
            if (args.author && args.genre) {
                const authorsBook = books.filter(b => b.author === args.author)
                return authorsBook.filter(b => b.genres.find(g => g === args.genre))
            }
            if (args.author) {
                return books.filter(b => b.author === args.author)
            } else if (args.genre) {
                return books.filter(b => b.genres.find(g => g === args.genre))
            }
            return books
        },
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

    ,

    Mutation: {
        addBook: async (root, args) => {
            //Jos kirjailijaa ei ole, niin lisätään authors -taulukkoon
           
            //Otetaan talteen kirjoittajan nimi eli authori tietokannasta
            //Palauttaa taulukon, jossa authori on indeksissä 0
            //Käytetän "let" -tyyppiä, jotta voidaan vaihtaa arvoa
            let authorInQuestion = await Author.find({ name: args.author })

            /*
            console.log('SYÖTETTY AUTHORI', authorInQuestion)
            console.log('SYÖTETTY AUTHORIN id', authorInQuestion[0])
            console.log('SYÖTETTY AUTHORI ARGSISSA', args.author)
            */

            //Jos authoria ei kannassa, niin luodaan uusi author ennen kirjan luomista
            if (authorInQuestion[0] === undefined) {
                console.log('EI AUTHORIA KANNASSA, luodaan uusi', args.author)
                //Luodaan skeeman mukainen Author olio
                const newAuthor = new Author({
                    name: args.author,
                    born: 1
                })
                //authors = authors.concat(newAuthor)

                //console.log('AUTHOR IN QUESTION UUDEN AUTHORIN LUONNISSA', authorInQuestion)

                //Talletetaan uusi käyttäjä tietokantaan
                try {
                    await newAuthor.save()
                } catch (error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }

            }

            //console.log('YRITTÄÄKÖ TÄNNE', await Author.find({ name: args.author }))

            //Haetaan tietokantaan tallennettu "Author" uudelleen, kirjan luomista varten
            authorInQuestion = await Author.find({ name: args.author })
            //Luodaan uusi kirja ja skeeman mukaisesti "author" -kentälle annetaan
            //Pelkkä tietokannan id-numero
            const book = new Book({ ...args, author: authorInQuestion[0]._id })
            console.log('Kirja', book)
            console.log('OLIKO AUTHORI', authorInQuestion[0]._id)
            //Talletetaan kirja kantaan
            try {
                await book.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }

        }


        //return book.save()


        /*
        addBook: (root, args) => {
            //Jos kirjailijaa ei ole, niin lisätään authors -taulukkoon
            console.log('TULIKO BACKENDIIN JA KIRJAN LISÄYKSEEN', args.author)
            if (!authors.find(a => a.name === args.author)) {
                const author = {
                    name: args.author,
                    id: uuid(),
                    born: 1
                }
                authors = authors.concat(author)
                console.log('MENIKÖ NIMI SISÄÄN', args.author)
                console.log('MENIKÖ NIMI SISÄÄN', author)
            }
     
            const book = { ...args, id: uuid() }
            books = books.concat(book)
            console.log('Kirja', book)
            return book
        }
        */

        ,
        editAuthor: (root, args) => {
            console.log('Tuliko editAuthoriin', args.name)
            const author = authors.find(a => a.name === args.name)
            if (!author) {
                return null
            }
            console.log('Lähtikö muuttamaan editAuthorissa setBornTo arvolla', args.setBornTo)
            //HUOM! Skeemassa pitää olla "setBornTo", koska konsolesta syötetään sen nimisellä parametrilla
            //uusi syntymävuosi
            const updatedAuthor = { ...author, born: args.setBornTo }
            authors = authors.map(a => a.name === args.name ? updatedAuthor : a)
            return updatedAuthor
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
