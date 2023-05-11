// Create SVG Element
const lineMargin = { top: 20, right: 20, bottom: 30, left: 50 };
const xSize = 800 - lineMargin.left - lineMargin.right
const ySize = 600 - lineMargin.top - lineMargin.bottom;;
const lineSvg = d3.select("#line")
    .append("svg")
    .attr("width", xSize + lineMargin.left + lineMargin.right)
    .attr("height", ySize + lineMargin.top + lineMargin.bottom)


const dataParse = d3.timeParse("%m/%d/%Y");
const startDate = dataParse("03/01/2020");
const endDate = dataParse("12/31/2022");
//const fileFormat = d3.timeParse("%Y-%m-%d");
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const availableDays = (endDate - startDate) / millisecondsPerDay;


d3.csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv", (d) => (
    {
        date: d3.timeParse("%Y-%m-%d")(d.date),
        cases: +d.new_cases_smoothed,
        deaths: +d.new_deaths,
        code: d.iso_code,
        country: d.location
    }
)).then(data => {

    data = data.filter(d => d.date >= d3.timeParse("%Y-%m-%d")("2020-03-01") && d.date <= d3.timeParse("%Y-%m-%d")("2022-11-30"));
    // Set the scales for the x and y axes
    const xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([lineMargin.left + 10, xSize]);

    // Array of desired countries
    const desiredCountries = ["China", "India", "United States", "United Kingdom", "Brazil"];

    const filteredData = data.filter(d => desiredCountries.includes(d.country));

    const maxYValue = d3.max(filteredData, d => d.cases);

    const yScale = d3.scaleLinear()
        .domain([0, maxYValue])
        .range([ySize, 0]);

    // Define the line function
    const chinaLine = d3.line()
        .defined(function (d) { if (d.date <= endDate) { return d.country === "China" } })
        .x(d => xScale(d.date))
        .y(d => yScale(d.cases));

    // Define the line function
    const indiaLine = d3.line()
        .defined(function (d) { if (d.date <= endDate) { return d.country === "India" } })
        .x(d => xScale(d.date))
        .y(d => yScale(d.cases));

    // Define the line function
    const usLine = d3.line()
        .defined(function (d) { if (d.date <= endDate) { return d.country === "United States" } })
        .x(d => xScale(d.date))
        .y(d => yScale(d.cases));


    // Define the line function
    const ukLine = d3.line()
        .defined(function (d) { if (d.date <= endDate) { return d.country === "United Kingdom" } })
        .x(d => xScale(d.date))
        .y(d => yScale(d.cases));


    // Define the line function
    const brazilLine = d3.line()
        .defined(function (d) { if (d.date <= endDate) { return d.country === "Brazil" } })
        .x(d => xScale(d.date))
        .y(d => yScale(d.cases));

    // Add the line to the chart for India
    lineSvg.append('path')
        .datum(filteredData.filter(d => d.country === "India"))
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', indiaLine)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        // Transition the line from start to finish linearly
        .attrTween("stroke-dasharray", function () {
            var len = this.getTotalLength();
            return function (t) {
                return (d3.interpolateString("0," + len, len + ",0"))(t);
            };
        });

    // Add the line to the chart for China
    lineSvg.append('path')
        .datum(filteredData.filter(d => d.country === "China"))
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('d', chinaLine)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        // Transition the line from start to finish linearly
        .attrTween("stroke-dasharray", function () {
            let len = this.getTotalLength();
            return function (t) {
                return (d3.interpolateString("0," + len, len + ",0"))(t);
            };
        });


    // Add the line to the chart for USA
    lineSvg.append('path')
        .datum(filteredData.filter(d => d.country === "United States"))
        .attr('fill', 'none')
        .attr('stroke', 'purple')
        .attr('stroke-width', 2)
        .attr('d', usLine)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        // Transition the line from start to finish linearly
        .attrTween("stroke-dasharray", function () {
            let len = this.getTotalLength();
            return function (t) {
                return (d3.interpolateString("0," + len, len + ",0"))(t);
            };
        });

    // Add the line to the chart for UK
    lineSvg.append('path')
        .datum(filteredData.filter(d => d.country === "United Kingdom"))
        .attr('fill', 'none')
        .attr('stroke', 'green')
        .attr('stroke-width', 2)
        .attr('d', ukLine)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        // Transition the line from start to finish linearly
        .attrTween("stroke-dasharray", function () {
            let len = this.getTotalLength();
            return function (t) {
                return (d3.interpolateString("0," + len, len + ",0"))(t);
            };
        });

    // Add the line to the chart for Brazil
    lineSvg.append('path')
        .datum(filteredData.filter(d => d.country === "Brazil"))
        .attr('fill', 'none')
        .attr('stroke', 'teal')
        .attr('stroke-width', 2)
        .attr('d', brazilLine)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        // Transition the line from start to finish linearly
        .attrTween("stroke-dasharray", function () {
            let len = this.getTotalLength();
            return function (t) {
                return (d3.interpolateString("0," + len, len + ",0"))(t);
            };
        });

    // Add the x axis
    lineSvg.append('g')
        .attr('transform', `translate(${lineMargin.left + 10}, ${ySize})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    // Add the y axis
    lineSvg.append('g')
        .attr('transform', `translate(${lineMargin.left + 10}, 0)`)
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-30)");


    // Define the legend
    const legend = lineSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${lineMargin.left + 20}, ${lineMargin.top})`)
        .selectAll('g')
        .data(desiredCountries)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    // Add colored rectangles to the legend
    legend.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', (d) => {
            if (d === "China") return 'red';
            if (d === "India") return 'steelblue';
            if (d === "United States") return 'purple';
            if (d === "United Kingdom") return 'green';
            if (d === "Brazil") return 'teal';
        });

    // Add the text labels to the legend
    legend.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text((d) => d);

    // Define opacity value for non hovered lines during mouseover
    const nonHoveredOpacity = 0.2;

    // Add event listeners to each line
    lineSvg.selectAll('path')
        .on('mouseover', function () {
            // When the mouse is over a line reduce the opacity of the other lines
            lineSvg.selectAll('path')
                .style('opacity', nonHoveredOpacity);
            d3.select(this)
                .style('opacity', 1);
        })
        .on('mouseout', function () {
            // When the mouse moves away from a line restore the opacity of all lines
            lineSvg.selectAll('path')
                .style('opacity', 1);
        });


});


