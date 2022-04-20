"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const Koa = require("koa");
const morgan = require("koa-morgan");
const kstatic = require("koa-static");
const kmount = require("koa-mount");
const cors = require("@koa/cors");
const path_1 = require("path");
const workbench_1 = require("./workbench");
const mounts_1 = require("./mounts");
const extensions_1 = require("./extensions");
async function createApp(config) {
    const app = new Koa();
    app.use(morgan("dev", {
        skip: (req, res) => res.statusCode >= 200 && res.statusCode < 300,
    }));
    // CORS
    app.use(cors({
        allowMethods: ["GET"],
        credentials: true,
        origin: (ctx) => {
            if (/^https:\/\/[^.]+\.vscode-webview\.net$/.test(ctx.get("Origin"))) {
                return ctx.get("Origin");
            }
            return undefined;
        },
    }));
    // this is here such that the iframe worker can fetch the extension files
    app.use((ctx, next) => {
        ctx.set("Access-Control-Allow-Origin", "*");
        return next();
    });
    const serveOptions = { hidden: true };
    if (config.extensionDevelopmentPath) {
        console.log("Serving dev extensions from " + config.extensionDevelopmentPath);
        app.use(kmount("/static/devextensions", kstatic(config.extensionDevelopmentPath, serveOptions)));
    }
    if (config.build.type === "static") {
        app.use(kmount("/static/build", kstatic(config.build.location, serveOptions)));
    }
    else if (config.build.type === "sources") {
        console.log("Serving VS Code sources from " + config.build.location);
        app.use(kmount("/static/sources", kstatic(config.build.location, serveOptions)));
        app.use(kmount("/static/sources", kstatic((0, path_1.join)(config.build.location, "resources", "server"), serveOptions))); // for manifest.json, favicon and code icons.
        app.use(kmount("/static/sources", kstatic((0, path_1.join)(config.build.location, "remote"), serveOptions))); // for manifest.json, favicon and code icons.
        // built-in extension are at 'extensions` as well as prebuilt extensions dowloaded from the marketplace
        app.use(kmount(`/static/sources/extensions`, kstatic((0, path_1.join)(config.build.location, extensions_1.prebuiltExtensionsLocation), serveOptions)));
    }
    (0, mounts_1.configureMounts)(config, app);
    if (config.extensionPaths) {
        config.extensionPaths.forEach((extensionPath, index) => {
            console.log("Serving additional built-in extensions from " + extensionPath);
            app.use(kmount(`/static/extensions/${index}`, kstatic(extensionPath, serveOptions)));
        });
    }
    app.use((0, workbench_1.default)(config));
    return app;
}
exports.default = createApp;
