"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardDataManager = exports.cardDataManager = void 0;
// @ts-nocheck
const lru_cache_1 = require("lru-cache");
class CardDataManager {
    constructor(maxSize = 50) {
        this.dataCache = new Map();
        this.lruCache = new lru_cache_1.LRUCache({ max: maxSize });
        this.pendingRender = new Set();
        this.worker = null;
        this.parseCallbacks = new Map();
        this.initWorker();
    }
    initWorker() {
        try {
            const workerCode = `
        self.onmessage = (event) => {
          const { cardId, data } = event.data;
          try {
            const text = new TextDecoder().decode(data);
            const parsed = JSON.parse(text);
            self.postMessage({ cardId, data: Array.isArray(parsed) ? parsed : [parsed] });
          } catch (error) {
            self.postMessage({ cardId, data: [], error: String(error) });
          }
        };
      `;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));
            this.worker.onmessage = (event) => {
                const result = event.data;
                const callback = this.parseCallbacks.get(result.cardId);
                if (callback) {
                    callback(result);
                    this.parseCallbacks.delete(result.cardId);
                }
                if (!result.error) {
                    this.lruCache.set(result.cardId, { data: result.data, timestamp: Date.now() });
                }
            };
        }
        catch (e) {
            console.warn('[CardDataManager] Worker init failed, using sync parsing:', e);
        }
    }
    addChunk(cardId, chunkIndex, data) {
        if (!this.dataCache.has(cardId)) {
            this.dataCache.set(cardId, new Map());
        }
        this.dataCache.get(cardId).set(chunkIndex, data);
    }
    assembleData(cardId) {
        const chunks = this.dataCache.get(cardId);
        if (!chunks || chunks.size === 0)
            return null;
        const sortedChunks = Array.from(chunks.entries()).sort((a, b) => a[0] - b[0]);
        const totalLength = sortedChunks.reduce((sum, [, buffer]) => sum + buffer.byteLength, 0);
        const result = new ArrayBuffer(totalLength);
        const view = new Uint8Array(result);
        let offset = 0;
        for (const [, buffer] of sortedChunks) {
            view.set(new Uint8Array(buffer), offset);
            offset += buffer.byteLength;
        }
        return result;
    }
    parseData(cardId) {
        return new Promise((resolve) => {
            const cached = this.lruCache.get(cardId);
            if (cached) {
                resolve({ cardId, data: cached.data });
                return;
            }
            const buffer = this.assembleData(cardId);
            if (!buffer) {
                resolve({ cardId, data: [], error: 'No data' });
                return;
            }
            this.parseCallbacks.set(cardId, resolve);
            if (this.worker) {
                this.worker.postMessage({ cardId, data: buffer }, [buffer]);
            }
            else {
                try {
                    const text = new TextDecoder().decode(buffer);
                    const data = JSON.parse(text);
                    resolve({ cardId, data: Array.isArray(data) ? data : [data] });
                }
                catch (e) {
                    resolve({ cardId, data: [], error: String(e) });
                }
            }
        });
    }
    renderCard(cardId) {
        this.pendingRender.add(cardId);
    }
    isPendingRender(cardId) {
        return this.pendingRender.has(cardId);
    }
    releaseCard(cardId) {
        this.dataCache.delete(cardId);
        this.pendingRender.delete(cardId);
    }
    clearCache() {
        this.dataCache.clear();
        this.pendingRender.clear();
        this.lruCache.clear();
    }
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.clearCache();
        this.parseCallbacks.clear();
    }
    getCachedData(cardId) {
        const cached = this.lruCache.get(cardId);
        return cached ? cached.data : null;
    }
    hasData(cardId) {
        return this.lruCache.has(cardId) || (this.dataCache.get(cardId)?.size ?? 0) > 0;
    }
}
exports.CardDataManager = CardDataManager;
exports.cardDataManager = new CardDataManager();
