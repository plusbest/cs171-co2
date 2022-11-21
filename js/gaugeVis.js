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

        vis.arcSize = (6 * vis.width / 100);
        vis.innerRadius = vis.arcSize * 3;            

        vis.data = [
            {value: 40, label: "Safe Level", color: vis.colors[0]},
            {value: 0, label: "", color: vis.colors[1]},
            {value: 66, label: "US average", color: vis.colors[2]},
            {value: 0, label: "", color: vis.colors[3]},
            {value: 95, label: "Global average", color: vis.colors[4]}
        ];

        vis.svg = d3.select('#gaugeVis').append('svg')
            .attr('width', vis.width)
            .attr('height', vis.width);

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
            return [
                {value: obj.value * 0.75, arc: vis.arcs[i], object: obj},
                {value: (100 - obj.value) * 0.75, arc: vis.arcsGrey[i], object: obj},
                {value: 100 * 0.25, arc: vis.arcs[i], object: obj}];
        });

        vis.pie = d3.pie().sort(null).value(function (d) {
            return d.value;
        });

        vis.g = vis.svg.selectAll('g')
            .data(vis.pieData)
            .enter()
            .append('g')
            .attr('transform', 'translate(' + vis.width / 2 + ',' + vis.width / 2 + ') rotate(180)');

        vis.gText = vis.svg.selectAll('g.textClass')
            .data([{}])
            .enter()
            .append('g')
            .classed('textClass', true)
            .attr('transform', 'translate(' + vis.width / 2 + ',' + vis.width / 2 + ') rotate(180)');


        vis.g.selectAll('path')
            .data(function (d) {
                return vis.pie(d);
            })
            .enter()
            .append('path')
            .attr('id', function (d, i) {
                if (i == 1) {
                    return "Text" + d.data.object.label
                }
            })
            .attr('d', function (d) {
                return d.data.arc(d);
            }).attr('fill', function (d, i) {
                return i == 0 ? d.data.object.color : i == 1 ? '#D3D3D3' : 'none';
        });

        vis.svg.selectAll('g').each(function (d, index) {
            var el = d3.select(this);
            var path = el.selectAll('path').each(function (r, i) {
                if (i === 1) {
                    var centroid = r.data.arc.centroid({
                        startAngle: r.startAngle + 0.05,
                        endAngle: r.startAngle + 0.001 + 0.05
                    });
                    var lableObj = r.data.object;
                    vis.g.append('text')
                        .attr('font-size', 16)
                        .attr('dominant-baseline', 'central')
                        /*.attr('transform', "translate(" + centroid[0] + "," + (centroid[1] + 10) + ") rotate(" + (180 / Math.PI * r.startAngle + 7) + ")")
                         .attr('alignment-baseline', 'middle')*/
                        .append("textPath")
                        .attr("textLength", function (d, i) {
                            return 0;
                        })
                        .attr("xlink:href", "#Text" + r.data.object.label)
                        .attr("startOffset", '5')
                        .attr("dy", '-3em')
                        .text(lableObj.value + '%');
                }
                if (i === 0) {
                    var centroidText = r.data.arc.centroid({
                        startAngle: r.startAngle,
                        endAngle: r.startAngle
                    });
                    var lableObj = r.data.object;
                    vis.gText.append('text')
                        .attr('font-size', 14)
                        .text(lableObj.label)
                        .attr('transform', "translate(" + (centroidText[0] - ((1.5 * vis.width) / 100)) + "," + (centroidText[1] + ") rotate(" + (180) + ")"))
                        .attr('dominant-baseline', 'central');
                }
            });
        });
        

        // var data = [20, 66, 50, 90, 100]

        // var svg = d3.select('#gaugeVis').append('svg')
        //     .attr('width',500)
        //     .attr('height',500)


        // var arcs = data.map((v,i)=>{
        //     return d3.arc()
        //         .innerRadius(i*20+60)
        //         .outerRadius((i+1)*20-5+60)
        // });


        // var pieData = data.map((v,i)=>{
        //    return [
        //     {value:v*0.75,arc:arcs[i]},
        //     {value:(100-v)*0.75,arc:arcs[i]},
        //     {value:100*0.25,arc:arcs[i]}
        //     ]
        // })

        // console.log("JW --- pieData", pieData)

        // var pie = d3.pie()
        //     .sort(null)
        //     .value(d=>d.value)
            
        // var g = svg.selectAll('g')
        //     .data(pieData)
        //     .enter()
        //     .append('g')
        //     .attr('transform','translate(250,250) rotate(180)')
        //     .attr('fill-opacity',(d,i)=>2/(i+1))
         
        //  // progress
        //  g.selectAll('path')
        //     .data(d=>{return pie(d)})
        //     .enter()
        //     .append('path')
        //     .attr('d',d=>{return d.data.arc(d)})
        //     .attr('fill',(d,i) => 
        //         i==0 ?'blue':'none')
         
        // svg.selectAll('g')
        //     .each(function(d){
        //         var el = d3.select(this);
        //         el.selectAll('path').each((r,i)=>{
        //             if (i==1) {
        //                 var centroid = r.data.arc.centroid({startAngle:r.startAngle+0.05,endAngle:r.startAngle+0.001+0.05})
        //                 g.append('text')
        //                     .text(100-Math.floor(r.value)+'%')
        //                     .attr('transform',`translate(${centroid[0]},${centroid[1]}) rotate(${180/Math.PI*(r.startAngle)+7})`)
        //                     .attr('alignment-baseline','middle')
        //             }
        //         })
        //     })
 


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
