

const express = require('express');

const app = express();

const admin = require("firebase-admin");

const serviceAccount = require("/home/nimit/NodeJS/HealthHistory/HealthHistory-3992571e7843.json");


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://healthhistory-459fe.firebaseio.com/"
});


admin.initializeApp(functions.config().firebase);

//
// Get a reference to the database service
let database = admin.database();

app.listen(5555, function(){
    console.log("server start at port http://localhost:"+5555)
});