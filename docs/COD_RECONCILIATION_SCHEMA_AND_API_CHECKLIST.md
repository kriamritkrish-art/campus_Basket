# COD Reconciliation Schema and API Checklist

## 1. Single source of truth

COD reconciliation must be calculated from real order/payment records and must never be reconstructed independently by the frontend.

Required order-level fields:

- order_id
- order_number
- customer_id
- delivery_boy_id
- provider_id
- order_amount
- online_paid_amount
- cod_amount_due
- delivery_status
- payment_method
- cash_collected_amount
- collection_status
- reconciliation_status
- reconciled_by
- reconciled_at
- reconciliation_notes
- order_type

These values must be stored or derived from the canonical `Order` and `CODCollection` records.

## 2. Database schema expectations

```prisma
model Order {
  id                  String       @id @default(cuid())
  orderNumber         String       @unique
  studentId           String
  deliveryBoyId       String?
  providerId          String?
  status              OrderStatus
  paymentMethod       PaymentMethod
  paymentStatus       PaymentStatus
  settlementStatus    SettlementStatus
  totalAmount         Decimal
  advancePaidAmount   Decimal
  deliveredAt         DateTime?
  deliveryOtpVerified Boolean
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model CODCollection {
  id                   String                  @id @default(cuid())
  collectionNumber     String                  @unique
  orderId              String                  @unique
  deliveryBoyId        String?
  expectedAmount       Decimal                 @db.Decimal(10, 2)
  collectedAmount      Decimal                 @default(0.00) @db.Decimal(10, 2)
  difference           Decimal                 @default(0.00) @db.Decimal(10, 2)
  collectionStatus     CodCollectionStatus     @default(PENDING)
  reconciliationStatus CodReconciliationStatus @default(PENDING)
  reconciledAt         DateTime?
  reconciledBy         String?
  notes               String?
  createdAt            DateTime                @default(now())
  updatedAt            DateTime                @updatedAt
}
```

## 3. Calculation rules

- COD amount due = `max(0, order_total - online_paid_amount)`
- Only delivered orders with verified OTP and `cod_amount_due > 0` are eligible
- `difference = expected_cod - cash_collected`
- `collection_status` and `reconciliation_status` are separate values
- Only real order numbers are allowed in production-facing reconciliation screens
- Pickup and return orders must remain excluded from customer COD reconciliation

## 4. Required API behavior

### GET /admin/payments/cod-reconciliation

Required response shape:

- `summary.totalCodOrders`
- `summary.expectedCod`
- `summary.cashCollected`
- `summary.difference`
- `summary.reconciledCount`
- `summary.pendingCount`
- `deliveryBoys[]`
- `collections[]`

Rules:

- filter by real `deliveryBoyId` only
- never group by name alone
- return only genuine customer orders
- exclude TEST/DEMO/N/A values from production screens

### POST /admin/payments/cod-reconcile

Required validation:

- `amountCollected >= 0`
- `amountCollected <= expectedAmount` unless explicit over-collection flow is enabled
- calculate difference on the backend
- persist `reconciled_by`, `reconciled_at`, and notes
- reject duplicate reconciliation records by `order_id`

### POST /admin/payments/cod-reconcile-bulk

Required validation:

- only eligible orders are included
- show total orders, expected COD, previously collected, outstanding amount, and count before confirm
- reconcile only once per order
- maintain audit log with old/new statuses and amounts

## 5. Required test cases

- pure COD order
- partial online + COD order
- fully online paid order
- delivered order with OTP verification
- undelivered order
- cancelled order
- partial cash collection
- full cash collection
- two delivery boys with the same name but distinct IDs
- multiple orders assigned to one delivery boy
- laundry pickup order excluded from COD
- laundry return order excluded from COD
- normal customer order included
- bulk reconciliation validation
- filter by delivery boy
- filter by status
- filter by date
- no dummy order number anywhere

## 6. Production safety checklist

- [ ] Order numbers come directly from the database
- [ ] No hardcoded `ORD-001`, `TEST-*`, or `DEMO-*` values are displayed
- [ ] Delivery boy grouping is by `delivery_boy_id`, not name
- [ ] Pickup/service orders are excluded from COD reconciliation
- [ ] COD due is derived from `Order.totalAmount - Order.advancePaidAmount`
- [ ] Difference is always calculated as expected minus collected
- [ ] Reconciliation status and collection status are kept separate
- [ ] Any duplicate or placeholder records are excluded from production screens
- [ ] Audit trail records old/new values and timestamps
