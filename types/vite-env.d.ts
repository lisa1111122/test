/// <reference types="vite/client" />
//解决.vue文件找不到对应模块的问题
declare module "*.vue" {
  import { ComponentOptions } from "vue";
  const componentOptions: ComponentOptions;
  export default componentOptions;
}
//解决无法找到模块“element-plus/dist/locale/zh-cn.mjs”的声明文件
declare module "element-plus/dist/locale/zh-cn.mjs";
//无法找到模块“nprogress”的声明文件
declare module "nprogress";
