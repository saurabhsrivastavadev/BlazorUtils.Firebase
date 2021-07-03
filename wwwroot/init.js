// init.js
// This script deals with dynamically loading the firebase sdk scripts

let isFirebaseSdkLoaded = false;

/**
 * Load the required firebase SDK scripts.
 * This API must be executed before invoking any firebase module APIs.
 * @param {boolean} loadFirebaseAuth
 * Whether to load firebase-auth module script.
 * @param {boolean} loadFirestore
 * Whether to load firebase-firestore module script.
 */
export async function loadFirebaseSdk(loadFirebaseAuth, loadFirestore) {

    if (!isFirebaseSdkLoaded) {

        isFirebaseSdkLoaded = true;

        // Get first script element in the document to insert our scripts before that.
        let firstScriptTag = document.getElementsByTagName('script')[0];
        let parent = firstScriptTag.parentNode;
        let insertBefore = firstScriptTag;

        // Firebase setup:: https://firebase.google.com/docs/web/setup
        // Order must be app script, followed by all required firebase modules, then init 

        // Firebase App(the core Firebase SDK) is always required and must be listed first
        let firebaseAppScript = document.createElement('script');
        firebaseAppScript.src = "/__/firebase/8.6.8/firebase-app.js";
        firebaseAppScript.async = false; // load synchronously since order is important
        parent.insertBefore(firebaseAppScript, insertBefore);
        insertBefore = firebaseAppScript.nextSibling;

        if (loadFirebaseAuth) {
            let firebaseAuthScript = document.createElement('script');
            firebaseAuthScript.src = "/__/firebase/8.6.8/firebase-auth.js";
            firebaseAuthScript.async = false; // load synchronously since order is important
            parent.insertBefore(firebaseAuthScript, insertBefore);
            insertBefore = firebaseAuthScript.nextSibling;
        }

        if (loadFirestore) {
            let firebaseFirestoreScript = document.createElement('script');
            firebaseFirestoreScript.src = "/__/firebase/8.6.8/firebase-firestore.js";
            firebaseFirestoreScript.async = false; // load synchronously since order is important
            parent.insertBefore(firebaseFirestoreScript, insertBefore);
            insertBefore = firebaseFirestoreScript.nextSibling;
        }

        // Firebase Init is always required, and must be the last firebase script
        let firebaseInitScript = document.createElement('script');
        firebaseInitScript.src = "/__/firebase/init.js";
        firebaseInitScript.async = false;
        parent.insertBefore(firebaseInitScript, insertBefore);
    }
}
