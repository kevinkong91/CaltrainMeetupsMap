var map
var styles = [
  {
      "featureType": "administrative.locality",
      "elementType": "all",
      "stylers": [
          {
              "hue": "#ff0200"
          },
          {
              "saturation": 7
          },
          {
              "lightness": 19
          },
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "administrative.locality",
      "elementType": "labels.text",
      "stylers": [
          {
              "visibility": "on"
          },
          {
              "saturation": "-3"
          }
      ]
  },
  {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [
          {
              "color": "#748ca3"
          }
      ]
  },
  {
      "featureType": "landscape",
      "elementType": "all",
      "stylers": [
          {
              "hue": "#ff0200"
          },
          {
              "saturation": -100
          },
          {
              "lightness": 100
          },
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [
          {
              "hue": "#ff0200"
          },
          {
              "saturation": "23"
          },
          {
              "lightness": "20"
          },
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "poi.school",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "color": "#ffdbda"
          },
          {
              "saturation": "0"
          },
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
          {
              "hue": "#ff0200"
          },
          {
              "saturation": "100"
          },
          {
              "lightness": 31
          },
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "color": "#f39247"
          },
          {
              "saturation": "0"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "labels",
      "stylers": [
          {
              "hue": "#008eff"
          },
          {
              "saturation": -93
          },
          {
              "lightness": 31
          },
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "road.arterial",
      "elementType": "geometry.stroke",
      "stylers": [
          {
              "visibility": "on"
          },
          {
              "color": "#ffe5e5"
          },
          {
              "saturation": "0"
          }
      ]
  },
  {
      "featureType": "road.arterial",
      "elementType": "labels",
      "stylers": [
          {
              "hue": "#bbc0c4"
          },
          {
              "saturation": -93
          },
          {
              "lightness": -2
          },
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "road.arterial",
      "elementType": "labels.text",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "road.local",
      "elementType": "geometry",
      "stylers": [
          {
              "hue": "#ff0200"
          },
          {
              "saturation": -90
          },
          {
              "lightness": -8
          },
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [
          {
              "hue": "#e9ebed"
          },
          {
              "saturation": 10
          },
          {
              "lightness": 69
          },
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "water",
      "elementType": "all",
      "stylers": [
          {
              "hue": "#e9ebed"
          },
          {
              "saturation": -78
          },
          {
              "lightness": 67
          },
          {
              "visibility": "simplified"
          }
      ]
  }
]

var ViewModel = function () {
  var self = this

  this.searchQuery = ko.observable('')  
  this.stationsList = ko.observableArray([])

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.6021349, lng: -122.275478},
    zoom: 10,
    styles: styles,
    mapTypeControl: false
  })

  data.stops.forEach(function(station) {
    var newStation = new Station(station)
    self.stationsList.push(newStation)
    newStation.showMarker()
  })

  var searchBox = new google.maps.places.SearchBox(document.getElementById('search-within-time-text'));
  searchBox.setBounds(map.getBounds())

  this.toggleStationsList = function() {
    $('.stations-box').slideToggle()
  }

  this.toggleFilterOptions = function() {
    $('.filter-options').slideToggle()
  }

  this.clearFilters = function() {
    this.searchQuery('')
    this.selectedZone(null)
    this.stationsList().forEach(function(station) {
      station.infoWindow.close()
    })
  }

  // this.listToggle = function() {
  //   if(self.toggleSymbol() === 'hide') {
  //       self.toggleSymbol('show');
  //   } else {
  //       self.toggleSymbol('hide');
  //   }
  // }

  this.selectStation = function(station) {
    map.setCenter(station.marker.position)
    map.setZoom(13)
    self.hideAllInfoWindows()
    station.showInfoWindow()
  }

  this.hideAllInfoWindows = function() {
    self.stationsList().forEach(function(station) {
      station.infoWindow.close()
    })
  }

  this.hideMarkers = function() {
    self.stationsList().forEach(function(station) {
      station.visible(false)
    })
  }

  // Zones
  this.zones = ko.observableArray([ 1, 2, 3, 4 ])
  this.selectedZone = ko.observable()

  // Search Within Time
  this.stationsWithinTime = ko.observableArray([])

  this.searchWithinTime = function() {
    self.stationsWithinTime([])
    var distanceMatrixService = new google.maps.DistanceMatrixService
    var address = $('#search-within-time-text').val()
    
    if (address == '') {
      window.alert('You must enter an address.')
    } else {
      self.hideMarkers()
      // Use the distance matrix service to calculate the duration of the
      // routes between all our markers, and the destination address entered
      // by the user. Then put all the origins into an origin matrix.
      var mode = $('#mode').val()
      var origins = self.stationsList().map(function(station) {
        return station.marker.position
      })
      distanceMatrixService.getDistanceMatrix({
        origins: origins,
        destinations: [address],
        travelMode: google.maps.TravelMode[mode],
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      }, function(response, status) {
        if (status !== google.maps.DistanceMatrixStatus.OK) {
          window.alert('Error was: ' + status)
        } else {
          self.displayMarkersWithinTime(response)
        }
      })
    }
  }

  this.displayMarkersWithinTime = function(response) {
    var maxDuration = $('#max-duration').val()
    var origins = response.originAddresses
    // Parse through the results, and get the distance and duration of each.
    // Because there might be  multiple origins and destinations we have a nested loop
    // Then, make sure at least 1 result was found.
    var atLeastOne = false
    var bounds = new google.maps.LatLngBounds()
    for (var i = 0; i < origins.length; i++) {
      var results = response.rows[i].elements
      results.forEach( function(element) {
        if (element.status === "OK") {
          // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
          // the function to show markers within a user-entered DISTANCE, we would need the
          // value for distance, but for now we only need the text.
          var distanceText = element.distance.text
          // Duration value is given in seconds so we make it MINUTES. We need both the value
          // and the text.
          var duration = element.duration.value / 60
          var durationText = element.duration.text
          if (duration <= maxDuration) {
            //the origin [i] should = the markers[i]
            self.stationsList()[i].visible(true)
            atLeastOne = true
            // Create a mini infowindow to open immediately and contain the
            // distance and duration
            var content = durationText + ' away, ' + distanceText
            self.stationsList()[i].showInfoWindow(content)
          }
        }
      })
    }
    if (!atLeastOne) {
      window.alert('We could not find any locations within that distance!');
    }
  }

  // Searches for what user typed in the input bar using the locationlist array.
  // Only displaying the exact item results that user type if available in the locationlist array.
  this.filteredList = ko.computed( function() {
    return ko.utils.arrayFilter(self.stationsList(), function(station) {
      var resultZone = true
      var resultFilter = true
      if (typeof self.selectedZone() === 'number') {
        resultZone = (self.selectedZone() == station.zoneId)
      }
      var filter = self.searchQuery().toLowerCase()
      if (filter) {
        var string = station.name.toLowerCase()
        resultFilter = (string.search(filter) >= 0)
      }
      var result = resultZone && resultFilter
      station.visible(result)
      return result
    })
  }, self)
}

function initApp() {
  ko.applyBindings(new ViewModel())
}
