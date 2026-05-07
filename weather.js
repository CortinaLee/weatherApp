/* --- Configuration & Global Variables --- */
let units = "metric";
let userCity = "Philadelphia";
const unsplashKey = "3aec8sTVyLBtqALtmIS3PAZlPpcTqD7SVl1OcUp7b9M";

const DegreeUnits = { Celsius: "°C", Fahrenheit: "°F" };
const SpeedUnits = { MPH: " mph", KPH: " km/h" };

let degreesLabel = DegreeUnits.Celsius;
let speedLabel = SpeedUnits.KPH;

/* --- Helper Functions --- */
const getLocalDate = (dt) =>
  new Date(dt * 1000).toLocaleString([], {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

function getCardinalDirection(angle) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(angle / 45) % 8];
}

/* --- Weather Object --- */
let weather = {
  apiKey: "82005d27a116c2880c8f0fcb866998a0",

  fetchWeather: function (city) {
    // 1. Add "loading" class to .weather
    $(".weather").addClass("loading");

    // 2. Use $.getJSON to call OpenWeather 'weather' endpoint
    $.getJSON(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${this.apiKey}`,
    )
      .done((data) => {
        // 3. On success, update userCity, call displayWeather and fetchForecast
        userCity = data.name;
        this.displayWeather(data);
        this.fetchForecast(city);
      })
      .fail(() => {
        // 4. On failure, update .city text to "City not found" and remove loading class
        $(".city").text("City not found");
        $(".weather").removeClass("loading");
      });
  },

  displayWeather: function (data) {
    // 5. Destructure properties from 'data'
    const { name } = data;
    const { temp, humidity } = data.main;
    const { description, icon } = data.weather[0];
    const { speed, deg } = data.wind;

    // 6. Update the DOM elements
    $(".city").text(`Weather in ${name}`);
    $(".temp").html(`${Math.round(temp)}${degreesLabel}`);
    $(".description").text(description);
    $(".humidity").text(`Humidity: ${humidity}%`);
    $(".wind").text(`Wind: ${speed}${speedLabel} ${getCardinalDirection(deg)}`);
    $(".icon").attr("src", `https://openweathermap.org/img/wn/${icon}@2x.png`);
    $(".icon").attr("alt", description);

    // 7. Use $.getJSON to fetch a background image from Unsplash
    $.getJSON(
      `https://api.unsplash.com/photos/random?query=${description}&client_id=${unsplashKey}`,
    ).done((imgData) => {
      if (imgData && imgData.urls && imgData.urls.regular) {
        $("body").css("background-image", `url(${imgData.urls.regular})`);
      }
    });

    // 8. Remove the "loading" class from .weather
    $(".weather").removeClass("loading");
  },

  fetchForecast: function (city) {
    // 9. Use $.getJSON to call OpenWeather 'forecast' endpoint
    $.getJSON(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${this.apiKey}`,
    ).done((data) => {
      // 10. On success, call displayHourly and displayDaily
      this.displayHourly(data.list);
      this.displayDaily(data.list);
    });
  },

  displayHourly: function (list) {
    const $container = $(".hourly-forecast");
    $container.empty();

    // 11. Slice the first 10 items of the list
    const first10 = list.slice(0, 10);

    // 12. Loop through items and append them to the container
    first10.forEach((item) => {
      const time = getLocalDate(item.dt);
      const temp = Math.round(item.main.temp);
      const icon = item.weather[0].icon;
      const description = item.weather[0].description;

      const hourlyHTML = `
                <div class="hourly-item">
                    <div class="hour">${time}</div>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" />
                    <div class="hour-temp">${temp}${degreesLabel}</div>
                </div>
            `;
      $container.append(hourlyHTML);
    });
  },

  displayDaily: function (list) {
    const $container = $(".daily-forecast");
    $container.empty();

    // 13. Loop through the list (i += 8) to get one reading per day (every 24h)
    for (let i = 0; i < list.length; i += 8) {
      const item = list[i];
      const date = new Date(item.dt * 1000).toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      const temp = Math.round(item.main.temp);
      const icon = item.weather[0].icon;
      const description = item.weather[0].description;

      // 14. Append the daily items to the container
      const dailyHTML = `
                <div class="daily-item">
                    <div class="day">${date}</div>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" />
                    <div class="day-temp">${temp}${degreesLabel}</div>
                </div>
            `;
      $container.append(dailyHTML);
    }
  },

  search: function () {
    // 15. Get the value from the .search-bar, fetch weather, then clear the input
    const city = $(".search-bar").val().trim();
    if (city) {
      this.fetchWeather(city);
      $(".search-bar").val("");
    }
  },
};

/* --- Geolocation --- */
function fetchUserCity() {
  const geoApiKey = "841afa96ceb940da8f6157a7f16cc527";

  // 16. Use $.getJSON with geoApiKey to find the user's city
  $.getJSON(`https://api.ipgeolocation.io/ipgeo?apiKey=${geoApiKey}`)
    .done((data) => {
      if (data && data.city) {
        userCity = data.city;
      }
    })
    // 17. Use .always() to ensure weather.fetchWeather runs regardless of success
    .always(() => {
      weather.fetchWeather(userCity);
    });
}

/* --- App Initialization --- */
$(function () {
  fetchUserCity();

  // 18. Add a click listener to .temp to toggle between Metric and Imperial
  $(".temp").on("click", function () {
    if (units === "metric") {
      units = "imperial";
      degreesLabel = DegreeUnits.Fahrenheit;
      speedLabel = SpeedUnits.MPH;
    } else {
      units = "metric";
      degreesLabel = DegreeUnits.Celsius;
      speedLabel = SpeedUnits.KPH;
    }
    weather.fetchWeather(userCity);
  });

  // 19. Add event listeners for the search button and the "Enter" key
  $(".search button").on("click", function () {
    weather.search();
  });

  $(".search-bar").on("keypress", function (e) {
    if (e.key === "Enter") {
      weather.search();
    }
  });
});
