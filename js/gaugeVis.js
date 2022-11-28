/* * * * * * * * * * * * * *
*         GaugeVis         *
* * * * * * * * * * * * * */


class GaugeVis {

    constructor(parentElement, co2Data, energyData) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.energyData = energyData;
        this.displayData = [];
    	this.parseDate = d3.timeParse("%m/%d/%Y");
        this.colors = ["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598", 
                        "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"];

        //set up graph in same style as original example but empty
        this.sankeydata = {"nodes" : [], "links" : []};

        // this.country = country;
        // this.year = year;
        this.selectedCategory = 'percountry';
        this.country_iso_code = 'USA';
        this.selectedYear = 2000;
        // Default for gauge
        this.checkBoxes = [
            {"Oil": true},
            {"Gas": true},
            {"Coal": true},
            {"Flaring": true},
            {"Cement": true}]

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

        vis.arcSize = (6 * vis.width / 100);
        vis.innerRadius = vis.arcSize * 3;            

        vis.data;

        vis.svg = d3.select('#gaugeVis').append('svg')
            .attr('width', vis.width)
            .attr('height', vis.width);

        // d3 function to create pie data elements
        vis.pie = d3.pie().sort(null).value(function (d) {
            return d.value;
        });

        vis.wrangleData();

	}

	wrangleData() {
        let vis = this

        vis.displayData; 

        // iterate co2 data rows
        vis.co2Data.forEach(function(d) {
            //if (d.country == "United States" && d.year == vis.selectedYear) {
            if (d.iso_code == vis.country_iso_code && d.year == vis.selectedYear) {

                // Set co2 data for selected year, country, and category
                let co2 = vis.selectedCategory === 'percapita' ? d.co2_per_capita : d.co2;
                let oil_co2 =  vis.selectedCategory === 'percapita' ? d.gas_oil_per_capita : d.oil_co2;
                let coal_co2 = vis.selectedCategory === 'percapita' ? d.coal_co2_per_capita : d.coal_co2;
                let cement_co2 =  vis.selectedCategory === 'percapita' ? d.cement_co2_per_capita : d.cement_co2;
                let flaring_co2 =  vis.selectedCategory === 'percapita' ? d.flaring_co2_per_capita : d.flaring_co2;
                let gas_co2 =  vis.selectedCategory === 'percapita' ? d.gas_co2_per_capita : d.gas_co2;

                // calc per capital factor to get trade per capita value
                let trade_co2 = vis.selectedCategory === 'percapita' ? (d.co2_per_capita/d.co2) * d.trade_co2 : d.trade_co2;
                // calculate other co2
                let other_co2 = (co2 - coal_co2 - cement_co2 - flaring_co2 - gas_co2)

                vis.displayData = 
                        {"usa_co2_total": co2,
                        "Oil": oil_co2,
                        "Coal": coal_co2,
                        "Cement": cement_co2,
                        "Flaring": flaring_co2,
                        "Gas": gas_co2}
                    
            }
            // Set co2 total for world
            if (d.country == "World" && d.year == vis.selectedYear) {
                let co2_world = vis.selectedCategory === 'percapita' ? d.co2_per_capita : d.co2;
                console.log("JWA -- Gauge Year", vis.selectedYear);
                console.log("JWA -- CO2WORLD", d.co2);
                vis.displayData["world_co2_total"] = parseFloat(co2_world);
            }
        })

        let usa_total = 0;
        let world_total = vis.displayData["world_co2_total"];
        let safe_total = vis.displayData["world_co2_total"]/2;

        vis.checkBoxes.forEach(function(d) {
            for (let key in d) {
                if (d[key] == true) {
                    usa_total += parseFloat(vis.displayData[key]);
                }
            }
        })

        // TODO: Normalize co2 values into percentage
        let usa_percent = Math.floor((usa_total / vis.displayData["world_co2_total"]) * 100);
        console.log("JWA -- updated usa percent", usa_percent)

        vis.data = [
            {value: 50, label: "Safe Level <", color: vis.colors[0], co2val: safe_total},
            {value: 0, label: "", color: vis.colors[1]},
            {value: usa_percent, label: "US average", color: vis.colors[2], co2val: usa_total},
            {value: 0, label: "", color: vis.colors[3]},
            {value: 95, label: "Global average", color: vis.colors[4], co2val: world_total}
        ];

        // console.log("JWA -- vis.data", vis.data);


        vis.arcs = vis.data.map(function (obj, i) {
            return d3.arc()
                .innerRadius(i * vis.arcSize + vis.innerRadius)
                .outerRadius((i + 1) * vis.arcSize - (vis.width / 100) + vis.innerRadius);
        });


        vis.arcsGrey = vis.data.map(function (obj, i) {
            return d3.arc()
                .innerRadius(i * vis.arcSize + (vis.innerRadius + ((vis.arcSize / 2) - 2)))
                .outerRadius((i + 1) * vis.arcSize - ((vis.arcSize / 2)) + (vis.innerRadius));
        });

        vis.pieData = vis.data.map(function (obj, i) {
            console.log("'obj", obj)
            return [
                {value: obj.value * 0.75, arc: vis.arcs[i], object: obj},
                {value: (100 - obj.value) * 0.75, arc: vis.arcsGrey[i], object: obj},
                {value: 100 * 0.25, arc: vis.arcs[i], object: obj}];
        });

        vis.updateVis()

	}

	updateVis() {
		let vis = this;

        // setup pie graph
        vis.pieGraph = vis.svg.selectAll('g')
            .data(vis.pieData)

        console.log("JWA -- pieData", vis.pieData)

        // update pie graph elements
        vis.pieGraph
            .enter()
            .append('g')
            .attr('transform', 'translate(' + vis.width / 2 + ',' + vis.width / 2 + ') rotate(180)')

        // setup pie graph text elements
        vis.gText = vis.svg.selectAll('g.textClass')
            .data([{}])

        // label group g
        vis.gText
            .enter()
            .append('g')
            .classed('textClass', true)
            .attr('transform', 'translate(' + vis.width / 2 + ',' + vis.width / 2 + ') rotate(180)');

        vis.pieBars = vis.pieGraph.selectAll('path')
            .data(function (d) {
                return vis.pie(d);
            });

        vis.pieBars
            .enter()
            .append('path')
            .merge(vis.pieBars)
            .transition()
            .duration(500)
            .attr('id', function (d, i) {   // add percentage values
                if (i == 1) {
                    return "Text" + d.data.object.label
                }
            })
            .attr('d', function (d) {       // add arcs
                return d.data.arc(d);
            })
            .attr('fill', function (d, i) { // add path colors
                return i == 0 ? d.data.object.color : i == 1 ? '#D3D3D3' : 'none';
            });

        vis.pieBars.exit().remove();

        // remove previous text percentages
        vis.svg.selectAll("textPath.percentage").remove();
        vis.svg.selectAll(".percentage").remove();

        vis.svg.selectAll('g').each(function (d, index) {
            var el = d3.select(this);
            var path = el.selectAll('path').each(function (r, i) {
                if (i === 1) {
                    console.log("R", r)
                    var centroid = r.data.arc.centroid({
                        startAngle: r.startAngle + 0.05,
                        endAngle: r.startAngle + 0.001 + 0.05
                    });
                    var lableObj = r.data.object;

                    if (r.data.object.label) {
                        vis.pieGraph.append('text')
                            .attr('font-size', 15)
                            .attr('dominant-baseline', 'central')
                            .append("textPath")
                            .classed('percentage', true)
                            .attr("textLength", function (d, i) {
                                return 0;
                            })
                            .attr("xlink:href", "#Text" + r.data.object.label)
                            .attr("startOffset", '5')
                            .attr("dy", '-3em')
                            .text(`${(Math.floor(lableObj.co2val)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`); // percentage add
                    }

                }
                if (i === 0) {
                    var centroidText = r.data.arc.centroid({
                        startAngle: r.startAngle,
                        endAngle: r.startAngle
                    });
                    var lableObj = r.data.object;

                    if (lableObj.value > 0 && lableObj.label != "") {
                        vis.gText.append('text')         // label text add
                            .attr('font-size', 15)
                            .classed('percentage', true)
                            .text(`${lableObj.label} (${lableObj.value}%)`)
                            .attr('transform', "translate(" + (centroidText[0] - ((1.5 * vis.width) / 100)) + "," + (centroidText[1] + ") rotate(" + (180) + ")"))
                            .attr('dominant-baseline', 'central');
                    }
                    else if (lableObj.value <= 0 && lableObj.label != "") {
                        vis.gText.append('text')         // label text add
                            .attr('font-size', 15)
                            .classed('percentage', true)
                            .text(`${lableObj.label} (< 0%)`)
                            .attr('transform', "translate(" + (centroidText[0] - ((1.5 * vis.width) / 100)) + "," + (centroidText[1] + ") rotate(" + (180) + ")"))
                            .attr('dominant-baseline', 'central');
                    }
                }
            });
        });
	}

}
