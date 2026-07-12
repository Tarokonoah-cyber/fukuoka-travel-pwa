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

export type WeatherData = {
  current: CurrentWeather;
  daily: DailyWeather[];
  updatedAt: string;
  stale: boolean;
};

export type WeatherState =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: WeatherData; error: null }
  | { status: "error"; data: null; error: string };
