import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return {
  name:"福岡 8/2–8/6 旅行手冊",short_name:"福岡旅行",description:"福岡五天四夜手機旅行手冊",start_url:"/",display:"standalone",orientation:"portrait",
  background_color:"#f4efe5",theme_color:"#f4efe5",lang:"zh-Hant",icons:[{src:"/favicon.ico",sizes:"any",type:"image/x-icon"}],
}}
