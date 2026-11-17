import Foundation
import Network
import WebKit

// No stored credentials or payload logging. Socket capabilities are document-scoped IDs.
final class NativeBridge: NSObject, WKScriptMessageHandlerWithReply, URLSessionTaskDelegate {
    private struct Socket {
        let connection: NWConnection
        let owner: String
        var pending: Bool = false
        var ready: Bool = false
    }
    private var sockets: [String: Socket] = [:]
    private var session: URLSession!
    private let resourceRoot: URL
    private let maxBytes = 32 * 1024 * 1024

    init(resourceRoot: URL) {
        self.resourceRoot = resourceRoot
        super.init()
        let config = URLSessionConfiguration.ephemeral
        config.httpCookieStorage = nil
        config.urlCredentialStorage = nil
        config.httpShouldSetCookies = false
        config.timeoutIntervalForRequest = 25
        config.timeoutIntervalForResource = 45
        session = URLSession(configuration: config, delegate: self, delegateQueue: .main)
    }
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
    func closeAll() {
        for item in sockets.values { item.connection.cancel() }
        sockets.removeAll()
    }
    func dispose() { closeAll(); session.invalidateAndCancel() }
    private func allowedHost(_ host: String) -> Bool {
        if ["dir.17roco.qq.com", "stat.17roco.qq.com"].contains(host) { return true }
        guard host.range(of: "^zone[1-9][0-9]{0,4}\\.17roco\\.qq\\.com$", options: .regularExpression) != nil,
              let n = Int(host.dropFirst(4).prefix(while: { $0 != "." })) else { return false }
        return n <= 65535
    }
    private func publicAsset(_ url: URL) -> Bool {
        guard url.scheme == "https", url.host == "res.17roco.qq.com", url.port == nil || url.port == 443,
              url.user == nil, url.password == nil, url.fragment == nil,
              !url.path.contains(".."), !url.path.contains("//"),
              url.path.range(of: "^/[A-Za-z0-9_./-]+$", options: .regularExpression) != nil else { return false }
        let p = url.path
        if ["/preloader.swf", "/main.swf", "/ver.config", "/Global.xml", "/preloadlist.xml"].contains(p) { return true }
        let pieces = p.split(separator: "/")
        let directories = ["swf", "libs", "conf", "res", "plugins", "activity", "apps", "video"]
        let extensions = ["swf", "xml", "config", "bin", "dat", "png", "jpg", "jpeg", "gif", "webp", "mp3", "mp4", "txt", "fint", "exbn"]
        return pieces.count >= 2 && directories.contains(String(pieces[0])) && extensions.contains(url.pathExtension.lowercased())
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler reply: @escaping (Any?, String?) -> Void) {
        let origin = message.frameInfo.securityOrigin
        guard origin.protocol == "https", ["17roco.qq.com", "web2.17roco.qq.com"].contains(origin.host),
              origin.port == 0 || origin.port == 443,
              let body = message.body as? [String: Any], let command = body["command"] as? String else {
            reply(nil, "Origin or command rejected"); return
        }
        let owner = origin.host
        switch command {
        case "asset":
            guard let path = body["path"] as? String, path.range(of: "^dist/(assets/[A-Za-z0-9_-]+\\.wasm|[0-9]+\\.js)$", options: .regularExpression) != nil else { reply(nil, "Asset rejected"); return }
            let url = resourceRoot.appendingPathComponent(path)
            guard let data = try? Data(contentsOf: url), data.count <= maxBytes else { reply(nil, "Asset missing or too large"); return }
            reply(["data": data.base64EncodedString(), "type": path.hasSuffix(".wasm") ? "application/wasm" : "application/javascript", "status": 200], nil)
        case "fetch":
            guard let text = body["url"] as? String, text.count < 8192, let url = URL(string: text), publicAsset(url) else { reply(nil, "URL rejected"); return }
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            session.dataTask(with: request) { [weak self] data, response, error in
                guard let self = self, error == nil, let response = response as? HTTPURLResponse, let data = data,
                      data.count <= self.maxBytes else { reply(nil, "Public resource request failed"); return }
                reply(["data": data.base64EncodedString(), "type": response.mimeType ?? "application/octet-stream", "status": response.statusCode], nil)
            }.resume()
        case "open":
            guard let id = body["id"] as? String, UUID(uuidString: id) != nil, sockets[id] == nil,
                  sockets.count < 16, let host = body["host"] as? String, allowedHost(host) else { reply(nil, "Socket rejected"); return }
            let connection = NWConnection(host: NWEndpoint.Host(host), port: 443, using: .tcp)
            sockets[id] = Socket(connection: connection, owner: owner)
            var replied = false
            func finish(_ value: Any?, _ error: String?) { if !replied { replied = true; reply(value, error) } }
            connection.stateUpdateHandler = { [weak self] state in
                switch state {
                case .ready: self?.sockets[id]?.ready = true; finish(["ok": true], nil)
                case .failed, .cancelled:
                    self?.sockets.removeValue(forKey: id)
                    connection.cancel(); finish(nil, "Connection closed")
                default: break
                }
            }
            connection.start(queue: .main)
            DispatchQueue.main.asyncAfter(deadline: .now() + 15) {
                if !replied { connection.cancel(); finish(nil, "Connection timed out") }
            }
        case "send", "receive", "close":
            guard let id = body["id"] as? String, var socket = sockets[id], socket.owner == owner, socket.ready else { reply(nil, "Unknown socket"); return }
            if command == "close" { sockets.removeValue(forKey: id); socket.connection.cancel(); reply(["ok": true], nil); return }
            if command == "send" {
                guard let encoded = body["data"] as? String, encoded.count <= 1400000, let data = Data(base64Encoded: encoded), data.count <= 1024 * 1024 else { reply(nil, "Socket frame too large"); return }
                socket.connection.send(content: data, completion: .contentProcessed { error in
                    reply(error == nil ? ["ok": true] : nil, error == nil ? nil : "Send failed")
                })
            } else {
                guard !socket.pending else { reply(nil, "Receive already pending"); return }
                socket.pending = true; sockets[id] = socket
                socket.connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, _, complete, error in
                    self?.sockets[id]?.pending = false
                    if error != nil || complete { self?.sockets.removeValue(forKey: id); socket.connection.cancel() }
                    if let data = data, !data.isEmpty { reply(["data": data.base64EncodedString(), "closed": complete || error != nil], nil) }
                    else if complete || error != nil { reply(["data": "", "closed": true], nil) }
                    else { reply(nil, "Empty receive") }
                }
            }
        default: reply(nil, "Unsupported command")
        }
    }
}
