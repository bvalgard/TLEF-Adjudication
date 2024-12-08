// Input and display elements
const minValueInput = document.getElementById('minValue');
const maxValueInput = document.getElementById('maxValue');
const currentPages = document.getElementById('currentPages');
const nameListDiv = document.getElementById('nameList');
const requestedFundingInput = document.getElementById('requestedFunds');
const selectedApplicantsLabel = document.getElementById('requestedFunds-label');
const requestedOutput = document.getElementById('displayRequested');
const collegesOutput = document.getElementById('displayColleges');
const facultiesOutput = document.getElementById('displayFaculty');
const compareOne = document.getElementById('pageOne');
const compareTwo = document.getElementById('pageTwo');
const compareButton = document.getElementById('compareButton');

// Event listener for the Compare button
compareButton.addEventListener('click', () => {
    loadCSVData();
});

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


let originalData = []; // Full dataset with all fields
let myChart; // Main chart instance
let comparisonChart; // Comparison chart instance

// Event listeners for min/max value inputs & requested funding
// Event listeners for min/max value inputs & requested funding
minValueInput.addEventListener('input', applyFilters);
maxValueInput.addEventListener('input', applyFilters);
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

    chart.data.labels = combinedData.map(item => item.label);
    chart.data.datasets[0].data = combinedData.map(item => item.value);

    chart.update();
}

// Filter application function for main chart
function applyFilters() {
    if (!myChart || originalData.length === 0) return;

    const minValue = parseFloat(minValueInput.value) || 0;
    const maxValue = parseFloat(maxValueInput.value) || 3;

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

// Process CSV data and render charts
function processChartData(data) {
    const pageMeans = {};
    const pageNames = {};

    originalData = []; // Reset the original data

    data.forEach(row => {
        const page = row.page;
        const name = row.name;
        const mean = parseFloat(row.mean);

        pageNames[page] = name;
        pageMeans[page] = mean;

        // Store the full row in originalData
        originalData.push({
            page: page,
            name: name,
            category: row.category,
            mean: mean,
            pageNum: parseInt(row.page_num)
        });
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
    const ctx = document.getElementById("myChart").getContext("2d");

    // Destroy the previous chart instance if it exists
    if (myChart) {
        myChart.destroy();
    }

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
                            return `Mean: ${context.raw} (${tooltips[index]})`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { font: { size: 20 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: 22 } }
                }
            },
        },
    });

    // Sort the chart in descending order after rendering
    sortChartDescending(myChart);
}

// Render the comparison chart
function renderComparisonChart(data) {
    const chartOneNum = parseInt(compareOne.value);
    const chartTwoNum = parseInt(compareTwo.value);

    // Filter data for the two selected pages
    const chartOneObjects = data.filter(obj => obj.pageNum === chartOneNum);
    const chartTwoObjects = data.filter(obj => obj.pageNum === chartTwoNum);

    const chartOneData = [
        chartOneObjects[0].mean,
        chartOneObjects[4].mean,
        chartOneObjects[5].mean,
        chartOneObjects[2].mean,
        chartOneObjects[1].mean,
        chartOneObjects[3].mean,
    ];

    const chartTwoData = [
        chartTwoObjects[0].mean,
        chartTwoObjects[4].mean,
        chartTwoObjects[5].mean,
        chartTwoObjects[2].mean,
        chartTwoObjects[1].mean,
        chartTwoObjects[3].mean,
    ];

    const labels = [
        'Project Goals',
        'Strategic Alignment',
        'Expected Outcomes',
        'Impact Assessment',
        'Budget',
        'Mean',
    ];

    const ctx = document.getElementById("comparisonChart").getContext("2d");

    // Destroy the previous chart instance if it exists
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Data for Page ${chartOneNum}`,
                    data: chartOneData,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                },
                {
                    label: `Data for Page ${chartTwoNum}`,
                    data: chartTwoData,
                    backgroundColor: "rgba(192, 75, 192, 0.6)",
                    borderColor: "rgba(192, 75, 192, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // indexAxis: "y",
            plugins: {
                tooltip: {
                    titleFont: { size: 18 },
                    bodyFont: { size: 18 },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { font: { size: 20 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: 20 } }
                }
            },
        },
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