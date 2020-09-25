import * as firebase from 'firebase';

// PASTE YOUR CONFIG VARIABLE HERE

var firebaseConfig = {};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
