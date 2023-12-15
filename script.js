"use strict"

let educationPercentageLimits;
let countiesGeojson;
let nationGeojson;
let stateGeojson;
let colorScale;
let container;
let tooltip;
let dataset;
let geodata;
let legend;
let svg;

const externalGeoDataURL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const externalDataURL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const colorsLimits = [0, 255];
const tooltipDistance = 10;
const legendTileSize = 40;
const path = d3.geoPath();
const borderOffset = 5;
const height = 600;
const width = 900;
const colorR = 50;
const colorB = 150;


function Main()
{
    GetElements();
    CreateSVG();
    
    d3.json(externalDataURL)
        .then((data) => {
            FilterData(data);
            d3.json(externalGeoDataURL)
                .then((data) => {
                    FilterGeoData(data);
                    DrawCountry();
                    CreateLegend();
                    DrawGraph();
                })
                .catch((error) => console.log("Couldn't Fetch GeoData: ", error));
        })
        .catch((error) => console.log("Couldn't Fetch Data: ", error));
};


function GetElements()
{
    container = document.getElementById("container");
    tooltip = document.getElementById("tooltip");
};


function CreateSVG()
{
    svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height);
};


function DrawCountry()
{    
    const path = d3.geoPath();

    // draw the country outline
    svg.append("g")
        .selectAll("path")
        .data(nationGeojson.features)
        .enter()
        .append("path")
        .attr("fill", "red")
        .attr("d", path);


    // draw the states
    svg.append("g")
        .selectAll(".state")
        .data(stateGeojson.features)
        .enter()
        .append("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", "white");


    // draw the counties
    svg.append("g")
        .selectAll(".county")
        .data(countiesGeojson.features)
        .enter()
        .append("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("data-fips", d => d.id)
        .attr("data-education", d => {
            const currentCounty = dataset.find((item) => {return item["fips"] == d.id})
            return currentCounty.bachelorsOrHigher
        })
        .attr("fill", d => SetColor(d.id))
        .on("mouseover", (event) => ToggleTooltip(event))
        .on("mouseout", (event) => ToggleTooltip(event));
};


function SetColor(currentId)
{
    const foundItem = dataset.find((item) => {return item["fips"] == currentId});
    const percentage = foundItem.bachelorsOrHigher;
    colorScale = d3.scaleLinear()
        .domain(educationPercentageLimits)
        .range(colorsLimits)
    const newColor = `rgb(${colorR}, ${colorScale(percentage)}, ${colorB})`;
    return newColor;
};


function CreateLegend()
{
    const legendColor = [10, 30, 50, 70];

    legend = document.getElementById("legend");
    
    d3.select("#legend")
        .selectAll("rect")
        .data(legendColor)
        .enter()
        .append("rect")
            .attr("x", (_, i) => (borderOffset + legendTileSize) * (i + 1))
            .attr("y", borderOffset)
            .attr("width", legendTileSize)
            .attr("height", legendTileSize)
            .attr("fill", d => `rgb(${colorR}, ${colorScale(d)}, ${colorB})`)
            .attr("class", "legend-item")
            .attr("data-legend", d => `${d}%`)
            .on("mouseover", (event) => ToggleTooltip(event))
            .on("mouseout", (event) => ToggleTooltip(event));
};


function FilterData(data)
{
    dataset = data;

    educationPercentageLimits = d3.extent(dataset, d => d.bachelorsOrHigher);
};


function FilterGeoData(geo)
{
    geodata = geo;

    nationGeojson = topojson.feature(geodata, geodata.objects.nation);
    stateGeojson = topojson.feature(geodata, geodata.objects.states);
    countiesGeojson = topojson.feature(geodata, geodata.objects.counties);
}


function DrawGraph()
{
    container.append(svg.node());
};


function ToggleTooltip(event)
{
    tooltip.style.top = event.pageY + tooltipDistance + "px";
    tooltip.style.left = event.pageX + tooltipDistance + "px";

    let newText;

    if(event.target.classList[0] == "county")
    {
        tooltip.style.width = "100px";
        tooltip.dataset.education = event.target.dataset.education;

        let currentItem = dataset.find(d => d.fips == event.target.dataset.fips);
        
        newText = `
            ${currentItem.area_name}, 
            ${currentItem.state}, 
                Education: ${tooltip.dataset.education} %
        `;
    }
    else if(event.target.classList[0] == "legend-item")
    {
        tooltip.style.width = "300px";
        tooltip.style.top = event.pageY - 10 * tooltipDistance + "px";
        newText = `${event.target.dataset.legend} of population in the area with color up to this hue have a bachelor degree or higher`;
    }    

    tooltip.textContent = newText;

    (tooltip.style.visibility != "visible") ? 
        tooltip.style.visibility = "visible" : 
        tooltip.style.visibility = "hidden";
};


Main();
