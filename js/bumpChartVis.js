/* * * * * * * * * * * * * *
*        BumpChartVis      *
* * * * * * * * * * * * * */


class BumpChartVis {
    // TODO: Add bumps (?) and hover tooltips

    constructor(parentElement, co2Data, energyData) {
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
            .text("Year");;

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

        // console.log("bumpChart displayData", vis.displayData);
        // console.log("bumpChart fields", vis.fields);

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
        console.log("THIS IS THE GLOBAL DATA", vis.displayData)
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
        console.log("biancam THIS IS THE FILTERED DATA", filteredData);

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
        // console.log("domainx", d3.extent(vis.displayData, function(d) { console.log("d.year", d.year); return d.year; }));
        vis.x.domain(d3.extent(vis.displayData, function(d) { return d.year; }));

        // console.log("domainy", "["
        //     + d3.min(vis.fields, function(field) { return d3.min(field.values, function(d) { return d.co2; }); })
        //     + ", "
        //     + d3.max(vis.fields, function(field) { return d3.max(field.values, function(d) { return d.co2; }); })
        //     +"]");

        vis.y.domain([
            d3.min(vis.fields, function(field) { return d3.min(field.values, function(d) { return d.co2; }); }),
            d3.max(vis.fields, function(field) { return d3.max(field.values, function(d) { return d.co2; }); })
        ]);

        vis.z.domain(vis.fields.map(function(field) { return field.field; }));

        // Draw the lines
        const lineGenerator = d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return vis.x(d.year); })
            .y(function(d) { return vis.y(d.co2); });


        // TODO: Need to figure out how to accomplish this via the enter-update-remove pattern
        // Tried a lot of different means and this was the only one I could get to work in time for prototype deadline
        vis.svg.selectAll("g.co2").remove();

        vis.co2Lines = vis.svg.selectAll("g.co2")
            .data(vis.fields)
            .enter().append("g")
            .attr("class", function(d) { return "co2 " + d.field; });

        vis.co2Lines.append("path")
            .attr("class", "line")
            .attr("d", function(d) { return lineGenerator(d.values); })
            .style("fill", "none")
            .style("stroke", function(d) { return vis.z(d.field); });

        // Add some labels
        vis.co2Lines.append("text")
            .attr("class", "line-label")
            .datum(function(d) { return {field: d.field, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) {
                console.log("biancam d", d);
                return "translate(" + vis.x(d.value.year) + "," + vis.y(d.value.co2) + ")";
            })
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .style("fill", "#cccccc")
            .text(function(d) { return d.field; });

        // Create some thicker lines on hover
        vis.hoverLines = vis.co2Lines.append("path")
            .attr("class", "hover-line")
            .attr("d", function(d) { return lineGenerator(d.values); });

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
                    .style("stroke-width","3");

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
                    .style("stroke-width","10");

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
            d3.select("#bumpchart-row .section-title").text(`Breakdown of consumption emissions over time for ${displayTitle}`);

            // Append the reset button
            d3.select("#bumpchart-row .section-title")
                .append("button")
                .attr("id", "bumpchart-reset")
                .attr("class", "btn btn-link btn-sm d-block m-auto")
                .on("click", (e) => vis.resetButtonOnClick(e))
                .text("Reset to global comparison")

        } else {
            d3.select("#bumpchart-row .section-title")
                .html("And their consumption emissions compared to the world's total over time in the following ways:")
        }

        vis.wrangleData();
    }

    resetButtonOnClick(e) {
        const vis = this;
        vis.changeCurrentView('ALL');
    }

}
