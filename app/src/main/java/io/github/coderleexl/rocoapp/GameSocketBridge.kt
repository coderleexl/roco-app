package io.github.coderleexl.rocoapp

import java.io.Closeable
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.ByteBuffer
import java.security.SecureRandom
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.RejectedExecutionException
import java.util.concurrent.Semaphore
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong
import org.java_websocket.WebSocket
import org.java_websocket.WebSocketImpl
import org.java_websocket.drafts.Draft
import org.java_websocket.drafts.Draft_6455
import org.java_websocket.exceptions.InvalidDataException
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.handshake.ServerHandshakeBuilder
import org.java_websocket.server.WebSocketServer

/** Process-local binary transport. Never interprets, persists or logs game payloads. */
class GameSocketBridge internal constructor(
    private val record: (String, Int) -> Unit = { _, _ -> },
    private val connect: (String) -> Socket = ::connectOfficial
) : Closeable {
    private val token = ByteArray(24).also { SecureRandom().nextBytes(it) }.joinToString("") { "%02x".format(it) }
    private val slots = Semaphore(8)
    private val pipes = ConcurrentHashMap<WebSocket, Pipe>()
    private val workers = ThreadPoolExecutor(16, 16, 0, TimeUnit.SECONDS, ArrayBlockingQueue(16),
        { task -> Thread(task, "time-casket-tcp").apply { isDaemon = true } }, ThreadPoolExecutor.AbortPolicy())
    private val started = CountDownLatch(1)
    @Volatile private var failed = false
    private class Pipe(val host: String) {
        val queue = ArrayBlockingQueue<ByteArray>(64)
        val pending = AtomicInteger()
        val connected = CountDownLatch(1)
        val sent = AtomicLong()
        val received = AtomicLong()
        @Volatile var socket: Socket? = null
        @Volatile var closed = false
    }
    private val server = object : WebSocketServer(
        InetSocketAddress(InetAddress.getByName("127.0.0.1"), 0), 2,
        listOf(Draft_6455(emptyList(), MAX_PENDING))
    ) {
        override fun onWebsocketHandshakeReceivedAsServer(
            conn: WebSocket, draft: Draft, request: ClientHandshake
        ): ServerHandshakeBuilder {
            val host = GameSocketPolicy.target(request.resourceDescriptor, token)
            if (host == null || !GameSocketPolicy.allowsOrigin(request.getFieldValue("Origin")) ||
                request.getFieldValue("Host") != "127.0.0.1:$port" ||
                conn.remoteSocketAddress?.address?.isLoopbackAddress != true || !slots.tryAcquire()) {
                record("socket-rejected", 0)
                throw InvalidDataException(1008, "Bridge policy")
            }
            pipes[conn] = Pipe(host)
            try { return super.onWebsocketHandshakeReceivedAsServer(conn, draft, request) }
            catch (error: Exception) { end(conn); throw error }
        }
        override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {
            val pipe = pipes[conn] ?: return conn.close(1008)
            record("socket-open", GameSocketPolicy.hosts.indexOf(pipe.host))
            try {
            workers.execute {
                var upstreamReady = false
                try {
                    if (pipe.closed) return@execute
                    record("socket-connect-start", GameSocketPolicy.hosts.indexOf(pipe.host))
                    val upstream = connect(pipe.host)
                    synchronized(pipe) {
                        if (pipe.closed) { upstream.close(); return@execute }
                        pipe.socket = upstream
                    }
                    upstreamReady = true
                    record("socket-connected", GameSocketPolicy.hosts.indexOf(pipe.host))
                    pipe.connected.countDown()
                    val buffer = ByteArray(16384)
                    val input = upstream.getInputStream()
                    while (!pipe.closed) {
                        val size = input.read(buffer)
                        if (size < 0) { record("socket-eof", GameSocketPolicy.hosts.indexOf(pipe.host)); break }
                        if (pipe.received.getAndAdd(size.toLong()) == 0L) record("socket-first-receive", GameSocketPolicy.hosts.indexOf(pipe.host))
                        val queued = (conn as WebSocketImpl).outQueue.sumOf { it.remaining().toLong() }
                        if (queued > MAX_PENDING) throw IllegalStateException("Backpressure")
                        conn.send(buffer.copyOf(size))
                    }
                    conn.close(1000)
                } catch (error: Exception) {
                    val category = if (upstreamReady) "socket-read-failed" else when (error) {
                        is java.net.UnknownHostException -> "socket-dns-failed"
                        is IllegalArgumentException -> "socket-address-rejected"
                        is java.net.SocketTimeoutException -> "socket-connect-timeout"
                        is java.net.ConnectException -> "socket-connect-refused"
                        else -> "socket-connect-failed"
                    }
                    if (!pipe.closed) { record(category, GameSocketPolicy.hosts.indexOf(pipe.host)); conn.close(1011) }
                } finally { end(conn) }
            }
            workers.execute {
                try {
                    if (!pipe.connected.await(12, TimeUnit.SECONDS)) throw IllegalStateException("Connect timeout")
                    val output = pipe.socket?.getOutputStream() ?: return@execute
                    while (!pipe.closed) {
                        val bytes = pipe.queue.poll(1, TimeUnit.SECONDS) ?: continue
                        output.write(bytes)
                        if (pipe.sent.getAndAdd(bytes.size.toLong()) == 0L) record("socket-first-send", GameSocketPolicy.hosts.indexOf(pipe.host))
                        pipe.pending.addAndGet(-bytes.size)
                    }
                } catch (_: Exception) {
                    if (!pipe.closed) { record("socket-write-failed", GameSocketPolicy.hosts.indexOf(pipe.host)); conn.close(1011) }
                } finally { end(conn) }
            }
            } catch (_: RejectedExecutionException) { conn.close(1013); end(conn) }
        }
        override fun onMessage(conn: WebSocket, message: ByteBuffer) {
            val pipe = pipes[conn] ?: return
            val size = message.remaining()
            if (size > MAX_PENDING || pipe.pending.addAndGet(size) > MAX_PENDING) {
                conn.close(1009); end(conn); return
            }
            val data = ByteArray(size).also { message.get(it) }
            if (!pipe.queue.offer(data)) { conn.close(1009); end(conn) }
        }
        override fun onMessage(conn: WebSocket, message: String) { conn.close(1003); end(conn) }
        override fun onClose(conn: WebSocket, code: Int, reason: String, remote: Boolean) { end(conn) }
        override fun onError(conn: WebSocket?, ex: Exception) {
            // Error text may contain URLs. Retain only a fixed category.
            if (conn == null) { failed = true; started.countDown() }
            else { conn.close(1011); end(conn) }
            record("socket-bridge-error", 0)
        }
        override fun onStart() { started.countDown(); record("socket-bridge-ready", 0) }
    }.apply { isDaemon = true; maxPendingConnections = 8; connectionLostTimeout = 30 }

    init { server.start() }
    val isReady get() = started.count == 0L && !failed && server.port > 0
    internal fun awaitReady() = started.await(5, TimeUnit.SECONDS) && isReady
    // Capability stays in memory for this process and must never enter diagnostics.
    fun proxyUrl(host: String): String {
        require(host in GameSocketPolicy.hosts && isReady)
        return "ws://127.0.0.1:${server.port}/$token/$host"
    }
    private fun end(conn: WebSocket) {
        val pipe = pipes.remove(conn) ?: return
        synchronized(pipe) { pipe.closed = true; try { pipe.socket?.close() } catch (_: Exception) {} }
        pipe.connected.countDown()
        pipe.queue.clear()
        val endpoint = if (pipe.host == GameSocketPolicy.hosts[0]) "dir" else "stat"
        record("socket-$endpoint-sent", pipe.sent.get().coerceAtMost(Int.MAX_VALUE.toLong()).toInt())
        record("socket-$endpoint-received", pipe.received.get().coerceAtMost(Int.MAX_VALUE.toLong()).toInt())
        record("socket-ended", GameSocketPolicy.hosts.indexOf(pipe.host))
        slots.release()
    }
    override fun close() {
        pipes.keys.toList().forEach { it.close(1001); end(it) }
        server.stop(1000)
        workers.shutdownNow()
    }
    companion object {
        private const val MAX_PENDING = 1024 * 1024
        private fun connectOfficial(host: String): Socket {
            require(host in GameSocketPolicy.hosts)
            val addresses = InetAddress.getAllByName(host).toList()
            require(addresses.isNotEmpty() && addresses.all(GameSocketPolicy::isPublic))
            val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(8)
            var lastFailure: Exception? = null
            for (address in addresses.take(4)) {
                val timeout = TimeUnit.NANOSECONDS.toMillis(deadline - System.nanoTime()).coerceAtMost(4000).toInt()
                if (timeout <= 0) break
                val socket = Socket()
                try {
                    socket.tcpNoDelay = true
                    // Connect to this already-validated IP, without another DNS resolution.
                    socket.connect(InetSocketAddress(address, 443), timeout)
                    return socket
                } catch (error: Exception) { lastFailure = error; socket.close() }
            }
            throw lastFailure ?: java.io.IOException("Official endpoint unavailable")
        }
    }
}
