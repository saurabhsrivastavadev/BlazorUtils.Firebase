# BlazorUtils.Firebase

This project is a Blazor wrapper for Firebase Javscript SDK.

### Installation
> Add reference to this BlazorUtils.Firebase project in your Blazor project.<br>
> The path will be specific to where you pull this repo on your system.
```
<ProjectReference Include="..\..\BlazorUtils\BlazorUtils.Firebase\BlazorUtils.Firebase.csproj" />
```

> Add the required firebase services to Program.cs <br>
> Below example shows adding the Firebase Auth service
```
// Firebase auth
builder.Services.AddSingleton<IFirebaseGoogleAuthService, FirebaseGoogleAuthService>();
```

> Add below scripts to index.html
> Below snippet shows the scripts added for firebase authentication 
```
<!-- Firebase setup :: https://firebase.google.com/docs/web/setup -->
<!-- Firebase App (the core Firebase SDK) is always required and must be listed first -->
<script src="/__/firebase/7.16.1/firebase-app.js"></script>
<!-- Add Firebase products that you want to use -->
<script src="/__/firebase/7.16.1/firebase-auth.js"></script>

<!-- Initialize Firebase -->
<script src="/__/firebase/init.js"></script>
<!-- Firebase setup :: end -->

<script src="_content/BlazorUtils.Firebase/auth.js"></script>
```

### Demo Project
Here's a project which uses BlazorUtils.Firebase library:<br>
https://github.com/sobu86/TimeUtilities

You can take a look at this commit specifically:<br>
https://github.com/sobu86/TimeUtilities/commit/bbaeef8510b47d5893ed1d04a57f0eb6940a9af0
