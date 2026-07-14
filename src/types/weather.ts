export type DailyWeather = {
  date: string;
  weatherCode: number;
  maxTemperature: number;
  minTemperature: number;
  maxApparentTemperature: number;
  precipitationProbability: number;
  maxWindSpeed: number;
};

export type CurrentWeather = {
  time: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
};

export type TripWeatherEstimate = {
  date: string;
  maxTemperature: number;
  minTemperature: number;
  apparentTemperature?: number;
  maxTemperatureRange: [number, number];
  rainyMemberPercent: number | null;
  source: "ecmwf-ec46" | "jma-normal";
};

export type WeatherData = {
  current: CurrentWeather;
  daily: DailyWeather[];
  tripEstimates: TripWeatherEstimate[];
  updatedAt: string;
  stale: boolean;
};

export type WeatherState =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: WeatherData; error: null }
  | { status: "error"; data: null; error: string };
