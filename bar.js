// Set the dimensions of the SVG bar canvas
const barmargin = { top: 20, right: 20, bottom: 50, left: 100 },
  barwidth = 650 - barmargin.left - barmargin.right,
  barheight = 250 - barmargin.top - barmargin.bottom;
// Country Header
let countryHeader = d3.select("#bar")
  .append("text")
  .attr("class", "country-header")
  .attr("x", 0)
  .attr("y", 0)
  .attr("text-anchor", "middle")
  .style("font-size", "20px")
  .style("font-family", "Helvetica")
  .style("font-weight", "bold")
  .text("World");

// Create the SVG for cases per month
let casesSvg = d3.select("#bar")
  .append("svg")
  .attr("width", barwidth + barmargin.left + barmargin.right)
  .attr("height", barheight + barmargin.top + barmargin.bottom)
  .append("g")
  .attr("transform", "translate(" + barmargin.left + "," + barmargin.top + ")")

// Create the SVG for deaths per month
let deathsSvg = d3.select("#bar")
  .append("svg")
  .attr("width", barwidth + barmargin.left + barmargin.right)
  .attr("height", barheight + barmargin.top + barmargin.bottom)
  .append("g")
  .attr("transform", "translate(" + barmargin.left + "," + barmargin.top + ")")

// Create the SVG for vaccinations per month
let vaccinesSvg = d3.select("#bar")
  .append("svg")
  .attr("width", barwidth + barmargin.left + barmargin.right)
  .attr("height", barheight + barmargin.top + barmargin.bottom)
  .append("g")
  .attr("transform", "translate(" + barmargin.left + "," + barmargin.top + ")")


