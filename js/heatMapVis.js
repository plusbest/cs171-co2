/* * * * * * * * * * * * * *
*         HeatMapVis       *
* * * * * * * * * * * * * */


class HeatMapVis {

    // constructor method to initialize HeatMapVis object
    constructor(parentElement,co2Data,excludedCountries,isoCodes) {
        this.parentElement = parentElement;
        this.co2Data = co2Data; //co2 emissions data
        this.excludedCountries = excludedCountries; //these continents will be excluded
        this.displayData = [];
        this.sortedData = [];
        this.duration = 3000; // transition duration
        this.delay = 500; //transition delay
        this.selectedCategory = "percountry"; //default consumption category to display data
        this.units = "million tonnes"; //units of per country category

        this.sortNum = 50; // number of countries to show sorted in descending, rest will be clubbed together
        this.isoCodes = isoCodes; //list of country iso codes
        this.focused_heatmap;

        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;

        selectedCountryCode = 'USA'; //set the global country to be USA as default view

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

        // Create the SVG
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")

            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);


        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "heatmap_tooltip")
            .attr('id', 'heatmapTooltip');

        // scale for the coloring of heatmap tiles
        vis.color = d3.scaleSequential()
            .interpolator(d3.interpolateOranges);

        // Calculate the data
        this.computeData();

        //Add the initial vis


        // Reference: https://d3-graph-gallery.com/graph/treemap_basic.html
        // stratify the data: reformatting for d3.js
        vis.root = d3.stratify()
            .id(function(d) { return d.name; })   // Name of the entity
            .parentId(function(d) { return d.parent; })   // Name of the parent
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

        // set the domain for color of tiles
        vis.color.domain([
            0,

            vis.maxVal
        ]);

        //console.log(vis.root.leaves());

        // Reference: https://bl.ocks.org/ivan-vallejo/1e92db10504b6115b37db398a93e2d9f
        // create the cell group the text and the rectangle
        vis.cell = vis.svg.selectAll("g")
            .data(vis.root.leaves(), function(d){ return d.iso_code; })
            .enter().append("g")
            .attr("transform", function(d) { let x= d.x0 +vis.margin.left; let y= d.y0 + vis.margin.left; return "translate(" + x + "," + y + ")"; });

        //create the rectangle
        vis.cell.append("rect")
            .attr("id", function(d) {  return d.data.iso_code; })
            .attr("width", function(d) { return d.x1 - d.x0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .attr("fill", function(d) { if (d.id == "Rest of the World") {
                return "lightgray"; // rest of the world will not have heat color since it has many countries
            } else {
                return vis.color(d.value) //return the color
            }});

        //Add the text on heatmap tile
        vis.cell.append("text")
            .attr("class", "heatmap_rect_names")
            .attr("x", function(d) { return d.dx; })
            .attr("y", function(d) { return d.dy; })
            .attr("cursor","default")
            .attr("dy", vis.y_padding + "px")
            .attr("dx", vis.x_padding + "px")
            .text(function(d){  return d.data.iso_code});




        this.wrangleData();
    }

    computeData() {
        let vis = this;



        this.displayData = [];
        this.sortedData = [];

        let valueToStore = 0;
        let valueType = '';
        let valueUnits = '';

        // dictionary to map ISO code to numerical codes
        vis.isoCodesDict = Object.fromEntries(vis.isoCodes.map(x => [x['alpha-3'], x['country-code']]));


        vis.consumption_co2_per_capita_total = 0;
        vis.consumption_co2_total = 0;

        for(let i = 0; i < vis.co2Data.length; i++) {
            // Only pick non-null values for the selected year and not an excluded country
            if (vis.co2Data[i].year == selectedYear && vis.co2Data[i].consumption_co2_per_capita != ''  && ! vis.excludedCountries.includes(vis.co2Data[i].country)) {


                if(vis.selectedCategory == "percapita") {
                    valueToStore = parseFloat(vis.co2Data[i].consumption_co2_per_capita).toFixed(2);
                    valueType = "Consumption CO2 per capita";
                    valueUnits = "tonnes";


                } else {
                    valueToStore = parseFloat(vis.co2Data[i].consumption_co2).toFixed(2);
                    valueType = "Consumption CO2";
                    valueUnits = "million tonnes";


                }

                //Store the date element for display
                vis.displayData.push(
                    {
                        name: vis.co2Data[i].country,
                        iso_code: vis.co2Data[i].iso_code,
                        parent: 'Origin',
                        value: valueToStore,
                        units: valueUnits,
                        type: valueType,
                        rank: i
                    }
                );

            }
        }

        // Sort in descending order
        vis.displayData.sort(function(current, next){
            return  next.value - current.value;
        });

        // Only pick the top elements accounting for zoom for screen size
        vis.sortedData = vis.displayData.slice(0,vis.sortNum* vis.zoom + 1);
        // The ones that were left out
        vis.notinSortedData = vis.displayData.slice(vis.sortNum, vis.displayData.length);

        // Dictionary to store country name for the iso code
        vis.co2DataDict = Object.fromEntries(vis.sortedData.map(
            x => [x.iso_code, [x.name]]

        ));

        // Add the rankings
        for(let i=0; i < vis.sortedData.length; i++) {
            vis.sortedData[i].rank = i + 1;
        }



        let sum = 0;
        // Calculate total for the rest of the countries
        vis.notinSortedData.forEach(element => {
            sum += parseFloat(element.value);
        });
        sum = sum.toFixed(2);

        // Add the rest of the world
        vis.sortedData.push(
            {
                name: 'Rest of the World',
                iso_code: 'ROW',
                parent: 'Origin',
                value: sum,
                units: valueUnits,

                type: valueType,
                rank: 'NA'


            }
        );

        // Add the top dummy element
        vis.sortedData.push(
            {
                name: 'Origin',
                iso_code: '',
                parent: '',
                value: '',
                units: ' ',

                type: '',
                rank: ''

            }
        );


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

        //Check if the heatmap tiles have this iso code, else assign to Rest of the World
        let found = vis.sortedData.some(el => el.iso_code === country_iso_code);

        if (!found) {
            localSelectedCountryCode = 'ROW';
        }
        else
        {
            localSelectedCountryCode = selectedCountryCode;

        }


        //highlight the selected country
        // Reference: https://stackoverflow.com/questions/22844560/check-if-object-value-exists-within-a-javascript-array-of-objects-and-if-not-add
        vis.cell.data(vis.root.leaves()).select("rect")
            .classed("focused_heatmap",  function(d, i) {
                return d.data.iso_code == localSelectedCountryCode ? true : false;            })
    }

    // updateVis method
    updateVis() {
        let vis = this;



        vis.maxVal = vis.sortedData[0].value;
        vis.minVal = vis.sortedData[vis.sortedData.length-1].value;
        //Set the domain for coloring of heatmap tiles
        vis.color.domain([
            0,

            vis.maxVal
        ]);


        // update treemap
        // Reference: https://bl.ocks.org/ivan-vallejo/1e92db10504b6115b37db398a93e2d9f

        vis.cell.data(vis.root.leaves())
            .transition()
            .duration(vis.duration)
            .attr("transform", function(d) { let x= d.x0 +vis.margin.left; let y= d.y0 +vis.margin.left; return "translate(" + x + "," + y + ")"; });

        vis.cell.data(vis.root.leaves()).select("rect")
            .on('mouseover', function(event, d){
                //Handle hover
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
             <h4> ${d.data.type}: ${d.data.value} ${d.data.units}</h4>
             <h4> Rank: ${d.data.rank}</h4>    

             <h4> Click to see drilldown details on next pages </h4>
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

                //Show the stat
                updateStatBlock();




                //highlight the heat map tile
                vis.selected_country_iso_code = selectedCountryCode;

                vis.highLightHeatMapCountry(selectedCountryCode);



                //call sankey

                console.log(vis.co2DataDict);
                if(selectedCountry =="United States") {
                    document.getElementById('sanKeyTitle').innerHTML =
                        "<div>Here is the breakdown of CO2 emission sources for <strong class=\"px-3 py-1 bg-white\">" + selectedCountry + "</strong>" + " in " + selectedYear + "</div>";
                } else {
                    document.getElementById('sanKeyTitle').innerHTML =
                        "<div>Here is the breakdown of CO2 emission sources for <span id=\"selected-country-name\" class=\"px-3 py-1 bg-warning fs-5\">" + selectedCountry + "</span>" + " in " + selectedYear + "</div>";
                }


                mySankeyVis.wrangleData();

                //call bump chart
                console.log("data in heatmap, ", d.data);
                myBumpChart.changeCurrentView(myBumpChart.currentView);

                //call radar vis
                myRadarVis.selectedCountryCode = selectedCountryCode;
                myRadarVis.wrangleData();

                //rotate globe to country being clicked
                myMapVis.selected_country_iso_code = selectedCountryCode;
                myMapVis.rotateEarth(myMapVis.selected_country_iso_code,vis.isoCodesDict);




            })
            .transition()
            .duration(vis.duration)
            .delay(vis.delay)

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
            .delay(vis.delay)
            .text(function(d){ return d.data.iso_code})
            .attr("stroke",function(d) { if (d.data.rank < 2) {return "white";} else {return "blue";}  });


        //highlight the selected country
        vis.highLightHeatMapCountry(selectedCountryCode);




    }

}
