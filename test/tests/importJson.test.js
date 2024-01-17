import Mongrowser from "mongrowser";
import { getSeeds } from "seed";

const database = new Mongrowser('mongrowser_test_database');
await database.import(getSeeds());