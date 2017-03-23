$().ready(startUSGS);

var usgsData = null;
var eqArrayWeekM4p5 = [];
var eqArrayMonthM4p5 = [];
var eqArrayDayM4p5 = [];
var current_array = eqArrayMonthM4p5;

function startUSGS(){
    usgsData = new ConstructorUSGS;
    usgsData.getUSGSWeek();
    usgsData.getUSGSMonth();
    usgsData.getUSGSDay();
}
function ConstructorUSGS(){
    var self = this;
    this.getUSGSWeek= function(){
        $.ajax({
            url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson',
            method: 'get',
            success: function(returnResponse){
                self.sortUSGSWeek(returnResponse);
            },
            error: function(returnResponse){
                self.displayServerModal('Delete Error: ' + returnResponse.responseText, "Status Code: " + returnResponse.status);
                console.log('error ', returnResponse);
            }
        });
    };
    this.getUSGSMonth = function(){
        $.ajax({
            url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson',
            method: 'get',
            success: function(returnResponse){
                self.sortUSGSMonth(returnResponse);
               // earthquake();    // -------------------- Might have to change this later, right it is set to load when the page is loaded.
            },
            error: function(returnResponse){
                self.displayServerModal('Delete Error: ' + returnResponse.responseText, "Status Code: " + returnResponse.status);
                console.log('error ', returnResponse);
            }
        })
    };
    this.getUSGSDay = function(){
        $.ajax({
            url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
            method: 'get',
            success: function(returnResponse){
                self.sortUSGSDay(returnResponse);
            },
            error: function(returnResponse){
                self.displayServerModal('Delete Error: ' + returnResponse.responseText, "Status Code: " + returnResponse.status);
                console.log('error ', returnResponse);
            }
        })
    };
    this.sortUSGSWeek = function(returnResponse){
        for (var i = 0; i < returnResponse.features.length; i++) {
            var location = returnResponse.features[i].properties.place;
            var mag = returnResponse.features[i].properties.mag;
            var utcSecond = returnResponse.features[i].properties.time;
            var time = new Date(utcSecond);
            var long = returnResponse.features[i].geometry.coordinates[0];
            var lat = returnResponse.features[i].geometry.coordinates[1];
            var depth = returnResponse.features[i].geometry.coordinates[2];
            eqArrayWeekM4p5.push({location, mag, time, lat, long, depth});
        }
    };
    this.sortUSGSMonth = function(returnResponse){
        for (var i = 0; i < returnResponse.features.length; i++) {
            var location = returnResponse.features[i].properties.place;
            var mag = returnResponse.features[i].properties.mag;
            var utcSecond = returnResponse.features[i].properties.time;
            var time = new Date(utcSecond);
            var long = returnResponse.features[i].geometry.coordinates[0];
            var lat = returnResponse.features[i].geometry.coordinates[1];
            var depth = returnResponse.features[i].geometry.coordinates[2];
            eqArrayMonthM4p5.push({location, mag, time, lat, long, depth});
        }
    };
    this.sortUSGSDay = function(returnResponse){
        for(var i = 0; i <   returnResponse.features.length; i++){
            var location = returnResponse.features[i].properties.place;
            var mag = returnResponse.features[i].properties.mag;
            var utcSeconds = returnResponse.features[i].properties.time;
            var time = new Date(utcSeconds);
            var lat = returnResponse.features[i].geometry.coordinates[1];
            var long = returnResponse.features[i].geometry.coordinates[0];
            var depth = returnResponse.features[i].geometry.coordinates[2];
            eqArrayDayM4p5.push({location, mag, time, lat, long, depth});
        }
    };
}

var map;
var infowindow;
var request;
var service;
var markers = [];

