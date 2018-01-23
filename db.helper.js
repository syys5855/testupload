const sqlite3 = require('sqlite3').verbose();

class DBHelper {
    constructor({ filename }) {
        this.db = null;
        this.filename = filename;
        this.options = {
            filename,
        }
    }

    concet() {
        return this.db ? Promise.resolve(this.db) : new Promise((res, rej) => {
            let db = new sqlite3.Database(this.filename, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                err ? rej(err) : (this.db = db, res(db));
            });
        })
    }

    createTable(sentence) {
        return new Promise((res, rej) => {
            this.db.exec(sentence, (err) => {
                err ? rej(err) : res();
            })
        })
    }

    sql(sql, param, mode = 'run') {
        return new Promise((res, rej) => {
            this.db[mode](sql, param, (err, data) => {
                err ? rej(err) : res(data);
            })
        })
    }
}

module.exports = DBHelper;