/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables & switches
let myDataTable,
    myMapVis,
    myBarVisOne,
    myBarVisTwo,
    myBrushVis;

let selectedTimeRange = [];
let selectedState = '';


// load data using promises
let promises = [
    d3.csv("data/owid-co2-data.csv"),
    d3.csv("data/owid-energy-data.csv")
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
    console.log('hi team :)')

    // init map
    mySankeyVis = new SankeyVis('sankeyDiv', dataArray[0], dataArray[1], dataArray[2]);
    myHeatMapVis = new HeatMapVis('heatMapDiv', dataArray[0], dataArray[1], dataArray[2]);
    myBumpChart = new BumpChartVis('bumpChartDiv', dataArray[0], dataArray[1], dataArray[2]);
}

// NOTE: for opening CORS disabled Chrome browser window
// open -a Google\ Chrome --args --disable-web-security --user-data-dir --allow-file-access-from-files