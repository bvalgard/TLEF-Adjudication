// todo: 
// make sliders instead of inputs
// When click a bar add it to the selected applicants list if select again, remove from applicants list

// Input and display elements
const greaterThanValueInput = document.getElementById('minValue');
const lessThanValueInput = document.getElementById('maxValue');
const xMaxInput = document.getElementById('xMaxInput');
const currentPages = document.getElementById('currentPages');
const nameListDiv = document.getElementById('nameList');
const requestedFundingInput = document.getElementById('requestedFunds');
const selectedApplicantsLabel = document.getElementById('requestedFunds-label');
const requestedOutput = document.getElementById('displayRequested');
const collegesOutput = document.getElementById('displayColleges');
const facultiesOutput = document.getElementById('displayFaculty');
const compareOne = document.getElementById('pageOne');
const compareTwo = document.getElementById('pageTwo');
const compareThree = document.getElementById('pageThree');
const compareButton = document.getElementById('compareButton');

// defaults
const defaultXMax = 3;

// Event listener for the Compare button
compareButton.addEventListener('click', () => {
    loadCSVData();
});

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// Don't love this. if I put 2.5 it rerenders for 2 . and 5. I should change this to a slider
// or a button to rerender
xMaxInput.addEventListener('input', () => loadCSVData());

let originalData = []; // Full dataset with all fields
let myChart; // Main chart instance
let comparisonChart; // Comparison chart instance

