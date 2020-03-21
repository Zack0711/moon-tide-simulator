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

const DEFAULT_ZOOM = 8

let activePos = locationList[0];

const btnRouteDrive = document.querySelector('.route-panel .btn-route-drive');
const btnRouteMRT = document.querySelector('.route-panel .btn-route-mrt');
const btnStreetView = document.querySelector('.btn-streeview');

const setting = {
  center: locationList[4].pos,
  zoom: DEFAULT_ZOOM,
  zoomControl: true,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
}

const locationContent = document.getElementById('location-content');

let shouldShowStreetView = false;
let stepDisplay = null;
let activePanelVal = 0;

const instance = {
  map: document.getElementById('map'),
  panel: document.getElementById('right-panel'),
  popup: document.getElementById('location-content'),
}

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

const gMap = new GMap(instance);

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

const addEclipseLine = () => {
  gMap.drawPath({
    path: pathCoordsB1,
    geodesic: true,
    strokeColor: '#3300FF',
    strokeOpacity: 0.65,
    strokeWeight: 2    
  })

  gMap.drawPath({
    path: pathCoordsB2,
    geodesic: true,
    strokeColor: '#3300FF',
    strokeOpacity: 0.65,
    strokeWeight: 2
  })

  gMap.drawPath({
    path: pathCoordsR1,
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 0.65,
    strokeWeight: 2
  })
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

const setActiveMarker = () => {
  const infoTitle = document.querySelector('.info-panel h3');
  const pos = activePos.position;

  infoTitle.innerHTML = activePos.title;
  gMap.moveMap(pos);
  gMap.setPanorama(pos);
  getHistoryData();
  getWeatherData(pos);

  if(activePanelVal === 1){
    showDirection();
  }else{
    gMap.clearMarker();
  }
}

const showDirection = () => {
  gMap.showDirection(activePos.position);
}

const eclipseRest = () => {
  const pos = activePos.position;
  const {
    eclipseDate,
    html,
  } = loc_circ(pos.lat, pos.lng);

  activePos.eclipseDate = eclipseDate;
  panelData['eclipse'].panel.innerHTML = html;
  $('.eclipse-panel .label-ec').tooltip({ boundary: 'window' });

  gMap.clearMarker();
  gMap.setDirections({routes: []});
  gMap.moveMap(pos);
  gMap.zoomMap(DEFAULT_ZOOM);
}

const weatherReset = () => {
  const pos = activePos.position;

  gMap.clearMarker();
  gMap.setDirections({routes: []});
  gMap.moveMap(pos);
  gMap.zoomMap(DEFAULT_ZOOM);

  getWeatherData(pos)  
}

const markerClick = d => {
  const {
    eclipseDate
  } = loc_circ(d.position.lat, d.position.lng);
  activePos = d;
  activePos.eclipseDate = eclipseDate;
  locationContent.innerText = activePos.title;
  setActiveMarker();  
}

const initMap = () => {

  //locationList.forEach( d => { gMap.addMarker(d, markerClick); })

  locationContent.innerText = activePos.title;

  stepDisplay = new google.maps.InfoWindow;
  //addEclipseLine();

  panelData['route'].switchCall = showDirection;
  panelData['eclipse'].switchCall = eclipseRest;
  panelData['weather'].switchCall = weatherReset;

  //setActiveMarker();
  switchPanel(0);
}

const setTimePanel = () => {
  const eclipseTime = new Date(activePos.eclipseDate.c2);
  const currentTime = new Date();
  const left = activePos.eclipseDate.c2/1000 - currentTime.getTime()/1000;

  const secs = Math.floor(left % 60);
  const mins = Math.floor(left/60) % 60;
  const hours = Math.floor(left/60/60) % 24;
  const days = Math.floor(left/60/60/24);

  document.querySelector('.time-remain').innerHTML = `
    <h3>距離2020年6月21日的日環食倒數${days}天${hours}時${mins}分${secs}秒</h3>
  `;  
}

btnRouteDrive.onclick = () => {
  if(gMap.travelMode !== 'DRIVING'){
    btnRouteMRT.classList.remove('active');
    btnRouteDrive.classList.add('active');
    gMap.travelMode = 'DRIVING';
    showDirection();
  }
}

btnRouteMRT.onclick = () => {
  if(gMap.travelMode !== 'TRANSIT'){
    btnRouteDrive.classList.remove('active');
    btnRouteMRT.classList.add('active');
    gMap.travelMode = 'TRANSIT';
    showDirection();
  }
}

btnStreetView.onclick = () => {
  shouldShowStreetView = !shouldShowStreetView;
  btnStreetView.classList.toggle('active');

  btnStreetView.innerHTML = shouldShowStreetView
    ? '<i class="fa fa-map" aria-hidden="true"></i> 顯示地圖'
    : '<i class="fa fa-street-view" aria-hidden="true"></i> 顯示街景'

  gMap.panorama.setVisible(shouldShowStreetView);
}

panelList.forEach( (d, i) => {
  const navBtn = panelData[d].navBtn;
  navBtn.onclick = () => {
    if(!navBtn.classList.contains('active'))switchPanel(i);
  }
})

window.addEventListener("load", () => {
  initMap();
  //setInterval(setTimePanel, 1000)
});
