
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace BlazorUtils.Firebase
{
    public class FirebaseGoogleAuthService : IFirebaseGoogleAuthService
    {
        private IJSRuntime JSR { get; set; }
        private ILogger<FirebaseGoogleAuthService> Logger { get; set; }

        public FirebaseGoogleAuthService(IJSRuntime jsr, ILogger<FirebaseGoogleAuthService> logger)
        {
            JSR = jsr;
            Logger = logger;
        }

        public async Task<FirebaseGoogleAuthResult> SignInWithPopup(ISet<string> signInScopes = null)
        {
            string signInResult =
                await JSR.InvokeAsync<string>(
                    "window.blazor_utils.firebase_auth.google.signInWithPopup", signInScopes);

            return ConvertJsonToAuthResult(signInResult);
        }

        public async Task<FirebaseGoogleAuthResult> SignOut()
        {
            string signOutResult =
                await JSR.InvokeAsync<string>("window.blazor_utils.firebase_auth.google.signOut");

            return ConvertJsonToAuthResult(signOutResult);
        }

        private FirebaseGoogleAuthResult ConvertJsonToAuthResult(string json)
        {
            FirebaseGoogleAuthResult authResult = null;

            try
            {
                authResult = JsonSerializer.Deserialize<FirebaseGoogleAuthResult>(
                    json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception e)
            {
                authResult = new FirebaseGoogleAuthResult
                {
                    Success = false,
                    Error = new FirebaseGoogleAuthResult.GoogleAuthError
                    {
                        message = e.Message
                    }
                };
            }

            return authResult;
        }

        public async Task<FirebaseGoogleAuthResult.GoogleAuthUser> GetCurrentUser()
        {
            string userJson =
                await JSR.InvokeAsync<string>(
                    "window.blazor_utils.firebase_auth.google.getCurrentUser");

            try
            {
                return JsonSerializer.Deserialize<FirebaseGoogleAuthResult.GoogleAuthUser>(
                    userJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> IsSignedIn()
        {
            return await JSR.InvokeAsync<bool>(
                    "window.blazor_utils.firebase_auth.google.isSignedIn");
        }
    }
}
