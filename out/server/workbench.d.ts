/// <reference types="koa__router" />
import * as Router from "@koa/router";
import { IConfig } from "./main";
export default function (config: IConfig): Router.Middleware;
