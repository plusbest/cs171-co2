/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables & switches
let
    myHeatMapVis,
    mySankeyVis,
    myBumpChart,
    myMainPointVis,
    myMapVis,
    myRadarVis;

// TODO: See if these can be used? Perhaps for shared brushing data between sankey and heatmap/globe?
let selectedTimeRange = [];
let selectedYear = 2019;

// TODO: update all visualizations to use global vars
let selectedCountryCode = "USA";
let selectedCountry = "United States";

// Keep track of mappings for easier updating of selectedCountryCode
const isoCodeToCountryNameMap = { };


const excludedCountries = [
    "Asia",
    "Asia (excl. China & India)",
    "Europe",
    "Europe (excl. EU-27)",
    "Europe (excl. EU-28)",
    "European Union (27)",
    "European Union (28)",
    "High-income countries",
    "Low-income countries",
    "Lower-middle-income countries",
    "North America",
    "North America (excl. USA)",
    "Upper-middle-income countries",
    "South America",
    "Africa",
    "Oceania",
    "World"
];

// load data using promises
const promises = [
    d3.csv("data/owid-co2-data.csv"),
    d3.csv("data/owid-energy-data.csv"),
    d3.csv("data/sankey.csv"),   // sankey test data
    excludedCountries, // to exclude continents from heatmap Viz
    d3.csv("data/owid-co2-data.csv"),
    d3.csv("data/owid-co2-data.csv"),
    //separate promises to workaround the shallow copy bug
    // - change of co2 data in 1 viz impacts others with default shallow
    d3.json("data/world_2.json"),
    //https://gist.github.com/whatsthebeef/6361969#file-world-json
    //d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
    d3.csv("data/all.csv"),
    // Reference: https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes
    d3.csv("data/owid-co2-data.csv")
];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

// initMainPage
function initMainPage(dataArray) {

    // log data
    console.log('co2 data:', dataArray[0]);
    console.log('energy data:', dataArray[1]);
    console.log('hi team :)');

    // Build a map of iso codes to countries
    dataArray[0].forEach((row) => {
        if (!isoCodeToCountryNameMap[row.iso_code]) {
            isoCodeToCountryNameMap[row.iso_code] = row.country;
        }
    });

    // init map

    mySankeyVis = new SankeyVis('sankeyDiv', dataArray[5], dataArray[1], dataArray[2]);

    myBumpChart = new BumpChartVis('bumpChartDiv', dataArray[4], dataArray[1]);

    myHeatMapVis = new HeatMapVis('heatMapDiv', dataArray[0], dataArray[3], dataArray[7]);

    myMapVis = new MapVis('mapDiv', dataArray[8], dataArray[3], dataArray[6], dataArray[7]);

    myRadarVis = new RadarVis('radarDiv', dataArray[0]);

}



function categoryChange() {

    selectedCategory =  document.getElementById('categorySelector').value;
    console.log("on category change");
    console.log(selectedCategory);

    mySankeyVis.selectedCategory = selectedCategory;
    mySankeyVis.wrangleData();

    // update the heatmap
    myHeatMapVis.selectedCategory = selectedCategory;
    myHeatMapVis.wrangleData();

    //update the earth map
    myMapVis.selectedCategory = selectedCategory;
    myMapVis.wrangleData();

}

function yearSliderChange(selectedYear) {
    //selectedYear =  document.getElementById('yearSlider').value;

    document.getElementById('yearSliderLabel').innerText = 'You selected: ' + selectedYear + ' (between 1990 and 2019)';
    //yearSliderText.text("test");

    mySankeyVis.selectedYear = selectedYear;
    mySankeyVis.wrangleData();

    myHeatMapVis.selectedYear = selectedYear;
    console.log(selectedYear);
    myHeatMapVis.wrangleData();

    myMapVis.selectedYear = selectedYear;
    console.log(selectedYear);
    myMapVis.wrangleData();

}

function updateStatBlock(){
    d3.select("#selected-country-name").text(selectedCountry);
    if (selectedCountry === "China" && selectedCountryCode === "CHN") {
        d3.select("#us-rank-compared-to-selected").text("LOWER");
        d3.select("#mainpoint-suffix").html(`
             than <span id="selected-country-name">${selectedCountry}</span> in global emissions.
        `);
    } else if (selectedCountry === "United States" && selectedCountryCode === "USA") {
        d3.select("#us-rank-compared-to-selected").text("#2 in the world");
        d3.select("#mainpoint-suffix").html(`in global emissions.`);
    } else {
        d3.select("#us-rank-compared-to-selected").text("HIGHER");
        d3.select("#mainpoint-suffix").html(`
             than <span id="selected-country-name">${selectedCountry}</span> in global emissions.
        `);
    }
}
