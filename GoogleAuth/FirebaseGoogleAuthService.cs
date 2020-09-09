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

        public IFirebaseGoogleAuthService.AuthStateChangedCallbackType AuthStateChangedCallback { get; set; }

        // Hold instance for callback invocation from javascript
        private static WeakReference<FirebaseGoogleAuthService> Instance { get; set; }

        public FirebaseGoogleAuthService(IJSRuntime jsr, ILogger<FirebaseGoogleAuthService> logger)
        {
            if (Instance != null)
            {
                throw new Exception("Only one instance of FirebaseGoogleAuthService allowed.");
            }

            Instance = new WeakReference<FirebaseGoogleAuthService>(this);

            JSR = jsr;
            Logger = logger;

            AuthStateChangedCallback += _ =>
            {
                base.NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
            };
            RegisterForAuthStateChangedEvent();
        }

        private async void RegisterForAuthStateChangedEvent()
        {
            try
            {
                await JSR.InvokeAsync<bool>("window.blazor_utils.firebase.auth.google.registerForAuthStateChange",
                    "BlazorUtils.Firebase", "OnAuthStateChangedJsCallback");
            }
            catch (Exception e)
            {
                Logger.LogError("Failed to register for auth change event");
                Logger.LogError(e.Message);
            }
        }

        [JSInvokable]
        public static void OnAuthStateChangedJsCallback(string userJson)
        {
            FirebaseGoogleAuthService instance;
            if (Instance.TryGetTarget(out instance))
            {
                instance.AuthStateChangedCallback.Invoke(ParseUserJson(userJson));
            }
            else
            {
                Console.WriteLine("Failed to get auth service weak reference instance");
            }
        }

        public async Task<FirebaseGoogleAuthResult> SignInWithPopup(ISet<string> signInScopes = null)
        {
            string signInResult = string.Empty;
            bool wasUserSignedIn = await IsSignedIn();

            try
            {
                signInResult =
                    await JSR.InvokeAsync<string>(
                        "window.blazor_utils.firebase.auth.google.signInWithPopup", signInScopes);
            }
            catch (Exception e)
            {
                Logger.LogError("Sign in failed.");
                Logger.LogError(e.Message);
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
                    await JSR.InvokeAsync<string>("window.blazor_utils.firebase.auth.google.signOut");
            }
            catch (Exception e)
            {
                Logger.LogError("Sign out failed.");
                Logger.LogError(e.Message);
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
                        "window.blazor_utils.firebase.auth.google.getCurrentUser");

                return ParseUserJson(userJson);
            }
            catch (Exception e)
            {
                Logger.LogError(e.Message);
            }

            return null;
        }

        private static FirebaseGoogleAuthResult.GoogleAuthUser ParseUserJson(string userJson)
        {
            try
            {
                var googleUser = JsonSerializer.Deserialize<FirebaseGoogleAuthResult.GoogleAuthUser>(
                    userJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (googleUser != null && googleUser.email != null)
                {
                    return googleUser;
                }
            }
            catch (Exception) { }

            return null;
        }

        public async Task<bool> IsSignedIn()
        {
            return await JSR.InvokeAsync<bool>(
                    "window.blazor_utils.firebase.auth.google.isSignedIn");
        }

        public async Task<bool> SetPersistence(string persistence)
        {
            return await JSR.InvokeAsync<bool>(
                    "window.blazor_utils.firebase.auth.google.setPersistence", persistence);
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
