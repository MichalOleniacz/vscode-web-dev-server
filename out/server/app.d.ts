import * as Koa from "koa";
import { IConfig } from "./main";
export default function createApp(config: IConfig): Promise<Koa>;
