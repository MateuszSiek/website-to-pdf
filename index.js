const express = require('express');
const http = require('http');
const pdf = require('pdfkit');
const fs = require('fs');

const takeScreenshot = require('./screenshot');


const app = express();


// const getPdf = (images, callback) => {
//     const doc = new pdf();
//     let stream = doc.pipe(fs.createWriteStream('test.pdf'));
//
//     doc.image('./output.jpg', 0, 15, {width: 600});
//     doc.end(); //we end the document writing.
//     stream.on('finish', callback(doc));
// };

app.get('*', (req, res) => {
        let url = req.query.url;
        let pdf = req.query.pdf;
        const imageToPdf = false;

        let saveToPdf = pdf === 'true';

        takeScreenshot(url, saveToPdf, (buffer) => { //pdf / img
            if (imageToPdf) {
                // getPdf(buffer, () => {
                //     const pdf = fs.readFileSync('./test.pdf');
                //     res.writeHead(200, {'Content-Type': 'application/pdf'});
                //     res.end(pdf, 'binary');
                // });
            }
            else {
                if (saveToPdf) {
                    res.writeHead(200, {'Content-Type': 'application/pdf'});
                }
                else {
                    res.writeHead(200, {'Content-Type': 'image/gif'});
                }
                res.end(buffer, 'binary');
            }
            // res.status(200).send({message: 'Welcome to the beginning of nothingness.',})
        });
    }
);


const port = parseInt(process.env.PORT, 10) || 8081;
app.set('port', port);

const server = http.createServer(app);
server.listen(port);
console.log(port);