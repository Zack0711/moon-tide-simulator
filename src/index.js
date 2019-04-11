import './styles/main.scss';
import "@babel/polyfill";

import {
  pathCoordsB1,
  pathCoordsB2,
  pathCoordsR1,
} from './settings'

import {
  loc_circ,
} from './eclipse'

const location = [
  {
    title: '嘉義火車站',
    pos: {lat: 23.4791187, lng: 120.4411382},
  },
  {
    title: '東石漁人碼頭',
    pos: {lat: 23.4435527, lng: 120.1735535},
  },
  {
    title: '竹崎親水公園',
    pos: {lat: 23.4721895, lng: 120.5697513},    
  },
  {
    title: '太興岩步道停車場',
    pos: {lat: 23.4777343, lng: 120.5927781},
  }
]

let activePos = location[0];

const setting = {
  center: location[0].pos,
  zoom: 10,
  disableDefaultUI: true,
}

//const start = { lat: 25.0339687, lng: 121.5622835}
const start = { lat: 23.4687991, lng: 120.4851352}
const end = { lat: 23.4791187, lng: 120.4411382}
const travelMode = 'DRIVING';

const panelData = {
  eclipse: {
    navBtn: document.querySelector('.btn-eclipse'),
    panel: document.querySelector('.eclipse-panel'),
    switchCall: null,
  },
  route: {
    navBtn: document.querySelector('.btn-route'),
    panel: document.querySelector('.route-panel'),
    switchCall: null,
  },
  weather: {
    navBtn: document.querySelector('.btn-weather'),
    panel: document.querySelector('.weather-panel'),
    switchCall: null,
  },
}

const weatherInfo = document.querySelector('.weather-info');

const panelList = [ 'eclipse', 'route', 'weather',]

const switchPanel = n => {
  const active = panelList[n]
  const activePanel = panelData[active].panel;
  const activeBtn = panelData[active].navBtn;

  panelList.forEach( d => {
    const {
      navBtn,
      panel,
      switchCall,
    } = panelData[d];

    if(navBtn === activeBtn){
      navBtn.classList.add('active');
    }else{
      navBtn.classList.remove('active');      
    }

    if(panel === activePanel){
      panel.classList.remove('d-none');
      if(typeof switchCall === 'function') switchCall();
    }else{
      panel.classList.add('d-none');      
    }
  })
}

const clearMarker = markerArray => {
  for (let i = 0; i < markerArray.length; i++) {
    markerArray[i].setMap(null);
  }  
}

const getCurrentPosition = () => new Promise( resolve => {
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition( position => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude        
      }
      resolve(pos)
    }
    ,() => resolve(null))
  }
})

