package com.messenger4.android.models

data class Message(
    val id: String,
    val senderId: String,
    val content: String,
    val timestamp: Long,
    val read: Boolean = false
)

data class FileTransfer(
    val id: String,
    val fileName: String,
    val url: String,
    val size: Long,
    val progress: Int = 0,
    val status: String = "pending", // pending, uploading, downloading, paused, completed, failed
    val timestamp: Long = System.currentTimeMillis(),
    val downloadId: Long = -1L
)

data class ServerInfo(
    val url: String,
    val userId: String,
    val authToken: String,
    val lastChecked: Long = System.currentTimeMillis()
)

data class VersionInfo(
    val version: String,
    val required: Boolean = false,
    val downloadUrl: String,
    val releaseNotes: String,
    val whatsNew: List<String> = emptyList(),
    val minimumSdkVersion: Int = 26,
    val releaseDate: String
)

data class UpdateInfo(
    val versionInfo: VersionInfo,
    val shownAt: Long = System.currentTimeMillis(),
    val dismissed: Boolean = false
)
