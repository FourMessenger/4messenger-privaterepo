package com.messenger4.android

import android.app.Activity
import android.widget.Toast

class WebAppInterface(private val activity: Activity) {

    @android.webkit.JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
    }

    @android.webkit.JavascriptInterface
    fun getAppVersion(): String {
        return BuildConfig.VERSION_NAME
    }

    @android.webkit.JavascriptInterface
    fun getDeviceInfo(): String {
        return """
            {
                "platform": "android",
                "version": "${android.os.Build.VERSION.RELEASE}",
                "deviceModel": "${android.os.Build.MODEL}",
                "manufacturer": "${android.os.Build.MANUFACTURER}"
            }
        """.trimIndent()
    }

    @android.webkit.JavascriptInterface
    fun logMessage(message: String) {
        android.util.Log.d("WebApp", message)
    }
}
