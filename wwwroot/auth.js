// auth.js
// Wrappers on top of firebase authentication javascript sdk

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
export async function signInWithPopup(signInScopeList) {

    return await signIn(signInScopeList, "popup");
}

/**
 * Sign in using Google auth with a redirect.
 * The current tab will be redirected for login.
 * @param {string[]} signInScopeList
 * The list of Google API scopes that will be requested during sign in
 * @returns {string} Stringified auth result object
 */
export async function signInWithRedirect(signInScopeList) {

    return await signIn(signInScopeList, "redirect");
}

/**
 * Sign in using Google auth with redirect or popup window.
 * @param {string[]} signInScopeList
 * The list of Google API scopes that will be requested during sign in
 * @param {string} loginType 
 * The login type must be passed in as "popup" or "redirect"
 * @returns {string} Stringified auth result object
 */
export async function signIn(signInScopeList, loginType) {

    if (provider == null) {
        provider = new firebase.auth.GoogleAuthProvider();
    }

    if (signInScopeList) {
        signInScopeList.forEach((scope) => {
            provider.addScope(scope);
        });
    }

    // by default resort to local persistence
    // keep the user signed in
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    let resultObj;
    try {

        if (loginType === "popup") {
            resultObj = await firebase.auth().signInWithPopup(provider);
        } else if (loginType === "redirect") {
            resultObj = await firebase.auth().signInWithRedirect(provider);
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
export async function signOut() {

    let resultObj;
    try {

        await firebase.auth().signOut();
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
 * Register callback to be notified of sign in and sign out events.
 * @param {string} assemblyName The .Net assembly containing the callback to be invoked
 * @param {string} authStateChangeCbName The .Net callback to be invoked on auth state change
 */
export async function registerForAuthStateChange(assemblyName, authStateChangeCbName) {

    if (isRegisteredForAuthStateChange) {
        return true;
    }
    firebase.auth().onAuthStateChanged(user => {

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
export async function setPersistence(persistence) {

    let fbPersistence = firebase.auth.Auth.Persistence.NONE;

    if (persistence.toUpperCase() === 'SESSION') {
        fbPersistence = firebase.auth.Auth.Persistence.SESSION;
    } else if (persistence.toUpperCase() === 'LOCAL') {
        fbPersistence = firebase.auth.Auth.Persistence.LOCAL;
    } else if (persistence.toUpperCase() === 'NONE') {
        fbPersistence = firebase.auth.Auth.Persistence.NONE;
    } else {
        console.log('invalid persistence value: ' + persistence);
        return false;
    }

    try {

        await firebase.auth().setPersistence(fbPersistence);
        return true;

    } catch (error) {

        return false;
    }
}

/**
 * Get the currently signed in user.
 * @returns {string} The user object stringified.
 * */
export function getCurrentUser() {

    if (signedInUser) {
        return JSON.stringify(signedInUser);
    }
    return JSON.stringify({});
}

/**
 * Is the user signed in ?
 * @returns {boolean} true if user is signed in, false otherwise
 * */
export function isSignedIn() {

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
