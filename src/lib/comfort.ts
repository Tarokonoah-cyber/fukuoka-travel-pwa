import type { TripDay, TimelineItem } from "@/types/trip";
import type { ComfortDecision, ComfortReport } from "@/types/comfort";
import type { DailyWeather } from "@/types/weather";

const decisionLabels: Record<ComfortDecision, string> = {
  go_as_planned: "照原行程",
  slow_down: "放慢節奏",
  switch_to_indoor: "改室內優先",
  shorten_day: "縮短行程",
  rest_first: "先休息",
};

function isHighWalking(level: string) {
  return level.includes("高") || level.toLowerCase().includes("high");
}

function isMediumWalking(level: string) {
  return level.includes("中") || level.toLowerCase().includes("medium");
}

function itemText(item: TimelineItem) {
  return `${item.title} ${item.location} ${item.note} ${item.type}`;
}

function hasAnyText(day: TripDay, patterns: string[]) {
  const dayText = `${day.title} ${day.highlight} ${day.rainPlan} ${day.momFriendlyNote} ${day.items.map(itemText).join(" ")}`;
  return patterns.some((pattern) => dayText.toLowerCase().includes(pattern.toLowerCase()));
}

function getWeatherFlags(weather?: DailyWeather) {
  const rainHigh = typeof weather?.precipitationProbability === "number" && weather.precipitationProbability >= 50;
  const rainMedium = typeof weather?.precipitationProbability === "number" && weather.precipitationProbability >= 30;
  const hot =
    typeof weather?.maxApparentTemperature === "number" && weather.maxApparentTemperature >= 33 ||
    typeof weather?.maxTemperature === "number" && weather.maxTemperature >= 31;

  return { rainHigh, rainMedium, hot };
}

export function getComfortDecisionLabel(decision: ComfortDecision) {
  return decisionLabels[decision];
}

export function buildComfortReport(day: TripDay, weather?: DailyWeather, weatherStale = false): ComfortReport {
  const walkingLevel = String(day.walkingLevel);
  const highWalking = isHighWalking(walkingLevel);
  const mediumWalking = isMediumWalking(walkingLevel);
  const lowIndoor = day.indoorRatio < 55;
  const indoorFriendly = day.indoorRatio >= 70;
  const hasShopping = hasAnyText(day, ["購物", "百貨", "地下街", "藥妝", "shopping", "mall"]);
  const hasBaseball = hasAnyText(day, ["棒球", "PayPay", "Dome", "球場"]);
  const hasLongMove = hasAnyText(day, ["機場", "移動", "退房", "行李", "長距離"]);
  const hasHotelRest = hasAnyText(day, ["飯店", "hotel", "Croom"]);
  const { rainHigh, rainMedium, hot } = getWeatherFlags(weather);

  let decision: ComfortDecision = "go_as_planned";
  let reason = "今天的步行量與室內比例看起來可控，照原行程走即可。";

  if (rainHigh && lowIndoor) {
    decision = "switch_to_indoor";
    reason = "降雨機率偏高，而且今日室內比例較低，建議把戶外段落換成雨天備案。";
  } else if (rainHigh || (rainMedium && indoorFriendly)) {
    decision = "switch_to_indoor";
    reason = "天氣可能不穩，今天優先走百貨、地下街與室內休息點會比較安心。";
  } else if ((hasBaseball || hasLongMove) && (highWalking || hot)) {
    decision = "shorten_day";
    reason = "今天已有球賽或長距離移動，再加上步行/高溫壓力，建議縮短其他行程。";
  } else if (hot || highWalking || mediumWalking) {
    decision = "slow_down";
    reason = hot ? "體感溫度可能偏高，建議放慢節奏並增加室內休息。" : "今天步行量不低，建議保留咖啡或百貨休息時間。";
  } else if (!day.restStops.length) {
    decision = "rest_first";
    reason = "今日休息點資料不足，出門前先確認可坐下、可上廁所的地點。";
  }

  const riskTips = new Set<string>();
  if (weather) {
    if (rainHigh || rainMedium) riskTips.add("午後可能下雨，雨傘放外層。");
    if (hot) riskTips.add("高溫時不要連續走太久，先找百貨或咖啡休息。");
  } else {
    riskTips.add("目前沒有旅行日天氣資料，先依雨天備案與室內比例判斷。");
  }
  if (highWalking || mediumWalking) riskTips.add("今天步行量不低，建議安排咖啡休息。");
  if (hasBaseball) riskTips.add("球賽日不要把下午排太滿。");
  if (hasShopping) riskTips.add("購物日可以優先走地下街與百貨。");
  if (hasLongMove) riskTips.add("移動日先顧好行李與座位休息。");

  const adjustments = new Set<string>();
  if (decision === "go_as_planned") adjustments.add("照原行程走，保留休息點作為彈性調整。");
  if (decision === "slow_down") adjustments.add("減少一個可有可無的景點，午後優先室內。");
  if (decision === "switch_to_indoor") adjustments.add("把戶外景點換成雨天備案，優先百貨、地下街或美術館。");
  if (decision === "shorten_day") adjustments.add("縮短上午或下午其中一段，保留體力給主要行程。");
  if (decision === "rest_first") adjustments.add("先確認飯店、車站、百貨或咖啡店休息點，再出發。");
  if (hasBaseball) adjustments.add("比賽日前不要排太滿，提早到球場周邊比較從容。");
  if (hasHotelRest) adjustments.add("需要時直接回飯店休息，不必硬走完所有點。");

  return {
    decision,
    label: decisionLabels[decision],
    reason,
    signals: [
      { label: "步行量", value: walkingLevel, tone: highWalking ? "warm" : "plain" },
      { label: "室內比例", value: `${day.indoorRatio}%`, tone: indoorFriendly ? "blue" : lowIndoor ? "warm" : "plain" },
      {
        label: "降雨提示",
        value: weather ? `${weather.precipitationProbability}%` : "無旅行日預報",
        tone: rainHigh || !weather ? "warm" : "plain",
      },
      {
        label: "高溫提示",
        value: weather ? `${Math.round(weather.maxTemperature)}°C / 體感 ${Math.round(weather.maxApparentTemperature)}°C` : "待接近出發日確認",
        tone: hot ? "warm" : "plain",
      },
    ],
    riskTips: [...riskTips].slice(0, 4),
    adjustments: [...adjustments].slice(0, 5),
    momChecklist: [
      { label: "少走路", ok: !highWalking, note: highWalking ? "今天要主動刪減一段。" : "步行量可控，仍保留彈性。" },
      { label: "室內休息", ok: indoorFriendly || hasShopping, note: indoorFriendly ? "室內比例足夠。" : "建議補一個百貨或咖啡點。" },
      { label: "雨天備案", ok: Boolean(day.rainPlan), note: day.rainPlan || "待補雨天備案。" },
      { label: "避免樓梯", ok: true, note: "交通移動優先找電梯、電扶梯與地下街。" },
      { label: "不要太晚回飯店", ok: !hasBaseball, note: hasBaseball ? "球賽日回程會較晚，下午先休息。" : "晚間可彈性提早回飯店。" },
      { label: "廁所 / 咖啡休息", ok: day.restStops.length > 0, note: day.restStops.length ? day.restStops.join(" · ") : "待補休息點。" },
    ],
    rainNote: day.rainPlan,
    restStops: day.restStops.length ? day.restStops : ["待補休息點"],
    weatherAvailable: Boolean(weather),
    weatherStale,
  };
}
