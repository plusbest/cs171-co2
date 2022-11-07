/* * * * * * * * * * * * * *
*        BumpChartVis      *
* * * * * * * * * * * * * */


class BumpChartVis {

    constructor(parentElement, co2Data, energyData) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.energyData = energyData;
        this.displayData = [];
    	this.parseDate = d3.timeParse("%m/%d/%Y");
        this.colors = ["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598", 
                        "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"];

        this.initVis()
		}


	initVis() {
		let vis = this;

        // set margins
		vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);


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