// Custom plugin for error bars (whiskers)
const horizontalErrorBarPlugin = {
    id: 'errorBars',
    afterDatasetsDraw(chart) {
        const { ctx, scales } = chart;
        const xScale = scales.x;
        const yScale = scales.y;

        const dataset = chart.data.datasets[0];
        const labels = chart.data.labels;

        if (!window.pageInfo) return;

        ctx.save();
        ctx.strokeStyle = '#8E918F';
        ctx.lineWidth = 2;

        labels.forEach((page, index) => {
            const info = window.pageInfo[page]; // Ensure this matches the sorted labels
            if (!info) return;
            const meanValue = dataset.data[index];
            const minVal = info.min;
            const maxVal = info.max;

            const yPos = yScale.getPixelForValue(page); // Corrected alignment
            const meanX = xScale.getPixelForValue(meanValue);
            const minX = xScale.getPixelForValue(minVal);
            const maxX = xScale.getPixelForValue(maxVal);

            // Draw line from minX to maxX
            ctx.beginPath();
            ctx.moveTo(minX, yPos);
            ctx.lineTo(maxX, yPos);
            ctx.stroke();

            // Draw caps
            const capSize = 5;
            ctx.beginPath();
            ctx.moveTo(minX, yPos - capSize);
            ctx.lineTo(minX, yPos + capSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(maxX, yPos - capSize);
            ctx.lineTo(maxX, yPos + capSize);
            ctx.stroke();
        });

        ctx.restore();
    },
};

// todo: refactor pass in what type of bar chart instead of duplicating all this code!
const ErrorBarPlugin = {
    id: 'errorBars',
    afterDatasetsDraw(chart) {
        const { ctx, scales } = chart;
        const xScale = scales.x; // X-axis for bar positions
        const yScale = scales.y; // Y-axis for data values

        const dataset = chart.data.datasets[0];
        const labels = chart.data.labels;

        if (!window.pageInfo) return;

        ctx.save();
        ctx.strokeStyle = '#8E918F'; // Error bar color
        ctx.lineWidth = 2; // Error bar line width

        labels.forEach((label, index) => {
            const info = window.pageInfo[label]; // Get min/max/mean for the label
            if (!info) return;
            const meanValue = dataset.data[index];
            const minVal = info.min;
            const maxVal = info.max;

            const xPos = xScale.getPixelForValue(label); // Bar's x-position
            const meanY = yScale.getPixelForValue(meanValue); // Mean y-position
            const minY = yScale.getPixelForValue(minVal); // Min y-position
            const maxY = yScale.getPixelForValue(maxVal); // Max y-position

            // Draw vertical line from minY to maxY
            ctx.beginPath();
            ctx.moveTo(xPos, minY);
            ctx.lineTo(xPos, maxY);
            ctx.stroke();

            // Draw caps at min and max
            const capSize = 5; // Width of the cap
            ctx.beginPath();
            ctx.moveTo(xPos - capSize, minY);
            ctx.lineTo(xPos + capSize, minY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(xPos - capSize, maxY);
            ctx.lineTo(xPos + capSize, maxY);
            ctx.stroke();
        });

        ctx.restore();
    },
};


// todo: this should work for both horizontal and vertical bar charts no need for above
const unifiedErrorBarPlugin = {
    id: 'unifiedErrorBarPlugin',
    afterDatasetsDraw(chart, args, options) {
      const { ctx, chartArea, scales } = chart;
      const xScale = scales.x;
      const yScale = scales.y;
      const isHorizontal = chart.config.options.indexAxis === 'y';
  
      // We’ll assume each dataset has a parallel array of originalData objects
      // that contain mean, min, max. For vertical charts, we draw vertical error bars;
      // for horizontal charts, we draw horizontal error bars.
  
      ctx.save();
      ctx.strokeStyle = options?.strokeStyle || '#8E918F';
      ctx.lineWidth = options?.lineWidth || 2;
  
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
  
        // Ensure the dataset has originalData with min/max for each point
        if (!dataset.originalData) return;
  
        meta.data.forEach((barElement, i) => {
          if (!barElement) return;
  
          const dataPoint = dataset.originalData[i];
          if (!dataPoint || dataPoint.min === undefined || dataPoint.max === undefined) return;
  
          const meanVal = dataPoint.mean;
          const minVal = dataPoint.min;
          const maxVal = dataPoint.max;
  
          if (isHorizontal) {
            // Horizontal error bars
            const yPos = barElement.y; // Bar center in y-direction
            const meanX = xScale.getPixelForValue(meanVal);
            const minX = xScale.getPixelForValue(minVal);
            const maxX = xScale.getPixelForValue(maxVal);
  
            // Draw line
            ctx.beginPath();
            ctx.moveTo(minX, yPos);
            ctx.lineTo(maxX, yPos);
            ctx.stroke();
  
            // Draw caps
            const capSize = 5;
            ctx.beginPath();
            ctx.moveTo(minX, yPos - capSize);
            ctx.lineTo(minX, yPos + capSize);
            ctx.stroke();
  
            ctx.beginPath();
            ctx.moveTo(maxX, yPos - capSize);
            ctx.lineTo(maxX, yPos + capSize);
            ctx.stroke();
  
          } else {
            // Vertical error bars
            const xPos = barElement.x; // Bar center in x-direction
            const meanY = yScale.getPixelForValue(meanVal);
            const minY = yScale.getPixelForValue(minVal);
            const maxY = yScale.getPixelForValue(maxVal);
  
            ctx.beginPath();
            ctx.moveTo(xPos, minY);
            ctx.lineTo(xPos, maxY);
            ctx.stroke();
  
            const capSize = 5;
            // Min cap
            ctx.beginPath();
            ctx.moveTo(xPos - capSize, minY);
            ctx.lineTo(xPos + capSize, minY);
            ctx.stroke();
  
            // Max cap
            ctx.beginPath();
            ctx.moveTo(xPos - capSize, maxY);
            ctx.lineTo(xPos + capSize, maxY);
            ctx.stroke();
          }
        });
      });
  
      ctx.restore();
    }
  };
  
// Event listeners for min/max value inputs & requested funding
greaterThanValueInput.addEventListener('input', applyFilters);
lessThanValueInput.addEventListener('input', applyFilters);
requestedFundingInput.addEventListener('input', () => {
    const requestedApplicants = requestedFundingInput.value.split(",").map(Number);
    const requestedApplicantsLen = requestedApplicants.length
    const selectedApplicantsData = metaData.filter(item => requestedApplicants.includes(item.page));
    const { totalRequested, facultyCount, collegeCount } = fundingFacultyCollege(selectedApplicantsData); 

    requestedOutput.textContent = `$${numberWithCommas(totalRequested)}`;

    // Clear previous results
    collegesOutput.innerHTML = '';
    facultiesOutput.innerHTML = '';

    // Display updated college counts
    const collegeKeys = Object.keys(collegeCount);
    const collegeLabels = Object.values(collegeCount);
    for (let i = 0; i < collegeKeys.length; i++) {
        const p = document.createElement('p');
        p.textContent = `${collegeKeys[i]}: ${collegeLabels[i]}`;
        collegesOutput.appendChild(p);
    }

    // Display updated faculty counts
    const facKeys = Object.keys(facultyCount);
    const facLabels = Object.values(facultyCount);
    for (let i = 0; i < facKeys.length; i++) {
        const p = document.createElement('p');
        p.textContent = `${facKeys[i]}: ${facLabels[i]}`;
        facultiesOutput.appendChild(p);
    }

    selectedApplicantsLabel.textContent = `${requestedApplicantsLen} Selected Applicants`
    

});

