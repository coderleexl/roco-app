package io.github.coderleexl.rocoapp

import java.nio.ByteBuffer
import java.nio.ByteOrder

/** Original device-font text only. No official movie, account data or screenshots. */
object TextProbeFixture {
    fun movie(): ByteArray {
        fun u16(n: Int) = ByteBuffer.allocate(2).order(ByteOrder.LITTLE_ENDIAN).putShort(n.toShort()).array()
        fun tag(code: Int, data: ByteArray) = u16((code shl 6) or minOf(data.size, 63)) +
            (if (data.size >= 63) ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(data.size).array() else byteArrayOf()) + data
        fun rect(width: Int, height: Int): ByteArray {
            val size = maxOf(width, height).toString(2).length + 1
            val bits = size.toString(2).padStart(5, '0') + listOf(0, width, 0, height).joinToString("") { it.toString(2).padStart(size, '0') }
            return bits.padEnd((bits.length + 7) / 8 * 8, '0').chunked(8).map { it.toInt(2).toByte() }.toByteArray()
        }
        // Like the battle label: named device font with zero glyphs, useOutlines=false.
        val fontName = "SimSun".toByteArray()
        val font = u16(1) + byteArrayOf(5, 0, fontName.size.toByte()) + fontName + u16(0) + u16(2)
        val text = u16(2) + rect(8000, 1600) + byteArrayOf(0x8d.toByte(), 0x10) + u16(1) + u16(640) +
            byteArrayOf(0, 0, 0, 0xff.toByte(), 0) + "技能名称 火花\u0000".toByteArray(Charsets.UTF_8)
        val body = rect(8000, 1600) + byteArrayOf(0, 12, 1, 0) + tag(48, font) + tag(37, text) +
            tag(26, byteArrayOf(6) + u16(1) + u16(2) + byteArrayOf(0)) +
            tag(12, byteArrayOf(7, 0)) + tag(1, byteArrayOf()) + tag(0, byteArrayOf())
        return byteArrayOf(0x46, 0x57, 0x53, 10) + ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(body.size + 8).array() + body
    }
}
