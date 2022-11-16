/* * * * * * * * * * * * * *
*         SankeyVis        *
* * * * * * * * * * * * * */


class SankeyVis {

    constructor(parentElement, co2Data, energyData, country, year) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.energyData = energyData;
        this.displayData = [];
    	this.parseDate = d3.timeParse("%m/%d/%Y");
        this.colors = ["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598", 
                        "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"];

        //set up graph in same style as original example but empty
        this.sankeydata = {"nodes" : [], "links" : []};

        this.country = country;
        this.year = year;
        this.selectedCategory = 'percapita';

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

        // Set path group
        vis.path = vis.sankey.links();


        vis.wrangleData();

	}

	wrangleData() {
        let vis = this

        console.log("JW --- co2data", vis.co2Data)
        console.log("JW --- visparams", vis.country, vis.year)
        console.log("JW --- testCategory", vis.selectedCategory)
        console.log("JW --- testcountry", vis.country, typeof(vis.country))
        console.log("JW --- testyear", vis.year, typeof(vis.year))

        // iterate co2 data rows
        vis.co2Data.forEach(function(d) {
            if (d.country == "United States" && d.year == 2000) {
                console.log(d.year)
                let co2 = vis.selectedCategory === 'percapita' ? d.co2_per_capita : d.co2;
                let coal_co2 = vis.selectedCategory === 'percapita' ? d.coal_co2_per_capita : d.coal_co2;
                let cement_co2 =  vis.selectedCategory === 'percapita' ? d.cement_co2_per_capita : d.cement_co2;
                let flaring_co2 =  vis.selectedCategory === 'percapita' ? d.flaring_co2_per_capita : d.flaring_co2;
                let gas_co2 =  vis.selectedCategory === 'percapita' ? d.gas_co2_per_capita : d.gas_co2;

                console.log("JW --- co2", co2)
                // calc per capital factor to get trade per capita value
                let trade_co2 = vis.selectedCategory === 'percapita' ? (d.co2_per_capita/d.co2) * d.trade_co2 : d.trade_co2;

                var remainder = (co2 - coal_co2 - cement_co2 - flaring_co2 - gas_co2)

                console.log("JW -- targetDataRow", d)
                // first stage pushes
                vis.displayData.push({
                    source: "Consumption",
                    target: "Production",
                    value: co2
                    })
                vis.displayData.push({
                    source: "Consumption",
                    target: "Trade",
                    value: (Math.abs(trade_co2)).toString()
                })
                // second stage pushes
                vis.displayData.push({
                    source: "Production",
                    target: "Coal",
                    value: coal_co2
                })
                vis.displayData.push({
                    source: "Production",
                    target: "Cement",
                    value: cement_co2
                })
                vis.displayData.push({
                    source: "Production",
                    target: "Flaring",
                    value: flaring_co2
                })
                vis.displayData.push({
                    source: "Production",
                    target: "Gas",
                    value: gas_co2
                })
                vis.displayData.push({
                    source: "Production",
                    target: "Other",
                    value: remainder
                })
                // Null connection to keep Trade in second column with production
                vis.displayData.push({
                    source: "Trade",
                    target: "\u2000",  // invisible ascii code
                    value: 0
                })    
            }
        })

        console.log("JW -- displayData", vis.displayData)
        // TODO: Descending order sort




// consumption co2 per capita for US -> production co2 per capita  ->  coal,
//                                      trade per capita               oil,
//                                                                     gas,
//                                                                     flaring,

// source,target,value


// co2

// consumption_co2
// consumption_co2_per_capita

// trade_co2

// coal_co2
// coal_co2_per_capita
// cement_co2
// cement_co2_per_capita
// flaring_co2
// flaring_co2_per_capita
// gas_co2
// gas_co2_per_capita


        vis.updateVis()

	}

	updateVis() {
		let vis = this;

        vis.sankeydata.nodes = []
        vis.sankeydata.links = []
        // populate displaydata
        vis.displayData.forEach(function (d) {
            vis.sankeydata.nodes.push({ "name": d.source });
            vis.sankeydata.nodes.push({ "name": d.target });
            vis.sankeydata.links.push({ "source": d.source,
                                       "target": d.target,
                                       "value": +d.value });
        });

        console.log("JW --- sankeydata", vis.sankeydata)
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


        // // init sankey graph object
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


	}

}
