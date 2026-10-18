package io.github.coderleexl.rocoapp

import java.net.InetAddress

/** Fixed public Global.xml endpoints. No user supplied host, IP, URL or port. */
object GameSocketPolicy {
    val hosts = listOf("dir.17roco.qq.com", "stat.17roco.qq.com")
    fun allowsOrigin(origin: String) = origin in setOf("https://17roco.qq.com", "https://web2.17roco.qq.com")
    fun target(path: String, token: String): String? {
        val prefix = "/$token/"
        if (!path.startsWith(prefix)) return null
        return path.removePrefix(prefix).takeIf { it in hosts }
    }
    fun isPublic(address: InetAddress): Boolean {
        if (address.isAnyLocalAddress || address.isLoopbackAddress || address.isLinkLocalAddress ||
            address.isSiteLocalAddress || address.isMulticastAddress) return false
        val b = address.address
        if (b.size == 4) {
            val first = b[0].toInt() and 255
            val second = b[1].toInt() and 255
            if (first == 0 || first >= 224 || first == 100 && second in 64..127 ||
                first == 198 && second in 18..19 || first == 192 && second == 0 ||
                first == 198 && second == 51 || first == 203 && second == 0) return false
        } else if (b.size == 16) {
            // Global unicast only; exclude documentation, ULA and mapped local addresses.
            if ((b[0].toInt() and 224) != 32) return false
            if ((b[0].toInt() and 255) == 32 && (b[1].toInt() and 255) == 1 &&
                (b[2].toInt() and 255) == 13 && (b[3].toInt() and 255) == 184) return false
        } else return false
        return true
    }
}
