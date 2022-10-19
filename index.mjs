import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib({REACH_NO_WARN: 'Y'});

const accA = await stdlib.newTestAccount(stdlib.parseCurrency(5000));
const ctcA = accA.contract(backend);
const tickets = await stdlib.launchToken(accA, "Tickets", "TIK", {supply: 500});
const ticketTok = tickets.id;
console.log('Welcome to the ticket distributor\nLets get you a ticket');

const startBuyers = async () => {
  const runBuyers = async (who) => {
    const acc = await stdlib.newTestAccount(stdlib.parseCurrency(100));
    const ctc = acc.contract(backend, ctcA.getInfo());
    await acc.tokenAccept(ticketTok);
    const succ = await ctc.apis.Buyer.buyTicket();
    console.log(`${who} purchased a ticket is ${succ}`);
  }// end of runBuyers
  for(let i = 0; i < 500; i++){
    console.log(`Test ${i}`);
    await runBuyers('Buyer');
  }
}// end of startBuyers

await Promise.all([
  backend.Admin(ctcA, {
    cost: stdlib.parseCurrency(10),
    token: ticketTok,
    supply: 500,
    ready: (contract) => {
      console.log(`Ready at contract: ${contract}`);
      startBuyers();
    },
  }),
]);
console.log('Exiting...');