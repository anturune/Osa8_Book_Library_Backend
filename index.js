//Apollo server käyttöön
const { ApolloServer, gql } = require('apollo-server')
//Mongoa varten
const mongoose = require('mongoose')
//Yksilöllistä Tokenia varten, kirjautumiseen
const jwt = require('jsonwebtoken')
//Importataan author.js ja book.js käyttöön
//HUOM! kun yhteys MongoDB onnistuu, niin samalla näiden avulla luodaan authors ja books collectionit
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY'
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
//HUOM! Ei tarvita Mongoa käytettäessä
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

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  
  type Token {
    value: String!
  }

  type Query {
      authorCount: Int!
      bookCount: Int!
      allBooks(author: String ,genre: String): [Book!]!
      allAuthors: [Author!]!
      simplyAllBooks:[Book!]!
      me: User
}
type Mutation{
    addBook(
        title: String!
        published: Int!
        author: String!
        genres: [String]        
    ): Book

    editAuthor(
        name: String!
        setBornTo: Int!
      ): Author

    createUser(
        username: String!
        favoriteGenre: String!
      ): User

    login(
        username: String!
        password: String!
      ): Token
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
-------------ERILAISIA HAKUJA JOITA TÄLLÄ SKEEMALLA JA MÄÄRITTELYLLÄ VOIDAAN TEHDÄ:-----------------
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

        --------------KYSELYJÄ KUN MONGO DB KÄYTÖSSÄ----------------
        91) Kirjan lisäys, kun myös Author tietokannassa
            mutation {
                    addBook(
                        title: "Saaagaaass",
                        author:"PAtu Katunen",
                        published: 2012,
                        genres: ["database", "nosql"]
                    ) {
                        title,
                        published,
                        genres,
                        author{
                        name,
                            born,
                            bookCount}
                    }
                }

        92) Haetaan kaikki kirjat kannasta
            query {
                    simplyAllBooks { 
                        title 
                        published
                        genres
                    }
                }

        93) Haetaan authoreiden ja kirjailijoiden määrä
            query {
                authorCount
                bookCount
        }
        94) Haetaan kaikki Authorit
            query {
                allAuthors{
                    name,
                    born}
        }

        --------------------------KIRJAUTUMISEEN LIITTYVÄT KYSELYT/MUTAATIOT------------------------------------
        
        95) Uuden käyttäjän luominen HUOM! favoriteGenre on pakollinen kenttä skeemassa
            mutation {
                createUser(
                    username:"asturune"
                    favoriteGenre:"nosql"){
                            username,
                            favoriteGenre,
                            id                        
                        }
                    }

        96) Loggautuminen. "value" palauttaa tokenin.
            mutation {
                login(
                    username:"asturune"
                    password:"secret"){
                        value}
        }
        97) Loggautuneen käyttäjän hakeminen
            Token, joka on saatu kohdasta 96) eli loggautumisen yhteydessä.
            Kirjoita token näin {"Authorization": "bearer <token tähän, joka saatu loggautumisen yhteydessä>"}
            query {
                    me{
                      username,
                      favoriteGenre
                        }
                    }

        98) Kirjan lisääminen. Lisää http://localhost:4000/graphql alle HTTP HEADERS kohtaan
            Token, joka on saatu kohdasta 96) eli loggautumisen yhteydessä.
            Kirjoita token näin {"Authorization": "bearer <token tähän, joka saatu loggautumisen yhteydessä>"}
            Esimerkki token: {"Authorization": "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c"}
            HUOM! Edellyttää että jsonwebtoken-kirjasto on asennettu "npm install jsonwebtoken"
            mutation {
                addBook(
                    title: "Loggaaminenkokinkokin",
                    author:"PAtu Katunen",
                    published: 2012,
                    genres: ["database", "nosql"]) {
                        title,
                        published,
                        genres
                        }
                    }
        
        99) Authorin muokkaaminen. HUOM! muista token http://localhost:4000/graphql alle HTTP HEADERS kohtaan
            ja ota token login -mutaation avulla
            mutation {
                editAuthor(name: "Atu Atunen", setBornTo: 8888) {
                    name
                    born
                }
            }
        
