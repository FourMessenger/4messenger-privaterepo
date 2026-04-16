package com.messenger4.android.utils

import android.content.Context
import android.os.Environment
import java.io.File

object StorageUtil {

    fun init(context: Context) {
        // Create app directories
        getAppDownloadDir().mkdirs()
        getAppUploadDir().mkdirs()
        getAppCacheDir().mkdirs()
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
        return File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_CACHE),
            "4Messenger"
        )
    }
}
