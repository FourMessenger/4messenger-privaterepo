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
    }

    private fun requestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.SCHEDULE_EXACT_ALARM)
        }

        val deniedPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (deniedPermissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                deniedPermissions.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    private fun initializeWebView() {
        webView.apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = true
                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALLOW_ALL
            }

            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()

            // Add JavaScript interface for app communication
            addJavascriptInterface(WebAppInterface(this@MainActivity), "AndroidApp")

            // Load localhost
            loadUrl("http://localhost:8080")
        }
    }

    private fun startBackgroundServices() {
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
    }

    private fun checkForUpdates() {
        val intent = Intent(this, com.messenger4.android.services.UpdateCheckService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
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
