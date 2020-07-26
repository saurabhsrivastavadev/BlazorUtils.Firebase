
// Wrappers on top of firebase javascript sdk
window.blazor_utils = {

    firebase_auth: {

        google: {

            provider: null,

            signInWithPopup: async function(signInScopeList) {

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

                } catch (error) {

                    resultObj = this.getErrorObject(error);
                }

                return JSON.stringify(resultObj);
            },

            signOut: async function () {

                let resultObj;
                try {

                    await firebase.auth().signOut();
                    resultObj = {
                        success: true,
                    }
                } catch (error) {

                    resultObj = this.getErrorObject(error);
                }

                return JSON.stringify(resultObj);
            },

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

            getCurrentUser: function () {

                let user = firebase.auth().currentUser;
                if (user) {
                    return JSON.stringify(user);
                }
                return JSON.stringify({});
            },

            isSignedIn: function () {

                let user = firebase.auth().currentUser;
                if (user) {
                    return true;
                } else {
                    return false;
                }
            },

            getErrorObject: function (error) {

                return {
                    success: false,

                    error: {
                        code: error.code,
                        message: error.message
                    }
                };
            }
        }
    }
};
