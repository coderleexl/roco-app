package io.github.coderleexl.rocoapp

/** Lifetime order and display selection are deliberately different concepts. */
class WindowRegistry<T : Any> {
    private val storage = mutableListOf<T>()
    private val parents = mutableMapOf<T, T>()
    private var selected: T? = null
    val items: List<T> get() = storage
    val current: T get() = checkNotNull(selected)
    fun add(window: T, parent: T? = null) {
        check(window !in storage)
        storage.add(window)
        if (parent != null) parents[window] = parent
        if (selected == null) selected = window
    }
    fun focus(window: T) { check(window in storage); selected = window }
    fun remove(window: T): Boolean {
        if (window == storage.firstOrNull() || !storage.remove(window)) return false
        val parent = parents.remove(window)
        if (selected == window) selected = parent?.takeIf { it in storage } ?: storage.firstOrNull()
        return true
    }
    fun clear() { selected = null; storage.clear(); parents.clear() }
}
