import { database } from './database';

(async () => {
  const data = await database(__dirname + '/data');
  // Define Tables
  await data.commit(
    data.define('actors'),
    data.define('positions'),
    data.define('transactions'),
  )
  // Populate Actors
  const createdActors = await data.commit(
    data.create('actors', {
      "cash": 6500.54
    }),
    data.create('actors', {
      "cash": 1000
    }),
    data.create('actors', {
      "cash": 2400.78
    }),
  );
  const actorIds = Object.keys(createdActors);

  // Populate Transactions
  const createdTransactions = await data.commit(
    data.create('transactions', {
      "actorId": actorIds[0],
      "timestamp": "2019-10-26T15:42:37.667Z",
      "action": "buy",
      "symbol": "AAPL",
      "quantity": 4,
      "price": 246.58
    }),
    data.create('transactions', {
      "actorId": actorIds[0],
      "timestamp": "2019-10-26T15:42:37.667Z",
      "action": "buy",
      "symbol": "MSFT",
      "quantity": 7,
      "price": 140.73
    }),
    data.create('transactions', {
      "actorId": actorIds[1],
      "timestamp": "2019-10-27T16:51:15.340Z",
      "action": "buy",
      "symbol": "TSLA",
      "quantity": 2,
      "price": 300.05
    }),
  );


  // Populate Positions
  await data.commit(
    data.create('positions', {
      "actorId": actorIds[0],
      "symbol": "MSFT",
      "quantity": 7
    }),
    data.create('positions', {
      "actorId": actorIds[0],
      "symbol": "AAPL",
      "quantity": 4
    }),
    data.create('positions', {
      "actorId": actorIds[1],
      "symbol": "TSLA",
      "quantity": 2
    }),
  )

  // Update Actor
  await data.commit(
    data.update('actors', {
      "id": actorIds[0],
      "cash": 3000,
    }),
  );
  // Delete Actor
  await data.commit(
    data.destroy('actors', {
      "id": actorIds[2],
    }),
  );

  const actor = data.id(actorIds[0]);
  
  const actors = data.read('actors');
  const positions = data.read('positions');
  const transaction = data.read('transactions');
  console.log({ actors, positions, transaction })
  console.log(actor);
})()