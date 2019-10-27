import { fileManager } from './jsonl-file-manager';

(async () => {
  const fm = fileManager(__dirname + '/data');
  // Actors
  await fm.commit(
    'actors',
    'create',
    {
      "id": "doj0ey0ofarfx02j",
      "cash": 1000.5
    }
  )
  // Transactions
  await fm.commit(
    'transactions',
    'create',
    {
      "id": "bw4o00y6fsr6d7l7",
      "actorId": "doj0ey0ofarfx02j",
      "timestamp": "2019-10-26T15:42:37.667Z",
      "action": "buy",
      "symbol": "AAPL",
      "quantity": 4,
      "price": 246.58
    }
  )
  await fm.commit(
    'transactions',
    'create',
    {
      "id": "ta0sobmbbb5yneeq",
      "actorId": "doj0ey0ofarfx02j",
      "timestamp": "2019-10-26T15:42:37.667Z",
      "action": "buy",
      "symbol": "MSFT",
      "quantity": 7,
      "price": 140.73
    },
  )
  // Positions
  await fm.commit(
    'positions',
    'create',
    {
      "id": "bbz7b1h6nmonmxsb",
      "actorId": "doj0ey0ofarfx02j",
      "symbol": "MSFT",
      "quantity": 7
    },
  )
  await fm.commit(
    'positions',
    'create',
    {
      "id": "j4aed3lp51ylag9v",
      "actorId": "doj0ey0ofarfx02j",
      "symbol": "AAPL",
      "quantity": 4
    }
  )
  const [data, err] = await fm.rebuild();
  console.log(data, err);
})()