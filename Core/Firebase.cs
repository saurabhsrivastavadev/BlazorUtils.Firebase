using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BlazorUtils.Firebase.Core
{
    public enum FirebaseModule
    {
        AUTHENTICATION,
        FIRESTORE
    }

    public static class Firebase
    {
        public static List<FirebaseModule> EnabledModules { get; private set; }

        public static void EnableModules(
            IServiceCollection webAssemblyHostBuilderServices, List<FirebaseModule> moduleList)
        {
            EnabledModules = moduleList;

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
                webAssemblyHostBuilderServices.AddSingleton<FirestoreService>();
            }
        }

        public static async void InitFirebaseSdk(Lazy<Task<IJSObjectReference>> initModuleTask)
        {
            var initModule = await initModuleTask.Value;
            int retries = 0;
            while (retries++ < 5)
            {
                try
                {
                    await initModule.InvokeVoidAsync("loadFirebaseSdk",
                        Core.Firebase.EnabledModules.Contains(FirebaseModule.AUTHENTICATION),
                        Core.Firebase.EnabledModules.Contains(FirebaseModule.FIRESTORE));
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
