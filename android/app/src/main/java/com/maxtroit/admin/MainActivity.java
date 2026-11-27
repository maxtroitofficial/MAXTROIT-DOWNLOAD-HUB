package com.maxtroit.admin;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.Toast;
import android.view.Gravity;
import android.view.View;
import android.graphics.Color;\nimport android.graphics.Bitmap;\nimport android.graphics.BitmapFactory;\nimport android.graphics.drawable.Icon;\nimport android.content.pm.ShortcutInfo;\nimport android.content.pm.ShortcutManager;\nimport android.util.Base64;\nimport java.io.ByteArrayOutputStream;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.webkit.JavascriptInterface;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 41;
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private final String adminUrl = "https://d-hub.web.app/admin.html";
    private final String[] aliases = {".IconDefault", ".IconVice", ".IconNeon"};

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        Button iconButton = new Button(this);
        iconButton.setText("APP ICON");
        iconButton.setTextSize(10);
        iconButton.setTypeface(null, Typeface.BOLD);
        iconButton.setTextColor(Color.WHITE);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.rgb(28, 30, 48));
        bg.setCornerRadius(32);
        iconButton.setBackground(bg);
        iconButton.setPadding(18, 2, 18, 2);
        FrameLayout.LayoutParams bp = new FrameLayout.LayoutParams(-2, 42, Gravity.TOP | Gravity.END);
        bp.setMargins(0, 12, 12, 0);
        root.addView(iconButton, bp);
        iconButton.setOnClickListener(v -> showIconPicker());
        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setTextZoom(100);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                Intent intent = params.createIntent();
                try { startActivityForResult(intent, FILE_CHOOSER_REQUEST); }
                catch (ActivityNotFoundException e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "File picker unavailable", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimeType);
                String cookies = CookieManager.getInstance().getCookie(url);
                if (cookies != null) request.addRequestHeader("cookie", cookies);
                request.addRequestHeader("User-Agent", userAgent);
                request.setTitle("MAXTROIT download");
                request.setDescription("Downloading file...");
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "MAXTROIT-" + System.currentTimeMillis());
                ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
                Toast.makeText(this, "Download started", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Download could not start", Toast.LENGTH_LONG).show();
            }
        });
        if (savedInstanceState == null) webView.loadUrl(adminUrl);
        else webView.restoreState(savedInstanceState);
    }

    private class AndroidIconBridge {\n        @JavascriptInterface public String setPreset(int selected) {\n            if (selected < 0 || selected >= aliases.length) return "Invalid icon preset.";\n            runOnUiThread(() -> setAppIcon(selected));\n            return "Launcher icon preset changed. Launcher refresh may take a moment.";\n        }\n        @JavascriptInterface public String createPinnedShortcut(String dataUrl, String label) {\n            if (android.os.Build.VERSION.SDK_INT < 26) return "Custom icon shortcuts require Android 8.0 or newer.";\n            try {\n                int comma = dataUrl.indexOf(",");\n                if (comma < 0 || !dataUrl.startsWith("data:image/")) return "Invalid image data.";\n                byte[] bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);\n                Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);\n                if (bitmap == null) return "Image could not be decoded.";\n                Bitmap scaled = Bitmap.createScaledBitmap(bitmap, 512, 512, true);\n                Intent launch = new Intent(MainActivity.this, MainActivity.class);\n                launch.setAction(Intent.ACTION_VIEW);\n                ShortcutInfo shortcut = new ShortcutInfo.Builder(MainActivity.this, "maxtroit-custom-icon")\n                    .setShortLabel(label == null || label.trim().isEmpty() ? "MAXTROIT Admin" : label.trim().substring(0, Math.min(24, label.trim().length())))\n                    .setIcon(Icon.createWithBitmap(scaled)).setIntent(launch).build();\n                ShortcutManager manager = getSystemService(ShortcutManager.class);\n                if (manager == null || !manager.isRequestPinShortcutSupported()) return "Launcher does not support pinned shortcuts.";\n                runOnUiThread(() -> manager.requestPinShortcut(shortcut, null));\n                return "Home-screen shortcut request sent. Confirm the launcher prompt.";\n            } catch (Exception e) { return "Could not create shortcut: " + e.getMessage(); }\n        }\n    }\n\n    private void showIconPicker() {
        String[] choices = {"Classic MAXTROIT", "Vice City", "Neon"};
        new AlertDialog.Builder(this).setTitle("Choose App Icon")
            .setItems(choices, (dialog, which) -> setAppIcon(which)).setNegativeButton("Cancel", null).show();
    }

    private void setAppIcon(int selected) {
        PackageManager pm = getPackageManager();
        for (int i = 0; i < aliases.length; i++) {
            pm.setComponentEnabledSetting(new ComponentName(this, getPackageName() + aliases[i]),
                i == selected ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED : PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP);
        }
        Toast.makeText(this, "Icon updated. Launcher may take a moment to refresh.", Toast.LENGTH_LONG).show();
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && filePathCallback != null) {
            Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }
    @Override protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }
    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (filePathCallback != null) filePathCallback.onReceiveValue(null);
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}