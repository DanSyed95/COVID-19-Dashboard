
// Set up the dimensions of the treemap
const clusterWidth = 1000;
const clusterHeight = 700;
const clusterMargin = { top: 10, right: 10, bottom: 10, left: 10 };

// create the cluster SVG element
const clusterSvg = d3.select("#cluster")
  .append("svg")
  .attr("width", clusterWidth + clusterMargin.left + clusterMargin.right)
  .attr("height", clusterHeight + clusterMargin.top + clusterMargin.bottom)

// Load the COVID data
d3.csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv").then(data => {

  // Filter the data for March 2020 to November 2022 and for the continents/world
  const clusterFilteredData = data.filter(d => {
    const date = d3.timeParse("%Y-%m-%d")(d.date);
    return date >= d3.timeParse("%Y-%m-%d")("2020-03-01") && date <= d3.timeParse("%Y-%m-%d")("2022-11-30") && (d.location === "Africa" || d.location === "Asia" || d.location === "Europe" || d.location === "North America" || d.location === "South America" || d.location === "Oceania");
  });

  // Roll up the data from March 2020 to November 2022
  const casesByLocation = d3.rollup(clusterFilteredData, v => d3.sum(v, d => +d.new_cases), d => d.location);

  // Create parent node
  const world = { name: "World", children: Array.from(casesByLocation, ([location, cases]) => ({ location, cases })) };

  // Set the root node as a child of the new parent node
  const root = d3.hierarchy(world);

  // Sum the values of the children for computing the size of each tile
  root.sum(d => d.cases)
    .sort((a, b) => b.value - a.value);
  // Create the treemap layout
  const treemap = d3.treemap()
    .size([clusterWidth - clusterMargin.left - clusterMargin.right, clusterHeight - clusterMargin.top - clusterMargin.bottom])
    .padding(2)    // Add space between cells
    .round(true);  // Round pixel values of treemap tiles

  // Generate the treemap nodes
  const nodes = treemap(root).descendants();

  // define colour scale
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Draw treemap
  const node = clusterSvg.selectAll(".node")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  node.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.location);
    });

  node.append("text")
    .attr("dx", 4)
    .attr("dy", 14)
    .text(d => {
      if (d.depth === 0) { // Ensuring that world is selected
        return "World";
      } else if (d.depth === 1) { // Ensuring that continent is selected
        return d.data.location;
      }
    })
    .attr("fill", "white")
    .style("font-size", "18px");

  // Format Numbers by adding commas
  const numberFormatter = d3.format(",");

  node.append("text")
    .attr("dx", 4)
    .attr("dy", 28)
    .text(d => {
      if (d.depth === 0) { // Ensuring that world is selected
        return "";
      } else if (d.depth === 1) { // Ensuring that continent is selected
        return numberFormatter(d.value);
      } else if (d.depth === 2) { // Ensuring that country is selected
        return d.data.location;
      } else { // Ensuring that state/province is selected
        return d.data.location;
      }
    })
    .attr("fill", "white")
    .style("font-size", "16px");


});

