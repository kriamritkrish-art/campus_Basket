import fs from 'fs';
import path from 'path';

function getCandidatePaths(): string[] {
  return [
    path.resolve(__dirname, 'mock_return_requests.json'),
    path.resolve(__dirname, '../../src/services/mock_return_requests.json'),
    path.resolve(process.cwd(), 'src/services/mock_return_requests.json'),
    path.resolve(process.cwd(), 'dist/services/mock_return_requests.json'),
    path.resolve(process.cwd(), 'mock_return_requests.json'),
    path.resolve('/tmp', 'cb_mock_return_requests.json'),
  ];
}

/**
 * Load return requests from local JSON disk storage to ensure persistence
 * across page refreshes, backend reloads, and local test sessions.
 */
export function loadSavedReturnRequests(initialList: any[]): any[] {
  const candidatePaths = getCandidatePaths();

  for (const storagePath of candidatePaths) {
    try {
      if (fs.existsSync(storagePath)) {
        const data = fs.readFileSync(storagePath, 'utf8');
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
      // Continue to next candidate
    }
  }

  return [...initialList];
}

/**
 * Save return requests to disk atomically across all writable candidate locations
 */
export function saveReturnRequests(list: any[]): void {
  const candidatePaths = getCandidatePaths();
  const jsonStr = JSON.stringify(list, null, 2);

  for (const storagePath of candidatePaths) {
    try {
      const dir = path.dirname(storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(storagePath, jsonStr, 'utf8');
    } catch {
      // Best-effort write across available locations
    }
  }
}

function getOrderCandidatePaths(): string[] {
  return [
    path.resolve(__dirname, 'mock_orders.json'),
    path.resolve(__dirname, '../../src/services/mock_orders.json'),
    path.resolve(process.cwd(), 'src/services/mock_orders.json'),
    path.resolve(process.cwd(), 'dist/services/mock_orders.json'),
    path.resolve(process.cwd(), 'mock_orders.json'),
    path.resolve('/tmp', 'cb_mock_orders.json'),
  ];
}

export function loadSavedOrders(initialList: any[]): any[] {
  const candidatePaths = getOrderCandidatePaths();

  for (const storagePath of candidatePaths) {
    try {
      if (fs.existsSync(storagePath)) {
        const data = fs.readFileSync(storagePath, 'utf8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const idMap = new Map<string, any>();
          for (const item of initialList) {
            idMap.set(item.id, item);
            if (item.orderNumber) idMap.set(`num_${item.orderNumber}`, item);
          }
          for (const item of parsed) {
            idMap.set(item.id, item);
            if (item.orderNumber) idMap.set(`num_${item.orderNumber}`, item);
          }
          const uniqueItems = Array.from(new Set(parsed.map((p: any) => p.id)))
            .map((id: string) => idMap.get(id))
            .filter(Boolean);

          for (const item of initialList) {
            if (!uniqueItems.some((u: any) => u.id === item.id || (u.orderNumber && u.orderNumber === item.orderNumber))) {
              uniqueItems.push(item);
            }
          }
          return uniqueItems;
        }
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  return [...initialList];
}

export function saveOrders(list: any[]): void {
  const candidatePaths = getOrderCandidatePaths();
  const jsonStr = JSON.stringify(list, null, 2);

  for (const storagePath of candidatePaths) {
    try {
      const dir = path.dirname(storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(storagePath, jsonStr, 'utf8');
    } catch {
      // Best-effort write across available locations
    }
  }
}

function getGenericCandidatePaths(filename: string): string[] {
  return [
    path.resolve(__dirname, filename),
    path.resolve(__dirname, '../../src/services', filename),
    path.resolve(process.cwd(), 'src/services', filename),
    path.resolve(process.cwd(), 'dist/services', filename),
    path.resolve(process.cwd(), filename),
    path.resolve('/tmp', `cb_${filename}`),
  ];
}

export function loadSavedList(filename: string, initialList: any[]): any[] {
  const candidatePaths = getGenericCandidatePaths(filename);
  for (const storagePath of candidatePaths) {
    try {
      if (fs.existsSync(storagePath)) {
        const data = fs.readFileSync(storagePath, 'utf8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, any>();
          for (const item of initialList) {
            if (item.id) map.set(item.id, item);
          }
          for (const item of parsed) {
            if (item.id) map.set(item.id, item);
          }
          return Array.from(map.values());
        }
      }
    } catch {
      // Continue to next candidate
    }
  }
  return [...initialList];
}

export function saveList(filename: string, list: any[]): void {
  const candidatePaths = getGenericCandidatePaths(filename);
  const jsonStr = JSON.stringify(list, null, 2);
  for (const storagePath of candidatePaths) {
    try {
      const dir = path.dirname(storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(storagePath, jsonStr, 'utf8');
    } catch {
      // Best-effort write
    }
  }
}



