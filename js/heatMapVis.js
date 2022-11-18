/* * * * * * * * * * * * * *
*         HeatMapVis       *
* * * * * * * * * * * * * */


class HeatMapVis {

    // constructor method to initialize Timeline object
    constructor(parentElement,co2Data,excludedCountries) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.excludedCountries = excludedCountries;
        this.displayData = [];
        this.sortedData = [];
        this.selectedYear = 2019;
        this.duration = 1000; // transition duration
        this.delay = 100;
        this.selectedCategory = "percapita";
        this.sortNum = 75;
        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 50, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;
        vis.cellHeight = 15;
        vis.cellPadding = 20;
        vis.cellWidth = 15;
        vis.textPadding = 60;




        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")

            //.attr("width", vis.width + vis.margin.left + vis.margin.right)
            //.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("width", vis.width)
            .attr("height", vis.height)
            .append("g")
            .attr("transform",
                "translate(" + vis.margin.left + "," + vis.margin.top + ")");


        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "heatmap_tooltip")
            .attr('id', 'heatmapTooltip');

        vis.color = d3.scaleSequential()
            .interpolator(d3.interpolateOranges);

        // call next method in pipeline
        this.computeData();

        //Add the initial vis


        // Reference: https://d3-graph-gallery.com/graph/treemap_basic.html
        // stratify the data: reformatting for d3.js
        vis.root = d3.stratify()
            .id(function(d) { return d.name; })   // Name of the entity (column name is name in csv)
            .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
            (vis.sortedData);
        vis.root.sum(function(d) { return +d.value })   // Compute the numeric value for each entity
        console.log(vis.root);
        // Then d3.treemap computes the position of each element of the hierarchy
        // The coordinates are added to the root object above
        d3.treemap()
            .size([vis.width - vis.margin.right, vis.height - 1 * (vis.margin.bottom)])
            .padding(4)
            (vis.root)

        console.log(vis.root.leaves());
        // use this information to add rectangles:

        vis.svg.selectAll("rect")
            .data(vis.root.leaves(), function(d){ return d.iso_code; })
            .enter()
            .append("rect")
            .on('mouseover', function(event, d){
                //console.log(d);
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr("stroke", 'red');

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
         <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
             <h3> ${ d.data.name}</h3>
             <h4> Rank: ${d.data.rank}</h4>       
             <h4> ${d.data.type}: ${d.data.value}</h4>       
             
 

         </div>`);

            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'black');

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        vis.svg
            .selectAll("text")
            .data(vis.root.leaves(), function(d){ return d.iso_code; })

            .enter()
            .append("text")
            .attr("class","heatmap_rect_names")


            .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
            .attr("y", function(d){ return d.y0+10})    // +10 to adjust position (lower)
            .text(function(d){ return d.data.iso_code});

        this.wrangleData();
    }

    computeData() {
        let vis = this;

        console.log(vis.co2Data[0]);


        this.displayData = [];
        this.sortedData = [];
        /*
        vis.displayData.push(
            {
                name: 'Origin',
                iso_code: '',
                parent: '',
                value: ''
            }
            );

         */
        let  valueToStore = 0;
        let valueType = '';
        console.log('selected year:' + vis.selectedYear);
        for(let i = 0; i < vis.co2Data.length; i++) {

            //test
            if (vis.co2Data[i].year == vis.selectedYear && vis.co2Data[i].consumption_co2_per_capita != ''  && ! vis.excludedCountries.includes(vis.co2Data[i].country)) {
                if(vis.selectedCategory == "percapita") {
                    valueToStore = parseFloat(vis.co2Data[i].consumption_co2_per_capita).toFixed(2);
                    valueType = "Consumption CO2 per capita";

                } else {
                    valueToStore = parseFloat(vis.co2Data[i].consumption_co2).toFixed(2);
                    valueType = "Consumption CO2";

                }


                vis.displayData.push(
                    {
                        name: vis.co2Data[i].country,
                        iso_code: vis.co2Data[i].iso_code,
                        parent: 'Origin',
                        value: valueToStore,
                        type: valueType,
                        rank: i
                    }
                );

            }
        }
        console.log(vis.displayData);
        //vis.sortedData = vis.displayData;

        vis.displayData.sort(function(current, next){
            return  next.value - current.value;
        });


        vis.sortedData = vis.displayData.slice(0,vis.sortNum);



        // Read data
        /*
        vis.color.domain([
            d3.min(vis.sortedData, function(d) { return d.value; }),
            d3.max(vis.sortedData, function(d) { return d.value; })
        ]);

         */
        for(let i=0; i < vis.sortedData.length; i++) {
            vis.sortedData[i].rank = i + 1;
        }

        vis.restOfData = vis.displayData.slice(vis.sortNum,vis.displayData.length);
        console.log(vis.restOfData);

        let sum = 0;

        vis.restOfData.forEach(element => {
            sum += parseFloat(element.value);
        });
        sum = sum.toFixed(2);
        console.log(sum);
        vis.sortedData.push(
            {
                name: 'Rest of the World',
                iso_code: 'Rest of the World',
                parent: 'Origin',
                value: sum,
                type: valueType,
                rank: 'NA'


            }
        );

        vis.sortedData.push(
            {
                name: 'Origin',
                iso_code: '',
                parent: '',
                value: '',
                type: '',
                rank: ''

            }
        );

        console.log(vis.sortedData);
    }
    // wrangleData method
    wrangleData() {
        let vis = this;

        vis.computeData();
        //will recalculate data only if years change
        vis.root = d3.stratify()
            .id(function(d) { return d.name; })   // Name of the entity (column name is name in csv)
            .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
            (vis.sortedData);
        vis.root.sum(function(d) { return +d.value })   // Compute the numeric value for each entity
        console.log(vis.root);
        // Then d3.treemap computes the position of each element of the hierarchy
        // The coordinates are added to the root object above
        d3.treemap()
            .size([vis.width - vis.margin.right, vis.height - 2 * (vis.margin.bottom)])
            .padding(4)
            (vis.root)

        console.log(vis.root.leaves());


        vis.updateVis();

    }

    // updateVis method
    updateVis() {
        let vis = this;
        // append the svg object to the body of the page
        // update the title

        //d3.select(('#heatMapTitle').attr("text","Default Text");
        //= "Heat Map for " + vis.selectedYear;

        vis.maxVal = vis.sortedData[0].value;
        vis.minVal = vis.sortedData[vis.sortedData.length-1].value;

        vis.color.domain([
            0,

            vis.maxVal
        ]);



        vis.rect = vis.svg
            .selectAll("rect")
            .data(vis.root.leaves(), function(d){ return d.iso_code; })

        //vis.rect.exit().remove();

        vis.rect.exit()
            .style("opacity", 1)
            .transition().duration(vis.duration)
            .delay(vis.delay)

            .style("opacity", 1e-6)
            //.attr("x", -10)
            //.attr("y", -10)

            .remove();

        vis.rect
            .enter()
            .append("rect")
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .attr('opacity','80%')
            .on('mouseover', function(event, d){
                //console.log(d);
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr("stroke", 'red');

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
         <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
             <h3> ${ d.data.name}</h3>
             <h4> Rank: ${d.data.rank}</h4>       
             <h4> ${d.data.type}: ${d.data.value}</h4>       
             
 

         </div>`);

            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'black');

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
            .merge(vis.rect)
            .transition()
            .delay(vis.delay)

            .duration(vis.duration)
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .attr('opacity','80%')
            .style("stroke", "gray")
            //.style("fill", "#69b3a2");
            .style("fill", function (d) {
                if (d.id == "Rest of the World") {
                    return "lightgray";
                } else {
                    return vis.color(d.value)
                }
            });

        // and to add the text labels

        vis.text =  vis.svg
            .selectAll("text")
            .data(vis.root.leaves(), function(d){ return d.iso_code; });

        //vis.text.exit().remove();


        vis.text

            .enter()
            .append("text")
            .attr("class","heatmap_rect_names")
            .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
            .attr("y", function(d){ return d.y0+10})    // +10 to adjust position (lower)
            .text(function(d){ return d.data.iso_code})
            .merge(vis.text)
            .transition()
            .delay(vis.delay)

            .duration(vis.duration)
            .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
            .attr("y", function(d){ return d.y0+10})    // +10 to adjust position (lower)
            .text(function(d){ return d.data.iso_code});

        vis.text.exit()
            .style("opacity", 1)
            .transition().duration(vis.duration)
            .delay(vis.delay)
            //.attr("x", -10)
            //.attr("y", -10)

            .style("opacity", 1e-6)
            .remove();

    }

}
