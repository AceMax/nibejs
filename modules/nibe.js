/**
 * Script used to fetch data from Nibe API
 * Author: Max Lindqvist 2021
 */

const fs       = require('fs');
const fetch    = require(__dirname + '/../node_modules/node-fetch');
const conf     = JSON.parse(fs.readFileSync(__dirname + '/../conf/config.json'));
const authData = JSON.parse(fs.readFileSync(__dirname + '/../data/auth.json'));

var authToken = '';

async function refreshToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', conf.clientId);
  params.append('client_secret', conf.secretKey);
  params.append('refresh_token', authData.refresh_token);

  const req = await fetch(conf.apiHost + '/oauth/token', {
    method: 'post',
    body: params
  });
  const data = await req.json();

  if (req.status == 200) {
    authToken = data.access_token;
    const authData = {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      expires: parseInt(data.expires_in, 10) + parseInt(Math.floor(Date.now() / 1000), 10),
      refresh_token: data.refresh_token,
      scope: data.scope
    }

    fs.writeFileSync(__dirname + '/../data/auth.json', JSON.stringify(authData, null, 4), (err) => {
      if (err) {
        throw err;
      }
    });
    return true;
  } else {
    console.log(data);
    return false;
  }
}

async function authenticate() {
  if (authData.expires < Math.floor(Date.now() / 1000)) {
    // console.log("Token expired");
    let res = await refreshToken();
  } else {
    authToken = authData.access_token;
  }
}

async function systems() {
  let data = await getJson('/api/v1/systems');
  if (data) {
    return data;
  } else {
    return false;
  }
}

async function systemStatus(systemId) {
  let data = await getJson('/api/v1/systems/' + systemId + '/status/system');
  if (data) {
    return data;
  } else {
    return false;
  }
}

// Main amps and temp
async function mainSystemServiceInfo(systemId) {
  let data = await getJson('/api/v1/systems/' + systemId + '/serviceinfo/categories/STATUS');
  if (data) {
    return data;
  } else {
    return false;
  }
}

async function householdConsumption(systemId) {
  let data = await mainSystemServiceInfo(systemId);

  var p1current    = 0;
  var p2current    = 0;
  var p3current    = 0;
  var p1power      = 0;
  var p2power      = 0;
  var p3power      = 0;
  var totalCurrent = 0;
  var totalPower   = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i].designation == 'BE1') {
      p1current = data[i].rawValue / 10;
      p1power   = p1current * conf.systemVoltage;
    } else if (data[i].designation == 'BE2') {
      p2current = data[i].rawValue / 10;
      p2power   = p2current * conf.systemVoltage;
    } else if (data[i].designation == 'BE3') {
      p3current = data[i].rawValue / 10;
      p3power   = p3current * conf.systemVoltage;
    }
  }

  res = {
    p1current: p1current,
    p1power: p1power,
    p2current: p2current,
    p2power: p2power,
    p3current: p3current,
    p3power: p3power,
    totalCurrent: p1current + p2current + p3current,
    totalPower: p1power + p2power + p3power
  };

  if (res) {
    return res;
  } else {
    return false;
  }
}

async function getJson(url) {
  await authenticate();
  let req = await fetch(conf.apiHost + url, {
    method: 'get',
    headers: {
      "Authorization": "Bearer " + authToken
    }
  });
  let res = await req.json();

  if (req.status == 200) {
    return res;
  } else {
    console.log(res);
    return false;
  }
}

async function postJson(url, payLoad) {
  await authenticate();
}

exports.systems               = systems;
exports.systemStatus          = systemStatus;
exports.mainSystemServiceInfo = mainSystemServiceInfo;
exports.householdConsumption  = householdConsumption;
