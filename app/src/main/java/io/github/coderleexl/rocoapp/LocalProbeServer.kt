package io.github.coderleexl.rocoapp

import java.io.Closeable
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.Executors

/** Self-test fixtures only; no forwarding, arbitrary files or network proxy. Loopback only. */
class LocalProbeServer(
    private val audioScript: () -> ByteArray = { byteArrayOf() },
    private val viewAsset: (String) -> ByteArray = { byteArrayOf() },
    private val record: (String, Int) -> Unit = { _, _ -> }
) : Closeable {
    private val socket = ServerSocket(0, 4, InetAddress.getByName("127.0.0.1"))
    private val workers = Executors.newFixedThreadPool(2)
    val baseUrl = "http://127.0.0.1:${socket.localPort}"
    @Volatile var fixtureFailure = ""
        private set
    @Volatile var sharedCookieSeen = false
        private set

    init {
        Thread({
            while (!socket.isClosed) {
                try { val client = socket.accept(); workers.execute { try { respond(client) } catch (_: Exception) { client.close() } } }
                catch (_: Exception) { if (!socket.isClosed) Thread.sleep(50) }
            }
        }, "roco-probe-loopback").apply { isDaemon = true; start() }
    }

    private fun respond(client: Socket) = client.use {
        it.soTimeout = 3000
        val input = it.getInputStream()
        val header = StringBuilder()
        while (header.length < 8192 && !header.endsWith("\r\n\r\n")) {
            val b = input.read(); if (b < 0) return@use
            header.append(b.toChar())
        }
        if (!header.endsWith("\r\n\r\n")) return@use
        val route = header.lineSequence().first().split(' ')
        val path = route.getOrNull(1)?.substringBefore('?') ?: "/"
        val cookie = header.lineSequence().firstOrNull { s -> s.startsWith("Cookie:", true) }.orEmpty()
        val hasCookie = cookie.contains("roco_probe=present")
        if (route.firstOrNull() == "HEAD" && path == "/http-discover") {
            val clean = !hasCookie && route.getOrNull(1) == path &&
                header.lineSequence().none { s -> s.startsWith("X-Fixture:", true) || s.startsWith("Referer:", true) }
            val status = if (clean) "200 OK" else "400 Bad Request"
            it.getOutputStream().apply {
                write(("HTTP/1.1 $status\r\nContent-Type: text/xml\r\n" +
                    "Access-Control-Allow-Origin: https://res.17roco.qq.com\r\n" +
                    "Access-Control-Allow-Credentials: true\r\nContent-Length: 0\r\nConnection: close\r\n\r\n").toByteArray())
                flush()
            }
            return@use
        }
        if (route.firstOrNull() != "GET") return@use
        if (path == "/popup.html" && hasCookie) sharedCookieSeen = true
        val payload: ByteArray
        val type: String
        when (path) {
            "/audio.js" -> { payload = audioScript(); type = "application/javascript; charset=utf-8" }
            "/game-view.js" -> { payload = viewAsset("compatibility/game-view.js"); type = "application/javascript; charset=utf-8" }
            "/view.html" -> { payload = viewAsset("probe/view.html"); type = "text/html; charset=utf-8" }
            "/text.html" -> { payload = viewAsset("probe/text.html"); type = "text/html; charset=utf-8" }
            "/text.swf" -> { payload = TextProbeFixture.movie(); type = "application/x-shockwave-flash" }
            "/player-options.js" -> { payload = viewAsset("compatibility/player-options.js"); type = "application/javascript; charset=utf-8" }
            "/game-http.js" -> { payload = viewAsset("compatibility/game-http.js"); type = "application/javascript; charset=utf-8" }
            "/http-child.html" -> { payload = viewAsset("probe/http-child.html"); type = "text/html; charset=utf-8" }
            "/http.html" -> {
                payload = "<!doctype html><title>ROCO:http-loading</title><iframe src='/http-child.html'></iframe>".toByteArray()
                type = "text/html; charset=utf-8"
            }
            "/http-echo", "/http-failure", "/http-discover" -> {
                val content = "<fixture>original bytes</fixture>".toByteArray()
                val clean = path != "/http-discover" || hasCookie && route.getOrNull(1) == "/http-discover?fixture=1" &&
                    header.lineSequence().any { s -> s.equals("X-Fixture: original", true) }
                val status = if (path == "/http-failure") "403 Forbidden" else if (!clean) "400 Bad Request" else "200 OK"
                it.getOutputStream().apply {
                    write("HTTP/1.1 $status\r\nContent-Type: text/xml\r\nContent-Length: ${content.size}\r\nConnection: close\r\n\r\n".toByteArray())
                    write(content); flush()
                }
                return@use
            }
            "/audio-event" -> {
                val uri = android.net.Uri.parse("http://127.0.0.1" + route[1])
                val event = uri.getQueryParameter("event")
                if (event in AudioProbeFixture.events) {
                    record(event!!, uri.getQueryParameter("value")?.toIntOrNull()?.coerceIn(0, 1000) ?: 0)
                }
                payload = byteArrayOf(); type = "text/plain"
            }
            "/audio.html" -> { payload = AudioProbeFixture.page.toByteArray(); type = "text/html; charset=utf-8" }
            "/audio.swf" -> { payload = AudioProbeFixture.movie(); type = "application/x-shockwave-flash" }
            "/fixture-error" -> {
                // Fixed self-test origin only; never installed into official pages.
                val uri = android.net.Uri.parse("http://127.0.0.1" + route[1])
                fixtureFailure = (fixtureFailure + "\n" + (uri.getQueryParameter("message") ?: "unknown").take(1400)).takeLast(6500)
                payload = byteArrayOf(); type = "text/plain"
            }
            "/probe.swf" -> { payload = flashProbe(); type = "application/x-shockwave-flash" }
            "/probe.html" -> { payload = page.toByteArray(); type = "text/html; charset=utf-8" }
            "/popup.html" -> {
                payload = """<!doctype html><title>popup</title><script>if(window.opener && ${hasCookie}) {opener.focus(); opener.document.title='ROCO:popup-focused'; setTimeout(()=>{opener.document.title='ROCO:popup-ok';window.close();},1500);}else{setTimeout(()=>window.close(),500);}</script>""".toByteArray()
                type = "text/html; charset=utf-8"
            }
            "/seed.html" -> { payload = "<!doctype html><title>ROCO:cookie-seeded</title>Fixture cookie set".toByteArray(); type = "text/html" }
            "/check.html" -> { payload = "<!doctype html><title>ROCO:cookie-${if (hasCookie) "persisted" else "missing"}</title>Fixture cookie checked".toByteArray(); type = "text/html" }
            else -> {
                it.getOutputStream().write("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".toByteArray())
                return@use
            }
        }
        val setCookie = if (path in setOf("/seed.html", "/probe.html", "/http.html")) "Set-Cookie: roco_probe=present; Max-Age=86400; Path=/; HttpOnly; SameSite=Lax\r\n" else ""
        val response = "HTTP/1.1 200 OK\r\nContent-Type: $type\r\nContent-Length: ${payload.size}\r\nCache-Control: no-store\r\n${setCookie}Connection: close\r\n\r\n"
        it.getOutputStream().apply { write(response.toByteArray()); write(payload); flush() }
    }

    override fun close() { socket.close(); workers.shutdownNow() }

    companion object {
        // Original tiny SWF: one frame executes fscommand("roco-probe", "executed").
        private fun flashProbe(): ByteArray {
            fun tag(code: Int, body: ByteArray): ByteArray = ByteBuffer.allocate(body.size + 2).order(ByteOrder.LITTLE_ENDIAN)
                .putShort(((code shl 6) or body.size).toShort()).put(body).array()
            val strings = "FSCommand:roco-probe\u0000executed\u0000".toByteArray()
            val action = byteArrayOf(0x83.toByte(), strings.size.toByte(), 0) + strings + byteArrayOf(0x07, 0)
            val rectBits = "01110" + listOf(0, 6000, 0, 3000).joinToString("") { it.toString(2).padStart(14, '0') }
            val padded = rectBits.padEnd((rectBits.length + 7) / 8 * 8, '0')
            val rect = padded.chunked(8).map { it.toInt(2).toByte() }.toByteArray()
            val body = rect + byteArrayOf(0, 12, 1, 0) + tag(12, action) + tag(1, byteArrayOf()) + tag(0, byteArrayOf())
            return byteArrayOf(0x46, 0x57, 0x53, 7) + ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(body.size + 8).array() + body
        }
        private val page = """
            <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
            <title>ROCO:probe-loading</title>
            <script>
            function reportFixtureError(kind,message){if(kind)document.title='ROCO:'+kind;fetch('/fixture-error?message='+encodeURIComponent(String(message).slice(0,1300))).catch(()=>{});}
            const originalConsoleError=console.error.bind(console);console.error=(...args)=>{reportFixtureError(null,args.map(String).join(' '));originalConsoleError(...args);};
            window.addEventListener('error',e=>reportFixtureError('javascript-error',e.message+' at '+e.lineno+':'+e.colno+' '+(e.error?.stack||'')));
            window.addEventListener('unhandledrejection',e=>reportFixtureError('promise-error',e.reason));
            </script>
            <style>body{margin:0;background:#eef4ee}button{position:fixed;inset:0;width:100%;height:100%;z-index:5;background:transparent;border:0;color:#14532d;font:24px sans-serif}object{width:300px;height:150px}</style>
            <script>window.RufflePlayer=window.RufflePlayer||{};window.RufflePlayer.config={autoplay:'on',unmuteOverlay:'hidden',allowScriptAccess:true,preferredRenderer:'webgl'};</script>
            <object type="application/x-shockwave-flash" data="probe.swf"><param name="allowScriptAccess" value="always"></object>
            <button onclick="window.open('popup.html','roco-login');">点此测试关联窗口（测试页，不是游戏）</button>
            <script>
            let hooked=false;
            const watch=setInterval(()=>{
              const player=document.querySelector('ruffle-object,ruffle-embed,ruffle-player');
              if(player && typeof player.ruffle==='function' && !hooked){
                hooked=true;
                document.title='ROCO:player-found';
                const api=player.ruffle();
                api.addFSCommandHandler((command,args)=>{if(command==='roco-probe' && args==='executed')document.title='ROCO:flash-executed';});
                document.title='ROCO:loading-swf';
                api.load({url:new URL('probe.swf',location.href).href,autoplay:'on',allowScriptAccess:true,preferredRenderer:'webgl'}).catch(()=>document.title='ROCO:flash-failed');
                clearInterval(watch);
              }
            },100);
            setTimeout(()=>{if(!hooked)document.title='ROCO:ruffle-timeout';clearInterval(watch);},30000);
            </script>
        """.trimIndent()
    }
}
