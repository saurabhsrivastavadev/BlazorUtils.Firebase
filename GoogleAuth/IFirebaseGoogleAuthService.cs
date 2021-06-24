using Microsoft.AspNetCore.Components;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BlazorUtils.Firebase
{
    public interface IFirebaseGoogleAuthService
    {
        /// <summary>
        /// Sign in user with a popup window via firebase google auth sdk.
        /// </summary>
        /// <param name="signInScopes">
        /// Specify OAuth 2.0 scopes to be requested during sign in.
        /// Below is the list of scopes for Google Authentication:
        /// https://developers.google.com/identity/protocols/oauth2/scopes
        /// </param>
        /// <returns></returns>
        Task<FirebaseGoogleAuthResult> SignInWithPopup(ISet<string> signInScopes = null);

        /// <summary>
        /// Sign in user with redirect via firebase google auth sdk.
        /// </summary>
        /// <param name="signInScopes">
        /// Specify OAuth 2.0 scopes to be requested during sign in.
        /// Below is the list of scopes for Google Authentication:
        /// https://developers.google.com/identity/protocols/oauth2/scopes
        /// </param>
        /// <returns></returns>
        Task<FirebaseGoogleAuthResult> SignInWithRedirect(ISet<string> signInScopes = null);

        /// <summary>
        /// Sign out the current user.
        /// </summary>
        /// <returns>
        /// Auth result object, with success field indicating the status of sign out process.
        /// </returns>
        Task<FirebaseGoogleAuthResult> SignOut();

        /// <summary>
        /// Get the currently signed in user.
        /// </summary>
        /// <returns>
        /// User object if a user is signed in, null otherwise.
        /// </returns>
        Task<FirebaseGoogleAuthResult.GoogleAuthUser> GetCurrentUser();

        /// <summary>
        /// Check if user is signed in or not.
        /// </summary>
        /// <returns>
        /// true if user is signed in, false otherwise.
        /// </returns>
        Task<bool> IsSignedIn();

        /// <summary>
        /// Set the sign in persistence state.
        /// Lets the firebase SDK decide whether to keep the user signed in
        /// on page refresh or not.
        /// </summary>
        /// <param name="persistence">
        /// persistence string can have one of below 3 values:
        /// NONE - Don't persist user sign in state
        /// SESSION - Persist sign in state only for the current tab/session.
        /// LOCAL - Persist sign in state across different tabs.
        /// </param>
        /// <returns>
        /// true for success, false for failure
        /// </returns>
        Task<bool> SetPersistence(string persistence);

        /// <summary>
        /// Callback which clients of this service can register to receive events
        /// when the user signs in or signs out.
        /// </summary>
        /// <param name="user">
        /// Set to the user on sign in, and set to null on sign out
        /// </param>
        delegate void AuthStateChangedCallbackType(FirebaseGoogleAuthResult.GoogleAuthUser user);
        AuthStateChangedCallbackType AuthStateChangedCallback { get; set; }
    }
}
