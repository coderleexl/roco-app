package io.github.coderleexl.rocoapp

import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.PI
import kotlin.math.sin

/** Original half-second PCM tone. No game assets or external requests. */
object AudioProbeFixture {
    fun movie(): ByteArray {
        fun tag(code: Int, data: ByteArray): ByteArray {
            val header = ByteBuffer.allocate(if (data.size < 63) 2 else 6).order(ByteOrder.LITTLE_ENDIAN)
            header.putShort(((code shl 6) or minOf(data.size, 63)).toShort())
            if (data.size >= 63) header.putInt(data.size)
            return header.array() + data
        }
        val samples = 22050
        val pcm = ByteBuffer.allocate(samples * 2).order(ByteOrder.LITTLE_ENDIAN)
        repeat(samples) { i ->
            val envelope = minOf(1.0, i / 441.0, (samples - 1 - i) / 441.0)
            pcm.putShort((sin(2 * PI * 660 * i / 44100) * 6500 * envelope).toInt().toShort())
        }
        val sound = ByteBuffer.allocate(7).order(ByteOrder.LITTLE_ENDIAN)
            .putShort(1).put(0x3e).putInt(samples).array() + pcm.array()
        // RECT 0..400 twips in each dimension, 12fps, one frame.
        val bits = "01010" + listOf(0, 400, 0, 400).joinToString("") { it.toString(2).padStart(10, '0') }
        val rect = bits.padEnd((bits.length + 7) / 8 * 8, '0').chunked(8).map { it.toInt(2).toByte() }.toByteArray()
        val body = rect + byteArrayOf(0, 12, 1, 0) + tag(14, sound) + tag(15, byteArrayOf(1, 0, 0)) +
            tag(12, byteArrayOf(7, 0)) + tag(1, byteArrayOf()) + tag(0, byteArrayOf())
        return byteArrayOf(0x46, 0x57, 0x53, 7) + ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(body.size + 8).array() + body
    }
    val page = """
        <!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>ROCO:audio-ready</title><style>body{font:18px sans-serif;padding:20px;line-height:1.6}button{position:fixed;left:5%;width:90%;height:20%;font:inherit}#web{top:28%}#flash{top:52%}#status{position:fixed;top:74%;left:5%;right:5%}#movie{position:fixed;bottom:0}ruffle-player{width:120px;height:40px}</style>
        <p>点击后各播放一次短提示音。请记住哪一种能听见，测试后点“关闭子窗口”返回游戏。</p>
        <button id="web">试听浏览器声音</button><button id="flash">试听 Flash 声音</button><p id="status" role="status">等待试听</p><div id="movie"></div>
        <script>
        const status=document.getElementById('status');let context,player,busy=false;
        document.getElementById('web').onclick=async()=>{
          try{context=context||new AudioContext();await context.resume();const tone=context.createOscillator(),gain=context.createGain();
            tone.frequency.value=660;gain.gain.setValueAtTime(0,context.currentTime);gain.gain.linearRampToValueAtTime(.18,context.currentTime+.02);gain.gain.linearRampToValueAtTime(0,context.currentTime+.5);
            tone.connect(gain).connect(context.destination);tone.start();tone.stop(context.currentTime+.5);tone.onended=()=>{tone.disconnect();gain.disconnect();};
            document.title=context.state==='running'?'ROCO:audio-web-running':'ROCO:audio-web-blocked';status.textContent='浏览器提示音已请求播放，请以实际听到为准';
          }catch(_){status.textContent='浏览器声音启动失败';}
        };
        document.getElementById('flash').onclick=async()=>{
          if(busy)return;const ruffle=window.RufflePlayer?.newest?.();if(!ruffle){status.textContent='Flash 播放器尚未就绪，请稍后重试';return;}busy=true;
          try{if(!player){player=ruffle.createPlayer();document.getElementById('movie').appendChild(player);}
            await player.ruffle().load({url:new URL('audio.swf',location.href).href,autoplay:'on',allowScriptAccess:false,preferredRenderer:'webgl'});
            status.textContent='Flash 提示音已请求播放，请以实际听到为准';
            let tries=0;const watch=setInterval(()=>{if(player.ruffle().readyState===2){document.title='ROCO:audio-flash-ready';clearInterval(watch);}else if(++tries>=100)clearInterval(watch);},100);
          }catch(_){status.textContent='Flash 声音启动失败';}finally{busy=false;}
        };
        window.addEventListener('pagehide',()=>context?.close(),{once:true});
        </script></html>
    """.trimIndent()
}
