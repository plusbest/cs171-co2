/* * * * * * * * * * * * * ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
*        RadarVis                                                                                         *
*  Code adapted from tutorial here: https://yangdanny97.github.io/blog/2019/03/01/D3-Spider-Chart         *
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


class RadarVis {
    constructor(parentElement, co2Data) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.displayData = [];

        this.colors = ["darkorange", "gray", "navy"];

        this.initVis()
    }


    initVis() {
        let vis = this;

        // set margins
        vis.margin = {top: 25, right: 25, bottom: 25, left: 25};
        vis.containerWidth = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.containerHeight = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Make sure it doesn't get ridiculously huge on wide screens by limiting width
        vis.maxDiameter = 600 > vis.containerWidth ? vis.containerWidth : 600;
        vis.maxRadius = vis.maxDiameter / 2;

        // Keep track of version with margin for passing into scale
        vis.maxDiameterWithMargin = vis.maxDiameter - vis.margin.left - vis.margin.right;
        vis.maxRadiusWithMargin = vis.maxDiameterWithMargin / 2;

        // Shrink to reasonable size on big screens
        if (vis.containerWidth > vis.maxDiameter) {
            vis.width = vis.maxDiameter;
            vis.height = vis.maxDiameter;
        } else {
            vis.width = this.containerWidth;
            vis.height = this.containerWidth;
        }

        // Init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.radialScale = d3.scaleLinear()
            .domain([0,100])
            .range([0, vis.maxRadiusWithMargin]);

        vis.ticks = [20,40,60,80,100];

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "radar_tooltip")
            .attr('id', 'radarTooltip');

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Temporary dummy data
        let data = [];
        vis.features = [
            "percent_coal_co2",
            "percent_oil_co2",
            "percent_gas_co2",
            "percent_flaring_co2",
            "percent_cement_co2",
            "percent_other_co2"
        ];

        // console.log("radarVis", vis.selectedCountryCode);

        // Filter out all countries but the US & selected country
        let filteredData = this.co2Data.filter((row) => {
            const {
                year,
                country,
                iso_code,
                coal_co2,
                oil_co2,
                gas_co2,
                flaring_co2,
                cement_co2,
                co2
            } = row;
            if (
                (iso_code === "USA" || country === "World" || // Comparing against the US and Global distributions
                iso_code === selectedCountryCode) // Update to use selected country variable in future
                && year == selectedYear
            ) {
                // Ensure strings are converted to numbers
                row.coal_co2 = +coal_co2;
                row.oil_co2 = +oil_co2;
                row.gas_co2 = +gas_co2;
                row.flaring_co2 = +flaring_co2;
                row.cement_co2 = +cement_co2;
                row.co2 = +co2;
                return row;
            }
            return null;
        }).map((row) => { // Create new objects with just the data we need
            const {
                country,
                coal_co2,
                oil_co2,
                gas_co2,
                flaring_co2,
                cement_co2,
                iso_code,
                co2
            } = row;

            const totalFromSelectedFieldsCO2 = (coal_co2 + oil_co2 + gas_co2 + cement_co2 + flaring_co2);
            const leftoverCO2 = co2 - totalFromSelectedFieldsCO2;

            const newRow = {
                country,
                iso_code,
                percent_coal_co2: coal_co2 / co2 * 100,
                percent_oil_co2: oil_co2 / co2 * 100,
                percent_gas_co2: gas_co2 / co2 * 100,
                percent_cement_co2: cement_co2 / co2 * 100,
                percent_flaring_co2: flaring_co2 / co2 * 100,
                percent_other_co2: leftoverCO2 / 100 > 0 ? leftoverCO2 / 100 : 0
            };
            return newRow;
        });


        // generate the data
        for (let i = 0; i < 3; i++){
            let point = {}

            // Each feature will be a random number from 1-9
            vis.features.forEach(f => point[f] = 1 + Math.random() * 8);
            data.push(point);
        }

        vis.displayData = filteredData;

        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        if(selectedCountry =="United States") {
            //In 2019, their production emissions were divided like this:
            document.getElementById('radarTitle').innerHTML =
                "<div>Production CO2 emissions breakdown for " +" <strong class=\"usa_class\">" + selectedCountry + "</strong>" + " and the" +" <strong class=\"world_class\">" +  "World" +  "</strong>" + " in " + selectedYear + "</div>";
        } else {
            document.getElementById('radarTitle').innerHTML =
                "<div>Production CO2 emissions breakdown for " +" <strong class=\"usa_class\">" + "United States" + "</strong>" + "," + " <strong class=\"world_class\">" +  "World" + "</strong>" + " and " + "<span id=\"selected-country-name\" class=\"selected_country_class\">" + selectedCountry + "</span>" + " in " + selectedYear    + "</div>";

        }
        vis.drawAxes();

        // Remove any pre-existing blobs -- see comment below
        vis.svg.selectAll(".radar-area").remove();

        // TODO: Rework this to use update - enter - exit, so that paths are re-drawn with each new selection
        for (let i = 0; i < vis.displayData.length; i++) {
            let d = vis.displayData[i];
            let color = vis.colors[i];
            let coordinates = vis.getPathCoordinates(d);

            //draw the path element
            vis.svg.append("path")
                .attr("class", "radar-area" + " " + d.country)
                .datum(coordinates)
                .attr("d", d3.line()
                    .x(d => d.x)
                    .y(d => d.y)
                )
                .attr("stroke-width", 3)
                .attr("stroke", color)
                .attr("fill", color)
                .attr("stroke-opacity", 1)
                .attr("opacity", 0.5)
                .on('mouseover', function(event){
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
                                 <h3>${ d.country }</h3>
                                 <h4>
                                    <img src="/static/icons/coal.png" height="24" width="24" alt="coal">
                                    <strong>Coal:</strong> ${ Math.round(d.percent_coal_co2 * 100) / 100 }%
                                 </h4>       
                                 <h4>
                                    <img src="/static/icons/oil.png" height="24" width="24" alt="coal">
                                    <strong>Oil:</strong> ${ Math.round(d.percent_oil_co2 * 100) / 100 }%
                                 </h4>   
                                 <h4>
                                    <img src="/static/icons/gas.png" height="24" width="24" alt="coal">
                                    <strong>Gas:</strong> ${ Math.round(d.percent_gas_co2 * 100) / 100 }%
                                 </h4> 
                                 <h4>
                                    <img src="/static/icons/cement.png" height="24" width="24" alt="coal">
                                    <strong>Cement:</strong> ${ Math.round(d.percent_cement_co2 * 100) / 100 }%
                                 </h4> 
                                 <h4>
                                    <img src="/static/icons/flaring.png" height="24" width="24" alt="coal">
                                    <strong>Flaring:</strong> ${ Math.round(d.percent_flaring_co2 * 100) / 100 }%
                                 </h4>
                                 <h4>
                                    <img src="/static/icons/other-energy.png" height="24" width="24" alt="coal">
                                    <strong>Other:</strong> ${ Math.round(d.percent_other_co2 * 100) / 100 }%
                                 </h4>     
                             </div>`);
                })
                .on('mouseout', function(event){
                    d3.select(this)
                        .attr('stroke-width', '1px')
                        .attr('stroke', 'black');

                    vis.tooltip
                        .style("opacity", 0)
                        .style("left", 0)
                        .style("top", 0)
                        .html(``);
                })
        }

        // // Broken attempt at doing enter, update, remove -- return to later when there's more time
        // let blobs = vis.svg.selectAll(".radar-blob")
        //     .data(vis.displayData);
        //
        // blobs.enter()
        //     .append("path")
        //     .attr("class", (d) => "radar-blob radar-area " + d.iso_code)
        //     .datum((d) => vis.getPathCoordinates(d))
        //     .merge(blobs)
        //     .attr("d", line)
        //     .attr("stroke-width", 3)
        //     .attr("stroke", (d, i) => vis.colors[i])
        //     .attr("fill", (d, i) => vis.colors[i])
        //     .attr("stroke-opacity", 1)
        //     .attr("opacity", 0.5);
        //
        // blobs.exit().remove();
    }


    angleToCoordinate(angle, value){
        let vis = this;

        let x = Math.cos(angle) * vis.radialScale(value);
        let y = Math.sin(angle) * vis.radialScale(value);
        return {"x": vis.maxRadius + x, "y": vis.maxRadius - y};
    }

    getPathCoordinates(dataPoint){
        let vis = this;

        let coordinates = [];
        for (let i = 0; i < vis.features.length; i++){
            let ft_name = vis.features[i];
            let angle = (Math.PI / 2) + (2 * Math.PI * i / vis.features.length);
            coordinates.push(vis.angleToCoordinate(angle, dataPoint[ft_name]));
        }
        return coordinates;
    }

    fieldToIconPath(field) {
        switch(field){
            case "percent_oil_co2":
                return "static/icons/oil.png";
            case "percent_coal_co2":
                return "static/icons/coal.png";
            case "percent_gas_co2":
                return "static/icons/gas.png";
            case "percent_flaring_co2":
                return "static/icons/flaring.png";
            case "percent_cement_co2":
                return "static/icons/cement.png";
            case "percent_other_co2":
                return "static/icons/other-energy.png";
        }
    }

    drawAxes() {
        let vis = this;

        // Add the frame or "bullseye"
        let rings = vis.svg.selectAll(".radar-frame")
            .data(vis.ticks);

        rings.enter()
            .append("circle")
            .attr("class", "radar-frame")
            .merge(rings)
            .attr("cx", vis.maxRadius)
            .attr("cy", vis.maxRadius)
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("r", (t) => vis.radialScale(t))

        rings.exit().remove();

        // Segment the circles/add axis
        let axisLine = vis.svg.selectAll(".radar-axis")
            .data(vis.features);

        axisLine.enter()
            .append("line")
            .attr("class", "radar-axis")
            .merge(axisLine)
            .attr("x1", vis.maxRadius)
            .attr("y1", vis.maxRadius)
            .attr("x2", (d, i) => {
                let angle = (Math.PI / 2) + (2 * Math.PI * i / vis.features.length);
                let line_coordinate = vis.angleToCoordinate(angle, 100);

                return line_coordinate.x;
            })
            .attr("y2", (d, i) => {
                let angle = (Math.PI / 2) + (2 * Math.PI * i / vis.features.length);
                let line_coordinate = vis.angleToCoordinate(angle, 100);

                return line_coordinate.y;
            })
            .attr("stroke","black");

        axisLine.exit().remove();

        // Add labels to the rings
        let ringLabels = vis.svg.selectAll(".radar-ring-labels")
            .data(vis.ticks);

        ringLabels.enter()
            .append("text")
            .attr("class", "radar-frame")
            .merge(ringLabels)
            .attr("x", vis.maxRadius + 5) // offset slightly
            .attr("y", (t) => vis.maxRadius - vis.radialScale(t))
            .text((t) => t.toString() + "%")

        ringLabels.exit().remove();

        // Add Axis Icon Labels
        let axisIcons = vis.svg.selectAll(".radar-icon-label")
            .data(vis.features);

        axisIcons.enter()
            .append("svg:image")
            .attr("class", "radar-icon-label")
            .merge(axisIcons)
            .attr("xlink:href", (d) => this.fieldToIconPath(d))
            .attr("width", 24)
            .attr("height", 24)
            .attr("x", (d, i) => {
                let angle = (Math.PI / 2) + (2 * Math.PI * i / vis.features.length);
                let label_coordinate = vis.angleToCoordinate(angle, 100.5);

                // Slight adjustments to get the labels exactly where I want em
                if (i === 0) {
                    label_coordinate.x -= 10;
                } else if (i === 1) {
                    label_coordinate.x -= 25;
                } else if (i === 2) {
                    label_coordinate.x -= 25;
                } else if (i === 3) {
                    label_coordinate.x -= 13;
                } else if (i === 5) {
                    label_coordinate.x += 5;
                }

                return label_coordinate.x;
            })
            .attr("y", (d, i) => {
                let angle = (Math.PI / 2) + (2 * Math.PI * i / vis.features.length);
                let label_coordinate = vis.angleToCoordinate(angle, 100.5);

                if (i === 0) {
                    return label_coordinate.y - 45;
                } else if (i === 1) {
                    return label_coordinate.y - 25;
                } else if (i === 2) {
                    return label_coordinate.y + 5;
                } else if (i === 3) {
                    return label_coordinate.y + 5;
                } else if (i === 5) {
                    return label_coordinate.y - 15;
                }
                return label_coordinate.y;
            })
            .on('mouseover', function(event, d){
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                            <h4>
                                <img src=${vis.fieldToIconPath(d)} height="24" width="24" alt="coal">
                                <strong className="d-block text-capitalize">${d.split("_").join(" ")}</strong>
                            </h4>          
                        </div>`);
            })
            .on('mouseout', function(event){
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })

        axisIcons.exit().remove();
    }
}