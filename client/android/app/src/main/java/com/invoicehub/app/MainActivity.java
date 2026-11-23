package com.invoicehub.app;

import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Hardware acceleration for ultra-smooth UI rendering
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        // Prevent full-screen bleed into status bar & navigation bar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            getWindow().setStatusBarColor(Color.parseColor("#0F172A"));
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            WindowInsetsControllerCompat controller =
                new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
            controller.setAppearanceLightStatusBars(false); // clear white text/icons on dark navy bar
        }

        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            contentView.setFitsSystemWindows(true);
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, insets) -> {
                Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
                return insets;
            });
        }

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setFitsSystemWindows(true);
            WebSettings settings = webView.getSettings();
            // Enable storage & caching for instant loading
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // Responsive scaling
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);
            settings.setTextZoom(100);

            // Register native PDF download & share bridge
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void downloadPdf(String fileName, String base64Data) {
                    runOnUiThread(() -> saveAndOpenPdf(fileName, base64Data));
                }

                @JavascriptInterface
                public void sharePdfViaWhatsApp(String fileName, String base64Data, String recipientPhone, String messageText) {
                    runOnUiThread(() -> sharePdfToWhatsAppNative(fileName, base64Data, recipientPhone, messageText));
                }
            }, "AndroidDownloader");
        }
    }

    private void sharePdfToWhatsAppNative(String fileName, String base64Data, String recipientPhone, String messageText) {
        try {
            byte[] pdfBytes = Base64.decode(base64Data, Base64.DEFAULT);

            // Write PDF to app downloads cache
            File appDownloadsDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (appDownloadsDir != null && !appDownloadsDir.exists()) {
                appDownloadsDir.mkdirs();
            }
            File cacheFile = new File(appDownloadsDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(cacheFile)) {
                fos.write(pdfBytes);
            }

            Uri fileUri = FileProvider.getUriForFile(
                this,
                getPackageName() + ".fileprovider",
                cacheFile
            );

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("application/pdf");
            shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
            if (messageText != null && !messageText.trim().isEmpty()) {
                shareIntent.putExtra(Intent.EXTRA_TEXT, messageText);
            }
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            // Clean recipient phone if provided
            String cleanPhone = recipientPhone != null ? recipientPhone.replaceAll("[^0-9]", "") : "";
            if (cleanPhone.length() == 10) {
                cleanPhone = "91" + cleanPhone;
            }

            // Detect installed WhatsApp package
            PackageManager pm = getPackageManager();
            boolean hasStandardWhatsApp = false;
            boolean hasBusinessWhatsApp = false;
            try {
                pm.getPackageInfo("com.whatsapp", PackageManager.GET_ACTIVITIES);
                hasStandardWhatsApp = true;
            } catch (PackageManager.NameNotFoundException ignored) {}

            try {
                pm.getPackageInfo("com.whatsapp.w4b", PackageManager.GET_ACTIVITIES);
                hasBusinessWhatsApp = true;
            } catch (PackageManager.NameNotFoundException ignored) {}

            String targetPackage = hasStandardWhatsApp ? "com.whatsapp" : (hasBusinessWhatsApp ? "com.whatsapp.w4b" : null);

            if (targetPackage != null) {
                shareIntent.setPackage(targetPackage);
                if (!cleanPhone.isEmpty()) {
                    shareIntent.putExtra("jid", cleanPhone + "@s.whatsapp.net");
                }
                try {
                    startActivity(shareIntent);
                    return;
                } catch (Exception launchErr) {
                    shareIntent.setPackage(null);
                }
            }

            // Fallback: chooser
            Intent chooser = Intent.createChooser(shareIntent, "Share Invoice PDF via WhatsApp");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(chooser);

        } catch (Exception e) {
            Toast.makeText(this, "Failed to share PDF: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            e.printStackTrace();
        }
    }

    private void saveAndOpenPdf(String fileName, String base64Data) {
        try {
            byte[] pdfBytes = Base64.decode(base64Data, Base64.DEFAULT);

            // 1. Save to public Downloads directory (Android 10+ scoped storage)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                    Uri contentUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (contentUri != null) {
                        try (OutputStream out = getContentResolver().openOutputStream(contentUri)) {
                            if (out != null) {
                                out.write(pdfBytes);
                            }
                        }
                    }
                } catch (Exception me) {
                    me.printStackTrace();
                }
            }

            // 2. Also save to app external files for instant FileProvider viewing
            File appDownloadsDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (appDownloadsDir != null && !appDownloadsDir.exists()) {
                appDownloadsDir.mkdirs();
            }
            File cacheFile = new File(appDownloadsDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(cacheFile)) {
                fos.write(pdfBytes);
            }

            Uri viewUri = FileProvider.getUriForFile(
                this,
                getPackageName() + ".fileprovider",
                cacheFile
            );

            Toast.makeText(this, "Invoice PDF saved to Downloads: " + fileName, Toast.LENGTH_LONG).show();

            // 3. Open directly with system PDF viewer
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(viewUri, "application/pdf");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chooser = Intent.createChooser(intent, "Open Invoice PDF");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(chooser);

        } catch (Exception e) {
            Toast.makeText(this, "Failed to download PDF: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            e.printStackTrace();
        }
    }
}
