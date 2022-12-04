/* * * * * * * * * * * * * ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
*  RadarVis                                                                                               *
*  Code adapted from tutorial here: https://yangdanny97.github.io/blog/2019/03/01/D3-Spider-Chart         *
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


class RadarVis {
    constructor(parentElement, co2Data) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.displayData = [];


        this.colors = {"Selected_country": "#B2DF8A", "USA": "#A6CEE3", "": "#1F78B4"}; //"" for World

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

        // Add a scale
        vis.radialScale = d3.scaleLinear()
            .domain([0,100])
            .range([0, vis.maxRadiusWithMargin]);

        // Space ticks out (so they add up to 100%)
        vis.ticks = [20,40,60,80,100];

        // Initialize tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "radar_tooltip")
            .attr('id', 'radarTooltip');

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Features to include in graph
        vis.features = [
            "percent_coal_co2",
            "percent_oil_co2",
            "percent_gas_co2",
            "percent_flaring_co2",
            "percent_cement_co2",
            "percent_other_co2"
        ];

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
        }).map((row) => {
            // Create new objects with just the data we need
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

            // Doing some calculating of percentage values
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
                "<div>Production CO2 emissions breakdown for " + " <strong class=\"usa_class\">" + "United States" + "</strong>" + "," + " <strong class=\"world_class\">" + "World" + "</strong>" + " and " + "<span id=\"selected-country-name\" class=\"selected_country_class\">" + selectedCountry + "</span>" + " in " + selectedYear + "</div>";

        }
        // Update the axes and radar blobs
        vis.drawAxes();
        vis.drawBlobs();

        // Update radar title
        vis.updateRadarTitle();
    }

    angleToCoordinate(angle, value){
        let vis = this;

        // Calculate the appropriate (general) coordinates for this chunk of the circle
        let x = Math.cos(angle) * vis.radialScale(value);
        let y = Math.sin(angle) * vis.radialScale(value);
        return {"x": vis.maxRadius + x, "y": vis.maxRadius - y};
    }

    getPathCoordinates(dataPoint){
        let vis = this;

        // Calculate the coordinates for each point on the path for this chunk
        let coordinates = [];
        for (let i = 0; i < vis.features.length; i++){
            let ft_name = vis.features[i];
            let angle = (Math.PI / 2) + (2 * Math.PI * i / vis.features.length);
            coordinates.push(vis.angleToCoordinate(angle, dataPoint[ft_name]));
        }
        return coordinates;
    }

    fieldToIconPath(field) {
        // Return the correct icon based on param
        switch(field){
            case "percent_oil_co2":
                return "static/icons/oil.png";
            case "percent_coal_co2":
                return "static/icons/coal.png";
            case "percent_gas_co2":
                return "static/icons/propane.png";
            case "percent_flaring_co2":
                return "static/icons/flaring.png";
            case "percent_cement_co2":
                return "static/icons/cement.png";
            case "percent_other_co2":
                return "static/icons/other-energy.png";
            default:
                throw new Error("Invalid field passed into radarVis.fieldToIconPath");
        }
    }

    drawAxes() {
        let vis = this;

        // Add the frame or "bullseye"
        let rings = vis.svg.selectAll(".radar-frame")
            .data(vis.ticks);

        // Handle updates and rendering for axis rings
        rings.enter()
            .append("circle")
            .attr("class", "radar-frame")
            .merge(rings)
            .attr("cx", vis.maxRadius)
            .attr("cy", vis.maxRadius)
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("r", (t) => vis.radialScale(t))

        // Remove when no longer necessary
        rings.exit().remove();

        // Segment the circles/add axis
        let axisLine = vis.svg.selectAll(".radar-axis")
            .data(vis.features);

        // Handle updates and rendering for axis lines
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

        // Remove when no longer necessary
        axisLine.exit().remove();

        // Add labels to the rings
        let ringLabels = vis.svg.selectAll(".radar-ring-labels")
            .data(vis.ticks);

        // Handle updates and rendering for labels
        ringLabels.enter()
            .append("text")
            .attr("class", "radar-frame")
            .merge(ringLabels)
            .attr("x", vis.maxRadius + 5) // offset slightly
            .attr("y", (t) => vis.maxRadius - vis.radialScale(t))
            .text((t) => t.toString() + "%")

        // Remove when no longer necessary
        ringLabels.exit().remove();

        // Add Axis Icon Labels
        let axisIcons = vis.svg.selectAll(".radar-icon-label")
            .data(vis.features);

        // Handle updates and rendering for icons
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

                // Slight adjustments to get the icon labels exactly where I want 'em
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

                // Figure out where exactly to place each icon
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
                // Show the tooltip with some info about the current icon
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
                // Hide the tooltip
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })

        // Remove when no longer necessary
        axisIcons.exit().remove();
    }

    drawBlobs() {
        let vis = this;

        // Bind data to the blobs
        let blobs = vis.svg.selectAll(".radar-blob")
            .data(vis.displayData, (d) => d );

        // Use helper function to generate blob path coordinates
        const coords = vis.displayData.map(d => {
            const theseCoords = vis.getPathCoordinates(d).map((coord) => {
                const { x, y } = coord;
                return [x, y];
            })
            return theseCoords;
        });

        // Handle updates and rendering
        blobs.enter()
            .append("path")
            .attr("class", (d) => "radar-blob radar-area " + d.iso_code)
            .merge(blobs)
            .attr("d", (d, i) => d3.line()(coords[i]))
            .attr("stroke-width", 3)
            .attr("stroke",  function(d, i) {console.log(d.iso_code ); if (d.iso_code == 'USA' || d.iso_code == '') {return vis.colors[d.iso_code] } else {return vis.colors["Selected_country"]}})
            .attr("fill", function(d, i) {console.log(d.iso_code ); if (d.iso_code == 'USA' || d.iso_code == '') {return vis.colors[d.iso_code] } else {return vis.colors["Selected_country"]}})
            .attr("stroke-opacity", 1)
            .attr("opacity", 0.5)
            .on('mouseover', function(event, d){
                // Add a slight hover effect to the selected blob
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr("stroke", 'red');

                // Show tooltip
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                            <h3>${ d.country }</h3>
                            <h4>
                               <img src="static/icons/coal.png" height="24" width="24" alt="coal">
                               <strong>Coal:</strong> ${ Math.round(d.percent_coal_co2 * 100) / 100 }%
                            </h4>
                            <h4>
                               <img src="static/icons/oil.png" height="24" width="24" alt="coal">
                               <strong>Oil:</strong> ${ Math.round(d.percent_oil_co2 * 100) / 100 }%
                            </h4>
                            <h4>
                               <img src="static/icons/propane.png" height="24" width="24" alt="coal">
                               <strong>Gas:</strong> ${ Math.round(d.percent_gas_co2 * 100) / 100 }%
                            </h4>
                            <h4>
                               <img src="static/icons/cement.png" height="24" width="24" alt="coal">
                               <strong>Cement:</strong> ${ Math.round(d.percent_cement_co2 * 100) / 100 }%
                            </h4>
                            <h4>
                               <img src="static/icons/flaring.png" height="24" width="24" alt="coal">
                               <strong>Flaring:</strong> ${ Math.round(d.percent_flaring_co2 * 100) / 100 }%
                            </h4>
                            <h4>
                               <img src="static/icons/other-energy.png" height="24" width="24" alt="coal">
                               <strong>Other:</strong> ${ Math.round(d.percent_other_co2 * 100) / 100 }%
                            </h4>
                        </div>`
                    );
            })
            .on('mouseout', function(event, d){
                // Hide tooltip
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'black');
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })

        // Remove when no longer necessary
        blobs.exit().remove();
    }

    updateRadarTitle() {
        // Display slightly different titles depending on selected Country
        if (selectedCountry == "United States") {
            document.getElementById('radarTitle').innerHTML =
                `<div>Production CO2 emissions breakdown for 
                    <strong class="usa_class px-3">${selectedCountry}</strong> and the <strong class="world_class px-3">World</strong> in ${selectedYear}</div>`;
        } else {
            document.getElementById('radarTitle').innerHTML =
                `<div>Production CO2 emissions breakdown for 
                    <strong class="usa_class px-3">United States</strong>, <strong class="world_class px-3">World</strong> and 
                    <span id="selected-country-name" class="selected_country_class px-3"> ${selectedCountry}</span>
                     in ${selectedYear}</div>`;
        }
    }
}