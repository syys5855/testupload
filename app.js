const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multiparty = require('connect-multiparty');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const resolve = (pathName) => {
    return path.join(__dirname, pathName)
}

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
let multipartyParser = multiparty();

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

app.post('/api/upload-formdata.json', multipartyParser, (req, res) => {
    let file = req.files.file,
        sourcePath = file.path,
        destPath = resolve(`./public/${file.name}`);

    // fs.readFile(sourcePath, (err, data) => {
    //     fs.writeFile(destPath, data, (err) => {
    //         console.log(err);
    //         err ? res.send({ success: false }) : res.send({ success: true });
    //     })
    // })

    fs.copyFile(sourcePath, destPath, (err) => {
        if (err) {
            console.error(err);
            res.send({ success: false });
        } else {
            fs.unlink(file.path);
            res.json({ data: `/public/${file.name}`, success: true });
        }
    })
});

app.post('/api/upload-slice.json', multipartyParser, (req, res) => {
    let file = req.files.file,
        name = req.body.name,
        index = req.body.index,
        sourcePath = file.path,
        tempFile = (global.tempFile || (global.tempFile = {}, global.tempFile))[name] || {};

    tempFile.path = (tempFile.path || []).concat({ file, name, path: sourcePath, index });
    global.tempFile[name] = tempFile;
    res.send({ name, path: sourcePath });
})

app.post('/api/merge-file.json', jsonParser, (req, res) => {
    let filename = req.body.filename;
    let tempFile = global.tempFile[filename];
    let relativePath = `/public/${filename}`;
    let destPath = resolve(relativePath);
    if (!_.isArray(tempFile.path)) {
        res.send({ success: false, msg: 'no such file' });
        return;
    } else {
        tempFile = tempFile.path;
        let readPromise = _.chain(tempFile).sortBy((file) => (+file.index)).map(file => readFilePromise(file.path)).value();
        Promise.all(readPromise).then((buffers) => {
            fs.writeFile(destPath, Buffer.concat(buffers), (err) => {
                _.each(tempFile, (file) => {
                    fs.unlink(file.path);
                })
                err ? (res.send({ success: false, msg: err })) : res.send({ success: true, filename, path: relativePath });
            });
        }).catch(err => {
            console.error(err);
            res.send({ success: false, msg: err });
        })
    }

    function readFilePromise(path) {
        return new Promise((res, rej) => {
            fs.readFile(path, (err, data) => {
                err ? rej(err) : res(data);
            })
        })
    }

})

app.listen(1234, () => {
    console.log('run at port 1234...');
})