# demo-firebase-js
A simple javascript application that demonstrates how end-to-end encryption works with firebase as a backend service for authentication and chat messaging. While this is a chat app, you can reuse it in any other apps to protect user data, documents, images.

## Getting Started

Start with cloning repository to your computer. Open *terminal*, navigate to the folder where you want to store the application and execute
```bash
$ git clone https://github.com/VirgilSecurity/demo-firebase-js

$ cd demo-firebase-js
```

## Prerequisites

* node v8.11.3 or later
* npm or yarn

### Updating dependencies

```
npm install
```

### Firebase set up

* Go to the [Firebase console](https://console.firebase.google.com) and create your own project.
* Click **"Add Firebase to your web app"**
* Copy **config variable only** and paste it to `demo-firebase-js/src/firebase.ts`. 
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

#### Cloud functions
* In order for the mobile app to work, you need to deploy a Firebase cloud function that generates JWT tokens for Virgil's APIs. [Follow setup instructions here](https://github.com/VirgilSecurity/demo-firebase-func)
* Once the function is successfully created, go to the Firebase console -> Functions tab and copy your function url from the Event column
* Open `demo-firebase-js/src/services/VirgilApi.ts` and change property jwtEndpoint to:
```
https://YOUR_FUNCTION_URL.cloudfunctions.net/api/generate_jwt
```

## Build and Run
```
npm run start
```

## Additional notes

Due to simplicity of client code demo is not suppose to work when two same users are open in two browsers in same time. It support multiple devices but not in the same time.

## TROUBLESHOOTING

* If you decide to repeat instructions and create new application on dashboard.virgilsecurity.com, make sure you deleted all data from browser storage, especially indexedDB and localstorage. If you create new application, cards created with previous appId stay associated with this appId. So you need to generate new private keys and create new cards for new virgil application.