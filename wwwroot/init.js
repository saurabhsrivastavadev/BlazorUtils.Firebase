// init.js Module
// This script deals with initializing the firebase sdk

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.3.0/firebase-app.js';

let firebaseApp = null;
let firebaseSdkInitParams = null;

/**
 * Class representing firebase config 
 * */
class FirebaseConfig {

    /**
     * Constructor
     * @param {any} firebase config json
     */
    constructor(config) {

        // config can be object or json
        if (typeof (config) === 'string') {
            config = JSON.parse(config);
        }

        this.apiKey = config.apiKey;
        this.authDomain = config.authDomain;
        this.databaseURL = config.databaseURL;
        this.messagingSenderId = config.messagingSenderId;
        this.projectId = config.projectId;
        this.storageBucket = config.storageBucket;
    }
}

class FirebaseSdkInitParams {

    constructor(params) {

        if (typeof (params) === 'string') {
            params = JSON.parse(params);
        }

        this.firebaseProjectId = params.FirebaseProjectId;
        this.firebaseConfig = params.FirebaseConfig;
        this.useAuthModule = params.UseAuthModule;
        this.emulateAuthModule = params.EmulateAuthModule;
        this.useFirestoreModule = params.UseFirestoreModule;
        this.emulateFirestoreModule = params.EmulateFirestoreModule;
    }
}

/**
 * Load the required firebase SDK scripts.
 * This API must be executed before invoking any firebase module APIs.
 * 
 * @param {FirebaseSdkInitParams} params 
 */
async function loadFirebaseSdk(paramsJsonStr) {

    firebaseSdkInitParams = new FirebaseSdkInitParams(paramsJsonStr);

    // Firebase setup:: https://firebase.google.com/docs/web/setup

    if (!firebaseSdkInitParams.firebaseConfig) {

        console.log('No firebase config provided, try fetching from server.');
        const configJson = await (await fetch('/__/firebase/init.json')).json();
        firebaseSdkInitParams.firebaseConfig = new FirebaseConfig(configJson);
    }

    firebaseApp = initializeApp(firebaseSdkInitParams.firebaseConfig);
    if (firebaseApp) {
        console.log('firebase app initialized sucessfully.');
    }
}

export { FirebaseConfig, FirebaseSdkInitParams, firebaseApp, firebaseSdkInitParams, loadFirebaseSdk };
