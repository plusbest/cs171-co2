/* * * * * * * * * * * * * *
*         HeatMapVis       *
* * * * * * * * * * * * * */


class MainPointVis {

    // constructor method to initialize Timeline object
    constructor(parentElement, co2Data, excludedCountries) {
        this.parentElement = parentElement;
        this.co2Data = co2Data;
        this.excludedCountries = excludedCountries;
        this.displayData = [];
        this.sortedData = [];

        this.duration = 1500; // transition duration
        this.delay = 500;
        this.selectedCategory = "percapita";
        this.sortNum = 75;
        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
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


        // call next method in pipeline
        this.wrangleData();
    }

    // wrangleData method
    wrangleData() {
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
        let valueToStore = 0;
        let valueType = '';
        for (let i = 0; i < vis.co2Data.length; i++) {
            if (vis.co2Data[i].year == 2019 && vis.co2Data[i].consumption_co2_per_capita != '' && !vis.excludedCountries.includes(vis.co2Data[i].country)) {
                if (vis.selectedCategory == "percapita") {
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

        vis.displayData.sort(function (current, next) {
            return next.value - current.value;
        });


        vis.sortedData = vis.displayData.slice(0, vis.sortNum);

        vis.maxVal = vis.sortedData[0].value;
        vis.minVal = vis.sortedData[vis.sortedData.length - 1].value;

        // Read data
        /*
        vis.color.domain([
            d3.min(vis.sortedData, function(d) { return d.value; }),
            d3.max(vis.sortedData, function(d) { return d.value; })
        ]);

         */
        for (let i = 0; i < vis.sortedData.length; i++) {
            vis.sortedData[i].rank = i + 1;
        }

        vis.restOfData = vis.displayData.slice(vis.sortNum, vis.displayData.length);
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


        vis.updateVis();

    }

    // updateVis method
    updateVis() {
        let vis = this;
        // append the svg object to the body of the page

        vis.svg.append("text")
            .text("USA Summary:")
            .attr("x", 10)
            .attr("y",10);

        vis.svg.append("text")
            .text("Per capita CO2 Consumption: Rank 10 (50% more than global average)")
            .attr("x", 30)
            .attr("y",30);


        vis.svg.append("text")
            .text("Per country CO2 Consumption: Rank 2 (33% share of global emissions)")
            .attr("x", 30)
            .attr("y",50);

        
    }
}
