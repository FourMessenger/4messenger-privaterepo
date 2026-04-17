package com.messenger4.android.services

import android.app.Service
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.IBinder
import android.util.Log
import androidx.core.content.ContextCompat
import com.messenger4.android.utils.NotificationUtil
import com.messenger4.android.models.FileTransfer
import com.google.gson.Gson

class FileDownloadService : Service() {

    private lateinit var downloadManager: DownloadManager
    private val activeDownloads = mutableMapOf<Long, FileTransfer>()
    private val gson = Gson()

    override fun onCreate() {
        super.onCreate()
        downloadManager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

        // Register receiver for download completion
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.registerReceiver(
                this,
                downloadReceiver,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                ContextCompat.RECEIVER_EXPORTED
            )
        } else {
            registerReceiver(
                downloadReceiver,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
            )
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: return START_STICKY

        when (action) {
            "START_DOWNLOAD" -> {
                val fileTransferJson = intent.getStringExtra("file_transfer")
                val fileTransfer = gson.fromJson(fileTransferJson, FileTransfer::class.java)
                startDownload(fileTransfer)
            }
            "PAUSE_DOWNLOAD" -> {
                val downloadId = intent.getLongExtra("download_id", -1)
                if (downloadId != -1L) {
                    pauseDownload(downloadId)
                }
            }
            "RESUME_DOWNLOAD" -> {
                val fileTransferJson = intent.getStringExtra("file_transfer")
                val fileTransfer = gson.fromJson(fileTransferJson, FileTransfer::class.java)
                resumeDownload(fileTransfer)
            }
            "CANCEL_DOWNLOAD" -> {
                val downloadId = intent.getLongExtra("download_id", -1)
                if (downloadId != -1L) {
                    cancelDownload(downloadId)
                }
            }
        }

        return START_STICKY
    }

    private fun startDownload(fileTransfer: FileTransfer) {
        try {
            val downloadDir = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOWNLOADS
            )

            val request = DownloadManager.Request(Uri.parse(fileTransfer.url))
                .setTitle(fileTransfer.fileName)
                .setDescription("Downloading ${fileTransfer.fileName}")
                .setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    fileTransfer.fileName
                )
                .setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                )
                .setAllowedNetworkTypes(
                    DownloadManager.Request.NETWORK_MOBILE or DownloadManager.Request.NETWORK_WIFI
                )

            val downloadId = downloadManager.enqueue(request)
            activeDownloads[downloadId] = fileTransfer.copy(downloadId = downloadId)

            // Save to SharedPreferences for persistence
            saveDownloadState(downloadId, fileTransfer)

            Log.d("FileDownloadService", "Download started: ${fileTransfer.fileName} (ID: $downloadId)")
        } catch (e: Exception) {
            Log.e("FileDownloadService", "Error starting download", e)
        }
    }

    private fun pauseDownload(downloadId: Long) {
        // Android DownloadManager doesn't support pause directly.
        // Save the download state and cancel it.
        try {
            downloadManager.remove(downloadId)
            activeDownloads.remove(downloadId)
            NotificationUtil.showNotification(
                this,
                "Download paused",
                "Download has been paused"
            )
        } catch (e: Exception) {
            Log.e("FileDownloadService", "Error pausing download", e)
        }
    }

    private fun resumeDownload(fileTransfer: FileTransfer) {
        startDownload(fileTransfer)
    }

    private fun cancelDownload(downloadId: Long) {
        try {
            downloadManager.remove(downloadId)
            activeDownloads.remove(downloadId)
            removeDownloadState(downloadId)
            NotificationUtil.showNotification(
                this,
                "Download cancelled",
                "Download has been cancelled"
            )
        } catch (e: Exception) {
            Log.e("FileDownloadService", "Error canceling download", e)
        }
    }

    private val downloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val downloadId = intent?.getLongExtra(
                DownloadManager.EXTRA_DOWNLOAD_ID,
                -1L
            ) ?: return

            val query = DownloadManager.Query().setFilterById(downloadId)
            val cursor = downloadManager.query(query)

            if (cursor.moveToFirst()) {
                val statusColumnIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                val titleColumnIndex = cursor.getColumnIndex(DownloadManager.COLUMN_TITLE)
                
                if (statusColumnIndex < 0 || titleColumnIndex < 0) {
                    cursor.close()
                    return
                }
                
                val status = cursor.getInt(statusColumnIndex)
                val fileName = cursor.getString(titleColumnIndex)

                when (status) {
                    DownloadManager.STATUS_SUCCESSFUL -> {
                        NotificationUtil.showNotification(
                            this@FileDownloadService,
                            "Download Complete",
                            "$fileName downloaded successfully"
                        )
                        removeDownloadState(downloadId)
                        activeDownloads.remove(downloadId)
                    }
                    DownloadManager.STATUS_FAILED -> {
                        NotificationUtil.showNotification(
                            this@FileDownloadService,
                            "Download Failed",
                            "Failed to download $fileName"
                        )
                    }
                }
            }
            cursor.close()
        }
    }

    private fun saveDownloadState(downloadId: Long, fileTransfer: FileTransfer) {
        val sharedPref = getSharedPreferences("downloads", Context.MODE_PRIVATE)
        val json = gson.toJson(fileTransfer)
        sharedPref.edit().putString("download_$downloadId", json).apply()
    }

    private fun removeDownloadState(downloadId: Long) {
        val sharedPref = getSharedPreferences("downloads", Context.MODE_PRIVATE)
        sharedPref.edit().remove("download_$downloadId").apply()
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(downloadReceiver)
    }
}
