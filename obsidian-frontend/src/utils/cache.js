// Simple in-memory cache with TTL support
class Cache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Set item with TTL (time to live in milliseconds)
  set(key, value, ttl = 300000) { // Default 5 minutes
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set expiration timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }
  }

  // Get item
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (item.ttl > 0 && Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  // Delete item
  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Check if key exists
  has(key) {
    return this.get(key) !== null;
  }
}

// Create global cache instance
const cache = new Cache();

// Cache helper functions for different data types
export const cacheHelpers = {
  // Cache user data
  cacheUser: (userData, ttl = 600000) => { // 10 minutes
    cache.set(`user_${userData.id}`, userData, ttl);
  },

  getCachedUser: (userId) => {
    return cache.get(`user_${userId}`);
  },

  // Cache profile data
  cacheProfile: (profileData, ttl = 600000) => {
    cache.set(`profile_${profileData.user_id}`, profileData, ttl);
  },

  getCachedProfile: (userId) => {
    return cache.get(`profile_${userId}`);
  },

  // Cache projects data
  cacheProjects: (projects, ttl = 300000) => { // 5 minutes
    cache.set('projects', projects, ttl);
  },

  getCachedProjects: () => {
    return cache.get('projects');
  },

  // Cache conversations
  cacheConversations: (conversations, userId, ttl = 60000) => { // 1 minute
    cache.set(`conversations_${userId}`, conversations, ttl);
  },

  getCachedConversations: (userId) => {
    return cache.get(`conversations_${userId}`);
  },

  // Cache messages
  cacheMessages: (messages, userId, partnerId, ttl = 30000) => { // 30 seconds
    cache.set(`messages_${userId}_${partnerId}`, messages, ttl);
  },

  getCachedMessages: (userId, partnerId) => {
    return cache.get(`messages_${userId}_${partnerId}`);
  },

  // Cache search results
  cacheSearchResults: (query, results, ttl = 120000) => { // 2 minutes
    cache.set(`search_${query}`, results, ttl);
  },

  getCachedSearchResults: (query) => {
    return cache.get(`search_${query}`);
  },

  // Invalidate user-related cache
  invalidateUserCache: (userId) => {
    cache.delete(`user_${userId}`);
    cache.delete(`profile_${userId}`);
    cache.delete(`conversations_${userId}`);
  },

  // Invalidate all cache
  invalidateAll: () => {
    cache.clear();
  }
};

export default cache;
