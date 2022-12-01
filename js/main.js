/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables & switches
let
    myHeatMapVis,
    mySankeyVis,
    myBumpChart,
    myMapVis,
    myRadarVis,
    isPlaying = false;

let selectedTimeRange = [];
let selectedYear = 2019;

let beginCO2ConsumptionYear = 1990;
let endCO2ConsumptionYear = 2019;

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
    d3.csv("data/owid-co2-data.csv"), // heatmap
    d3.csv("data/owid-co2-data.csv"), // world map - mapVis

    d3.csv("data/owid-co2-data.csv"), // sankey
    d3.csv("data/owid-co2-data.csv"), // gauge vis

    d3.csv("data/owid-co2-data.csv"), // bumpchart
    d3.csv("data/owid-co2-data.csv"), // radarchart

    // separate promises to workaround the shallow copy bug
    // change of co2 data in 1 viz impacts others with default shallow

    excludedCountries, // to exclude continents from heatmap Viz

    d3.json("data/world_2.json"),
    //https://gist.github.com/whatsthebeef/6361969#file-world-json

    d3.csv("data/all.csv"),
    // Reference: https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes

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
    console.log('hi team :)');

    // Build a map of iso codes to countries
    dataArray[0].forEach((row) => {
        if (!isoCodeToCountryNameMap[row.iso_code]) {
            isoCodeToCountryNameMap[row.iso_code] = row.country;
        }
    });



    myHeatMapVis = new HeatMapVis('heatMapDiv', dataArray[0], dataArray[6], dataArray[8]);

    myMapVis = new MapVis('mapDiv', dataArray[1], dataArray[6], dataArray[7], dataArray[8]);

    mySankeyVis = new SankeyVis('sankeyDiv', dataArray[2],selectedCountryCode,selectedYear);


    // to init Sankey to show USA data as default

    mySankeyVis.selectedYear = selectedYear;
    mySankeyVis.country_iso_code = selectedCountryCode;
    mySankeyVis.wrangleData();



    myGaugeVis = new GaugeVis('gaugeVis', dataArray[3]);
    myGaugeVis.wrangleData(); // Initialize Gauge with full checkbox params



    myBumpChart = new BumpChartVis('bumpChartDiv', dataArray[4]);

    myRadarVis = new RadarVis('radarDiv', dataArray[5]);


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



// Listen for change on checkbox group
let radio = d3.select('#btnGroup')
radio.on("input", handleRadio)



// Returns checkbox
function handleRadio() {

  var checkboxes = d3.selectAll(".co2-box");
  var checkboxList = []

  checkboxes.each(function() {
    dict = {}
    dict[this.value] = this.checked === true ? true : false;
    checkboxList.push(dict);
  })

  myGaugeVis.checkBoxes = checkboxList;
  myGaugeVis.wrangleData();

  console.log("JW --- checkBoxData", checkboxList);
}

// Handle change on year slider
function yearSliderChange(selectedYear) {
    document.getElementById('yearSlider').value = selectedYear;
    document.getElementById('yearSliderLabel').innerHTML = 'Selected Year: <b>'+ selectedYear + '</b>';

    mySankeyVis.selectedYear = selectedYear;
    mySankeyVis.wrangleData();

    myHeatMapVis.selectedYear = selectedYear;
    console.log(selectedYear);
    myHeatMapVis.wrangleData();

    myMapVis.selectedYear = selectedYear;
    console.log(selectedYear);
    myMapVis.wrangleData();

    myGaugeVis.selectedYear = selectedYear;
    myGaugeVis.wrangleData();



}


function updateStatBlock(){
    d3.select("#selected-country-name").text(selectedCountry);
    if (selectedCountry === "China" && selectedCountryCode === "CHN") {
        d3.select("#us-rank-compared-to-selected").text("LOWER");
        d3.select("#mainpoint-suffix").html(`
             than <span id="selected-country-name" class="px-3 py-1 bg-warning fs-5">${selectedCountry}</span> in global consumption emissions.
        `);
    } else if (selectedCountry === "United States" && selectedCountryCode === "USA") {
        d3.select("#us-rank-compared-to-selected").text("#2 in the world");
        d3.select("#mainpoint-suffix").html(`in global consumption emissions.`);
    } else {
        d3.select("#us-rank-compared-to-selected").text("HIGHER");
        d3.select("#mainpoint-suffix").html(`
             than <span id="selected-country-name" class="px-3 py-1 bg-warning fs-5">${selectedCountry}</span> in global consumption emissions.
        `);
    }
}

// Reference: https://www.sitepoint.com/delay-sleep-pause-wait/
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle the play button click
// Reference: https://stackoverflow.com/questions/38525633/disable-a-button-using-d3-jquery-until-the-action-is-complete
async function playAllYears() {
    // If this is playing, do nothing.
    if (isPlaying) return;
    console.log("play clicked");
    isPlaying = true;

    for(let i=beginCO2ConsumptionYear; i<=endCO2ConsumptionYear; i++) {
        yearSliderChange(i);
        await sleep(4000);



    }
    isPlaying = false;

}