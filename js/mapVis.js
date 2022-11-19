/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    constructor(parentElement, co2Data, excludedCountries, geoData, isoCodes) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.excludedCountries = excludedCountries;
        this.geoData = geoData;
        this.isoCodes = isoCodes;
        this.displayData = [];
        this.sortedData = [];

        this.duration = 1000; // transition duration
        this.delay = 100;
        this.selectedCategory = "percapita";
        this.sortNum = 75;
        this.colors = ['#fddbc7', '#f4a582', '#d6604d', '#b2182b'];
        this.selectedYear = 2019;


        this.initVis()
    }

    initVis() {
        let vis = this;


        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        /*
        vis.svg.append('g')
            .attr('class', 'title')
            .attr('id', 'map-title')
            .append('text')
            .text('Map')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');
        */
        // TODO
        vis.projection =
            d3.geoOrthographic()
                //d3.geoAzimuthalEqualArea()
                //d3.geoStereographic()
                .translate([vis.width / 2, vis.height / 2])
                .scale(165);

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;

        vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("class", "graticule")
            .attr('fill', '#ADDEFF')
            .attr("stroke","rgba(129,129,129,0.35)")
            .attr("d", vis.path);

        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path);


        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'pieTooltip');



        /*
        vis.color = d3.scaleLinear()
            .domain([0,25,50,75])
            .range(vis.colors);
        */
        vis.color = d3.scaleSequential()
            .interpolator(d3.interpolateOranges);

        console.log(vis.color(99));
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 2.8 / 4}, ${vis.height - 50})`)



        // Reference: https://d3-legend.susielu.com/
        vis.legend = d3.legendColor()
            .shape("rect")
            .cells([0,25,50,75])
            .shapeHeight(20)
            .shapeWidth(40)
            .shapePadding(0)
            .labelOffset(2)
            .labelFormat(d3.format('.0f'))
            .orient("horizontal")
            .labelAlign("start")
            .scale(vis.color);

        d3.select(".legend").call(vis.legend);

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

        vis.wrangleData()

    }

    wrangleData() {
        let vis = this;
        console.log(vis.isoCodes);
        vis.isoCodesDict = Object.fromEntries(vis.isoCodes.map(x => [x['country-code'], x['alpha-3']]));
        vis.co2DataFiltered = [];

        for (let i=0; i < vis.co2Data.length; i++) {
            if (vis.co2Data[i].year == vis.selectedYear) {
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

        console.log(vis.co2DataFiltered);



        vis.co2DataDict = Object.fromEntries(vis.co2DataFiltered.map(
                x => [x.iso_code, [x.name, x.consumption_co2_per_capita, x.consumption_co2]]

        ));


        console.log(vis.isoCodesDict);
        console.log(vis.co2DataDict);
        console.log(vis.isoCodesDict['Zimbabwe']);
        // create random data structure with information for each land
        vis.countryInfo = {};
        vis.geoData.objects.countries.geometries.forEach(d => {
            //console.log(d);
            console.log(d.id);
            let isoCodeVal = vis.isoCodesDict[d.id];
            console.log(isoCodeVal);
            let country_name = '';
            let country_val = 0;

            if (isoCodeVal in vis.co2DataDict) {
                 country_name = vis.co2DataDict[isoCodeVal][0];
                 country_val = vis.co2DataDict[isoCodeVal][1];
            }
            else {
                 country_name = '';
                country_val = 0;

            }

            let randomCountryValue = Math.random() * 4
            vis.countryInfo[d.id] = {

                //name: d.properties.name,
                name: country_name,

                category: 'category_' + Math.floor(randomCountryValue),
                color: vis.colors[Math.floor(randomCountryValue)],
                value: country_val
            }
        })
        console.log(vis.countryInfo);
        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        // TODO
        console.log(vis.countryInfo);
        //vis.maxVal = vis.sortedData[0].value;
        //vis.minVal = vis.sortedData[vis.sortedData.length-1].value;

        vis.color.domain([
            0,

            40
        ]);
        vis.countries
            .on('mouseover', function(event, d){
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
             <h4> category: ${vis.countryInfo[d.id].category}</h4>      
             <h4> name: ${vis.countryInfo[d.id].name}</h4>
             <h4> value: ${Math.round(vis.countryInfo[d.id].value)*100/100}</h4>   
         </div>`);
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px');
                //.attr("fill", d => d.data.color)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
            .merge(vis.countries)
            .style("fill", function(d, index) {
                return vis.color(vis.countryInfo[d.id].value);
            });



    }
}