const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const DBHelperInstance = require('./db/db.helper');
const DBHelper = new DBHelperInstance({
    filename: './db/pick.db'
})
DBHelper.concet().then(() => {
    console.log('db conceted...');
});

// app.use(express.bodyParser());
let jsonParser = bodyParser.json()
let textParser = bodyParser.text();
let rawParser = bodyParser.raw();

let urlencodedParser = bodyParser.urlencoded({ extended: true })
app.use(express.static('./'));

app.post('/api/upload.json', rawParser, (req, res) => {
    let buffer = req.body;
    DBHelper.sql('INSERT INTO pictures (fileId,value) values (?,?)', [null, buffer]).then(() => {
        res.send('upload success');
    }).catch(err => {
        res.send('failure');
    })
})

app.get('/api/download.json', (req, res) => {
    let fileId = req.query.fileId || 2;
    DBHelper.sql('SELECT value FROM pictures where fileId = ?', [fileId], 'get').then(data => {
        res.send(data.value);
    }).catch(err => {
        res.send('failure');
    })
})

app.listen(1234, () => {
    console.log('run at port 1234...');
})