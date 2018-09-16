// Width and Height of the whole visualization
var width = 1600;
var height = 900;

// Create SVG
var svg = d3.select( "body" )
    .append( "svg" )
    .attr( "width", width )
    .attr( "height", height );

// Set Projection Parameters
var albersProjection = d3.geo.mercator()
                        .center([ -120, 36.5 ])
                        .translate([ width/2, height/2 ])
                        .scale([ width*1.8 ]);

// Create GeoPath function that uses built-in D3 functionality to turn
// lat/lon coordinates into screen coordinates
var geoPath = d3.geo.path()
    .projection( albersProjection );

// Initialize force for the visualization
var force = d3.layout.force().size([width, height]);

// Load CSV data as var data
d3.csv("data/missing_people_data.csv", function(data) {

// Load GeoJSON data as var json and merge with states data
d3.json("data/California_Counties.geojson", function(json) {

// Loop through each county's data value in the CSV
for (var i = 0; i < data.length; i++) {

    // County name
    var dataCounty = data[i].county;

    // Find the corresponding county inside the GeoJSON
    for (var j = 0; j < json.features.length; j++)  {
        var jsonCounty = json.features[j].properties.COUNTY_NAME;

        if (dataCounty == jsonCounty) {

            if (!('count' in json.features[j].properties)) {
                json.features[j].properties.count = 0;
            }

        // Copy the data value into the JSON
        json.features[j].properties.count += 1; 

        // Break when found
        break;
        }
    }
}

// Nodes and links for Delaunay triangulation
nodes = [],
links = [];

// Compute centroids, also add previously added count property to node object
json.features.forEach(function(d, i) {
    var centroid = geoPath.centroid(d);
    if (centroid.some(isNaN)) return;
    centroid.x = centroid[0];
    centroid.y = centroid[1];
    centroid.feature = d;
    centroid.count = d.properties.count
    nodes.push(centroid);
});


// Compute links between nodes
d3.geom.voronoi().links(nodes).forEach(function(link) {
  var dx = link.source.x - link.target.x,
      dy = link.source.y - link.target.y;
  link.distance = Math.sqrt(dx * dx + dy * dy);
  links.push(link);
});

// Set forces for the diagram
force
    .gravity(0)
    .nodes(nodes)
    .links(links)
    .linkDistance(function(d) { return d.distance; })
    .start();

// Actually create the links, but leave them invisible
var link = svg.selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

// Draw the nodes with color depending on count property previously added to nodes
var node = svg.selectAll("g")
    .data(nodes)
    .enter().append("g")
    .attr("transform", function(d) { return "translate(" + -d.x + "," + -d.y + ")"; })
    .call(force.drag)
    .attr( "fill", function(d) {
      var value = d.count;
      if (value) {
          color = 240 - value;
          return "rgb(255, " + color + ",  " + color +")";
      }
      else {
          return "rgb(255, 240, 240)";
      }
    })
    .append("path")
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    .attr("d", function(d) { return geoPath(d.feature); })

// Add event listener for moving the figure
force.on("tick", function(e) {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
});
});
});