// script.js

// Set up socket.io connection
const socket = io();

// Set up map and markers
const map = L.map('map').setView([0, 0], 16);
const markers = {};
let currentMarker = null;

// Set up tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map',
}).addTo(map);

const iconUrl = `assets/${getRandomNumber()}.png`
// Set up custom icon
const customIcon = L.icon({
  iconUrl: iconUrl,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -30],
  tooltipAnchor: [20, -20],
  className: 'custom-icon',
});

function getRandomNumber() {
    return Math.floor(Math.random() * 9) + 1;
}

// Function to create a new marker
function createMarker(id, latitude, longitude) {
  const marker = L.marker([latitude, longitude], { icon: customIcon });
  marker.addTo(map);
  markers[id] = marker;

  // Add event listener to marker
  marker.on('click', () => {
    // Scale up the marker
    marker.setIcon(L.icon({
      iconUrl: iconUrl,
      iconSize: [100, 100],
      iconAnchor: [50, 50],
      popupAnchor: [0, -60],
      tooltipAnchor: [40, -40],
      className: 'custom-icon',
    }));
    currentMarker = marker;
  });
}

// Function to update a marker's position
function updateMarker(id, latitude, longitude) {
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  }
}

// Function to remove a marker
function removeMarker(id) {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
}

// Function to reset the current marker
function resetCurrentMarker() {
  if (currentMarker) {
    currentMarker.setIcon(customIcon);
    // currentMarker = null;
  }
}

// Set up event listeners for socket.io events
socket.on('recieve-location', ({ id, latitude, longitude }) => {
  map.setView([latitude, longitude]);
  createMarker(id, latitude, longitude);
});

socket.on('user-disconnected', (id) => {
  removeMarker(id);
});

// Set up event listener for map click
map.on('click', () => {
  resetCurrentMarker();
});

// Set up geolocation
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit('send-location', { latitude, longitude });
    },
    (error) => {
      console.error(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    },
  );
}