const fundingFacultyCollege = (filteredData) => {
    const result = filteredData.reduce(
        (acc, item) => {
            acc.totalRequested += item.requested;

            if (item.faculty in acc.facultyCount) {
                acc.facultyCount[item.faculty]++;
            } else {
                acc.facultyCount[item.faculty] = 1;
            }
            // return acc;


            if (item.college in acc.collegeCount) {
                acc.collegeCount[item.college]++;
            } else {
                acc.collegeCount[item.college] = 1;
            }
            return acc;
        },
        {
            totalRequested: 0,
            facultyCount: {},
            collegeCount: {}
        }
    );
    return result; // Return the accumulator object
};

// Function to sort myChart in descending order
function sortChartDescending(chart) {
    const combinedData = chart.data.labels.map((label, index) => ({
        label: label,
        value: chart.data.datasets[0].data[index],
    }));

    combinedData.sort((a, b) => b.value - a.value);

    // Update the chart data
    chart.data.labels = combinedData.map(item => item.label);
    chart.data.datasets[0].data = combinedData.map(item => item.value);

    // Update pageInfo to match the sorted order
    const sortedPageInfo = {};
    combinedData.forEach(item => {
        const page = item.label;
        sortedPageInfo[page] = window.pageInfo[page]; // Retain min/max/mean for each page
    });
    window.pageInfo = sortedPageInfo;

    chart.update();
}

// Filter application function for main chart
function applyFilters() {
    if (!myChart || originalData.length === 0) return;

    const minValue = parseFloat(greaterThanValueInput.value) || 0;
    const maxValue = parseFloat(lessThanValueInput.value) || 3;

    // Filter data while keeping all fields accessible
    const meanOnlyData = originalData.filter(obj => obj.category === 'Mean');
    const filteredData = meanOnlyData.filter(item => item.mean > minValue && item.mean < maxValue);

    // Update the chart data
    const labels = filteredData.map(item => item.page); // Use page numbers as labels
    const data = filteredData.map(item => item.mean);  // Use mean values as data points

    myChart.data.labels = labels;
    myChart.data.datasets[0].data = data;

    // Sort the chart in descending order
    sortChartDescending(myChart);

    // Update the "Showing X of Y pages" text
    currentPages.textContent = `Showing ${filteredData.length} of ${meanOnlyData.length} applicants`;

    // Update the name list div in the order of the chart
    nameListDiv.innerHTML = "";
    const sortedData = myChart.data.labels.map(label => {
        return filteredData.find(item => item.page == label);
    });
    sortedData.forEach(item => {
        const p = document.createElement('p');
        p.textContent = `${item.page}: ${item.name}`; // Show page number and name
        nameListDiv.appendChild(p);
    });
}

// Path to the CSV file
const csvFilePath = "./score.csv";

// Load CSV data
function loadCSVData() {
    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        complete: function (results) {
            const data = results.data;
            processChartData(data);
        },
    });
}

// We'll create a global pageInfo object to store min/max for each page:
window.pageInfo = {}; // Will store { page: {min:..., max:..., mean:...}, ... }

// Process CSV data and render charts
function processChartData(data) {
    const pageMeans = {};
    const pageNames = {};
    const pageMins = {};
    const pageMaxs = {};

    originalData = []; // Reset the original data

    data.forEach(row => {
        const page = row.page;
        const name = row.name;
        const mean = parseFloat(row.mean);
        const min = parseFloat(row.min);
        const max = parseFloat(row.max)

        pageNames[page] = name;
        pageMeans[page] = mean;
        pageMins[page] = min;
        pageMaxs[page] = max;

        // Store the full row in originalData
        originalData.push({
            page: page,
            name: name,
            category: row.category,
            mean: mean,
            min: min,
            max: max,
            pageNum: parseInt(row.page_num)
        });
    });

    // Populate global pageInfo for error bars
    Object.keys(pageMeans).forEach(page => {
        window.pageInfo[page] = {
            mean: pageMeans[page],
            min: pageMins[page],
            max: pageMaxs[page] 
        };
    });

    // Prepare labels, values, and tooltips for the main chart
    const labels = Object.keys(pageMeans);
    const values = Object.values(pageMeans);
    const tooltips = labels.map(page => pageNames[page]);

    // Render the main chart
    renderChart(labels, values, tooltips);

    // Apply initial filters
    applyFilters();

    // Render comparison chart (if applicable)
    renderComparisonChart(originalData);
}

