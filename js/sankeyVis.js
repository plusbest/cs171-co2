/* * * * * * * * * * * * * *
*         SankeyVis        *
* * * * * * * * * * * * * */


class SankeyVis {

    constructor(parentElement, co2Data, energyData, testData) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.energyData = energyData;
        this.testData = testData;
        this.displayData = [];
    	this.parseDate = d3.timeParse("%m/%d/%Y");
        this.colors = ["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598", 
                        "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"];

        this.initVis()
		}


	initVis() {
		let vis = this;

        // set margins
		vis.margin = {top: 40, right: 40, bottom: 50, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;
        vis.colors = ["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598", 
                            "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"];
        vis.color = d3.scaleOrdinal(vis.colors);

        // format variables
        vis.formatNumber = d3.format(",.0f")
        vis.format = function(d) { return vis.formatNumber(d); }
      
        // append the svg object to the body of the page
        vis.svg = d3.select("#sankeyDiv").append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)

        // Set the sankey diagram properties
        vis.sankey = d3.sankey()
            .nodeWidth(36)
            .nodePadding(40)
            .size([vis.width, vis.height]);

        vis.path = vis.sankey.links();


        //set up graph in same style as original example but empty
        vis.sankeydata = {"nodes" : [], "links" : []};

        // populate displaydata
        vis.testData.forEach(function (d) {
            vis.sankeydata.nodes.push({ "name": d.source });
            vis.sankeydata.nodes.push({ "name": d.target });
            vis.sankeydata.links.push({ "source": d.source,
                                       "target": d.target,
                                       "value": +d.value });
        });

        // return only the distinct / unique nodes
        vis.sankeydata.nodes = Array.from(
            d3.group(vis.sankeydata.nodes, d => d.name),
            ([value]) => (value)
        );

        // loop through each link replacing the text with its index from node
        vis.sankeydata.links.forEach(function (d, i) {

            vis.sankeydata.links[i].source = vis.sankeydata.nodes
                .indexOf(vis.sankeydata.links[i].source);

            vis.sankeydata.links[i].target = vis.sankeydata.nodes
                .indexOf(vis.sankeydata.links[i].target);
        });

        // now loop through each nodes to make nodes an array of objects
        // rather than an array of strings
        vis.sankeydata.nodes.forEach(function (d, i) {
            vis.sankeydata.nodes[i] = { "name": d };
        });

        // init sankey graph object
        vis.graph = vis.sankey(vis.sankeydata);

        // add in the links
        vis.link = vis.svg.append("g").selectAll(".link")
            .data(vis.graph.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", function(d) { return d.width; });  

        // add the link titles
        vis.link.append("title")
            .text(function(d) {
                return d.source.name + " → " + 
                d.target.name + "\n" + vis.format(d.value);
            });

        // add in the nodes
        vis.node = vis.svg.append("g").selectAll(".node")
            .data(vis.graph.nodes)
            .enter().append("g")
            .attr("class", "node");

        // MERGE EXIT REMOVE REFERENCE
        // let bars = vis.svg.selectAll(".bar")
        //     .data(this.displayData);

        // bars.enter().append("rect")
        //     .attr("class", "bar")

        //     .merge(bars)
        //     .transition()
        //     .attr("width", vis.x.bandwidth())
        //     .attr("height", function (d) {
        //         return vis.height - vis.y(d);
        //     })
        //     .attr("x", function (d, index) {
        //         return vis.x(index);
        //     })
        //     .attr("y", function (d) {
        //         return vis.y(d);
        //     })

        // bars.exit().remove();


        // add node rectangles
        vis.node.append("rect")
            .attr("x", function(d) { return d.x0; })
            .attr("y", function(d) { return d.y0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .attr("width", vis.sankey.nodeWidth())
            .style("fill", function(d) { 
                return d.color = vis.color(d.name.replace(/ .*/, "")); })
            .style("stroke", function(d) { 
                return d3.rgb(d.color).darker(2); })
            .append("title")
            .text(function(d) { 
                return d.name + "\n" + vis.format(d.value); });

        // add node text
        vis.node.append("text")
            .attr("x", function(d) { return d.x0 - 6; })
            .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(function(d) { return d.name; })
            .filter(function(d) { return d.x0 < vis.width / 2; })
            .attr("x", function(d) { return d.x1 + 6; })
            .attr("text-anchor", "start");



	   vis.wrangleData();

	}

	wrangleData() {
        let vis = this

        let filteredData = [];


        vis.updateVis()

	}

	updateVis() {
		let vis = this;

	}

}
