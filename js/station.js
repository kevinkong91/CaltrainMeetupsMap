var Station = function(data) {
  var self = this
  this.name = data.name
  this.location = { lat: data.geometry.coordinates[1], lng: data.geometry.coordinates[0] }
  this.zoneId = data.tags.zone_id

  this.visible = ko.observable(true);

  this.contentString = `
    <div class="info-window-content">
      <div class="title"><b>${self.name}</b></div>
      <div class="content">Zone ${self.zoneId}</div>
    </div>
  `

  this.infoWindow = new google.maps.InfoWindow({content: self.contentString})

  this.showInfoWindow = function (content) {
    var contentString = content || self.contentString
    self.infoWindow.setContent(contentString)
    self.infoWindow.open(map, self.marker)
  }

  this.marker = new google.maps.Marker({
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

  this.bounce = function(place) {
    google.maps.event.trigger(self.marker, 'click')
  }
}