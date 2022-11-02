import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";
const stdlib = loadStdlib({REACH_NO_WARN: 'Y'});
const MIN = 100;
const accA = await stdlib.newTestAccount(stdlib.parseCurrency(5000));
const ctcA = accA.contract(backend);
console.log("Welcome to the POS machine.\n" +
  "Its purpose is to accept payment and process refunds");

const startTest = async () => {
  console.log(`Creating test users`)
  const accs = await stdlib.newTestAccounts(4, stdlib.parseCurrency(200));
  const [acc0, acc1, acc2, acc3] = accs;
  const [addr0, addr1, addr2, addr3] = accs.map(a => a.getAddress());
  const ctcI = await ctcA.getInfo();
  const ctc = (acc) => acc.contract(backend, ctcI);

  const purchase = async (acc) => {
    const cost = Math.floor(Math.random() * 100) + MIN;
    await ctc(acc).apis.Buyer.purchase(cost);
    console.log(`Customer ${stdlib.formatAddress(acc)} purchase complete for ${cost}${stdlib.standardUnit}`);
  };
  //stdlib.wait(10);
  await purchase(acc0);
}

await ctcA.p.Admin({
  min: MIN,
  launched: (c) => {
    console.log(`Ready at contract: ${c}`);
    startTest();
  },
});
console.log('Exiting...');