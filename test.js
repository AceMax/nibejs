const fs    = require('fs');
const conf  = JSON.parse(fs.readFileSync(__dirname + '/conf/config.json'));

const domoticz = require("../domoticzjs/modules/domoticz");
const nibe     = require("./modules/nibe");

async function main() {

  let householdConsumption = await nibe.householdConsumption(conf.systems[1].systemId);
  // console.log(JSON.stringify(householdConsumption));

  domoticz.updateUdevice(2, 0, householdConsumption.p1current + ';' + householdConsumption.p2current + ';' + householdConsumption.p3current)
  domoticz.updateUdevice(3, 0, householdConsumption.totalPower);
}

main();
setInterval(function() {
   main();
}, 300 * 1000);
