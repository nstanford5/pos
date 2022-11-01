import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";
const stdlib = loadStdlib({REACH_NO_WARN: 'Y'});
const MIN = 10;
const MAX = 5;

const accA = await stdlib.newTestAccount(stdlib.parseCurrency(5000));
const ctcA = accA.contract(backend);

console.log("Welcome to the POS machine.\n" +
  "Its purpose is to accept payment and process refunds\n" +
  "Better on Blockchain, built with Reach");

const startTest = async () => {
  const runUser = async (i) => {
    const acc = await stdlib.newTestAccount(stdlib.parseCurrency(100));
    const ctc = acc.contract(backend, ctcA.getInfo());
    let cost = Math.floor(Math.random() * 100);
    cost = (i == 1 ? 0 : cost);
    try{
      await ctc.apis.Buyer.purchase(cost);
      console.log(`Purchase for customer ${i} is complete`);// This could be an Event
    } catch (e){
      console.log(`${e}`);
    }
    const getRefund = async (i) => {
      const amount = await ctc.apis.Buyer.refund();
      console.log(`Refund processed for Customer number: ${i}
        \tTotal refund: ${amount} ${stdlib.standardUnit}`);
    };// end of getRefund
    if(i == 2){
      await getRefund(i);
    }
  };// end of runUser

  for(let i = 1; i < MAX; i++){
    await runUser(i);
  };
  console.log('Exiting...');
  process.exit(0);
};// end of startTest
await ctcA.p.Admin({
  min: MIN,
  launched: async (contract) => {
    console.log(`Ready at contract: ${contract}`);
    startTest();
  },
});