const calculateAndDisplayRoute = (directionsDisplay, directionsService,markerArray, stepDisplay, map, start, end) => {
  // First, remove any existing markers from the map.
  clearMarker(markerArray);

  // Retrieve the start and end locations and create a DirectionsRequest using
  // WALKING directions.
  directionsService.route({
    origin: start,
    destination: end,
    travelMode,
  }, (response, status) => {
    // Route the directions and pass the response to a function to create
    // markers for each step.
    if (status === 'OK') {
      //document.getElementById('warnings-panel').innerHTML = '<b>' + response.routes[0].warnings + '</b>';
      directionsDisplay.setDirections(response);

      showSteps(response, markerArray, stepDisplay, map);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}

const showSteps = (directionResult, markerArray, stepDisplay, map) => {
  // For each step, place a marker, and add the text to the marker's infowindow.
  // Also attach the marker to an array so we can keep track of it and remove it
  // when calculating new routes.
  const myRoute = directionResult.routes[0].legs[0];
  for (let i = 0; i < myRoute.steps.length; i++) {
    const marker = markerArray[i] = markerArray[i] || new google.maps.Marker;
    marker.setMap(map);
    marker.setPosition(myRoute.steps[i].start_location);
    attachInstructionText(stepDisplay, marker, myRoute.steps[i].instructions, map);
  }
}

const attachInstructionText = (stepDisplay, marker, text, map) =>{
  google.maps.event.addListener(marker, 'click', function() {
    // Open an info window when the marker is clicked on, containing the text
    // of the step.
    stepDisplay.setContent(text);
    stepDisplay.open(map, marker);
  });
}

const addEclipseLine = map => {
  const bluePath1 = new google.maps.Polyline({
    path: pathCoordsB1,
    geodesic: true,
    strokeColor: '#3300FF',
    strokeOpacity: 0.65,
    strokeWeight: 2
  });

  const bluePath2 = new google.maps.Polyline({
    path: pathCoordsB2,
    geodesic: true,
    strokeColor: '#3300FF',
    strokeOpacity: 0.65,
    strokeWeight: 2
  });

  const redPath1 = new google.maps.Polyline({
    path: pathCoordsR1,
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 0.65,
    strokeWeight: 2
  });

  bluePath1.setMap(map);
  bluePath2.setMap(map);
  redPath1.setMap(map);
}

const getWeatherData = async pos => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${pos.lat}&lon=${pos.lng}&appid=e99ff4972d3316c9f00c76a7bd535a92`;
  const requestOption = {}

  const {
    main,
    clouds,
    weather,
  } = await fetch(url, requestOption).then( rsp => rsp.json());

  weatherInfo.innerHTML = `
    氣溫：${(main.temp - 273.15).toFixed(2)}°C, 
    濕度：${main.humidity}%,
    ${weather[0].description}
  `
}

const setActiveMarker = () => {
  const infoTitle = document.querySelector('.info-panel h3');
  infoTitle.innerHTML = activePos.title;
  getWeatherData(activePos.pos)
}

const initMap = () => {
  const map = new google.maps.Map(document.getElementById('map'), setting);

  location.forEach( d => {
    const marker = new google.maps.Marker({
      position: d.pos,
      map: map,
      title: d.title,
    });

    marker.addListener('click', () => {
      activePos = d;
      setActiveMarker();
      switchPanel(0);      
    })

  })

  const directionsService = new google.maps.DirectionsService;
  const directionsDisplay = new google.maps.DirectionsRenderer({map: map, panel: document.getElementById('right-panel')});

  const stepDisplay = new google.maps.InfoWindow;
  let markerArray = [];

  addEclipseLine(map);
  panelData['route'].switchCall = async () => {
    const current = await getCurrentPosition();
    const origin = current || start;
    calculateAndDisplayRoute(directionsDisplay, directionsService, markerArray, stepDisplay, map, origin, activePos.pos);
  }

  panelData['eclipse'].switchCall = () => {
    const pos = activePos.pos;
    panelData['eclipse'].panel.innerHTML = loc_circ(pos.lat, pos.lng);
    clearMarker(markerArray);
    directionsDisplay.setDirections({routes: []});
    map.setCenter(pos);
    map.setZoom(10);
  }

  panelData['weather'].switchCall = () => {
    const pos = activePos.pos;
    clearMarker(markerArray);
    directionsDisplay.setDirections({routes: []});
    map.setCenter(pos);
    map.setZoom(10);

    getWeatherData(pos)
  }

  setActiveMarker();
  switchPanel(0);
}

panelList.forEach( (d, i) => {
  const navBtn = panelData[d].navBtn;
  navBtn.onclick = () => {
    if(!navBtn.classList.contains('active'))switchPanel(i);
  }
})

window.onload = () => {
  initMap();
  setInterval(() => {
    const currentTime = new Date();
    const left = 1591735800 - currentTime.getTime()/1000;

    const secs = Math.floor(left % 60);
    const mins = Math.floor(left/60) % 60;
    const hours = Math.floor(left/60/60) % 24;
    const days = Math.floor(left/60/60/24);

    document.querySelector('.time-remain').innerHTML = `
      <h3>${days}天${hours}時${mins}分${secs}秒</h3>
    `;
  }, 1000)
}
