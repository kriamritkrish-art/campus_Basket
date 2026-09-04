export interface AuditLogParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Dispatches an audit event to the database
   */
  public static async log(prisma: any, params: AuditLogParams): Promise<void> {
    try {
      if (prisma && prisma.auditLog) {
        await prisma.auditLog.create({
          data: {
            userId: params.userId || null,
            action: params.action,
            entity: params.entity,
            entityId: params.entityId || null,
            oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
            newValue: params.newValue ? JSON.stringify(params.newValue) : null,
            ipAddress: params.ipAddress || null,
            userAgent: params.userAgent || null
          }
        });
      }
    } catch (err) {
      console.warn('[AuditService] Failed to record audit log:', err);
    }
  }
}
