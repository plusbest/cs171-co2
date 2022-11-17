/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables & switches
let
    myHeatMapVis,
    mySankeyVis,
    myBumpChart,
    myMainPointVis;

let selectedTimeRange = [];
let selectedState = '';



let excludedCountries = [
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
let promises = [
    d3.csv("data/owid-co2-data.csv"),
    d3.csv("data/owid-energy-data.csv"),
    d3.csv("data/sankey.csv"),   // sankey test data
    excludedCountries, // to exclude continents from heatmap Viz
    d3.csv("data/owid-co2-data.csv"),
    d3.csv("data/owid-co2-data.csv"),
    //separate promises to workaround the shallow copy bug
    // - change of co2 data in 1 viz impacts others with default shallow
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")




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


    // init map

    mySankeyVis = new SankeyVis('sankeyDiv', dataArray[5], dataArray[1], dataArray[2]);

    myMainPointVis = new MainPointVis('mainPointDiv', dataArray[0], dataArray[3]);

    myBumpChart = new BumpChartVis('bumpChartDiv', dataArray[4], dataArray[1]);

    myHeatMapVis = new HeatMapVis('heatMapDiv', dataArray[0], dataArray[3]);

    myMapVis = new MapVis('mapDiv', dataArray[0], dataArray[3], dataArray[6]);

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
}


function yearChange() {

    selectedYear =  document.getElementById('yearSelector').value;

    mySankeyVis.selectedYear = selectedYear;
    mySankeyVis.wrangleData();
}