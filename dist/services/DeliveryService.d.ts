import { DeliveryMethod } from '../types/index.js';
import type { DeliveryRecord } from '../types/index.js';
export declare class DeliveryService {
    createDelivery(clipId: string, userId: string, recipientId: string, method: DeliveryMethod): Promise<DeliveryRecord>;
    deliverClip(clipId: string, userId: string): Promise<boolean>;
    private formatClipMessage;
    getDeliveryHistory(userId: string, limit?: number): Promise<DeliveryRecord[]>;
    getDeliveryById(id: string): Promise<DeliveryRecord | null>;
}
export declare const deliveryService: DeliveryService;
//# sourceMappingURL=DeliveryService.d.ts.map