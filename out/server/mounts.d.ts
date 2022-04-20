import { IConfig } from "./main";
import * as Koa from 'koa';
export declare const fsProviderExtensionPrefix = "/static/extensions/fs";
export declare const fsProviderFolderUri = "vscode-test-web://mount/";
export declare function configureMounts(config: IConfig, app: Koa): void;
