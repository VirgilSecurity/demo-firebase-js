import firebase from 'firebase';

var config = {/* PASTE YOUR CONFIG HERE */};

firebase.initializeApp(config);

firebase.firestore().settings({ timestampsInSnapshots: true })
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)