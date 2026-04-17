package com.messenger4.android

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebViewClient
import android.widget.Toast
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.messenger4.android.services.PushNotificationWorker
import com.messenger4.android.services.UpdateCheckWorker
import com.messenger4.android.utils.StorageUtil
import com.messenger4.android.utils.NotificationUtil
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val PERMISSION_REQUEST_CODE = 100

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            setContentView(R.layout.activity_main)
            webView = findViewById(R.id.webView)

            // Initialize notification channels
            NotificationUtil.init(this)

            // Request necessary permissions
            requestPermissions()

            // Initialize WebView
            initializeWebView()

            // Start background services
            startBackgroundServices()

            // Check for updates on app start
            checkForUpdates()

            // Initialize storage
            StorageUtil.init(this)
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Error in onCreate", e)
            Toast.makeText(this, "Error initializing app: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun requestPermissions() {
        // Runtime permissions only - install-time permissions are handled by AndroidManifest.xml
        val runtimePermissions = mutableListOf(
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            runtimePermissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            runtimePermissions.add(Manifest.permission.SCHEDULE_EXACT_ALARM)
        }

        val deniedPermissions = runtimePermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (deniedPermissions.isNotEmpty()) {
            try {
                ActivityCompat.requestPermissions(
                    this,
                    deniedPermissions.toTypedArray(),
                    PERMISSION_REQUEST_CODE
                )
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Error requesting permissions", e)
            }
        }
    }

    private fun initializeWebView() {
        try {
            webView.apply {
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    mediaPlaybackRequiresUserGesture = false
                    allowFileAccess = true
                    mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALLOW_ALL
                }

                webViewClient = object : WebViewClient() {
                    override fun onReceivedError(
                        view: WebView?,
                        request: android.webkit.WebResourceRequest?,
                        error: android.webkit.WebResourceError?
                    ) {
                        super.onReceivedError(view, request, error)
                        if (request?.url.toString().contains("localhost")) {
                            showErrorPage("Cannot connect to server", 
                                "Make sure the server is running on http://localhost:8080")
                        }
                    }
                }
                webChromeClient = WebChromeClient()

                // Add JavaScript interface for app communication
                addJavascriptInterface(WebAppInterface(this@MainActivity), "AndroidApp")

                // Load localhost
                loadUrl("http://localhost:8080")
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Error initializing WebView: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun showErrorPage(title: String, message: String) {
        val html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; text-align: center; background: #f5f5f5; }
                    .error-container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    h1 { color: #d32f2f; font-size: 24px; margin-bottom: 10px; }
                    p { color: #666; font-size: 16px; line-height: 1.5; }
                    .hint { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; text-align: left; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>$title</h1>
                    <p>$message</p>
                    <div class="hint">
                        <strong>Tip:</strong> Start your development server with:<br/>
                        <code>cd /path/to/frontend && npm start</code>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
        webView.loadData(html, "text/html", "utf-8")
    }

    private fun startBackgroundServices() {
        try {
            // Start periodic push notification check
            val pushNotificationRequest = PeriodicWorkRequestBuilder<PushNotificationWorker>(
                30, TimeUnit.SECONDS  // Check every 30 seconds
            ).build()

            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "push_notifications",
                ExistingPeriodicWorkPolicy.KEEP,
                pushNotificationRequest
            )

            // Start periodic update check
            val updateCheckRequest = PeriodicWorkRequestBuilder<UpdateCheckWorker>(
                6, TimeUnit.HOURS  // Check every 6 hours
            ).build()

            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "update_check",
                ExistingPeriodicWorkPolicy.KEEP,
                updateCheckRequest
            )
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Error starting background services", e)
        }
    }

    private fun checkForUpdates() {
        try {
            val intent = Intent(this, com.messenger4.android.services.UpdateCheckService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Error checking for updates", e)
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val deniedPermissions = permissions.filterIndexed { index, _ ->
                grantResults[index] == PackageManager.PERMISSION_DENIED
            }
            if (deniedPermissions.isNotEmpty()) {
                Toast.makeText(
                    this,
                    "Some permissions were denied. App may not work properly.",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
}