*/

//"const resolvers = {" --> määrittelee miten GraphQL-kyselyihin vastataan
const resolvers = {
    Query: {
        //Ks. const typeDefs = gql` ja sieltä type Query
        authorCount: async () => {
            return (await Author.find({})).length
        }
        ,
        bookCount: async () => {
            return (await Book.find({})).length
        },

        //Kaikkien kirjojen palauttamiseen Mongo DB:stä
        simplyAllBooks: async () => {
            return (await Book.find({}))
        }
        ,

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


        allBooks: async (root, args) => {

            //Haetaan hakua vastaava author kannasta
            const authorInQuestion = await Author.find({ name: args.author })

            
            //Jos on annettu sekä authorin, että genren arvot niin tämä
            if (args.author && args.genre) {
                //Haetaan kaikki Authorin kirjat
                const authorinKirjat = await Book.find({ author: { $in: authorInQuestion } })
                //Filteröidään kirjat joila ei annettua genreä
                const authorinKirjatGenreilla = authorinKirjat.filter(b => b.genres.find(g => g === args.genre))
                //console.log('AUTHORIN KIRJAT Genreilla', authorinKirjatGenreilla)
                /*TÄTÄ EN SAANUT TOIMIMAAN
                const authorinKirjatJaHalututGenret = await Book
                    .find(
                        {
                            author: { $in: authorInQuestion },
                            genres: { $in: [args.genre] }
                        }
                    )
                */
                console.log('authorinKirjatGenreilla', authorinKirjatGenreilla)
                return authorinKirjatGenreilla
                //const authorsBook = books.filter(b => b.author === args.author)
                //return authorsBook.filter(b => b.genres.find(g => g === args.genre))
            }

            //Jos annettu pelkästään authorin arvo, niin tämä
            if (args.author) {
                //Haetaan kaikki kirjat, jotka sisältävät Authorin ID:n
                //Hyödynnettu $in -syntaksia ks. https://docs.mongodb.com/manual/reference/operator/query/in/
                const authorinKirjat = await Book.find({ author: { $in: authorInQuestion } })
                //console.log('AUTHORIN KIRJAT', authorinKirjat)
                return authorinKirjat

                //Jos annettu pelkkä genre, niin sitten tämä
            } else if (args.genre) {
                //Haetaan kaikki Genren kirjat
                const genrenKirjat = await Book.find({ genres: { $in: [args.genre] } })
                //console.log('GENREN KIRJAT', genrenKirjat)
                return genrenKirjat
                //return books.filter(b => b.genres.find(g => g === args.genre))
            }
            //console.log('ALL BOOKS', await Book.find({}))
            //Jos ei ole annettu genreä eikä authoria, niin palautetaan kaikki kirjat
            return await Book.find({})
        },
        allAuthors: async () => {
            return (await Author.find({}))
        },
        //Kirjautumista varten
        //HUOM! context
        me: async (root, args, context) => {
            return await context.currentUser
        }


    },
    //Koska Authorilla ei ole omassa alkuperäisessä taulukossa kenttää bookCount
    //Niin luodaan oma kenttä resolverissa ja ei tyydytä by default resolveriin, joka ottaa
    //mukaan pelkästään author-taulukon kentät
    //HUOM! Tässä filteröidään pois ne kirjat, jotka eivät Authorile kuulu
    Author: {
        bookCount: async (root) => {
            //Käytetään "findOne"-syntaxia, jotta tulee authori oliona
            //eikä arrayna
            const authorInQuestion = await Author.findOne({ name: root.name })
            //console.log('Author ID', authorInQuestion._id)

            //Haetaan kannasta Authorin kaikki kirjat
            const allBooks = await Book.find({ author: { $in: authorInQuestion } })
            //console.log('BOOKCOUNT', allBooks.length)
            return (allBooks.length)
            /*        
            return (
                books.filter(b => b.author === root.name)
                    .length)
                */

        }
    }
    ,
    //Koska kirjan skeemaan määritelty "author:Author!", ja kirjan tiedoissa
    //referoidaan pelkästään Authorin ID:llä, niin authorin tiedot pitää hakea kannasta
    //erikseen, jotta kyselyt authorin osalta toimivat oikein
    Book: {
        author: async (root) => {
            //console.log('ROOT', (await Author.findOne({ _id: root.author })).name)
            return {
                name: (await Author.findOne({ _id: root.author })).name
            }
        }
    }

    ,

    Mutation: {
        //context tarvitaan, koska halutaan, että vain kirjautunut käyttäjä voi lisätä kirjan
        addBook: async (root, args, context) => {

            console.log('TULIKO ADDBOOKIIN')
            //Tarkastamaan, onko käyttäjä kirjautunut
            const currentUser = context.currentUser
            console.log('CURRENT USER', currentUser)
            if (!currentUser) {
                throw new AuthenticationError("not authenticated")
            }
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
            return book

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
        //Syntymävuoden päivittämiseen
        editAuthor: async (root, args, context) => {

            //Tarkastamaan, onko käyttäjä kirjautunut
            const currentUser = context.currentUser
            console.log('CURRENT USER', currentUser)
            if (!currentUser) {
                throw new AuthenticationError("not authenticated")
            }

            //Kun haetaan kannasta "findOne", niin ei tarvitse huolehtia indexsistä
            //Jos haettaisiin vain "find", niin tulisi arrayna
            const author = await Author.findOne({ name: args.name })

            console.log('Tuliko editAuthoriin', args.name, author.born)
            //const author = authors.find(a => a.name === args.name)
            if (!author) {
                return null
            }
            console.log('Lähtikö muuttamaan editAuthorissa setBornTo arvolla', args.setBornTo)
            //HUOM! Skeemassa pitää olla "setBornTo", koska konsolesta syötetään sen nimisellä parametrilla
            //uusi syntymävuosi
            //Päivitetään syntymävuosi
            author.born = args.setBornTo
            console.log('Editoituiko authori', author)
            //const updatedAuthor = { ...author, born: args.setBornTo }
            //authors = authors.map(a => a.name === args.name ? updatedAuthor : a)


            try {
                await author.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }

            return author
            //return updatedAuthor
        },
        //Kirjautumista varten userin luominen ja login
        createUser: (root, args) => {

            //Luodaan uusi käyttäjä skeeman mukaisesti.
            //HUOM! "favoriteGenre" on pakollinen kenttä
            console.log('USERIN TIEDOT', args.username, args.favoriteGenre)
            const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

            return user.save()
                .catch(error => {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                })
        },
        login: async (root, args) => {
            //console.log('TULEEKO LOGIN MUTAATIOLLE')
            const user = await User.findOne({ username: args.username })

            if (!user || args.password !== 'secret') {
                throw new UserInputError("wrong credentials")
            }

            const userForToken = {
                username: user.username,
                id: user._id,
            }

            return { value: jwt.sign(userForToken, JWT_SECRET) }
        }
    }
}

//"typeDefs" sisältää sovelluksen käyttämän GraphQL-skeeman
//"resolvers" määrittelee miten GraphQL-kyselyihin vastataan
//Contextin palauttama olio annetaan kaikille resolvereille kolmantena parametrina, 
//context on siis oikea paikka tehdä asioita, jotka ovat useille resolvereille yhteistä, 
//kuten pyyntöön liittyvän käyttäjän tunnistaminen
const server = new ApolloServer({
    typeDefs,
    resolvers,
    //Context tarvitaan kirjautumista ja käyttäjän tunnistusta varten
    context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
            const decodedToken = jwt.verify(
                auth.substring(7), JWT_SECRET
            )
            const currentUser = await User
                .findById(decodedToken.id)
            //.findById(decodedToken.id).populate('favoriteGenre')
            return { currentUser }
        }
    }
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})