$(document).ready(initialize);
function initialize() {
    mapInit();
    clickHandler();
    getAddress();
    $(document).off('ready', initialize);
}
function clickHandler() {
    $('.btn').click(eqHistoryByDays);
    $('#address').keypress(function(event){
        if(event.keyCode == 13){
        getAddress();    
        event.preventDefault();
        event.stopPropagation();
        }
    });
    $(".glyphicon-search").click(getAddress);
}
function eqHistoryByDays() {
    console.log("Working!");
    days_clicked = $(this).val();
    if (days_clicked == 1) {
        current_array = eqArrayDayM4p5;

    }
    else if (days_clicked == 7){
        current_array = eqArrayWeekM4p5;

    }
    else {
        current_array = eqArrayMonthM4p5;
    }
    earthquake(current_array);
}
function mapInit() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        mapTypeId: 'roadmap'
    });
    $('.glyphicon-search').click(getAddress);
}
function getAddress() {
    var geocoder = new google.maps.Geocoder();
    var address = $('#address').val();
    geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == 'OK') {
            map.setCenter(results[0].geometry.location);
            earthquake(current_array);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}
function earthquake(current_array) {
    var eqData = {};
    for (var i = 0 ; i < current_array.length ; i++) {
        eqData = {
            lat_val: current_array[i].lat,
            lng_val: current_array[i].long,
            location: current_array[i].location,
            magnitude: current_array[i].mag.toString(),
            time: current_array[i].time
        };
        combineLatLongForGoogle(eqData);
    }
}
function combineLatLongForGoogle(eqData) {

    var temp = {
        lat: eqData.lat_val,
        lng: eqData.lng_val
    };
    generateCircle(temp, eqData);
}
function generateCircle(temp, eqData) {
    var marker = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.35,
        strokeWeight: 1,
        fillColor: '#FF0000',
        fillOpacity: 0.45,
        center: temp,
        map: map,
        radius: (eqData.magnitude * 25000),
        data: {
            magnitude: eqData.magnitude,
            location: eqData.location,
            time: eqData.time
        }
    });
    infowindow = new google.maps.InfoWindow();
        google.maps.event.addListener(marker, 'click', function () {        
            console.log(this);
            infowindow.setPosition(this.getCenter());
            var eqDataString = 'The Location is: ' + this.data.location + "<br/> Magnitude of: " + this.data.magnitude + "<br/> On this Date: " + this.data.time;
            infowindow.setContent(eqDataString);
            infowindow.open(map, this);
        });

    createClickHandler(marker, eqData);
}

//------------------------- Twitter Starts ---------------------------------
function createClickHandler(marker, eqData){
    marker.addListener('click', clickRemoveExtraText.bind(this, eqData));
}
function clickRemoveExtraText(eqData) {
    var tempLocation = eqData.location;
    var stringArray = tempLocation.split(' ');
    var indexWordOf = stringArray.indexOf("of");
    var withOutOf = stringArray.slice(indexWordOf + 1);
    var searchTerm = withOutOf.join(' ');
    calltwitter(searchTerm);
}
function calltwitter(searchWord){
    console.log(searchWord);
    $.ajax({
        data: {
            search_term: 'earthquake ' + searchWord,
        },
        dataType: 'json',
        url: 'http://s-apis.learningfuze.com/hackathon/twitter/index.php?',
        method: 'post',
        success: function(returnResponse){
            console.log('works kinda: ', returnResponse);
            getTweets(returnResponse);
        },
        error: function(returnResponse){
            console.log('error ', returnResponse);
        }
    })
}
function getTweets(returnResponse){
    for(var i = 0; i < returnResponse.tweets.statuses.length; i++){
        console.log(returnResponse.tweets.statuses[i].text);
        //ryan this is where you append to the dom or you can make a function
    }
}
//------------------------- Twitter Ends ---------------------------------

// open panel functions
$(document).ready(glyphClick);
function glyphClick() {
    $('.glyphicon-bell').on('click', function(){
        $('.testPanel').toggleClass('on');
    });
    $('.glyphicon-list').on('click', function(){
        $('.rightPanel').toggleClass('on');
    });
}

// ---------- Reset ---------------
function reset(){
    current_array = [];
}
