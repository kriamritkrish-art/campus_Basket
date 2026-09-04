export class CsvExportService {
  /**
   * Generates a standard CSV formatted string from headers and rows with RFC 4180 escaping.
   */
  public static toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
    const escapeCell = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const dataLines = rows.map((r) => r.map(escapeCell).join(','));
    return [headerLine, ...dataLines].join('\r\n');
  }

  public static exportOrders(orders: any[]): string {
    const headers = [
      'Order ID',
      'Date',
      'Student Name',
      'Roll Number',
      'Hall',
      'Room',
      'Subtotal',
      'Delivery Fee',
      'Discount',
      'Total Amount',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Item Count'
    ];

    const rows = orders.map((o) => [
      o.orderNumber || o.id,
      new Date(o.createdAt).toISOString().split('T')[0],
      o.student?.fullName || 'Student',
      o.student?.rollNumber || '',
      o.hallName || '',
      o.roomNumber || '',
      o.subtotal || o.totalAmount,
      o.deliveryFee || 0,
      o.discountAmount || 0,
      o.totalAmount,
      o.paymentMethod,
      o.paymentStatus,
      o.status,
      o.items?.length || 1
    ]);

    return this.toCsv(headers, rows);
  }

  public static exportProducts(products: any[]): string {
    const headers = [
      'Product ID',
      'Name',
      'Category',
      'SKU',
      'Price (INR)',
      'Discount Price',
      'Unit',
      'Stock',
      'Low Stock Threshold',
      'Availability',
      'Featured'
    ];

    const rows = products.map((p) => [
      p.id,
      p.name,
      p.category?.name || p.categoryId,
      p.sku || '',
      p.price,
      p.discountPrice || '',
      p.unit,
      p.stock,
      p.lowStockThreshold,
      p.availability ? 'Active' : 'Hidden',
      p.isFeatured ? 'Yes' : 'No'
    ]);

    return this.toCsv(headers, rows);
  }

  public static exportInventory(inventoryItems: any[]): string {
    const headers = [
      'Product ID',
      'Product Name',
      'SKU',
      'Current Stock',
      'Low Stock Alert Level',
      'Status',
      'Last Updated'
    ];

    const rows = inventoryItems.map((inv) => {
      let status = 'In Stock';
      if (inv.stock <= 0) status = 'Out of Stock';
      else if (inv.stock <= inv.lowStockThreshold) status = 'Low Stock';

      return [
        inv.id,
        inv.name,
        inv.sku || '',
        inv.stock,
        inv.lowStockThreshold,
        status,
        new Date(inv.updatedAt || Date.now()).toLocaleDateString('en-IN')
      ];
    });

    return this.toCsv(headers, rows);
  }

  public static exportLaundry(laundryJobs: any[]): string {
    const headers = [
      'Laundry ID',
      'Student Name',
      'Roll Number',
      'Hall',
      'Room',
      'Service / Garments',
      'Total Garments',
      'Estimated Price',
      'Status',
      'Pickup OTP Status',
      'Delivery OTP Status',
      'Created At'
    ];

    const rows = laundryJobs.map((j) => [
      j.orderNumber || j.id,
      j.student?.fullName || 'Student',
      j.student?.rollNumber || '',
      j.hallName || j.pickupHallId || '',
      j.roomNumber || j.pickupRoom || '',
      j.serviceType || 'Standard Wash & Iron',
      j.items?.length || j.totalClothesCount || 1,
      j.estimatedPrice || j.finalPrice,
      j.status,
      j.pickupOtpVerified ? 'Verified' : 'Pending',
      j.deliveryOtpVerified ? 'Verified' : 'Pending',
      new Date(j.createdAt).toLocaleDateString('en-IN')
    ]);

    return this.toCsv(headers, rows);
  }
}
