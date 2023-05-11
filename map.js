// Set the dimensions of the SVG bar canvas
const barmargin2 = { top: 20, right: 20, bottom: 50, left: 100 },
    barwidth2 = 650 - barmargin2.left - barmargin2.right,
    barheight2 = 250 - barmargin2.top - barmargin2.bottom;

// Create Map SVG Element
const mapWidth = 800;
const mapHeight = 500;
const mapSvg = d3.select("#map")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight)
    .style("background", "#2b2929")

// Create Color Scale SVG Element
const colorBar = d3.select("#map")
    .append("svg")
    .attr("width", 30)
    .attr("height", 550)
    .style("position", "absolute")
    .style("top", "20px")
    .style("right", "-30px");

// Map and projection
const projection = d3.geoMercator()
    .scale(120)
    .translate([mapWidth / 2, mapHeight / 1.5]);
const path = d3.geoPath(projection);

const numberFormatter = d3.format(","); // create a formatter that adds commas to numbers

// Mouse Functions

let mouseOver = function (d) {
    d3.selectAll(".country")
        .style("opacity", 1)
        .style("stroke", "#BDBDBD")
    d3.select(this)
        .transition()
        .duration(200)
        .style("stroke", "#0000FF");
}

let mouseLeave = function (d) {
    d3.selectAll(".country")
    d3.select(this)
        .transition()
        .duration(200)
        .style("stroke", "#BDBDBD")
}

// Color Range 
const colorRange = [0, 10000, 100000, 500000, 1000000, 10000000];

// Data and color scale
let map = new Map()
const colorScale = d3.scaleThreshold()
    .domain(colorRange)
    .range(d3.schemeReds[6]);

// Add a rectangle for each data point
colorBar.selectAll("rect")
    .data(colorRange)
    .enter()
    .append("rect")
    .attr("x", 10)
    .attr("y", (d, i) => i * 76)
    .attr("width", 10)
    .attr("height", 75)
    .attr("fill", d => colorScale(d))
    // Shows the value of the scale when mouse hovered over the bar
    .append("title")
    .text(d => numberFormatter(d));

