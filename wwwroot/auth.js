// auth.js
// Wrappers on top of firebase authentication javascript sdk

import {
    GoogleAuthProvider, getAuth, setPersistence, browserSessionPersistence, signInWithPopup,
    signInWithRedirect, signOut
} from 'https://www.gstatic.com/firebasejs/9.3.0/firebase-auth.js';

let provider = null;
let isRegisteredForAuthStateChange = false;
let signedInUser = null;

/** 
 * Sign in using Google auth with a popup window.
 * The current tab will not be redirected for login.
 * @param {string[]} signInScopeList
 * The list of Google API scopes that will be requested during sign in
 * @returns {string} Stringified auth result object
 */
async function firebaseSignInWithPopup(signInScopeList) {

    return await firebaseSignIn(signInScopeList, "popup");
}

/**
 * Sign in using Google auth with a redirect.
 * The current tab will be redirected for login.
 * @param {string[]} signInScopeList
 * The list of Google API scopes that will be requested during sign in
 * @returns {string} Stringified auth result object
 */
async function firebaseSignInWithRedirect(signInScopeList) {

    return await firebaseSignIn(signInScopeList, "redirect");
}

/**
 * Sign in using Google auth with redirect or popup window.
 * @param {string[]} signInScopeList
 * The list of Google API scopes that will be requested during sign in
 * @param {string} loginType 
 * The login type must be passed in as "popup" or "redirect"
 * @returns {string} Stringified auth result object
 */
async function firebaseSignIn(signInScopeList, loginType) {

    if (provider == null) {
        provider = new GoogleAuthProvider();
    }

    if (signInScopeList) {
        signInScopeList.forEach((scope) => {
            provider.addScope(scope);
        });
    }

    // by default resort to local persistence
    // keep the user signed in
    const auth = getAuth();
    await setPersistence(auth, browserSessionPersistence);

    let resultObj;
    try {

        if (loginType === "popup") {
            resultObj = await signInWithPopup(auth, provider);
        } else if (loginType === "redirect") {
            resultObj = await signInWithRedirect(auth, provider);
        } else {
            throw { message: `Invalid login type: ${loginType}` };
        }

        resultObj.success = true;
        signedInUser = resultObj.user;

    } catch (error) {

        resultObj = getErrorObject(error);
    }

    return JSON.stringify(resultObj);
}

/**
 * Sign out the currently signed in user.
 * No effect if user is not signed in.
 * @returns {string} Stringified auth result object.
 * */
async function firebaseSignOut() {

    let resultObj;
    try {

        const auth = getAuth();
        await signOut(auth);
        resultObj = {
            success: true,
        }
        signedInUser = null;

    } catch (error) {

        resultObj = getErrorObject(error);
    }

    return JSON.stringify(resultObj);
}

/**
 * Configure Firebase libary to use emulators for local validation
 * */
async function firebaseUseAuthEmulator(port = 9099) {

    const auth = getAuth();
    auth.useEmulator(`http://localhost:${port}`);
}

/**
 * Register callback to be notified of sign in and sign out events.
 * @param {string} assemblyName The .Net assembly containing the callback to be invoked
 * @param {string} authStateChangeCbName The .Net callback to be invoked on auth state change
 */
async function firebaseRegisterForAuthStateChange(assemblyName, authStateChangeCbName) {

    if (isRegisteredForAuthStateChange) {
        return true;
    }

    const auth = getAuth();
    auth.onAuthStateChanged(user => {

        signedInUser = user;

        let userJson = null;
        if (user) {
            userJson = JSON.stringify(user);
        } else {
            userJson = JSON.stringify({});
        }
        DotNet.invokeMethodAsync(assemblyName, authStateChangeCbName, userJson);
    });

    isRegisteredForAuthStateChange = true;
    return true;
}

/**
 * Function to set login persistence.
 * @param {string} persistence Can have value SESSION, LOCAL or NONE
 * @returns {boolean} true if operation successful, false otherwise.
 */
async function firebaseSetPersistence(persistence) {

    const auth = getAuth();

    let fbPersistence = auth.Auth.Persistence.NONE;

    if (persistence.toUpperCase() === 'SESSION') {
        fbPersistence = auth.Auth.Persistence.SESSION;
    } else if (persistence.toUpperCase() === 'LOCAL') {
        fbPersistence = auth.Auth.Persistence.LOCAL;
    } else if (persistence.toUpperCase() === 'NONE') {
        fbPersistence = auth.Auth.Persistence.NONE;
    } else {
        console.log('invalid persistence value: ' + persistence);
        return false;
    }

    try {

        await auth.setPersistence(fbPersistence);
        return true;

    } catch (error) {

        return false;
    }
}

/**
 * Get the currently signed in user.
 * @returns {string} The user object stringified.
 * */
function firebaseGetCurrentUser() {

    if (signedInUser) {
        return JSON.stringify(signedInUser);
    }
    return JSON.stringify({});
}

/**
 * Is the user signed in ?
 * @returns {boolean} true if user is signed in, false otherwise
 * */
function firebaseIsSignedIn() {

    if (signedInUser) {
        return true;
    } else {
        return false;
    }
}

// Private functions to this module

/**
 * Private function to convert error object to a custom object
 * @param {any} error
 */
function getErrorObject(error) {

    return {
        success: false,

        error: {
            code: error.code,
            message: error.message
        }
    };
}

export {
    firebaseSignInWithPopup, firebaseSignInWithRedirect, firebaseSignOut, firebaseUseAuthEmulator,
    firebaseRegisterForAuthStateChange, firebaseSetPersistence, firebaseGetCurrentUser,
    firebaseIsSignedIn
};
