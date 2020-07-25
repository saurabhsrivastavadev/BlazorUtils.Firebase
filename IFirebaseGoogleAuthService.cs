using System.Collections.Generic;
using System.Threading.Tasks;

namespace BlazorUtils.Firebase
{
    public interface IFirebaseGoogleAuthService
    {
        Task<FirebaseGoogleAuthResult> SignInWithPopup(ISet<string> signInScopes = null);
        Task<FirebaseGoogleAuthResult> SignOut();
        Task<FirebaseGoogleAuthResult.GoogleAuthUser> GetCurrentUser();
        Task<bool> IsSignedIn();
    }
}