// Load the COVID CSV data
d3.csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv", (d) => ({
  date: d3.timeParse("%Y-%m-%d")(d.date),
  cases: +d.new_cases_smoothed || 0,
  deaths: +d.new_deaths || 0,
  code: d.iso_code,
  country: d.location
})).then(function (data) {

  // filter data by date
  data = data.filter(d => d.date >= d3.timeParse("%Y-%m-%d")("2020-03-01") && d.date <= d3.timeParse("%Y-%m-%d")("2022-11-30"));
  // Group the data by country for the dropdown options
  let dataByCountry = d3.group(data, d => d.country);
  // Format Numbers by adding commas
  const numberFormatter = d3.format(",")
  // Extract the list of country names
  let countryNames = Array.from(dataByCountry.keys());
  // Create the dropdown menu
  let dropdown = d3.select("#dropdown")
    .append("select")
    .on("change", update);

  // Bind the list of country names to the dropdown menu
  dropdown.selectAll("option")
    .data(countryNames)
    .join("option")
    .text(function (d) { return d; })
    .property("value", function (d) { return d; })
    .property("selected", function (d) { return d === "World"; }); // Default Initial Values are for the world

  // Aggregate data by month
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
  // Get the list of countries
  let months = Array.from(dataByMonth.keys());

  // Create a scale for the x-axis (months)
  const xScale = d3.scaleBand()
    .domain(months)
    .range([0, barwidth])
    .paddingInner(0.1);

  // Create a scale for the y-axis (new cases)
  const yScaleCases = d3.scaleLinear()
    .domain([0, d3.max(Array.from(dataByMonth.values()), function (d) { return d.cases; })])
    .range([barheight, 0])


  // Create a scale for the y-axis (new deaths)
  const yScaleDeaths = d3.scaleLinear()
    .domain([0, d3.max(Array.from(dataByMonth.values()), function (d) { return d.deaths; })])
    .range([barheight, 0])

  // Cases bar chart

  // Remove any previous x-axis
  casesSvg.select(".axis-x").remove();
  // Add the x-axis
  casesSvg.append("g")
    .attr("class", "axis-x")
    .attr("transform", "translate(0," + barheight + ")")
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  // Removes x-axis in the display
  casesSvg.select(".axis-x").selectAll(".tick").remove();
  // Remove any previous x-label
  casesSvg.select(".x-label").remove();
  //Creates x-label
  casesSvg.append("text")
    .attr("class", "x-label")
    .attr("x", barwidth / 2)
    .attr("y", barheight + 15)
    .text("Month");

  // Remove any previous y-axis
  casesSvg.select(".axis-y").remove();
  // Add the y-axis
  casesSvg.append("g")
    .attr("class", "axis-y")
    .call(d3.axisLeft(yScaleCases).ticks(5))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-30)");

  // Remove any previous y-label
  casesSvg.select(".y-label").remove();
  // Add y-axis labels to casesSvg
  casesSvg.append("text")
    .attr("class", "y-label")
    .attr("x", -70)
    .attr("y", -7)
    .text("New Cases");

  // Function to Highlight all corresponding bars during mousemove event
  function highlightBars(data, highlight) {
    casesSvg.selectAll("#casebar")
      .filter(d => d[0] === data[0])
      .style("fill", highlight ? "orange" : "steelblue");
    deathsSvg.selectAll("#deathbar")
      .filter(d => d[0] === data[0])
      .style("fill", highlight ? "orange" : "red");
    vaccinesSvg.selectAll("#vaccinesbar")
      .filter(d => d[0] === data[0])
      .style("fill", highlight ? "orange" : "purple");
  }

  // Add the case bars with transition effect

  casesSvg.selectAll("#casebar")
    .data(Array.from(dataByMonth.entries()))
    .join("rect")
    .attr("id", "casebar")
    .attr("x", d => xScale(d[0]))
    .attr("y", barheight)
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .style("fill", "steelblue")
    .on("mousemove", (event, d) => {
      highlightBars(d, true);
    })
    .on("mouseleave", (event, d) => {
      d3.select(event.currentTarget)
        .style("fill", "steelblue")
      highlightBars(d, false);
    })
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .attr("y", d => yScaleCases(d[1].cases))
    .attr("height", d => barheight - yScaleCases(d[1].cases))


  // Deaths bar chart

  // Remove any previous x-axis
  deathsSvg.select(".axis-x").remove();
  // Add the x-axis
  deathsSvg.append("g")
    .attr("class", "axis-x")
    .attr("transform", "translate(0," + barheight + ")")
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  // Removes x-axis in the display
  deathsSvg.select(".axis-x").selectAll(".tick").remove();
  // Remove any previous x-label
  deathsSvg.select(".x-label").remove();
  // Add x-axis labels to deathsSvg
  deathsSvg.append("text")
    .attr("class", "x-label")
    .attr("x", barwidth / 2)
    .attr("y", barheight + 15)
    .text("Month");

  // Remove any previous y-axis
  deathsSvg.select(".axis-y-2").remove();
  // Add the y-axis
  deathsSvg.append("g")
    .attr("class", "axis-y-2")
    .call(d3.axisLeft(yScaleDeaths).ticks(5))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-30)");

  // Remove any previous y-label
  deathsSvg.select(".y-label").remove();
  // Add y-axis labels to deathsSvg
  deathsSvg.append("text")
    .attr("class", "y-label")
    .attr("x", -40)
    .attr("y", -8)
    .text("Deaths");

  // Add the death bars with transition effect
  deathsSvg.selectAll("#deathbar")
    .data(Array.from(dataByMonth.entries()))
    .join("rect")
    .attr("id", "deathbar")
    .attr("x", function (d) { return xScale(d[0]); })
    .attr("y", barheight)
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .style("fill", "red")
    .on("mousemove", (event, d) => {
      highlightBars(d, true);
    })
    .on("mouseleave", (event, d) => {
      highlightBars(d, false);
    })
    .transition() // Add transition effect
    .duration(1000) // duration in ms
    .ease(d3.easeLinear) //easing function
    .attr("y", function (d) { return yScaleDeaths(d[1].deaths); }) // Set final y position
    .attr("height", function (d) { return barheight - yScaleDeaths(d[1].deaths); }); // Set final height



  // Load in vaccination dataset  
  d3.csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.csv", (d) => ({
    date: d3.timeParse("%Y-%m-%d")(d.date),
    code: d.iso_code,
    country: d.location,
    vaccinations: d.daily_people_vaccinated
  })).then(function (vaccinesData) {

    // Tooltip function for each bar chart
    function tip(event, d) {
      const tooltipWidth = 175;
      const tooltipHeight = 50;
      const casesTooltip = casesSvg.append("g")
        .attr("class", "tooltip-1")
        .attr("transform", `translate(5, -5)`);
      casesTooltip.append("rect")
        .attr("width", tooltipWidth)
        .attr("height", tooltipHeight)
        .attr("rx", "10")
        .attr("fill", "turquoise")
        .style("opacity", 0.5)

      casesTooltip.append("text")
        .text(`Month: ` + `${d[0]}`)
        .style("font-family", "Arial, Helvetica, sans-serif")
        .style("font-size", "12px")
        .attr("x", 5)
        .attr("y", 15);

      casesTooltip.append("text")
        .text(() => {
          const caseData = dataByMonth.get(d[0]).cases
          if (caseData) {
            return `New Cases: ` + `${numberFormatter(Math.round(dataByMonth.get(d[0]).cases))}`
          }
          return "New Cases: N/A";
        })
        .style("font-family", "Arial, Helvetica, sans-serif")
        .style("font-size", "12px")
        .attr("x", 5)
        .attr("y", 30);

      const deathsTip = deathsSvg.append("g")
        .attr("class", "tooltip-2")
        .attr("transform", `translate(5, -5)`);

      deathsTip.append("rect")
        .attr("width", tooltipWidth)
        .attr("height", tooltipHeight)
        .attr("rx", "10")
        .attr("fill", "turquoise")
        .style("opacity", 0.5)

      deathsTip.append("text")
        .text(`Month: ` + `${d[0]}`)
        .style("font-family", "Arial, Helvetica, sans-serif")
        .style("font-size", "12px")
        .attr("x", 5)
        .attr("y", 15);

      deathsTip.append("text")
        .text(() => {
          const deathData = dataByMonth.get(d[0]).deaths
          if (deathData) {
            return `New Deaths: ` + `${numberFormatter(Math.round(dataByMonth.get(d[0]).deaths))}`
          }
          return "New Deaths: N/A";
        })
        .style("font-family", "Arial, Helvetica, sans-serif")
        .style("font-size", "12px")
        .attr("x", 5)
        .attr("y", 30);

      const vaccinesTip = vaccinesSvg.append("g")
        .attr("class", "tooltip-3")
        .attr("transform", `translate(5, -5)`);

      vaccinesTip.append("rect")
        .attr("width", tooltipWidth)
        .attr("height", tooltipHeight)
        .attr("rx", "10")
        .attr("fill", "turquoise")
        .style("opacity", 0.5)

      vaccinesTip.append("text")
        .text(`Month: ` + `${d[0]}`)
        .style("font-family", "Arial, Helvetica, sans-serif")
        .style("font-size", "12px")
        .attr("x", 5)
        .attr("y", 15);

      vaccinesTip.append("text")
        .text(() => {
          const vaccineData = dataByMonthVaccines.get(d[0])
          if (vaccineData) {
            return `New Vaccinations: ` + `${numberFormatter(Math.round(dataByMonthVaccines.get(d[0]).vaccinations))}`
          }
          else {
            return "New Vaccinations: N/A";
          }
        })
        .style("font-family", "Arial, Helvetica, sans-serif")
        .style("font-size", "12px")
        .attr("x", 5)
        .attr("y", 30);
    }

    // Create Mouseover and Mouseout event for tooptip
    casesSvg.selectAll("#casebar")
      .on("mouseover", tip)
      .on("mouseout", (event, d) => {
        // Remove the tooltip element
        casesSvg.select(".tooltip-1").remove();
        deathsSvg.select(".tooltip-2").remove();
        vaccinesSvg.select(".tooltip-3").remove();
      })

    deathsSvg.selectAll("#deathbar")
      .on("mouseover", tip)
      .on("mouseout", (event, d) => {
        // Remove the tooltip element
        casesSvg.select(".tooltip-1").remove();
        deathsSvg.select(".tooltip-2").remove();
        vaccinesSvg.select(".tooltip-3").remove();
      })

    vaccinesData = vaccinesData.filter(d => d.code.includes("OWID_WRL"));
    // Filter out dates before March 2020 and before November 2022
    vaccinesData = vaccinesData.filter(d => d.date >= d3.timeParse("%Y-%m-%d")("2020-03-01") && d.date <= d3.timeParse("%Y-%m-%d")("2022-11-30"));
    // Group the data by country
    let dataByMonthVaccines = d3.rollup(vaccinesData,
      // map function
      function (d) {
        return {
          vaccinations: d3.sum(d, function (e) { return e.vaccinations; }),
        };
      },
      // key function
      function (d) { return d3.timeFormat("%B %Y")(d.date); }
    );

    // Get the list of countries
    let months = Array.from(dataByMonthVaccines.keys());

    // Create a scale for the y-axis (new people vaccinated)
    let yScaleVaccines = d3.scaleLinear()
      .domain([0, d3.max(Array.from(dataByMonthVaccines.values()), function (d) { return d.vaccinations; })])
      .range([barheight, 0])

    // Vaccines  bar chart

    // Remove any previous x-axis
    vaccinesSvg.select(".axis-x").remove();
    // Add the x-axis
    vaccinesSvg.append("g")
      .attr("class", "axis-x")
      .attr("transform", "translate(0," + barheight + ")")
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    // Removes x-axis in the display
    vaccinesSvg.select(".axis-x").selectAll(".tick").remove();

    // Removes labels
    vaccinesSvg.select(".x-label").remove();
    // Add y-axis labels to vaccinesSvg
    vaccinesSvg.append("text")
      .attr("class", "x-label")
      .attr("x", barwidth / 2)
      .attr("y", barheight + 15)
      .text("Month");

    // Remove any previous y-axis
    vaccinesSvg.select(".axis-y-3").remove();
    // Add the y-axis
    vaccinesSvg.append("g")
      .attr("class", "axis-y-3")
      .call(d3.axisLeft(yScaleVaccines).ticks(5))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-30)");

    // Removes labels
    vaccinesSvg.select(".y-label").remove();
    // Add y-axis labels to vaccinesSvg
    vaccinesSvg.append("text")
      .attr("class", "y-label")
      .attr("x", -70)
      .attr("y", -7)
      .text("New People Vaccinated");

    // Add the vaccine bars

    vaccinesSvg.selectAll("#vaccinesbar")
      .data(Array.from(dataByMonthVaccines.entries()))
      .join("rect")
      .attr("id", "vaccinesbar")
      .attr("x", d => xScale(d[0]))
      .attr("y", barheight)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .style("fill", "purple")
      .on("mousemove", (event, d) => {
        highlightBars(d, true);
      })
      .on("mouseleave", (event, d) => {
        highlightBars(d, false);
      })
      .on("mouseover", tip)
      .on("mouseout", (event, d) => {
        // Remove the tooltip element
        casesSvg.select(".tooltip-1").remove();
        deathsSvg.select(".tooltip-2").remove();
        vaccinesSvg.select(".tooltip-3").remove();
      })
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr("y", d => yScaleVaccines(d[1].vaccinations))
      .attr("height", d => barheight - yScaleVaccines(d[1].vaccinations))


  })

  // Update Function


  // Function to update the visualization when a new country is selected
  function update() {
    // Get the selected country
    let selectedCountry = dropdown.property("value");
    let filteredata = data.filter(d => d.country === selectedCountry)

    // Update the country header
    countryHeader.text(selectedCountry);
    let dataByMonth = d3.rollup(filteredata,
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
    // Get the list of countries
    let months = Array.from(dataByMonth.keys());

    // Create a scale for the x-axis (countries)
    const xScale = d3.scaleBand()
      .domain(months)
      .range([0, barwidth])
      .paddingInner(0.1);

    // Create a scale for the y-axis (new cases)
    const yScaleCases = d3.scaleLinear()
      .domain([0, d3.max(Array.from(dataByMonth.values()), function (d) { return d.cases; })])
      .range([barheight, 0])


    // Create a scale for the y-axis (new deaths)
    const yScaleDeaths = d3.scaleLinear()
      .domain([0, d3.max(Array.from(dataByMonth.values()), function (d) { return d.deaths; })])
      .range([barheight, 0])

    // Cases bar chart

    // Remove the previous x-axis
    casesSvg.select(".axis-x").remove();
    // Add the x-axis
    casesSvg.append("g")
      .attr("class", "axis-x")
      .attr("transform", "translate(0," + barheight + ")")
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    // Removes x-axis in the display
    casesSvg.select(".axis-x").selectAll(".tick").remove();
    // Removes x labels
    casesSvg.select(".x-label").remove();
    casesSvg.append("text")
      .attr("class", "x-label")
      .attr("x", barwidth / 2)
      .attr("y", barheight + 15)
      .text("Month");

    // Remove the previous y-axis
    casesSvg.select(".axis-y").remove();
    // Add the y-axis
    casesSvg.append("g")
      .attr("class", "axis-y")
      .call(d3.axisLeft(yScaleCases).ticks(5))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-30)");

    // Removes y labels
    casesSvg.select(".y-label").remove();
    // Add y-axis labels to casesSvg
    casesSvg.append("text")
      .attr("class", "y-label")
      .attr("x", -70)
      .attr("y", -7)
      .text("New Cases");

    // Highlight all corresponding bars in each individual SVG
    function highlightBars(data, highlight) {
      casesSvg.selectAll("#casebar")
        .filter(d => d[0] === data[0])
        .style("fill", highlight ? "orange" : "steelblue");
      deathsSvg.selectAll("#deathbar")
        .filter(d => d[0] === data[0])
        .style("fill", highlight ? "orange" : "red");
      vaccinesSvg.selectAll("#vaccinesbar")
        .filter(d => d[0] === data[0])
        .style("fill", highlight ? "orange" : "purple");
    }

    // Add the case bars

    casesSvg.selectAll("#casebar")
      .data(Array.from(dataByMonth.entries()))
      .join("rect")
      .attr("id", "casebar")
      .attr("x", d => xScale(d[0]))
      .attr("y", barheight)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .style("fill", "steelblue")
      .on("mousemove", (event, d) => {
        highlightBars(d, true);
      })
      .on("mouseleave", (event, d) => {
        d3.select(event.currentTarget)
          .style("fill", "steelblue")
        highlightBars(d, false);
      })
      .on("mouseout", (event, d) => {
        // Remove the tooltip element
        casesSvg.select(".tooltip").remove();
        deathsSvg.select(".tooltip").remove();
        vaccinesSvg.select(".tooltip").remove();

      })
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr("y", d => yScaleCases(d[1].cases))
      .attr("height", d => barheight - yScaleCases(d[1].cases))


    // Deaths bar chart

    // Remove the previous x-axis
    deathsSvg.select(".axis-x").remove();
    // Add the x-axis
    deathsSvg.append("g")
      .attr("class", "axis-x")
      .attr("transform", "translate(0," + barheight + ")")
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    // Removes x-axis in the display
    deathsSvg.select(".axis-x").selectAll(".tick").remove();

    // Removes labels
    deathsSvg.select(".x-label").remove();
    // Add x-axis labels to deathsSvg
    deathsSvg.append("text")
      .attr("class", "x-label")
      .attr("x", barwidth / 2)
      .attr("y", barheight + 15)
      .text("Month");

    // Remove the previous y-axis
    deathsSvg.select(".axis-y-2").remove();
    // Add the y-axis
    deathsSvg.append("g")
      .attr("class", "axis-y-2")
      .call(d3.axisLeft(yScaleDeaths).ticks(5))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-30)");

    // Removes labels
    deathsSvg.select(".y-label").remove();
    // Add y-axis labels to deathsSvg
    deathsSvg.append("text")
      .attr("class", "y-label")
      .attr("x", -40)
      .attr("y", -8)
      .text("Deaths");

    // Add the death bars
    deathsSvg.selectAll("#deathbar")
      .data(Array.from(dataByMonth.entries()))
      .join("rect")
      .attr("id", "deathbar")
      .attr("x", function (d) { return xScale(d[0]); })
      .attr("y", barheight)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .style("fill", "red")
      .on("mousemove", (event, d) => {
        highlightBars(d, true);
      })
      .on("mouseout", (event, d) => {
        highlightBars(d, false);
      })
      .transition() // Add transition effect
      .duration(1000) // duration in ms
      .ease(d3.easeLinear) //easing function
      .attr("y", function (d) { return yScaleDeaths(d[1].deaths); }) // Set final y position
      .attr("height", function (d) { return barheight - yScaleDeaths(d[1].deaths); }); // Set final height

    // Loading the vaccination dataset
    d3.csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.csv", (d) => ({
      date: d3.timeParse("%Y-%m-%d")(d.date),
      code: d.iso_code,
      country: d.location,
      vaccinations: d.daily_people_vaccinated
    })).then(function (vaccinesData) {

      // Tooltip function for each bar chart
      function tip(event, d) {
        const tooltipWidth = 175;
        const tooltipHeight = 50;
        const casesTooltip = casesSvg.append("g")
          .attr("class", "tooltip-1")
          .attr("transform", `translate(5, -5)`);
        casesTooltip.append("rect")
          .attr("width", tooltipWidth)
          .attr("height", tooltipHeight)
          .attr("rx", "10")
          .attr("fill", "turquoise")
          .style("opacity", 0.5)

        casesTooltip.append("text")
          .text(`Month: ` + `${d[0]}`)
          .style("font-family", "Arial, Helvetica, sans-serif")
          .style("font-size", "12px")
          .attr("x", 5)
          .attr("y", 15);

        casesTooltip.append("text")
          .text(() => {
            const caseData = dataByMonth.get(d[0]).cases
            if (caseData) {
              return `New Cases: ` + `${numberFormatter(Math.round(dataByMonth.get(d[0]).cases))}`
            }
            return "New Cases: N/A";
          })
          .style("font-family", "Arial, Helvetica, sans-serif")
          .style("font-size", "12px")
          .attr("x", 5)
          .attr("y", 30);

        const deathsTip = deathsSvg.append("g")
          .attr("class", "tooltip-2")
          .attr("transform", `translate(5, -5)`);

        deathsTip.append("rect")
          .attr("width", tooltipWidth)
          .attr("height", tooltipHeight)
          .attr("rx", "10")
          .attr("fill", "turquoise")
          .style("opacity", 0.5)

        deathsTip.append("text")
          .text(`Month: ` + `${d[0]}`)
          .style("font-family", "Arial, Helvetica, sans-serif")
          .style("font-size", "12px")
          .attr("x", 5)
          .attr("y", 15);

        deathsTip.append("text")
          .text(() => {
            const deathData = dataByMonth.get(d[0]).deaths
            if (deathData) {
              return `New Deaths: ` + `${numberFormatter(Math.round(dataByMonth.get(d[0]).deaths))}`
            }
            return "New Deaths: N/A";
          })
          .style("font-family", "Arial, Helvetica, sans-serif")
          .style("font-size", "12px")
          .attr("x", 5)
          .attr("y", 30);

        const vaccinesTip = vaccinesSvg.append("g")
          .attr("class", "tooltip-3")
          .attr("transform", `translate(5, -5)`);

        vaccinesTip.append("rect")
          .attr("width", tooltipWidth)
          .attr("height", tooltipHeight)
          .attr("rx", "10")
          .attr("fill", "turquoise")
          .style("opacity", 0.5)

        vaccinesTip.append("text")
          .text(`Month: ` + `${d[0]}`)
          .style("font-family", "Arial, Helvetica, sans-serif")
          .style("font-size", "12px")
          .attr("x", 5)
          .attr("y", 15);

        vaccinesTip.append("text")
          .text(() => {
            const vaccineData = dataByMonthVaccines.get(d[0])
            if (vaccineData) {
              return `New Vaccinations: ` + `${numberFormatter(Math.round(dataByMonthVaccines.get(d[0]).vaccinations))}`
            }
            else {
              return "New Vaccinations: N/A";
            }
          })
          .style("font-family", "Arial, Helvetica, sans-serif")
          .style("font-size", "12px")
          .attr("x", 5)
          .attr("y", 30);
      }

      // Create Mouseover and Mouseout event for tooptip
      casesSvg.selectAll("#casebar")
        .on("mouseover", tip)
        .on("mouseout", (event, d) => {
          // Remove the tooltip element
          casesSvg.select(".tooltip-1").remove();
          deathsSvg.select(".tooltip-2").remove();
          vaccinesSvg.select(".tooltip-3").remove();
        })

      deathsSvg.selectAll("#deathbar")
        .on("mouseover", tip)
        .on("mouseout", (event, d) => {
          // Remove the tooltip element
          casesSvg.select(".tooltip-1").remove();
          deathsSvg.select(".tooltip-2").remove();
          vaccinesSvg.select(".tooltip-3").remove();
        })
      // Filter out dates before March 2020 and after November 2022
      vaccinesData = vaccinesData.filter(d => d.date >= d3.timeParse("%Y-%m-%d")("2020-03-01") && d.date <= d3.timeParse("%Y-%m-%d")("2022-11-30"));
      let filteredata = vaccinesData.filter(d => d.country === selectedCountry)
      // Group the data by country
      let dataByMonthVaccines = d3.rollup(filteredata,
        // map function
        function (d) {
          return {
            vaccinations: d3.sum(d, function (e) { return e.vaccinations; }),
          };
        },
        // key function
        function (d) { return d3.timeFormat("%B %Y")(d.date); }
      );

      // Create a scale for the y-axis (new people vaccinated)
      let yScaleVaccines = d3.scaleLinear()
        .domain([0, d3.max(Array.from(dataByMonthVaccines.values()), function (d) { return d.vaccinations; })])
        .range([barheight, 0])


      // New People Vaccinated bar chart

      // Remove any previous x-axis
      vaccinesSvg.select(".axis-x").remove();
      // Add the x-axis
      vaccinesSvg.append("g")
        .attr("class", "axis-x")
        .attr("transform", "translate(0," + barheight + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

      // Removes x-axis in the display
      vaccinesSvg.select(".axis-x").selectAll(".tick").remove();

      // Removes labels
      vaccinesSvg.select(".x-label").remove();
      vaccinesSvg.append("text")
        .attr("class", "x-label")
        .attr("x", barwidth / 2)
        .attr("y", barheight + 15)
        .text("Month");
      // Remove any previous y-axis
      vaccinesSvg.select(".axis-y-3").remove();
      // Add the y-axis
      vaccinesSvg.append("g")
        .attr("class", "axis-y-3")
        .call(d3.axisLeft(yScaleVaccines).ticks(5))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-30)");

      // Removes labels
      vaccinesSvg.select(".y-label").remove();
      // Add y-axis labels to vaccinesSvg
      vaccinesSvg.append("text")
        .attr("class", "y-label")
        .attr("x", -70)
        .attr("y", -7)
        .text("New People Vaccinated");

      // Add the vaccine bars

      vaccinesSvg.selectAll("#vaccinesbar")
        .data(Array.from(dataByMonthVaccines.entries()))
        .join("rect")
        .attr("id", "vaccinesbar")
        .attr("x", d => xScale(d[0]))
        .attr("y", barheight)
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .style("fill", "purple")
        .on("mousemove", (event, d) => {
          highlightBars(d, true);
        })
        .on("mouseleave", (event, d) => {
          highlightBars(d, false);
        })
        .on("mouseover", tip)
        .on("mouseout", (event, d) => {
          // Remove the tooltip element
          casesSvg.select(".tooltip-1").remove();
          deathsSvg.select(".tooltip-2").remove();
          vaccinesSvg.select(".tooltip-3").remove();
        })
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr("y", d => yScaleVaccines(d[1].vaccinations))
        .attr("height", d => barheight - yScaleVaccines(d[1].vaccinations))
    })
  }

});
