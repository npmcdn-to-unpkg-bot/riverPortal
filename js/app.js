var map, featureList, accessSearch = [];

$(window).resize(function() {
    sizeLayerControl();
});

$(document).on("click", ".feature-row", function(e) {
    $(document).off("mouseout", ".feature-row");
    sidebarClick(parseInt($(this).attr("id"), 10));
});

if (!("ontouchstart" in window)) {
    $(document).on("mouseover", ".feature-row", function(e) {
        highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
    });
}

$(document).on("mouseout", ".feature-row", clearHighlight);

$("#near-btn").click(function() {
    $("#nearModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#river-btn").click(function() {
    $("#riverModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#trail-btn").click(function() {
    $("#trailModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#list-btn").click(function() {
    animateSidebar();
    return false;
});

$("#float-btn").click(function() {
    $("#floatModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#feedback-btn").click(function() {
    $("#feedbackModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$("#nav-btn").click(function() {
    $(".navbar-collapse").collapse("toggle");
    return false;
});

$("#sidebar-toggle-btn").click(function() {
    animateSidebar();
    return false;
});

$("#sidebar-hide-btn").click(function() {
    animateSidebar();
    return false;
});

function sizeLayerControl() {
    $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

function clearHighlight() {
    highlight.clearLayers();
}

function animateSidebar() {
    $("#sidebar").animate({
        width: "toggle"
    }, 800, function() {
        map.invalidateSize();
    });
}

//ZOOMS TO THE POINT WHEN CLICKED FROM THE SIDEBAR
function sidebarClick(id) {
    $('.feature-row').on('click', function() {
        map.flyTo([$(this).attr("lat"), $(this).attr("lng")], 17);
        /* Hide sidebar and go to the map on small screens */
        if (document.body.clientWidth <= 767) {
            $("#sidebar").hide();
            map.invalidateSize();
            map.invalidateSize();
        }
    });
}

function syncSidebar(field, filter) {
    // Empty sidebar features
    $("#feature-list tbody").empty();
    // Add features to side bar
    accessLayer.eachFeature(function(layer) {
        if (layer.feature.properties[field] === filter) {
            $("#feature-list tbody").append('<tr class="feature-row" id="' + layer.feature.properties.pointID + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="20" height="20" src="icons/' + getType(layer.feature.properties.pointType)[1] + '"></td><td class="point-name">' + layer.feature.properties.pointName + '</td><td class="stream-mile">' + layer.feature.properties.streamMile + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
        }
    });
    $("#stream-title").html(filter);
    /* Update list.js featureList */
    featureList = new List("features", {
        valueNames: ["point-name"]
    });
}

// Basemap Layers
var basemap = L.esri.basemapLayer("Imagery");

// GET RIVER ACCESS DATA VIA ESRI LEAFLET FROM AGOL (FOR NOW, PROBABLY SWITCH TO SERVER)

var access = "http://arcgis:6080/arcgis/rest/services/RiverConservation/riverPortal/MapServer/0"

var pTypes = {
    1: ["Canoe/Kayak Access", "canoe.svg"],
    2: ["Boat Ramp", "ramp.svg"],
    3: ["Dam - Portage", "damp.svg"],
    4: ["Rapids/Shoals", "rapids.svg"],
    5: ["Public Land", "pub.svg"],
    6: ["Bridge", "bridge.svg"],
    7: ["Dam - No Portage", "damn.svg"],
    8: ["Confluence", "conf.svg"],
    9: ["Island", "island.svg"],
    10: ["Reservoir", "lake.svg"],
    11: ["Stream Gage", "gage.svg"]
};

var rSide = {
    1: ["North"],
    2: ["East"],
    3: ["South"],
    4: ["West"],
    5: ["Center/Island"],
    6: ["Either"],
    7: ["n/a"]
}

function getType(val) {
    return pTypes[val];
}

function getSide(val) {
    //accounting for nulls right now, but all data will have  a value in future, so we can delete this.
    if (val != null) {
        return rSide[val]
    } else {
        return "n/a"
    }
}

function getAmenities(property) {
    if (property != null) {
        return property
    } else {
        return ""
    }
}

function getUrl(property) {
    if (property != null) {
        var html = "<a href='" + property + "' target='_blank'>More Information</a>"
    } else {
        var html = ""
    }
    return html
}

//GET THE UNIQUE NAMES OF RIVERS AND POPULATE A DROPDOWN IN THE 'FIND A RIVER' MODAL
var riverNames = []
var trailNames = []
var scenicNames = []

map = L.map("map", {
    zoom: 8,
    center: [33.7, -81.1],
    zoomControl: false,
    attributionControl: false
});

basemap.addTo(map);

var fullWhere = "pointType IN (1,2,5)"


//~~~~~THESE FUNCTIONS WILL BE USED TO BUILD AND DISPLAY LEAFLET GEOJSON, BOTH ON ORIGINAL ESRI FEATURE LAYER AND ALSO FEATURE COLLECTIONS RETURNED FROM ESRI.QUERY~~~~~~~~~~~

function featureModalContent(feature) {

    $("#feature-title").html(feature.properties.pointName + '&nbsp;&nbsp<img width="30" height="30" src="icons/' + getType(feature.properties.pointType)[1] + '">');

    if (feature.properties.pointType == 11) {
        //GET USGS GAGE DATA
        var gageURL = "http://waterservices.usgs.gov/nwis/iv/?format=json,1.1&sites=" + feature.properties.pointID + "&parameterCd=00060,00065&siteStatus=active"

        $.getJSON(gageURL, function(data) {
            var cfs = data.value.timeSeries[0].values[0].value[0].value
            var stage = data.value.timeSeries[1].values[0].value[0].value

            var gageContent = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><td colspan='2'>Stream Gage on the " + feature.properties.streamName + "</td></tr>" + "<tr><th>Stage (feet)</th><td>" + stage + "</td></tr>" + "<tr><th>Discharge (cfs)</th><td>" + cfs + "</td></tr>" + "<tr><td colspan='2'>" + getUrl(feature.properties.linkURL) + " from USGS</td></tr>" + "<tr><td colspan='2'><img class='hydrograph' src='http://waterdata.usgs.gov/nwisweb/graph?agency_cd=USGS&site_no=" + feature.properties.pointID + "&parm_cd=00060&period=7'/></td></tr>" + "<table>"

            $("#feature-info").html(gageContent);
        });

    } else {

        var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><td colspan='2'>" + feature.properties.streamName + "</td></tr>" + "<tr><td colspan='2'>" + feature.properties.pointDesc + "</td></tr>" + "<tr><td colspan='2'>" + getAmenities(feature.properties.amenities) + "</td></tr>" + "<tr><td colspan='2'>" + getUrl(feature.properties.linkURL) + "</td></tr>" + "<tr><th>Stream Mile</th><td>" + feature.properties.streamMile + "</td></tr>" + "<tr><th>Side of River</th><td>" + getSide(feature.properties.riverSide)[0] + "</td></tr>" + "<tr><th>Coordinates</th><td>" + feature.properties.lat + ", " + feature.properties.long + "</td></tr>" + "<table>";

        $("#feature-info").html(content);
    }

    $("#featureModal").modal("show");
    planID = layer.feature.properties.pointID
    planName = layer.feature.properties.pointName
    planMiles = layer.feature.properties.streamMile
    planStream = layer.feature.properties.streamName
    coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
    //highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
}

function pushToSearch(layer) {
    accessSearch.push({
        name: layer.feature.properties.pointName,
        source: "Access",
        id: layer.feature.properties.pointID,
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
    });
}

function makePointToLayer(geojson, latlng) {
    return L.marker(latlng, {
        icon: L.icon({
            iconUrl: 'icons/' + getType(geojson.properties.pointType)[1],
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    })
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


//DEFINE THE DATA FROM ESRI FEATURE LAYER - PLUGIN IN THE FUNCTIONS TO BUILD GEOSJON ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var accessLayer = L.esri.featureLayer({
    url: access,
    where: fullWhere,
    pointToLayer: makePointToLayer,
    onEachFeature: function(feature, layer) {
        if ($.inArray(feature.properties.streamName, riverNames) === -1) {
            riverNames.push(feature.properties.streamName);
        }
        if ($.inArray(feature.properties.waterTrail_Name, trailNames) === -1) {
            trailNames.push(feature.properties.waterTrail_Name)
        }
        if ($.inArray(feature.properties.scenic_River, scenicNames) === -1) {
            scenicNames.push(feature.properties.scenic_River)
        }
        if (feature.properties) {
            layer.on({
                click: function(e) {
                    featureModalContent(feature);
                }
            });
            pushToSearch(layer);
        }
    }
}).addTo(map);
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


/* Attribution control */
function updateAttribution(e) {
    $.each(map._layers, function(index, layer) {
        if (layer.getAttribution) {
            $("#attribution").html((layer.getAttribution()));
        }
    });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
    position: "bottomright"
});
attributionControl.onAdd = function(map) {
    var div = L.DomUtil.create("div", "leaflet-control-attribution");
    div.innerHTML = "<span class='hidden-xs'>Developed by <a href='http://bryanmcbride.com'>bryanmcbride.com</a> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
    return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
    position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
    position: "bottomright",
    drawCircle: true,
    follow: true,
    setView: true,
    keepCurrentZoomLevel: true,
    markerStyle: {
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.8
    },
    circleStyle: {
        weight: 1,
        clickable: false
    },
    icon: "fa fa-location-arrow",
    metric: false,
    strings: {
        title: "My location",
        popup: "You are within {distance} {unit} from this point",
        outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
    },
    locateOptions: {
        maxZoom: 18,
        watch: true,
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
    }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
    var isCollapsed = true;
} else {
    var isCollapsed = false;
}

/* Highlight search box text on click */
$("#searchbox").click(function() {
    $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function(e) {
    if (e.which == 13) {
        e.preventDefault();
    }
});

$("#featureModal").on("hidden.bs.modal", function(e) {
    $(document).on("mouseout", ".feature-row", clearHighlight);
});

//ONCE ALL DATA LOADS, GET ALL THE RIVER and TRAIL NAMES AND ADD THEM TO THE DROPDOWN LISTS IN THE MODALS.
accessLayer.on("load", function() {
    for (var i = 0; i < riverNames.length; i++) {
        val = riverNames.sort()[i];
        $("#stream-names").append('<option value="' + val + '">' + val + '</option>');
    }
    for (var i = 0; i < trailNames.length; i++) {
        val = trailNames.sort()[i];
        $("#trail-names").append('<option value="' + val + '">' + val + '</option>');
    }
    for (var i = 0; i < scenicNames.length; i++) {
        val = scenicNames.sort()[i];
        $("#scenic-names").append('<option value="' + val + '">' + val + '</option>');
    }
    accessLayer.off("load");
});

//GET STREAM NAME FROM OPTION, RUN ESRI QUERY, ZOOM TO THOSE FEATURES
$(".filter-btn").click(function(evt) {
    if (this.id === "getStream") {
        var field = "streamName"
        var filter = $("#stream-names").val();
    } else if (this.id == "getTrail") {
        var field = "waterTrail_Name"
        var filter = $("#trail-names").val();
    } else if (this.id == "getScenic") {
        var field = "scenic_River"
        var filter = $("#scenic-names").val();
    }

    var expression = field + "='" + filter + "'"

    $("#initial").hide();
    $("#searchBox").show();

    accessLayer.setWhere(expression, function() {
        syncSidebar(field, filter);
    });
    accessLayer.query()
        .where(expression)
        .bounds(function(error, latlngbounds) {
            map.flyToBounds(latlngbounds,{
                padding:[150,150]
            });
        });

});


//NEAR MODAL SCRIPT USING ESRI GEOCODER-----------------------

function syncSidebarGeo(layer,text) {

    $("#feature-list tbody").append('<tr class="feature-row" id="' + layer.feature.properties.pointID + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="20" height="20" src="icons/' + getType(layer.feature.properties.pointType)[1] + '"></td><td class="point-name">' + layer.feature.properties.pointName + '</td><td class="stream-name">' + layer.feature.properties.streamName + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');

    $("#stream-title").html("GeoSearch Result");
    /* Update list.js featureList */
    featureList = new List("features", {
        valueNames: ["point-name","stream-name"]
    });
    featureList.sort("stream-name");

    $("#stream-title").html("Searching "+$("#distanceBox").val()+ " miles from " + text);

    /*$("#sidebar").animate({
        width:"450px"
    }, 800, function(){
        map.invalidateSize();
    });*/
}

//SET THE STATE VALUE TO AUTOMATICALLY BE SC, BUT WILL CHANGE IF SOMEONE CHANGES IT
$("#stateBox").val("South Carolina")

function queryLatLng(latlng,text) {

    var distance = Number($("#distanceBox").val()) * 1609.34

    accessLayer.query()
        .where("pointType IN (1,2,5)")
        .nearby(latlng, distance)
        .run(function(error, fc, response) {
            if (fc.features.length == 0) {
                alert("No results were found. Please enter a valid address or increase your search distance.")
            } else {

                map.removeLayer(accessLayer);

                $("#feature-list tbody").empty();
                $("#initial").hide();
                $("#searchBox").show();

                var geoSearchLayer = L.geoJson(fc, {
                    pointToLayer: makePointToLayer,
                    onEachFeature: function(feature, layer) {
                        if (feature.properties) {

                            layer.on({
                                click: function(e) {
                                    featureModalContent(feature);
                                }
                            });
                        }
                        syncSidebarGeo(layer,text);
                    }
                }).addTo(map);

                map.flyToBounds(geoSearchLayer.getBounds(),{
                    padding:[150,150]
                });

            }
        });
}

function geocodeLatLng() {

    var address = $("#addressBox").val()
    var city = $("#cityBox").val()
    var state = $("#stateBox").val()
    L.esri.Geocoding.geocode()
        .address(address)
        .city(city)
        .region(state)
        .run(function(err, address, response) {

            var lat = address.results[0].latlng.lat
            var lng = address.results[0].latlng.lng
            var text = address.results[0].text
            var latlng = [lat, lng];
            var geoMarker = L.marker([lat,lng]).addTo(map);
            geoMarker.bindPopup("<b>" + text + "</b>");


            queryLatLng(latlng,text);

        });

}

$("#geocode-btn").click(function() {
    geocodeLatLng();
});

//GEOLOCATOR BUTTON------------------------------
function onLocationFound(e) {
      map.locate({setView: true, maxZoom: 16});
      L.marker(e.latlng).addTo(map);
  };

$("#locate-btn").click(function() {
    onLocationFound();
});








//NEAR MODAL SCRIPT USING ESRI GEOCODER-----------------------

//CLEAR WHERE STATEMENTS AND SHOW ALL RIVERS, ZOOM TO FULL STATE VIEW
$(".view-all").click(function() {
    accessLayer.setWhere(fullWhere);
    accessLayer.query().bounds(function(error, latlngbounds) {
        map.flyToBounds(latlngbounds,{
            padding:[150,150]
        });
    });
    //NEED TO PUT THE DEFAULT STUFF BACK IN THE PANEL AND CLEAR THE LIST OF ITEMS
    $("#feature-list tbody").empty();
    $("#stream-names").val("Select a river name...");
    $("#trail-names").val("Select a trail name...");
    $("#stream-title").html("Paddling the Palmetto State");
    $("#initial").show();
    $("#searchBox").hide();
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// DEVELOP FLOAT PLAN TOOL
// SELECT A START AND END POINT, RETURN ALL POINTS IN BETWEEN
// IF MULTIPLE STREAMS, RETURN ERROR IF THOSE DO NOT CONNECT

//This works bc onEachFeature assigns the variables on the click for the modal, and then it is sent to the float plan modal when the button is clicked
//This is the initial stuff that happens on the map and getting the points.

var planGroup = L.layerGroup().addTo(map); 

var startCircle = L.circleMarker([0,0], {
        radius:18,
        fillOpacity:0,
        color:"#00cc00"        
    });
var endCircle = L.circleMarker([0,0], {
        radius:18,
        fillOpacity:0,
        color:"#ff3300"        
    });

$("#planStart").click(function(){
    $("#planStartText").html(planName)
    startID = planID
    startMile = planMiles
    startStream = planStream
    startCircle.setLatLng(coords).addTo(planGroup);    
});

$("#planEnd").click(function(){
    $("#planEndText").html(planName)
    endID = planID
    endMile = planMiles
    endStream = planStream
    endCircle.setLatLng(coords).addTo(planGroup);
});

var clearPlan = function() {
    startID = "", $("#planStartText").html("")
    endID = "", $("#planEndText").html("")
    planGroup.clearLayers();
}

$("#clear-plan").click(function(){
    clearPlan()
});

//THE WHILE LOOP IS GOING THROUGH AND DOING THE LAST ENTRY BIT TWO TIMES IN A ROW... GIVING AN UNDEFINED.  THAT'S WHY IT'S NOT WORKING...
//SO SOMEHOW WE HAVE TO REARRANGE IT SO THAT IT FLOWS IN ORDER.


function floatPlanQuery(list){
    var lastEntry = list[list.length-1]
    
    if (lastEntry["stream"] === endStream){
        
        for (var i=0; i < list.length; i++){
            getPoints(list[i]['startMiles'],list[i]['endMiles'],list[i]['stream']);
        }
        
    } else {
        
    accessLayer.query()
        .where("pointType = 8 AND streamName = '" + lastEntry["stream"] + "'AND streamMile = 0")
        .run(function(error,conPoint,response){
            
            //point ID of the confluence point for Stream A
            var pID = conPoint.features[0].properties.pointID
            
            //point ID of the correspond confluence point on stream B
            var coID = conPoint.features[0].properties.coID
            
//this expression returns the point of the corresponding confluence, so you can get that points streamName, and miles            
            var exp2 = "pointID = '"+coID+"'"
            
            accessLayer.query()
                .where(exp2)
                .run(function(error,coIDPoint,response){ 
                
                    var coIDStream = coIDPoint.features[0].properties.streamName
                    var coStartMile = coIDPoint.features[0].properties.streamMile
                    
                    if (coIDStream === endStream){
                        var coEndMiles = endMile
                    } else {
                        var coEndMiles = 0
                    }
                    
                    list.push({"stream":coIDStream, "startMiles":coStartMile, "endMiles":coEndMiles});
                
                    floatPlanQuery(list);
                    
                    console.log(list);
                    
            });
        
        });
    }
}

//Begin to query the data in between the points...
function getPoints(mileA,mileB,streamName){
    
    mileExpression = "streamMile <="+mileA+"AND streamMile >="+mileB+"AND streamName = '"+streamName+"'"
    
    accessLayer.query()
        .where(mileExpression)
        .run(function(error,floatPlanPoints,response){
            for (var i=0;i < floatPlanPoints.features.length; i ++) {
                pName = floatPlanPoints.features[i].properties.pointName
                console.log(pName)
            }
            
            map.removeLayer(accessLayer);
        
            var floatPlanLayer = L.geoJson(floatPlanPoints, {
                pointToLayer:makePointToLayer,
                onEachFeature:function(feature,layer) {
                    if (feature.properties){
                        layer.on({
                            click: function(e){
                                featureModalContent(feature);
                            }
                        });
                    }
                    syncSidebar(layer,"float plan");
                }
            }).addTo(map);
        
            map.flyToBounds(floatPlanLayer.getBounds(),{
                padding:[150,150]
            });
        
        });
    }



$("#generate-plan").click(function(){
    
    if (startStream === endStream){
        
        getPoints(startMile, endMile, startStream);
        
    } else {
        var streamMilesArray = []
        
        streamMilesArray.push({"stream":startStream, "startMiles":startMile, "endMiles":0})
    
        floatPlanQuery(streamMilesArray);
        
        } 
});
    


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



// Leaflet patch to make layer control scrollable on touch browsers
var container = $(".leaflet-control-layers")[0];
if (!L.Browser.touch) {
    L.DomEvent
        .disableClickPropagation(container)
        .disableScrollPropagation(container);
} else {
    L.DomEvent.disableClickPropagation(container);
}

//NOT SURE IF I AM GOING TO INCLUDE ANY OF THIS OR NOT
// Typeahead search functionality
/*$(document).on("ajaxStop", function() {
    $("#loading").hide();
    sizeLayerControl();
    // Fit map to boroughs bounds
    map.fitBounds(accessLayer.getBounds());

    var geonamesBH = new Bloodhound({
        name: "GeoNames",
        datumTokenizer: function(d) {
            return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: "http://api.geonames.org/searchJSON?username=bootleaf&featureClass=P&maxRows=5&countryCode=US&name_startsWith=%QUERY",
            filter: function(data) {
                return $.map(data.geonames, function(result) {
                    return {
                        name: result.name + ", " + result.adminCode1,
                        lat: result.lat,
                        lng: result.lng,
                        source: "GeoNames"
                    };
                });
            },
            ajax: {
                beforeSend: function(jqXhr, settings) {
                    settings.url += "&east=" + map.getBounds().getEast() + "&west=" + map.getBounds().getWest() + "&north=" + map.getBounds().getNorth() + "&south=" + map.getBounds().getSouth();
                    $("#searchicon").removeClass("fa-search").addClass("fa-refresh fa-spin");
                },
                complete: function(jqXHR, status) {
                    $('#searchicon').removeClass("fa-refresh fa-spin").addClass("fa-search");
                }
            }
        },
        limit: 10
    });

    geonamesBH.initialize();

    // instantiate the typeahead UI
    $("#searchbox").typeahead({
        minLength: 3,
        highlight: true,
        hint: false
    }, {
        name: "GeoNames",
        displayKey: "name",
        source: geonamesBH.ttAdapter(),
        templates: {
            header: "<h4 class='typeahead-header'><img src='assets/img/globe.png' width='25' height='25'>&nbsp;GeoNames</h4>"
        }
    }).on("typeahead:selected", function(obj, datum) {
        if (datum.source === "GeoNames") {
            map.setView([datum.lat, datum.lng], 14);
        }
        if ($(".navbar-collapse").height() > 50) {
            $(".navbar-collapse").collapse("hide");
        }
    }).on("typeahead:opened", function() {
        $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
        $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
    }).on("typeahead:closed", function() {
        $(".navbar-collapse.in").css("max-height", "");
        $(".navbar-collapse.in").css("height", "");
    });
    $(".twitter-typeahead").css("position", "static");
    $(".twitter-typeahead").css("display", "block");
});*/
