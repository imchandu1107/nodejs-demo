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
} )



//get users
//<url>http://localhost:3000/user/getusers
userApi.get( "/getusers", expressErrorHandler( async ( req, res ) => {

    let usersList = await userCollectionObj.find().toArray()
    if ( usersList.length === 0 ) {
        res.send({message:"No users exist"})
    }

    else {
        res.send( { message: usersList } )
    }

} ) )



//get user by username
//<url>http://localhost:3000/user/getuser/<username>
userApi.get( "/getuser/:username", expressErrorHandler( async ( req, res ) => {

    //get username from url
    let un = req.params.username
    //search
    let userObj = await userCollectionObj.findOne( { username: un } )
    if ( userObj === null ) {
        res.send( { message: "User does not exist" } )
    }

    else {
        res.send( { message: userObj } )
    }

} ) )



//create new user
//<url>http://localhost:3000/user/createuser
userApi.post( "/createuser", expressErrorHandler( async ( req, res ) => {

    //get user obj
    let newUser = req.body
    //search for existing user
    let user = await userCollectionObj.findOne( { username: newUser.username } )
    //if user already exists
    if ( user !== null ) {
        res.send( { message: "User already exists" } )
    }

    else {
        //hash the password
        let hashedPassword = await bcryptjs.hash( newUser.password, 7 )
        //replace password
        newUser.password = hashedPassword
        //insert new user object into database
        await userCollectionObj.insertOne( newUser )
        res.send( { message: "New user created successfully" } )
    }

} ) )



//updating existing user
//<url>http://localhost:3000/user/updateuser
userApi.put( "/updateuser", expressErrorHandler( async ( req, res ) => {

    //get modified user object
    let modifiedUser = req.body
    //updating user
    let modUser = await userCollectionObj.findOne( { username: modifiedUser.username } )
    if ( modUser === null ) {
        res.send( { message: "No user exists with the specified username" } )
    }

    else {
        //hash the password
        modifiedUser.password = await bcryptjs.hash( modifiedUser.password, 7 )
        
        //update user object to database
        await userCollectionObj.updateOne( { username: modifiedUser.username }, { $set: { ...modifiedUser } } )
        res.send( { message: "User details updated" } )
    }

} ) )



//deleting user
//<url>http://localhost:3000/user/deleteuser/<username>
userApi.delete( "/deleteuser/:username", expressErrorHandler( async ( req, res ) => {

    //get username from url
    let un = req.params.username
    //find user
    let user = await userCollectionObj.findOne( { username: un } )
    if ( user === null ) {
        res.send( { message: "User does not exist" } )
    }
    
    else {
        await userCollectionObj.deleteOne( { username: un } )
        res.send( { message: "User deleted successfully" } )
    }

} ) )



//user login and authentication
userApi.post( '/login', expressErrorHandler( async ( req, res ) => {
    
    //getting user credentials
    let credentials = req.body
    //searching user by username
    let user = await userCollectionObj.findOne( { username: credentials.username } )
    //checking whether user exists or not
    if ( user === null ) {
        res.send( { message: "Invalid username" } )
    }

    else {
        //password authentication
        let result = await bcryptjs.compare( credentials.password, user.password )
        //invalid password
        if ( result === false ) {
            res.send( { message: "Invalid password" } )
        }

        else {
            //create a web token
            let signedToken = jwt.sign( { username: credentials.username }, process.env.SECRET, { expiresIn: 120 } )
            //send token to client
            res.send( { message: "Login successful", token: signedToken, username: credentials.username, userObj: user } )
        }
    }

}))



//export userApi
module.exports = userApi