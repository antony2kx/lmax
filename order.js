var FixProtocol = require('./lib/protocol.js'),
    tls       = require('tls'),
    moment    = require('moment');

// FIX account credentials
var host = 'fix-order.london-demo.lmax.com';
var port = 443;
var username = '';
var password = '';
var targetCompID  = 'LMXBD';

var protocol = new FixProtocol();

var loginMessage = protocol.encode({
    BeginString:     'FIX.4.4',
    BodyLength:      '%l',
    MsgType:         'A',
    MsgSeqNum:       protocol.seqNum(),
    SenderCompID:    username,
    SendingTime:     moment().format("YYYYMMDD-HH:mm:ss"),
    TargetCompID:    targetCompID,
    Username:        username,
    Password:        password,
    EncryptMethod:   0,
    HeartBtInt:      30,
    ResetSeqNumFlag: 'Y'
}, true);



var orderMessage = protocol.encode({
    BeginString:             'FIX.4.4',
    //body length should always be %l
    // it will be replaced with actual length
    BodyLength:              '%l',
    MsgType:                 'D',
    MsgSeqNum:               2,
    // username
    SenderCompID:            username,
    SendingTime:             moment().format("YYYYMMDD-HH:mm:ss"),
    TargetCompID:            targetCompID,
    ClOrdID:                 86868740,
    //MDReqID:                 'EURUSD',
    ExecInst:                'H',
    SecurityID:              4001,
    SecurityIDSource:        8,
    Side:                    2,
    ExecInst:                 'H',
    OrderQty:                   50,
    OrdType:                    2,
    TimeInForce:                0,
    Price:                   1.05761, // set the price
    TransactTime:              moment().format("YYYYMMDD-HH:mm:ss")              

}, true);


var connectionOptions = {
    secureProtocol: 'TLSv1_method'
};

var cleartextStream = tls.connect(port, host,
    connectionOptions, function () {
        // connected to FIX server
        cleartextStream.write(loginMessage);

        cleartextStream.write(orderMessage);
    });


cleartextStream.setEncoding('utf8');

// parse response from FIX server
cleartextStream.on('data', function (data) {

    // parse the FIX message
    var data = protocol.decode(data);


    // if server sent a heart beat, We need to respond
    if (data.MsgType === '1') {
        var beat = protocol.encode({
            BeginString:  'FIX.4.4',
            BodyLength:   '%l',
            MsgType:      0,
            MsgSeqNum:    protocol.seqNum(),
            SenderCompID: 'antony2kx',
            SendingTime:  moment().format("YYYYMMDD-HH:mm:ss.SSS"),
            TargetCompID: targetCompID,
            TestReqID:    data.TestReqID
        }, true);

        cleartextStream.write(beat);
    }

    console.log("W data", data);

    // server sent us quote update
    if (data.MsgType[0] === 'W') {

        console.log(data);
    }


});

cleartextStream.on('end', function () {
    console.log('FIX connection closed');
    process.exit(0);
});

cleartextStream.on('error', function (reason) {
    console.log('FIX connection error: ' + reason);
});