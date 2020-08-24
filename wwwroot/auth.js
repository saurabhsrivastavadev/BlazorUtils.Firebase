
// Wrappers on top of firebase javascript sdk

// Initialize our base objects
if (!window.blazor_utils) {
    window.blazor_utils = {};
}
if (!window.blazor_utils.firebase_auth) {
    window.blazor_utils.firebase_auth = {};
}

// Define the firebase google auth object
window.blazor_utils.firebase_auth.google = {

    provider: null,
    isRegisteredForAuthStateChange: false,
    signedInUser: null,

    /**
     * Sign in using Google auth with a popup window.
     * The current tab will not be redirected for login.
     * @param {string[]} signInScopeList
     * The list of Google API scopes that will be requested during sign in
     * @returns {string} Stringified auth result object
     */
    signInWithPopup: async function (signInScopeList) {

        if (this.provider == null) {
            this.provider = new firebase.auth.GoogleAuthProvider();
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

            resultObj = await firebase.auth().signInWithPopup(this.provider);
            resultObj.success = true;
            this.signedInUser = resultObj.user;

        } catch (error) {

            resultObj = this.getErrorObject(error);
        }

        return JSON.stringify(resultObj);
    },

    /**
     * Sign out the currently signed in user.
     * No effect if user is not signed in.
     * @returns {string} Stringified auth result object.
     * */
    signOut: async function () {

        let resultObj;
        try {

            await firebase.auth().signOut();
            resultObj = {
                success: true,
            }
            this.signedInUser = null;

        } catch (error) {

            resultObj = this.getErrorObject(error);
        }

        return JSON.stringify(resultObj);
    },

    /**
     * Register callback to be notified of sign in and sign out events.
     * @param {string} assemblyName The .Net assembly containing the callback to be invoked
     * @param {string} authStateChangeCbName The .Net callback to be invoked on auth state change
     */
    registerForAuthStateChange: async function (assemblyName, authStateChangeCbName) {

        if (this.isRegisteredForAuthStateChange) {
            return true;
        }
        firebase.auth().onAuthStateChanged(user => {

            this.signedInUser = user;

            let userJson = null;
            if (user) {
                userJson = JSON.stringify(user);
            } else {
                userJson = JSON.stringify({});
            }
            DotNet.invokeMethodAsync(assemblyName, authStateChangeCbName, userJson);
        });
        this.isRegisteredForAuthStateChange = true;
        return true;
    },

    /**
     * Function to set login persistence.
     * @param {string} persistence Can have value SESSION, LOCAL or NONE
     * @returns {boolean} true if operation successful, false otherwise.
     */
    setPersistence: async function (persistence) {

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
    },

    /**
     * Get the currently signed in user.
     * @returns {string} The user object stringified.
     * */
    getCurrentUser: function () {

        if (this.signedInUser) {
            return JSON.stringify(this.signedInUser);
        }
        return JSON.stringify({});
    },

    /**
     * Is the user signed in ?
     * @returns {boolean} true if user is signed in, false otherwise
     * */
    isSignedIn: function () {

        if (this.signedInUser) {
            return true;
        } else {
            return false;
        }
    },

    /**
     * Private function to convert error object to a custom object
     * @param {any} error
     */
    getErrorObject: function (error) {

        return {
            success: false,

            error: {
                code: error.code,
                message: error.message
            }
        };
    }
};
