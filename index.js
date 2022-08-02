import fs from "fs";
import express from 'express';
import { createCanvas, registerFont, loadImage } from 'canvas';
import fetch from "node-fetch";

const app = express();
const port = 3033;

const weatherCodesMap = [
        '00-clear-night.png',
        '01-sunny-day.png',
        '02-partly-cloudy-night.png',
        '03-partly-cloudy-day.png',
        '08-overcast.png',
        '05-mist.png',
        '06-fog.png',
        '07-cloudy.png',
        '08-overcast.png',
        '09-light-rain-night.png',
        '10-light-rain-day.png',
        '11-drizzle.png',
        '12-light-rain.png',
        '13-heavy-rain-night.png',
        '14-heavy-rain-day.png',
        '15-heavy-rain.png',
        '16-sleet-night.png',
        '17-sleet-day.png',
        '18-sleet.png',
        '19-hail-night.png',
        '20-hail-day.png',
        '21-hail.png',
        '22-light-snow-night.png',
        '23-light-snow-day.png',
        '24-light-snow.png',
        '25-heavy-snow-night.png',
        '26-heavy-snow-day.png',
        '27-heavy-snow.png',
        '28-thunder-shower-night.png',
        '29-thunder-shower-day.png',
        '30-thunder.png',
];

const weatherDescriptionsMap = [
    ['Clear', 'Clear'],                                     
    ['Sunny', 'Sunny'],                                     
    ['Cloudy', 'Partly cloudy'],                            
    ['Cloudy', 'Partly cloudy'],                            
    ['Forbidden', 'Forbidden'],                             
    ['Mist', 'Mist'],                                       
    ['Fog', 'Fog'],                                         
    ['Cloudy', 'Cloudy'],                                   
    ['Overcast', 'Overcast'],                               
    ['Light rain', 'Light rain showers'],                   
    ['Light rain', 'Light rain showers' ],                  
    ['Drizzle', 'Drizzle'],                                 
    ['Light rain', 'Light rain'],                           
    ['Heavy rain', 'Heavy rain showers'],                   
    ['Heavy rain', 'Heavy rain showers'],                   
    ['Heavy rain', 'Heavy rain'],                                        
    ['Sleet', 'Sleet showers'],                             
    ['Sleet', 'Sleet showers'],                             
    ['Sleet', 'Sleet'],                                     
    ['Hail', 'Hail showers'],                               
    ['Hail', 'Hail showers'],                               
    ['Hail', 'Hail'],                                       
    ['Light snow', 'Light snow showers'],                   
    ['Light snow', 'Light snow showers'],                   
    ['Light snow', 'Light snow'],                                         
    ['Heavy snow', 'Heavy snow showers'],                   
    ['Heavy snow', 'Heavy snow showers'],                   
    ['Heavy snow', 'Heavy snow'],                                         
    ['Thunderstorm', 'Thunder showers'],                    
    ['Thunderstorm', 'Thunder showers'],                    
    ['Thunderstorm', 'Thunderstorm'],                       
];

const reminders = {
    0: 'Put the milk bottles out',
    1: 'Put the bins out'
}

const ISODate = (date) => {
    return date.toISOString().split('T')[0];
}

const truncate = (context, string, maxLength) => {
    let output = ""
    if (string == "") {
        return string;
    }
    while (!output) {
        let width = context.measureText(string).width;
        if (width > maxLength) {
            if (string.endsWith('...')) {
                // Remove one character before ellipsis
                string = string.slice(0, -4) + string.slice(-3);
            } else {
                // Remove one character and add ellipsis
                string = string.slice(0, -1) + '...';
            }
        } else {
            output = string;
        }
    }
    return output;
}

