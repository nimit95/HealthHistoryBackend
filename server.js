const express = require('express');

const app = express();
const cors = require('cors');
const admin = require("firebase-admin");
const multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

const serviceAccount = require("./HealthHistory-3992571e7843.json");
var gcs = require('@google-cloud/storage')({
    projectId: 'healthhistory-459fe',
    keyFilename: './HealthHistory-3992571e7843.json'
});

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://healthhistory-459fe.firebaseio.com/"
});


// admin.initializeApp(functions.config().firebase);

//
// Get a reference to the database service
let database = admin.database().ref();


function addFileToStorage(userId, file) {
    let time = new Date().getTime();
    var bucket = admin.storage().bucket("/" + userId + "/" + "images");

    newFileName = time ;
    let fileUpload = bucket.file(newFileName);

    const blobStream = fileUpload.createWriteStream({
        metadata: {
            contentType: file.mimetype
        }
    });

    blobStream.on('error', (error) => {
        reject('Something is wrong! Unable to upload at the moment.');
    });

    blobStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        const url = format(`https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`);
        resolve(url);
    });

    blobStream.end(file.buffer);


}



 function getUserDetails(userId, cb) {

    let userRef = database.child("users").child(userId);

    userRef.on("value", function (snapshot) {

        userRef.off("value");
        cb(snapshot.val());

    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
        cb(false);
    });
}

function addFileLinkToUser(userId, title, time,fileLink) {

    let userRef = database.child("users").child(userId);
    let newImageRef = userRef.child("userImages").child(time);
    newImageRef.set({
        description: "",
        imgType: "5",
        timeStamp: time,
        title: title,
        url: fileLink
    });
    notifyUser(userRef);
}

function notifyUser(userRef, title) {
    userRef.child("firebaseInsstanceId").on("value", function (snapshot) {
        console.log(snapshot.val());
        let registrationToken = snapshot.val();

        // See the "Defining the message payload" section below for details
        // on how to define a message payload.
        var payload = {
            "notification": {
                "body": "Reports are ready",
                "title": title,
                "sound": "default"
            }
        };

        // Send a message to the device corresponding to the provided
        // registration token.
        admin.messaging().sendToDevice(registrationToken, payload)
            .then(function (response) {
                // See the MessagingDevicesResponse reference documentation for
                // the contents of response.
                console.log("Successfully sent message:", response);
            })
            .catch(function (error) {
                console.log("Error sending message:", error);
            });

        userRef.child("firebaseInsstanceId").off("value");
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}


app.use(express.json());

app.use(express.urlencoded({extended: true}));

app.use(cors());

app.get('/user/:userid', function (req, res, next) {
  console.log(req.params.userid);
  let user =  getUserDetails(req.params.userid, function (user) {
    if(!user){
      return res.send("No User Found.")
    };
    console.log(user);
    res.send(user);
  });
});

app.post('/user/:userid',  upload.single('avatar'),function (req, res, next) {

});


app.listen(5555, function () {
    console.log("server start at port http://localhost:" + 5555)
});