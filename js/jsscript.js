//On-Ready Function

$(function() {
    
    var map = L.map('map').setView([29.76,-95.37], 9);

    // set basemap as Carto tile Layer
    var CartoDBTiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
    attribution: 'Map Data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> Contributors, Map Tiles &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    });

    // add these tiles to the map
    map.addLayer(CartoDBTiles);

    //Add a geocoder for users to search location
    L.Control.geocoder().addTo(map);

    //Add map scale
    L.control.scale().addTo(map);

//Select InDepth Polygon Layer from ArcGIS API
var InDepth = L.esri.featureLayer({
    url: 'https://services.arcgis.com/lqRTrQp2HrfnJt8U/ArcGIS/rest/services/CTAsummary4/FeatureServer/0',
    style: function (feature) { 
      return {
        fillOpacity: .4,
        fillColor: getColor(feature.properties.Avg_IN_DEP), 
        color: 'black',
        weight: .4
      }
    }
})

//function to add and remove layer based on zoom level
map.on('zoom', function(){
    if (map.getZoom() > 14) {
        map.removeLayer(InDepth);
    } else {
        map.addLayer(InDepth);
    }
});

//function to style polygons by average inundation depth values--create choropleth map 
function getColor(d) {
    return d <= 2 ? '#ccccff' :
            d <= 4 ? '#8080ff' :
            d <= 6 ? '#1a1aff' :
            d <= 8 ? '#0000b3' :
                    '#00001a' ;
    }



//function to bind a Popup to each polygon using L.Util.template from Leaflet
InDepth.bindPopup(function (layer) {
    return L.Util.template('<p><strong>Neighborhood:</strong> {KCTA_NAME_}<br><strong> Average Inundation Depth (ft): </strong>{Avg_IN_DEP}<br> <strong> Number of Households Affected:</strong> {Count_}</p>', layer.feature.properties);
  });

 
//Select Buildings point layer from ArcGIS API
var Buildings = L.esri.featureLayer({
  url: 'https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/FEMA_Damage_Assessments_Harvey_20170829/FeatureServer/0', 
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, { //create circle markers from the point locations
        fillColor: '#b30000',
        color: 'black',
        fillOpacity: 1,
        radius: 2,
        weight: .3
               
        })
    }
})

//function to add or remove layer based on zoom level
map.on('zoomend', function() {
    if (map.getZoom() < 13) {
        map.removeLayer(Buildings);
    } else {
        console.log("Point Layer Active");
        map.addLayer(Buildings);
    } 

});



//Select polygon layer for Land Use Changes from ArcGIS API
var Land_Use_Changes = L.esri.featureLayer({
    url: 'https://gis.h-gac.com/arcgis/rest/services/Land_Use/Announced_Changes_2020/MapServer/0', 
    style: function (feature) {
        return {
        fillColor: getColorLand(feature.properties.Label_Current_Land_Use, feature.properties.Label_Announced_Changes),
        fillOpacity: .8,
        weight: .5,
        color: 'white'
        }
    }
})

//function to add or remove layer based on zoom level
map.on('zoomend', function(){
    if (map.getZoom() < 16) {
        map.removeLayer(Land_Use_Changes);
    } else {
        console.log("Polygon Layer Active");
        map.addLayer(Land_Use_Changes);
    }
}); 

//function to style the polygon based on categories
function getColorLand(l, a) {
    return l ===  'Residential' && a === 'Residential' ? '#ff9900' :
            l === 'Vacant Developable (includes Farming)' && a === 'Residential' ? '#660066' :
            l === 'Vacant Developable (includes Farming)' && a === 'Commercial' ? '#e6e600' :
            l === 'Vacant Developable (includes Farming)' && a === 'Industrial' ? '#e6e600' :
            l === 'Vacant Developable (includes Farming)' && a === 'Multiple' ? '#e6e600' :
            l === 'Commercial' && a === 'Residential' ? '#ff3377' :
            l === 'Industrial' && a === 'Residential' ? '#ff3377' :
            l === 'Other' && a === 'Residential' ? '#ff3377' :
                    '#4d3300'; 
    }

//Function to bind Popup to each polygon 
Land_Use_Changes.bindPopup(function (layer) {
    return L.Util.template('<p><strong>Current Land Use:</strong> {Label_Current_Land_Use}<br> <strong>Announced Land Use Changes:</strong> {Label_Announced_Changes}<br> <strong>Current Number of Housing Units:</strong> {Housing_Units_Current}<br> <strong>Number of Housing Units by 2020:</strong> {Housing_Units_2020}</p>', layer.feature.properties);
  }); 


//Select polygon Layer of population growth 2012-2017 by block group from ArcGIS API
var Pop_Growth = L.esri.featureLayer({
    url: 'http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Projected_Population_Change/MapServer/1',
    style: function (feature) {
        return {
        fillColor: getColorPop(feature.properties.POPGRWCYFY),
        weight: .5,
        color: 'black',
        fillOpacity: .4
    }
}
})

//function to add or remove layer depending on zoom level
map.on('zoomend', function(){
    var z = map.getZoom();
    if (z < 15 || z >= 16) {
        map.removeLayer(Pop_Growth);
    } else {
        map.addLayer(Pop_Growth);
    }
});

//function to style each polygon based on value--choropleth map
function getColorPop(p) {
    return p <= 0 ? '#ffffb3' :
            p <= .3 ? '#ffff66' :
            p <= 1.2 ? '#cccc00' :
            p <= 2.5 ? '#808000' :
                    '#333300' ;
    }

