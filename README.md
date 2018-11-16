# End-to-end encrypted, HIPAA-compliant JavaScript chat app for Firebase.
You can reuse this sample in any projects where you want to end-to-end protect user data, documents, images using Virgil's end-to-end encryption. [HIPAA whitepaper](https://virgilsecurity.com/wp-content/uploads/2018/07/Firebase-HIPAA-Chat-Whitepaper-Virgil-Security.pdf).

[Watch JS setup tutorial on YouTube](https://youtu.be/Xddrwqhg4LY)

* Looking for other client platforms? [iOS](https://github.com/VirgilSecurity/demo-firebase-ios) | [Android](https://github.com/VirgilSecurity/demo-firebase-android)

## Prerequisites

* [node v8.11.3](https://nodejs.org/en/download) or later
* [npm](https://www.npmjs.com/get-npm) or yarn

## Clone JavaScript project
```bash
git clone https://github.com/VirgilSecurity/demo-firebase-js
cd demo-firebase-js
```

## Connect your Virgil and Firebase accounts
In order for the app to work, you need to deploy a Firebase function that gives out Virgil JWT tokens for your authenticated users. You'll also need to create a Firestore database with a specific rule set.

* **[Follow instructions here](https://github.com/VirgilSecurity/e3kit-firebase-func)**

### Configure Firestore Cloudstorage

* Let's also set up a Firestore database for the sample apps: select the **Database** panel, select **Firebase Cloudstorage** click **Create database** under Firestore, choose **Start in test mode** and click **Enable**.
* Once the database is created, click on the **Rules** tab, click **Edit rules** and paste:
  ```
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth.uid != null;
      }
    }
  }
  ```
* Click **PUBLISH**.

> You only need to do this once - if you did it already earlier or for your Android or iOS apps, don't need to do it again. 

## Add your Firebase function URL and Firebase project config to app

* **Copy your new Firebase function's URL**: go to the Firebase console -> your project -> Functions tab and copy your new function's url
* **Paste it** into FIREBASE_FUNCTION_URL variable in `src/models/UserModel.ts`:
  ```
  const FIREBASE_FUNCTION_URL = 'https://YOUR_FIREBASE_ENDPOINT.cloudfunctions.net/api';
  ```
* Go back to your project's page in Firebase console, click the **gear icon** -> **Project settings**
* Click **Add app** and choose **"</> Add Firebase to your web app"**
* Copy **only this part** to the clipboard:
  ```
    var config = {
      apiKey: "...",
      authDomain: "...",
      databaseURL: "...",
      projectId: "...",
      storageBucket: "...",
      messagingSenderId: "..."
    };
  ```
* **Replace the copied block** in your `src/firebase.ts` file.

## Test it

* **Update dependencies, build & run**
  ```
  npm install
  npm run start
  ```

* **Browse to http://localhost:1234**

> Start a **second incognito window** to have 2 chat apps running with 2 different users

> Remember, the app deletes messages right after delivery (it's a HIPAA requirement to meet the conduit exception). If you want to see encrypted messages in your Firestore database, run only 1 browser instance, send a message to your chat partner and check Firestore DB's contents before opening the other user's app to receive the message. If you don't want to implement this behavior in your own app, you can remove it from this sample.
