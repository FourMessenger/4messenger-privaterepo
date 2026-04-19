package com.messenger4.android.services

import android.app.Service
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.provider.MediaStore
import android.util.Log
import androidx.core.content.FileProvider
import com.messenger4.android.models.FileTransfer
import com.messenger4.android.utils.NotificationUtil
import com.google.gson.Gson
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.concurrent.TimeUnit
import java.util.Collections

class FileUploadService : Service() {

    private val gson = Gson()
    private val okHttpClient = OkHttpClient.Builder()
        .callTimeout(10, TimeUnit.MINUTES)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val activeUploads = Collections.synchronizedMap(mutableMapOf<String, FileTransfer>())

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
                val fileSize = getFileSize(fileUri)
                val file = getFileFromUri(fileUri)
                
                if (file == null) {
                    Log.e("FileUploadService", "Failed to get file from URI")
                    NotificationUtil.showNotification(
                        this,
                        "Upload Failed",
                        "Could not access file"
                    )
                    return@Thread
                }
                
                val fileTransfer = FileTransfer(
                    id = fileName,
                    fileName = fileName,
                    url = serverUrl,
                    size = fileSize,
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

                // Create multipart request
                val requestBody = MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart(
                        "file",
                        fileName,
                        file.asRequestBody("application/octet-stream".toMediaType())
                    )
                    .addFormDataPart("fileName", fileName)
                    .addFormDataPart("fileSize", fileSize.toString())
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
                        "Failed to upload $fileName: ${response.code}"
                    )
                }

                response.close()
                activeUploads.remove(fileName)

            } catch (e: Exception) {
                Log.e("FileUploadService", "Error during upload", e)
                NotificationUtil.showNotification(
                    this,
                    "Upload Error",
                    "Error: ${e.message}"
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

    private fun getFileFromUri(uri: Uri): File? {
        return when {
            uri.scheme == "file" -> {
                File(uri.path ?: "")
            }
            uri.scheme == "content" -> {
                try {
                    // Create a temporary file
                    val fileName = getFileName(uri)
                    val tempFile = File(cacheDir, fileName)
                    
                    contentResolver.openInputStream(uri)?.use { inputStream ->
                        FileOutputStream(tempFile).use { outputStream ->
                            inputStream.copyTo(outputStream)
                        }
                    }
                    tempFile
                } catch (e: Exception) {
                    Log.e("FileUploadService", "Error copying content URI to file", e)
                    null
                }
            }
            else -> null
        }
    }

    private fun getRealPath(uri: Uri): String {
        val cursor = contentResolver.query(uri, null, null, null, null) ?: return ""
        try {
            if (!cursor.moveToFirst()) {
                return ""
            }
            val pathColumnIndex = cursor.getColumnIndex(MediaStore.MediaColumns.DATA)
            return if (pathColumnIndex < 0) "" else cursor.getString(pathColumnIndex)
        } finally {
            cursor.close()
        }
    }

    private fun getFileName(uri: Uri): String {
        return when {
            uri.scheme == "file" -> File(uri.path ?: "").name
            uri.scheme == "content" -> {
                val cursor = contentResolver.query(uri, null, null, null, null)
                cursor?.use {
                    it.moveToFirst()
                    val nameColumnIndex = it.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                    if (nameColumnIndex < 0) "Unknown" else it.getString(nameColumnIndex)
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
                    val sizeColumnIndex = it.getColumnIndex(MediaStore.MediaColumns.SIZE)
                    if (sizeColumnIndex < 0) 0L else it.getLong(sizeColumnIndex)
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