// Load in COVID-19 Data  
d3.csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv", (d) => (
    {
        date: d3.timeParse("%Y-%m-%d")(d.date),
        cases: +d.new_cases_smoothed || 0,
        deaths: +d.new_deaths || 0,
        code: d.iso_code,
        country: d.location
    }
)).then(function (csvData) {
    // Filter Dates
    csvData = csvData.filter(d => d.date >= d3.timeParse("%Y-%m-%d")("2020-03-01") && d.date <= d3.timeParse("%Y-%m-%d")("2022-11-30"))

    //Data grouped by country and month
    const dataByCountryMonth = d3.rollup(
        csvData,
        v => ({
            cases: d3.sum(v, d => d.cases),
            deaths: d3.sum(v, d => d.deaths)
        }),
        d => d.code,
        d => d3.timeFormat("%Y-%m")(d.date)
    );

    // Load in Map Data
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then((data) => {

        let geoJSON = data;
        const numberFormatter = d3.format(","); // create a formatter that adds commas to numbers
        // Draw the map
        mapSvg.append("g")
            .selectAll("path")
            .data(geoJSON.features)
            .join("path")
            .attr("d", path)
            // set the color of each country
            .attr("fill", d => {
                const countryData = dataByCountryMonth.get(d.id);
                if (countryData) {
                    const march2020Data = countryData.get("2020-03");
                    if (march2020Data) {
                        return colorScale(march2020Data.cases);
                    }
                }
                return "#ffffff";
            })
            .style("opacity", 0.8)
            .style("stroke", "#BDBDBD")
            .on("mousemove", mouseOver)
            .on("mouseover", function (event, d) {
                // Create the tooltip element for each country
                const svgBounds = mapSvg.node().getBoundingClientRect();
                const tooltipWidth = 150;
                const tooltipHeight = 50;
                let tooltipX = event.pageX - 200;
                let tooltipY = event.pageY - 200;

                // Adjust the tooltip position if it goes beyond the edges of the SVG element
                if (tooltipX + tooltipWidth > svgBounds.right) {
                    tooltipX = svgBounds.right - tooltipWidth;
                }
                if (tooltipY + tooltipHeight > svgBounds.bottom) {
                    tooltipY = svgBounds.bottom - tooltipHeight;
                }
                if (tooltipY + tooltipHeight < svgBounds.top) {
                    tooltipY = svgBounds.top + tooltipHeight;
                }
                const tooltip = mapSvg.append("g")
                    .attr("id", "tooltip")
                    .attr("transform", `translate(${tooltipX}, ${tooltipY})`);

                tooltip.append("rect")
                    .attr("width", tooltipWidth)
                    .attr("height", tooltipHeight)
                    .attr("fill", "white")
                    .attr("rx", "10");

                tooltip.append("text")
                    .text(`Country Code: ` + `${d.id}`)
                    .style("font-family", "Arial, Helvetica, sans-serif")
                    .style("font-size", "12px")
                    .attr("x", 5)
                    .attr("y", 15);

                tooltip.append("text")
                    .text(() => {
                        const countryData = dataByCountryMonth.get(d.id);
                        if (countryData) {
                            const march2020Data = countryData.get("2020-03");
                            if (march2020Data) {
                                return "New Cases: " + numberFormatter(Math.round(march2020Data.cases));
                            }
                        }
                        return "New Cases: N/A";
                    })
                    .style("font-family", "Arial, Helvetica, sans-serif")
                    .style("font-size", "12px")
                    .attr("x", 5)
                    .attr("y", 30);

                tooltip.append("text")
                    .text(() => {
                        const countryData = dataByCountryMonth.get(d.id);
                        if (countryData) {
                            const march2020Data = countryData.get("2020-03");
                            if (march2020Data) {
                                return "New Deaths: " + numberFormatter(Math.round(march2020Data.deaths));
                            }
                        }
                        return "New Deaths: N/A";
                    })
                    .style("font-family", "Arial, Helvetica, sans-serif")
                    .style("font-size", "12px")
                    .attr("x", 5)
                    .attr("y", 45)
            })
            .on("mouseleave", mouseLeave)
            .on("mouseout", () => {
                // Remove the tooltip element
                mapSvg.select("#tooltip").remove();
            })
            // Create a click event to filter data by the country clicked on
            .on("click", (event, d) => {
                // Set the value of the dropdown menu to the name of the country that was clicked
                let selectedCountry = d.properties.name
                d3.select("#dropdown select").property("value", selectedCountry);
                // Filter the data for the selected country based on ISO codes as country names may be different
                let selectionFilteredData = csvData.filter(e => e.code === d.id);

                // Update the country header
                d3.select(".country-header").join("text").text(selectedCountry)
                let dataByMonth = d3.rollup(selectionFilteredData,
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
                    .range([0, barwidth2])
                    .paddingInner(0.1);

                // Create a scale for the y-axis (new cases)
                const yScaleCases = d3.scaleLinear()
                    .domain([0, d3.max(Array.from(dataByMonth.values()), function (d) { return d.cases; })])
                    .range([barheight2, 0])


                // Create a scale for the y-axis (new deaths)
                const yScaleDeaths = d3.scaleLinear()
                    .domain([0, d3.max(Array.from(dataByMonth.values()), function (d) { return d.deaths; })])
                    .range([barheight2, 0])

                // Cases bar chart

                // Add the y-axis
                d3.select(".axis-y").join("g")
                    .call(d3.axisLeft(yScaleCases).ticks(5))
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("transform", "rotate(-30)");

                // Highlight all corresponding bars in each individual SVG
                function highlightBars(data, highlight) {
                    d3.selectAll("#casebar")
                        .filter(d => d[0] === data[0])
                        .style("fill", highlight ? "orange" : "steelblue");
                    d3.selectAll("#deathbar")
                        .filter(d => d[0] === data[0])
                        .style("fill", highlight ? "orange" : "red");
                    d3.selectAll("#vaccinesbar")
                        .filter(d => d[0] === data[0])
                        .style("fill", highlight ? "orange" : "purple");
                }

                // Add the case bars
                d3.selectAll("#casebar")
                    .data(Array.from(dataByMonth.entries()))
                    .join("rect")
                    .attr("x", d => xScale(d[0]))
                    .attr("y", barheight2)
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
                        d3.selectAll(".tooltip").remove();
                    })
                    .transition()
                    .duration(1000)
                    .ease(d3.easeLinear)
                    .attr("y", d => yScaleCases(d[1].cases))
                    .attr("height", d => barheight2 - yScaleCases(d[1].cases))


                // Deaths bar chart

                // Add the y-axis
                d3.select(".axis-y-2").join("g")
                    .call(d3.axisLeft(yScaleDeaths).ticks(5))
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("transform", "rotate(-30)");


                // Add the death bars
                d3.selectAll("#deathbar")
                    .data(Array.from(dataByMonth.entries()))
                    .join("rect")
                    .attr("id", "deathbar")
                    .attr("x", function (d) { return xScale(d[0]); })
                    .attr("y", barheight2)
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

                    // Filter out dates before March 2020 and after November 2022
                    vaccinesData = vaccinesData.filter(d => d.date >= d3.timeParse("%Y-%m-%d")("2020-03-01") && d.date <= d3.timeParse("%Y-%m-%d")("2022-11-30"));
                    let filteredata = vaccinesData.filter(e => e.code === d.id)
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

                    // Tooltip function for each bar chart
                    function tip(event, d) {
                        const tooltipWidth = 175;
                        const tooltipHeight = 50;
                        const casesTooltip = d3.selectAll("#casebar").append("rect")
                            .attr("width", tooltipWidth)
                            .attr("height", tooltipHeight)
                            .attr("rx", "10")
                            .attr("fill", "turquoise")
                            .style("opacity", 0.5)
                            .attr("transform", `translate(5, -5)`);

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

                        const deathsTip = deathsSvg.select(".tooltip-2").join("g")
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

                        const vaccinesTip = vaccinesSvg.select(".tooltip-3").join("g")
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
                    d3.selectAll("#casebar")
                        .on("mouseover", tip)


                    d3.selectAll("#deathbar")
                        .on("mouseover", tip)
                        .on("mouseout", (event, d) => {
                            // Remove the tooltip element
                            d3.select(".tooltip-1").remove();
                            d3.select(".tooltip-2").remove();
                            d3.select(".tooltip-3").remove();
                        })

                    // Create a scale for the y-axis (new people vaccinated)
                    let yScaleVaccines = d3.scaleLinear()
                        .domain([0, d3.max(Array.from(dataByMonthVaccines.values()), function (d) { return d.vaccinations; })])
                        .range([barheight2, 0])


                    // New People Vaccinated bar chart

                    // Remove any previous y-axis

                    d3.select(".axis-y-3").join("g")
                        .call(d3.axisLeft(yScaleVaccines).ticks(5))
                        .selectAll("text")
                        .style("text-anchor", "end")
                        .attr("transform", "rotate(-30)");

                    // Add the vaccine bars

                    d3.selectAll("#vaccinesbar")
                        .data(Array.from(dataByMonthVaccines.entries()))
                        .join("rect")
                        .attr("id", "vaccinesbar")
                        .attr("x", d => xScale(d[0]))
                        .attr("y", barheight2)
                        .attr("width", xScale.bandwidth())
                        .attr("height", 0)
                        .style("fill", "purple")
                        .on("mousemove", (event, d) => {
                            highlightBars(d, true);
                        })
                        .on("mouseleave", (event, d) => {
                            highlightBars(d, false);
                        })
                        .transition()
                        .duration(1000)
                        .ease(d3.easeLinear)
                        .attr("y", d => yScaleVaccines(d[1].vaccinations))
                        .attr("height", d => barheight2 - yScaleVaccines(d[1].vaccinations))
                })


            });

        // Define the start and end dates for the slider
        const start = new Date("March 2020");
        const end = new Date("November 2022");
        let availableMonths = d3.timeMonth.count(start, end);
        // Define the scale for mapping slider values to dates
        const dateScale = d3.scaleTime()
            .domain([0, availableMonths - 1])
            .range([start, end]);

        // Creating slider event    
        let slider = d3.select(".slider")
            .attr("min", 0)
            .attr("max", availableMonths - 1)
            .attr("step", 1)
            .on("input", () => {
                const value = +slider.property("value");
                const currentDate = dateScale(value);
                d3.select("#date").text(d3.timeFormat("%B, %Y")(currentDate));
                update(+slider.property("value"));
            });

        // Set the initial date    
        d3.select("#date").text(d3.timeFormat("%B, %Y")(start));

        // Slider update function
        function update(value) {
            const currentDate = dateScale(value);
            const formattedDate = d3.timeFormat("%Y-%m")(currentDate);
            mapSvg.selectAll("path")
                .attr("fill", d => {
                    // Fill color according to scale, otherwise white in case of data unavailability
                    const countryData = dataByCountryMonth.get(d.id);
                    if (countryData) {
                        const monthData = countryData.get(formattedDate);
                        if (monthData && monthData.cases) {
                            return colorScale(monthData.cases);
                        }
                    }
                    return "#ffffff";
                })
                .on("mouseover", function (event, d) {
                    // Create the tooltip element
                    const svgBounds = mapSvg.node().getBoundingClientRect();  // Getting SVG bounds
                    const tooltipWidth = 150;
                    const tooltipHeight = 50;
                    let tooltipX = event.pageX;              // SVG position in x direction
                    let tooltipY = event.pageY - 200;        // SVG position in y direction

                    // Adjust the tooltip position if it goes beyond the edges of the SVG element
                    if (tooltipX + tooltipWidth > svgBounds.right) {
                        tooltipX = svgBounds.right - tooltipWidth;
                    }
                    if (tooltipY + tooltipHeight > svgBounds.bottom) {
                        tooltipY = svgBounds.bottom - tooltipHeight;
                    }
                    if (tooltipY + tooltipHeight < svgBounds.top) {
                        tooltipY = svgBounds.top + tooltipHeight;
                    }
                    const tooltip = mapSvg.append("g")
                        .attr("id", "tooltip")
                        .attr("transform", `translate(${tooltipX}, ${tooltipY})`);

                    tooltip.append("rect")
                        .attr("width", tooltipWidth)
                        .attr("height", tooltipHeight)
                        .attr("fill", "white")
                        .attr("rx", "10");

                    tooltip.append("text")
                        .text(`Country Code: ` + `${d.id}`)
                        .style("font-family", "Arial, Helvetica, sans-serif")
                        .style("font-size", "12px")
                        .attr("x", 5)
                        .attr("y", 15);

                    tooltip.append("text")
                        .text(() => {
                            const countryData = dataByCountryMonth.get(d.id);
                            if (countryData) {
                                const monthData = countryData.get(formattedDate);
                                if (monthData) {
                                    // Cases rounded and formatted
                                    return "New Cases: " + numberFormatter(Math.round(monthData.cases));
                                }
                            }
                            return "New Cases: N/A";
                        })
                        .style("font-family", "Arial, Helvetica, sans-serif")
                        .style("font-size", "12px")
                        .attr("x", 5)
                        .attr("y", 30);

                    tooltip.append("text")
                        .text(() => {
                            const countryData = dataByCountryMonth.get(d.id);
                            if (countryData) {
                                const monthData = countryData.get(formattedDate);
                                if (monthData) {
                                    // Deaths rounded and formatted
                                    return "New Deaths: " + numberFormatter(Math.round(monthData.deaths));
                                }
                            }
                            return "New Deaths: N/A";
                        })
                        .style("font-family", "Arial, Helvetica, sans-serif")
                        .style("font-size", "12px")
                        .attr("x", 5)
                        .attr("y", 45)
                })

        }



    });

})

//Adding Map Zoom functionality 
function zoomed(event) {
    const { transform } = event;
    mapSvg.select("g")
        .attr("transform", transform);  // Defining the behavior of zoom event
}

// Scale of zoom
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [mapWidth, mapHeight]])
    .on("zoom", zoomed);

// Applies zoom to the SVG
mapSvg.call(zoom)
    .call(zoom.transform, d3.zoomIdentity.translate(mapWidth / 2, mapHeight / 2).scale(1));  // Initial scale of the map is 1