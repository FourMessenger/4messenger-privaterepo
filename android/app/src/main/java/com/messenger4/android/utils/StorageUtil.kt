package com.messenger4.android.utils

import android.content.Context
import android.os.Build
import android.os.Environment
import java.io.File

object StorageUtil {

    fun init(context: Context) {
        try {
            // Check if external storage is available
            if (!isExternalStorageAvailable()) {
                android.util.Log.w("StorageUtil", "External storage not available")
                return
            }

            // Create app directories
            getAppDownloadDir().mkdirs()
            getAppUploadDir().mkdirs()
            getAppCacheDir().mkdirs()
        } catch (e: Exception) {
            android.util.Log.e("StorageUtil", "Error initializing storage", e)
        }
    }

    private fun isExternalStorageAvailable(): Boolean {
        return try {
            val state = Environment.getExternalStorageState()
            state == Environment.MEDIA_MOUNTED
        } catch (e: Exception) {
            false
        }
    }

    fun getAppDownloadDir(): File {
        return File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            "4Messenger"
        )
    }

    fun getAppUploadDir(): File {
        return File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS),
            "4Messenger/uploads"
        )
    }

    fun getAppCacheDir(): File {
        // Используем DIRECTORY_DOWNLOADS вместо DIRECTORY_CACHE (который не существует)
        return File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            "4Messenger/cache"
        )
    }
}
