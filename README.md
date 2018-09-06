# demo-firebase-js
End-to-end encrypted, HIPAA-compliant JavaScript chat sample app for Firebase. While this is a chat app, you can reuse it in any other apps to protect user data, documents, images using Virgil's end-to-end encryption. Only HIPAA-compliant for chat use-cases.

## Clone project

Start with cloning the repository to your computer. Open *terminal*, navigate to the folder where you want to store the application and execute
```bash
git clone https://github.com/VirgilSecurity/demo-firebase-js
cd demo-firebase-js
```

## Prerequisites

* [node v8.11.3](https://nodejs.org/en/download) or later
* [npm](https://www.npmjs.com/get-npm) or yarn

### Update dependencies

```
npm install
```

### Create Firebase project
Go to the [Firebase console](https://console.firebase.google.com) and if you haven't created a project yet, create one now. If you already have one that you want to use, open it and skip to the **Firebase app setup**

* Select the **Authentication** panel and then click the **Sign In Method** tab.
*  Click **Email/Password** and turn on the **Enable** switch, then click **Save**.
* Select the **Database** panel and then enable **Cloud Firestore**.
  * Click **Rules** and paste:
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

### Firebase JS app setup

* In your Firebase project (on the Firebase console), click the **gear icon** -> **Project settings**
* Click **Add app** and choose **"Add Firebase to your web app"**
* A config code block pops up with HTML + JS code. Copy **only this part** to the clipboard:
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

* Paste it into the project's `src/firebase.ts` file.

#### Firebase cloud functions setup

> In order for the app to work, you need to deploy a Firebase function that creates JWT tokens for your authenticated users. If you already deployed this function for either the iOS or Android apps, you don't need to do it again.

* Otherwise, [follow the instructions here](https://github.com/VirgilSecurity/demo-firebase-func)
* Once the function is successfully created, go to the Firebase console -> Functions tab and copy your function's url
* Open `src/services/VirgilApi.ts` and change the property jwtEndpoint to:
```
https://YOUR_FUNCTION_URL.cloudfunctions.net/api/generate_jwt
```

## Build and Run
```
npm run start
```

* Browse to http://localhost:1234 to test the app.

> When running 2 instances of the app, start one in **Incognito** to avoid mixing up the keys in local storage.

> If you get errors of keys not found, try flushing your browser cache first.
