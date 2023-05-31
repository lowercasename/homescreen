import * as dotenv from 'dotenv';
dotenv.config({
  path: './config/.env'
});

import fs from "fs";
import express from "express";
import { createCanvas, registerFont, loadImage } from "canvas";
import fetch from "node-fetch";
import e from "express";
import { get } from "http";

const app = express();
const port = 3033;

const weatherIcons = [
  "00-clear-night.png",
  "01-sunny-day.png",
  "02-partly-cloudy-night.png",
  "03-partly-cloudy-day.png",
  "08-overcast.png",
  "05-mist.png",
  "06-fog.png",
  "07-cloudy.png",
  "08-overcast.png",
  "09-light-rain-night.png",
  "10-light-rain-day.png",
  "11-drizzle.png",
  "12-light-rain.png",
  "13-heavy-rain-night.png",
  "14-heavy-rain-day.png",
  "15-heavy-rain.png",
  "16-sleet-night.png",
  "17-sleet-day.png",
  "18-sleet.png",
  "19-hail-night.png",
  "20-hail-day.png",
  "21-hail.png",
  "22-light-snow-night.png",
  "23-light-snow-day.png",
  "24-light-snow.png",
  "25-heavy-snow-night.png",
  "26-heavy-snow-day.png",
  "27-heavy-snow.png",
  "28-thunder-shower-night.png",
  "29-thunder-shower-day.png",
  "30-thunder.png",
];

const hassForecastStatesToIcons = {
  "clear-night": "00-clear-night.png",
  "cloudy": "07-cloudy.png",
  "fog": "06-fog.png",
  "hail": "21-hail.png",
  "lightning": "30-thunder.png",
  "lightning-rainy": "29-thunder-shower-day.png",
  "partlycloudy": "03-partly-cloudy-day.png",
  "pouring": "15-heavy-rain.png",
  "rainy": "12-light-rain.png",
  "snowy": "24-light-snow.png",
  "snowy-rainy": "18-sleet.png",
  "sunny": "01-sunny-day.png",
  "windy": "07-cloudy.png",
  "windy-variant": "07-cloudy.png",
};

const reminders = {
  0: "Put the milk bottles out",
  1: "Put the bins out",
};

const pressureIcon = (pressure) => {
  if (pressure < 970) {
    return "\uf76c";
  } else if (pressure >= 970 && pressure < 990) {
    return "\uf73d";
  } else if (pressure >= 990 && pressure < 1010) {
    return "\uf0c2";
  } else if (pressure >= 1010 && pressure < 1030) {
    return "\uf6c4";
  } else if (pressure >= 1030) {
    return "\uf185";
  } else {
    return "";
  }
};

const ISODate = (date) => {
  return date.toISOString().split("T")[0];
};

