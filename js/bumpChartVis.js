/* * * * * * * * * * * * * *
*        BumpChartVis      *
* * * * * * * * * * * * * */


class BumpChartVis {

    constructor(parentElement, co2Data, energyData) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.energyData = energyData;
        this.displayData = [];
    	this.parseDate = d3.timeParse("%Y");
        this.colors = ["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598", 
                        "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"];

        this.columnsToShow = ["cement_co2", "coal_co2", "flaring_co2", "gas_co2", "methane",
            "nitrous_oxide", "oil_co2"];

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

        // Scales and axes
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.z = d3.scaleOrdinal(d3.schemeCategory10);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.timeFormat("%Y"));

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("CO2 Emissions (in Tons)");

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

        // Filter out all countries but the US
        let filteredData = this.co2Data.filter((row) => {
            if (row.country === "United States") {
                row.year = vis.parseDate(row.year);
                return row;
            }
            return null;
        });

        vis.displayData = filteredData;

        vis.fields = vis.columnsToShow.map(function(field) {

            return {
                field,
                values: filteredData.map(function(d) {
                    return { year: d.year, co2: +d[field] };
                })
            };
        });

        console.log("displayData", vis.displayData);
        console.log("fields", vis.fields);

        vis.updateVis();
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

        const co2Lines = vis.svg.selectAll(".co2")
            .data(vis.fields)
            .enter().append("g")
            .attr("class", "co2");

        var line = d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return vis.x(d.year); })
            .y(function(d) { return vis.y(d.co2); });

        co2Lines.append("path")
            .attr("class", "line")
            .attr("d", function(d) { return line(d.values); })
            .style("fill", "none")
            .style("stroke", function(d) { return vis.z(d.field); });

        co2Lines.append("text")
            .datum(function(d) { return {field: d.field, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { return "translate(" + vis.x(d.value.year) + "," + vis.y(d.value.co2) + ")"; })
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .style("fill", function(d) { return vis.z(d.field); })
            .text(function(d) { return d.field; });


        // Update axes
        vis.svg.select(".y-axis.axis").call(vis.yAxis);
        vis.svg.select(".x-axis.axis").call(vis.xAxis);
	}

}
