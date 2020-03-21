import {
  createPopupClass,
} from './popup'

const defaultSettings = {
  map: {
    zoom: 9,
    zoomControl: true,
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false,
  },
  streeView: {
    visible: false,
    addressControl: false,
    linksControl: false,
    panControl: false,
    enableCloseButton: false,
    fullscreenControl: false,    
  },
  start: { lat: 25.0478142, lng: 121.5169488},
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
});

const clearMarker = markerArray => {
  for (let i = 0; i < markerArray.length; i++) {
    markerArray[i].setMap(null);
  }  
}

const calculateAndDisplayRoute = (directionsDisplay, directionsService,markerArray, stepDisplay, map, start, end, travelMode = 'DRIVING') => {
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

    //btnRouteDrive.disabled = false;
    //btnRouteMRT.disabled = false;

    if (status === 'OK') {
      //document.getElementById('warnings-panel').innerHTML = '<b>' + response.routes[0].warnings + '</b>';
      directionsDisplay.setDirections(response);

      displayRoute(start, end, directionsService, directionsDisplay);
      //showSteps(response, markerArray, stepDisplay, map);
    } else {

      console.log('Directions request failed due to ' + status);
      directionsService.route({
        origin: defaultSettings.start,
        destination: end,
        travelMode,
      }, (response, status) => {
        directionsDisplay.setDirections(response);
        if (status === 'OK') {
          displayRoute(start, end, directionsService, directionsDisplay);
        }
      })

    }
  });
}

const displayRoute = (origin, destination, service, display) => {
  service.route({
    origin: origin,
    destination: destination,
    travelMode: 'DRIVING',
  }, function(response, status) {
    if (status === 'OK') {
      display.setDirections(response);
    } else {
    //  alert('Could not display directions due to: ' + status);
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

class GMap {
  constructor(instance, settings){
    this.mapInstance = instance.map;
    this.panelInstance = instance.panel;
    this.popupInstance = instance.popup;

    this.settings = Object.assign({}, defaultSettings.map, settings);
    this.markerArray = [];
    this.travelMode = 'DRIVING';
    //this.Popup = createPopupClass();

    this.initMap = this.initMap.bind(this);
    this.addMarker = this.addMarker.bind(this);
    this.getPos = this.getPos.bind(this);
    this.setPanorama = this.setPanorama.bind(this);

    this.clearMarker = this.clearMarker.bind(this);

    window.addEventListener("load", this.initMap);
  }

  getPos(lat = 0, lng = 0) {
    return new google.maps.LatLng(lat, lng)
  }

  moveMap(pos) {
    this.map.setCenter(pos)
  }

  zoomMap(scale) {
    this.map.setZoom(scale);
  }

  movePopup(lat = 23.4811899, lng = 120.4419393) {
    this.popup.position = this.getPos(lat, lng);
    this.popup.draw();
  }

  addMarker(data, clickCallBack) {
    const newMarker = new google.maps.Marker(Object.assign({ map: this.map }, data));
    newMarker.addListener('click', () => {
      this.movePopup(data.position.lat, data.position.lng);
      if(typeof clickCallBack === 'function') clickCallBack(data);
    })
  }

  clearMarker() {
    clearMarker(this.markerArray);
  }

  drawPath(data) {
    const newPath = new google.maps.Polyline(data);
    newPath.setMap(this.map);
  }

  setDirections(data) {
    const rData = {
      request: {
        travelMode: 'DRIVING',
      }
    }
    this.directionsDisplay.setDirections(Object.assign({}, rData, data));
  }

  setPanorama(pos) {
    this.panorama.setPosition(pos);
  }

  async showDirection(end) {
    let current = null
    try{
      current = await getCurrentPosition();
    }catch(e){
      current = null
    }

    const origin = current || defaultSettings.start;
    calculateAndDisplayRoute(
      this.directionsDisplay, 
      this.directionsService, 
      this.markerArray, 
      this.stepDisplay, 
      this.map, 
      origin, 
      end, 
      this.travelMode
    );  
  }

  initMap() {
    const Popup = createPopupClass();

    this.map = new google.maps.Map(this.mapInstance, this.settings);
    this.panorama = new google.maps.StreetViewPanorama(this.mapInstance, defaultSettings.streeView);

    this.directionsService = new google.maps.DirectionsService;
    this.directionsDisplay = new google.maps.DirectionsRenderer({
      draggable: true,
      map: this.map, 
      panel: this.panelInstance
    });

    this.popup = new Popup( this.getPos(23.4811899, 120.4419393), this.popupInstance);
    this.popup.setMap(this.map);
  }
}

export default GMap;