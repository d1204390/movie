var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db/sqlite.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});

// 電影台詞
db.run('CREATE TABLE IF NOT EXISTS MovieQuotes (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, movietitle TEXT NOT NULL, quote TEXT NOT NULL, votes INTEGER DEFAULT 0)');

app.get('/api/quotes', (req, res) => {
    db.all('SELECT * FROM MovieQuotes', (err, rows) => {
        if (err) {
            console.error(err.message);
        }
        res.json(rows);
    });
});

app.get('/api', (req, res) => {
    const provider = req.query.provider;
    const sql = 'SELECT * FROM MovieQuotes WHERE Provider = ?';
    db.all(sql, [provider], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});
app.post('/api/insert', (req, res) => {
    const { provider, movie_name, quote } = req.body;
    if (!provider || !movie_name || !quote) {
        return res.status(400).json({ error: 'Provider, movie_name, and quote are required' });
    }

    const sql = 'INSERT INTO MovieQuotes (provider, movietitle, quote) VALUES (?, ?, ?)';
    db.run(sql, [provider, movie_name, quote], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to insert quote' });
        }
        res.json({
            message: 'Quote inserted successfully',
            quote_id: this.lastID
        });
    });
});

app.get('/api/insert', (req, res) => {
    const provider = req.query.provider;
    const movie_name = req.query.movie_name;
    const quote = req.query.quote;

    // 檢查是否提供必要的資訊
    if (!provider || !movie_name || !quote) {
        return res.status(400).send('Provider, movie_name, and quote are required');
    }

    const sql = 'INSERT INTO movie_quotes (provider, movie_name, quote) VALUES (?, ?, ?)';
    db.run(sql, [provider, movie_name, quote], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }
        res.send('Insert success');
    });
});

module.exports = app;
