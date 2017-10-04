#!/usr/bin/env node
'use strict';


const program = require('commander');
const fs = require('fs');
const path = require('path');
const csvparse = require('csv-parse/lib/sync');

let getFormattedPercentage = (number, total) => {
    let percentage = number / total;
    return String(Number(percentage * 100).toFixed(1)) + '%';
};

let displayErrors = (fundList) => {
    if (fundList.length > 0) {
        console.log("\n");
        for (let fund of fundList) {
            console.error("WARNING: COULD NOT FIND CONFIGURATION DATA FOR " + fund);
        }
    }
};

let displayResults = (result, total) => {
    for (let [propertyType, propertyData] of Object.entries(result)) {
        console.info("\n" + propertyType + "\n" + new Array(propertyType.length + 1).join("-"));

        for (let [propertyName, propertyAmount] of Object.entries(propertyData)) {
            console.log(propertyName + ": " + getFormattedPercentage(propertyAmount, total) + "\t\t(" + Number(propertyAmount).toFixed(2) + " of " + Number(total).toFixed(2) + ")");
        }
    }
};

let summarizeFunction = (portfolio, options) => {
    let portfolioPath = path.resolve(portfolio);
    let configPath = path.resolve(options.config);
    let portfolioSummary = [];
    let noFundDataList = [];
    let result = {};
    let total = 0;

    // sum and consolidate all the fund values.
    if (fs.existsSync(portfolioPath)) {
        let input = fs.readFileSync(portfolioPath, {encoding: 'utf8'});
        let records = csvparse(input, {comment: '#', columns: true});

        // sum up all the entries from the portfolio
        for (let a = 0; a < records.length; a++) {
            if (typeof(records[a].fund) !== 'undefined') {
                if (typeof(portfolioSummary[records[a].fund]) === 'undefined') {
                    portfolioSummary[records[a].fund] = parseFloat(records[a].amount);
                } else {
                    portfolioSummary[records[a].fund] += parseFloat(records[a].amount);
                }
            }
        }
    }

    // create a result set from a combination of portfolio and property config
    if (fs.existsSync(configPath)) {
        let fundProperties = require(configPath);

        for (let [fund, amount] of Object.entries(portfolioSummary)) {
            total += parseFloat(amount);

            if (typeof(fundProperties[fund]) !== 'undefined') {
                for (let [propertyType, propertyData] of Object.entries(fundProperties[fund])) {

                    // make propertyName part of the result set
                    if (typeof(result[propertyType]) === 'undefined') {
                        result[propertyType] = {};
                    }

                    for (let [propertyName, propertyPercentage] of Object.entries(propertyData)) {
                        if (typeof(result[propertyType][propertyName]) === 'undefined') {
                            result[propertyType][propertyName] = 0;
                        }

                        if (!isNaN(parseFloat(propertyPercentage)) && !isNaN(parseFloat(amount))) {
                            result[propertyType][propertyName] += (parseFloat(propertyPercentage) * parseFloat(amount));
                        }
                    }
                }
            } else {
                noFundDataList.push(fund);
            }
        }
    }

    displayResults(result, total);
    displayErrors(noFundDataList);

    console.log("\n");
};

program
    .version('0.1.0')
    .command('summarize <portfolio>')
    .description('Aggregates and summarizes the properties of a portfolio.')
    .option('-f --filter <name>', 'Only summarize and display the given property.')
    .option('-c --config <path>', 'Which fund property configuration should we use?', path.resolve('/app/config/default.json'))
    .action(summarizeFunction);

program.parse(process.argv);