const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const drawScreen = async () => {
    console.log('Drawing screen');
    const width = 600;
    const height = 448;
    const canvas = createCanvas(width, height);

    const context = canvas.getContext('2d');

    const today = new Date();

    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, 40);
    context.font = 'bold 30px "Roboto"'
    context.fillStyle = '#fff';
    context.fillText(today.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    }), 10, 30);

    const rightColumnWidth = context.measureText("Tomorrow").width;
    const leftColumnWidth = width - rightColumnWidth;
    const rightColumnOffset = leftColumnWidth;

    context.fillStyle = "green";
    context.font = 'bold 30px "Roboto"'
    context.fillText("Tomorrow", leftColumnWidth, 70)
    context.beginPath();
    context.moveTo(rightColumnOffset - 10, 50);
    context.lineTo(rightColumnOffset - 10, 280);
    context.lineTo(width, 280);
    context.lineWidth = 4;
    context.strokeStyle = 'green'
    context.stroke();

    const weatherResponse = await fetch("http://192.168.0.41:5000/weather")
    const weather = await weatherResponse.json();
    const foodResponse = await fetch("http://192.168.0.4:8080/api/v1/day?date=" + ISODate(today))
    const foodResponseLength = parseInt(foodResponse.headers.get('content-length'));
    let food = {};
    if (foodResponseLength) {
        food = await foodResponse.json();
    }

    const todayWeatherImage = await loadImage(`./images/${weatherCodesMap[weather.today.weatherCode]}`);
    const tomorrowWeatherImage = await loadImage(`./images/${weatherCodesMap[weather.tomorrow.weatherCode]}`);
    context.drawImage(todayWeatherImage, 0, 40)
    context.drawImage(tomorrowWeatherImage, leftColumnWidth + 10, 80)

    context.fillStyle = '#000';
    context.font = 'bold 100px "Roboto"'
    const currentTempWidth = context.measureText(`${Math.round(weather.today.temperatureCurrent)}°`).width
    const todayWeatherOffset = currentTempWidth + 100 + 20;
    context.fillText(`${Math.round(weather.today.temperatureCurrent)}°`, 110, 125)

    context.font = '24px "Roboto"'
    context.fillText(weatherDescriptionsMap[weather.today.weatherCode][1], todayWeatherOffset, 65)
    context.fillText(`${Math.round(weather.today.temperatureMax)}° / ${Math.round(weather.today.temperatureMin)}°`, todayWeatherOffset, 95)
    context.font = 'bold 24px "Font Awesome 6 Pro"'
    context.fillText('\uf75c', todayWeatherOffset, 125)
    context.font = '24px "Roboto"'
    context.fillText(`${weather.today.precipitationChance}%`, todayWeatherOffset + 30, 125)

    context.fillText(weatherDescriptionsMap[weather.tomorrow.weatherCode][1], rightColumnOffset +10, 200)
    context.fillText(`${Math.round(weather.tomorrow.temperatureMax)}° / ${Math.round(weather.tomorrow.temperatureMin)}°`, rightColumnOffset +10, 230)
    context.font = 'bold 24px "Font Awesome 6 Pro"'
    context.fillText('\uf75c', rightColumnOffset+10, 260)
    context.font = '24px "Roboto"'
    context.fillText(`${weather.tomorrow.precipitationChance}%`, rightColumnOffset +40, 260)

    if (food && Object.keys(food).length > 0) {
        context.fillStyle = "green";
        context.font = 'bold 24px "Roboto"'
        context.fillText("Breakfast", 0, 170)
        context.fillText("Lunch", 0, 230)
        context.fillText("Dinner", 0, 290)
        context.fillStyle = "#000";
        context.font = '20px "Roboto"'
        context.fillText(truncate(context, food.breakfast, leftColumnWidth - 10), 0, 195)
        context.fillText(truncate(context, food.lunch, leftColumnWidth - 10), 0, 255)
        context.fillText(truncate(context, food.dinner, leftColumnWidth - 10), 0, 315)
    }

    if (reminders[today.getDay()]) {
        context.fillStyle = "green";
        context.fillRect(0, 330, leftColumnWidth - 20, 32);
        context.fillStyle = "#fff";
        context.font = 'bold 20px "Font Awesome 6 Pro"'
        context.fillText('\uf848', 10, 353)
        context.font = '20px "Roboto"'
        context.fillText(reminders[today.getDay()], 35, 353)
    }

    context.fillStyle = "#000";
    context.font = '16px "Roboto"'
    context.fillText(`Last updated: ${today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' } )}`, 0, 440)

    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.65, progressive: false })
    fs.writeFileSync('./screen.jpg', buffer)
}

app.get('/screen', async (req, res) => {
    await drawScreen(); 
    res.sendFile('screen.jpg', { root: '.' });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
