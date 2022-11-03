/**
 * This program simulates a business point-of-sale machine (POS)
 * It recieves payment in a network token while rewarding users
 * with a loyalty non-network token. It allows a purchase function of
 * a varying amount of network tokens -- each transaction returns a single
 * non-network loyalty token.
 * 
 */
'reach 0.1';

export const main = Reach.App(() => {
  const A = Participant('Admin', {
    params: Object({
      min: UInt,
      tok: Token,
      supply: UInt,
      amount: UInt,
    }),
    launched: Fun([Contract], Null),
  });
  const B = API('Buyer', {
    buyTicket: Fun([UInt], Null),
    refund: Fun([], UInt),
  });
  init();

  A.only(() => {
    const {min, tok, supply} = declassify(interact.params);
  });
  A.publish(min, tok, supply);
  commit();
  A.pay([[supply, tok]])
  A.interact.launched(getContract());

  const pMap = new Map(UInt);
  const [ticketsSold, total] = parallelReduce([0, 0])
    .paySpec([tok])
    .invariant(pMap.sum() == total, "tracking amounts wrong")
    .invariant(balance() == total, "network token balance wrong")
    .invariant(balance(tok) == supply - ticketsSold, "non-network token balance wrong")
    .while(ticketsSold < supply)
    .api_(B.buyTicket, (amount) => {
      /**
       * is this actually useful? Given the loop exit condition, 
       * is there any possibility that this api could be called,
       * even by a micro-second, if ticketsSold == supply?
       */
      check(ticketsSold != supply, "sorry, out of tickets");
      check(isNone(pMap[this]), "sorry, you are already in this list");
      /**
       * this is entirely optional -- it is an extra restriction
       * you are defining a try...catch for your SC
       */
      check(amount >= min, "sorry, amount too low");
      return[[amount, [0, tok]], (ret) => {
        pMap[this] = amount;
        transfer(1, tok).to(this);
        ret(null);
        return [ticketsSold + 1, total + amount];
      }];
    })
    .api_(B.refund, () => {
      check(isSome(pMap[this]), "sorry, you are not in the list");
      return[[0, [1, tok]], (ret) => {
        const paid = fromSome(pMap[this], 0);
        transfer(paid).to(this);
        ret(paid);
        delete pMap[this];
        return[ticketsSold - 1, total - paid]
      }];
    });
  transfer(total).to(A);
  commit();
  exit();
});