import './styles/main.scss';
import "@babel/polyfill";

import tooltip from 'bootstrap/js/dist/tooltip';
import $ from 'jquery';

import {
  pathCoordsB1,
  pathCoordsB2,
  pathCoordsR1,
} from './settings'

import {
  loc_circ,
} from './eclipse'

import {
  locationList,
  locationData,
} from './locations'

import {
  drawChart,
} from './chart'

import {
  createPopupClass,
} from './popup'

import GMap from './gMap';

let activePos = locationList[0];

const btnRouteDrive = document.querySelector('.route-panel .btn-route-drive');
const btnRouteMRT = document.querySelector('.route-panel .btn-route-mrt');
const btnStreetView = document.querySelector('.btn-streeview');

const setting = {
  center: locationList[4].pos,
  zoom: 9,
  zoomControl: true,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
}

//const start = { lat: 25.0339687, lng: 121.5622835}
const start = { lat: 25.0478142, lng: 121.5169488};
const end = { lat: 23.4791187, lng: 120.4411382};

const locationContent = document.getElementById('location-content');

let shouldShowStreetView = false;
let travelMode = 'DRIVING';
let directionsService = null;
let directionsDisplay = null;
let stepDisplay = null;
let markerArray =[];
let map = null;
let panorama = null;
let Popup = null;
let popup = null;
let activePanelVal = 0;

let gMap = null;

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
  activePanelVal = n;
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

    btnRouteDrive.disabled = false;
    btnRouteMRT.disabled = false;

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
    濕度：${main.humidity}%
  `
}

const getCSVData = url => new Promise( async resolve => {
  const dataArr = await fetch(url).then(rsp => rsp.text().then( txt => txt.split(/\r?\n/)));
  const dataObj = {
    title: dataArr[0].split(','),
    list: [],
    url, 
  };

  for(let i = 1; i < dataArr.length; i += 1){
    const data = dataArr[i].split(',');
    const newData = {};
    data.forEach( (d, i) => { newData[dataObj.title[i].replace(/\"/g, '')] = d.replace(/\"/g, '')});
    dataObj.list.push(newData);
  }
  resolve(dataObj);  
})

const getHistoryData = async () => {
  //const csvList = locationData[activePos.index].map( d => getCSVData(d));
  const monthData = await Promise.all(locationData[activePos.index].month.map( d => getCSVData(d)));
  const dayData = await Promise.all(locationData[activePos.index].day.map( d => getCSVData(d)));
  drawChart(activePos, {monthData, dayData});
}

const setPanorama = () => {
  panorama.setPosition(activePos.pos);
}

const setActiveMarker = () => {
  const infoTitle = document.querySelector('.info-panel h3');
  const pos = activePos.pos;

  map.setCenter(pos);
  infoTitle.innerHTML = activePos.title;
  setPanorama();
  getHistoryData();
  getWeatherData(activePos.pos);
  if(activePanelVal === 1){
    showDirection();
  }
}

const showDirection = async () => {
  const current = await getCurrentPosition();
  const origin = current || start;

  btnRouteDrive.disabled = true;
  btnRouteMRT.disabled = true;

  calculateAndDisplayRoute(directionsDisplay, directionsService, markerArray, stepDisplay, map, origin, activePos.pos);  
}

const eclipseRest = () => {
  const pos = activePos.pos;
  const {
    html,
    eclipseDate
  } = loc_circ(pos.lat, pos.lng);

  activePos.eclipseDate = eclipseDate;
  panelData['eclipse'].panel.innerHTML = html;
  $('.eclipse-panel .label-ec').tooltip({ boundary: 'window' });

  clearMarker(markerArray);
  directionsDisplay.setDirections({routes: []});
  map.setCenter(pos);
  map.setZoom(9);  
}

const weatherReset = () => {
  const pos = activePos.pos;
  clearMarker(markerArray);
  directionsDisplay.setDirections({routes: []});
  map.setCenter(pos);
  map.setZoom(9);
  getWeatherData(pos)  
}

const initMap = () => {
  gMap = new GMap(document.getElementById('map'), document.getElementById('right-panel'), setting);
  map = new google.maps.Map(document.getElementById('map'), setting);

  locationList.forEach( d => {
    const image = {
      url: './Space_11-512.png',
      // This marker is 20 pixels wide by 32 pixels high.
      size: new google.maps.Size(512, 512),
      // The origin for this image is (0, 0).
      origin: new google.maps.Point(0, 0),
      // The anchor for this image is the base of the flagpole at (0, 32).
      anchor: new google.maps.Point(12, 12),
      scaledSize: new google.maps.Size(24, 24),
    };    

    const marker = new google.maps.Marker({
      position: d.pos,
      map: map,
      title: d.title,
      id: d.id,
      //icon: image,
    });

    marker.addListener('click', () => {
      const {
        eclipseDate
      } = loc_circ(d.pos.lat, d.pos.lng);
      activePos = d;
      activePos.eclipseDate = eclipseDate;
      locationContent.innerText = activePos.title;
      popup.position = new google.maps.LatLng(activePos.pos.lat, activePos.pos.lng);
      setActiveMarker();
      //switchPanel(0);      
    })

  })

  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer({map: map, panel: document.getElementById('right-panel')});

  locationContent.innerText = activePos.title;
  Popup = createPopupClass();
  popup = new Popup( new google.maps.LatLng(activePos.pos.lat, activePos.pos.lng), locationContent);

  popup.setMap(map);

  stepDisplay = new google.maps.InfoWindow;
  markerArray = [];

  addEclipseLine(map);

  panelData['route'].switchCall = showDirection;
  panelData['eclipse'].switchCall = eclipseRest;
  panelData['weather'].switchCall = weatherReset;

  panorama = new google.maps.StreetViewPanorama(
    document.getElementById('map'), {
      visible: false,
      addressControl: false,
      linksControl: false,
      panControl: false,
      enableCloseButton: false,
      fullscreenControl: false,
  });
  

  setActiveMarker();
  switchPanel(0);
}

btnRouteDrive.onclick = () => {
  if(travelMode !== 'DRIVING'){
    travelMode = 'DRIVING';
    btnRouteMRT.classList.remove('active');
    btnRouteDrive.classList.add('active');
    showDirection();
  }
}

btnRouteMRT.onclick = () => {
  if(travelMode !== 'TRANSIT'){
    travelMode = 'TRANSIT';
    btnRouteDrive.classList.remove('active');
    btnRouteMRT.classList.add('active');
    showDirection();
  }
}

btnStreetView.onclick = () => {
  shouldShowStreetView = !shouldShowStreetView;
  btnStreetView.classList.toggle('active');

  panorama.setVisible(shouldShowStreetView);
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
    const eclipseTime = new Date(activePos.eclipseDate.c2);
    const currentTime = new Date();
    const left = activePos.eclipseDate.c2/1000 - currentTime.getTime()/1000;

    const secs = Math.floor(left % 60);
    const mins = Math.floor(left/60) % 60;
    const hours = Math.floor(left/60/60) % 24;
    const days = Math.floor(left/60/60/24);

    document.querySelector('.time-remain').innerHTML = `
      <h3>倒數${days}天${hours}時${mins}分${secs}秒</h3>
    `;
  }, 1000)
}
