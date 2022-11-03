import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib({REACH_NO_WARN: 'Y'});
const MIN_PRICE = 10;// price
const USERS = 10;// users + refunds(at loop)
const accA = await stdlib.newTestAccount(stdlib.parseCurrency(5000));
const ctcA = accA.contract(backend);
const loyalTok = await stdlib.launchToken(accA, "Loyalty", "LYL", {supply: MAX});
let sales = 0;

console.log('Welcome to the ticket distributor\nLets get you a ticket');

const startBuyers = async () => {
  const runBuyer = async (i) => {
    const acc = await stdlib.newTestAccount(stdlib.parseCurrency(100));
    const ctc = acc.contract(backend, ctcA.getInfo());
    let cost = Math.floor(Math.random() * 100) + MIN_PRICE;
    await acc.tokenAccept(loyalTok.id);
    cost = (i == 0 ? 0 : cost)
    try{
      await ctc.apis.Buyer.buyTicket(cost);
      sales++;
      console.log(`Purchases made: ${sales}`);
    } catch (e) {
      console.log(`${e}`);

    }
    if(i == 1){
      const amt = await ctc.apis.Buyer.refund();
      sales--;
      console.log(`Customer ${i} is getting a refund of ${amt}`);
      console.log(`Tickets sold: ${sold}`);
    }
  }// end of runBuyer
  // adding the failed tests to the loop
  for(let i = 0; i < USERS + 2; i++){
    await runBuyer(i);
  }
}// end of startBuyers

await ctcA.p.Admin({
  params: {
    tok: loyalTok.id,
    min: MIN_PRICE,
    supply: USERS,
    amount: Math.floor(Math.random() * 100) + 1,
  },
  launched: async (contract) => {
    console.log(`Ready at contract: ${contract}`);
    await startBuyers();
  },
}),
console.log('Exiting...');
