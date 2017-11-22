var Station = function(data) {
  var self = this
  this.name = data.name
  this.location = { lat: data.geometry.coordinates[1], lng: data.geometry.coordinates[0] }
  this.zoneId = data.tags.zone_id

  this.meetupsList = ko.observableArray([])

  this.visible = ko.observable(true)

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
    self.bounceAnimate()
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

  this.bounceAnimate = function() {
    self.marker.setAnimation(google.maps.Animation.BOUNCE)
    setTimeout(function() {
      self.marker.setAnimation(null)
    }, 800)
  }

  // Eventbrite API

  this.findNearbyEvents = function() {
    let endpoint = 'https://api.meetup.com/2/open_events'
    let token = '7d53333072471944b335302f5c4124'
    let maxDistance = '1'
    let currentTime = new Date().getTime() / 1000
    let url = `${endpoint}?key=${token}&category=34&lat=${self.location.lat}&lon=${self.location.lng}&radius=${maxDistance}&time=,2w`
    $.ajax({
      url: url,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      type: 'GET',
      crossDomain: true,
      dataType: 'jsonp',
      success: function(response) {
        console.log(response)
        if (response.results && response.results.length > 0) {
          response.results.forEach(function(item) {
            var meetup = new Meetup(item)
            self.meetupsList.push(meetup)
            meetup.showMarker()
          })
        }
      },
      error: function(xhr, status, error) {
        console.log(error)
      }
    })
    
  }
}