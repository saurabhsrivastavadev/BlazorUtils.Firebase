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
        private readonly Lazy<Task<IJSObjectReference>> moduleTask;
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

            Logger = logger;

            moduleTask = new(() => jsr.InvokeAsync<IJSObjectReference>(
               "import", "./_content/BlazorUtils.Firebase/auth.js").AsTask());

            AuthStateChangedCallback += _ =>
            {
                base.NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
            };
            RegisterForAuthStateChangedEvent();
        }

        private async void RegisterForAuthStateChangedEvent()
        {
            var module = await moduleTask.Value;
            int retries = 0;
            while (retries++ < 5)
            {
                try
                {
                    await module.InvokeAsync<bool>("registerForAuthStateChange",
                        "BlazorUtils.Firebase", "OnAuthStateChangedJsCallback");
                    return;
                }
                catch (Exception)
                {
                    Console.WriteLine("RegisterForAuthStateChangedEvent retry.");
                    await Task.Delay(200);
                }
            }
            Logger.LogError("Failed to register for auth change event");
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

        public Task<FirebaseGoogleAuthResult> SignInWithPopup(ISet<string> signInScopes = null)
        {
            return SignIn(signInScopes, true);
        }
        public Task<FirebaseGoogleAuthResult> SignInWithRedirect(ISet<string> signInScopes = null)
        {
            return SignIn(signInScopes, false);
        }

        private async Task<FirebaseGoogleAuthResult> SignIn(
            ISet<string> signInScopes, bool signInWithPopup)
        {
            var module = await moduleTask.Value;
            string signInResult = string.Empty;
            bool wasUserSignedIn = await IsSignedIn();

            string jsMethod = signInWithPopup ? 
                "signInWithPopup": "signInWithRedirect";
            try
            {
                signInResult = await module.InvokeAsync<string>(jsMethod, signInScopes);
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
            var module = await moduleTask.Value;
            string signOutResult = string.Empty;
            bool wasUserSignedIn = await IsSignedIn();

            try
            {
                signOutResult =
                    await module.InvokeAsync<string>("signOut");
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
            var module = await moduleTask.Value;
            int retries = 0;
            while (retries++ < 5)
            {
                try
                {
                    string userJson =
                        await module.InvokeAsync<string>("getCurrentUser");

                    return ParseUserJson(userJson);
                }
                catch (Exception)
                {
                    Console.WriteLine("GetCurrentUser retry.");
                    await Task.Delay(200);
                }
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
            var module = await moduleTask.Value;
            int retries = 0;
            Exception failure = null;
            while (retries++ < 5)
            {
                try
                {
                    return await module.InvokeAsync<bool>("isSignedIn");
                }
                catch (Exception e)
                {
                    Console.WriteLine("isSignedIn retry.");
                    failure = e;
                    await Task.Delay(200);
                }
            }
            throw failure;
        }

        public async Task<bool> SetPersistence(string persistence)
        {
            var module = await moduleTask.Value;
            int retries = 0;
            Exception failure = null;
            while (retries++ < 5)
            {
                try
                {
                    return await module.InvokeAsync<bool>("setPersistence", persistence);
                }
                catch (Exception e)
                {
                    Console.WriteLine("isSignedIn retry.");
                    failure = e;
                    await Task.Delay(200);
                }
            }
            throw failure;
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
