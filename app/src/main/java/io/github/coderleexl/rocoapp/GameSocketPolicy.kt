package io.github.coderleexl.rocoapp

import java.net.InetAddress

/** Official bootstrap and numeric zone hosts only. All upstream connections use443. */
object GameSocketPolicy {
    val hosts = listOf("dir.17roco.qq.com", "stat.17roco.qq.com")
    // Bound the exact-match table required by unmodified Ruffle; never resolve
    // or connect these entries until Flash actually chooses an endpoint.
    const val MAX_ZONE = 65535
    private val zonePattern = Regex("zone([1-9][0-9]{0,4})\\.17roco\\.qq\\.com")
    fun zoneId(host: String): Int? = zonePattern.matchEntire(host)?.groupValues?.get(1)
        ?.toIntOrNull()?.takeIf { it in 1..MAX_ZONE }
    fun allowsHost(host: String): Boolean = host in hosts || zoneId(host) != null
    // Preserve dir0/stat1. Numeric zoneN is endpointN+1.
    fun endpointId(host: String): Int = hosts.indexOf(host).takeIf { it >= 0 }
        ?: (zoneId(host)?.plus(1) ?: throw IllegalArgumentException("Unknown endpoint"))
    fun endpointName(host: String): String = when {
        host == hosts[0] -> "dir"
        host == hosts[1] -> "stat"
        zoneId(host) != null -> "zone"
        else -> throw IllegalArgumentException("Unknown endpoint")
    }
    fun allowsOrigin(origin: String) = origin in setOf("https://17roco.qq.com", "https://web2.17roco.qq.com")
    fun target(path: String, token: String): String? {
        val prefix = "/$token/"
        if (!path.startsWith(prefix)) return null
        return path.removePrefix(prefix).takeIf(::allowsHost)
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
