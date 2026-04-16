package com.messenger4.android.utils

import android.content.Context
import com.google.gson.Gson
import com.messenger4.android.models.UpdateInfo
import com.messenger4.android.models.VersionInfo

object UpdateUtil {

    private val gson = Gson()

    fun saveUpdateInfo(context: Context, versionInfo: VersionInfo) {
        val sharedPref = context.getSharedPreferences("updates", Context.MODE_PRIVATE)
        val updateInfo = UpdateInfo(versionInfo = versionInfo)
        val json = gson.toJson(updateInfo)
        sharedPref.edit().putString("pending_update", json).apply()
    }

    fun getUpdateInfo(context: Context): UpdateInfo? {
        val sharedPref = context.getSharedPreferences("updates", Context.MODE_PRIVATE)
        val json = sharedPref.getString("pending_update", null) ?: return null
        return gson.fromJson(json, UpdateInfo::class.java)
    }

    fun clearUpdateInfo(context: Context) {
        val sharedPref = context.getSharedPreferences("updates", Context.MODE_PRIVATE)
        sharedPref.edit().remove("pending_update").apply()
    }

    fun dismissUpdate(context: Context, versionInfo: VersionInfo) {
        val sharedPref = context.getSharedPreferences("updates", Context.MODE_PRIVATE)
        val updateInfo = UpdateInfo(versionInfo = versionInfo, dismissed = true)
        val json = gson.toJson(updateInfo)
        sharedPref.edit().putString("pending_update", json).apply()
    }
}
