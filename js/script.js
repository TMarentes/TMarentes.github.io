const GOOGLE_API_KEY = 'AIzaSyA4s3Ww8OSfqUtEZ8n_w7bY-pYAGCJZW6o';

var map = null;
var markers = [];

function rad(x) {
    return x * Math.PI / 180;
}

function findClosestMarker(lat, lng) {
    const R = 6371;
    var distances = [];
    var closest = -1;
    for (let i = 0; i < markers.length; i++) {
        var mlat = markers[i].position.lat();
        var mlng = markers[i].position.lng();
        var dLat  = rad(mlat - lat);
        var dLong = rad(mlng - lng);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(rad(lat)) * Math.cos(rad(lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        distances[i] = d;
        if ((closest == -1) || (d < distances[closest])) {
            closest = i;
        }
    }

    return markers[closest];
}

function startInitMap() {
    const mapOptions = {
        zoom: 4,
        center: {
            lat: -27.000000,
            lng: 144.000000
        }
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            mapOptions.zoom = 10;
            mapOptions.center = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }

            initMap(mapOptions);
        }, function() {
            initMap(mapOptions);
        });
    } else {
        initMap(mapOptions);
    }
}

function initMap(mapOptions) {
    map = new google.maps.Map(document.getElementById('map'), mapOptions);

    fetch('data/locations.json')
        .then((response) => {
            return response.json();
        })
        .then((locations) => {
            locations.forEach(function(item) {
                fetch('https://maps.googleapis.com/maps/api/geocode/json?key=' + GOOGLE_API_KEY + '&address=' + encodeURIComponent(item.address))
                    .then((response) => {
                        return response.json();
                    })
                    .then((location) => {
                        if (!location.results.length) {
                            return;
                        }

                        const marker = new google.maps.Marker({
                            map: map,
                            position: location.results[0].geometry.location,
                            title: item.name
                        });

                        const infoWindow = new google.maps.InfoWindow({
                            content: '<b>' + item.name + '</b><br /><br />'
                                + item.address
                        });

                        marker.addListener('click', function() {
                            infoWindow.open({
                                anchor: marker,
                                map,
                                shouldFocus: false,
                            });
                        });

                        markers.push(marker);
                    });
            });
        });
}

document.querySelector('.search-input').addEventListener('keyup', function(e) {
    if (!this.checkValidity()) {
        return;
    }

    fetch('https://maps.googleapis.com/maps/api/geocode/json?key=' + GOOGLE_API_KEY + '&address=' + encodeURIComponent('Australia ' + this.value))
        .then((response) => {
            return response.json();
        })
        .then((location) => {
            if (!location.results.length) {
                return;
            }

            const closestMarker = findClosestMarker(location.results[0].geometry.location.lat, location.results[0].geometry.location.lng);

            map.setCenter({
                lat: closestMarker.position.lat(),
                lng: closestMarker.position.lng(),
            });
        });
});

