import { database } from './database';

(async () => {
  const data = await database(__dirname + '/data');
  // Define Tables
  await data.commit(
    data.define('actor', {
      referenceField: 'actorId'
    }),
    data.define('transaction', {
      referenceField: 'transactionId'
    }),
    data.define('position', {
      referenceField: 'positionId'
    }),
  )
  // Populate actor
  const createdactor = await data.commit(
    data.create('actor', {
      fields: {
        cash: 6500.54
      }
    }),
    data.create('actor', {
      fields: {
        cash: 1000
      }
    }),
    data.create('actor', {
      fields: {
        cash: 2400.78
      }
    }),
  );
  const actorIds = Object.keys(createdactor);

  // Populate transaction
  const createdtransaction = await data.commit(
    data.create('transaction', {
      fields: {
        actorId: actorIds[0],
        timestamp: "2019-10-26T15:42:37.667Z",
        action: "buy",
        symbol: "AAPL",
        quantity: 4,
        price: 246.58
      }
    }),
    data.create('transaction', {
      fields: {
        actorId: actorIds[0],
        timestamp: "2019-10-26T15:42:37.667Z",
        action: "buy",
        symbol: "MSFT",
        quantity: 7,
        price: 140.73
      }
    }),
    data.create('transaction', {
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
    data.create('position', {
      fields: {
        actorId: actorIds[0],
        symbol: "MSFT",
        quantity: 7
      }
    }),
    data.create('position', {
      fields: {
        actorId: actorIds[0],
        symbol: "AAPL",
        quantity: 4
      }
    }),
    data.create('position', {
      fields: {
        actorId: actorIds[1],
        symbol: "TSLA",
        quantity: 2
      }
    }),
  )

  // Update Actor
  await data.commit(
    data.update('actor', {
      id: actorIds[0],
      fields: {
        "cash": 3000,
      }
    }),
  );
  // Delete Actor
  await data.commit(
    data.destroy('actor', {
      id: actorIds[2],
    }),
  );

  const actorGraph = data.graph(actorIds[0]);
  
  const actors = data.read('actor');
  const positions = data.read('position');
  const transactions = data.read('transaction');
  // console.log({ actors, positions, transactions })
  console.log(actorGraph);
})()