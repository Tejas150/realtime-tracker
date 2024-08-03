// script.js

// Set up socket.io connection
const socket = io()

// Set up map and markers
const map = L.map('map').setView([0, 0], 16)
const markers = {}
const routingControls = {}
let currentMarker = null

// Set up tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map',
}).addTo(map)

const iconUrl = `assets/${getRandomNumber()}.png`
// Set up custom icon
const customIcon = {
  iconUrl: iconUrl,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -30],
  tooltipAnchor: [20, -20],
  className: 'custom-icon',
}

function getRandomNumber() {
    return Math.floor(Math.random() * 9) + 1
}

// Function to create a new marker
function createMarker(id, latitude, longitude, iconUrl) {
  const marker = L.marker([latitude, longitude], { icon: L.icon({...customIcon, iconUrl}) })

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
    }))
    currentMarker = marker
  })

  marker.addTo(map)
  markers[id] = marker

}

// Function to update a marker's position
function updateMarker(id, latitude, longitude) {
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude])
  }
}

// Function to remove a marker
function removeMarker(id) {
  if (markers[id]) {
    map.removeLayer(markers[id])
    delete markers[id]
  }
}

function removeRoute(id) {
    if (routingControls[id]) {
      map.removeLayer(routingControls[id])
      delete routingControls[id]
    }
}

// Function to reset the current marker
function resetCurrentMarker() {
  if (currentMarker) {
    customIcon.iconUrl = currentMarker.originalIconUrl
    currentMarker.setIcon(L.icon(customIcon))
    currentMarker = null
  }
}

// Function to calculate and display route between two markers
function calculateRoute(fromMarker, toMarker, id) {
  const fromLatLng = fromMarker.getLatLng()
  const toLatLng = toMarker.getLatLng()

  if(routingControls[id]) {
    routingControls[id].setWaypoints([
        L.latLng(fromLatLng.lat, fromLatLng.lng),
        L.latLng(toLatLng.lat, toLatLng.lng)
    ])
  }
  else {
      routingControls[id] = L.Routing.control({
        waypoints: [
          L.latLng(fromLatLng.lat, fromLatLng.lng),
          L.latLng(toLatLng.lat, toLatLng.lng)
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        routeWhileDragging: false,
        createMarker: function(i, wp) {
            return L.marker(wp.latLng, {
              icon: L.divIcon({
                className: 'dummy-marker',
                html: '<div style="display: none;"></div>',
                iconSize: [0, 0]
              })
            })
          }  
      }).addTo(map)
  }

}

// Set up event listeners for socket.io events
socket.on('recieve-location', ({ id, latitude, longitude, iconUrl }) => {
  map.setView([latitude, longitude])
  createMarker(id, latitude, longitude, iconUrl)

  // Calculate and display route to new marker from all existing markers
  Object.values(markers).forEach((marker) => {
    if (marker !== markers[id]) {
      calculateRoute(marker, markers[id], id)
    }
  })
})

socket.on('user-disconnected', (id) => {
  removeMarker(id)
  removeRoute(id)

})

map.on('click', () => {
    resetCurrentMarker()
})

// Set up geolocation
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      socket.emit('send-location', { latitude, longitude, iconUrl })
    },
    (error) => {
      console.error(error)
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    },
  )
}