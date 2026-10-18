package io.github.coderleexl.rocoapp

import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.URI
import java.nio.ByteBuffer
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import org.java_websocket.client.WebSocketClient
import org.java_websocket.handshake.ServerHandshake
import org.junit.Assert.*
import org.junit.Test

class GameSocketBridgeTest {
    @Test fun policyRejectsUnverifiedDestinationsAndNonPublicAddresses() {
        val token = "a".repeat(48)
        assertEquals("dir.17roco.qq.com", GameSocketPolicy.target("/$token/dir.17roco.qq.com", token))
        for (path in listOf("/wrong/dir.17roco.qq.com", "/$token/127.0.0.1", "/$token/zone1.17roco.qq.com", "/$token/dir.17roco.qq.com:80", "/$token/dir.17roco.qq.com?x=1")) {
            assertNull(path, GameSocketPolicy.target(path, token))
        }
        assertFalse(GameSocketPolicy.allowsOrigin("https://web2.17roco.qq.com.evil.example"))
        for (ip in listOf("127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.0.1", "169.254.1.1", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "fc00::1", "fe80::1", "2001:db8::1")) {
            assertFalse(ip, GameSocketPolicy.isPublic(InetAddress.getByName(ip)))
        }
        assertTrue(GameSocketPolicy.isPublic(InetAddress.getByName("1.1.1.1")))
    }

    @Test fun binaryStreamReachesUpstreamAndDeniedHandshakesNeverConnect() {
        val echo = ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"))
        val accepted = CountDownLatch(1)
        val echoThread = Thread {
            echo.accept().use { socket ->
                accepted.countDown()
                val buffer = ByteArray(8192)
                val input = socket.getInputStream()
                val output = socket.getOutputStream()
                while (true) { val n = input.read(buffer); if (n < 0) break; output.write(buffer, 0, n); output.flush() }
            }
        }.apply { isDaemon = true; start() }
        val connects = AtomicInteger()
        GameSocketBridge(connect = { host ->
            assertEquals("dir.17roco.qq.com", host)
            connects.incrementAndGet()
            Socket("127.0.0.1", echo.localPort)
        }).use { bridge ->
            assertTrue(bridge.awaitReady())
            val address = bridge.proxyUrl("dir.17roco.qq.com")
            fun client(url: String, origin: String, received: CountDownLatch, payload: ByteArray? = null) = object : WebSocketClient(URI(url), mapOf("Origin" to origin)) {
                val collected = java.io.ByteArrayOutputStream()
                override fun onOpen(handshake: ServerHandshake) { if (payload != null) send(payload) }
                override fun onMessage(message: String) { fail("No text expected") }
                override fun onMessage(bytes: ByteBuffer) {
                    val data = ByteArray(bytes.remaining()); bytes.get(data); collected.write(data)
                    if (collected.size() == payload?.size) { assertArrayEquals(payload, collected.toByteArray()); received.countDown() }
                }
                override fun onClose(code: Int, reason: String, remote: Boolean) {}
                override fun onError(error: Exception) {}
            }
            val blocked = client(address, "https://evil.example", CountDownLatch(1))
            assertFalse(blocked.connectBlocking(3, TimeUnit.SECONDS)); blocked.closeBlocking()
            val wrongToken = client(address.replace(Regex("/[0-9a-f]{48}/"), "/wrong/"), "https://web2.17roco.qq.com", CountDownLatch(1))
            assertFalse(wrongToken.connectBlocking(3, TimeUnit.SECONDS)); wrongToken.closeBlocking()
            assertEquals(0, connects.get())
            val received = CountDownLatch(1)
            val payload = ByteArray(100000) { (it % 251).toByte() }
            val good = client(address, "https://web2.17roco.qq.com", received, payload)
            assertTrue(good.connectBlocking(3, TimeUnit.SECONDS))
            assertTrue(accepted.await(3, TimeUnit.SECONDS))
            assertTrue(received.await(5, TimeUnit.SECONDS))
            good.closeBlocking()
            assertEquals(1, connects.get())
        }
        echo.close(); echoThread.join(2000)
    }
}
