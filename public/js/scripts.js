const socket = io()

if(navigator.geolocation) {
    navigator.geolocation.watchPosition(
        // callback
        (position) => {
        const { latitude, longitude } = position.coords
        socket.emit('send-location', { latitude, longitude })

        },
        // error
        (error) => {
            console.error(error)
        },
        // options
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    )
}

const map = L.map('map').setView([0,0], 16)

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: 'Tejas'
    }
).addTo(map)

const markers = {}

socket.on('recieve-location', ({id, latitude, longitude}) => {
    map.setView([latitude, longitude])

    if(markers[id]) {
        markers[id].setLatLng([latitude, longitude])
    }
    else {
        markers[id] = L.marker([latitude, longitude]).addTo(map)
    }

    // get the current user's marker
    const currentUserMarker = markers[socket.id]

    // if the current user's marker exists, draw a route to the new marker
    if (currentUserMarker) {
        Object.keys(markers).forEach(id => {
            if(id != socket.id) {
                drawRoute(currentUserMarker.getLatLng(), markers[id].getLatLng())
            }
        })
    }
})

socket.on('user-disconnected', (id) => {
    if(markers[id]) {
        map.removeLayer(markers[id])
        delete markers[id]
    }
})

// function to draw a route between two points
function drawRoute(from, to) {
    L.Routing.control({
        waypoints: [
            L.latLng(from.lat, from.lng),
            L.latLng(to.lat, to.lng)
        ],
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        routeWhileDragging: false
    }).addTo(map)
}