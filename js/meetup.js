var Meetup = function(data, source) {
  var self = this

  // Initializer for different API source - Meetup/Eventbrite
  if (source == 'meetup') {
    this.name = data.name
    this.description = data.description
    if (data.venue) {
      this.location = { lat: data.venue.lat, lng: data.venue.lon }
    } else {
      this.location = { lat: data.group.group_lat, lng: data.group.group_lon }
    }
    this.time = new Date(data.time)
    this.fee = data.fee ? data.fee.amount : 0
  } else if (source == 'eventbrite') {
    this.name = data.name.text
    this.description = data.description.html
    this.time = data.start.utc
    this.fee = 0
  }
  
  // Price formatted in English
  this.price = ko.computed( function() {
    return (this.fee > 0) ? `${this.fee}` : 'Free'
  }, this)

  this.visible = ko.observable(false)

  // Dynamic content for infoWindow
  this.contentString = ko.computed(function() {
    return `
      <div class="info-window-content">
        <div class="title"><b>${self.name}</b></div>
        <div class="content">${self.description || ''}</div>
        <div>${self.time.toDateString()} | ${self.price()}</div>
      </div>
    `
  })

  // Initialize infoWindow
  this.infoWindow = new google.maps.InfoWindow({content: self.contentString})

  // Show InfoWindow
  this.showInfoWindow = function (content) {
    var contentString = content || self.contentString()
    // Set new content for InfoWindow
    self.infoWindow.setContent(contentString)
    self.infoWindow.open(map, self.marker)
  }

  // Initialize Marker
  this.marker = new google.maps.Marker({
    icon: makeMarkerIcon(),
    map: map,
    title: self.name,
    position: new google.maps.LatLng(self.location.lat, self.location.lng),
    animation: google.maps.Animation.DROP,
  })

  // Show Meetup Marker
  this.showMarker = ko.computed( function() {
    if (this.visible()) this.marker.setMap(map)
    else this.marker.setMap(null)
    return true
  }, this)
}

// Generate light-red icon for Meetup markers
// to differentiate from Stations
function makeMarkerIcon() {
  let markerColor = 'ffcdd2'
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}