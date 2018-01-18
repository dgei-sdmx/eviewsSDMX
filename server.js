// Copyright (C) 2016 Louis de Charsonville
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License version 3 as
// published by the Free Software Foundation.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.


// EXTERNAL MODULES
var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    timeout = require('connect-timeout'),
    favicon = require('serve-favicon'),
    debug = require('debug')('server');
// ROUTES 
var fetcher = require('./routes/fetcher'),
    quandl = require('./routes/quandl'),
    bls = require('./routes/bls'),
    fred = require('./routes/fred'),
    buba = require('./routes/buba'),
    oecd = require('./routes/oecd');


var app = express();
var port = process.env.PORT || 8080;

debug('booting %s','EViews - SDMX');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use('/',express.static(__dirname + '/public/'));

// Favicon
app.use(favicon(path.join(__dirname,'public','favicon.ico')));

// TIMEOUT
app.use(timeout(29900,{"respond":true}));

// SDMX PROVIDER
// -----------------------
// OECD
app.get('/oecd/dataflow/:dataset',oecd.getDataflow);
app.get('/oecd/codelist/:codelist',oecd.getCodeList);
app.get('/oecd/:dataset/:series',oecd.getSeries);
app.get('/oecd/dataflow',oecd.getAllDataFlow);


// Timeseries from supported providers
app.get('/:provider/dataflow', fetcher.getAllDataFlow);
app.get('/:provider/dataflow/:dataset', fetcher.getDataFlow);
app.get('/:provider/dataset/:dataset',fetcher.getDataSet);
app.get('/:provider/series/:series',fetcher.getSeries);
app.get('/:provider/list/:dataset',fetcher.getList);
app.get('/:provider/codelist/:codelist',fetcher.getCodeList);
app.get('/providers',fetcher.getProviders);

// Timeseries from sdmx url
app.get('/req',fetcher.getDatafromURL);
app.post('/requestbyURL',fetcher.redirectURL);

// OTHER NON-SDMX PROVIDER
// -----------------------
// Quandl
app.get('/quandl/:apiKey/:dataset/:series',quandl.getSeries);
// BLS
app.get('/bls/:apiKey/:series',bls.getSeries);
// FRED
app.get('/fred/:apiKey/:series',fred.getSeries);
// Bundesbank
app.get('/buba/:series',buba.getSeries);


// Calendar
// --------
app.get('/cal',function(req,res) {
    res.set('Content-Type', 'text/plain');
    res.send("NO LONGER SUPPORTED");
});
// app.get('/cal/:cals', cal.getCals);
// app.get('/cal',cal.getFormCal);
// app.post('/createCal',cal.sendCal);
// app.post('/cal/createCal',cal.sendCal);

app.get('/status',function(req,res){
    res.set('Content-Type','text/plain');
    res.send('OK');
});

// TIMEOUT
app.use(haltOnTimedout);

function haltOnTimedout(err,req,res,next) {
    if (req.timedout === true) {
        if (res.headersSent) {
            next(err);
        } else {
            res.redirect('/timedout.html');
        }
    } else {
        next();
    }
};

// 404
app.get('*', function(req, res){
    res.status(404).send("ERROR 404 - NO ROUTES");
});

app.listen(port, function() {
    console.log('Our app is running on port '+ port);
});

// Very dangerous
process.on('uncaughtException', (err) => {
     console.log(`Caught exception: ${err}`);
});


// FOR TESTING
module.exports = app;
