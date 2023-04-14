import axios from "axios";
declare module "axios" {
  interface AxiosRequestConfig {
    isLoading?: boolean;
    isCancel?: boolean;
  }
}