const truncate = (context, string, maxLength) => {
  let output = "";
  if (!string || string == "") {
    return "";
  }
  while (!output) {
    let width = context.measureText(string).width;
    if (width > maxLength) {
      if (string.endsWith("...")) {
        // Remove one character before ellipsis
        string = string.slice(0, -4) + string.slice(-3);
      } else {
        // Remove one character and add ellipsis
        string = string.slice(0, -1) + "...";
      }
    } else {
      output = string;
    }
  }
  return output;
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const greeting = () => {
  const today = new Date();
  const hour = today.getHours();
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
};

const getHomeAssistantData = async () => {
  const hassResponse = await fetch("http://192.168.125.21:8123/api/states", {
    headers: {
      Authorization: "Bearer " + process.env.HASS_TOKEN,
    },
  });
  const hassData = await hassResponse.json();
  return hassData;
};

const getWeatherData = async () => {
  return getHomeAssistantData().then((data) => {
    const weather = data.filter((entity) => entity.entity_id === "weather.forecast_home")[0];
    const state = weather.state;
    const temperature = weather.attributes.temperature;
    const icon = hassForecastStatesToIcons[state];
    return { icon, temperature, state };
  });
};

const drawRoundRect = (context, x, y, width, height, radius) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const scenes = {
  "bedroom_chill": {
    entityId: "scene.bedroom_chill",
    fontAwesomeIcon: "\ue392",
    label: "Chill",
  },
  "bedroom_on": {
    entityId: "scene.bedroom_on",
    fontAwesomeIcon: "\uf672",
    label: "Bright",
  },
  "sleep": {
    entityId: "scene.sleep",
    fontAwesomeIcon: "\uf755",
    label: "Sleep",
  },
};

const drawScreen = async () => {
  console.log("Drawing screen");
  const width = 600;
  const height = 448;
  const canvas = createCanvas(width, height);

  const context = canvas.getContext("2d");

  const today = new Date();

  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);

  const weather = await getWeatherData();
  console.log(weather);

  const weatherImage = await loadImage(
    `./images/${weather.icon}`
  );

  context.drawImage(weatherImage, 0, 0, 80, 80);
  context.fillStyle = "#000";
  context.font = '400 40px "Signika"';
  context.fillText(
    `${Math.round(weather.temperature)}°C`,
    90,
    45
  );
  context.font = '300 25px "Signika"';
  context.fillText(
    `${capitalizeFirstLetter(weather.state)}`,
    90,
    75
  );

  context.fillStyle = "black";
  context.font = '600 50px "Signika"';
  context.fillText(
    `${greeting()}.`,
    250,
    40
  );
  context.font = '300 25px "Signika"';
  context.fillStyle = "black";
  context.fillText(
    `It is ${today.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.`,
    250,
    75
  );

  // Draw pretty image
  const randomImage = await loadImage(
    `./images/background-${String(getRandomInt(1, 8)).padStart(2, '0')}.jpg`
  );
  // const backgroundImageRatio = backgroundImage.width / backgroundImage.height;
  context.drawImage(randomImage, 0, 90, 600, 358);

  for (let i = 0; i < Object.keys(scenes).length; i++) {
    const scene = scenes[Object.keys(scenes)[i]];
    drawRoundRect(context, 10 + i * 120, 340, 100, 100, 10);
    context.fillStyle = "rgba(255, 255, 255, 0.8)";
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "#000";
    context.stroke();
    context.fillStyle = "#000";
    context.font = '300 40px "Font Awesome 6 Pro"';
    context.fillText(
      `${scene.fontAwesomeIcon}`,
      25 + i * 120,
      390
    );
    context.font = '400 20px "Signika"';
    context.fillText(
      `${scene.label}`,
      25 + i * 120,
      420
    );
  }

  // if (weather) {
  //   const todayWeatherImage = await loadImage(
  //     `./images/${weatherCodesMap[weather.today.weatherCode]}`
  //   );
  //   const tomorrowWeatherImage = await loadImage(
  //     `./images/${weatherCodesMap[weather.tomorrow.weatherCode]}`
  //   );
  //   context.drawImage(todayWeatherImage, 0, 50);
  //   context.drawImage(tomorrowWeatherImage, leftColumnWidth + 10, 90);

  //   context.fillStyle = "#000";
  //   context.font = 'bold 100px "Roboto"';
  //   const currentTempWidth = context.measureText(
  //     `${Math.round(weather.today.temperatureCurrent)}°`
  //   ).width;
  //   const todayWeatherOffset = currentTempWidth + 100 + 20;
  //   context.fillText(
  //     `${Math.round(weather.today.temperatureCurrent)}°`,
  //     110,
  //     135
  //   );

  //   context.font = '24px "Roboto"';
  //   context.fillText(
  //     weatherDescriptionsMap[weather.today.weatherCode][1],
  //     todayWeatherOffset,
  //     75
  //   );
  //   context.fillText(
  //     `${Math.round(weather.today.temperatureMax)}° / ${Math.round(
  //       weather.today.temperatureMin
  //     )}°`,
  //     todayWeatherOffset,
  //     105
  //   );
  //   context.font = 'bold 24px "Font Awesome 6 Pro"';
  //   context.fillText("\uf75c", todayWeatherOffset, 135);
  //   context.font = '24px "Roboto"';
  //   context.fillText(
  //     `${weather.today.precipitationChance}%`,
  //     todayWeatherOffset + 30,
  //     135
  //   );

  //   context.fillText(
  //     weatherDescriptionsMap[weather.tomorrow.weatherCode][1],
  //     rightColumnOffset + 10,
  //     220
  //   );
  //   context.fillText(
  //     `${Math.round(weather.tomorrow.temperatureMax)}° / ${Math.round(
  //       weather.tomorrow.temperatureMin
  //     )}°`,
  //     rightColumnOffset + 10,
  //     250
  //   );
  //   context.font = 'bold 24px "Font Awesome 6 Pro"';
  //   context.fillText("\uf75c", rightColumnOffset + 10, 280);
  //   context.font = '24px "Roboto"';
  //   context.fillText(
  //     `${weather.tomorrow.precipitationChance}%`,
  //     rightColumnOffset + 40,
  //     280
  //   );
  // }

  // if (food) {
  //   context.fillStyle = "green";
  //   context.font = 'bold 24px "Roboto"';
  //   context.fillText("Breakfast", 0, 180);
  //   context.fillText("Lunch", 0, 240);
  //   context.fillText("Dinner", 0, 300);
  //   context.fillStyle = "#000";
  //   context.font = '20px "Roboto"';
  //   context.fillText(
  //     truncate(context, food.breakfast, leftColumnWidth - 10),
  //     0,
  //     205
  //   );
  //   context.fillText(
  //     truncate(context, food.lunch, leftColumnWidth - 10),
  //     0,
  //     265
  //   );
  //   context.fillText(
  //     truncate(context, food.dinner, leftColumnWidth - 10),
  //     0,
  //     325
  //   );
  // }

  // if (reminders[today.getDay()]) {
  //   context.fillStyle = "green";
  //   context.fillRect(0, 350, leftColumnWidth - 20, 32);
  //   context.fillStyle = "#fff";
  //   context.font = 'bold 20px "Font Awesome 6 Pro"';
  //   context.fillText("\uf848", 10, 373);
  //   context.font = '20px "Roboto"';
  //   context.fillText(reminders[today.getDay()], 35, 373);
  // }

  // if (sensor) {
  //   context.fillStyle = "#000";
  //   context.font = 'bold 24px "Font Awesome 6 Pro"';
  //   context.fillText("\uf2c9", rightColumnOffset, 340);
  //   context.fillText("\uf750", rightColumnOffset, 370);
  //   context.fillText("\uf72e", rightColumnOffset, 400);
  //   context.fillText(pressureIcon(sensor.pressure), rightColumnOffset, 430);

  //   context.font = '24px "Roboto"';
  //   context.fillText(
  //     `${Math.round(sensor.temperature * 100) / 100}°`,
  //     rightColumnOffset + 40,
  //     340
  //   );
  //   context.fillText(
  //     `${Math.round(sensor.humidity * 100) / 100}%`,
  //     rightColumnOffset + 40,
  //     370
  //   );
  //   context.fillText(
  //     `${Math.round(sensor.pressure * 100) / 100}`,
  //     rightColumnOffset + 40,
  //     400
  //   );
  //   context.fillText(
  //     `${capitalizeFirstLetter(sensor.pressure_description)}`,
  //     rightColumnOffset + 40,
  //     430
  //   );
  // }

  // context.fillStyle = "#000";
  // context.font = '16px "Roboto"';
  // context.fillText(
  //   `Last updated: ${today.toLocaleTimeString("en-GB", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   })}`,
  //   0,
  //   440
  // );

  const buffer = canvas.toBuffer("image/jpeg", {
    quality: 0.65,
    progressive: false,
  });
  fs.writeFileSync("./screen.jpg", buffer);
};

app.get("/dashboard.jpg", async (req, res) => {
  await drawScreen();
  res.sendFile("screen.jpg", { root: "." });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
