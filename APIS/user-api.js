//creating mini express app using Router()
const exp = require( "express" )
const userApi = exp.Router()
const expressErrorHandler = require( "express-async-handler" )
const bcryptjs = require( "bcryptjs" )
const jwt = require( "jsonwebtoken" )
require( "dotenv" ).config()

//body parsing middleware
userApi.use( exp.json() )

//importing mongo client
const mc = require( "mongodb" ).MongoClient

//connection string
const databaseUrl = process.env.DATABASE_URL

let userCollectionObj

//connecting to database
mc.connect( databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true }, ( err, client ) => {
    if ( err ) {
        console.log( "Error in connecting to database", err )
    }
    else {
        //get database onject
        let databaseObj = client.db( "demodb" )

        //creating user collection object
        userCollectionObj = databaseObj.collection( "usercollection" )
        console.log( "Connected to Database" )
    }
})

//export userApi
module.exports = userApi