package com.messenger4.android.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.messenger4.android.models.VersionInfo
import com.messenger4.android.utils.NotificationUtil
import com.messenger4.android.utils.UpdateUtil
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

class UpdateCheckService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }
}

class UpdateCheckWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val gson = Gson()
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        return@withContext try {
            // Fetch version info from server
            val versionInfo = fetchVersionInfo()
            if (versionInfo != null) {
                handleVersionUpdate(versionInfo)
            }
            Result.success()
        } catch (e: Exception) {
            Log.e("UpdateCheckWorker", "Error checking for updates", e)
            Result.retry()
        }
    }

    private suspend fun fetchVersionInfo(): VersionInfo? = withContext(Dispatchers.IO) {
        return@withContext try {
            val request = Request.Builder()
                .url("http://localhost:8080/ver.json")
                .build()

            val response = okHttpClient.newCall(request).execute()
            val body = response.body?.string()
            response.close()

            if (body != null) {
                gson.fromJson(body, VersionInfo::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e("UpdateCheckWorker", "Error fetching version info", e)
            null
        }
    }

    private suspend fun handleVersionUpdate(versionInfo: VersionInfo) {
        return withContext(Dispatchers.Main) {
            val currentVersion = BuildConfig.VERSION_NAME
            val latestVersion = versionInfo.version

            if (isNewVersionAvailable(currentVersion, latestVersion)) {
                if (versionInfo.required) {
                    // Required update
                    showRequiredUpdateNotification(versionInfo)
                } else {
                    // Optional update
                    showOptionalUpdateNotification(versionInfo)
                }

                // Save update info
                UpdateUtil.saveUpdateInfo(applicationContext, versionInfo)
            }
        }
    }

    private fun isNewVersionAvailable(currentVersion: String, latestVersion: String): Boolean {
        val current = currentVersion.split(".").map { it.toIntOrNull() ?: 0 }
        val latest = latestVersion.split(".").map { it.toIntOrNull() ?: 0 }

        for (i in 0 until maxOf(current.size, latest.size)) {
            val curr = current.getOrNull(i) ?: 0
            val lat = latest.getOrNull(i) ?: 0
            if (lat > curr) return true
            if (lat < curr) return false
        }
        return false
    }

    private fun showRequiredUpdateNotification(versionInfo: VersionInfo) {
        NotificationUtil.showRequiredUpdateNotification(
            applicationContext,
            versionInfo
        )
    }

    private fun showOptionalUpdateNotification(versionInfo: VersionInfo) {
        NotificationUtil.showOptionalUpdateNotification(
            applicationContext,
            versionInfo
        )
    }
}
