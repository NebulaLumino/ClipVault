export interface AllstarClip {
    id: string;
    status: string;
    title?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    duration?: number;
    createdAt: string;
}
export interface AllstarCreateClipResponse {
    id: string;
    status: string;
}
export interface AllstarGetClipsResponse {
    clips: AllstarClip[];
    total: number;
}
export declare class AllstarError extends Error {
    code?: string | undefined;
    statusCode?: number | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number | undefined);
}
export declare class AllstarClient {
    private readonly baseUrl;
    private readonly apiKey;
    constructor();
    private getHeaders;
    createClip(platformMatchId: string, platform: string, gameTitle: string, clipType: string): Promise<AllstarCreateClipResponse>;
    getClip(clipId: string): Promise<AllstarClip | null>;
    getClips(limit?: number, status?: string): Promise<AllstarGetClipsResponse>;
}
export declare const allstarClient: AllstarClient;
//# sourceMappingURL=AllstarClient.d.ts.map