using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace BlazorUtils.Firebase.Core
{
    public enum FirebaseModule
    {
        AUTHENTICATION,
        AUTHENTICATION_EMULATOR,
        FIRESTORE,
        FIRESTORE_EMULATOR
    }

    public class FirebaseConfig
    {
        public string ApiKey { get; set; }
        public string AuthDomain { get; set; }
        public string DatabaseURL { get; set; }
        public string MessagingSenderId { get; set; }
        public string ProjectId { get; set; }
        public string StorageBucket { get; set; }
    }

    // This class encapsulates init params sent to JS native code.
    // Need to make sure same argument names are used in the JS code.
    internal class FirebaseSdkInitParams
    {
        public string FirebaseProjectId { get; set; }
        public FirebaseConfig FirebaseConfig { get; set; }
        public bool UseAuthModule { get; set; }
        public bool EmulateAuthModule { get; set; }
        public bool UseFirestoreModule { get; set; }
        public bool EmulateFirestoreModule { get; set; }
    }

    public static class Firebase
    {
        public static List<FirebaseModule> EnabledModules { get; private set; }
        public static string FirebaseProjectId { get; set; }
        public static FirebaseConfig FirebaseConfig { get; private set; }

        public static void EnableModules(
            IServiceCollection webAssemblyHostBuilderServices, 
            string firebaseProjectId, FirebaseConfig config, List<FirebaseModule> moduleList)
        {
            EnabledModules = moduleList;
            FirebaseProjectId = firebaseProjectId;
            FirebaseConfig = config;

            if (moduleList != null && moduleList.Contains(FirebaseModule.AUTHENTICATION))
            {
                // Firebase auth
                webAssemblyHostBuilderServices.AddSingleton<FirebaseGoogleAuthService>();
                webAssemblyHostBuilderServices.AddScoped<IFirebaseGoogleAuthService>(
                    provider => provider.GetRequiredService<FirebaseGoogleAuthService>());
                webAssemblyHostBuilderServices.AddScoped<AuthenticationStateProvider>(
                    provider => provider.GetRequiredService<FirebaseGoogleAuthService>());
            }

            if (moduleList != null && moduleList.Contains(FirebaseModule.FIRESTORE))
            {
                // Firebase firestore
                webAssemblyHostBuilderServices.AddSingleton<IFirestoreService, FirestoreService>();
            }
        }

        internal static async Task InitFirebaseSdk(Lazy<Task<IJSObjectReference>> initModuleTask)
        {
            var initModule = await initModuleTask.Value;
            int retries = 0;
            while (retries++ < 5)
            {
                try
                {
                    var initParams = new FirebaseSdkInitParams
                    {
                        FirebaseProjectId = FirebaseProjectId,
                        FirebaseConfig = FirebaseConfig,
                        UseAuthModule = EnabledModules.Contains(FirebaseModule.AUTHENTICATION),
                        UseFirestoreModule = EnabledModules.Contains(FirebaseModule.FIRESTORE),
                        EmulateAuthModule = EnabledModules.Contains(FirebaseModule.AUTHENTICATION_EMULATOR),
                        EmulateFirestoreModule = EnabledModules.Contains(FirebaseModule.FIRESTORE_EMULATOR)
                    };

                    await initModule.InvokeVoidAsync(
                        "loadFirebaseSdk", JsonSerializer.Serialize(initParams));

                    return;
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    Console.WriteLine("loadFirebaseSdk retry.");
                    await Task.Delay(200);
                }
            }
        }
    }
}
