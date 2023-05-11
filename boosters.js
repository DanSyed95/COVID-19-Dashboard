// Set up the dimensions of the chart
const boostersWidth = 600;
const boostersHeight = 500;
const boostersMargin = { top: 100, right: 100, bottom: 100, left: 100 };

// create the SVG element
const boosterSvg = d3.select("#boosters")
  .append("svg")
  .attr("width", boostersWidth + boostersMargin.left + boostersMargin.right)
  .attr("height", boostersHeight + boostersMargin.top + boostersMargin.bottom)

// create a group element for the chart
boosterSvg.append("g")
  .attr("transform", `translate(${boostersMargin.left}, ${boostersMargin.top / 2})`);


// Loading the vaccination dataset
d3.csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.csv", (d) => ({
  date: d3.timeParse("%Y-%m-%d")(d.date),
  code: d.iso_code,
  country: d.location,
  boosters: d.total_boosters
})).then(function (vaccinesData) {

  // Filter out dates before March 2020 and after November 2022
  vaccinesData = vaccinesData.filter(d => d.date >= d3.timeParse("%Y-%m-%d")("2020-03-01") && d.date <= d3.timeParse("%Y-%m-%d")("2022-11-30"));
  let filteredData = vaccinesData.filter(d => d.country === "World");

  let dataByMonthVaccines = d3.rollup(filteredData,
    // map function
    function (d) {
      return {
        boosters: d3.sum(d, function (e) {
          if (isLastDayOfMonth(e.date)) {
            return e.boosters;
          } else {
            return 0;
          }
        }),
      };
    },
    // key function
    function (d) {
      return d3.timeFormat("%B %Y")(d.date);
    }
  );

  // Function to check if it is the last day of the month
  function isLastDayOfMonth(date) {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return date.getDate() === lastDay.getDate();
  }



  // Get the list of months
  let months = Array.from(dataByMonthVaccines.keys());

  // Create a scale for the y-axis (total boosters)
  let yScaleVaccines = d3.scaleLinear()
    .domain([0, d3.max(Array.from(dataByMonthVaccines.values()), function (d) { return d.boosters; })])
    .range([boostersHeight, 0]);

  // Create a scale for the x-axis (months)
  const xScale = d3.scaleBand()
    .domain(months)
    .range([100, boostersWidth + 100])
    .paddingInner(0.1);

  // Total Boosters bar chart

  // Remove any previous x-axis
  boosterSvg.select(".axis-x").remove();
  // Add the x-axis
  boosterSvg.append("g")
    .attr("class", "axis-x")
    .attr("transform", `translate(0, ${boostersHeight})`)
    .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((_, i) => !(i % 8)))) // tick values filtered 
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");



  // x-axis labels
  boosterSvg.append("text")
    .attr("class", "x-label")
    .attr("x", (boostersWidth) / 2 + 30)
    .attr("y", 530)
    .text("Month");

  // Add the y-axis
  boosterSvg.append("g")
    .attr("transform", "translate(" + boostersMargin.left + ", 0)")
    .call(d3.axisLeft(yScaleVaccines).ticks(5))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-30)");



  // Add y-axis labels to boostersSvg
  boosterSvg.append("text")
    .attr("class", "y-label")
    .attr("x", 200)
    .attr("y", 15)
    .attr("transform", "rotate(0)")
    .style("text-anchor", "end")
    .text("Total Boosters");


  // Add the Boosters bars

  boosterSvg.selectAll("#boostersbar")
    .data(Array.from(dataByMonthVaccines.entries()))
    .join("rect")
    .attr("id", "boostersbar")
    .attr("x", d => xScale(d[0]))
    .attr("y", boostersHeight)
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .style("fill", "darkblue")
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .attr("y", d => yScaleVaccines(d[1].boosters))
    .attr("height", d => boostersHeight - yScaleVaccines(d[1].boosters))
})