import Axios from "axios";

export const api = Axios.create({
  baseURL: "http://" + location.host + "/api",
});
