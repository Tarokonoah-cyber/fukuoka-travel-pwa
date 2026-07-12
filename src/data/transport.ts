import type { TransportRoute } from "@/types/trip";
export const transportRoutes: TransportRoute[]=[
  {id:"airport-hotel",from:"福岡機場",to:"Nishitetsu Croom Hakata",method:"地鐵＋步行／計程車",duration:"約 20–35 分",transfer:"國際線先搭接駁車到國內線地鐵站；行李多可直接搭計程車。",note:"博多站筑紫口方向較接近飯店。",momFriendlyNote:"抵達日以計程車為優先備案。"},
  {id:"hotel-dome",from:"Nishitetsu Croom Hakata",to:"PayPay Dome",method:"地鐵空港線＋步行／計程車",duration:"約 35–50 分",transfer:"博多站到唐人町站，再步行約 15–20 分。",note:"比賽日散場人潮多，回程多留時間。",momFriendlyNote:"唐人町站至球場可搭計程車縮短步行。"},
  {id:"hakata-tenjin",from:"博多",to:"天神",method:"地鐵空港線",duration:"約 6 分",transfer:"無需轉乘。",note:"天神站地下空間大，先確認出口編號。",momFriendlyNote:"利用地下街與百貨電梯移動。"},
  {id:"subway",from:"福岡市內",to:"地鐵沿線",method:"地鐵",duration:"依路線",transfer:"進站前確認方向與目的站。",note:"可使用交通 IC 卡，避免每次買票。",momFriendlyNote:"避開早晚通勤尖峰，優先找電梯。"},
  {id:"bus",from:"市區各站",to:"景點周邊",method:"西鐵巴士",duration:"依路況",transfer:"上車前確認號碼與目的地。",note:"尖峰可能塞車，時間勿排太緊。",momFriendlyNote:"沒有座位時改等下一班或搭計程車。"},
  {id:"taxi",from:"飯店／車站",to:"短程目的地",method:"計程車",duration:"依路況",transfer:"請準備目的地日文名稱或地址。",note:"雨天、炎熱或攜帶行李時使用。",momFriendlyNote:"兩人同行時是保留體力的實用選項。"},
  {id:"mom",from:"每日出發點",to:"當日行程",method:"少轉乘優先",duration:"多留 15 分",transfer:"同一路線可選電梯出口，不追車。",note:"上午戶外、下午室內；每段交通後安排休息。",momFriendlyNote:"累了就刪減行程，不必勉強走完。"},
];
