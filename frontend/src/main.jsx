import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Check,
  ChevronRight,
  CloudRain,
  Droplets,
  History,
  Info,
  Layers,
  LocateFixed,
  Map,
  MapPin,
  RefreshCw,
  Route,
  Shield,
  ShieldCheck,
  Shirt,
  Sun,
  ThermometerSun,
  Trash2,
  Wind,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const DEFAULT_COORDINATES = {
  latitude: 14.722286,
  longitude: 101.335076,
};

const WBGT_API_BASE_URL = (import.meta.env.VITE_WBGT_API_BASE_URL ?? "https://wbgt-app-49xb.onrender.com").replace(/\/$/, "");
const HISTORY_STORAGE_KEY = "wbgt-risk-history";
const LANGUAGE_STORAGE_KEY = "wbgt-ui-language";
const MAX_HISTORY_ITEMS = 20;

const translations = {
  th: {
    appTitle: "ประเมินความเสี่ยงจากความร้อนกลางแจ้ง",
    aboutLabel: "เกี่ยวกับแอป",
    aboutText: "ระบบช่วยประเมินความเสี่ยงจากความร้อนกลางแจ้ง โดยใช้ข้อมูลสภาพอากาศตามตำแหน่งและเวลาที่เลือก",
    setupEyebrow: "ตั้งค่าการประเมิน",
    setupTitle: "เลือกพื้นที่และกิจกรรม",
    fillInfo: "กรอกข้อมูล",
    evaluating: "กำลังประเมิน",
    evaluated: "ประเมินเสร็จแล้ว",
    evaluationFailed: "ประเมินไม่สำเร็จ",
    evaluationError: "ไม่สามารถประเมินผลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    location: "เลือกพื้นที่",
    useCurrentLocation: "ใช้ตำแหน่งปัจจุบัน",
    chooseOnMap: "เลือกบนแผนที่",
    currentLocation: "ตำแหน่งปัจจุบัน",
    gpsReady: "ใช้พิกัด GPS ปัจจุบัน",
    gpsPrompt: "กดเพื่อขออนุญาตใช้ GPS จากเบราว์เซอร์",
    currentCoordinates: "พิกัดปัจจุบัน",
    gpsAccuracy: "ความแม่นยำ GPS ประมาณ",
    gpsIdle: "ระบบจะใช้ตำแหน่งจากอุปกรณ์เพื่อแสดงข้อมูลอากาศและประเมินความเสี่ยง",
    gpsLoading: "กำลังขอตำแหน่งจากอุปกรณ์...",
    updateGps: "อัปเดต GPS",
    useGpsNow: "ใช้ GPS ตอนนี้",
    mapHint: "แตะบนแผนที่เพื่อเลือกตำแหน่ง ระบบจะอัปเดตข้อมูลอากาศตามพิกัดนี้ทันที",
    dateTime: "วันและเวลา",
    bangkokTime: "เวลา Asia/Bangkok",
    weather: "ข้อมูลสภาพอากาศ",
    selectedCoordinates: "พิกัดที่เลือก",
    gpsCoordinates: "ตำแหน่ง GPS ปัจจุบัน",
    waitingCoordinates: "รอพิกัด",
    weatherForLocation: "ข้อมูลอากาศตามตำแหน่งที่เลือก",
    atTime: "เวลา",
    preparingData: "กำลังเตรียมข้อมูล",
    dataReady: "ข้อมูลพร้อม",
    noData: "ไม่พบข้อมูล",
    waitingArea: "รอพื้นที่",
    preparingWeather: "กำลังเตรียมข้อมูลสภาพอากาศ...",
    clothingType: "ประเภทเสื้อผ้า",
    cafInfoLabel: "ข้อมูล CAF",
    cafInfo: "CAF ใช้ปรับค่า WBGT ตามผลของเสื้อผ้าต่อการระบายความร้อนของร่างกาย",
    activityLevel: "ระดับกิจกรรม",
    evaluateButton: "ดูผลการประเมิน",
    waitWeather: "รอข้อมูลสภาพอากาศ",
    noResult: "ยังไม่มีผลการประเมิน",
    noResultHelp: "เลือกพื้นที่ วันเวลา ประเภทเสื้อผ้า และระดับกิจกรรม จากนั้นกด “ดูผลการประเมิน” เพื่อให้ระบบประมวลผล",
    summary: "สรุป",
    chart: "กราฟ",
    advice: "คำแนะนำ",
    overallRisk: "ระดับความเสี่ยงโดยรวม",
    low: "ต่ำ",
    moderate: "ปานกลาง",
    high: "สูง",
    veryHigh: "สูงมาก",
    model: "โมเดล",
    clothingCaf: "WBGT + CAF เสื้อผ้า",
    feelsLike: "อุณหภูมิที่รู้สึก",
    compareIndexes: "เปรียบเทียบค่าดัชนี",
    value: "ค่า",
    todayTrend: "แนวโน้มวันนี้",
    today: "วันนี้",
    trendLoading: "กำลังคำนวณแนวโน้มจริง",
    trendUnavailable: "ไม่สามารถแสดงแนวโน้มรายชั่วโมงได้ในขณะนี้",
    safetyAdvice: "คำแนะนำเพื่อความปลอดภัย",
    basedOnRisk: "อ้างอิงระดับความเสี่ยง",
    details: "ดูรายละเอียดเพิ่มเติม",
    historyLocal: "ประวัติในเครื่องนี้",
    historyTitle: "ประวัติการประเมิน",
    clear: "ล้าง",
    noHistory: "ยังไม่มีประวัติ",
    noHistoryHelp: "เมื่อกดดูผลการประเมิน ระบบจะบันทึกผลล่าสุดไว้ในอุปกรณ์นี้ด้วย localStorage",
    assess: "ประเมิน",
    history: "ประวัติ",
    footerOrg: "เครือข่ายวิจัยระบบประเมินความเสี่ยงจากความร้อน",
    footerContact: "ติดต่อทีมวิจัย: heat-risk@example.org",
    gpsSource: "GPS ปัจจุบัน",
    mapSource: "เลือกบนแผนที่",
    weatherError: "ไม่สามารถเตรียมข้อมูลสภาพอากาศได้",
  },
  en: {
    appTitle: "Outdoor Heat Risk Assessment",
    aboutLabel: "About",
    aboutText: "This tool estimates outdoor heat risk using weather data for the selected location and time.",
    setupEyebrow: "Assessment Setup",
    setupTitle: "Select Location and Activity",
    fillInfo: "Enter details",
    evaluating: "Evaluating",
    evaluated: "Assessment complete",
    evaluationFailed: "Assessment failed",
    evaluationError: "Unable to complete the assessment right now. Please try again.",
    location: "Location",
    useCurrentLocation: "Use current location",
    chooseOnMap: "Choose on map",
    currentLocation: "Current location",
    gpsReady: "Using current GPS coordinates",
    gpsPrompt: "Tap to allow browser GPS access",
    currentCoordinates: "Current coordinates",
    gpsAccuracy: "Estimated GPS accuracy",
    gpsIdle: "Your device location will be used to show weather data and estimate risk.",
    gpsLoading: "Requesting device location...",
    updateGps: "Update GPS",
    useGpsNow: "Use GPS now",
    mapHint: "Tap the map to choose a location. Weather data will update for this coordinate.",
    dateTime: "Date and Time",
    bangkokTime: "Asia/Bangkok time",
    weather: "Weather Data",
    selectedCoordinates: "Selected coordinates",
    gpsCoordinates: "Current GPS location",
    waitingCoordinates: "Waiting for coordinates",
    weatherForLocation: "Weather data for selected location",
    atTime: "Time",
    preparingData: "Preparing data",
    dataReady: "Data ready",
    noData: "No data",
    waitingArea: "Waiting for location",
    preparingWeather: "Preparing weather data...",
    clothingType: "Clothing Type",
    cafInfoLabel: "CAF information",
    cafInfo: "CAF adjusts WBGT based on how clothing affects body heat dissipation.",
    activityLevel: "Activity Level",
    evaluateButton: "View Assessment",
    waitWeather: "Waiting for weather data",
    noResult: "No assessment yet",
    noResultHelp: "Select location, date/time, clothing type, and activity level, then tap “View Assessment”.",
    summary: "Summary",
    chart: "Chart",
    advice: "Advice",
    overallRisk: "Overall Risk Level",
    low: "Low",
    moderate: "Moderate",
    high: "High",
    veryHigh: "Very High",
    model: "Model",
    clothingCaf: "WBGT + clothing CAF",
    feelsLike: "Feels-like temperature",
    compareIndexes: "Index Comparison",
    value: "Value",
    todayTrend: "Today Trend",
    today: "Today",
    trendLoading: "Calculating real trend",
    trendUnavailable: "Hourly trend is not available right now.",
    safetyAdvice: "Safety Advice",
    basedOnRisk: "Based on risk level",
    details: "View more details",
    historyLocal: "Local history",
    historyTitle: "Assessment History",
    clear: "Clear",
    noHistory: "No history yet",
    noHistoryHelp: "After an assessment, the latest result will be saved on this device with localStorage.",
    assess: "Assess",
    history: "History",
    footerOrg: "Heat Risk Assessment Research Network",
    footerContact: "Contact: heat-risk@example.org",
    gpsSource: "Current GPS",
    mapSource: "Selected on map",
    weatherError: "Unable to prepare weather data.",
  },
};

