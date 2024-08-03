const socket = io()

let markers = {}
let routingControls = {}

const map = L.map('map').setView([0,0], 16)

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: 'Map'
    }
).addTo(map)

if(navigator.geolocation) {
    navigator.geolocation.watchPosition(
        // callback
        (position) => {
        const { latitude, longitude } = position.coords

        socket.emit('send-location', { latitude, longitude, routingControls, markers })

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


socket.on('recieve-location', ({id, latitude, longitude, markers, routingControls}) => {
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
                if (routingControls[id]) {
                    // Update the existing route
                    routingControls[id].setWaypoints([
                        L.latLng(currentUserMarker.getLatLng().lat, currentUserMarker.getLatLng().lng),
                        L.latLng(markers[id].getLatLng().lat, markers[id].getLatLng().lng)
                    ])
                } else {
                    // Create a new route
                    routingControls[id] = L.Routing.control({
                        waypoints: [
                            L.latLng(currentUserMarker.getLatLng().lat, currentUserMarker.getLatLng().lng),
                            L.latLng(markers[id].getLatLng().lat, markers[id].getLatLng().lng)
                        ],
                        router: L.Routing.osrmv1({
                            serviceUrl: 'https://router.project-osrm.org/route/v1'
                        }),
                        routeWhileDragging: false
                    }).addTo(map)
                }
            }
        })
    }
})

socket.on('user-disconnected', (id) => {
    if(markers[id]) {
        map.removeLayer(markers[id])
        delete routingControls[id]
        delete markers[id]
    }
})