import { database } from './database';
import * as fs from 'fs';

async function databaseCreationTest() {
  const data = await database(__dirname + '/data');
  if (!data) throw new Error('Expected database client to exist');

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
  const newActors = await data.commit(
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

  const actorIds = Object.keys(newActors);
  if (actorIds.length != 3) {
    throw new Error('Expected actors to be created')
  }

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

  const results = data.find({
    actors: {
      where: (id, actor) => id == actorIds[0],
      limit: 1,
    },
    positions: {
      where: (id, position) => position.actorId == actorIds[0],
      limit: 1,
    },
    transactions: {
      where: (id, transaction) => transaction.actorId == actorIds[0],
      limit: 1,
    },
  })
}

module.exports.tests = [
  databaseCreationTest,
]