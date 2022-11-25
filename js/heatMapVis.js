/* * * * * * * * * * * * * *
*         HeatMapVis       *
* * * * * * * * * * * * * */


class HeatMapVis {

    // constructor method to initialize Timeline object
    constructor(parentElement,co2Data,excludedCountries,isoCodes) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.excludedCountries = excludedCountries;
        this.displayData = [];
        this.sortedData = [];
        this.selectedYear = 2019;
        this.duration = 4000; // transition duration
        this.delay = 2000;
        this.selectedCategory = "percountry";
        this.sortNum = 50;
        this.isoCodes = isoCodes;
        this.selected_country_iso_code = 'USA';
        this.focused_heatmap;

        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;

        selectedCountryCode = 'USA';

        vis.margin = {top: 50, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;
        vis.cellHeight = 15;
        vis.cellPadding = 20;
        vis.cellWidth = 15;
        vis.textPadding = 60;
        vis.x_padding = 2
        vis.y_padding = 15;

        vis.zoom = vis.height / 600;


        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")

            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            //.attr("width", vis.width)
            //.attr("height", vis.height);
        /*
            .append("g")
            .attr("transform",
                "translate(" + vis.margin.left + "," + vis.margin.top + ")");
        */

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
        //console.log(vis.root);
        // Then d3.treemap computes the position of each element of the hierarchy
        // The coordinates are added to the root object above
        d3.treemap()
            .size([vis.width - vis.margin.right, vis.height - 1 * (vis.margin.bottom)])
            .padding(4)
            (vis.root)

        vis.maxVal = vis.sortedData[0].value;
        vis.minVal = vis.sortedData[vis.sortedData.length-1].value;

        vis.color.domain([
            0,

            vis.maxVal
        ]);

        //console.log(vis.root.leaves());
        // use this information to add rectangles:
        vis.cell = vis.svg.selectAll("g")
            .data(vis.root.leaves(), function(d){ return d.iso_code; })
            .enter().append("g")
            .attr("transform", function(d) { let x= d.x0 +vis.margin.left; let y= d.y0 + vis.margin.left; return "translate(" + x + "," + y + ")"; });

        vis.cell.append("rect")
            .attr("id", function(d) {  return d.data.iso_code; })
            .attr("width", function(d) { return d.x1 - d.x0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .attr("fill", function(d) { if (d.id == "Rest of the World") {
                return "lightgray";
            } else {
                return vis.color(d.value)
            }});

        vis.cell.append("text")
            .attr("class", "heatmap_rect_names")
            .attr("x", function(d) { return d.dx; })
            .attr("y", function(d) { return d.dy; })
            .attr("cursor","default")
            .attr("dy", vis.y_padding + "px")
            .attr("dx", vis.x_padding + "px")
            .text(function(d){  return d.data.iso_code});

        //.call(fit_text,1);



        this.wrangleData();
    }

    computeData() {
        let vis = this;

        //console.log(vis.co2Data[0]);


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
        vis.isoCodesDict = Object.fromEntries(vis.isoCodes.map(x => [x['alpha-3'], x['country-code']]));


        //console.log('selected year:' + vis.selectedYear);
        vis.consumption_co2_per_capita_total = 0;
        vis.consumption_co2_total = 0;
        for(let i = 0; i < vis.co2Data.length; i++) {

            //test
            if (vis.co2Data[i].year == vis.selectedYear && vis.co2Data[i].consumption_co2_per_capita != ''  && ! vis.excludedCountries.includes(vis.co2Data[i].country)) {
                vis.consumption_co2_per_capita_total += parseFloat(vis.co2Data[i].consumption_co2_per_capita);
                vis.consumption_co2_total += parseFloat(vis.co2Data[i].consumption_co2);

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
        //console.log(vis.displayData);
        //vis.sortedData = vis.displayData;

        vis.displayData.sort(function(current, next){
            return  next.value - current.value;
        });


        vis.sortedData = vis.displayData.slice(0,vis.sortNum* vis.zoom + 1);
        vis.notinSortedData = vis.displayData.slice(vis.sortNum, vis.displayData.length);

        vis.co2DataDict = Object.fromEntries(vis.sortedData.map(
            x => [x.iso_code, [x.name]]

        ));

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
        //console.log(vis.restOfData);

        let sum = 0;

        vis.restOfData.forEach(element => {
            sum += parseFloat(element.value);
        });
        sum = sum.toFixed(2);
        //console.log(sum);
        vis.sortedData.push(
            {
                name: 'Rest of the World',
                iso_code: 'ROW',
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

        //console.log(vis.sortedData);
        // to init Sankey to show USA data as default
        mySankeyVis.selectedYear = vis.selectedYear;
        mySankeyVis.country_iso_code = vis.selected_country_iso_code;
        mySankeyVis.wrangleData();
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
        //console.log(vis.root);
        // Then d3.treemap computes the position of each element of the hierarchy
        // The coordinates are added to the root object above

        d3.treemap()
            .size([vis.width - vis.margin.right, vis.height - 2 * (vis.margin.bottom)])
            .padding(4)
            (vis.root)



        vis.updateVis();

    }

    highLightHeatMapCountry(country_iso_code)
    {
        let vis = this;
        //remove all other highlights

        vis.svg.selectAll(".focused_heatmap").classed("focused_heatmap", false);


        let localSelectedCountryCode;
        //to handle 'Rest of the World' in heatmap

        //highlight the selected country
        // Reference: https://stackoverflow.com/questions/22844560/check-if-object-value-exists-within-a-javascript-array-of-objects-and-if-not-add
        let found = vis.sortedData.some(el => el.iso_code === country_iso_code);

        if (!found) {
            localSelectedCountryCode = 'ROW';
        }
        else
        {
            localSelectedCountryCode = selectedCountryCode;

        }
        //vis.svg.selectAll("rect")
        vis.cell.data(vis.root.leaves()).select("rect")
            .classed("focused_heatmap",  function(d, i) {
                return d.data.iso_code == localSelectedCountryCode ? true : false;            })
    }

    // updateVis method
    updateVis() {
        let vis = this;
        // append the svg object to the body of the page
        // update the title



        vis.maxVal = vis.sortedData[0].value;
        vis.minVal = vis.sortedData[vis.sortedData.length-1].value;

        vis.color.domain([
            0,

            vis.maxVal
        ]);
        /*
        vis.cell = vis.svg.selectAll("g")
            .data(vis.root.leaves(), function(d){ return d.iso_code; })
            .enter().append("g")
            .attr("transform", function(d) { let x= d.x0 +vis.margin.left; let y= d.y0 + vis.margin.left; return "translate(" + x + "," + y + ")"; });
        */

        // update treemap
        vis.cell.data(vis.root.leaves())
            .transition()
            .duration(vis.duration)
            .attr("transform", function(d) { let x= d.x0 +vis.margin.left; let y= d.y0 +vis.margin.left; return "translate(" + x + "," + y + ")"; });

        vis.cell.data(vis.root.leaves()).select("rect")
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
             <h4> ${d.data.value}</h4>
             <h4> Click for drilldown</h4>
       
            
             
 

         </div>`);

            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'white');

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
            .on('click', function(event, d){

                console.log('clicked');
                console.log(d);

                //update global variables and update index doc
                if (d.data.iso_code == "ROW") {
                    //pick a country at random !!
                    console.log(vis.notinSortedData);
                    let randomIndex = Math.floor(Math.random() * vis.notinSortedData.length);
                    selectedCountryCode = vis.notinSortedData[randomIndex].iso_code;
                    selectedCountry = vis.notinSortedData[randomIndex].name;
                    console.log(selectedCountryCode);
                    console.log(selectedCountry);

                } else {
                    selectedCountryCode = d.data.iso_code;
                    selectedCountry = d.data.name;
                }
                updateStatBlock();




                //highlight the heat map tile
                vis.selected_country_iso_code = selectedCountryCode;

                vis.highLightHeatMapCountry(selectedCountryCode);



                //call sankey
                mySankeyVis.selectedYear = vis.selectedYear;
                mySankeyVis.country_iso_code = selectedCountryCode;
                console.log(vis.co2DataDict);
                document.getElementById('sanKeyTitle').innerText = 'These are the emission sources for ' + selectedCountry;

                mySankeyVis.wrangleData();

                //call bump chart
                console.log("data in heatmap, ", d.data);
                myBumpChart.wrangleData();

                //call radar vis
                myRadarVis.selectedCountryCode = selectedCountryCode;
                myRadarVis.wrangleData();

                //to rotate globe to country being clicked
                myMapVis.selected_country_iso_code = selectedCountryCode;
                myMapVis.rotateEarth(myMapVis.selected_country_iso_code,vis.isoCodesDict);




            })
            .transition()
            .duration(vis.duration)
            .attr("width", function(d) { return d.x1 - d.x0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .attr("stroke","white")
            .attr("stroke-width","0.5")
            .attr("fill", function(d) { if (d.id == "Rest of the World") {
                return "lightgray";
            } else {
                return vis.color(d.value)
            }});

        vis.cell.data(vis.root.leaves()).select(".heatmap_rect_names")
            .transition()
            .delay(vis.duration/2)
            .text(function(d){ return d.data.iso_code});
            //.call(fit_text,1);



        vis.highLightHeatMapCountry(selectedCountryCode);




    }

}
