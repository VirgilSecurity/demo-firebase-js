# demo-firebase-js
End-to-end encrypted, HIPAA-compliant JavaScript chat sample app for Firebase. While this is a chat app, you can reuse it in any other apps to protect user data, documents, images using Virgil's end-to-end encryption. Only HIPAA-compliant for chat use-cases.

## Prerequisites

* [node v8.11.3](https://nodejs.org/en/download) or later
* [npm](https://www.npmjs.com/get-npm) or yarn

## Clone JavaScript project

Clone the repo to your computer. Open *terminal*, navigate to the folder where you want to store the application and execute
```bash
git clone https://github.com/VirgilSecurity/demo-firebase-js
cd demo-firebase-js
```

## Let's set up your Firebase account for the app
In order for the app to work, you need to deploy a Firebase function that gives out JWT tokens for your authenticated users. You'll also need to create a Firestore database with a specific rule set.

* **[Follow instructions here](https://github.com/VirgilSecurity/demo-firebase-func)**

## Add your Firebase function URL and Firebase project config to app

* **Copy your new Firebase function's URL**: go to the Firebase console -> your project -> Functions tab and copy your new function's url
* **Paste it** into `src/services/VirgilApi.ts`:
  ```
  https://YOUR_FUNCTION_URL.cloudfunctions.net/api/generate_jwt
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

### Update dependencies, build & run

```
npm install
npm run start
```

* **Browse to http://localhost:1234** to test the app.

> Start a **second incognito window** to have 2 chat apps running with 2 different users

> Remember, the app deletes messages right after delivery (it's a HIPAA requirement to meet the conduit exception). If you want to see encrypted messages in your Firestore database, run only 1 browser instance, send a message to your chat partner and check Firestore DB's contents before opening the other user's app to receive the message. If you don't want to implement this behavior in your own app, you can remove it from this sample.
