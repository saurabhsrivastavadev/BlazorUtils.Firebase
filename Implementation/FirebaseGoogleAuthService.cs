using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

namespace BlazorUtils.Firebase
{
    public class FirebaseGoogleAuthService : AuthenticationStateProvider, IFirebaseGoogleAuthService
    {
        private IJSRuntime JSR { get; set; }
        private ILogger<FirebaseGoogleAuthService> Logger { get; set; }

        public FirebaseGoogleAuthService(IJSRuntime jsr, ILogger<FirebaseGoogleAuthService> logger)
        {
            JSR = jsr;
            Logger = logger;

            RegisterForAuthStateChangedEvent();
        }

        private void RegisterForAuthStateChangedEvent()
        {
            try
            {
                JSR.InvokeAsync<bool>("window.blazor_utils.firebase_auth.google.registerForAuthStateChange",
                    "BlazorUtils.Firebase", "OnAuthStateChangedJsCallback");
            }
            catch
            {
                Logger.LogError("Failed to register for auth change event");
            }
        }

        [JSInvokable]
        public static void OnAuthStateChangedJsCallback(string userJson)
        {
            Console.WriteLine("OnAuthStateChanged" + userJson);
        }

        public async Task<FirebaseGoogleAuthResult> SignInWithPopup(ISet<string> signInScopes = null)
        {
            string signInResult = string.Empty;
            bool wasUserSignedIn = await IsSignedIn();

            try
            {
                signInResult =
                    await JSR.InvokeAsync<string>(
                        "window.blazor_utils.firebase_auth.google.signInWithPopup", signInScopes);
            }
            catch
            {
                Logger.LogError("Sign in failed.");
            }

            FirebaseGoogleAuthResult result = ConvertJsonToAuthResult(signInResult);
            if (result.Success && !wasUserSignedIn)
            {
                base.NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
            }

            return result;
        }

        public async Task<FirebaseGoogleAuthResult> SignOut()
        {
            string signOutResult = string.Empty;
            bool wasUserSignedIn = await IsSignedIn();

            try
            {
                signOutResult =
                    await JSR.InvokeAsync<string>("window.blazor_utils.firebase_auth.google.signOut");
            }
            catch
            {
                Logger.LogError("Sign out failed.");
            }

            FirebaseGoogleAuthResult result = ConvertJsonToAuthResult(signOutResult);
            if (result.Success && wasUserSignedIn)
            {
                base.NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
            }

            return result;
        }

        private FirebaseGoogleAuthResult ConvertJsonToAuthResult(string json)
        {
            FirebaseGoogleAuthResult authResult;

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
            try
            {
                string userJson =
                    await JSR.InvokeAsync<string>(
                        "window.blazor_utils.firebase_auth.google.getCurrentUser");

                var googleUser = JsonSerializer.Deserialize<FirebaseGoogleAuthResult.GoogleAuthUser>(
                    userJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (googleUser != null && googleUser.email != null)
                {
                    return googleUser;
                }
            }
            catch { }

            return null;
        }

        public async Task<bool> IsSignedIn()
        {
            return await JSR.InvokeAsync<bool>(
                    "window.blazor_utils.firebase_auth.google.isSignedIn");
        }

        public async Task<bool> SetPersistence(string persistence)
        {
            return await JSR.InvokeAsync<bool>(
                    "window.blazor_utils.firebase_auth.google.setPersistence", persistence);
        }

        public override async Task<AuthenticationState> GetAuthenticationStateAsync()
        {
            FirebaseGoogleAuthResult.GoogleAuthUser googleUser = await GetCurrentUser();
            ClaimsPrincipal user;

            if (googleUser != null)
            {
                var identity = new ClaimsIdentity(
                    new List<Claim> {
                        new Claim(ClaimTypes.Name, googleUser.displayName),
                        new Claim(ClaimTypes.Email, googleUser.email)
                    }, "Firebase Google authentication");
                user = new ClaimsPrincipal(identity);
            }
            else
            {
                user = new ClaimsPrincipal();
            }

            return new AuthenticationState(user);
        }
    }
}
