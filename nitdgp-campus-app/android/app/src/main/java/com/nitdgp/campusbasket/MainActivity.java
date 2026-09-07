package com.nitdgp.campusbasket;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public class MainActivity extends BridgeActivity {
    private static final String WEB_CLIENT_ID = "202495303011-b9a24kpo8mfh77bqq48a7ao9aoghdhsp.apps.googleusercontent.com";
    private GoogleSignInClient mGoogleSignInClient;
    private ActivityResultLauncher<Intent> mGoogleSignInLauncher;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure Google Play Services native Sign-In with server Web Client ID
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(WEB_CLIENT_ID)
                .requestEmail()
                .build();

        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);

        // Register system account picker result launcher
        mGoogleSignInLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
                    handleSignInResult(task);
                }
        );

        if (this.bridge != null) {
            WebView mainWebView = this.bridge.getWebView();
            if (mainWebView != null) {
                WebSettings settings = mainWebView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);

                // Native bridge allowing JavaScript to invoke the Android System Account Picker
                mainWebView.addJavascriptInterface(new Object() {
                    @JavascriptInterface
                    public void triggerNativeGoogleSignIn() {
                        runOnUiThread(() -> {
                            mGoogleSignInClient.signOut().addOnCompleteListener(MainActivity.this, t -> {
                                Intent signInIntent = mGoogleSignInClient.getSignInIntent();
                                mGoogleSignInLauncher.launch(signInIntent);
                            });
                        });
                    }
                }, "AndroidNativeAuth");
            }
        }
    }

    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            if (account != null) {
                String idToken = account.getIdToken();
                String email = account.getEmail();
                String displayName = account.getDisplayName();

                if (this.bridge != null && this.bridge.getWebView() != null) {
                    String json = "{"
                            + "\"credential\":\"" + (idToken != null ? idToken : "") + "\","
                            + "\"email\":\"" + (email != null ? email : "") + "\","
                            + "\"name\":\"" + (displayName != null ? displayName.replace("\"", "\\\"") : "") + "\""
                            + "}";
                    this.bridge.getWebView().evaluateJavascript(
                            "if (window.handleAndroidGoogleToken) { window.handleAndroidGoogleToken(" + json + "); }",
                            null
                    );
                }
            }
        } catch (ApiException e) {
            int statusCode = e.getStatusCode();
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().evaluateJavascript(
                        "if (window.handleAndroidGoogleError) { window.handleAndroidGoogleError(" + statusCode + "); }",
                        null
                );
            }
        }
    }
}