// Render the main chart
function renderChart(labels, data, tooltips) {
    const canvas = document.getElementById("myChart");
    const maxHeight = 1100; 
    canvas.style.maxHeight = `${maxHeight}px`;

    const ctx = document.getElementById("myChart").getContext("2d");

    // Destroy the previous chart instance if it exists
    if (myChart) {
        myChart.destroy();
    }

    // Get user-defined xMax or fallback to default
    const xMax = xMaxInput && xMaxInput.value ? parseFloat(xMaxInput.value) : defaultXMax;

    myChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Mean by Page",
                    data: data,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    titleFont: { size: 18 },
                    bodyFont: { size: 18 },
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            return `Mean: ${context.raw}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    min: 0,
                    max: xMax, // Use dynamic xMax
                    ticks: { font: { size: 20 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: 22 } }
                }
            },
        },
        plugins: [horizontalErrorBarPlugin]
    });

    // Sort the chart in descending order after rendering
    sortChartDescending(myChart);
}

// Render the comparison chart
function renderComparisonChart(data) {
    // Set max-height dynamically
    const canvas = document.getElementById("comparisonChart");
    const maxHeight = 400; // Example height in pixels
    canvas.style.maxHeight = `${maxHeight}px`;
    
    const chartOneNum = parseInt(compareOne.value);
    const chartTwoNum = parseInt(compareTwo.value);
    const chartThreeNum = parseInt(compareThree?.value);

    // Filter data for the selected pages
    const chartOneObjects = data.filter(obj => obj.pageNum === chartOneNum);
    const chartTwoObjects = data.filter(obj => obj.pageNum === chartTwoNum);
    const chartThreeObjects = chartThreeNum
        ? data.filter(obj => obj.pageNum === chartThreeNum)
        : [];

    const chartOneData = chartOneObjects.map(obj => obj.mean);
    const chartTwoData = chartTwoObjects.map(obj => obj.mean);
    const chartThreeData = chartThreeObjects.length > 0
        ? chartThreeObjects.map(obj => obj.mean)
        : null;

    const labels = [
        'Project Goals',
        'Strategic Alignment',
        'Expected Outcomes',
        'Impact Assessment',
        'Budget',
        'Mean',
    ];

    const ctx = document.getElementById("comparisonChart").getContext("2d");

    // Destroy old chart if exists
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    // Prepare datasets with originalData included
    const datasets = [
        {
            label: `Data for Page ${chartOneNum}`,
            data: chartOneData,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            // Attach the full objects that include mean, min, max
            originalData: chartOneObjects
        },
        {
            label: `Data for Page ${chartTwoNum}`,
            data: chartTwoData,
            backgroundColor: "rgba(192, 75, 192, 0.6)",
            borderColor: "rgba(192, 75, 192, 1)",
            borderWidth: 1,
            // Attach the full objects that include mean, min, max
            originalData: chartTwoObjects
        },
    ];

    if (chartThreeData) {
        datasets.push({
            label: `Data for Page ${chartThreeNum}`,
            data: chartThreeData,
            backgroundColor: "rgba(75, 75, 192, 0.6)",
            borderColor: "rgba(75, 75, 192, 1)",
            borderWidth: 1,
            // Attach the full objects that include mean, min, max
            originalData: chartThreeObjects
        });
    }

    // Render the chart with the unifiedErrorBarPlugin
    comparisonChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    titleFont: { size: 18 },
                    bodyFont: { size: 18 },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { font: { size: 20 } },
                },
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 20 } },
                },
            },
        },
        plugins: [unifiedErrorBarPlugin]
    });
}


// Load the initial CSV data
loadCSVData();


const metaData = [
    {
        page: 3,
        faculty: 'Faculty of Medicine and Dentistry',
        college: 'College of Health Sciences',
        level: 'u',
        requested: 7_000,
        eligible: 7_000
    },
    {
        page: 4,
        faculty: 'Faculty of Engineering',
        college: 'College of Natural & Applied Sciences',
        level: 'u',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 5,
        faculty: 'Faculty of Engineering',
        college: 'College of Natural & Applied Sciences',
        level: 'b',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 6,
        faculty: 'Faculty of Law',
        college: 'College of Social Sciences & Humanities',
        level: 'b',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 7,
        faculty: 'Faculty of Science',
        college: 'College of Natural & Applied Sciences',
        level: 'u',
        requested: 24_000,
        eligible: 24_000
    },
    {
        page: 8,
        faculty: 'Faculty of Arts',
        college: 'College of Social Sciences & Humanities',
        level: 'u',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 9,
        faculty: 'Faculty of Arts',
        college: 'College of Social Sciences & Humanities',
        level: 'u',
        requested: 13_680,
        eligible: 13_680
    },
    {
        page: 10,
        faculty: 'Faculty of Medicine and Dentistry',
        college: 'College of Health Sciences',
        level: 'g',
        requested: 6_000,
        eligible: 4_500
    },
    {
        page: 11,
        faculty: 'Faculty of Medicine and Dentistry',
        college: 'College of Health Sciences',
        level: 'g',
        requested: 23_225,
        eligible: 23_225
    },
    {
        page: 12,
        faculty: 'Faculty of Rehabilitation Medicine',
        college: 'College of Health Sciences',
        level: 'g',
        requested: 6_275,
        eligible: 6_275
    },
    {
        page: 13,
        faculty: 'Library and Museums',
        college: 'Digital Archives',
        level: 'b',
        requested: 24_848,
        eligible: 21_848
    },
    {
        page: 14,
        faculty: 'Faculty of Medicine and Dentistry',
        college: 'College of Health Sciences',
        level: 'u',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 15,
        faculty: 'Faculty of Science',
        college: 'College of Natural & Applied Sciences',
        level: 'u',
        requested: 20_000,
        eligible: 16_000
    },
    {
        page: 16,
        faculty: 'Faculty of Engineering',
        college: 'College of Natural & Applied Sciences',
        level: 'u',
        requested: 27_000,
        eligible: 25_000
    },
    {
        page: 17,
        faculty: 'Faculty of Medicine and Dentistry',
        college: 'College of Health Sciences',
        level: 'g',
        requested: 20_000,
        eligible: 19_000
    },
    {
        page: 18,
        faculty: 'Faculty of Arts',
        college: 'College of Social Sciences & Humanities',
        level: 'b',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 19,
        faculty: 'Faculty of Arts',
        college: 'College of Social Sciences & Humanities',
        level: 'b',
        requested: 23_780,
        eligible: 21_780
    },
    {
        page: 20,
        faculty: 'Faculty of Agricultural, Life & Environmental Science',
        college: 'College of Natural & Applied Sciences',
        level: 'u',
        requested: 24_189,
        eligible: 24_189
    },
    {
        page: 21,
        faculty: 'Faculty of Nursing',
        college: 'College of Health Sciences',
        level: 'u',
        requested: 25_000,
        eligible: 23_533
    },
    {
        page: 22,
        faculty: 'Faculty of Science',
        college: 'College of Natural & Applied Sciences',
        level: 'b',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 23,
        faculty: 'School of Public Health',
        college: 'College of Health Sciences',
        level: 'g',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 24,
        faculty: 'Faculty of Education',
        college: 'College of Social Sciences & Humanities',
        level: 'b',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 25,
        faculty: 'Faculty of Native Studies',
        college: 'Faculty of Native Studies',
        level: 'u',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 26,
        faculty: 'Faculty of Medicine and Dentistry',
        college: 'College of Health Sciences',
        level: 'b',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 27,
        faculty: 'Faculty of Medicine and Dentistry',
        college: 'College of Health Sciences',
        level: 'u',
        requested: 4_470,
        eligible: 4_470
    },
    {
        page: 28,
        faculty: 'Faculty of Agricultural, Life & Environmental Science',
        college: 'College of Natural & Applied Sciences',
        level: 'u',
        requested: 24_647,
        eligible: 24_647
    },
    {
        page: 29,
        faculty: 'Faculty of Agricultural, Life & Environmental Science',
        college: 'College of Natural & Applied Sciences',
        level: 'u',
        requested: 16_577,
        eligible: 16_577
    },
    {
        page: 30,
        faculty: 'Faculty of Rehabilitation Medicine',
        college: 'College of Health Sciences',
        level: 'u',
        requested: 25_000,
        eligible: 25_000
    },
    {
        page: 31,
        faculty: 'Faculty of Engineering',
        college: 'College of Natural & Applied Sciences',
        level: 'u',
        requested: 24_694,
        eligible: 24_694
    }
];