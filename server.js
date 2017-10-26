const express = require('express');

const app = express();
const cors = require('cors');
const admin = require("firebase-admin");
const multer = require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        callback(null, String(Date.now()));
    }
});
var upload = multer({storage: storage});

const serviceAccount = require("./HealthHistory-3992571e7843.json");
var gcs = require('@google-cloud/storage')({
    projectId: 'healthhistory-459fe',
    keyFilename: './HealthHistory-3992571e7843.json'
});

//const store = gcs();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://healthhistory-459fe.firebaseio.com/"
});


// admin.initializeApp(functions.config().firebase);

//
// Get a reference to the database service
let database = admin.database().ref();


function addFileToStorage(userId, filePath, fileName) {
    let time = new Date().getTime();


    //  var bucketName = "gs://healthhistory-459fe.appspot.com" + "/" + userId + "/" + "images";

    const bucket = gcs.bucket('healthhistory-459fe.appspot.com');

    bucket.upload(filePath, {
        destination: `${userId}/images/${fileName}`,
        predefinedAcl: 'publicRead'
    }, function (err, file, apiResponse) {

        console.log(file.metadata.mediaLink);
        console.log(apiResponse);
        //"https://firebasestorage.googleapis.com/v0/b/healthhistory-459fe.appspot.com/o/rR4I3Sz9fSMSgLwmMSXvCJvDkEE2%2Fimages%2F1508997602795?alt=media&token=c24ab730-b910-4564-b956-30cba6c074dc"
        addFileLinkToUser(userId, "Test Report", fileName,file.metadata.mediaLink );
    });
    /*
      let newFileName = String(time);
      let fileUpload = bucket.file(newFileName);

      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype
        }
      });

      blobStream.on('error', (error) => {
          console.log(error);
          // reject('Something is wrong! Unable to upload at the moment.');

      });

      blobStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        const url = format(`https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`);
        resolve(url);
      });

      blobStream.end(file.buffer);
    */

    //addFileLinkToUser(userId, "Test Report", time, newFileName);

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

function addFileLinkToUser(userId, time,title, fileLink) {

    let userRef = database.child("users").child(userId);
    let newImageRef = userRef.child("userImages").child(title);
    newImageRef.set({
        description: "",
        imgType: "5",
        timeStamp: time,
        title: title,
        url: fileLink
    }).then(()=>{
        notifyUser(userRef, title);
    });

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
                "title": String(title),
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
    let user = getUserDetails(req.params.userid, function (user) {
        if (!user) {
            return res.send("No User Found.")
        }
        ;
        // console.log(user);
        res.send(user);
    });
});

app.post('/user/:userid', upload.single('avatar'), function (req, res, next) {
    console.log('****************');
    console.log(req.file);
    res.send({success: true});
    addFileToStorage(req.params.userid, req.file.path, req.file.filename);
});


app.listen(5555, function () {
    console.log("server start at port http://localhost:" + 5555)
});