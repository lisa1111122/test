import { RouteRecordRaw } from "vue-router";

export interface metaItem {
  title?: string;
  roles?: Array<string>;
  path?: string;
}

interface RouterItem {
  hidden?: boolean;
  meta?: metaItem;
  children?: RouterType;
}

type RouterRaw = RouterItem & RouteRecordRaw;
export type RouterType = Array<RouterRaw>;
