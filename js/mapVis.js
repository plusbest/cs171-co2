/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    constructor(parentElement, co2Data, excludedCountries, geoData, isoCodes) {
        this.parentElement = parentElement;
        this.co2Data = co2Data; //co2 emissions data
        this.excludedCountries = excludedCountries; //these continents will be excluded
        this.geoData = geoData; //data for the globe
        this.isoCodes = isoCodes; //list of country iso codes


        this.duration = 3000; // transition duration
        this.delay = 500; // transition delay
        this.selectedCategory = "percountry"; //default consumption category to display data
        this.units = "million tonnes"; //units of per country category
        this.focused;

        this.initVis()
    }

    initVis() {
        let vis = this;

        selectedCountryCode = 'USA';
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.zoom = vis.height / 600;

        //prepare the data for the globe
        vis.projection =
            d3.
                geoOrthographic()

                .translate([vis.width / 2, vis.height / 2])
                .scale(210 * vis.zoom); //  multiply by your zoom to adjust for screen size

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;

        //Add the water body first
        vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("class", "graticule")
            //.attr('fill', '#d4f1f9')
            .attr('fill', '#ADDEFF')
            .attr("stroke","rgba(129,129,129,0.35)")
            .attr("d", vis.path);

        //Add the countries
        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path)
            .attr("fill", "green");


        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "mapVis_tooltip")
            .attr('id', 'mapVisTooltip');



        // color scale
        vis.color = d3.scaleSequential()
            .interpolator(d3.interpolateOranges);


        let m0,
            o0;

        vis.svg.call(
            d3.drag()
                .on("start", function (event) {

                    let lastRotationParams = vis.projection.rotate();
                    m0 = [event.x, event.y];
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }

                    // Update the map
                    vis.path = d3.geoPath().projection(vis.projection);
                    d3.selectAll(".country").attr("d", vis.path)
                    d3.selectAll(".graticule").attr("d", vis.path)
                })
        )

        // calculate the centrolds of the countries for rotate to specific country
        let centroids = vis.world.map(function (feature){
            return vis.path.centroid(feature);
        });

        // Add legend
        vis.svg.append("g")
            .attr('class', 'legendSequential')
            .attr('transform', `translate(${vis.width * 0.8}, ${vis.margin.top + vis.margin.bottom})`);

        vis.wrangleData()

    }

    wrangleData() {
        let vis = this;

        // numeric code to iso codes
        vis.isoCodesDict = Object.fromEntries(vis.isoCodes.map(x => [parseInt(x['country-code']), x['alpha-3']]));
        // iso code to numeric codes
        vis.isoCodesDict_iso_to_numeric_codes = Object.fromEntries(vis.isoCodes.map(x => [x['alpha-3'], x['country-code']]));

        vis.co2DataFiltered = [];
        vis.consumption_co2_per_capita_total = 0;
        vis.consumption_co2_total = 0;
        for (let i=0; i < vis.co2Data.length; i++) {
            // Only pick non-null values for the selected year and not an excluded country
            if (vis.co2Data[i].year == selectedYear && vis.co2Data[i].consumption_co2_per_capita != ''  && ! vis.excludedCountries.includes(vis.co2Data[i].country)) {
                vis.consumption_co2_per_capita_total += parseFloat(vis.co2Data[i].consumption_co2_per_capita);
                vis.consumption_co2_total += parseFloat(vis.co2Data[i].consumption_co2);

                vis.co2DataFiltered.push(
                    {
                        name: vis.co2Data[i].country,
                        iso_code: vis.co2Data[i].iso_code,
                        consumption_co2_per_capita: vis.co2Data[i].consumption_co2_per_capita,
                        consumption_co2: vis.co2Data[i].consumption_co2
                    }
                )
            }
        }


        vis.co2DataDict = Object.fromEntries(vis.co2DataFiltered.map(
                x => [x.iso_code, [x.name, x.consumption_co2_per_capita, x.consumption_co2]]

        ));

        // create data structure with information for each country
        vis.countryInfo = {};
        vis.geoData.objects.countries.geometries.forEach(d => {

            let isoCodeVal = vis.isoCodesDict[parseInt(d.id)];
            let country_name = '';
            let country_val = 0.00;
            let country_val_percent = 0.00;
            country_name = isoCodeToCountryNameMap[isoCodeVal];

            if (isoCodeVal in vis.co2DataDict) {

                 if (vis.selectedCategory == "percapita") {
                     vis.units = "tonnes";
                     if(vis.co2DataDict[isoCodeVal][1] !=''){
                         country_val = parseFloat(vis.co2DataDict[isoCodeVal][1]);
                         country_val_percent = parseFloat(country_val)/parseFloat(vis.consumption_co2_per_capita_total);
                     }
                     else
                     {
                         country_val = 0.0;
                         country_val_percent = 0.0;
                     }

                 }
                 else
                 {
                     vis.units = "million tonnes";

                     if(vis.co2DataDict[isoCodeVal][1] !='') {

                         country_val = parseFloat(vis.co2DataDict[isoCodeVal][2]);
                         country_val_percent = parseFloat(country_val)/parseFloat(vis.consumption_co2_total);

                     }
                     else {
                         country_val = 0.0;
                         country_val_percent = 0.0;

                     }
                 }
            }
            else {
                    //handle the countries not found in the globe data
                    if (country_name == undefined) {
                        country_name = '';
                    }

                    country_val = 0.0;
                    country_val_percent = 0.0;

            }


            vis.countryInfo[parseInt(d.id)] = {

                name: country_name,
                value: parseFloat(country_val),
                value_percent: parseFloat(country_val_percent)
            }


        })

        vis.updateVis()
    }



    rotateEarth(country_iso_code) {
        let vis = this;

        //to rotate globe to country being clicked
        //Reference: https://plnkr.co/edit/MeAA55fbY5dMZETCXpFo?p=preview&preview
        let centroids = vis.world.map(function (feature){
            return d3.geoCentroid(feature);
        });

        const index = vis.world.findIndex(object => {
            return object.id === parseInt(vis.isoCodesDict_iso_to_numeric_codes[country_iso_code]);
            //vis.isoCodesDict[d.data.iso_code];
        });

        let temp_iso = country_iso_code;

        let p = centroids[index];

        vis.svg.selectAll(".focused").classed("focused", vis.focused = false);

        //Globe rotating

        (function transition() {
            d3.transition()
                .duration(vis.duration)
                .tween("rotate", function() {
                    var r = d3.interpolate(vis.projection.rotate(), [-p[0], -p[1]]);
                    return function(t) {
                        vis.projection.rotate(r(t));
                        // Update the map
                        vis.path = d3.geoPath().projection(vis.projection);
                        d3.selectAll(".country").attr("d", vis.path);
                        d3.selectAll(".graticule").attr("d", vis.path);

                        vis.svg.selectAll("path").attr("d", vis.path)
                            .classed("focused", function(d, i) { return d.id == vis.isoCodesDict_iso_to_numeric_codes[temp_iso] ? vis.focused = d : false; });


                    };
                })
        })();
    }

    updateVis() {
        let vis = this;

        // max Val to set the domain
        if(vis.selectedCategory == 'percapita') {
            vis.valueType = "Consumption CO2 per capita";
            vis.maxVal = Math.max.apply(null, vis.co2DataFiltered.map(o => o.consumption_co2_per_capita));

        }
        else
        {
            vis.valueType = "Consumption CO2";
            vis.maxVal = Math.max.apply(null, vis.co2DataFiltered.map(o => o.consumption_co2));

        }

        //Rotate to selected country code (default USA) on refresh
        vis.rotateEarth(selectedCountryCode);


        vis.color.domain([

            0,

            vis.maxVal
        ]);

        //update the countries
        vis.countries
            .on('mouseover', function(event, d){

                // handle hover
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'rgba(173,222,255,0.62)');
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
         <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">

             <h3> ${vis.countryInfo[d.id].name}</h3>
             <h4> ${vis.valueType} : ${vis.countryInfo[d.id].value.toFixed(2) } ${vis.units}</h4>   
             <h4> ${Math.round(parseFloat(vis.countryInfo[d.id].value_percent.toFixed(2)*100),2)}% of total emissions</h4>   
             <h4>  Click to see drilldown details on next pages </h4>




         </div>`);
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px');

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
            .on('click', function(event, d){

                // Get the iso code that was clicked
                const isocode = vis.isoCodesDict[parseInt(d.id)];
                
                //update global variables and update index doc
                selectedCountryCode = isocode;
                selectedCountry = isoCodeToCountryNameMap[isocode];

                updateStatBlock();


                //call sankey

                console.log(mySankeyVis.country_iso_code);

                mySankeyVis.wrangleData();
                if(selectedCountry =="United States") {
                    document.getElementById('sanKeyTitle').innerHTML =
                        "<div>Here is the breakdown of CO2 emission sources for <strong class=\"px-3 py-1 bg-white\">" + selectedCountry + "</strong>" + " in " + selectedYear + "</div>";
                } else {
                    document.getElementById('sanKeyTitle').innerHTML =
                        "<div>Here is the breakdown of CO2 emission sources for <span id=\"selected-country-name\" class=\"px-3 py-1 bg-warning fs-5\">" + selectedCountry + "</span>" + " in " + selectedYear + "</div>";
                }
                //call bump chart
                myBumpChart.changeCurrentView(myBumpChart.currentView);

                //call radar vis
                myRadarVis.selectedCountryCode = selectedCountryCode;
                myRadarVis.wrangleData();

                //rotate the earth to that country
                vis.rotateEarth(selectedCountryCode);

                //highlight the corresponding heat map tile
                myHeatMapVis.highLightHeatMapCountry(vis.isoCodesDict[parseInt(d.id)]);

            })
            .merge(vis.countries)
            .transition()
            .delay(vis.delay)

            .duration(vis.duration)
            .style("fill", function(d, index) {
                return vis.color(vis.countryInfo[d.id].value);
            });

        // rotate to selected country
        vis.rotateEarth(selectedCountryCode);


        // Reference: https://d3-legend.susielu.com/

        // Add legend
        vis.legendSequential = d3.legendColor()
            .shapeWidth(30)
            .cells(4)
            .orient("vertical")
            .scale(vis.color);

        vis.svg.select(".legendSequential")
            .call(vis.legendSequential);



    }
}