const MAP_MARKER_ICON = L.divIcon({
  className: "map-pin-marker",
  html: "<span></span>",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const clothingOptions = [
  {
    id: "light_clothing",
    label: "เสื้อผ้าเบา",
    labelEn: "Light Clothing",
    example: "เสื้อยืด กางเกงขาสั้น",
    exampleEn: "T-shirt, shorts",
    caf: 0,
    icon: Shirt,
  },
  {
    id: "long_thick",
    label: "แขนยาว/ผ้าหนา",
    labelEn: "Long Sleeve / Thick Clothing",
    example: "เสื้อแขนยาว กางเกงขายาว",
    exampleEn: "Long sleeves, long pants",
    caf: 1,
    icon: Layers,
  },
  {
    id: "work_coverall",
    label: "ชุดทำงาน/ชุดคลุม",
    labelEn: "Work Clothing / Coverall",
    example: "ยูนิฟอร์ม ชุดคลุมหลายชั้น",
    exampleEn: "Uniform, layered clothing",
    caf: 3,
    icon: ShieldCheck,
  },
  {
    id: "waterproof_chemical",
    label: "กันน้ำ/กันสารเคมี",
    labelEn: "Waterproof / Chemical Protective",
    example: "เสื้อกันฝน ชุดไม่ระบายอากาศ",
    exampleEn: "Raincoat, impermeable suit",
    caf: 6,
    icon: CloudRain,
  },
  {
    id: "full_ppe",
    label: "PPE เต็มชุด",
    labelEn: "Full PPE",
    example: "อุปกรณ์ป้องกันเต็มรูปแบบ",
    exampleEn: "Full protective gear",
    caf: 8,
    icon: Shield,
  },
];

const activityOptions = [
  {
    id: "light",
    label: "กิจกรรมเบา",
    labelEn: "Light",
    modifier: 0,
    icon: Route,
    description: "เดินช้า งานตรวจพื้นที่ งานใช้แรงน้อย หรือกิจกรรมที่หยุดพักได้บ่อย",
    descriptionEn: "Slow walking, inspection work, low-effort tasks, or activities with frequent breaks.",
  },
  {
    id: "moderate",
    label: "ปานกลาง",
    labelEn: "Moderate",
    modifier: 1,
    icon: Activity,
    description: "เดินต่อเนื่อง ยกของเบา ทำสวน งานภาคสนามทั่วไป หรือออกกำลังกายระดับกลาง",
    descriptionEn: "Continuous walking, light lifting, gardening, field work, or moderate exercise.",
  },
  {
    id: "heavy",
    label: "หนัก",
    labelEn: "Heavy",
    modifier: 2.2,
    icon: ThermometerSun,
    description: "วิ่ง งานก่อสร้างหนัก ขุด ยกของหนัก หรือกิจกรรมที่ใช้แรงต่อเนื่อง",
    descriptionEn: "Running, heavy construction work, digging, heavy lifting, or continuous strenuous activity.",
  },
];

const weatherMetrics = [
  {
    key: "temperature",
    label: "อุณหภูมิ",
    labelEn: "Temperature",
    parameter: "Temperature_2m",
    description: "อุณหภูมิอากาศที่ระดับ 2 เมตร หน่วยองศาเซลเซียส",
    descriptionEn: "Air temperature at 2 meters above ground in degrees Celsius.",
    icon: ThermometerSun,
    value: (weather) => `${weather.temp.toFixed(1)}°C`,
  },
  {
    key: "dewPoint",
    label: "จุดน้ำค้าง",
    labelEn: "Dew Point",
    parameter: "DewPoint_2m",
    description: "อุณหภูมิที่ไอน้ำเริ่มกลั่นตัว ช่วยสะท้อนความชื้นในอากาศ",
    descriptionEn: "The temperature where water vapor begins to condense, indicating air moisture.",
    icon: Droplets,
    value: (weather) => `${weather.dewPoint.toFixed(1)}°C`,
  },
  {
    key: "wetBulb",
    label: "อุณหภูมิกระเปาะเปียก",
    labelEn: "Wet-bulb Temperature",
    parameter: "WetBulb_2m",
    description: "อุณหภูมิที่รวมผลของความร้อนและความชื้น ใช้กับการประเมินภาระความร้อน",
    descriptionEn: "Temperature reflecting heat and humidity effects, used for heat stress assessment.",
    icon: Droplets,
    value: (weather) => `${weather.wetBulb.toFixed(1)}°C`,
  },
  {
    key: "diffuseRadiation",
    label: "รังสีกระจาย",
    labelEn: "Diffuse Radiation",
    parameter: "DiffuseRadiation",
    description: "พลังงานรังสีอาทิตย์แบบกระจายจากท้องฟ้า หน่วยวัตต์ต่อตารางเมตร",
    descriptionEn: "Diffuse solar radiation from the sky in watts per square meter.",
    icon: Sun,
    value: (weather) => `${Math.round(weather.diffuseRadiation)} W/m²`,
  },
  {
    key: "sunshineDuration",
    label: "ระยะเวลาแดดออก",
    labelEn: "Sunshine Duration",
    parameter: "SunshineDuration",
    description: "จำนวนวินาทีที่มีแสงแดดในชั่วโมงนั้น",
    descriptionEn: "Number of seconds with sunshine during the selected hour.",
    icon: Sun,
    value: (weather, language) => `${Math.round(weather.sunshineDuration)} ${language === "en" ? "sec" : "วิ"}`,
  },
  {
    key: "cloudCoverHigh",
    label: "เมฆชั้นสูง",
    labelEn: "High Cloud Cover",
    parameter: "CloudCoverHigh",
    description: "สัดส่วนเมฆชั้นสูง หน่วยเปอร์เซ็นต์ 0-100",
    descriptionEn: "Percentage of high cloud cover from 0 to 100.",
    icon: CloudRain,
    value: (weather) => `${Math.round(weather.cloudCoverHigh)}%`,
  },
];

const recommendations = {
  low: ["ดื่มน้ำสม่ำเสมอ", "สังเกตอาการผิดปกติเมื่อทำกิจกรรมต่อเนื่อง"],
  moderate: ["พักในร่มทุก 45-60 นาที", "เตรียมน้ำดื่มและลดกิจกรรมช่วงแดดจัด"],
  high: ["ลดความหนักของงาน", "พักในร่มทุก 30 นาที", "ติดตามอาการเวียนศีรษะ คลื่นไส้ หรือเป็นตะคริว"],
  veryHigh: ["หลีกเลี่ยงงานกลางแจ้งหากไม่จำเป็น", "จัดเวรพักและมีผู้ดูแลร่วม", "หยุดกิจกรรมทันทีหากมีอาการลมแดด"],
  extreme: ["งดกิจกรรมกลางแจ้งที่ไม่เร่งด่วน", "ต้องมีแผนฉุกเฉินและพื้นที่ทำความเย็น", "แจ้งหัวหน้างานหรือเจ้าหน้าที่หากมีอาการผิดปกติ"],
};

const recommendationsEn = {
  low: ["Drink water regularly.", "Watch for unusual symptoms during prolonged activity."],
  moderate: ["Rest in shade every 45-60 minutes.", "Prepare drinking water and reduce activity during peak sun."],
  high: ["Reduce work intensity.", "Rest in shade every 30 minutes.", "Watch for dizziness, nausea, or cramps."],
  veryHigh: ["Avoid outdoor work unless necessary.", "Set up rest rotations and buddy monitoring.", "Stop activity immediately if heat illness symptoms appear."],
  extreme: ["Cancel non-essential outdoor activity.", "Prepare an emergency plan and cooling area.", "Notify a supervisor or staff member if symptoms appear."],
};

const fallbackWeather = {
  temp: 35.6,
  humidity: 58,
  radiation: "รอข้อมูล",
  wind: 2.3,
  dewPoint: 25.2,
  wetBulb: 28.0,
  cloudCover: 0,
  cloudCoverHigh: 0,
  diffuseRadiation: 0,
  sunshineDuration: 0,
  source: "fallback",
};

function getDefaultBangkokDateTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

function getDatePart(datetimeLocal) {
  return datetimeLocal ? datetimeLocal.slice(0, 10) : "";
}

function getHourOfDay(datetimeLocal) {
  const hour = Number(datetimeLocal?.slice(11, 13));
  return Number.isFinite(hour) ? hour : new Date().getHours();
}

function heatIndexCelsius(tempC, humidity) {
  const tempF = tempC * 1.8 + 32;
  const hiF =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * humidity -
    0.22475541 * tempF * humidity -
    0.00683783 * tempF * tempF -
    0.05481717 * humidity * humidity +
    0.00122874 * tempF * tempF * humidity +
    0.00085282 * tempF * humidity * humidity -
    0.00000199 * tempF * tempF * humidity * humidity;
  return (hiF - 32) / 1.8;
}

function dewPointCelsius(tempC, humidity) {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
}

function wetBulbCelsius(tempC, humidity) {
  return (
    tempC * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
    Math.atan(tempC + humidity) -
    Math.atan(humidity - 1.676331) +
    0.00391838 * humidity ** 1.5 * Math.atan(0.023101 * humidity) -
    4.686035
  );
}

function classifyRisk(effectiveWbgt) {
  if (effectiveWbgt >= 38) {
    return { key: "extreme", label: "เสี่ยงสูงมาก", labelEn: "Extreme Risk", color: "#e62e42", pct: 98 };
  }
  if (effectiveWbgt >= 34) {
    return { key: "veryHigh", label: "เสี่ยงสูง", labelEn: "Very High Risk", color: "#f26b2f", pct: 78 };
  }
  if (effectiveWbgt >= 31) {
    return { key: "high", label: "สูง", labelEn: "High", color: "#f5ad24", pct: 58 };
  }
  if (effectiveWbgt >= 28) {
    return { key: "moderate", label: "ปานกลาง", labelEn: "Moderate", color: "#9ccf3b", pct: 37 };
  }
  return { key: "low", label: "ต่ำ", labelEn: "Low", color: "#28b95f", pct: 16 };
}

function findNearestHourlyIndex(times, datetimeLocal) {
  if (!Array.isArray(times) || times.length === 0 || !datetimeLocal) {
    return 0;
  }

  const target = new Date(datetimeLocal).getTime();
  let nearestIndex = 0;
  let nearestDiff = Infinity;

  times.forEach((time, index) => {
    const diff = Math.abs(new Date(time).getTime() - target);
    if (diff < nearestDiff) {
      nearestDiff = diff;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function weatherFromHourly(raw, hourlyIndex) {
  const current = raw.current ?? {};
  const hourly = raw.hourly ?? {};
  const temp = hourly.temperature_2m?.[hourlyIndex] ?? current.temperature_2m;
  const humidity = hourly.relative_humidity_2m?.[hourlyIndex] ?? current.relative_humidity_2m;
  const cloudCover = hourly.cloud_cover?.[hourlyIndex] ?? current.cloud_cover ?? 0;
  const cloudCoverHigh = hourly.cloud_cover_high?.[hourlyIndex] ?? cloudCover;
  const diffuseRadiation = hourly.diffuse_radiation?.[hourlyIndex] ?? 0;
  const sunshineDuration = hourly.sunshine_duration?.[hourlyIndex] ?? 0;
  const wind = hourly.wind_speed_10m?.[hourlyIndex] ?? current.wind_speed_10m ?? 0;
  const dewPoint = hourly.dew_point_2m?.[hourlyIndex] ?? dewPointCelsius(temp, humidity);
  const wetBulb = hourly.wet_bulb_temperature_2m?.[hourlyIndex] ?? wetBulbCelsius(temp, humidity);
  const apparentTemperature = hourly.apparent_temperature?.[hourlyIndex] ?? current.apparent_temperature ?? temp;

  return {
    temp,
    humidity,
    radiation: `${cloudCover}% cloud`,
    wind,
    dewPoint,
    wetBulb,
    feelsLike: apparentTemperature,
    pressure: current.surface_pressure ?? null,
    cloudCover,
    cloudCoverHigh,
    diffuseRadiation,
    sunshineDuration,
    description: "ข้อมูลพยากรณ์จาก Open-Meteo",
    icon: "",
    locationName: "",
    source: "Open-Meteo",
    fetchedAt: new Date().toISOString(),
    hourlyTime: hourly.time?.[hourlyIndex] ?? current.time ?? "",
  };
}

function normalizeOpenMeteo(raw, datetimeLocal) {
  const hourly = raw.hourly ?? {};
  const hourlyIndex = findNearestHourlyIndex(hourly.time, datetimeLocal);
  return weatherFromHourly(raw, hourlyIndex);
}

async function fetchOpenMeteo(lat, lon, datetimeLocal) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  const selectedDate = getDatePart(datetimeLocal);

  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "wind_speed_10m",
    "cloud_cover",
    "surface_pressure",
  ].join(","));
  url.searchParams.set("hourly", [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "dew_point_2m",
    "wet_bulb_temperature_2m",
    "wind_speed_10m",
    "cloud_cover",
    "cloud_cover_high",
    "diffuse_radiation",
    "sunshine_duration",
  ].join(","));
  url.searchParams.set("timezone", "Asia/Bangkok");
  if (selectedDate) {
    url.searchParams.set("start_date", selectedDate);
    url.searchParams.set("end_date", selectedDate);
  } else {
    url.searchParams.set("forecast_days", "3");
  }

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error("Unable to prepare weather data.");
  }

  return data;
}

function apiUrl(path) {
  return `${WBGT_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildModelFeatures(weather, hour, latitude, longitude) {
  return {
    Temperature_2m: weather.temp,
    DewPoint_2m: weather.dewPoint,
    WetBulb_2m: weather.wetBulb,
    DiffuseRadiation: weather.diffuseRadiation,
    SunshineDuration: weather.sunshineDuration,
    CloudCoverHigh: weather.cloudCoverHigh,
    hour_of_day: hour,
    latitude,
    longitude,
  };
}

async function predictWbgt(features) {
  const response = await fetch(apiUrl("/predict-wbgt"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features }),
  });

  if (!response.ok) {
    throw new Error("Prediction unavailable");
  }

  const data = await response.json();
  const wbgt = data?.data?.wbgt_c ?? data?.wbgt_c;

  if (!Number.isFinite(Number(wbgt))) {
    throw new Error("Invalid prediction");
  }

  return {
    wbgt: Number(wbgt),
    model: data?.data?.model ?? data?.model ?? null,
  };
}

async function buildRealTrendData({ rawWeather, date, latitude, longitude, caf }) {
  const hourly = rawWeather?.hourly ?? {};
  const hours = Array.from({ length: 13 }, (_, index) => index + 6);

  return Promise.all(
    hours.map(async (hour) => {
      const datetime = `${date}T${String(hour).padStart(2, "0")}:00`;
      const hourlyIndex = findNearestHourlyIndex(hourly.time, datetime);
      const weather = weatherFromHourly(rawWeather, hourlyIndex);
      const features = buildModelFeatures(weather, hour, latitude, longitude);
      const prediction = await predictWbgt(features);
      const wbgt = prediction.wbgt;
      const effectiveWbgt = wbgt + caf;

      return {
        time: `${String(hour).padStart(2, "0")}:00`,
        WBGT: Number(wbgt.toFixed(1)),
        "Effective WBGT": Number(effectiveWbgt.toFixed(1)),
        "Heat Index": Number(heatIndexCelsius(weather.temp, weather.humidity).toFixed(1)),
      };
    }),
  );
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function buildPrediction(form, backendWbgt, weatherInput) {
  const weather = weatherInput ?? fallbackWeather;
  const clothing = clothingOptions.find((item) => item.id === form.clothing) ?? clothingOptions[0];
  const activity = activityOptions.find((item) => item.id === form.activity) ?? activityOptions[1];
  const baseWbgt = backendWbgt ?? (weather.wetBulb * 0.72 + weather.temp * 0.2 + 6.4);
  const effectiveWbgt = baseWbgt + clothing.caf;
  const heatIndex = heatIndexCelsius(weather.temp, weather.humidity);
  const risk = classifyRisk(effectiveWbgt + activity.modifier);

  return {
    weather,
    clothing,
    activity,
    cafOutput: {
      clothing_type: clothing.id,
      caf: clothing.caf,
    },
    wbgt: baseWbgt,
    effectiveWbgt,
    heatIndex,
    risk,
    updatedAt: "25 เม.ย. 2567 13:00 น.",
  };
}

function loadHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
}

function loadLanguage() {
  if (typeof window === "undefined") {
    return "th";
  }

  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "th";
}

function saveLanguage(language) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
}

function formatDateTimeThai(datetimeLocal) {
  return datetimeLocal ? datetimeLocal.replace("T", " ") : "-";
}

function optionLabel(option, language) {
  return language === "en" ? option.labelEn : option.label;
}

function optionDescription(option, language) {
  return language === "en" ? option.descriptionEn : option.description;
}

function optionExample(option, language) {
  return language === "en" ? option.exampleEn : option.example;
}

function riskLabel(risk, language) {
  return language === "en" ? risk.labelEn : risk.label;
}

function createHistoryRecord({ form, prediction, latitude, longitude, apiStatus, model }) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    savedAt: new Date().toISOString(),
    datetime: form.datetime,
    latitude,
    longitude,
    locationMode: form.mode,
    clothingId: prediction.clothing.id,
    activityId: prediction.activity.id,
    wbgt: Number(prediction.wbgt.toFixed(2)),
    effectiveWbgt: Number(prediction.effectiveWbgt.toFixed(2)),
    heatIndex: Number(prediction.heatIndex.toFixed(2)),
    riskKey: prediction.risk.key,
    riskLabel: prediction.risk.label,
    riskLabelEn: prediction.risk.labelEn,
    riskColor: prediction.risk.color,
    apiStatus,
    model: model ?? "-",
  };
}

function App() {
  const [language, setLanguage] = useState(() => loadLanguage());
  const [form, setForm] = useState({
    mode: "gps",
    latitude: DEFAULT_COORDINATES.latitude.toFixed(6),
    longitude: DEFAULT_COORDINATES.longitude.toFixed(6),
    datetime: getDefaultBangkokDateTime(),
    clothing: "light_clothing",
    activity: "moderate",
  });
  const [view, setView] = useState("assess");
  const [historyItems, setHistoryItems] = useState(() => loadHistory());
  const [openInfo, setOpenInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsState, setGpsState] = useState({
    status: "idle",
    coords: null,
    accuracy: null,
    error: "",
  });
  const [weatherState, setWeatherState] = useState({
    status: "idle",
    data: null,
    error: "",
  });
  const [apiStatus, setApiStatus] = useState(() => translations[loadLanguage()].fillInfo);
  const [evaluationError, setEvaluationError] = useState("");
  const [backendWbgt, setBackendWbgt] = useState(null);
  const [trendState, setTrendState] = useState({
    status: "idle",
    data: [],
    error: "",
  });
  const t = translations[language];

  const manualLatitude = Number(form.latitude);
  const manualLongitude = Number(form.longitude);
  const hasValidManualCoordinates =
    Number.isFinite(manualLatitude) &&
    Number.isFinite(manualLongitude) &&
    manualLatitude >= -90 &&
    manualLatitude <= 90 &&
    manualLongitude >= -180 &&
    manualLongitude <= 180;
  const canShowWeatherContext = (form.mode === "gps" && gpsState.status === "success") || (form.mode === "manual" && hasValidManualCoordinates);
  const selectedWeatherDate = getDatePart(form.datetime);
  const weatherCoordinates = useMemo(() => {
    if (form.mode === "gps" && gpsState.coords) {
      return {
        lat: gpsState.coords.latitude,
        lon: gpsState.coords.longitude,
        label: t.gpsCoordinates,
      };
    }

    if (form.mode === "manual" && hasValidManualCoordinates) {
      return {
        lat: manualLatitude,
        lon: manualLongitude,
        label: t.selectedCoordinates,
      };
    }

    return null;
  }, [form.mode, gpsState.coords, hasValidManualCoordinates, manualLatitude, manualLongitude, t.gpsCoordinates, t.selectedCoordinates]);
  const mapCenter = useMemo(
    () => [
      hasValidManualCoordinates ? manualLatitude : DEFAULT_COORDINATES.latitude,
      hasValidManualCoordinates ? manualLongitude : DEFAULT_COORDINATES.longitude,
    ],
    [hasValidManualCoordinates, manualLatitude, manualLongitude],
  );
  const activeWeather = useMemo(() => {
    if (weatherState.status === "success" && weatherState.data) {
      return normalizeOpenMeteo(weatherState.data, form.datetime);
    }

    return fallbackWeather;
  }, [weatherState.status, weatherState.data, form.datetime]);
  const result = useMemo(() => buildPrediction(form, backendWbgt, activeWeather), [form, backendWbgt, activeWeather]);
  const canEvaluate = canShowWeatherContext && weatherState.status === "success" && !loading;

  function toggleInfo(key) {
    setOpenInfo((current) => (current === key ? null : key));
  }

  function closeInfo() {
    setOpenInfo(null);
  }

  function changeLanguage(nextLanguage) {
    const nextText = translations[nextLanguage];
    setLanguage(nextLanguage);
    saveLanguage(nextLanguage);
    if (loading) {
      setApiStatus(nextText.evaluating);
    } else if (evaluationError) {
      setApiStatus(nextText.evaluationFailed);
    } else if (hasEvaluated) {
      setApiStatus(nextText.evaluated);
    } else {
      setApiStatus(nextText.fillInfo);
    }
    setOpenInfo(null);
  }

  const chartData = [
    { name: "WBGT", value: Number(result.wbgt.toFixed(1)), fill: "#1476d4" },
    { name: "Effective", value: Number(result.effectiveWbgt.toFixed(1)), fill: "#f26b2f" },
    { name: "Heat Index", value: Number(result.heatIndex.toFixed(1)), fill: "#e62e42" },
  ];

  const trendData = trendState.data;

  useEffect(() => {
    let ignore = false;

    if (!canShowWeatherContext || !weatherCoordinates) {
      setWeatherState({ status: "idle", data: null, error: "" });
      return undefined;
    }

    setWeatherState((current) => ({ ...current, status: "loading", error: "" }));

    fetchOpenMeteo(weatherCoordinates.lat, weatherCoordinates.lon, form.datetime)
      .then((weatherData) => {
        if (!ignore) {
          setWeatherState({ status: "success", data: weatherData, error: "" });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setWeatherState({ status: "error", data: null, error: error.message });
        }
      });

    return () => {
      ignore = true;
    };
  }, [canShowWeatherContext, weatherCoordinates?.lat, weatherCoordinates?.lon, selectedWeatherDate]);

  function resetEvaluation() {
    setHasEvaluated(false);
    setBackendWbgt(null);
    setTrendState({ status: "idle", data: [], error: "" });
    setEvaluationError("");
    setApiStatus(t.fillInfo);
  }

  function updateForm(key, value) {
    resetEvaluation();
    setForm((current) => ({ ...current, [key]: value }));
  }

  function requestGpsLocation() {
    resetEvaluation();

    if (!("geolocation" in navigator)) {
      setGpsState({
        status: "error",
        coords: null,
        accuracy: null,
        error: language === "en" ? "This browser does not support GPS location." : "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง GPS",
      });
      setForm((current) => ({ ...current, mode: "gps" }));
      return;
    }

    setGpsState((current) => ({ ...current, status: "loading", error: "" }));
    setForm((current) => ({ ...current, mode: "gps" }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setGpsState({
          status: "success",
          coords: { latitude, longitude },
          accuracy: position.coords.accuracy,
          error: "",
        });
        setForm((current) => ({
          ...current,
          mode: "gps",
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? language === "en"
              ? "Location access was denied. Please allow GPS in your browser."
              : "ไม่ได้รับสิทธิ์เข้าถึงตำแหน่ง กรุณาอนุญาต GPS ในเบราว์เซอร์"
            : language === "en"
              ? "Unable to read current location. Please try again."
              : "ไม่สามารถอ่านตำแหน่งปัจจุบันได้ กรุณาลองอีกครั้ง";

        setGpsState({
          status: "error",
          coords: null,
          accuracy: null,
          error: message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  function updateMapCoordinates(latitude, longitude) {
    resetEvaluation();
    setGpsState((current) => ({ ...current, status: "idle", error: "" }));
    setForm((current) => ({
      ...current,
      mode: "manual",
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
  }

  async function evaluateRisk(event) {
    event.preventDefault();
    setLoading(true);
    setEvaluationError("");
    setApiStatus(t.evaluating);

    const weather = result.weather;
    const hour = getHourOfDay(form.datetime);
    const latitude = weatherCoordinates?.lat ?? DEFAULT_COORDINATES.latitude;
    const longitude = weatherCoordinates?.lon ?? DEFAULT_COORDINATES.longitude;
    const features = buildModelFeatures(weather, hour, latitude, longitude);
    const payload = {
      features,
      metadata: {
        location_source: form.mode === "gps" ? "gps" : "manual_coordinates",
        datetime: form.datetime,
        clothing_type: result.cafOutput.clothing_type,
        caf: result.cafOutput.caf,
        activity_level: form.activity,
        weather_source: weather.source ?? "mock",
        weather_time: weather.hourlyTime ?? null,
        prediction_coordinates: {
          latitude,
          longitude,
        },
        gps:
          form.mode === "gps" && gpsState.coords
            ? {
                latitude: gpsState.coords.latitude,
                longitude: gpsState.coords.longitude,
                accuracy_m: gpsState.accuracy,
              }
            : null,
      },
    };

    let predictedWbgt = null;
    let evaluatedStatus = t.evaluated;
    let modelName = null;

    try {
      const data = await predictWbgt(payload.features);
      predictedWbgt = data.wbgt;
      modelName = data?.data?.model ?? data?.model ?? null;
      evaluatedStatus = t.evaluated;
      setBackendWbgt(predictedWbgt);
      setApiStatus(evaluatedStatus);
    } catch {
      setBackendWbgt(null);
      setApiStatus(t.evaluationFailed);
      setEvaluationError(t.evaluationError);
      setHasEvaluated(false);
      setLoading(false);
      return;
    }

    setTrendState({ status: "loading", data: [], error: "" });

    const prediction = buildPrediction(form, predictedWbgt, weather);
    const historyRecord = createHistoryRecord({
      form,
      prediction,
      latitude,
      longitude,
      apiStatus: evaluatedStatus,
      model: modelName,
    });

    setHistoryItems((current) => {
      const next = [historyRecord, ...current].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(next);
      return next;
    });

    try {
      const trend = await buildRealTrendData({
        rawWeather: weatherState.data,
        date: getDatePart(form.datetime),
        latitude,
        longitude,
        caf: prediction.cafOutput.caf,
      });
      setTrendState({ status: "success", data: trend, error: "" });
      setActiveTab("summary");
      setHasEvaluated(true);
    } catch {
      setTrendState({ status: "error", data: [], error: t.trendUnavailable });
      setActiveTab("summary");
      setHasEvaluated(true);
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setHistoryItems([]);
    saveHistory([]);
  }

  return (
    <div className="app-shell" onPointerDown={closeInfo}>
      <header className="topbar">
        <div className="brand-mark">
          <Sun size={28} strokeWidth={2.4} />
        </div>
        <div>
          <p className="eyebrow">Outdoor Heat Risk</p>
          <h1>{t.appTitle}</h1>
        </div>
        <div className="top-actions">
          <div className="language-toggle" aria-label="Language">
            {["th", "en"].map((item) => (
              <button
                key={item}
                className={language === item ? "active" : ""}
                type="button"
                aria-pressed={language === item}
                onClick={(event) => {
                  event.stopPropagation();
                  changeLanguage(item);
                }}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            className="icon-button"
            type="button"
            aria-expanded={openInfo === "about"}
            aria-label={t.aboutLabel}
            onClick={(event) => {
              event.stopPropagation();
              toggleInfo("about");
            }}
          >
            <Info size={20} />
          </button>
        </div>
        {openInfo === "about" && (
          <div className="about-popover" role="status" onPointerDown={(event) => event.stopPropagation()}>
            {t.aboutText}
          </div>
        )}
      </header>

      <main className={view === "assess" ? "workspace" : "history-workspace"}>
        {view === "assess" ? (
          <>
        <section className="panel input-panel" aria-label="ฟอร์มประเมิน">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t.setupEyebrow}</p>
              <h2>{t.setupTitle}</h2>
            </div>
            <span className="status-pill">{apiStatus}</span>
          </div>

          <form onSubmit={evaluateRisk} className="risk-form">
            <fieldset>
              <legend><MapPin size={18} /> {t.location}</legend>
              <div className="mode-grid">
                <button
                  type="button"
                  className={form.mode === "gps" ? "mode-card active" : "mode-card"}
                  onClick={requestGpsLocation}
                >
                  <LocateFixed size={21} />
                  <span>{t.useCurrentLocation}</span>
                </button>
                <button
                  type="button"
                  className={form.mode === "manual" ? "mode-card active" : "mode-card"}
                  onClick={() => {
                    setGpsState((current) => ({ ...current, status: "idle", error: "" }));
                    updateForm("mode", "manual");
                  }}
                >
                  <Map size={21} />
                  <span>{t.chooseOnMap}</span>
                </button>
              </div>

              {form.mode === "gps" && (
                <div className="location-preview">
                  <div>
                    <p className="eyebrow">{t.currentLocation}</p>
                    <strong>
                      {gpsState.status === "success"
                        ? t.gpsReady
                        : t.gpsPrompt}
                    </strong>
                    {gpsState.status === "success" && (
                      <>
                        <p>{t.currentCoordinates} {gpsState.coords.latitude.toFixed(6)}, {gpsState.coords.longitude.toFixed(6)}</p>
                        <p>{t.gpsAccuracy} {Math.round(gpsState.accuracy)} m</p>
                      </>
                    )}
                    {gpsState.status === "idle" && (
                      <p>{t.gpsIdle}</p>
                    )}
                    {gpsState.status === "loading" && (
                      <p>{t.gpsLoading}</p>
                    )}
                    {gpsState.status === "error" && (
                      <p className="gps-error">{gpsState.error}</p>
                    )}
                  </div>
                  <button
                    className="gps-request-button"
                    type="button"
                    onClick={requestGpsLocation}
                    disabled={gpsState.status === "loading"}
                  >
                    {gpsState.status === "loading" ? <RefreshCw className="spin" size={16} /> : <LocateFixed size={16} />}
                    {gpsState.status === "success" ? t.updateGps : t.useGpsNow}
                  </button>
                </div>
              )}

              {form.mode === "manual" && (
                <div className="coordinate-panel">
                  <div className="map-picker">
                    <MapContainer center={mapCenter} zoom={11} scrollWheelZoom className="leaflet-map">
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <RecenterMap center={mapCenter} />
                      <MapClickHandler onPick={updateMapCoordinates} />
                      {hasValidManualCoordinates && (
                        <Marker position={[manualLatitude, manualLongitude]} icon={MAP_MARKER_ICON} />
                      )}
                    </MapContainer>
                  </div>
                  <div className="coordinate-readout">
                    <div>
                      <span>Latitude</span>
                      <strong>{hasValidManualCoordinates ? manualLatitude.toFixed(6) : "-"}</strong>
                    </div>
                    <div>
                      <span>Longitude</span>
                      <strong>{hasValidManualCoordinates ? manualLongitude.toFixed(6) : "-"}</strong>
                    </div>
                  </div>
                  <p className="map-hint">{t.mapHint}</p>
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend><CalendarClock size={18} /> {t.dateTime}</legend>
              <label>
                {t.bangkokTime}
                <input
                  type="datetime-local"
                  value={form.datetime}
                  onChange={(event) => updateForm("datetime", event.target.value)}
                />
              </label>
            </fieldset>

            {canShowWeatherContext && (
              <div className="weather-context" aria-label="ข้อมูลสภาพอากาศของพื้นที่และเวลาที่เลือก">
                <div className="weather-context-heading">
                  <div>
                    <p className="eyebrow">{t.weather}</p>
                    <h3>{weatherCoordinates?.label ?? t.waitingCoordinates}</h3>
                    {weatherState.status === "success" && (
                      <p>
                        {t.weatherForLocation}
                        {result.weather.hourlyTime ? ` · ${t.atTime} ${result.weather.hourlyTime.replace("T", " ")}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="status-pill">
                    {weatherState.status === "loading" && t.preparingData}
                    {weatherState.status === "success" && t.dataReady}
                    {weatherState.status === "error" && t.noData}
                    {weatherState.status === "idle" && t.waitingArea}
                  </span>
                </div>
                {weatherState.status === "loading" && (
                  <div className="weather-message">
                    <RefreshCw className="spin" size={18} />
                    {t.preparingWeather}
                  </div>
                )}
                {weatherState.status === "error" && (
                  <div className="weather-message error">
                    <AlertTriangle size={18} />
                    {t.weatherError}
                  </div>
                )}
	                {weatherState.status === "success" && (
	                  <div className="weather-strip">
	                    {weatherMetrics.map((metric) => (
	                      <Metric
	                        key={metric.key}
	                        icon={metric.icon}
	                        label={language === "en" ? metric.labelEn : metric.label}
	                        value={metric.value(result.weather, language)}
	                        parameter={metric.parameter}
	                        description={language === "en" ? metric.descriptionEn : metric.description}
	                        open={openInfo === `weather:${metric.key}`}
	                        onToggle={(event) => {
	                          event.stopPropagation();
	                          toggleInfo(`weather:${metric.key}`);
	                        }}
	                      />
	                    ))}
	                  </div>
	                )}
              </div>
            )}

            <fieldset className="caf-fieldset">
              <legend>
                <Shirt size={18} /> {t.clothingType}
	                <button
	                  className="mini-info-button"
	                  type="button"
	                  aria-expanded={openInfo === "caf"}
	                  aria-label={t.cafInfoLabel}
	                  onClick={(event) => {
	                    event.stopPropagation();
	                    toggleInfo("caf");
	                  }}
	                >
	                  <Info size={16} />
	                </button>
	              </legend>

	              {openInfo === "caf" && (
	                <div className="info-popover" role="status">
	                  {t.cafInfo}
                </div>
              )}

              <div className="caf-summary">
                <span>Effective WBGT = WBGT + CAF</span>
                <strong>{result.cafOutput.caf > 0 ? `+${result.cafOutput.caf}` : result.cafOutput.caf}°C</strong>
              </div>

              <div className="clothing-grid">
                {clothingOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = form.clothing === option.id;

                  return (
                    <button
                      className={selected ? "clothing-card active" : "clothing-card"}
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateForm("clothing", option.id)}
                    >
                      <span className="clothing-icon"><Icon size={21} /></span>
                      <span className="clothing-copy">
                        <strong>{optionLabel(option, language)}</strong>
                        <small>{optionExample(option, language)}</small>
                      </span>
                      <span className="caf-badge">{option.caf > 0 ? `+${option.caf}` : option.caf}°C</span>
                      {selected && <span className="check-badge"><Check size={15} /></span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend><Activity size={18} /> {t.activityLevel}</legend>
              <div className="activity-grid">
	                {activityOptions.map((option) => {
	                  const Icon = option.icon;
	                  const open = openInfo === `activity:${option.id}`;
                  return (
                    <div className="activity-wrap" key={option.id}>
                      <button
                        type="button"
                        className={form.activity === option.id ? "activity-card active" : "activity-card"}
                        onClick={() => updateForm("activity", option.id)}
                      >
                        <Icon size={20} />
                        <span>{optionLabel(option, language)}</span>
                      </button>
                      <button
	                        type="button"
	                        className="activity-info-button"
	                        aria-expanded={open}
	                        aria-label={`${t.aboutLabel} ${optionLabel(option, language)}`}
	                        onClick={(event) => {
	                          event.stopPropagation();
	                          toggleInfo(`activity:${option.id}`);
	                        }}
	                      >
                        <Info size={15} />
                      </button>
                      {open && (
                        <div className="activity-tooltip" role="status">
                          {optionDescription(option, language)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <button className="primary-button" type="submit" disabled={!canEvaluate}>
              {loading ? <RefreshCw className="spin" size={19} /> : <ShieldCheck size={19} />}
              {weatherState.status === "success" ? t.evaluateButton : t.waitWeather}
            </button>
          </form>
        </section>

        <section className={hasEvaluated ? "results-area" : "results-area pending"} aria-label="ผลการประเมิน">
          {!hasEvaluated ? (
            <div className="empty-results">
              {evaluationError ? <AlertTriangle size={34} /> : <ShieldCheck size={34} />}
              <h2>{evaluationError ? t.evaluationFailed : t.noResult}</h2>
              <p>{evaluationError || t.noResultHelp}</p>
            </div>
          ) : (
            <>
          <nav className="tabs" aria-label="แท็บผลลัพธ์">
            {[
              ["summary", t.summary],
              ["chart", t.chart],
              ["advice", t.advice],
            ].map(([id, label]) => (
              <button
                key={id}
                className={activeTab === id ? "active" : ""}
                onClick={() => setActiveTab(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </nav>

          {activeTab === "summary" && (
            <div className="summary-stack">
              <div className="risk-card">
                <div>
                  <p>{t.overallRisk}</p>
                  <strong style={{ color: result.risk.color }}>{riskLabel(result.risk, language)}</strong>
                </div>
                <AlertTriangle size={30} color={result.risk.color} />
                <div className="risk-rail" aria-hidden="true">
                  <span style={{ left: `${result.risk.pct}%`, backgroundColor: result.risk.color }} />
                </div>
                <div className="risk-labels">
                  <span>{t.low}</span><span>{t.moderate}</span><span>{t.high}</span><span>{t.veryHigh}</span>
                </div>
              </div>

              <div className="index-grid">
                <IndexCard label="WBGT" sublabel={t.model} value={result.wbgt} tone="blue" />
                <IndexCard label="Effective WBGT" sublabel={t.clothingCaf} value={result.effectiveWbgt} tone="orange" />
                <IndexCard label="Heat Index" sublabel={t.feelsLike} value={result.heatIndex} tone="red" />
              </div>
            </div>
          )}

          {activeTab === "chart" && (
            <div className="chart-stack">
              <div className="chart-panel">
                <div className="chart-heading">
                  <h3>{t.compareIndexes}</h3>
                  <BarChart3 size={20} />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} stroke="#e5edf7" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis unit="°C" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value} °C`, t.value]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-panel">
                <div className="chart-heading">
                  <h3>{t.todayTrend}</h3>
                  <span className="status-pill">{t.today}</span>
                </div>
                {trendState.status === "success" ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={trendData}>
                      <CartesianGrid vertical={false} stroke="#e5edf7" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis unit="°C" tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, name) => [`${value} °C`, name]} />
                      <Legend />
                      <Line type="monotone" dataKey="WBGT" stroke="#1476d4" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="Effective WBGT" stroke="#f26b2f" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="Heat Index" stroke="#e62e42" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-message">
                    <AlertTriangle size={18} />
                    {t.trendUnavailable}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "advice" && (
            <div className="advice-card">
              <div className="advice-head">
                <ShieldCheck size={24} />
                <div>
                  <h3>{t.safetyAdvice}</h3>
                  <p>{t.basedOnRisk} {riskLabel(result.risk, language)}</p>
                </div>
              </div>
              <ul>
                {(language === "en" ? recommendationsEn : recommendations)[result.risk.key].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a className="detail-link" href="#details">
                {t.details} <ChevronRight size={17} />
              </a>
            </div>
          )}
            </>
          )}
        </section>
          </>
        ) : (
          <section className="panel history-panel" aria-label="ประวัติการประเมิน">
            <div className="history-heading">
              <div>
                <p className="eyebrow">{t.historyLocal}</p>
                <h2>{t.historyTitle}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={clearHistory} disabled={historyItems.length === 0}>
                <Trash2 size={16} />
                {t.clear}
              </button>
            </div>

            {historyItems.length === 0 ? (
              <div className="empty-history">
                <History size={34} />
                <h3>{t.noHistory}</h3>
                <p>{t.noHistoryHelp}</p>
              </div>
            ) : (
              <div className="history-list">
                {historyItems.map((item) => (
                  <article className="history-card" key={item.id}>
                    <div className="history-card-head">
                      <div>
                        <strong>{item.locationMode === "gps" ? t.gpsSource : t.mapSource}</strong>
                        <p>{formatDateTimeThai(item.datetime)}</p>
                      </div>
                      <span style={{ color: item.riskColor }}>{language === "en" ? item.riskLabelEn ?? item.riskLabel : item.riskLabel}</span>
                    </div>
                    <div className="history-coordinates">
                      {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                    </div>
                    <div className="history-index-grid">
                      <div><span>WBGT</span><strong>{item.wbgt.toFixed(1)}°C</strong></div>
                      <div><span>Effective</span><strong>{item.effectiveWbgt.toFixed(1)}°C</strong></div>
                      <div><span>Heat Index</span><strong>{item.heatIndex.toFixed(1)}°C</strong></div>
                    </div>
                    <div className="history-meta">
                      <span>{optionLabel(clothingOptions.find((option) => option.id === item.clothingId) ?? { label: item.clothingLabel, labelEn: item.clothingLabel }, language)}</span>
                      <span>{optionLabel(activityOptions.find((option) => option.id === item.activityId) ?? { label: item.activityLabel, labelEn: item.activityLabel }, language)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <span>{t.footerOrg}</span>
        <span>{t.footerContact}</span>
      </footer>

      <nav className="bottom-nav" aria-label="เมนูหลัก">
        <button type="button" className={view === "assess" ? "active" : ""} onClick={() => setView("assess")}>
          <ShieldCheck size={20} />
          {t.assess}
        </button>
        <button type="button" className={view === "history" ? "active" : ""} onClick={() => setView("history")}>
          <History size={20} />
          {t.history}
        </button>
      </nav>
    </div>
  );
}

function Metric({ icon: Icon, label, value, parameter, description, open, onToggle }) {
  return (
    <div className="metric">
      <div className="metric-topline">
        <Icon size={18} />
        <button
          className="metric-info-button"
          type="button"
          aria-expanded={open}
          aria-label={`ข้อมูล${label}`}
          onClick={onToggle}
        >
          <Info size={14} />
        </button>
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      {open && (
        <div className="metric-tooltip" role="status">
          <b>{parameter}</b>
          <p>{description}</p>
        </div>
      )}
    </div>
  );
}

function IndexCard({ label, sublabel, value, tone }) {
  return (
    <article className={`index-card ${tone}`}>
      <span>{sublabel}</span>
      <h3>{label}</h3>
      <strong>{value.toFixed(1)}<small>°C</small></strong>
    </article>
  );
}

createRoot(document.getElementById("root")).render(<App />);
