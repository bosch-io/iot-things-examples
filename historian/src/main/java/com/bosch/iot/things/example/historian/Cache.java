package com.bosch.iot.things.example.historian;

import java.util.Map;
import java.util.LinkedHashMap;

public class Cache<K,V> extends LinkedHashMap<K,V> {

    private final int maxCapacity;

    public Cache(int maxCapacity, int initialCapacity, float loadFactor) {
        super(initialCapacity, loadFactor, true);
        this.maxCapacity = maxCapacity;
    }

    public Cache(int maxCapacity) {
        this(maxCapacity, 16, 0.75f);
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxCapacity;
    }

}