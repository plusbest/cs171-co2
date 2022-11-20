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
        this.selectedCountryCode = selectedCountryCode; // Global variable that stores default

        this.initVis()
    }


    initVis() {
        let vis = this;

        // set margins
        vis.margin = {top: 30, right: 50, bottom: 15, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // TODO: Fix the alignment on larger screens
        const halfWidth = vis.width / 2;
        const halfHeight = vis.height / 2;
        vis.radarSize = vis.width > 600 ? halfHeight : halfWidth;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.radialScale = d3.scaleLinear()
            .domain([0,100])
            .range([0, vis.radarSize]);

        vis.ticks = [20,40,60,80,100];



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

        // Filter out all countries but the US & selected country
        let filteredData = this.co2Data.filter((row) => {
            console.log("row", row);
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
                iso_code === vis.selectedCountryCode) // Update to use selected country variable in future
                && year === "2020"
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
                percent_other_co2: leftoverCO2 / 10 > 0 ? leftoverCO2 / 10 : 0
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

        console.log("vis.filteredData", filteredData);
        console.log("vis.displayData", vis.displayData);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.ticks.forEach(t =>
            vis.svg.append("circle")
                .attr("cx", vis.radarSize)
                .attr("cy", vis.radarSize)
                .attr("fill", "none")
                .attr("stroke", "gray")
                .attr("r", vis.radialScale(t))
        );

        vis.ticks.forEach(t =>
            vis.svg.append("text")
                .attr("x", vis.radarSize + 5) // offset slightly
                .attr("y", vis.radarSize - vis.radialScale(t))
                .text(t.toString())
        );

        for (let i = 0; i < vis.features.length; i++) {
            let ft_name = vis.features[i];
            let angle = (Math.PI / 2) + (2 * Math.PI * i / vis.features.length);
            let line_coordinate = vis.angleToCoordinate(angle, 100);
            let label_coordinate = vis.angleToCoordinate(angle, 100.5);

            //draw axis line
            vis.svg.append("line")
                .attr("x1", vis.radarSize)
                .attr("y1", vis.radarSize)
                .attr("x2", line_coordinate.x)
                .attr("y2", line_coordinate.y)
                .attr("stroke","black");

            //draw axis label
            vis.svg.append("text")
                .attr("x", label_coordinate.x)
                .attr("y", label_coordinate.y)
                .text(ft_name);


        }

        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y);

        // Remove any pre-existing
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
                .attr("d", line)
                .attr("stroke-width", 3)
                .attr("stroke", color)
                .attr("fill", color)
                .attr("stroke-opacity", 1)
                .attr("opacity", 0.5);
        }
    }


    angleToCoordinate(angle, value){
        let vis = this;

        let x = Math.cos(angle) * vis.radialScale(value);
        let y = Math.sin(angle) * vis.radialScale(value);
        return {"x": vis.radarSize + x, "y": vis.radarSize - y};
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
}