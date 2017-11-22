var Station = function(data) {
  var self = this
  this.name = data.name
  this.location = { lat: data.geometry.coordinates[1], lng: data.geometry.coordinates[0] }
  this.zoneId = data.tags.zone_id

  this.meetupsList = ko.observableArray([])
  this.meetupCount = ko.computed(function() {
    return `${self.meetupsList().length} Meetups`
  })
  this.meetupError = ko.observable()

  this.meetupSummary = function() {
    return (this.meetupError()) ? 'Error fetching meetups' : this.meetupCount()
  }

  this.visible = ko.observable(true)

  this.contentString = ko.computed(function() {
    return `
      <div class="info-window-content">
        <div class="title"><b>${self.name}</b></div>
        <div class="content">Zone ${self.zoneId}</div>
        <div>${self.meetupSummary()}</div>
      </div>
    `
  })

  this.infoWindow = new google.maps.InfoWindow({content: self.contentString})

  this.showInfoWindow = function (content) {
    var contentString = content || self.contentString()
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

  // Nearby Meetups via Meetup.com / Eventbrite

  this.findNearbyEvents = function() {
    let endpoint = 'https://api.meetup.com/2/open_events'
    let token = '2d1c23197e67393631564114153f3b31'
    let maxDistance = '1'
    let params = $.param({
      key: token,
      category: '34',
      lat: self.location.lat,
      lon: self.location.lng,
      radius: maxDistance,
      time: ',2w'
    })
    let url = `${endpoint}?${params}`
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
        console.log(self.name, response.results.length)
        if (response.results && response.results.length > 0) {
          response.results.forEach(function(item) {
            self.addMeetup(item, 'meetup')
          })
        }
      },
      error: function(xhr, status, error) {
        self.meetupError(error)
      }
    })

    // let endpoint = 'https://www.eventbriteapi.com/v3/events/search/'
    // let token = 'IDTYBW4ED3T2FYOJCHIA'
    // let maxDistance = '5mi'
    // let params = $.param({
    //   token: token,
    //   categories: '102',
    //   'location.latitude': self.location.lat,
    //   'location.longitude': self.location.lng,
    //   'location.within': maxDistance,
    //   'start_date.keyword': 'this_week'
    // })
    // let url = `${endpoint}?${params}`
    // console.log(url)
    
    // $.ajax({
    //   url: url,
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded'
    //   },
    //   type: 'GET',
    //   dataType: 'json',
    //   success: function(response) {
    //     console.log(response)
    //     if (response.events && response.events.length > 0) {
    //       response.results.forEach(function(item) {
    //         self.addMeetup(item)
    //       })
    //     }
    //   },
    //   error: function(xhr, status, error) {
    //     console.log(xhr)
    //     self.meetupError(error)
    //   }
    // })
  }

  this.addMeetup = function(item, source) {
    let meetup = new Meetup(item, source)
    meetup.marker.addListener('click', function () {
      self.selectMeetup(meetup)
    })
    self.meetupsList.push(meetup)
  }

  this.showNearbyMeetups = function() {
    self.meetupsList().forEach(function(meetup) {
      meetup.visible(true)
      meetup.showMarker()
    })
  }

  this.selectMeetup = function(meetup) {
    map.setCenter(meetup.marker.position)
    self.infoWindow.close()
    self.hideAllMeetupInfoWindows()
    meetup.showInfoWindow()
  }

  this.hideAllMeetupInfoWindows = function() {
    self.meetupsList().forEach(function(meetup) {
      meetup.infoWindow.close()
    })
  }
}