import firebase from 'firebase';

// PASTE YOUR CONFIG VARIABLE HERE

var config = {
  apiKey: "AIzaSyD3NTmOxswXzoamFOfsG0LoMeNlsi9apdM",
  authDomain: "test-test-9b0dd.firebaseapp.com",
  databaseURL: "https://test-test-9b0dd.firebaseio.com",
  projectId: "test-test-9b0dd",
  storageBucket: "test-test-9b0dd.appspot.com",
  messagingSenderId: "962465150273",
};

firebase.initializeApp(config);

firebase.firestore().settings({ timestampsInSnapshots: true })
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
