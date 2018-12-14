import firebase from 'firebase';

// PASTE YOUR CONFIG VARIABLE HERE

var config = {
    apiKey: "AIzaSyDwqVan59nq9ieH2nZ36cxHyUYes1e-BOY",
    authDomain: "my-project-8cd83.firebaseapp.com",
    databaseURL: "https://my-project-8cd83.firebaseio.com",
    projectId: "my-project-8cd83",
    storageBucket: "my-project-8cd83.appspot.com",
    messagingSenderId: "783037291314"
  };

firebase.initializeApp(config);

firebase.firestore().settings({ timestampsInSnapshots: true })
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
