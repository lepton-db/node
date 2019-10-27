import { fileManager } from './jsonl-file-manager';

(async () => {
  const fm = fileManager(__dirname + '/data');
  // Actors
  await fm.commit(
    'actors',
    'create',
    {
      "id": "a6320da84fabd25487377283b03b4c54",
      "cash": 1000.5
    }
  )
  // Transactions
  await fm.commit(
    'transactions',
    'create',
    {
      "id": "5e9f29dab3515b2dacafc755a10b578e",
      "actorId": "a6320da84fabd25487377283b03b4c54",
      "symbol": "MSFT",
      "quantity": 7
    }
  )
  await fm.commit(
    'transactions',
    'create',
    {
      "id": "ddf00017b5f6d6444a5f8425d32f5651",
      "actorId": "a6320da84fabd25487377283b03b4c54",
      "symbol": "AAPL",
      "quantity": 4
    }
  )
  // Positions
  await fm.commit(
    'positions',
    'create',
    {
      "id": "5e9f29dab3515b2dacafc755a10b578e",
      "actorId": "a6320da84fabd25487377283b03b4c54",
      "symbol": "MSFT",
      "quantity": 7
    },
  )
  await fm.commit(
    'positions',
    'create',
    {
      "id": "ddf00017b5f6d6444a5f8425d32f5651",
      "actorId": "a6320da84fabd25487377283b03b4c54",
      "symbol": "AAPL",
      "quantity": 4
    }
  )
  const [data, err] = await fm.rebuild();
  console.log(data, err);
})()