import { BigInt } from "@graphprotocol/graph-ts";
import {
  Bet5Game,
  PoolCancelled,
  PoolCreated,
  PoolEntered,
  PoolRewardTransfer,
} from "../generated/Bet5Game/Bet5Game";
import { Pool, User, Reward } from "../generated/schema";

export function handlePoolCreated(event: PoolCreated): void {
  const id = event.params.poolId.toString();
  const pool = new Pool(id);

  pool.status = "ACTIVE";
  pool.startTime = event.params.startTime.times(BigInt.fromI32(1000));
  pool.endTime = event.params.endTime.times(BigInt.fromI32(1000));
  pool.entryFee = event.params.entryFee;
  pool.token = event.params.token;
  pool.entryCount = BigInt.fromI32(0);

  pool.save();
}

export function handlePoolEntered(event: PoolEntered): void {
  const poolId = event.params.poolId.toString();
  const pool = Pool.load(poolId);

  if (!pool) return;

  if (event.params.newEntry) {
    pool.entryCount = pool.entryCount.plus(BigInt.fromI32(1));
  }

  pool.save();

  const userId = event.transaction.from.toHexString();
  let user = User.load(userId);

  if (!user) {
    user = new User(userId);
  }

  let enteredPools = user.pools;
  if (!enteredPools) {
    enteredPools = [];
  }
  enteredPools.push(poolId);
  user.pools = enteredPools;

  user.save();
}

export function handlePoolCancelled(event: PoolCancelled): void {
  const id = event.params.poolId.toString();
  const pool = Pool.load(id);

  if (!pool) return;

  pool.status = "CANCELLED";

  pool.save();
}

export function handlePoolRewardTransfer(event: PoolRewardTransfer): void {
  const poolId = event.params.poolId.toString();
  const pool = Pool.load(poolId);

  if (!pool) return;

  pool.status = "COMPLETE";

  pool.save();

  const rewardId = `${event.params.winner.toHexString()}-${poolId}`;
  const reward = new Reward(rewardId);

  reward.pool = poolId;
  reward.user = event.params.winner.toHexString();
  reward.amount = event.params.amount;

  reward.save();
}
