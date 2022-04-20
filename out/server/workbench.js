"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs_1 = require("fs");
const vscode_uri_1 = require("vscode-uri");
const Router = require("@koa/router");
const extensions_1 = require("./extensions");
const download_1 = require("./download");
const mounts_1 = require("./mounts");
function asJSON(value) {
    return JSON.stringify(value).replace(/"/g, "&quot;");
}
class Workbench {
    constructor(baseUrl, dev, builtInExtensions = []) {
        this.baseUrl = baseUrl;
        this.dev = dev;
        this.builtInExtensions = builtInExtensions;
    }
    async render(workbenchWebConfiguration) {
        const values = {
            WORKBENCH_WEB_CONFIGURATION: asJSON(workbenchWebConfiguration),
            WORKBENCH_AUTH_SESSION: "",
            WORKBENCH_WEB_BASE_URL: this.baseUrl,
            WORKBENCH_BUILTIN_EXTENSIONS: asJSON(this.builtInExtensions),
            WORKBENCH_MAIN: this.getMain(),
        };
        try {
            const workbenchTemplate = (await fs_1.promises.readFile(path.resolve(__dirname, "../../../index.html"))).toString();
            return workbenchTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => { var _a; return (_a = values[key]) !== null && _a !== void 0 ? _a : "undefined"; });
        }
        catch (e) {
            return String(e);
        }
    }
    getMain() {
        return this.dev
            ? `<script> require(['vs/code/browser/workbench/workbench'], function() {}); </script>`
            : `<script src="${this.baseUrl}/out/vs/workbench/workbench.web.main.nls.js"></script>` +
                `<script src="${this.baseUrl}/out/vs/workbench/workbench.web.main.js"></script>` +
                `<script src="${this.baseUrl}/out/vs/code/browser/workbench/workbench.js"></script>`;
    }
    async renderCallback() {
        return await (0, download_1.fetch)(`${this.baseUrl}/out/vs/code/browser/workbench/callback.html`);
    }
}
async function getWorkbenchOptions(ctx, config) {
    const options = {};
    if (config.extensionPaths) {
        const extensionPromises = config.extensionPaths.map((extensionPath, index) => {
            return (0, extensions_1.scanForExtensions)(extensionPath, {
                scheme: ctx.protocol,
                authority: ctx.host,
                path: `/static/extensions/${index}`,
            });
        });
        options.additionalBuiltinExtensions = (await Promise.all(extensionPromises)).flat();
    }
    if (config.extensionIds) {
        if (!options.additionalBuiltinExtensions) {
            options.additionalBuiltinExtensions = [];
        }
        options.additionalBuiltinExtensions.push(...config.extensionIds);
    }
    if (config.extensionDevelopmentPath) {
        const developmentOptions = (options.developmentOptions = {});
        developmentOptions.extensions = await (0, extensions_1.scanForExtensions)(config.extensionDevelopmentPath, {
            scheme: ctx.protocol,
            authority: ctx.host,
            path: "/static/devextensions",
        });
        if (config.extensionTestsPath) {
            let relativePath = path.relative(config.extensionDevelopmentPath, config.extensionTestsPath);
            if (process.platform === "win32") {
                relativePath = relativePath.replace(/\\/g, "/");
            }
            developmentOptions.extensionTestsPath = {
                scheme: ctx.protocol,
                authority: ctx.host,
                path: path.posix.join("/static/devextensions", relativePath),
            };
        }
    }
    if (config.folderMountPath) {
        if (!options.additionalBuiltinExtensions) {
            options.additionalBuiltinExtensions = [];
        }
        options.additionalBuiltinExtensions.push({
            scheme: ctx.protocol,
            authority: ctx.host,
            path: mounts_1.fsProviderExtensionPrefix,
        });
        options.folderUri = vscode_uri_1.URI.parse(mounts_1.fsProviderFolderUri);
    }
    else if (config.folderUri) {
        options.folderUri = vscode_uri_1.URI.parse(config.folderUri);
    }
    else {
        options.workspaceUri = vscode_uri_1.URI.from({
            scheme: "tmp",
            path: `/default.code-workspace`,
        });
    }
    options.productConfiguration = { enableTelemetry: false };
    return options;
}
function default_1(config) {
    const router = new Router();
    router.use(async (ctx, next) => {
        if (config.build.type === "sources") {
            const builtInExtensions = await (0, extensions_1.getScannedBuiltinExtensions)(config.build.location);
            ctx.state.workbench = new Workbench(`${ctx.protocol}://${ctx.host}/static/sources`, true, builtInExtensions);
        }
        else if (config.build.type === "static") {
            ctx.state.workbench = new Workbench(`${ctx.protocol}://${ctx.host}/static/build`, false);
        }
        else if (config.build.type === "cdn") {
            ctx.state.workbench = new Workbench(config.build.uri, false);
        }
        await next();
    });
    router.get("/callback", async (ctx) => {
        ctx.body = await ctx.state.workbench.renderCallback();
    });
    router.get("/", async (ctx) => {
        const options = await getWorkbenchOptions(ctx, config);
        ctx.body = await ctx.state.workbench.render(options);
    });
    return router.routes();
}
exports.default = default_1;