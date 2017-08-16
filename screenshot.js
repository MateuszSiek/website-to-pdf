const CDP = require('chrome-remote-interface');
const argv = require('minimist')(process.argv.slice(2));
const file = require('fs');
const timeout = require('delay');

// CLI Args
const format = 'jpeg';
const viewportWidth = 1440;
let viewportHeight = 900;
const delay = 2000;
// const userAgent = argv.userAgent;
const fullPage = false;
const output = `output.${format === 'png' ? 'png' : 'jpg'}`;

const screenshot = async function (url = 'https://www.google.co.uk', printPdf, callback) {
    let client;
    try {
        // Start the Chrome Debugging Protocol
        client = await CDP();

        // Verify version
        const {Browser} = await CDP.Version();
        const browserVersion = Browser.match(/\/(\d+)/)[1];
        if (Number(browserVersion) !== 60) {
            console.warn(`This script requires Chrome 60, however you are using version ${browserVersion}. The script is not guaranteed to work and you may need to modify it.`);
        }

        // Extract used DevTools domains.
        const {DOM, Emulation, Network, Page, Runtime} = client;

        // Enable events on domains we are interested in.
        await Page.enable();
        await DOM.enable();
        await Network.enable();

        // Set up viewport resolution, etc.
        const deviceMetrics = {
            width: viewportWidth,
            height: viewportHeight,
            deviceScaleFactor: 0,
            mobile: false,
            fitWindow: false,
        };
        await Emulation.setDeviceMetricsOverride(deviceMetrics);
        await Emulation.setVisibleSize({
            width: viewportWidth,
            height: viewportHeight,
        });

        // Navigate to target page
        await Page.navigate({url});

        // Wait for page load event to take screenshot
        await Page.loadEventFired();

        await timeout(delay);

        // If the `full` CLI option was passed, we need to measure the height of
        // the rendered page and use Emulation.setVisibleSize
        if (fullPage) {
            const {root: {nodeId: documentNodeId}} = await DOM.getDocument();
            const {nodeId: bodyNodeId} = await DOM.querySelector({
                selector: 'body',
                nodeId: documentNodeId,
            });
            const {model} = await DOM.getBoxModel({nodeId: bodyNodeId});
            viewportHeight = model.height;

            await Emulation.setVisibleSize({width: viewportWidth, height: viewportHeight});
            // This forceViewport call ensures that content outside the viewport is
            // rendered, otherwise it shows up as grey. Possibly a bug?
            await Emulation.forceViewport({x: 0, y: 0, scale: 1});
        }

        const {root: {nodeId: documentNodeId}} = await DOM.getDocument();
        const {nodeId: bodyNodeId} = await DOM.querySelector({
            selector: 'body',
            nodeId: documentNodeId,
        });

        await DOM.setAttributeValue({nodeId: bodyNodeId, name: 'innerHTML', value: '400'});

        await Emulation.forceViewport({x: 0, y: 0, scale: 1});

        let data;
        if (printPdf) {
            let pdfData = await Page.printToPDF({
                landscape: true,
                printBackground: true,
                marginTop: 0,
                marginBottom: 0,
                marginLeft: 0,
                marginRight: 0
            });
            data = pdfData.data;
        }
        else {
            let pdfDascreenshotDatata = await Page.captureScreenshot({
                format,
                fromSurface: true,
                clip: {
                    width: viewportWidth,
                    height: viewportHeight
                }
            });
            data = pdfDascreenshotDatata.data;
        }

        const buffer = new Buffer(data, 'base64');
        // await file.writeFile('page.pdf', buffer, 'base64');

        // const buffer = new Buffer(screenshot.data, 'base64');
        // await file.writeFile(output, buffer, 'base64');

        await callback(buffer);
        console.log('Saved');
        client.close();
    } catch (err) {
        if (client) {
            client.close();
        }
        console.error('Exception while taking screenshot:', err);
        process.exit(1);
    }
}
// screenshot();
module.exports = screenshot;