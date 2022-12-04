/* * * * * * * * * * * * * *
*        BumpChartVis      *
* * * * * * * * * * * * * */


class BumpChartVis {
    // TODO: Add bumps (?) and hover tooltips

    constructor(parentElement, co2Data) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.displayData = [];
    	this.parseDate = d3.timeParse("%Y");

        this.currentView = "ALL" // Can also be same as selected country OR "USA" OR "WORLD"

        this.initVis()
    }


	initVis() {
		let vis = this;

        // set margins
		vis.margin = {top: 20, right: 70, bottom: 50, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // Set up scales and axes
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.z = d3.scaleOrdinal(d3.schemeCategory10); // color scale; TODO: might update to use this.colors

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.timeFormat("%Y"));

        // Draw the axes & labels
        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("CO2 Emissions (in Millions of Tons)");

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .append("text")
            .attr("y", vis.margin.bottom / 2)
            .attr("x", vis.width / 2)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("Year");

        // Add background rect for click handler
        vis.background = vis.svg.append("rect")
            .attr("class", "background")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", vis.height)
            .attr("width", vis.width)
            .style("opacity", "0")
            .on('click', function(e, d) {
                // Change views if background is clicked when on a particular line's view
                if (vis.currentView !== "ALL" ) {
                    vis.changeCurrentView("ALL");
                }
            });

    	vis.wrangleData();
	}

	wrangleData() {
        let vis = this;

        if (vis.currentView === "ALL") {
            vis.wrangleDataGlobal();
        } else if (vis.currentView === "USA") {
            vis.wrangleDataCountry(vis.currentView);
        } else if (vis.currentView === selectedCountryCode) {
            vis.wrangleDataCountry(selectedCountryCode);
        } else if (vis.currentView === "WORLD") {
            vis.wrangleDataCountry("WLD");
        } else {
            // reset to global state and re-start
            vis.changeCurrentView("ALL")
            return;
            // throw new Error("Error in bumpChartVis wrangleData: this.currentView is invalid");
        }

        vis.updateVis();
	}

    wrangleDataGlobal() {
        let vis = this;

        // Filter out everything except global, selected, and USA
        let filteredData = this.co2Data.filter((row) => {
            if (
                row.country === "World" ||
                row.country === "United States" ||
                row.iso_code === selectedCountryCode
            ) {
                // Don't double parse
                if (typeof row.year !== "object") {
                    row.year = vis.parseDate(row.year);
                }
                return row;
            }
            return null;
        });

        // Reorganize data to more easily display multiple lines; take into account differences with USA present
        if (selectedCountryCode === "USA") {
            vis.fields = [
                { field: "world_co2", values: [] },
                { field: "usa_co2", values: [] },
            ];
        } else {
            vis.fields = [
                { field: "world_co2", values: [] },
                { field: "usa_co2", values: [] },
                { field: "selected_co2", values: [] }
            ];
        }

        filteredData.forEach(function(row) {
            const { country, iso_code, year, co2 } = row;

            if (!year) { return; } // Do nothing

            const thisData = { year, co2: +co2 };

            // Add data to the
            if (country === "World") {
                vis.fields[0].values.push(thisData);
            } else if (country === "United States") {
                vis.fields[1].values.push(thisData);
            } else if (iso_code === selectedCountryCode && selectedCountryCode !== "USA") {
                vis.fields[2].values.push(thisData);
            } else {
                throw new Error("Error in bumpChartVis while wrangling global data");
            }
        });

        vis.displayData = filteredData;
    }

    wrangleDataCountry(countryCode) {
        let vis = this;
        
        // Filter out all countries but the US
        let filteredData = this.co2Data.filter((row) => {
            const { iso_code = null, country, year } = row;
            if (
                (countryCode === "WLD" && this.currentView === "WORLD" && country === "World") ||
                iso_code === countryCode
            ) {
                // Don't double parse
                if (typeof year !== "object") {
                    row.year = vis.parseDate(year);
                }

                return row;
            }
            return null;
        });

        vis.displayData = filteredData;

        // Reorganize data to more easily display multiple lines
        const columnsToShow = ["cement_co2", "coal_co2", "flaring_co2", "gas_co2", "oil_co2"];
        vis.fields = columnsToShow.map(function(field) {

            return {
                field,
                values: filteredData.map(function(d) {
                    return { year: d.year, co2: +d[field] };
                })
            };
        });
    }

	updateVis() {
		let vis = this;

        // Update domains for axes
        vis.x.domain(d3.extent(vis.displayData, function(d) { return d.year; }));

        vis.y.domain([
            d3.min(vis.fields, function(field) { return d3.min(field.values, function(d) { return d.co2; }); }),
            d3.max(vis.fields, function(field) { return d3.max(field.values, function(d) { return d.co2; }); })
        ]);

        vis.z.domain(vis.fields.map(function(field) { return field.field; }));


        // Create a line generator for tracking the year against the chosen co2 value
        const lineGenerator = d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return vis.x(d.year); })
            .y(function(d) { return vis.y(d.co2); });


        // Create groups to attach each set of lines and labels to
        vis.co2LinesGroups = vis.svg.selectAll("g.co2")
            // Generating a (hopefully) unique enough key here because otherwise data doesn't clear appropriately
            .data(vis.fields, (d, i) => d.field + d.values.length + i );

        vis.enterGroups = vis.co2LinesGroups
            .enter()
            .append("g")
            .attr("class", function(d) { return "co2 " + d.field; });


        // Draw the lines and update them
        vis.co2Lines = vis.co2LinesGroups.select("path.line")
            .data(vis.fields);

        vis.enterGroups
            .append("path")
            .attr("class", "line")
            .style("fill", "none")
            .style("stroke", function(d) { return vis.z(d.field); })
            .style("stroke-width", 2)
            .attr("d", function(d) { return lineGenerator(d.values); })
            .enter()
            .merge(vis.co2Lines);


        // Draw the hoverable lines and update them
        vis.co2HoverLines = vis.co2LinesGroups.select("path.hover-line")
            .data(vis.fields);

        vis.enterGroups
            .append("path")
            .attr("class", "hover-line")
            .style("fill", "none")
            .style("stroke", function(d) { return vis.z(d.field); })
            .style("stroke-width", 2)
            .attr("d", function(d) { return lineGenerator(d.values); })
            .enter()
            .merge(vis.co2HoverLines);

        // Add some labels (these will become highlighted when you hover the line)
        vis.lineLabels = vis.co2LinesGroups.select("text.line-label")
            .data(vis.fields);

        vis.enterGroups
            .append("text")
            .attr("class", "line-label")
            .datum(function(d) { return {field: d.field, value: d.values[d.values.length - 1]}; })
            .attr("transform", (d) => "translate(" + vis.x(d.value.year) + "," + vis.y(d.value.co2) + ")")
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .style("fill", "#cccccc")
            .text(function(d) { return d.field.split("_").join(" "); });


        // Handle cleanup
        vis.co2LinesGroups.exit().remove();
        vis.co2Lines.exit().remove();
        vis.co2HoverLines.exit().remove();


        // Add event handlers
        vis.svg.selectAll(".hover-line")
            .on('mouseover', function() {
                // Emphasize the selected line
                const selection = d3.select(this).raise();
                selection
                    .transition()
                    .delay("100")
                    .duration("10")
                    .style("stroke", function(d) { return vis.z(d.field); })
                    .style("opacity","1")
                    .style("stroke-width","5");

                // Highlight the corresponding text label
                const parentGroup = d3.select(this.parentNode);
                parentGroup.selectAll("text.line-label")
                    .style("fill", function(d) { return vis.z(d.field); });

                // TODO: need to also maybe re-draw this element, so that it's always on top
            })
            .on('mouseout', function() {
                // De-emphasize the selected line
                const selection = d3.select(this)
                selection
                    .transition()
                    .delay("100")
                    .duration("10")
                    .style("stroke", function(d) { return vis.z(d.field); })
                    .style("opacity","0")
                    .style("stroke-width","5");

                // Un-highlight the label
                const parentGroup = d3.select(this.parentNode);
                parentGroup.selectAll("text.line-label")
                    .style("fill", "#cccccc");
            })
            .on('click', function(e, d) {
                const { field } = d;

                // Change views
                if (vis.currentView !== "USA" && field === "usa_co2") {
                    vis.changeCurrentView("USA");
                } else if (vis.currentView !== selectedCountryCode && field === "selected_co2") {
                    vis.changeCurrentView(selectedCountryCode);
                } else if (vis.currentView !== "WORLD" & field === "world_co2") {
                    vis.changeCurrentView("WORLD");
                }
            });

        // Update axes
        vis.svg.select(".y-axis.axis").call(vis.yAxis);
        vis.svg.select(".x-axis.axis").call(vis.xAxis);
	}

    changeCurrentView(newView) {
        const vis = this;

        vis.currentView = newView;

        // Update title
        if (newView === "USA" || newView === selectedCountryCode || newView === "WORLD") {
            console.log("selectedCountry", selectedCountry, selectedCountryCode)
            const displayTitle = newView === selectedCountryCode ? selectedCountry:
                                        newView === "USA" ? "United States": "the world";
            d3.select("#bumpchart-row .section-title").text(`Breakdown of production emissions over time for ${displayTitle}`);

            // Append the reset button
            d3.select("#bumpchart-row .section-title")
                .append("button")
                .attr("id", "bumpchart-reset")
                .attr("class", "btn btn-link btn-sm d-block m-auto")
                .on("click", (e) => vis.resetButtonOnClick(e))
                .text("Reset to global comparison")

        } else if (newView === "ALL" && selectedCountryCode === "USA") {
            d3.select("#bumpchart-row .section-title")
                .html("And <strong class=\"px-3 py-1 bg-white\">United States</strong> production emissions compared to the World's total over time in the following ways:")
        } else {
            d3.select("#bumpchart-row .section-title")
                .html(`And the <strong class=\"px-3 py-1 bg-white\">United States</strong> and <span id=\"selected-country-name\" class=\"px-3 py-1 bg-warning fs-5\">${selectedCountry}</span>'s
                 production emissions compared to the World's total over time in the following ways:`)
        }

        vis.wrangleData();
    }

    resetButtonOnClick(e) {
        const vis = this;
        vis.changeCurrentView('ALL');
    }

}
