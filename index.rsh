'reach 0.1';

export const main = Reach.App(() => {
  const A = Participant('Admin', {
    min: UInt,
    launched: Fun([Contract], Null),
  });
  const B = API('Buyer', {
    purchase: Fun([UInt], Null),
    refund: Fun([], UInt),
  });
  const C = API('Seller', {
    payout: Fun([], Null),
  });
  init();
  A.only(() => {
    const min = declassify(interact.min);
  });
  A.publish(min);
  A.interact.launched(getContract());

  const pMap = new Map(UInt);
  pMap[A] = 0;
  const [count] = parallelReduce([0])
    .invariant(balance() == pMap.sum(), "balance accurate")
    .invariant(pMap.size() == count, "count accurate")
    .while(true)
    .api_(B.purchase, (amount) => {
      check(amount > min, "amount too low");
      check(isNone(pMap[this]), "your transaction has already been processed");
      return[amount, (ret) => {
        pMap[this] = amount;
        ret(null);
        return[count + 1];
      }];
    })
    .api_(B.refund, () => {
      check(isSome(pMap[this]), "sorry, you are not in the list");
      return[ (ret) => {
        const paid = fromSome(pMap[this], 0);
        transfer(paid).to(this);
        ret(paid);
        delete pMap[this];
        return[count - 1];
      }];
    })
    commit();
    exit();

});