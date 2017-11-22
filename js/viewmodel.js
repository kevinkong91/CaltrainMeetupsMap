var map

var ViewModel = function () {
  var self = this

  this.searchQuery = ko.observable('')  
  this.stationsList = ko.observableArray([])

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.6021349, lng: -122.275478},
    zoom: 10,
    styles: mapStyle,
    mapTypeControl: false
  })

  data.stops.forEach(function(stop) {
    var station = new Station(stop)
    station.findNearbyEvents()
    station.showMarker()
    station.marker.addListener('click', function () {
      self.selectStation(station)
    })
    self.stationsList.push(station)
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

  this.selectStation = function(station) {
    map.setCenter(station.marker.position)
    map.setZoom(12)
    self.clearAllDetails()
    station.showInfoWindow()
    station.showNearbyMeetups()
  }

  this.clearAllDetails = function() {
    self.stationsList().forEach(function(station) {
      station.infoWindow.close()
      station.meetupsList().forEach(function(meetup) {
        meetup.visible(false)
      })
    })
  }

  this.hideStationMarkers = function() {
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
      self.hideStationMarkers()
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
            var content = `<b>${self.stationsList()[i].name}</b><br>${durationText} away, ${distanceText}`
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
