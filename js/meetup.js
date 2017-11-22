var Meetup = function(data) {
  var self = this
  this.name = data.name
  this.description = data.description
  if (data.venue) {
    this.location = { lat: data.venue.lat, lng: data.venue.lon }
  } else {
    this.location = { lat: data.group.group_lat, lng: data.group.group_lon }
  }
  this.time = new Date(data.time)
  this.fee = data.fee ? data.fee.amount : 0
  
  this.price = ko.computed( function() {
    return (this.fee > 0) ? `${this.fee}` : 'Free'
  }, this)

  this.visible = ko.observable(true)

  this.contentString = `
    <div class="info-window-content">
      <div class="title"><b>${self.name}</b></div>
      <div class="content">${self.description}</div>
      <div>${self.time.toDateString()} | ${self.price()}</div>
    </div>
  `

  this.infoWindow = new google.maps.InfoWindow({content: self.contentString})

  this.showInfoWindow = function (content) {
    var contentString = content || self.contentString
    self.infoWindow.setContent(contentString)
    self.infoWindow.open(map, self.marker)
  }

  this.marker = new google.maps.Marker({
    icon: makeMarkerIcon(),
    map: map,
    title: self.name,
    position: new google.maps.LatLng(self.location.lat, self.location.lng),
    animation: google.maps.Animation.DROP,
  })

  this.showMarker = ko.computed( function() {
    if (this.visible()) this.marker.setMap(map)
    else this.marker.setMap(null)
    return true
  }, this)

  this.marker.addListener('click', function(){
    self.showInfoWindow()
    self.marker.setAnimation(google.maps.Animation.BOUNCE)
    setTimeout(function() {
        self.marker.setAnimation(null)
    }, 2100)
    map.setCenter(this.position)
    map.setZoom(13)
  })

  this.bounce = function(place) {
    google.maps.event.trigger(self.marker, 'click')
  }
}

function makeMarkerIcon() {
  let markerColor = 'ef9a9a'
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}