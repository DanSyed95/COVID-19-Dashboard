// Set the dimensions of the SVG gdp bar canvas and World Bar
const gdpMargin = { top: 20, right: 50, bottom: 100, left: 150 },
  gdpWidth = 600 - gdpMargin.left - gdpMargin.right,
  gdpHeight = 350 - gdpMargin.top - gdpMargin.bottom;

// Create the SVG for cases per month for high and low gdp countries
let gdpSvg = d3.select("#gdp")
  .append("svg")
  .attr("width", gdpWidth + gdpMargin.left + gdpMargin.right)
  .attr("height", gdpHeight + gdpMargin.top + gdpMargin.bottom)
  .append("g")
  .attr("transform", "translate(" + gdpMargin.left + "," + gdpMargin.top + ")")

// Monthly Cases Worldwide Bar chart  
let worldSvg = d3.select("#gdp")
  .append("svg")
  .attr("class", "worldBar")
  .attr("width", gdpWidth + gdpMargin.left + gdpMargin.right)
  .attr("height", gdpHeight + gdpMargin.top + gdpMargin.bottom)
  .append("g")
  .attr("transform", "translate(" + gdpMargin.left + "," + gdpMargin.top + ")")

// Load the COVID CSV data
d3.csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv", (d) => ({
  date: d3.timeParse("%Y-%m-%d")(d.date),
  cases: +d.new_cases_per_million || +0,  // Cases per million considered
  code: d.iso_code,
  country: d.location
})).then(data => {

  // Filter the data from March 2020 to November 2022
  data = data.filter(d => d.date >= d3.timeParse("%Y-%m-%d")("2020-03-01") && d.date <= d3.timeParse("%Y-%m-%d")("2022-11-30"));

  // Selected High GDP countries
  const highGdpCountries = ["Qatar", "Iceland", "Norway", "Switzerland", "Singapore"]
  // Selected Low GDP countries
  const lowGdpCountries = ["Bangladesh", "India", "Zimbabwe", "Nigeria", "Haiti"]

  // Concatenated List of both high and low GDP countries
  const combinedList = highGdpCountries.concat(lowGdpCountries)

  // Filtering data for only the specified countries
  const filteredData = data.filter(d => combinedList.includes(d.country));

  // Creating an aggregate for the entire time duration of March 2020 to November 2022
  const dataByCountry = d3.rollup(
    filteredData,
    // group by country
    v => ({
      cases: d3.sum(v, d => d.cases),
    }),
    d => d.country
  );

  // Aggregate data by months only for the specified countries
  let dataByMonth = d3.rollup(data,
    // map function
    function (d) {
      return {
        cases: d3.sum(d, function (e) { return e.cases; }),
        deaths: d3.sum(d, function (e) { return e.deaths; })
      };
    },
    // key function
    function (d) { return d3.timeFormat("%B %Y")(d.date); }
  );

  // Get the list of months
  let months = Array.from(dataByMonth.keys());

  // Create a scale for the x-axis (months)
  const xScaleWorld = d3.scaleBand()
    .domain(months)
    .range([0, gdpWidth])
    .paddingInner(0.1)

  // Create a scale for the y-axis (new cases)
  const yScaleCasesWorld = d3.scaleLinear()
    .domain([0, d3.max(Array.from(dataByMonth.values()), function (d) { return d.cases; })])
    .range([gdpHeight, 0])

  // Add the x-axis for world bar chart
  worldSvg.append("g")
    .attr("class", "axis-x")
    .attr("transform", "translate(0," + gdpHeight + ")")
    .call(d3.axisBottom(xScaleWorld).tickValues(xScaleWorld.domain().filter((_, i) => !(i % 8)))) // tick values filtered 
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  // Removes x-axis in the display

  // Add x label
  worldSvg.append("text")
    .attr("class", "x-label")
    .attr("x", (gdpWidth / 2) + 20)
    .attr("y", gdpHeight + 15)
    .text("Month");


  // Add the y-axis to world data bar chart
  worldSvg.append("g")
    .attr("class", "axis-y")
    .call(d3.axisLeft(yScaleCasesWorld).ticks(5))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-30)");

  // Add y-axis label
  worldSvg.append("text")
    .attr("class", "y-label")
    .attr("x", -70)
    .attr("y", -7)
    .text("New Cases");

  // Adding the bars to the world bar chart
  worldSvg.selectAll("#gdpCasebar")
    .data(Array.from(dataByMonth.entries()))
    .join("rect")
    .attr("id", "gdpCasebar")
    .attr("x", d => xScaleWorld(d[0]))
    .attr("y", gdpHeight)
    .attr("width", xScaleWorld.bandwidth())
    .attr("height", 0)
    .style("fill", "orange")
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .attr("y", d => yScaleCasesWorld(d[1].cases))
    .attr("height", d => gdpHeight - yScaleCasesWorld(d[1].cases))



  // Creating an array from the total aggregated map
  const dataArray = Array.from(dataByCountry, d => ({ country: d[0], cases: d[1].cases }));

  // Sorting the array by country order from the original lists
  dataArray.sort((a, b) => {

    const indexA = combinedList.indexOf(a.country);
    const indexB = combinedList.indexOf(b.country);

    // If both a and b are in the array, sort based on the indices
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only a is in the array, sort it higher
    else if (indexA !== -1) {
      return -1;
    }
    // If only b is in the array, sort it higher
    else if (indexB !== -1) {
      return 1;
    }
    // If neither a nor b is in the array, sort based on cases
    else {
      return d3.descending(a.cases, b.cases);
    }
  });

  // x scale for the GDP bar chart
  const x = d3.scaleLinear()
    .domain([0, d3.max(dataArray, d => d.cases)])
    .range([0, gdpWidth]);

  // y scale for the GDP bar chart
  const y = d3.scaleBand()
    .domain(dataArray.map(d => d.country))
    .range([0, gdpHeight])
    .padding(0.1);

  // Grouping the elements  
  gdpSvg
    .append("g")
    .attr("transform", `translate(${gdpMargin.left},${gdpMargin.top})`);

  // Adding bars to the GDP bar chart
  gdpSvg.selectAll(".gdp-bar")
    .data(dataArray)
    .join('rect')
    .attr("class", "gdp-bar")
    .attr("x", 0)
    .attr("y", d => y(d.country))
    .attr("width", 0)
    .attr("height", y.bandwidth())
    .attr("fill", d => {
      if (highGdpCountries.includes(d.country)) {
        return "green";
      } else {
        return "darkred";
      }
    })
    .transition() // add a transition effect
    .duration(1000)
    .attr("width", d => x(d.cases)); // animate to final width

  // y axis country name labels
  gdpSvg.selectAll("text")
    .data(dataArray)
    .join("text")
    .attr("x", -90)
    .attr("y", d => y(d.country) + y.bandwidth() / 2)
    .attr("alignment-baseline", "middle")
    .text(d => d.country);


  // Create the y-axis grid lines for visuals
  const yGrid = d3.axisLeft(y)
    .tickSize(-gdpWidth)
    .tickFormat("")
    .ticks(dataArray.length);

  // Add the y-axis grid lines to the GDP bar chart
  gdpSvg.append("g")
    .attr("class", "y-grid")
    .call(yGrid);

  // Style the y axis grid lines
  gdpSvg.selectAll(".y-grid line")
    .attr("stroke", "lightgrey")
    .attr("stroke-opacity", 0.7)
    .attr("stroke-dasharray", "2,2");


  // Create the brush component and set its extent to the full width and height of the chart
  const brush = d3.brushX()
    .extent([[0, 0], [gdpWidth, gdpHeight]])
    .on("end", brushed);

  // Create a new group for the brush component
  const brushGroup = worldSvg.append("g")
    .attr("class", "brush")


  // Call the brush component to the brushGroup element
  brushGroup.call(brush);

  // Define the brushed function to filter the data in the gdpSvg chart based on the selected range in the World Bar Chart
  function brushed(event) {
    if (!event.selection) return;

    // Creating brush range tied to event listener
    const [x0, x1] = event.selection;

    // Filter the data based on the brushed region
    const brushFilteredData = filteredData.filter(d => {
      const x = xScaleWorld(d3.timeFormat("%B %Y")(d.date));
      return x >= x0 && x <= x1;
    });

    // Aggregate data by Country
    const filteredDataByCountry = d3.rollup(
      brushFilteredData,
      v => ({
        cases: d3.sum(v, d => d.cases),
      }),
      d => d.country
    );


    // Create a new array from the object
    const dataArrayBrush = Array.from(filteredDataByCountry, d => ({ country: d[0], cases: d[1].cases }));
    // Remove all initial bar data
    gdpSvg.selectAll(".gdp-bar").remove()

    // Update the GDP bars on the gdpSvg
    gdpSvg
      .append("g")
      .attr("transform", `translate(${gdpMargin.left},${gdpMargin.top})`);

    gdpSvg.selectAll(".gdp-bar")
      .data(dataArrayBrush)
      .join('rect')
      .attr("class", "gdp-bar")
      .attr("x", 0)
      .attr("y", d => y(d.country))
      .attr("width", 0) // start with zero width
      .attr("height", y.bandwidth())
      .attr("fill", d => {
        if (highGdpCountries.includes(d.country)) {
          return "green";
        } else {
          return "darkred";
        }
      })
      .transition()
      .duration(1000)
      .attr("width", d => x(d.cases));

  }

  // Add a legend to the GDP bar chart
  const legend = gdpSvg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (gdpWidth - 140) + "," + (gdpHeight - 80) + ")");

  // High GDP Countries
  legend.append("rect")
    .attr("class", "high-gdp")
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", "green");

  legend.append("text")
    .attr("x", 30)
    .attr("y", 15)
    .text("High GDP Countries");

  // Low GDP countries
  legend.append("rect")
    .attr("class", "low-gdp")
    .attr("x", 0)
    .attr("y", 30)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", "#8B0000");

  legend.append("text")
    .attr("x", 30)
    .attr("y", 45)
    .text("Low GDP Countries");



})

