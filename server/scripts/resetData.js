import { initStorage, resetToSeed } from '../db/storage.js';

console.log('Resetting CampusOS database to initial seed data...');
initStorage();
const result = resetToSeed();
console.log(result.message);
process.exit(0);
