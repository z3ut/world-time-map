import L from 'leaflet'
import tzlookup from 'tz-lookup'
import moment from 'moment'
import 'moment-timezone'
const SunCalc = require('suncalc')

let map
let expandedCity
const cities = require('./cities.json')

initMap()
initCityMarkers()

function initMap() {
  map = L.map('map').setView([0, 0], 2)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)
}

function initCityMarkers() {
  for (let city of cities) {
    fillCityTimeData(city)
    addCityMarker(city)
  }
}

function fillCityTimeData(city) {
  city.timeZone = tzlookup(city.lat, city.lon)
  city.date = moment().tz(city.timeZone)
  city.utcOffset = city.date.utcOffset() / 60
  city.timeFormatted = city.date.format('HH:mm')
  city.dateFormatted = city.date.format('YYYY-DD-MM')
  city.sunCalcTimes = SunCalc.getTimes(new Date(), city.lat, city.lon)
  city.isNight = Date.now() < city.sunCalcTimes.sunrise ||
    city.sunCalcTimes.sunset < Date.now()
  city.isNoSunriseOrSunset = isNaN(city.sunCalcTimes.sunrise)
  city.sunriseTimeFormatted =  moment(city.sunCalcTimes.sunrise)
    .tz(city.timeZone).format('HH:mm')
  city.sunsetTimeFormatted =  moment(city.sunCalcTimes.sunset)
    .tz(city.timeZone).format('HH:mm')
}

function addCityMarker(city) {
  city.icon = createIcon(city, false)
  city.iconExpanded = createIcon(city, true)
  city.marker = L.marker([city.lat, city.lon], {
      icon: city.icon,
      riseOnHover: true,
    }).addTo(map)
    .addEventListener('click', () => {
      if (city.isExpanded) {
        collapseMarker(city)
        expandedCity = null
      } else {
        if (expandedCity) {
          collapseMarker(expandedCity)
        }
        expandMarker(city)
        expandedCity = city
      }
    })
}

function expandMarker(city) {
  city.isExpanded = true
  city.marker.setIcon(city.iconExpanded)
  city.marker.setZIndexOffset(1000)
}

function collapseMarker(city) {
  city.isExpanded = false
  city.marker.setIcon(city.icon)
  city.marker.setZIndexOffset(100)
}

function createIcon(city, isExpanded) {
  return L.divIcon({
    html: createMarkerTemplate(city, isExpanded),
    className: 'time-marker',
    iconSize: null
  })
}

function createMarkerTemplate(city, isExpanded) {
  const markerClass = city.isNoSunriseOrSunset ?
    'polar' :
    city.isNight ?
      'night' :
      'day'
  return `
    <div>
      <table class="time-table">
        <thead>
          <tr>
            <th colspan="2" class="${markerClass}">${city.timeFormatted}</th>
          </tr>
        </thead>` + (isExpanded ?
          `<tbody>
            <tr>
              <td>city</td>
              <td>${city.name}</td>
            </tr>
            <tr>
              <td>timezone</td>
              <td>${city.timeZone}</td>
            </tr>
            <tr>
              <td>UTC offset</td>
              <td>${city.utcOffset}</td>
            </tr>
            <tr>
              <td>date</td>
              <td>${city.dateFormatted}</td>
            </tr>
            <tr>
              <td>sunrise</td>
              <td>${city.isNoSunriseOrSunset ? 'none' : city.sunriseTimeFormatted}</td>
            </tr>
            <tr>
              <td>sunset</td>
              <td>${city.isNoSunriseOrSunset ? 'none' : city.sunsetTimeFormatted}</td>
            </tr>
          </tbody>` :
          '') +
         `
      </table>
    </div>
  `
}