//function to bind popup to polygon
Pop_Growth.bindPopup(function (layer) {
    return L.Util.template('<p><strong>Pop. Growth 2000-2010:</strong> {POPGRW0010} %<br> <strong>Pop. Growth 2010-2012:</strong> {POPGRW10CY} %<br> <strong>Pop. Growth 2012-2017:</strong> {POPGRWCYFY} %</p> ', layer.feature.properties);
  });



//create layer controls so that viewer can toggle the layers on and off
function createLayerControls(){
    // basemap--permanent
    var baseMaps = {
        "CartoDB Basemap": CartoDBTiles,
    };

    //overlap maps add to Layer control
    var overlayMaps = {
        "Damaged Buildings": Buildings,
        "Land": Land_Use_Changes,
        "Population": Pop_Growth,
        "Depth": InDepth,
    };

    // add control
    L.control.layers(baseMaps, overlayMaps).addTo(map);
    
}

createLayerControls()

//define the variables for each legend
var DepthLegend = L.control({position: 'bottomright'});
var PopulationLegend = L.control({position: 'bottomright'});
var LandLegend = L.control({position: 'bottomleft'});
var BuildingsLegend = L.control({position: 'bottomleft'});

//create legend for Inundation Depth based on values
DepthLegend.onAdd = function (map) {
var div = L.DomUtil.create('div', 'info legend');
    amounts = [0, 2, 4, 6, 8]

    div.innerHTML +=
    '<p><strong>Inundation Depth (ft)</strong></p>';

    for (var i = 0; i < amounts.length; i++) {
                    div.innerHTML +=
                        '<i style="background:' + getColor(amounts[i] + 1) + '"></i> ' +
                        amounts[i] + (amounts[i + 1] ? '&ndash;' + amounts[i + 1] + '<br />' : '+<br />');
                }

return div;
};

//create legend for Population based on values
PopulationLegend.onAdd = function (map) {
var div = L.DomUtil.create('div', 'info legend');
    amounts = [-5, 0, .3, 1.2, 2.5]

    div.innerHTML += '<p><strong>Population Growth 2012-2017 (%)</strong></p>';

    for (var i = 0; i < amounts.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColorPop(amounts[i] + 1) + '"></i> ' +
                    amounts[i] + (amounts[i + 1] ? '&ndash;' + amounts[i + 1] + '<br />' : '+<br />');
            }

return div;
};



//create legend for Land based on categories
LandLegend.onAdd = function (map) {
    //doing all of this stuff inside our onAdd function when we add it to the map

    var div = L.DomUtil.create('div', 'info legend');   //using a function in leaflet called DomUtil--will create a dom element for you over the top of a leaflet map, you can position it wherever you like
        //class of info and legend
        div.innerHTML +=        //everything we put inside will go inside our div
                                //manually created all these components of the legend 
            '<b>Land Use Changes Proposed by 2020</b><br />' +
            '<svg class="left" width="22" height="18"><rect rx="0" ry="0" height="15" width="15" class="legendSvgRes"/></svg><span>Growing Residential</span><br />' +
            '<svg class="left" width="22" height="18"><rect rx="0" ry="0" height="15" width="15" class="legendSvgVtoRes"/></svg><span>Residential Built on Undeveloped Land</span><br />' +
            '<svg class="left" width="22" height="18"><rect rx="0" ry="0" height="15" width="15" class="legendSvgVtoCom"/></svg><span>Commercial/Industrial/Other Built on Undeveloped Land</span><br />' +
            '<svg class="left" width="22" height="18"><rect rx="0" ry="0" height="15" width="15" class="legendSvgComToRes"/></svg><span>Commercial/Industrial/Other to Residential</span><br />' +
            '<svg class="left" width="22" height="18"><rect rx="0" ry="0" height="15" width="15" class="legendSvgOther"/></svg><span>Other</span><br />';


    return div;
};



// Add Depth legend only right now, as it is the "default", other layers will show up as user zooms in
DepthLegend.addTo(map);
currentLegend = DepthLegend;

//function to add or remove legends when layer controls automatically toggle on and off due to zoom level (this process was already set earlier)
map.on('overlayadd', function (eventLayer) {
    if (eventLayer.name === 'Depth') {
        map.removeControl(currentLegend );
        currentLegend = DepthLegend;
        DepthLegend.addTo(map);
    }
    else if  (eventLayer.name === 'Population') {
        map.removeControl(currentLegend );
        currentLegend = PopulationLegend;
        PopulationLegend.addTo(map);
    }
    else if  (eventLayer.name === 'Land') {
       map.removeControl(currentLegend );
        currentLegend = LandLegend;
        LandLegend.addTo(map);
    }
  })

//add damage assessment legend which is always showing on the page
BuildingsLegend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend');   //will create a dom element for you over the top of a leaflet map, you can position it wherever you like
        //class of info and legend
        div.innerHTML +=        //everything we put inside will go inside our div
                                //manually created all these components of the legend 
            '<b>FEMA Damage Assessment</b><br />' +
            '<svg class="left" width="22" height="18"><circle cx="10" cy="9" r="5" class="legendSvgBuildings"/></svg><span>Damaged Buildings</span><br />';

    return div;
};

BuildingsLegend.addTo(map);



});