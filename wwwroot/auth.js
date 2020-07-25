
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
