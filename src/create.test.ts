import { database } from './database';

async function databaseCreationTest() {
  const data = database(__dirname + '/data');
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
  );

  // Expect newly created tables to exist, and be empty
  ['actors', 'transactions', 'positions'].forEach(table => {
    const records = data.read(table);
    if (!records || records.length) {
      throw new Error(
        `Expected ${table} to be an empty object.
        Found ${JSON.stringify(records)} instead.`
      );
    }
  });

  // Try to mutate a table that doesn't exist
  try {
    const [nonExistentTableMutation, errors] = await data.commit(
      data.create('widgets', {
        fields: { sprockets: 65 }
      })
    );
    throw new Error('Should not allow mutation to non-existent tables');
  } catch (e) {
    if (e.message != 'The target table "widgets" does not exist') throw e;
  }

  // Populate actor
  const [newActors, newActorErrors] = await data.commit(
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

  // Expect exactly three actor records to exist
  const actorIds = Object.keys(newActors);
  if (actorIds.length != 3) {
    throw new Error(`
      Expected 3 records to be affected by creating new actor records.
      Instead found ${actorIds.length}
    `);
  }

  if (newActors[actorIds[0]].cash !== 6500.54) {
    throw new Error(`
      Expected the first actor's cash property to be 6500.54.
      Instead found ${newActors[actorIds[0]].cash}
    `);
  }

  // Populate transaction
  const [newTransactions, newTransactionErrors] = await data.commit(
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

  // Expect exactly three actor records to exist
  const transactionIds = Object.keys(newTransactions);
  if (transactionIds.length != 3) {
    throw new Error(`
      Expected 3 records to be affected by creating new transaction records.
      Instead found ${transactionIds.length}
    `);
  }

  if (newTransactions[transactionIds[0]].symbol !== "AAPL") {
    throw new Error(`
      Expected the first transaction's symbol property to be "AAPL".
      Instead found ${newTransactions[transactionIds[0]].symbol}
    `);
  }

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
    data.alter('actors', {
      id: actorIds[0],
      fields: {
        "cash": 3000,
      }
    }),
  );

  if (newActors[actorIds[0]].cash !== 6500.54) {
    throw new Error(`
      Expected an actor's cash property to be unchanged at 6500.54 after
      updating without re-reading. Instead found ${newActors[actorIds[0]].cash}
    `);
  }

  const updatedActor = data.read('actors')[actorIds[0]];
  if (updatedActor.cash !== 3000) {
    throw new Error(`
      Expected an actor's cash property to have changed to 3000 after
      updating and re-reading. Instead found ${updatedActor.cash}
    `);
  }

  // Delete Actor
  await data.commit(
    data.destroy('actors', {
      id: actorIds[2],
    }),
  );

  // Expect exactly two actor records to exist after deletion
  const actorsAfterDeletion = Object.keys(data.read('actors'));
  if (actorsAfterDeletion.length != 2) {
    throw new Error(`
      Expected 2 actor records to exist after deleting 1.
      Instead found ${actorIds.length}
    `);
  }

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
  });

  // data.find() should return an object, and each value should be an Array
  Object.values(results).forEach(records => {
    if (!Array.isArray(records)) {
      throw new Error(`
        Expected the results of data.find() to be an object with Arrays
        as values. Instead found ${JSON.stringify(records)}
      `);
    }
  });

  // Expect rebuilds to have the correct tables
  const dataRebuild = database(__dirname + '/data');
  if (!dataRebuild.read('actors')) {
    throw new Error('Expected actors table to exist after rebuild');
  }
}

module.exports.tests = [
  databaseCreationTest,
]