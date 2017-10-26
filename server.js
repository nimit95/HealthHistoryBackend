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


function addFileToStorage(userId, title) {

}

function addFileLinkToUser(userId, title, fileLink) {
    let time = new Date().getTime();
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
            "notification" : {
                "body" : "Reports are ready",
                "title" : title
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

        ref.off("value");
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}


app.listen(5555, function () {
    console.log("server start at port http://localhost:" + 5555)
});