package com.invoicehub.app;

import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Hardware acceleration for ultra-smooth 60-120fps UI rendering
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            // Enable storage & caching for instant loading
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // Responsive scaling
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);
            settings.setTextZoom(105); // optimized mobile font scaling

            // Register native PDF download bridge
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void downloadPdf(String fileName, String base64Data) {
                    runOnUiThread(() -> saveAndOpenPdf(fileName, base64Data));
                }
            }, "AndroidDownloader");
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
