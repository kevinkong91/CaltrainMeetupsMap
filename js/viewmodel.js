var map

var ViewModel = function () {
  var self = this

  this.searchQuery = ko.observable('')  
  this.stationsList = ko.observableArray([])

  // Initialize Google Map object
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.6021349, lng: -122.275478},
    zoom: 10,
    styles: mapStyle,
    mapTypeControl: false
  })

  // Initialize Data
  data.stops.forEach(function(stop) {
    //JSON-to-Station mapping
    var station = new Station(stop)
    // Fetch Meetup data for each station
    station.findNearbyEvents()
    // Display all relevation markers
    station.showMarker()
    // Add listener for Station selection
    station.marker.addListener('click', function () {
      self.selectStation(station)
    })
    // Populate Station collection
    self.stationsList.push(station)
  })

  // Create Search Box for searchWithinTime input
  var searchBox = new google.maps.places.SearchBox(document.getElementById('search-within-time-text'));
  searchBox.setBounds(map.getBounds())

  // Toggle for Station Menu
  this.toggleStationsList = function() {
    $('.stations-box').slideToggle()
  }

  // Toggle for Filter Menu
  this.toggleFilterOptions = function() {
    $('.filter-options').slideToggle()
  }

  // Clear all set filters
  this.clearFilters = function() {
    this.searchQuery('')
    this.selectedZone(null)
    self.clearAllDetails()
  }

  // Select a Station
  this.selectStation = function(station) {
    // Move map to selected station
    map.setCenter(station.marker.position)
    map.setZoom(12)

    // Clear all previous details
    self.clearAllDetails()

    // Show Station & Meetup info
    station.showInfoWindow()
    station.showNearbyMeetups()
  }

  // Clear all infoWindows and meetups
  this.clearAllDetails = function() {
    self.stationsList().forEach(function(station) {
      // Close station info
      station.infoWindow.close()
      // Close all nearby meetup info
      station.meetupsList().forEach(function(meetup) {
        meetup.visible(false)
      })
    })
  }

  // Hide markers when filtered out
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
    // Clear previous results
    self.stationsWithinTime([])
    // Initialize GoogleMaps DistanceMatrix
    var distanceMatrixService = new google.maps.DistanceMatrixService
    var address = $('#search-within-time-text').val()
    
    if (address == '') {
      // Handle invalid input
      window.alert('You must enter an address.')
    } else {
      // Clear all previous markers
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
          // Success response
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
      // No matching results found
      window.alert('We could not find any locations within that distance!');
    }
  }

  // Searches for what user typed in the input bar using the locationlist array.
  // Only displaying the exact item results that user type if available in the locationlist array.
  this.filteredList = ko.computed( function() {
    return ko.utils.arrayFilter(self.stationsList(), function(station) {
      var resultZone = true
      var resultFilter = true
      // Check zone filter
      if (typeof self.selectedZone() === 'number') {
        resultZone = (self.selectedZone() == station.zoneId)
      }
      // Check string query filter
      var filter = self.searchQuery().toLowerCase()
      if (filter) {
        var string = station.name.toLowerCase()
        resultFilter = (string.search(filter) >= 0)
      }
      // If user sets Zone && a string query, positive results should match both
      var result = resultZone && resultFilter
      // Show/hide station
      station.visible(result)
      return result
    })
  }, self)
}

// Initialize the app with VM binding
function initApp() {
  ko.applyBindings(new ViewModel())
}
