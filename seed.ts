import { fileManager } from './file-manager';

(async () => {
  const fm = fileManager(__dirname + '/data');
  // Actors
  await fm.commit(
    'actors',
    'create',
    {
      "id": "doj0ey0ofarfx02j",
      "cash": 6500.54
    }
  )
  await fm.commit(
    'actors',
    'create',
    {
      "id": "vhfxn0ujsrp1jrx7",
      "cash": 2400.78
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
  await fm.commit(
    'transactions',
    'create',
    {
      "id": "0xxw5ebcbtbvtu0x",
      "actorId": "vhfxn0ujsrp1jrx7",
      "timestamp": "2019-10-27T16:51:15.340Z",
      "action": "buy",
      "symbol": "TSLA",
      "quantity": 2,
      "price": 300.05
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
  await fm.commit(
    'positions',
    'create',
    {
      "id": "am0fk0hpiodd7dj8",
      "actorId": "vhfxn0ujsrp1jrx7",
      "symbol": "TSLA",
      "quantity": 2
    }
  )
  const [data, err] = await fm.rebuild();
  console.log(data, err);
})()