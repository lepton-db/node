import { database } from './database';

(async () => {
  const data = await database(__dirname + '/data');
  // Define Tables
  await data.commit(
    data.define('actors', {
      referenceField: 'actorId'
    }),
    data.define('transactions', {
      referenceField: 'transactionId'
    }),
    data.define('positions', {
      referenceField: 'positionId'
    }),
  )
  // Populate actor
  const createdactor = await data.commit(
    data.create('actors', {
      fields: {
        cash: 6500.54
      }
    }),
    data.create('actors', {
      fields: {
        cash: 1000
      }
    }),
    data.create('actors', {
      fields: {
        cash: 2400.78
      }
    }),
  );
  const actorIds = Object.keys(createdactor);

  // Populate transaction
  const createdtransaction = await data.commit(
    data.create('transactions', {
      fields: {
        actorId: actorIds[0],
        timestamp: "2019-10-26T15:42:37.667Z",
        action: "buy",
        symbol: "AAPL",
        quantity: 4,
        price: 246.58
      }
    }),
    data.create('transactions', {
      fields: {
        actorId: actorIds[0],
        timestamp: "2019-10-26T15:42:37.667Z",
        action: "buy",
        symbol: "MSFT",
        quantity: 7,
        price: 140.73
      }
    }),
    data.create('transactions', {
      fields: {
        actorId: actorIds[1],
        timestamp: "2019-10-27T16:51:15.340Z",
        action: "buy",
        symbol: "TSLA",
        quantity: 2,
        price: 300.05
      }
    }),
  );


  // Populate position
  await data.commit(
    data.create('positions', {
      fields: {
        actorId: actorIds[0],
        symbol: "MSFT",
        quantity: 7
      }
    }),
    data.create('positions', {
      fields: {
        actorId: actorIds[0],
        symbol: "AAPL",
        quantity: 4
      }
    }),
    data.create('positions', {
      fields: {
        actorId: actorIds[1],
        symbol: "TSLA",
        quantity: 2
      }
    }),
  )

  // Update Actor
  await data.commit(
    data.update('actors', {
      id: actorIds[0],
      fields: {
        "cash": 3000,
      }
    }),
  );
  // Delete Actor
  await data.commit(
    data.destroy('actors', {
      id: actorIds[2],
    }),
  );

  const [id] = actorIds;
  const results:any = data.read('actors')[id];
  const [positionIds, positions] = Object.entries(data.read('positions'));
  const [transactionIds, transactions] = Object.entries(data.read('transactions'));

  results.positions = positions.filter(p => p['actorId'] == id);
  results.transactions = transactions.filter(t => t['actorId'] == id);

  console.log(results);
})()
