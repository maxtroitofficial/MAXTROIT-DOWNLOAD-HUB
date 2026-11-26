package com.maxtroit.downloadhubadmin;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.SslError;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.net.URI;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int FILE_PICKER = 7041;
    private static final String PREFS = "hub_admin_settings";
    private static final String KEY_URL = "admin_url";
    private WebView webView;
    private LinearLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private String allowedHost;
    private int allowedPort = 443;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(16,24,43));
        getWindow().setNavigationBarColor(Color.rgb(16,24,43));
        String saved = getPreferences(MODE_PRIVATE).getString(KEY_URL, "");
        if (!saved.isEmpty() && validAdminUrl(saved)) openAdmin(saved);
        else showSetup("");
    }

    private void showSetup(String current) {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(24), dp(42), dp(24), dp(24));
        root.setBackgroundColor(Color.rgb(16,24,43));

        TextView title = new TextView(this);
        title.setText("Download Hub Admin");
        title.setTextColor(Color.WHITE);
        title.setTextSize(26);
        title.setPadding(0, 0, 0, dp(10));
        root.addView(title);

        TextView help = new TextView(this);
        help.setText("Enter your own deployed website URL. This app connects only to that HTTPS website and keeps the address on this device.");
        help.setTextColor(Color.LTGRAY);
        help.setTextSize(15);
        root.addView(help);

        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setHint("https://your-site.web.app");
        input.setTextColor(Color.WHITE);
        input.setHintTextColor(Color.GRAY);
        input.setInputType( android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_URI );
        input.setText(current);
        input.setPadding(dp(12), dp(12), dp(12), dp(12));
        root.addView(input, new LinearLayout.LayoutParams(-1, dp(54)));

        Button connect = new Button(this);
        connect.setText("Open my Admin Panel");
        root.addView(connect, new LinearLayout.LayoutParams(-1, dp(52)));
        TextView status = new TextView(this);
        status.setTextColor(Color.rgb(255,190,120));
        status.setPadding(0, dp(14), 0, 0);
        root.addView(status);

        TextView privacy = new TextView(this);
        privacy.setText("Only HTTPS URLs are accepted. Passwords are entered on your own website, never inside this app. External links open in your browser.");
        privacy.setTextColor(Color.LTGRAY);
        privacy.setTextSize(12);
        privacy.setPadding(0, dp(22), 0, 0);
        root.addView(privacy);

        connect.setOnClickListener(v -> {
            String raw = input.getText().toString().trim();
            String normalized = normalizeAdminUrl(raw);
            if (normalized == null) {
                status.setText("Enter a valid HTTPS website address, such as https://your-site.web.app");
                return;
            }
            getPreferences(MODE_PRIVATE).edit().putString(KEY_URL, normalized).apply();
            openAdmin(normalized);
        });
        setContentView(root);
    }

    private String normalizeAdminUrl(String raw) {
        try {
            URI uri = new URI(raw);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null ||
                uri.getUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443) ||
                uri.getHost().contains("..")) return null;
            String path = uri.getPath();
            if (path == null || path.isEmpty() || "/".equals(path)) path = "/admin.html";
            if (!path.endsWith("/admin.html")) return null;
            return new URI("https", null, uri.getHost().toLowerCase(Locale.ROOT), -1,
                path, null, null).toString();
        } catch (Exception e) { return null; }
    }

    private boolean validAdminUrl(String value) {
        return normalizeAdminUrl(value) != null;
    }

    private void openAdmin(String url) {
        URI uri;
        try { uri = URI.create(url); }
        catch (Exception e) { showSetup(""); return; }
        allowedHost = uri.getHost().toLowerCase(Locale.ROOT);
        allowedPort = 443;

        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setPadding(dp(8), dp(4), dp(8), dp(4));
        bar.setBackgroundColor(Color.rgb(16,24,43));
        Button change = new Button(this);
        change.setText("Change site");
        bar.addView(change);
        TextView label = new TextView(this);
        label.setText("  " + allowedHost);
        label.setTextColor(Color.WHITE);
        label.setGravity(android.view.Gravity.CENTER_VERTICAL);
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
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                if ("https".equalsIgnoreCase(target.getScheme()) &&
                    allowedHost.equalsIgnoreCase(target.getHost()) &&
                    (target.getPort() == -1 || target.getPort() == allowedPort)) return false;
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
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                try { startActivityForResult(Intent.createChooser(intent, "Choose file"), FILE_PICKER); }
                catch (Exception e) { fileCallback = null; callback.onReceiveValue(null); return false; }
                return true;
            }
        });
        root.addView(webView, new LinearLayout.LayoutParams(-1, 0, 1));
        change.setOnClickListener(v -> new AlertDialog.Builder(this)
            .setTitle("Change Admin website?")
            .setMessage("The saved website address on this device will be cleared.")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Change", (d, w) -> {
                getPreferences(MODE_PRIVATE).edit().remove(KEY_URL).apply();
                showSetup("");
            }).show());
        setContentView(root);
        webView.loadUrl(url);
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
        else if (webView != null) new AlertDialog.Builder(this)
            .setMessage("Exit Admin Panel?")
            .setNegativeButton("Stay", null)
            .setPositiveButton("Exit", (d, w) -> finish()).show();
        else super.onBackPressed();
    }

    private int dp(int value) { return (int)(value * getResources().getDisplayMetrics().density + 0.5f); }

    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
