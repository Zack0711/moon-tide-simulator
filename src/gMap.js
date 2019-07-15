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
  }
}

class GMap {
  constructor(mapInstance, panelInstance, settings){
    this.mapInstance = mapInstance;
    this.panelInstance = panelInstance;
    this.settings = Object.assign({}, defaultSettings.map, settings);
    this.Popup = createPopupClass();

    this.initMap();
  }

  initMap() {
    this.map = new google.maps.Map(this.mapInstance, this.settings);   
    this.directionsService = new google.maps.DirectionsService;
    this.directionsDisplay = new google.maps.DirectionsRenderer({map: this.map, panel: this.panelInstance });
    this.panorama = new google.maps.StreetViewPanorama(this.mapInstance, defaultSettings.streeView);

  }
}

export default GMap;