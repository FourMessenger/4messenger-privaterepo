package com.messenger4.android.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.provider.MediaStore
import android.util.Log
import com.messenger4.android.models.FileTransfer
import com.messenger4.android.utils.NotificationUtil
import com.google.gson.Gson
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileInputStream
import java.util.concurrent.TimeUnit

class FileUploadService : Service() {

    private val gson = Gson()
    private val okHttpClient = OkHttpClient.Builder()
        .callTimeout(10, TimeUnit.MINUTES)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val activeUploads = mutableMapOf<String, FileTransfer>()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: return START_STICKY

        when (action) {
            "START_UPLOAD" -> {
                val fileUriString = intent.getStringExtra("file_uri") ?: return START_STICKY
                val serverUrl = intent.getStringExtra("server_url") ?: return START_STICKY
                val fileUri = Uri.parse(fileUriString)
                startUpload(fileUri, serverUrl, startId)
            }
            "PAUSE_UPLOAD" -> {
                val fileId = intent.getStringExtra("file_id") ?: return START_STICKY
                pauseUpload(fileId)
            }
            "RESUME_UPLOAD" -> {
                val fileTransferJson = intent.getStringExtra("file_transfer") ?: return START_STICKY
                val fileTransfer = gson.fromJson(fileTransferJson, FileTransfer::class.java)
                resumeUpload(fileTransfer)
            }
            "CANCEL_UPLOAD" -> {
                val fileId = intent.getStringExtra("file_id") ?: return START_STICKY
                cancelUpload(fileId)
            }
        }

        return START_STICKY
    }

    private fun startUpload(fileUri: Uri, serverUrl: String, startId: Int) {
        Thread {
            try {
                val fileName = getFileName(fileUri)
                val fileTransfer = FileTransfer(
                    id = fileName,
                    fileName = fileName,
                    url = serverUrl,
                    size = getFileSize(fileUri),
                    progress = 0,
                    status = "uploading",
                    timestamp = System.currentTimeMillis()
                )

                activeUploads[fileName] = fileTransfer
                saveUploadState(fileTransfer)

                NotificationUtil.showNotification(
                    this,
                    "Upload Started",
                    "Starting upload of $fileName"
                )

                // Get file content
                val inputStream = FileInputStream(getRealPath(fileUri))
                val fileBytes = inputStream.readBytes()
                inputStream.close()

                // Create multipart request
                val requestBody = MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart(
                        "file",
                        fileName,
                        fileBytes.asRequestBody("*/*".toMediaType())
                    )
                    .addFormDataPart("fileName", fileName)
                    .addFormDataPart("fileSize", fileTransfer.size.toString())
                    .build()

                val request = Request.Builder()
                    .url("$serverUrl/upload")
                    .post(requestBody)
                    .build()

                val response = okHttpClient.newCall(request).execute()

                if (response.isSuccessful) {
                    fileTransfer.status = "completed"
                    fileTransfer.progress = 100
                    saveUploadState(fileTransfer)

                    NotificationUtil.showNotification(
                        this,
                        "Upload Complete",
                        "$fileName uploaded successfully"
                    )
                } else {
                    fileTransfer.status = "failed"
                    saveUploadState(fileTransfer)

                    NotificationUtil.showNotification(
                        this,
                        "Upload Failed",
                        "Failed to upload $fileName"
                    )
                }

                response.close()
                activeUploads.remove(fileName)

            } catch (e: Exception) {
                Log.e("FileUploadService", "Error during upload", e)
                NotificationUtil.showNotification(
                    this,
                    "Upload Error",
                    "An error occurred during upload"
                )
            }
        }.start()
    }

    private fun pauseUpload(fileId: String) {
        activeUploads.remove(fileId)?.let {
            it.status = "paused"
            saveUploadState(it)
            NotificationUtil.showNotification(
                this,
                "Upload Paused",
                "Upload has been paused"
            )
        }
    }

    private fun resumeUpload(fileTransfer: FileTransfer) {
        // For simplicity, restart the upload
        // In production, implement resumable uploads using Range headers
        try {
            val fileUri = Uri.parse(fileTransfer.url)
            startUpload(fileUri, fileTransfer.url, 0)
        } catch (e: Exception) {
            Log.e("FileUploadService", "Error resuming upload", e)
        }
    }

    private fun cancelUpload(fileId: String) {
        activeUploads.remove(fileId)?.let {
            removeUploadState(it.id)
            NotificationUtil.showNotification(
                this,
                "Upload Cancelled",
                "Upload has been cancelled"
            )
        }
    }

    private fun getRealPath(uri: Uri): String {
        val cursor = contentResolver.query(uri, null, null, null, null)!!
        cursor.moveToFirst()
        val path = cursor.getString(cursor.getColumnIndex(MediaStore.MediaColumns.DATA))
        cursor.close()
        return path
    }

    private fun getFileName(uri: Uri): String {
        return when {
            uri.scheme == "file" -> File(uri.path ?: "").name
            uri.scheme == "content" -> {
                val cursor = contentResolver.query(uri, null, null, null, null)
                cursor?.use {
                    it.moveToFirst()
                    it.getString(it.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME))
                } ?: "Unknown"
            }
            else -> "Unknown"
        }
    }

    private fun getFileSize(uri: Uri): Long {
        return when {
            uri.scheme == "file" -> File(uri.path ?: "").length()
            uri.scheme == "content" -> {
                val cursor = contentResolver.query(uri, null, null, null, null)
                cursor?.use {
                    it.moveToFirst()
                    it.getLong(it.getColumnIndex(MediaStore.MediaColumns.SIZE))
                } ?: 0L
            }
            else -> 0L
        }
    }

    private fun saveUploadState(fileTransfer: FileTransfer) {
        val sharedPref = getSharedPreferences("uploads", Context.MODE_PRIVATE)
        val json = gson.toJson(fileTransfer)
        sharedPref.edit().putString("upload_${fileTransfer.id}", json).apply()
    }

    private fun removeUploadState(fileId: String) {
        val sharedPref = getSharedPreferences("uploads", Context.MODE_PRIVATE)
        sharedPref.edit().remove("upload_$fileId").apply()
    }
}
