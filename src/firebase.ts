import firebase from 'firebase';

// PASTE YOUR CONFIG VARIABLE HERE
var config = {};

firebase.initializeApp(config);

firebase.firestore().settings({ timestampsInSnapshots: true })
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)