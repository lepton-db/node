import { database } from './database';

async function databaseCreationTest() {
  const data = database(__dirname + '/data');
  if (!data) throw new Error('Expected database client to exist');

  // Define Tables
  await data.define('actors', {
    referenceField: 'actorId'
  }),
  await data.define('transactions', {
    referenceField: 'transactionId'
  }),
  await data.define('positions', {
    referenceField: 'positionId'
  }),

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
    const [nonExistentTableMutation, errors] = await data.create(
      'widgets', 
      { fields: { sprockets: 65 } }
    )
    throw new Error('Should not allow mutation to non-existent tables');
  } catch (e) {
    if (e.message != 'The target table "widgets" does not exist') throw e;
  }

  // Populate actor
  const [actor1Effects, actor1Errors] = await data.create(
    'actors', {
    fields: {
      cash: 6500.54
    }
  });
  const [actor2Effects, actor2Errors] = await data.create(
    'actors', {
    fields: {
      cash: 1000
    }
  });
  const [actor3Effects, actor3Errors] = await data.create(
    'actors', {
    fields: {
      cash: 2400.78
    }
  });

  if (actor1Errors.length) {
    throw new Error(`
      Expected actor creation to produce no errors.
      Instead found ${actor1Errors}
    `);
  }
  if (actor2Errors.length) {
    throw new Error(`
      Expected actor creation to produce no errors.
      Instead found ${actor2Errors}
    `);
  }
  if (actor3Errors.length) {
    throw new Error(`
      Expected actor creation to produce no errors.
      Instead found ${actor3Errors}
    `);
  }

  if (Object.values(actor1Effects)[0].cash !== 6500.54) {
    throw new Error(`
      Expected the first actor's cash property to be 6500.54.
      Instead found ${Object.values(actor1Effects)[0].cash}
    `);
  }

  // Populate transaction
  const [transaction1Effects, transaction1Errors] = await data.create(
    'transactions', {
    fields: {
      actorId: Object.keys(actor1Effects)[0],
      timestamp: "2019-10-26T15:42:37.667Z",
      action: "buy",
      symbol: "AAPL",
      quantity: 4,
      price: 246.58
    }
  });
  const [transaction2Effects, transaction2Errors] = await data.create(
    'transactions', {
    fields: {
      actorId: Object.keys(actor1Effects)[0],
      timestamp: "2019-10-26T15:42:37.667Z",
      action: "buy",
      symbol: "MSFT",
      quantity: 7,
      price: 140.73
    }
  })
  const [transaction3Effects, transaction3Errors] = await data.create(
    'transactions', {
    fields: {
      actorId: Object.keys(actor1Effects)[0],
      timestamp: "2019-10-27T16:51:15.340Z",
      action: "buy",
      symbol: "TSLA",
      quantity: 2,
      price: 300.05
    }
  })

  if (transaction1Errors.length) {
    throw new Error(`
      Expected transaction creation to produce no errors.
      Instead found ${actor1Errors}
    `);
  }
  if (transaction2Errors.length) {
    throw new Error(`
      Expected transaction creation to produce no errors.
      Instead found ${actor2Errors}
    `);
  }
  if (transaction3Errors.length) {
    throw new Error(`
      Expected transaction creation to produce no errors.
      Instead found ${actor3Errors}
    `);
  }

  // Populate position
  await data.create('positions', {
    fields: {
      actorId: Object.keys(actor1Effects)[0],
      symbol: "MSFT",
      quantity: 7
    }
  })
  await data.create('positions', {
    fields: {
      actorId: Object.keys(actor1Effects)[0],
      symbol: "AAPL",
      quantity: 4
    }
  }),
  await data.create('positions', {
    fields: {
      actorId: Object.keys(actor2Effects)[0],
      symbol: "TSLA",
      quantity: 2
    }
  }),

  // Update Actor
  await data.alter('actors', {
    id: Object.keys(actor1Effects)[0],
    fields: {
      "cash": 3000,
    }
  })

  if (Object.values(actor1Effects)[0].cash !== 6500.54) {
    throw new Error(`
      Expected an actor's cash property to be unchanged at 6500.54 after
      updating without re-reading. Instead found 
      ${Object.values(actor1Effects)[0].cash}
    `);
  }

  const updatedActor = data.read('actors')[Object.keys(actor1Effects)[0]];
  if (updatedActor.cash !== 3000) {
    throw new Error(`
      Expected an actor's cash property to have changed to 3000 after
      updating and re-reading. Instead found ${updatedActor.cash}
    `);
  }

  // Delete Actor
  await data.destroy('actors', {
    id: Object.keys(actor2Effects)[0],
  })

  // Expect exactly two actor records to exist after deletion
  const actorsAfterDeletion = Object.keys(data.read('actors'));
  if (actorsAfterDeletion.length != 2) {
    throw new Error(`
      Expected 2 actor records to exist after deleting 1.
      Instead found ${actorsAfterDeletion.length}
    `);
  }

  const results = data.find({
    actors: {
      where: (id, actor) => id == Object.keys(actor1Effects)[0],
      limit: 1,
    },
    positions: {
      where: (id, position) => position.actorId == Object.keys(actor1Effects)[0],
      limit: 1,
    },
    transactions: {
      where: (id, transaction) => transaction.actorId == Object.keys(actor1Effects)[0],
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