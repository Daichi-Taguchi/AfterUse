/* eslint-disable no-console */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedData() {
  await db.collection('collectionPoints').add({
    name: 'Cihampelas Collection Point',
    address: 'Jl. Cihampelas No. 123',
    village: 'Cihampelas',
    coordinates: {
      latitude: -6.8937,
      longitude: 107.6077
    },
    qrCode: 'CP001',
    operatingHours: '08:00 - 17:00',
    contactPerson: 'Budi Santoso'
  });

  console.log('Seed data inserted successfully');
}

seedData().catch((error) => {
  console.error(error);
  process.exit(1);
});
