package com.messenger4.android.services

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import android.content.Context
import com.google.gson.Gson
import com.messenger4.android.models.Message
import com.messenger4.android.utils.NotificationUtil
import com.messenger4.android.utils.ServerUtil
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PushNotificationService : Service() {
    companion object {
        private const val FOREGROUND_NOTIFICATION_ID = 2
        private const val MESSAGE_CHANNEL_ID = "messages"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Create and start foreground notification for Android 8+
        val notification = createForegroundNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForeground(FOREGROUND_NOTIFICATION_ID, notification)
        }
        return START_STICKY
    }

    private fun createForegroundNotification(): Notification {
        return NotificationCompat.Builder(this, MESSAGE_CHANNEL_ID)
            .setContentTitle("4Messenger")
            .setContentText("Monitoring for messages...")
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }
}

class PushNotificationWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        return@withContext try {
            // Get list of servers where user has logged in
            val servers = ServerUtil.getSavedServers(applicationContext)

            servers.forEach { server ->
                try {
                    // Connect to server and check for messages
                    val messages = ServerUtil.checkForMessages(
                        applicationContext,
                        server.url,
                        server.userId
                    )

                    messages.forEach { message ->
                        // Show notification for new message
                        NotificationUtil.showMessageNotification(
                            applicationContext,
                            message.senderId,
                            message.content
                        )

                        // Save message to local storage
                        // This will be synced with the web app via SharedPreferences
                        saveMessageLocally(message)
                    }
                } catch (e: Exception) {
                    Log.e("PushNotificationWorker", "Error checking messages from $server", e)
                }
            }

            Result.success()
        } catch (e: Exception) {
            Log.e("PushNotificationWorker", "Error in push notification worker", e)
            Result.retry()
        }
    }

    private fun saveMessageLocally(message: Message) {
        try {
            val sharedPref = applicationContext.getSharedPreferences(
                "notifications",
                Context.MODE_PRIVATE
            )
            val json = Gson().toJson(message)
            val key = "message_${message.id}"
            sharedPref.edit().putString(key, json).apply()
        } catch (e: Exception) {
            Log.e("PushNotificationWorker", "Error saving message locally", e)
        }
    }
}
