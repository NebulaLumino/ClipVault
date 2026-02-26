import { Queue } from 'bullmq';
export declare const QUEUES: {
    readonly MATCH_POLL: "match-poll";
    readonly CLIP_REQUEST: "clip-request";
    readonly CLIP_MONITOR: "clip-monitor";
    readonly CLIP_DELIVERY: "clip-delivery";
};
export declare const matchPollQueue: Queue<any, any, string, any, any, string>;
export declare const clipRequestQueue: Queue<any, any, string, any, any, string>;
export declare const clipMonitorQueue: Queue<any, any, string, any, any, string>;
export declare const clipDeliveryQueue: Queue<any, any, string, any, any, string>;
export declare function closeQueues(): Promise<void>;
export declare function checkQueueHealth(): Promise<Record<string, unknown>>;
//# sourceMappingURL=queue.d.ts.map