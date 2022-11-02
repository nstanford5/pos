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
  init();
  A.only(() => {
    const min = declassify(interact.min);
  });
  A.publish(min);
  commit();
  A.interact.launched(getContract());
  A.publish();
  // can you add .pay a supply of non-network tokens, pay those, then return?
  const pMap = new Map(UInt);
  const end = lastConsensusTime() + min;
  const [count, total] = parallelReduce([0, 0])
    .invariant(pMap.size() == count, "count accurate")
    .invariant(balance() == total, "balance accurate")
    // this compiles, but the functions are not callable
    .while(lastConsensusTime() <= end)
    .api_(B.purchase, (amount) => {
      check(amount > min, "amount too low");
      check(isNone(pMap[this]), "your transaction has already been processed");
      check(end < thisConsensusTime(), "too late")
      return[amount, (ret) => {
        enforce(end > thisConsensusTime(), "too late");// commenting these out throws balance errors
        pMap[this] = amount;
        ret(null);
        return[count + 1, total + amount];
      }];
    })
    .api_(B.refund, () => {
      check(isSome(pMap[this]), "sorry, you are not in the list");
      check(end > thisConsensusTime(), "too late");
      return[ (ret) => {
        enforce(end < thisConsensusTime(), "too late");
        const paid = fromSome(pMap[this], 0);
        transfer(paid).to(this);
        ret(paid);
        delete pMap[this];
        return[count - 1, total - paid];
      }];
    })
    transfer(total).to(A);
    commit();
    exit();
});