import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.resolve(__dirname, 'mock_return_requests.json');

/**
 * Load return requests from local JSON disk storage to ensure persistence
 * across page refreshes, backend reloads, and local test sessions.
 */
export function loadSavedReturnRequests(initialList: any[]): any[] {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const idMap = new Map<string, any>();
        // Seed initial items first
        for (const item of initialList) {
          idMap.set(item.id, item);
          if (item.orderId) idMap.set(`order_${item.orderId}`, item);
        }
        // Override or append saved items from disk
        for (const item of parsed) {
          idMap.set(item.id, item);
          if (item.orderId) idMap.set(`order_${item.orderId}`, item);
        }
        // Extract unique items by id
        const uniqueItems = Array.from(new Set(parsed.map((p: any) => p.id)))
          .map((id: string) => idMap.get(id))
          .filter(Boolean);

        for (const item of initialList) {
          if (!uniqueItems.some((u: any) => u.id === item.id || u.orderId === item.orderId)) {
            uniqueItems.push(item);
          }
        }
        return uniqueItems;
      }
    }
  } catch (err) {
    console.warn('[FallbackStorage] Notice: Using in-memory return requests seed:', err);
  }
  return [...initialList];
}

/**
 * Save return requests to disk atomically
 */
export function saveReturnRequests(list: any[]): void {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('[FallbackStorage] Warning: Failed to save mock_return_requests.json:', err);
  }
}
