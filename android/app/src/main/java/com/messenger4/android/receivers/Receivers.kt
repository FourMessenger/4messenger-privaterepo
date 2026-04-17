package com.messenger4.android.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.messenger4.android.services.PushNotificationWorker
import com.messenger4.android.services.UpdateCheckWorker
import java.util.concurrent.TimeUnit

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Device boot completed, restarting background services")

            context?.let {
                // Restart push notification service
                val pushNotificationRequest = PeriodicWorkRequestBuilder<PushNotificationWorker>(
                    15, TimeUnit.MINUTES  // WorkManager minimum interval
                ).build()

                WorkManager.getInstance(it).enqueueUniquePeriodicWork(
                    "push_notifications",
                    ExistingPeriodicWorkPolicy.KEEP,
                    pushNotificationRequest
                )

                // Restart update check service
                val updateCheckRequest = PeriodicWorkRequestBuilder<UpdateCheckWorker>(
                    6, TimeUnit.HOURS
                ).build()

                WorkManager.getInstance(it).enqueueUniquePeriodicWork(
                    "update_check",
                    ExistingPeriodicWorkPolicy.KEEP,
                    updateCheckRequest
                )
            }
        }
    }
}

class UpdateNotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        // Handle update notification actions
        val action = intent?.action
        when (action) {
            "UPDATE_NOW" -> {
                Log.d("UpdateNotificationReceiver", "User clicked Update Now")
                // Implement update logic
            }
            "UPDATE_LATER" -> {
                Log.d("UpdateNotificationReceiver", "User clicked Update Later")
                // Implement snooze logic
            }
        }
    }
}
