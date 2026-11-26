package com.maxtroit.downloadhubadmin;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.http.SslError;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {
    private static final int FILE_PICKER = 7041;
    private static final String APP_ORIGIN = "https://appassets.androidplatform.net";
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private WebViewAssetLoader assetLoader;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(16,24,43));
        getWindow().setNavigationBarColor(Color.rgb(16,24,43));
        assetLoader = new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        showAdmin();
    }

    private void showAdmin() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(8), dp(3), dp(8), dp(3));
        bar.setBackgroundColor(Color.rgb(16,24,43));

        Button reload = new Button(this);
        reload.setText("Refresh");
        bar.addView(reload);

        TextView label = new TextView(this);
        label.setText("  Download Hub Admin · Built-in panel");
        label.setTextColor(Color.WHITE);
        label.setGravity(Gravity.CENTER_VERTICAL);
        bar.addView(label, new LinearLayout.LayoutParams(0, dp(48), 1));
        root.addView(bar);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.setWebViewClient(new WebViewClient() {
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                if ("https".equalsIgnoreCase(target.getScheme()) &&
                    "appassets.androidplatform.net".equalsIgnoreCase(target.getHost())) return false;
                if ("https".equalsIgnoreCase(target.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, target)); } catch (Exception ignored) {}
                }
                return true;
            }
            @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    startActivityForResult(intent, FILE_PICKER);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }
        });

        root.addView(webView, new LinearLayout.LayoutParams(-1, 0, 1));
        reload.setOnClickListener(v -> webView.reload());
        setContentView(root);
        webView.loadUrl(APP_ORIGIN + "/admin.html");
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_PICKER && fileCallback != null) {
            Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            fileCallback.onReceiveValue(results);
            fileCallback = null;
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else new AlertDialog.Builder(this)
            .setMessage("Exit Admin Panel?")
            .setNegativeButton("Stay", null)
            .setPositiveButton("Exit", (d, w) -> finish()).show();
    }

    private int dp(int value) {
        return (int)(value * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}