using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace BlazorUtils.Firebase
{
    public class FirebaseGoogleAuthResult
    {
        public bool Success { get; set; }
        public GoogleAuthUser User { get; set; }
        public GoogleAuthCredential Credential { get; set; }
        public GoogleAuthAdditionaluserinfo AdditionalUserInfo { get; set; }
        public string OperationType { get; set; }
        public GoogleAuthError Error { get; set; }

        public class GoogleAuthUser
        {
            public string uid { get; set; }
            public string displayName { get; set; }
            public string photoURL { get; set; }
            public string email { get; set; }
            public bool emailVerified { get; set; }
            public object phoneNumber { get; set; }
            public bool isAnonymous { get; set; }
            public object tenantId { get; set; }
            public Providerdata[] providerData { get; set; }
            public string apiKey { get; set; }
            public string appName { get; set; }
            public string authDomain { get; set; }
            public Ststokenmanager stsTokenManager { get; set; }
            public object redirectEventId { get; set; }
            public string lastLoginAt { get; set; }
            public string createdAt { get; set; }
            public Multifactor multiFactor { get; set; }
        }

        public class Ststokenmanager
        {
            public string apiKey { get; set; }
            public string refreshToken { get; set; }
            public string accessToken { get; set; }
            public long expirationTime { get; set; }
        }

        public class Multifactor
        {
            public object[] enrolledFactors { get; set; }
        }

        public class Providerdata
        {
            public string uid { get; set; }
            public string displayName { get; set; }
            public string photoURL { get; set; }
            public string email { get; set; }
            public object phoneNumber { get; set; }
            public string providerId { get; set; }
        }

        public class GoogleAuthCredential
        {
            public string providerId { get; set; }
            public string signInMethod { get; set; }
            public string oauthIdToken { get; set; }
            public string oauthAccessToken { get; set; }
        }

        public class GoogleAuthAdditionaluserinfo
        {
            public string providerId { get; set; }
            public bool isNewUser { get; set; }
            public Profile profile { get; set; }
        }

        public class Profile
        {
            public string name { get; set; }
            public string granted_scopes { get; set; }
            public string id { get; set; }
            public bool verified_email { get; set; }
            public string given_name { get; set; }
            public string locale { get; set; }
            public string family_name { get; set; }
            public string email { get; set; }
            public string picture { get; set; }
        }

        public class GoogleAuthError
        {
            public string code { get; set; }
            public string message { get; set; }
        }
    }
}
