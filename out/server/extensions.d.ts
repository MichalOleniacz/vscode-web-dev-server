export interface URIComponents {
    scheme: string;
    authority: string;
    path: string;
}
export declare function scanForExtensions(rootPath: string, serverURI: URIComponents): Promise<URIComponents[]>;
/** running from VS Code sources */
export interface IScannedBuiltinExtension {
    extensionPath: string;
    packageJSON: any;
    packageNLS?: any;
    readmePath?: string;
    changelogPath?: string;
}
export declare const prebuiltExtensionsLocation = ".build/builtInExtensions";
export declare function getScannedBuiltinExtensions(vsCodeDevLocation: string): Promise<IScannedBuiltinExtension[]>;
