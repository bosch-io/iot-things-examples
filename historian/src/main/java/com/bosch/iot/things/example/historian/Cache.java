package com.bosch.iot.things.example.historian;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public class Cache<K,V> extends LinkedHashMap<K,V> {

    private static final long serialVersionUID = -8836965217170751277L;

    private final int maxCapacity;

    public Cache(final int maxCapacity, final int initialCapacity, final float loadFactor) {
        super(initialCapacity, loadFactor, true);
        this.maxCapacity = maxCapacity;
    }

    @Override
    protected boolean removeEldestEntry(final Map.Entry<K, V> eldest) {
        return size() > maxCapacity;
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        final Cache<?, ?> cache = (Cache<?, ?>) o;
        return maxCapacity == cache.maxCapacity;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), maxCapacity);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + " [" +
                super.toString() +
                ", maxCapacity=" + maxCapacity +
                "]";
    }

}