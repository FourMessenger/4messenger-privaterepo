package com.messenger4.android.utils

import android.content.Context
import com.google.gson.Gson
import com.messenger4.android.models.ServerInfo
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

object ServerUtil {

    private val gson = Gson()
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    fun getSavedServers(context: Context): List<ServerInfo> {
        val sharedPref = context.getSharedPreferences("servers", Context.MODE_PRIVATE)
        val serverKeys = sharedPref.all.keys.filter { it.startsWith("server_") }
        
        return serverKeys.mapNotNull { key ->
            sharedPref.getString(key, null)?.let {
                gson.fromJson(it, ServerInfo::class.java)
            }
        }
    }

    fun saveServer(context: Context, server: ServerInfo) {
        val sharedPref = context.getSharedPreferences("servers", Context.MODE_PRIVATE)
        val json = gson.toJson(server)
        sharedPref.edit().putString("server_${server.userId}", json).apply()
    }

    fun removeServer(context: Context, userId: String) {
        val sharedPref = context.getSharedPreferences("servers", Context.MODE_PRIVATE)
        sharedPref.edit().remove("server_$userId").apply()
    }

    fun checkForMessages(
        context: Context,
        serverUrl: String,
        userId: String
    ): List<com.messenger4.android.models.Message> {
        return try {
            val sharedPref = context.getSharedPreferences("servers", Context.MODE_PRIVATE)
            val serverJson = sharedPref.getString("server_$userId", null) ?: return emptyList()
            val server = gson.fromJson(serverJson, ServerInfo::class.java)

            val request = Request.Builder()
                .url("$serverUrl/api/messages?userId=$userId")
                .addHeader("Authorization", "Bearer ${server.authToken}")
                .build()

            val response = okHttpClient.newCall(request).execute()
            val body = response.body?.string()
            response.close()

            if (body != null && response.isSuccessful) {
                gson.fromJson(
                    body,
                    Array<com.messenger4.android.models.Message>::class.java
                ).toList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
}
