var Station = function(data) {
  var self = this;

  // Initialize object members with data input
  this.name = data.name;
  this.location = { lat: data.geometry.coordinates[1], lng: data.geometry.coordinates[0] };
  this.zoneId = data.tags.zone_id;

  this.meetupsList = ko.observableArray([]);
  // Meetup text in English
  this.meetupCount = ko.computed(function() {
    return `${self.meetupsList().length} Meetups`;
  }, this);
  // Container for possible API errors
  this.meetupError = ko.observable();

  // Meetup text for checking error & count
  this.meetupSummary = function() {
    return (this.meetupError()) ? 'Error fetching meetups' : this.meetupCount();
  };

  this.visible = ko.observable(true);

  // Dynamic infoWindow content
  this.contentString = ko.computed(function() {
    return `
      <div class="info-window-content">
        <div class="title"><b>${self.name}</b></div>
        <div class="content">Zone ${self.zoneId}</div>
        <div>${self.meetupSummary()}</div>
      </div>
    `;
  }, this);

  // Initialize infoWindow
  this.infoWindow = new google.maps.InfoWindow({content: self.contentString()});

  // Show InfoWindow
  this.showInfoWindow = function (content) {
    var contentString = content || self.contentString();
    // Set new content for InfoWindow
    self.infoWindow.setContent(contentString);
    self.infoWindow.open(map, self.marker);
    self.bounceAnimate();
  };

  this.marker = new google.maps.Marker({
    map: map,
    title: self.name,
    position: new google.maps.LatLng(self.location.lat, self.location.lng),
    animation: google.maps.Animation.DROP,
  });

  // Show Marker if visible
  this.showMarker = ko.computed( function() {
    if (this.visible()) this.marker.setMap(map);
    else this.marker.setMap(null);
    return true;
  }, this);

  // Bounce Animation
  this.bounceAnimate = function() {
    self.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
      self.marker.setAnimation(null)
    }, 800);
  };

  // Nearby Meetups via Meetup.com / Eventbrite

  this.findNearbyEvents = function() {

    //
    // Meetup.com API
    //

    let endpoint = 'https://api.meetup.com/2/open_events';
    let token = '2d1c23197e67393631564114153f3b31';
    let maxDistance = '1'; // Meetups within 1 mi
    let params = $.param({
      key: token,
      category: '34',
      lat: self.location.lat,
      lon: self.location.lng,
      radius: maxDistance,
      time: ',2w' // Meetups in the next 2 weeks
    });
    let url = `${endpoint}?${params}`;
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
        if (response.results && response.results.length > 0) {
          response.results.forEach(function(item) {
            self.addMeetup(item, 'meetup');
          });
        }
      },
      error: function(xhr, status, error) {
        // Set error for infoWindow
        self.meetupError(error);
      }
    });

    //
    // Eventbrite API - use when Meetup.com API is throttled due to rate limit
    //
    
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

  // JSON -> Meetup Mapping
  this.addMeetup = function(item, source) {
    let meetup = new Meetup(item, source);
    meetup.marker.addListener('click', function () {
      self.selectMeetup(meetup);
    });
    // Populate collection with models
    self.meetupsList.push(meetup);
  };

  // Show Nearby Meetup markers
  this.showNearbyMeetups = function() {
    self.meetupsList().forEach(function(meetup) {
      // Set meetup marker visible
      meetup.visible(true);
      // Set marker on the map
      meetup.showMarker();
    });
  };

  // Select a Meetup
  this.selectMeetup = function(meetup) {
    // Move map to target
    map.setCenter(meetup.marker.position);
    // Close the station infoWindow
    self.infoWindow.close();
    // Close other other Meetup infoWindows
    self.hideMeetupInfoWindows();
    // Show this meetup's infoWindow
    meetup.showInfoWindow();
  };

  // Hide all other Meetup infoWindows
  this.hideMeetupInfoWindows = function() {
    self.meetupsList().forEach(function(meetup) {
      meetup.infoWindow.close();
    });
  };

  // Hide all Meetup markers
  this.hideMeetupMarkers = function () {
    self.meetupsList().forEach(function(meetup) {
      meetup.visible(false);
    });
  };
}