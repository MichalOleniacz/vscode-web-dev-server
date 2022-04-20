import { Static } from './main';
export declare function downloadAndUnzipVSCode(quality: 'stable' | 'insider'): Promise<Static>;
export declare function fetch(api: string): Promise<string>;
export declare function fetchJSON<T>(api: string): Promise<T>;
export declare function directoryExists(path: string): Promise<boolean>;
export declare function fileExists(path: string): Promise<boolean>;
