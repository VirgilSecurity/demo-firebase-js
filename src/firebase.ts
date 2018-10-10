import firebase from 'firebase';

// PASTE YOUR CONFIG VARIABLE HERE
var config = {
    apiKey: "AIzaSyAD1fZH36Rgmc25v7RWWp8DxIHVv6EtYkU",
    authDomain: "js-chat-ff5ca.firebaseapp.com",
    databaseURL: "https://js-chat-ff5ca.firebaseio.com",
    projectId: "js-chat-ff5ca",
    storageBucket: "js-chat-ff5ca.appspot.com",
    messagingSenderId: "1054047202875"
};

firebase.initializeApp(config);

firebase.firestore().settings({ timestampsInSnapshots: true })
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);