package com.messenger4.android

import android.app.Activity
import android.widget.Toast

class WebAppInterface(private val activity: Activity) {

    @android.webkit.JavascriptInterface
    fun showToast(message: String) {
        try {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            android.util.Log.e("WebAppInterface", "Error showing toast", e)
        }
    }

    @android.webkit.JavascriptInterface
    fun getAppVersion(): String {
        return try {
            BuildConfig.VERSION_NAME
        } catch (e: Exception) {
            android.util.Log.e("WebAppInterface", "Error getting app version", e)
            "unknown"
        }
    }

    @android.webkit.JavascriptInterface
    fun getDeviceInfo(): String {
        return try {
            """
            {
                "platform": "android",
                "version": "${android.os.Build.VERSION.RELEASE}",
                "deviceModel": "${android.os.Build.MODEL}",
                "manufacturer": "${android.os.Build.MANUFACTURER}"
            }
        """.trimIndent()
        } catch (e: Exception) {
            android.util.Log.e("WebAppInterface", "Error getting device info", e)
            "{}"
        }
    }

    @android.webkit.JavascriptInterface
    fun logMessage(message: String) {
        try {
            android.util.Log.d("WebApp", message)
        } catch (e: Exception) {
            android.util.Log.e("WebAppInterface", "Error logging message", e)
        }
    }
}
