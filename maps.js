/*global google, $ */
/* jshint -W104 */
(function () {
    "use strict";

    let search = $('#search'),
        numResultsInput = $('#numResults'),
        markers = [],
        theList = $('#picDiv ul'),
        rectangle = null,
        infoWindow = new google.maps.InfoWindow({
            maxWidth: 250
        }),
        location = { lat: -34.397, lng: 150.644 },
        clearMap = function () {
            if (markers) {
                markers.forEach(function (marker) {
                    marker.setMap(null);
                });
            }
            theList.empty();
        },
        map = new google.maps.Map(
            document.getElementById('map'),
            {
                center: location,
                zoom: 2
            }
        ),
        drawingManager = new google.maps.drawing.DrawingManager({
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT,
                drawingModes: ['marker', 'rectangle']
            },
            rectangleOptions: {
                editable: true,
            }
        });

    drawingManager.setMap(map);

    //function to handle geolocation error
    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed. check to see if you gave permission to your browser or use the search box instead' :
            'Error: Your browser doesn\'t support geolocation. Use the search box instead');
        infoWindow.open(map);
    }

    //geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setCenter(pos);
            let markerLocation = pos;
            let marker = new google.maps.Marker({
                position: markerLocation,
                map: map,
            });
            markers.push(marker);
            map.setZoom(13);
        });
    } else {
        //if user doesn't allow
        handleLocationError(false, infoWindow, map.getCenter());
    }

    google.maps.event.addListener(drawingManager, 'rectanglecomplete', function (drawing) {
        clearMap();
        rectangle = drawing;
        $.getJSON("http://api.geonames.org/wikipediaBoundingBox?",
            {
                north: drawing.getBounds().f.b,
                south: drawing.getBounds().f.f,
                east: drawing.getBounds().b.f,
                west: drawing.getBounds().b.b,
                type: 'json',
                username: 'alubowsky'
            },
            function (data) {
                getInfo(data);
            }
        );

    });

    let getInfo = function (data) {
        var bounds = new google.maps.LatLngBounds();
        data.geonames.forEach(function (location) {
            let markerLocation = { lat: location.lat, lng: location.lng };
            let marker = new google.maps.Marker({
                position: markerLocation,
                map: map,
                title: location.title,
            });
            markers.push(marker);

            bounds.extend(location);

            marker.addListener('click', function () {
                infoWindow.setContent(location.summary + '<br><a target="_blank" href="https://' + location.wikipediaUrl + '">Wikipedia</a>');
                infoWindow.open(map, marker);
            });

            $('<li><img src="' + (location.thumbnailImg || 'default.png') + '"/>' + '<h5 id="details">' + location.title + '</h5></li>')
                .appendTo(theList)
                .click(function () {
                    map.panTo(location);
                    map.setZoom(15);
                });
        });
        map.fitBounds(bounds);
    };

    $('#go').click(function () {
        clearMap();
        $.getJSON("http://api.geonames.org/wikipediaSearch?callback=?",
            {
                q: search.val(),
                maxRows: numResultsInput.val(),
                type: "json",
                username: 'alubowsky',
            },
            function (data) {
                getInfo(data);
            });

    });
}());