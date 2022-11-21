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
        this.selectedCategory = 'percapita';
        this.selectedYear = 1988

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


        var data = [33,45,66,50,100]

        var svg = d3.select('#gaugeVis').append('svg')
            .attr('width',500)
            .attr('height',500)


        var arcs = data.map((v,i)=>{
            return d3.arc()
                .innerRadius(i*20+60)
                .outerRadius((i+1)*20-5+60)
        });


        var pieData = data.map((v,i)=>{
           return [
            {value:v*0.75,arc:arcs[i]},
            {value:(100-v)*0.75,arc:arcs[i]},
            {value:100*0.25,arc:arcs[i]}
            ]
        })

        console.log("JW --- pieData", pieData)

        var pie = d3.pie()
            .sort(null)
            .value(d=>d.value)
            
        var g = svg.selectAll('g')
            .data(pieData)
            .enter()
            .append('g')
            .attr('transform','translate(250,250) rotate(180)')
            .attr('fill-opacity',(d,i)=>2/(i+1))
         
         // progress
         g.selectAll('path')
            .data(d=>{return pie(d)})
            .enter()
            .append('path')
            .attr('d',d=>{return d.data.arc(d)})
            .attr('fill',(d,i) => 
                i==0 ?'blue':'none')
         
        svg.selectAll('g')
            .each(function(d){
                var el = d3.select(this);
                el.selectAll('path').each((r,i)=>{
                    if (i==1) {
                        var centroid = r.data.arc.centroid({startAngle:r.startAngle+0.05,endAngle:r.startAngle+0.001+0.05})
                        g.append('text')
                            .text(100-Math.floor(r.value)+'%')
                            .attr('transform',`translate(${centroid[0]},${centroid[1]}) rotate(${180/Math.PI*(r.startAngle)+7})`)
                            .attr('alignment-baseline','middle')
                    }
                })
            })
 


        vis.wrangleData();

	}

	wrangleData() {
        let vis = this

        vis.displayData = []


        vis.updateVis()

	}

	updateVis() {
		let vis = this;

	}

}
